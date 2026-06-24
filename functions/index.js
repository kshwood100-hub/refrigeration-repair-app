const { setGlobalOptions } = require('firebase-functions')
const { onRequest } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const crypto = require('crypto')

admin.initializeApp()

setGlobalOptions({ maxInstances: 10 })

const openaiApiKey = defineSecret('OPENAI_API_KEY')
const fastspringWebhookSecret = defineSecret('FASTSPRING_WEBHOOK_SECRET')
const fastspringApiUsername = defineSecret('FASTSPRING_API_USERNAME')
const fastspringApiPassword = defineSecret('FASTSPRING_API_PASSWORD')
const hiworksSmtpPass = defineSecret('HIWORKS_SMTP_PASS')
const cleanupSecret = defineSecret('CLEANUP_SECRET')

const ALLOWED_ORIGINS = new Set([
  'https://www.r-pro.app',
  'https://r-pro.app',
  'https://r-pro-6cb33.web.app',
  'https://r-pro-6cb33.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:4173',
])

const MAX_BASE64_BYTES = 10 * 1024 * 1024  // 10MB (이미지/일반 base64)
const MAX_AUDIO_BASE64_BYTES = 5 * 1024 * 1024  // 5MB (whisper 전용 — 5분 webm/opus 64kbps의 base64 ≈ 3.2MB, 안전 마진 포함)
const MAX_TEXT_LEN = 20000                  // transcript/job text

// 사용자별 일일 호출 한도 (UTC 자정 기준 리셋)
// 정상 사용량 대비 충분, 악용·자동 스크립트 차단 + 1인 비용 상한 통제.
// 2026-05-04 1차 재조정: 100/200 → 10/20
// 2026-05-04 2차 재조정: 헤비 사용자 정상 사용 여유 확보 — whisper 20 유지(비용 86% 차지) + 나머지 +10
const DAILY_LIMITS = {
  scanCard: 20,
  scanEquipment: 20,
  scanInvoice: 20,
  whisper: 20,
  classify: 30,
  classifyKnowhow: 30,
  quickDiag: 5,  // AI 통합 진단 (사진+텍스트 → 표준 폼 응답) — 학대·비용 통제
  notifyShareConsent: 10,  // 운영자 알림 메일 — SMTP 폭탄·메일함 도배 차단
}

// 트라이얼 사용자 카테고리별 호출 한도 (전체 트라이얼 기간 누적)
const TRIAL_LIMITS = {
  ai: 5,        // 전체 AI 엔드포인트 합산 (scan/whisper/classify/extract)
  jobs: 5,      // service_jobs 추가
  customers: 5, // customers 추가
  finance: 5,   // expenses + revenue 추가
  logs: 5,      // repair_logs / voice_recordings
}

const AI_ENDPOINTS = new Set([
  'scanCard', 'scanEquipment', 'scanInvoice', 'whisper',
  'classify', 'classifyKnowhow', 'quickDiag',
])

function applyCors(req, res) {
  const origin = req.get('origin') || ''
  if (ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.set('Access-Control-Max-Age', '3600')
  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return true
  }
  return false
}

async function verifyAuth(req, res) {
  const auth = req.get('authorization') || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  if (!m) {
    res.status(401).json({ error: 'Missing Authorization' })
    return null
  }
  try {
    const decoded = await admin.auth().verifyIdToken(m[1])
    if (!decoded.email || decoded.email_verified !== true) {
      res.status(403).json({ error: 'Email not verified' })
      return null
    }
    // 이메일 정규화 — webhook이 lowercase로 저장하므로 일관성 유지
    decoded.email = decoded.email.toLowerCase().trim()
    // allowed_users 화이트리스트 재확인
    const snap = await admin.firestore().collection('allowed_users').doc(decoded.email).get()
    if (!snap.exists) {
      res.status(403).json({ error: 'Access denied' })
      return null
    }
    // trial_until 시점이 미래면 trial 사용자
    const data = snap.data() || {}
    decoded._trial = !!(data.trial_until && data.trial_until > Date.now())
    return decoded
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' })
    return null
  }
}

// 운영자 본인 (kshwood100@gmail.com) = 모든 한도 무시 (개발·시험·운영용)
const OWNER_EMAIL = 'kshwood100@gmail.com'

// 트라이얼 사용자에 한해 카테고리별 누적 카운터 체크. 정식 가입자(trial_until 만료/없음)는 통과.
// Firestore: usage/{email}/trial/total — { ai: 0, jobs: 0, customers: 0, finance: 0, logs: 0 }
async function checkTrialQuota(decoded, category, res) {
  if (decoded.email === OWNER_EMAIL) return true  // 운영자 = 무제한
  if (!decoded._trial) return true  // 정식 가입자는 무제한
  const limit = TRIAL_LIMITS[category]
  if (!limit) return true

  const ref = admin.firestore().doc(`usage/${decoded.email}/trial/total`)
  try {
    const snap = await ref.get()
    const current = snap.exists ? (snap.data()[category] || 0) : 0
    if (current >= limit) {
      res.status(429).json({
        error: 'Trial limit reached',
        category,
        limit,
        message: 'Subscribe to remove all limits.',
      })
      return false
    }
    await ref.set(
      { [category]: admin.firestore.FieldValue.increment(1), updatedAt: Date.now() },
      { merge: true }
    )
    return true
  } catch (e) {
    console.error(`Trial quota check failed (allowing): ${decoded.email} ${category}`, e?.message)
    return true
  }
}

// 사용자별 일일 호출 카운터. Firestore usage/{email}/days/{YYYY-MM-DD} 사용.
// 한도 초과 시 429, 통과 시 카운터 +1 후 true.
// AI 엔드포인트면 트라이얼 ai 카테고리 카운터도 체크.
async function checkQuota(decodedOrEmail, endpoint, res) {
  const decoded = typeof decodedOrEmail === 'string' ? { email: decodedOrEmail } : decodedOrEmail
  const email = decoded.email

  // 운영자 본인 = 모든 한도 무시 (개발·시험·운영용)
  if (email === OWNER_EMAIL) return true

  // 트라이얼 사용자는 ai 카테고리 5회 cap 먼저 검사
  if (AI_ENDPOINTS.has(endpoint) && decoded._trial) {
    const ok = await checkTrialQuota(decoded, 'ai', res)
    if (!ok) return false
  }

  const limit = DAILY_LIMITS[endpoint]
  if (!limit) return true  // 한도 정의 없으면 통과

  const today = new Date().toISOString().slice(0, 10)  // YYYY-MM-DD UTC
  const ref = admin.firestore().doc(`usage/${email}/days/${today}`)

  try {
    const snap = await ref.get()
    const current = snap.exists ? (snap.data()[endpoint] || 0) : 0
    if (current >= limit) {
      console.warn(`Quota exceeded: ${email} ${endpoint} ${current}/${limit}`)
      res.status(429).json({
        error: 'Daily limit reached',
        endpoint,
        limit,
        resetAt: 'next UTC midnight',
      })
      return false
    }
    await ref.set(
      { [endpoint]: admin.firestore.FieldValue.increment(1), updatedAt: Date.now() },
      { merge: true }
    )
    return true
  } catch (e) {
    // Firestore 장애 시 통과시킴 (가용성 우선, 비용 안전망은 max_tokens·payload size로 이미 있음)
    console.error(`Quota check failed (allowing): ${email} ${endpoint}`, e?.message)
    return true
  }
}

function checkBase64(base64, res) {
  if (!base64 || typeof base64 !== 'string') {
    res.status(400).json({ error: 'base64 missing' })
    return false
  }
  if (base64.length > MAX_BASE64_BYTES) {
    res.status(413).json({ error: 'Payload too large' })
    return false
  }
  return true
}

function checkText(text, res, fieldName = 'text') {
  if (typeof text !== 'string') {
    res.status(400).json({ error: `${fieldName} missing` })
    return false
  }
  if (text.length > MAX_TEXT_LEN) {
    res.status(413).json({ error: `${fieldName} too long` })
    return false
  }
  return true
}

const fnOpts = (extra = {}) => ({
  secrets: [openaiApiKey],
  cors: false,
  invoker: 'public',
  ...extra,
})

exports.scanCard = onRequest(fnOpts({ timeoutSeconds: 120 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (!(await checkQuota(decoded, 'scanCard', res))) return

  const { base64, mediaType } = req.body || {}
  if (!checkBase64(base64, res)) return
  const apiKey = openaiApiKey.value()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  const dataUrl = `data:${mediaType || 'image/jpeg'};base64,${base64}`
  const promptText = 'This image is EITHER a business card OR a receipt/invoice/transaction statement (e.g. a simple receipt that contains both the seller info and the purchased items). Extract everything and return JSON only.\nFormat: {"name":"","company":"","title":"","phone":"","mobile":"","email":"","address":"","memo":"","date":"","items":[{"name":"","qty":"","price":""}],"subtotal":"","tax":"","total":""}\n- name/company/title/phone/mobile/email/address: the supplier (seller/shop) contact info shown on the card or receipt header. company = business or shop name.\n- If the image is a receipt/invoice that lists purchased goods, also fill: date (transaction date YYYY-MM-DD), items (one entry per line: name = item name + spec, qty = quantity + unit, price = that line total amount, digits only), subtotal / tax / total (digits only, no comma or currency symbol).\n- If it is just a business card with no transaction, leave date empty, items as [], and subtotal/tax/total empty.\n- Use empty string for any missing field. For phone numbers include the country code if shown.'

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
    }
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

exports.classifyKnowhow = onRequest(fnOpts(), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (!(await checkQuota(decoded, 'classifyKnowhow', res))) return

  const { transcript } = req.body || {}
  if (!checkText(transcript, res, 'transcript')) return
  const apiKey = openaiApiKey.value()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  const promptText = `냉동기 수리 노하우를 아래 형식 JSON으로 정리해줘. JSON만 반환.\n\n"${transcript}"\n\n{"title":"한줄 제목","category":"압축기/냉매/전기/팬/착상/결로/소음/기타 중 하나","location":"압축기/응축기/증발기/전기패널/배관·냉매/팬·모터/컨트롤러/기타 중 하나","symptoms":"증상 키워드들 (콤마로 구분)","cause":"원인 설명","checkSteps":"1. 점검 순서\\n2. 다음 단계\\n3. ...","solution":"해결 방법","parts":"교체 부품 (없으면 빈값)","notes":"추가 메모 (없으면 빈값)"}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
    }
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

exports.classify = onRequest(fnOpts({ timeoutSeconds: 60 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (!(await checkQuota(decoded, 'classify', res))) return

  const { transcript } = req.body || {}
  if (!checkText(transcript, res, 'transcript')) return
  const apiKey = openaiApiKey.value()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  const promptText = `냉동기 수리 현장에서 기사가 말한 내용이야. 아래 항목으로 분류해서 JSON만 반환해. 설명 없이 JSON만.\n\n"${transcript}"\n\n형식:\n{"symptom":"증상(고객설명)","diagnosis":"진단결과","materials":"자재목록(줄바꿈으로 구분)","workDone":"수리내용","notes":"기타사항"}\n\n해당 내용이 없으면 빈 문자열로.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: promptText }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
    }
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

exports.whisper = onRequest(fnOpts({ timeoutSeconds: 300, memory: '512MiB' }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (!(await checkQuota(decoded, 'whisper', res))) return

  const apiKey = openaiApiKey.value()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  const { base64, mimeType, language } = req.body || {}
  if (!checkBase64(base64, res)) return
  // whisper 전용 5MB cap (5분 cap 클라 우회 시 비용 폭발 방지)
  if (base64.length > MAX_AUDIO_BASE64_BYTES) {
    return res.status(413).json({ error: 'Audio too large (max 5MB)' })
  }

  try {
    const buffer = Buffer.from(base64, 'base64')
    const ext = mimeType?.includes('mp4') ? 'm4a' : mimeType?.includes('ogg') ? 'ogg' : 'webm'
    const blob = new Blob([buffer], { type: mimeType || 'audio/webm' })

    const form = new FormData()
    form.append('file', blob, `audio.${ext}`)
    form.append('model', 'whisper-1')
    if (language) form.append('language', language)
    form.append('response_format', 'json')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err?.error?.message ?? `Whisper API ${response.status}` })
    }
    const data = await response.json()
    res.status(200).json({ text: data.text ?? '' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

exports.scanEquipment = onRequest(fnOpts({ timeoutSeconds: 120 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (!(await checkQuota(decoded, 'scanEquipment', res))) return

  const apiKey = openaiApiKey.value()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  const { base64, mediaType, lang } = req.body || {}
  if (!checkBase64(base64, res)) return

  const language = lang || 'ko'
  const dataUrl = `data:${mediaType || 'image/jpeg'};base64,${base64}`

  const promptText = `You are an expert HVAC/refrigeration technician. Analyze this equipment photo.

Return JSON only (no other text), in this exact format:
{
  "kind": "equipment category (compressor/condenser/evaporator/chiller/freezer/AHU/pump/motor/control_panel/piping/other)",
  "brand": "brand name if visible, else empty string",
  "model": "model number if visible on nameplate, else empty string",
  "serial": "serial number if visible on nameplate, else empty string",
  "capacity": "capacity (HP/kW/RT/BTU) if determinable, else empty string",
  "tempClass": "low_temp or medium_temp or high_temp or unknown (for 10HP+ units, classify carefully by condenser type, fans, insulation)",
  "stage": "single or two_stage or unknown",
  "refrigerant": "refrigerant type if visible or inferable (R-22/R-134a/R-404A/R-410A/R-290/R-717/other), else empty string",
  "notes": "2-3 sentence summary for a beginner technician in ${language === 'ko' ? 'Korean' : language === 'ja' ? 'Japanese' : language === 'zh' ? 'Chinese' : language === 'es' ? 'Spanish' : language === 'hi' ? 'Hindi' : 'English'}, explaining what this equipment is and key points to check",
  "confidence": "high or medium or low"
}

Be precise. If you can't determine a field, use empty string, do NOT guess wildly. For tempClass especially, beginners depend on this — only classify with confidence.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }],
        response_format: { type: 'json_object' },
        max_tokens: 600,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
    }
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ============================================================
// quickDiag — AI 통합 진단 (사진 + 텍스트 → 표준 폼 응답)
// 진단 영역 격리: 거래처·AS·회계 등 다른 영역과 데이터 흐름 없음
// 표준 폼 prompt 자동 추가 (사용자 모름) → AI 응답 일관성 확보
// ============================================================
const STANDARD_FORM_PROMPT = {
  ko: `당신은 냉동 공조 분야의 베테랑 기사입니다 (현장 20년 경력). 사용자가 보낸 사진과 증상을 분석해 아래 형식 그대로만 답하세요. 형식 외 응답 금지.

[핵심 규칙]
1. [참고 데이터] 영역에 우리 시스템의 유사 사례가 있으면 그 데이터를 최우선 활용. 일반 지식만으로 답변 금지.
2. 각 항목은 구체적·풍부하게 작성. 단순 "확인 필요"만 단독으로 적지 말고, 참고 데이터·사용자 증상에서 추론해 채울 것.
3. [가능 원인] = 최소 3~5개, 가능성 높은 순. 각 원인을 한 줄로 명확히.
4. [점검 순서] = 최소 3~5단계. 구체적 측정값·방법·기준 포함 (예: "전·후단 ΔT 측정, 3°C 이상 = 막힘").
5. [해결 방법] = 즉시 조치 / 부품 교체 / 점검 도구 / 안전 주의 4가지 모두 채우기.
6. [예상] = 작업 시간·부품 비용·작업 비용 = 일반적 범위라도 추정 작성 (예: "1~3시간", "5~20만원").
7. [참고] = 참고 데이터 사례 인용 + 추가 검토 항목.
8. 사용자 단어가 짧으면 냉동 공조 전문 용어로 해석. 예: "드라이어" = 필터 드라이어 (액관 수분·이물 흡착) / "컴프" = 압축기 / "에바" = 증발기. 일반 가전 해석 금지.
9. 사진이 있으면 장비 종류·브랜드·모델·시리얼·냉매·용량을 최대한 판독해 채우기.

[장비 정보]
- 종류:
- 브랜드:
- 모델:
- 시리얼:
- 냉매:
- 용량:
- 온도 범위:
- 압축 단수:

[증상]
- 주 증상:
- 부 증상:
- 발생 시점·빈도:
- 작동 상태:
- 측정값:

[가능 원인 (가능성 순)]
1.
2.
3.
4.
5.

[점검 순서]
1.
2.
3.
4.
5.

[해결 방법]
- 즉시 조치:
- 부품 교체:
- 점검 도구:
- 안전 주의:

[예상]
- 작업 시간:
- 부품 비용:
- 작업 비용:

[참고]
- 관련 케이스:
- 추가 검토:`,
  en: `You are a veteran HVAC/refrigeration technician (20+ years field experience). Analyze the user's photo and symptoms and respond ONLY in the format below. Do not add anything outside the format.

[Core Rules]
1. If the [Reference Data] section contains similar cases from our system, prioritize that data. Do not answer from general knowledge alone.
2. Each section must be specific and detailed. Do not just write "Verify needed" — infer from reference data and user symptoms whenever possible.
3. [Possible Causes] = at least 3~5, ordered by likelihood. One clear line each.
4. [Inspection Steps] = at least 3~5 steps. Include concrete measurements/methods/thresholds (e.g., "Measure inlet/outlet ΔT, ≥ 3°C = clogged").
5. [Solution] = fill all 4: Immediate action / Parts to replace / Tools required / Safety warnings.
6. [Estimated] = give realistic ranges (e.g., "1~3 hours", "$50~200 parts").
7. [References] = cite reference data cases + additional checks.
8. Interpret short user words as HVAC/refrigeration technical terms. E.g., "drier" = filter-drier (liquid-line moisture/debris adsorption), "comp" = compressor. Do NOT interpret as household appliances.
9. If photo present, extract type/brand/model/serial/refrigerant/capacity from nameplate as much as possible.

[Equipment Info]
- Type:
- Brand:
- Model:
- Serial:
- Refrigerant:
- Capacity:
- Temperature Range:
- Compression Stage:

[Symptoms]
- Main symptom:
- Secondary symptom:
- Onset / frequency:
- Operating state:
- Measurements:

[Possible Causes (by likelihood)]
1.
2.
3.
4.
5.

[Inspection Steps]
1.
2.
3.
4.
5.

[Solution]
- Immediate action:
- Parts to replace:
- Tools required:
- Safety warnings:

[Estimated]
- Work time:
- Parts cost:
- Labor cost:

[References]
- Related cases:
- Additional checks:`,
  zh: `你是资深的制冷空调技师 (20年以上现场经验)。请分析用户发送的照片和症状,严格按照下面格式回答。不要添加格式外的内容。

[核心规则]
1. 如果[参考数据]部分有我们系统的相似案例,请优先使用该数据回答。不要只用通用知识。
2. 每个项目都要具体且丰富。不要只写"需确认",应从参考数据和用户症状中推断填写。
3. [可能原因] = 至少3~5个,按可能性高低排序。每个原因一行清晰说明。
4. [检查步骤] = 至少3~5步。包含具体测量值·方法·标准 (例: "测量前后端ΔT,≥3°C = 堵塞")。
5. [解决方法] = 即时处理 / 更换零件 / 所需工具 / 安全注意 四项全部填写。
6. [预估] = 给出实际范围 (例: "1~3小时", "零件费 300~1500元")。
7. [参考] = 引用参考数据案例 + 追加检查项目。
8. 用户简短词汇按制冷空调专业术语解释。例: "干燥器" = 过滤干燥器 (液管水分·杂质吸附), "压机" = 压缩机, "蒸发器" = 蒸发器。不要解释为家用电器。
9. 如有照片,尽可能从铭牌读取类型·品牌·型号·序列号·制冷剂·容量。

[设备信息]
- 类型:
- 品牌:
- 型号:
- 序列号:
- 制冷剂:
- 容量:
- 温度范围:
- 压缩级数:

[症状]
- 主要症状:
- 次要症状:
- 出现时间·频率:
- 运行状态:
- 测量值:

[可能原因 (按可能性排序)]
1.
2.
3.
4.
5.

[检查步骤]
1.
2.
3.
4.
5.

[解决方法]
- 即时处理:
- 更换零件:
- 所需工具:
- 安全注意:

[预估]
- 作业时间:
- 零件费用:
- 工时费用:

[参考]
- 相关案例:
- 追加检查:`,
  ja: `あなたは冷凍空調分野のベテラン技師です (現場20年以上の経験)。ユーザーから送られた写真と症状を分析し、下記の形式のみで答えてください。形式外の応答は禁止。

[コアルール]
1. [参考データ]欄に当システムの類似事例があれば、そのデータを最優先に活用。一般知識のみでの回答は禁止。
2. 各項目は具体的・豊富に記述。単に「確認必要」だけ書かず、参考データ・ユーザー症状から推測して埋めること。
3. [可能性のある原因] = 最低3~5個、可能性順。各原因を1行で明確に。
4. [点検手順] = 最低3~5ステップ。具体的な測定値・方法・基準を含む (例: 「前後端ΔT測定、3°C以上=詰まり」)。
5. [解決方法] = 即時対応 / 交換部品 / 点検工具 / 安全注意 4項目すべて記入。
6. [見積もり] = 一般的な範囲でも推定記入 (例: 「1~3時間」、「部品費 5,000~30,000円」)。
7. [参考] = 参考データ事例引用 + 追加確認項目。
8. ユーザーの短い単語は冷凍空調の専門用語として解釈。例: 「ドライヤー」=フィルタドライヤ (液管の水分・異物吸着) / 「コンプ」=圧縮機。家電として解釈禁止。
9. 写真があれば、銘板から種類・ブランド・モデル・シリアル・冷媒・容量を可能な限り読み取る。

[機器情報]
- 種類:
- ブランド:
- モデル:
- シリアル:
- 冷媒:
- 容量:
- 温度範囲:
- 圧縮段数:

[症状]
- 主症状:
- 副症状:
- 発生時期・頻度:
- 動作状態:
- 測定値:

[可能性のある原因 (可能性順)]
1.
2.
3.
4.
5.

[点検手順]
1.
2.
3.
4.
5.

[解決方法]
- 即時対応:
- 交換部品:
- 点検工具:
- 安全注意:

[見積もり]
- 作業時間:
- 部品費用:
- 作業費用:

[参考]
- 関連ケース:
- 追加確認:`,
  es: `Eres un técnico veterano en HVAC/refrigeración (20+ años de experiencia en campo). Analiza la foto y los síntomas del usuario y responde SOLO en el formato a continuación. No añadas nada fuera del formato.

[Reglas Principales]
1. Si la sección [Datos de Referencia] contiene casos similares de nuestro sistema, prioriza esos datos. No respondas solo desde conocimiento general.
2. Cada sección debe ser específica y detallada. No solo escribas "Verificar" — infiere de los datos de referencia y los síntomas del usuario siempre que sea posible.
3. [Posibles Causas] = al menos 3~5, ordenadas por probabilidad. Una línea clara cada una.
4. [Pasos de Inspección] = al menos 3~5 pasos. Incluye mediciones/métodos/umbrales concretos (ej. "Medir ΔT entrada/salida, ≥ 3°C = obstruido").
5. [Solución] = completa los 4: Acción inmediata / Piezas / Herramientas / Advertencias.
6. [Estimado] = da rangos realistas (ej. "1~3 horas", "Piezas $50~200 USD").
7. [Referencias] = cita casos de datos de referencia + verificaciones adicionales.
8. Interpreta palabras cortas del usuario como términos técnicos HVAC/refrigeración. Ej: "secador" = filtro deshidratador (línea líquida, absorbe humedad/partículas), "compre" = compresor. NO interpretar como electrodomésticos.
9. Si hay foto, extrae tipo/marca/modelo/serie/refrigerante/capacidad de la placa lo más posible.

[Información del Equipo]
- Tipo:
- Marca:
- Modelo:
- Número de serie:
- Refrigerante:
- Capacidad:
- Rango de temperatura:
- Etapa de compresión:

[Síntomas]
- Síntoma principal:
- Síntoma secundario:
- Aparición / frecuencia:
- Estado operativo:
- Mediciones:

[Posibles Causas (por probabilidad)]
1.
2.
3.
4.
5.

[Pasos de Inspección]
1.
2.
3.
4.
5.

[Solución]
- Acción inmediata:
- Piezas a reemplazar:
- Herramientas:
- Advertencias de seguridad:

[Estimado]
- Tiempo de trabajo:
- Costo de piezas:
- Costo de mano de obra:

[Referencias]
- Casos relacionados:
- Verificaciones adicionales:`,
  hi: `आप एक अनुभवी HVAC/प्रशीतन तकनीशियन हैं (20+ वर्ष फील्ड अनुभव)। उपयोगकर्ता द्वारा भेजी गई फोटो और लक्षणों का विश्लेषण करें और नीचे दिए गए प्रारूप में ही उत्तर दें। प्रारूप के बाहर कुछ भी न जोड़ें।

[मुख्य नियम]
1. यदि [संदर्भ डेटा] अनुभाग में हमारे सिस्टम के समान मामले हैं, उस डेटा को प्राथमिकता दें। केवल सामान्य ज्ञान से उत्तर न दें।
2. प्रत्येक खंड विशिष्ट और विस्तृत होना चाहिए। केवल "सत्यापन आवश्यक" न लिखें — संदर्भ डेटा और उपयोगकर्ता लक्षणों से अनुमान लगाएं।
3. [संभावित कारण] = कम से कम 3~5, संभावना के क्रम में। प्रत्येक कारण एक स्पष्ट पंक्ति।
4. [निरीक्षण चरण] = कम से कम 3~5 चरण। ठोस माप/विधि/मानदंड शामिल करें (उदा. "इनलेट/आउटलेट ΔT मापें, ≥ 3°C = अवरुद्ध")।
5. [समाधान] = सभी 4 भरें: तत्काल कार्रवाई / पुर्जे / उपकरण / सुरक्षा चेतावनी।
6. [अनुमान] = वास्तविक श्रेणी दें (उदा. "1~3 घंटे", "पुर्जे ₹500~5000")।
7. [संदर्भ] = संदर्भ डेटा मामले उद्धृत करें + अतिरिक्त जांच।
8. उपयोगकर्ता के छोटे शब्दों को HVAC/प्रशीतन तकनीकी शब्दों के रूप में व्याख्या करें। उदा: "ड्रायर" = फ़िल्टर ड्रायर (लिक्विड लाइन नमी/मलबा अधिशोषण), "कंप्र" = कंप्रेसर। घरेलू उपकरण के रूप में व्याख्या न करें।
9. फोटो हो तो नेमप्लेट से प्रकार/ब्रांड/मॉडल/सीरियल/रेफ्रिजरेंट/क्षमता यथासंभव पढ़ें।

[उपकरण जानकारी]
- प्रकार:
- ब्रांड:
- मॉडल:
- सीरियल:
- रेफ्रिजरेंट:
- क्षमता:
- तापमान सीमा:
- संपीड़न चरण:

[लक्षण]
- मुख्य लक्षण:
- द्वितीयक लक्षण:
- आरंभ / आवृत्ति:
- संचालन स्थिति:
- माप मान:

[संभावित कारण (संभावना के क्रम में)]
1.
2.
3.
4.
5.

[निरीक्षण चरण]
1.
2.
3.
4.
5.

[समाधान]
- तत्काल कार्रवाई:
- बदलने योग्य पुर्जे:
- उपकरण:
- सुरक्षा चेतावनी:

[अनुमान]
- कार्य समय:
- पुर्ज़ों की लागत:
- श्रम लागत:

[संदर्भ]
- संबंधित मामले:
- अतिरिक्त जांच:`,
  vi: `Bạn là kỹ thuật viên dày dạn về HVAC/lạnh (20+ năm kinh nghiệm thực tế). Phân tích ảnh và triệu chứng người dùng và CHỈ trả lời theo định dạng bên dưới. Không thêm gì ngoài định dạng.

[Quy tắc chính]
1. Nếu phần [Dữ liệu tham khảo] có các trường hợp tương tự từ hệ thống của chúng tôi, ưu tiên sử dụng dữ liệu đó. Không trả lời chỉ từ kiến thức chung.
2. Mỗi mục phải cụ thể và chi tiết. Đừng chỉ viết "Cần xác minh" — suy luận từ dữ liệu tham khảo và triệu chứng của người dùng khi có thể.
3. [Nguyên nhân khả thi] = ít nhất 3~5, theo thứ tự khả năng. Mỗi nguyên nhân một dòng rõ ràng.
4. [Các bước Kiểm tra] = ít nhất 3~5 bước. Bao gồm số đo/phương pháp/ngưỡng cụ thể (ví dụ: "Đo ΔT đầu vào/đầu ra, ≥ 3°C = tắc").
5. [Giải pháp] = điền cả 4: Hành động tức thời / Linh kiện / Dụng cụ / Cảnh báo an toàn.
6. [Ước tính] = đưa ra phạm vi thực tế (ví dụ: "1~3 giờ", "Linh kiện 500.000~2.000.000 VND").
7. [Tham khảo] = trích dẫn trường hợp dữ liệu tham khảo + kiểm tra bổ sung.
8. Diễn giải các từ ngắn của người dùng theo thuật ngữ kỹ thuật HVAC/lạnh. Ví dụ: "phin sấy" = phin lọc khô (đường lỏng, hấp thụ ẩm/cặn), "máy nén" = máy nén. KHÔNG diễn giải như thiết bị gia dụng.
9. Nếu có ảnh, đọc loại/hãng/model/seri/môi chất/công suất từ nhãn càng nhiều càng tốt.

[Thông tin Thiết bị]
- Loại:
- Hãng:
- Model:
- Số seri:
- Môi chất lạnh:
- Công suất:
- Dải nhiệt độ:
- Cấp nén:

[Triệu chứng]
- Triệu chứng chính:
- Triệu chứng phụ:
- Thời điểm / tần suất:
- Trạng thái vận hành:
- Số đo:

[Nguyên nhân khả thi (theo khả năng)]
1.
2.
3.
4.
5.

[Các bước Kiểm tra]
1.
2.
3.
4.
5.

[Giải pháp]
- Hành động tức thời:
- Linh kiện cần thay:
- Dụng cụ:
- Cảnh báo an toàn:

[Ước tính]
- Thời gian làm việc:
- Chi phí linh kiện:
- Chi phí nhân công:

[Tham khảo]
- Trường hợp liên quan:
- Kiểm tra bổ sung:`,
  th: `คุณเป็นช่างเทคนิค HVAC/ทำความเย็นมากประสบการณ์ (มากกว่า 20 ปีในสนาม) วิเคราะห์ภาพและอาการที่ผู้ใช้ส่งมาและตอบในรูปแบบด้านล่างเท่านั้น ห้ามเพิ่มเนื้อหานอกรูปแบบ

[กฎหลัก]
1. หากส่วน [ข้อมูลอ้างอิง] มีกรณีที่คล้ายกันจากระบบของเรา ให้ใช้ข้อมูลนั้นเป็นอันดับแรก ห้ามตอบจากความรู้ทั่วไปเพียงอย่างเดียว
2. แต่ละส่วนต้องเฉพาะเจาะจงและละเอียด อย่าเขียนเพียง "ต้องตรวจสอบ" — อนุมานจากข้อมูลอ้างอิงและอาการของผู้ใช้เมื่อเป็นไปได้
3. [สาเหตุที่เป็นไปได้] = อย่างน้อย 3~5 รายการ เรียงตามความเป็นไปได้ แต่ละสาเหตุหนึ่งบรรทัดชัดเจน
4. [ขั้นตอนการตรวจสอบ] = อย่างน้อย 3~5 ขั้นตอน รวมการวัด/วิธี/เกณฑ์ที่เป็นรูปธรรม (เช่น "วัด ΔT ทางเข้า/ทางออก, ≥ 3°C = อุดตัน")
5. [วิธีแก้ไข] = กรอกทั้ง 4: ดำเนินการทันที / ชิ้นส่วน / เครื่องมือ / คำเตือน
6. [ประมาณการ] = ให้ช่วงที่เป็นจริง (เช่น "1~3 ชั่วโมง", "ชิ้นส่วน 500~5,000 บาท")
7. [อ้างอิง] = อ้างกรณีจากข้อมูลอ้างอิง + การตรวจสอบเพิ่มเติม
8. ตีความคำสั้นของผู้ใช้เป็นศัพท์เทคนิค HVAC/ทำความเย็น เช่น "ดรายเออร์" = ฟิลเตอร์ดรายเออร์ (ท่อของเหลว ดูดซับความชื้น/เศษ), "คอมเพรสเซอร์" = คอมเพรสเซอร์ อย่าตีความเป็นเครื่องใช้ในบ้าน
9. หากมีภาพ อ่านประเภท/แบรนด์/รุ่น/ซีเรียล/สารทำความเย็น/ความจุจากป้ายชื่อให้มากที่สุด

[ข้อมูลอุปกรณ์]
- ประเภท:
- แบรนด์:
- รุ่น:
- หมายเลขซีเรียล:
- สารทำความเย็น:
- ความจุ:
- ช่วงอุณหภูมิ:
- ขั้นการอัด:

[อาการ]
- อาการหลัก:
- อาการรอง:
- เวลาที่เกิด / ความถี่:
- สถานะการทำงาน:
- ค่าที่วัดได้:

[สาเหตุที่เป็นไปได้ (เรียงตามความเป็นไปได้)]
1.
2.
3.
4.
5.

[ขั้นตอนการตรวจสอบ]
1.
2.
3.
4.
5.

[วิธีแก้ไข]
- การดำเนินการทันที:
- ชิ้นส่วนที่ต้องเปลี่ยน:
- เครื่องมือ:
- คำเตือนความปลอดภัย:

[ประมาณการ]
- เวลาทำงาน:
- ค่าชิ้นส่วน:
- ค่าแรง:

[อ้างอิง]
- กรณีที่เกี่ยวข้อง:
- การตรวจสอบเพิ่มเติม:`,
  id: `Anda adalah teknisi HVAC/pendingin berpengalaman (20+ tahun pengalaman lapangan). Analisis foto dan gejala pengguna dan jawab HANYA dalam format di bawah. Jangan tambahkan apa pun di luar format.

[Aturan Utama]
1. Jika bagian [Data Referensi] berisi kasus serupa dari sistem kami, prioritaskan data tersebut. Jangan menjawab hanya dari pengetahuan umum.
2. Setiap bagian harus spesifik dan rinci. Jangan hanya tulis "Perlu verifikasi" — simpulkan dari data referensi dan gejala pengguna jika memungkinkan.
3. [Kemungkinan Penyebab] = setidaknya 3~5, urutan kemungkinan. Satu baris jelas per penyebab.
4. [Langkah Pemeriksaan] = setidaknya 3~5 langkah. Sertakan pengukuran/metode/ambang konkret (mis. "Ukur ΔT masuk/keluar, ≥ 3°C = tersumbat").
5. [Solusi] = isi keempat: Tindakan segera / Suku cadang / Peralatan / Peringatan.
6. [Perkiraan] = berikan rentang realistis (mis. "1~3 jam", "Suku cadang Rp 500.000~3.000.000").
7. [Referensi] = kutip kasus data referensi + pemeriksaan tambahan.
8. Tafsirkan kata pendek pengguna sebagai istilah teknis HVAC/pendingin. Mis: "drier" = filter drier (saluran cair, menyerap kelembapan/partikel), "kompresor" = kompresor. JANGAN tafsirkan sebagai peralatan rumah tangga.
9. Jika ada foto, baca jenis/merek/model/serial/refrigeran/kapasitas dari pelat nama sebanyak mungkin.

[Informasi Peralatan]
- Jenis:
- Merek:
- Model:
- Nomor seri:
- Refrigeran:
- Kapasitas:
- Rentang suhu:
- Tahap kompresi:

[Gejala]
- Gejala utama:
- Gejala sekunder:
- Awal / frekuensi:
- Status operasi:
- Pengukuran:

[Kemungkinan Penyebab (urutan kemungkinan)]
1.
2.
3.
4.
5.

[Langkah Pemeriksaan]
1.
2.
3.
4.
5.

[Solusi]
- Tindakan segera:
- Suku cadang diganti:
- Peralatan:
- Peringatan keselamatan:

[Perkiraan]
- Waktu kerja:
- Biaya suku cadang:
- Biaya tenaga kerja:

[Referensi]
- Kasus terkait:
- Pemeriksaan tambahan:`,
  ar: `أنت فني تبريد وتكييف متمرس (أكثر من 20 عاماً من الخبرة الميدانية). حلل الصورة والأعراض المرسلة من المستخدم وأجب فقط بالتنسيق أدناه. لا تضف أي شيء خارج التنسيق.

[القواعد الأساسية]
1. إذا احتوى قسم [بيانات المرجع] على حالات مشابهة من نظامنا، فأعطِ الأولوية لتلك البيانات. لا تجب من المعرفة العامة وحدها.
2. كل قسم يجب أن يكون محدداً وتفصيلياً. لا تكتب فقط "يحتاج تحقق" — استنتج من بيانات المرجع وأعراض المستخدم متى أمكن.
3. [الأسباب المحتملة] = 3~5 على الأقل، مرتبة حسب الاحتمالية. سطر واضح لكل سبب.
4. [خطوات الفحص] = 3~5 خطوات على الأقل. تتضمن قياسات/طرق/عتبات محددة (مثال: "قس ΔT المدخل/المخرج، ≥ 3°C = انسداد").
5. [الحل] = املأ الأربعة: إجراء فوري / قطع غيار / أدوات / تحذيرات أمان.
6. [التقدير] = أعطِ نطاقات واقعية (مثال: "1~3 ساعات"، "قطع غيار 100~500 ريال").
7. [المراجع] = اقتبس حالات بيانات المرجع + فحوصات إضافية.
8. فسّر كلمات المستخدم القصيرة كمصطلحات فنية للتبريد والتكييف. مثل: "مجفف" = مجفف الفلتر (خط السائل، يمتص الرطوبة/الشوائب)، "ضاغط" = ضاغط. لا تفسر كأجهزة منزلية.
9. إذا كانت هناك صورة، اقرأ النوع/العلامة/الموديل/الرقم التسلسلي/غاز التبريد/السعة من لوحة الاسم قدر الإمكان.

[معلومات المعدة]
- النوع:
- العلامة التجارية:
- الموديل:
- الرقم التسلسلي:
- غاز التبريد:
- السعة:
- نطاق الحرارة:
- مرحلة الضغط:

[الأعراض]
- العَرَض الرئيسي:
- العَرَض الثانوي:
- وقت الظهور / التكرار:
- حالة التشغيل:
- القياسات:

[الأسباب المحتملة (حسب الاحتمالية)]
1.
2.
3.
4.
5.

[خطوات الفحص]
1.
2.
3.
4.
5.

[الحل]
- الإجراء الفوري:
- قطع الغيار:
- الأدوات:
- تحذيرات السلامة:

[التقدير]
- وقت العمل:
- تكلفة القطع:
- تكلفة العمالة:

[المراجع]
- حالات ذات صلة:
- فحوصات إضافية:`,
}

// RAG 참고 데이터 wrap 라벨 — 10개 언어 (사용자 언어와 system prompt 언어 일치 보장)
// 결함: 5/16~5/17 한국어 wrap 텍스트만 박혀서 비한국어 사용자 진단 시 모델 응답에 한국어 섞일 가능성 → 5/17 정정
const RAG_WRAP_LABELS = {
  ko: { start: '[참고 데이터 — 우리 시스템의 유사 사례들. 이 데이터를 최우선으로 활용해 답변하세요. 데이터 외 일반 지식 답변 금지]', end: '[참고 데이터 끝]' },
  en: { start: '[Reference Data — similar cases from our system. Use this as the PRIMARY source. Do NOT answer from general knowledge alone.]', end: '[End of Reference Data]' },
  zh: { start: '[参考数据 — 我们系统中的类似案例。请将此数据作为主要来源。不要仅凭一般知识回答。]', end: '[参考数据结束]' },
  ja: { start: '[参考データ — 当システムの類似事例。このデータを最優先に活用してください。一般知識のみでの回答は禁止。]', end: '[参考データの終わり]' },
  es: { start: '[Datos de Referencia — casos similares de nuestro sistema. Use esto como fuente PRINCIPAL. NO responda solo con conocimiento general.]', end: '[Fin de los Datos de Referencia]' },
  hi: { start: '[संदर्भ डेटा — हमारे सिस्टम से समान मामले। इस डेटा को मुख्य स्रोत के रूप में उपयोग करें। केवल सामान्य ज्ञान से उत्तर न दें।]', end: '[संदर्भ डेटा समाप्त]' },
  vi: { start: '[Dữ Liệu Tham Khảo — các trường hợp tương tự từ hệ thống của chúng tôi. Sử dụng làm nguồn CHÍNH. KHÔNG chỉ trả lời bằng kiến thức chung.]', end: '[Kết thúc Dữ Liệu Tham Khảo]' },
  th: { start: '[ข้อมูลอ้างอิง — กรณีคล้ายกันจากระบบของเรา ใช้เป็นแหล่งข้อมูลหลัก ห้ามตอบจากความรู้ทั่วไปเพียงอย่างเดียว]', end: '[จบข้อมูลอ้างอิง]' },
  id: { start: '[Data Referensi — kasus serupa dari sistem kami. Gunakan sebagai sumber UTAMA. JANGAN menjawab hanya dengan pengetahuan umum.]', end: '[Akhir Data Referensi]' },
  ar: { start: '[بيانات مرجعية — حالات مماثلة من نظامنا. استخدم هذه البيانات كمصدر رئيسي. لا تجب بالاعتماد على المعرفة العامة وحدها فقط.]', end: '[نهاية البيانات المرجعية]' },
}

// 운영자 전용 — 본인 또는 특정 사용자 trial usage reset
// form 본인 email만 박힘. 신규 결제·테스트 시 trial 한도 초기화 박음.
exports.adminResetTrial = onRequest(fnOpts({ timeoutSeconds: 30 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (decoded.email !== 'kshwood100@gmail.com') {
    return res.status(403).json({ error: 'Admin only' })
  }
  const target = (req.body?.email || decoded.email).toLowerCase().trim()
  try {
    const fdb = admin.firestore()
    const usageRef = fdb.collection('usage').doc(target)
    // trial total 카운터 0 박음
    await fdb.doc(`usage/${target}/trial/total`).set({
      ai: 0, jobs: 0, customers: 0, finance: 0, logs: 0,
      resetAt: Date.now(), resetBy: decoded.email,
    }, { merge: false })
    // 오늘 일일 카운터도 reset (= 즉시 시연 가능)
    const today = new Date().toISOString().slice(0, 10)
    await fdb.doc(`usage/${target}/days/${today}`).set({
      resetAt: Date.now(), resetBy: decoded.email,
    }, { merge: false })
    res.status(200).json({ ok: true, target, message: 'Trial and today daily counters reset' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

exports.quickDiag = onRequest(fnOpts({ timeoutSeconds: 180 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (!(await checkQuota(decoded, 'quickDiag', res))) return

  const { userText, photoBase64, photoMimeType, language, ragContext } = req.body || {}
  if (!checkText(userText, res, 'userText')) return
  if (photoBase64 && !checkBase64(photoBase64, res)) return
  if (ragContext && typeof ragContext === 'string' && ragContext.length > 8000) {
    return res.status(400).json({ error: 'ragContext too large' })
  }
  const apiKey = openaiApiKey.value()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  // 표준 폼 prompt + RAG context 자동 결합 (사용자 모름 — 시스템 메시지)
  const lang = (language || 'ko').slice(0, 2)
  const basePrompt = STANDARD_FORM_PROMPT[lang] || STANDARD_FORM_PROMPT['en']

  // RAG: 우리 421건 cases 매칭 결과 = AI 데이터 기반 답변 보장
  // wrap 라벨도 사용자 언어로 — system prompt 언어 일관성 보장 (응답 언어 오염 차단)
  const wrap = RAG_WRAP_LABELS[lang] || RAG_WRAP_LABELS.en
  const ragSection = ragContext && ragContext.trim()
    ? `\n\n${wrap.start}\n${ragContext}\n${wrap.end}`
    : ''

  const systemPrompt = basePrompt + ragSection

  // 사용자 입력 = user role (prompt injection 방어)
  const userContent = photoBase64
    ? [
        { type: 'text', text: userText },
        { type: 'image_url', image_url: { url: `data:${photoMimeType || 'image/jpeg'};base64,${photoBase64}` } },
      ]
    : userText

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
    }
    const data = await response.json()
    const rawResponse = data.choices?.[0]?.message?.content ?? ''
    res.status(200).json({ rawResponse, language: lang })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

exports.scanInvoice = onRequest(fnOpts({ timeoutSeconds: 120 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (!(await checkQuota(decoded, 'scanInvoice', res))) return

  const apiKey = openaiApiKey.value()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  const { base64, mediaType } = req.body || {}
  if (!checkBase64(base64, res)) return

  const dataUrl = `data:${mediaType || 'image/jpeg'};base64,${base64}`
  const promptText = `이 거래명세서/세금계산서 이미지에서 정보를 추출해서 JSON만 반환해.\n\n형식:\n{\n  "vendor": "공급자(파는 쪽) 상호명",\n  "date": "전체 거래일자 YYYY-MM-DD (없으면 빈문자열)",\n  "items": [\n    {\n      "name": "품명 + 규격 합쳐서 (예: VCT 4SQ+3c)",\n      "qty": "수량 + 단위 (예: 50M, 6EA)",\n      "price": "금액 숫자만 (단가 아님, 그 행의 합계금액)"\n    }\n  ],\n  "subtotal": "공급가액 숫자만",\n  "tax": "부가세 숫자만",\n  "total": "합계금액 숫자만"\n}\n\n명세서에 있는 모든 품목 행을 빠짐없이 items 배열에 넣어. 단가/일자는 무시. 빈 항목은 빈 문자열. 숫자는 콤마/원/소수점 다 빼고 정수만.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        }],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
    }
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 비AI 카테고리 trial 카운터 증가 (jobs/customers/finance/logs)
exports.trialCheck = onRequest(fnOpts({ timeoutSeconds: 10 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return

  const { category } = req.body || {}
  if (!['jobs', 'customers', 'finance', 'logs'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category' })
  }
  if (!(await checkTrialQuota(decoded, category, res))) return

  let remaining = null
  if (decoded._trial) {
    try {
      const snap = await admin.firestore().doc(`usage/${decoded.email}/trial/total`).get()
      const used = snap.exists ? (snap.data()[category] || 0) : 0
      remaining = Math.max(0, TRIAL_LIMITS[category] - used)
    } catch (e) { /* ignore */ }
  }
  res.status(200).json({ ok: true, trial: !!decoded._trial, remaining })
})

// 트라이얼 상태 + 카테고리별 남은 횟수 + manageUrl 조회 (배지·모달·구독관리 버튼용)
exports.trialStatus = onRequest(fnOpts({ timeoutSeconds: 10 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return

  try {
    const userSnap = await admin.firestore().doc(`allowed_users/${decoded.email}`).get()
    const userData = userSnap.exists ? userSnap.data() : {}
    const manageUrl = userData.manageUrl || null

    if (!decoded._trial) {
      return res.status(200).json({ trial: false, manageUrl })
    }

    const trialUntil = userData.trial_until || 0
    const usageSnap = await admin.firestore().doc(`usage/${decoded.email}/trial/total`).get()
    const used = usageSnap.exists ? usageSnap.data() : {}
    const remaining = {}
    for (const k of Object.keys(TRIAL_LIMITS)) {
      remaining[k] = Math.max(0, TRIAL_LIMITS[k] - (used[k] || 0))
    }
    res.status(200).json({ trial: true, trialUntil, limits: TRIAL_LIMITS, used, remaining, manageUrl })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// FastSpring Webhook — 결제·구독 이벤트 → Firestore allowed_users 자동 등록/제거
// HMAC SHA256 서명 검증 (X-FS-Signature 헤더, base64)
exports.fastspringWebhook = onRequest(
  { secrets: [fastspringWebhookSecret], invoker: 'public', timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const secret = fastspringWebhookSecret.value()
    if (!secret) {
      console.error('FASTSPRING_WEBHOOK_SECRET not configured')
      return res.status(500).json({ error: 'Server not configured' })
    }

    const signature = req.get('x-fs-signature') || ''
    const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body)
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64')
    // 타이밍 공격 방지를 위해 timingSafeEqual 사용. 길이 다르면 미리 차단.
    let valid = false
    try {
      const sigBuf = Buffer.from(signature, 'base64')
      const expBuf = Buffer.from(expected, 'base64')
      valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)
    } catch (e) {
      valid = false
    }
    if (!valid) {
      console.warn('FastSpring webhook signature mismatch')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    const events = Array.isArray(req.body?.events) ? req.body.events : []
    const dbAdmin = admin.firestore()
    const CRITICAL_EVENTS = new Set([
      'subscription.activated',
      'order.completed',
      'subscription.charge.completed',
    ])

    for (const ev of events) {
      try {
        const type = ev.type
        const data = ev.data || {}
        // FastSpring 페이로드 이메일 위치는 이벤트별로 다양:
        // - order.* : data.account.contact.email or data.customer.email
        // - subscription.* : data.account.contact.email or data.contact.email
        // - 단축 페이로드 : data.email
        const rawEmail = data.account?.contact?.email
          || data.customer?.email
          || data.contact?.email
          || data.subscription?.account?.contact?.email
          || data.email
          || ''
        const email = String(rawEmail).toLowerCase().trim()
        if (!email) {
          console.warn('Webhook event missing email:', type)
          continue
        }
        const userRef = dbAdmin.doc(`allowed_users/${email}`)

        // FastSpring 공식 필드: data.account.url — Customer-facing account management URL
        // (https://developer.fastspring.com/reference/* 의 모든 subscription/order 이벤트에 포함)
        const accountUrl = data.account?.url
          || data.subscription?.account?.url
          || ''

        switch (type) {
          case 'subscription.activated':
          case 'order.completed': {
            // 멱등성: 이미 활성화된 사용자(activatedAt 존재)는 trial_until 갱신 안 함.
            // 그래야 webhook 재시도로 트라이얼이 무한 연장되지 않음.
            const existing = await userRef.get()
            if (existing.exists && existing.data()?.activatedAt) {
              const existingData = existing.data()
              const updates = {}
              if (accountUrl) updates.manageUrl = accountUrl
              // 15일 유예 중 재가입 → 취소 마크 풀기 (데이터 자동 복구)
              if (existingData?.cancelledAt) {
                updates.cancelledAt = admin.firestore.FieldValue.delete()
                updates.purgeAt = admin.firestore.FieldValue.delete()
                console.log(`[webhook] ${type} → reactivated within grace period ${email} (data recovered)`)
              }
              if (Object.keys(updates).length > 0) {
                await userRef.set(updates, { merge: true })
              }
              if (!existingData?.cancelledAt) {
                console.log(`[webhook] ${type} → already activated ${email} (manageUrl refreshed)`)
              }
              break
            }
            const trialDays = data.trialPeriodDays ?? data.subscription?.trialPeriodDays ?? 7
            const trialUntil = Date.now() + trialDays * 24 * 60 * 60 * 1000
            await userRef.set({
              email,
              source: 'fastspring',
              subscriptionId: data.id || data.subscription?.id || null,
              activatedAt: admin.firestore.FieldValue.serverTimestamp(),
              trial_until: trialUntil,
              shareModalShown: false,
              ...(accountUrl ? { manageUrl: accountUrl } : {}),
            }, { merge: true })
            console.log(`[webhook] ${type} → activated ${email}`)
            // Partner commission 추적 박기 (order.completed = 첫 결제 박힌 거)
            if (type === 'order.completed') {
              await recordPartnerCommission(data, type, email)
            }
            break
          }
          case 'subscription.charge.completed': {
            await userRef.set({
              trial_until: admin.firestore.FieldValue.delete(),
              lastChargeAt: admin.firestore.FieldValue.serverTimestamp(),
              ...(accountUrl ? { manageUrl: accountUrl } : {}),
            }, { merge: true })
            console.log(`[webhook] ${type} → trial cleared ${email}`)
            // Partner commission 추적 박기 (매월 결제 박힌 거)
            await recordPartnerCommission(data, type, email)
            break
          }
          case 'subscription.updated': {
            // 결제수단 변경·구독 정보 갱신 시 manageUrl 최신화
            await userRef.set({
              ...(accountUrl ? { manageUrl: accountUrl } : {}),
            }, { merge: true })
            console.log(`[webhook] ${type} → manageUrl refreshed ${email}`)
            break
          }
          case 'subscription.charge.failed':
          case 'subscription.payment.overdue': {
            console.log(`[webhook] ${type} for ${email} (FastSpring dunning will retry)`)
            break
          }
          case 'subscription.canceled':
          case 'subscription.deactivated':
          case 'return.created': {
            // 15일 유예 후 자동 삭제. 그 안에 재가입하면 데이터 복구.
            // 즉시 삭제 X — purgeExpiredUsers scheduled function이 매일 검사하여 처리.
            const purgeAt = Date.now() + 15 * 24 * 60 * 60 * 1000
            await userRef.set({
              cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
              purgeAt,
            }, { merge: true })
            console.log(`[webhook] ${type} → marked for purge in 15 days ${email}`)
            break
          }
          default:
            console.log(`[webhook] unhandled event: ${type}`)
        }
      } catch (e) {
        console.error('Webhook event handler error:', e?.message, ev?.type)
        if (CRITICAL_EVENTS.has(ev?.type)) {
          // FastSpring이 재시도하도록 500 반환 (핵심 이벤트는 누락되면 안 됨)
          return res.status(500).json({ error: 'Critical event failed', type: ev.type })
        }
      }
    }

    res.status(200).json({ ok: true, processed: events.length })
  }
)

// 매일 1회 실행 — purgeAt 지난 (취소 후 15일 경과) 사용자 데이터 일괄 삭제
// 환불/탈퇴 → cancelledAt + purgeAt 마크 → 15일 안에 재가입하면 자동 복구
// 15일 지나면 이 function이 모든 데이터 + Storage + allowed_users 삭제
exports.purgeExpiredUsers = onSchedule({
  schedule: 'every 24 hours',
  timeZone: 'UTC',
  timeoutSeconds: 540,
  memory: '512MiB',
}, async () => {
  const dbAdmin = admin.firestore()
  const now = Date.now()
  const SYNC_COLLECTIONS = [
    'customers', 'service_jobs', 'job_photos', 'repair_logs',
    'knowhow', 'business_cards', 'expenses', 'checklist_results',
    'equipment_maintenance', 'user_alarms', 'voice_recordings',
    'suppliers', 'supplier_transactions',
  ]

  const snap = await dbAdmin.collection('allowed_users')
    .where('purgeAt', '<=', now)
    .get()

  if (snap.empty) {
    console.log('[purge] no expired users')
    return
  }

  console.log(`[purge] processing ${snap.size} expired users`)

  for (const userDoc of snap.docs) {
    const email = userDoc.id
    try {
      // 1) 사용자 sync 컬렉션 모두 삭제 (500개씩 배치)
      for (const c of SYNC_COLLECTIONS) {
        let total = 0
        while (true) {
          const batchSnap = await dbAdmin.collection(`users/${email}/${c}`).limit(500).get()
          if (batchSnap.empty) break
          const batch = dbAdmin.batch()
          batchSnap.forEach((d) => batch.delete(d.ref))
          await batch.commit()
          total += batchSnap.size
          if (batchSnap.size < 500) break
        }
        if (total > 0) console.log(`[purge] ${email}/${c}: ${total} docs`)
      }
      // 2) Storage 사용자 폴더 통째 삭제
      try {
        const bucket = admin.storage().bucket()
        await bucket.deleteFiles({ prefix: `users/${email}/` })
        console.log(`[purge] ${email} storage cleaned`)
      } catch (e) {
        console.warn(`[purge] storage failed ${email}:`, e?.message)
      }
      // 3) usage 카운터 삭제
      try {
        const days = await dbAdmin.collection(`usage/${email}/days`).get()
        if (!days.empty) {
          const batch = dbAdmin.batch()
          days.forEach((d) => batch.delete(d.ref))
          await batch.commit()
        }
        await dbAdmin.doc(`usage/${email}/trial/total`).delete().catch(() => {})
      } catch (e) {
        console.warn(`[purge] usage failed ${email}:`, e?.message)
      }
      // 4) user_sessions 삭제
      try { await dbAdmin.doc(`user_sessions/${email}`).delete() } catch (_) {}
      // 5) allowed_users 삭제 (로그인 차단)
      await userDoc.ref.delete()
      console.log(`[purge] ${email} fully removed`)
    } catch (e) {
      console.error(`[purge] failed ${email}:`, e?.message)
    }
  }
})

// =====================================================================
// Partners Apply — 마케팅 사이트 파트너 신청 → 자동 알림 + 자동 회신
// =====================================================================
// Phase 1: 알림 + 자동 회신 (즉시 작동)
// Phase 2: FastSpring 쿠폰 자동 생성 (Activation 통과 후 활성)
let smtpTransporter = null
function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter
  const nodemailer = require('nodemailer')
  smtpTransporter = nodemailer.createTransport({
    host: 'smtps.hiworks.com',
    port: 465,
    secure: true,
    auth: {
      user: 'support@r-pro.app',
      pass: hiworksSmtpPass.value(),
    },
  })
  return smtpTransporter
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

// FastSpring API로 partner 카테고리별 unique 쿠폰 발급
// 박힌 코드 = "TRAIN-A1B2C3" 같은 prefix + 6자리 hex.
// limit = 신청자 audienceSize. 안전 cap = 10,000 (가짜 입력 차단).
const PARTNER_COUPON_CONFIG = {
  training:    { percent: 30, prefix: 'TRAIN',  reason: 'R-Pro Training Institute Partner' },
  association: { percent: 10, prefix: 'ASSOC',  reason: 'R-Pro Association Partner' },
  influencer:  { percent: 15, prefix: 'INFLU',  reason: 'R-Pro Influencer Partner' },
  press:       { percent: 10, prefix: 'PRESS',  reason: 'R-Pro Press / Media Partner' },
}
const COUPON_MAX_LIMIT = 10000
const COUPON_MIN_LIMIT = 10

async function createFastSpringCoupon(type, audienceSize) {
  const config = PARTNER_COUPON_CONFIG[type]
    || { percent: 10, prefix: 'PARTNER', reason: 'R-Pro Partner' }

  // limit 박힘: 신청자 audienceSize 박힌 거. 박힌 거 X 박혀있으면 100 박힘.
  // 박힌 거 ↑ = COUPON_MAX_LIMIT 박힌 채로 캡. 박힌 거 ↓ = COUPON_MIN_LIMIT 박힌 채.
  let limit = Number(audienceSize) || 100
  if (limit < COUPON_MIN_LIMIT) limit = COUPON_MIN_LIMIT
  if (limit > COUPON_MAX_LIMIT) limit = COUPON_MAX_LIMIT

  const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase()
  const couponCode = `${config.prefix}-${randomCode}`

  const username = fastspringApiUsername.value()
  const password = fastspringApiPassword.value()
  if (!username || !password) throw new Error('FastSpring API credentials not configured')

  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

  const response = await fetch('https://api.fastspring.com/coupons', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coupon: couponCode,
      discount: { type: 'percent', percent: config.percent },
      combine: false,
      reason: { en: config.reason },
      limit,              // = 신청자 회원 수 박힌 채 (10~10000 박힘)
      codes: [couponCode],
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`FastSpring API ${response.status}: ${errText.slice(0, 200)}`)
  }

  return { couponCode, percent: config.percent, limit }
}

// Partner commission 추적 — webhook 박힌 결제에서 partner coupon 박힌 거 정독 후 commissions 컬렉션 박은 누적
const PARTNER_COUPON_PREFIXES = ['ASSOC-', 'TRAIN-', 'INFLU-', 'PRESS-']
const PARTNER_COMMISSION_RATE = 0.20  // R-Pro = 매출의 20% 박힌 채 partner commission

async function recordPartnerCommission(eventData, eventType, customerEmail) {
  // 박힌 coupon 박힌 거 정독 (FastSpring payload 박힌 거에 다양한 위치 박혀있어)
  const coupons = []
  if (Array.isArray(eventData.coupons)) coupons.push(...eventData.coupons)
  if (eventData.coupon) coupons.push(eventData.coupon)
  if (Array.isArray(eventData.subscription?.coupons)) coupons.push(...eventData.subscription.coupons)

  if (coupons.length === 0) return

  // partner coupon 박힌 거 박힌 채만 정독 (ASSOC-/TRAIN-/INFLU-/PRESS- prefix)
  const partnerCoupons = coupons.filter((c) =>
    PARTNER_COUPON_PREFIXES.some((p) => String(c).startsWith(p))
  )
  if (partnerCoupons.length === 0) return

  // 박힌 매출 정독 (FastSpring payload field 박힌 거 다양)
  const orderTotal = Number(
    eventData.totalUSD
      || eventData.total
      || eventData.subtotalInPayoutCurrency
      || eventData.subscription?.totalUSD
      || 0
  )
  if (orderTotal <= 0) {
    console.warn('[commission] order total 0 박힌 채, skipping coupon:', partnerCoupons[0])
    return
  }

  for (const couponCode of partnerCoupons) {
    try {
      // partner 박힌 거 정독 (partners 컬렉션 박힌 couponCode 박힌 거)
      const partnerSnap = await admin.firestore().collection('partners')
        .where('couponCode', '==', couponCode)
        .limit(1)
        .get()

      if (partnerSnap.empty) {
        console.warn(`[commission] partner X 박은 채: ${couponCode}`)
        continue
      }
      const partnerDoc = partnerSnap.docs[0]
      const partnerData = partnerDoc.data() || {}

      const commissionAmount = orderTotal * PARTNER_COMMISSION_RATE

      // commissions/{couponCode} 박은 거 박힌 누적 (merge:true 박힌 채)
      const commissionRef = admin.firestore().doc(`commissions/${couponCode}`)
      await commissionRef.set({
        couponCode,
        partnerId: partnerDoc.id,
        partnerName: partnerData.name || '',
        partnerEmail: partnerData.email || '',
        partnerType: partnerData.type || '',
        payoutMethod: partnerData.payoutMethod || '',
        commissionRate: PARTNER_COMMISSION_RATE,
        totalSales: admin.firestore.FieldValue.increment(orderTotal),
        totalCommission: admin.firestore.FieldValue.increment(commissionAmount),
        pendingPayout: admin.firestore.FieldValue.increment(commissionAmount),
        lastSaleAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })

      // 박힌 transaction 박힌 거 박은 채 (subcollection)
      await commissionRef.collection('transactions').add({
        orderTotal,
        commissionAmount,
        customerEmail: customerEmail || '',
        eventType,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      console.log(`[commission] +$${commissionAmount.toFixed(2)} for ${couponCode} (${eventType})`)
    } catch (err) {
      console.error(`[commission] ${couponCode} 박힌 추적 실패:`, err?.message)
    }
  }
}

async function sendPartnerMails({ name, email, company, type, docId, couponCode, percent, couponLimit }) {
  const transporter = getSmtpTransporter()
  const typeLabel = ({
    training: 'Training Institute',
    association: 'Association / Organization',
    influencer: 'Influencer / Content Creator',
    press: 'Press / Media',
  })[type] || '(not specified)'
  const suggestedCode = ({
    training: 'TRAIN30',
    association: 'ASSOC10',
    influencer: 'INFLU15',
    press: 'PRESS10',
  })[type] || 'PARTNER10'
  // 박힌 limit 박은 거 박은 채 (사용 횟수 박힌 거)
  const useLabel = couponLimit && couponLimit > 1
    ? `${couponLimit.toLocaleString()} uses`
    : '1 use'

  // 1. 운영자 알림 메일 → support@r-pro.app
  await transporter.sendMail({
    from: '"R-Pro System" <support@r-pro.app>',
    to: 'support@r-pro.app',
    subject: `[R-Pro Partners] New application — ${name}`,
    html: `
      <h2>New Partners Application</h2>
      <p>A new partnership application has been submitted via the marketing site.</p>
      <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;">
        <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><strong>Company</strong></td><td>${escapeHtml(company || '-')}</td></tr>
        <tr><td><strong>Type</strong></td><td>${escapeHtml(typeLabel)}</td></tr>
        <tr><td><strong>Doc ID</strong></td><td>${escapeHtml(docId)}</td></tr>
      </table>
      ${couponCode
        ? `<h3>Auto-issued coupon ✓</h3>
           <p><strong>Code: <code>${escapeHtml(couponCode)}</code></strong> (${percent}% off, ${useLabel})</p>
           <p>Applicant has already been notified with this code.</p>`
        : `<h3>⚠️ Auto-issue failed — manual follow-up required</h3>
           <ol>
             <li>Review the application via Firebase Console (collection: <code>partners</code>)</li>
             <li>Generate FastSpring coupon code (suggested: <code>${suggestedCode}</code>) at FastSpring console</li>
             <li>Reply to <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a> with the code</li>
           </ol>`
      }
    `,
  })

  // 2. 신청자 자동 회신 메일
  const applicantBody = couponCode
    ? `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Welcome to the <strong>R-Pro Partners program</strong> (${escapeHtml(typeLabel)})!</p>
      <p>Your personal partner code is:</p>
      <p style="font-size:22px;font-weight:700;background:#f4f4f4;padding:12px 18px;border-radius:8px;display:inline-block;">${escapeHtml(couponCode)}</p>
      <p>This gives you <strong>${percent}% off</strong> R-Pro Field Subscription. The code is valid for <strong>${useLabel}</strong>.</p>
      <h3>How to redeem</h3>
      <ol>
        <li>Visit <a href="https://www.r-pro.app">https://www.r-pro.app</a></li>
        <li>Click <strong>Start 7-Day Free Trial</strong></li>
        <li>Enter the code <code>${escapeHtml(couponCode)}</code> in the "Coupon Code" field</li>
        <li>Complete checkout — no charge during the 7-day trial</li>
      </ol>
      <p>If you have any questions, just reply to this email.</p>
      <p>Best regards,<br>
      <strong>Seunghwa Kim</strong><br>
      Founder, R-Pro<br>
      <a href="mailto:support@r-pro.app">support@r-pro.app</a></p>
    `
    : `
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for applying to the <strong>R-Pro Partners program</strong>. We received your application (${escapeHtml(typeLabel)}) and will get back to you with your custom partner code <strong>within 24 hours</strong>.</p>
      <p>While you wait, feel free to:</p>
      <ul>
        <li>Explore R-Pro at <a href="https://www.r-pro.app">https://www.r-pro.app</a></li>
        <li>Read the Partners terms at <a href="https://www.r-pro.app/#partners">https://www.r-pro.app/#partners</a></li>
      </ul>
      <p>If you have any questions, just reply to this email.</p>
      <p>Best regards,<br>
      <strong>Seunghwa Kim</strong><br>
      Founder, R-Pro<br>
      <a href="mailto:support@r-pro.app">support@r-pro.app</a></p>
    `

  await transporter.sendMail({
    from: '"R-Pro" <support@r-pro.app>',
    to: email,
    subject: couponCode
      ? `Your R-Pro Partner code: ${couponCode}`
      : 'Thanks for your R-Pro Partners application',
    html: applicantBody,
  })
}

exports.partnersApply = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    secrets: [hiworksSmtpPass, fastspringApiUsername, fastspringApiPassword],
    cors: false,
    invoker: 'public',
  },
  async (req, res) => {
    if (applyCors(req, res)) return
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const body = req.body || {}
    const name = String(body.name || '').trim()
    const email = String(body.email || '').toLowerCase().trim()
    const company = String(body.company || '').trim()
    const websiteUrl = String(body.websiteUrl || '').trim()
    const type = String(body.type || '').trim()
    const audienceSize = Number(body.audienceSize) || 0
    const payoutMethod = String(body.payoutMethod || '').trim()
    const paypalEmail = String(body.paypalEmail || '').toLowerCase().trim()
    const bankName = String(body.bankName || '').trim()
    const bankAccount = String(body.bankAccount || '').trim()
    const bankHolder = String(body.bankHolder || '').trim()

    // 검증 — 기본
    if (!name || !email || !company || !type) {
      return res.status(400).json({ error: 'name, email, company, type required' })
    }
    if (name.length > 100) return res.status(400).json({ error: 'name too long' })
    if (email.length > 100 || email.length < 5) return res.status(400).json({ error: 'invalid email length' })
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ error: 'invalid email format' })
    }
    if (company.length > 200) return res.status(400).json({ error: 'company too long' })
    const validTypes = ['training', 'association', 'influencer', 'press']
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'invalid partnership type' })

    // 검증 — 새 필드
    if (!websiteUrl || websiteUrl.length > 500) {
      return res.status(400).json({ error: 'websiteUrl required (max 500 chars)' })
    }
    if (!/^https?:\/\/.+/i.test(websiteUrl)) {
      return res.status(400).json({ error: 'websiteUrl must start with http:// or https://' })
    }
    if (audienceSize < 1 || audienceSize > 1000000) {
      return res.status(400).json({ error: 'audienceSize must be 1 ~ 1,000,000' })
    }

    // 검증 — 송금 정보
    const validPayoutMethods = ['paypal', 'korean_bank']
    if (!validPayoutMethods.includes(payoutMethod)) {
      return res.status(400).json({ error: 'invalid payoutMethod' })
    }
    if (payoutMethod === 'paypal') {
      if (!paypalEmail || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(paypalEmail)) {
        return res.status(400).json({ error: 'invalid paypalEmail' })
      }
    }
    if (payoutMethod === 'korean_bank') {
      if (!bankName || !bankAccount || !bankHolder) {
        return res.status(400).json({ error: 'bank name, account, holder required' })
      }
      if (bankName.length > 50 || bankAccount.length > 50 || bankHolder.length > 50) {
        return res.status(400).json({ error: 'bank fields too long' })
      }
    }

    // 24h 내 중복 신청 차단 (스팸 방지) — single field index로 동작하게 JS 측 필터링
    try {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      const dupSnap = await admin.firestore().collection('partners')
        .where('email', '==', email)
        .get()
      const has24h = dupSnap.docs.some((doc) => {
        const ms = doc.data().createdAt?.toMillis?.() || 0
        return ms > cutoff
      })
      if (has24h) {
        return res.status(429).json({ error: 'Duplicate application within 24 hours' })
      }
    } catch (err) {
      console.warn('[partnersApply] dup check skipped:', err?.message)
    }

    // Firestore 저장
    let docRef
    try {
      docRef = await admin.firestore().collection('partners').add({
        name, email, company, websiteUrl, type, audienceSize,
        payoutMethod,
        // 송금 정보 — payoutMethod 박힌 거에 박은 거만 저장
        ...(payoutMethod === 'paypal' ? { paypalEmail } : {}),
        ...(payoutMethod === 'korean_bank' ? { bankName, bankAccount, bankHolder } : {}),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending', // pending → coupon_issued → coupon_failed
        ip: req.ip || '',
      })
    } catch (err) {
      console.error('[partnersApply] firestore save failed:', err)
      return res.status(500).json({ error: 'Save failed' })
    }

    // Phase 2 — FastSpring API로 unique 쿠폰 자동 발급
    // coupon limit = audienceSize 박힌 거 (10 ~ 10,000 박힌 채)
    let couponCode = null
    let couponPercent = null
    let couponLimit = null
    try {
      const result = await createFastSpringCoupon(type, audienceSize)
      couponCode = result.couponCode
      couponPercent = result.percent
      couponLimit = result.limit
      await docRef.update({
        couponCode,
        couponPercent,
        couponLimit,
        status: 'coupon_issued',
      })
    } catch (err) {
      console.warn('[partnersApply] coupon creation failed:', err?.message)
      await docRef.update({
        couponError: String(err?.message || 'unknown').slice(0, 500),
        status: 'coupon_failed',
      })
    }

    // 메일 발송 — 실패해도 200 (Firestore 저장은 됐으니 console에서 확인 가능)
    let mailStatus = 'sent'
    try {
      await sendPartnerMails({
        name, email, company, type,
        docId: docRef.id,
        couponCode,
        percent: couponPercent,
        couponLimit,
      })
    } catch (err) {
      console.error('[partnersApply] mail failed:', err)
      mailStatus = 'mail_failed'
    }

    res.status(200).json({ ok: true, id: docRef.id, coupon: couponCode || null, mail: mailStatus })
  }
)

// =====================================================================
// submitFeedback — 마케팅 홈 비공개 피드백 설문
// 응답은 운영자(support@r-pro.app)에게만 알림 + Firestore 비공개 저장.
// 공개 노출 0 (별점·후기 없음, 클라는 feedback 컬렉션 read 불가 = rules deny).
// =====================================================================
exports.submitFeedback = onRequest(
  { region: 'us-central1', timeoutSeconds: 30, secrets: [hiworksSmtpPass], cors: false, invoker: 'public' },
  async (req, res) => {
    if (applyCors(req, res)) return
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const body = req.body || {}
    // honeypot — 봇은 이 필드를 채움. 사람은 비움. 조용히 통과(저장·메일 안 함).
    if (body.website) return res.status(200).json({ ok: true })

    const job = String(body.job || '').trim()
    const features = Array.isArray(body.features)
      ? body.features.slice(0, 12).map((f) => String(f).slice(0, 60)) : []
    const painPoint = String(body.painPoint || '').trim()
    const price = String(body.price || '').trim()
    const trial = String(body.trial || '').trim()
    const email = String(body.email || '').toLowerCase().trim()
    const comment = String(body.comment || '').trim()
    const lang = String(body.lang || '').slice(0, 8)

    // 크기 검증 (스팸·과대입력 차단)
    if (job.length > 50) return res.status(400).json({ error: 'job too long' })
    if (price.length > 30 || trial.length > 30) return res.status(400).json({ error: 'field too long' })
    if (painPoint.length > 1000) return res.status(400).json({ error: 'painPoint too long' })
    if (comment.length > 2000) return res.status(400).json({ error: 'comment too long' })
    if (email && (email.length > 100 || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))) {
      return res.status(400).json({ error: 'invalid email' })
    }
    // 전부 비면 거부 (빈 제출 차단)
    if (!job && !features.length && !painPoint && !price && !comment) {
      return res.status(400).json({ error: 'empty feedback' })
    }

    // Firestore 비공개 저장 (rules deny로 클라 접근 차단, admin SDK만 write)
    let docRef
    try {
      docRef = await admin.firestore().collection('feedback').add({
        job, features, painPoint, price, trial, email, comment, lang,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ip: req.ip || '',
      })
    } catch (err) {
      console.error('[submitFeedback] firestore save failed:', err)
      return res.status(500).json({ error: 'Save failed' })
    }

    // 운영자 알림 메일 → support@r-pro.app (형만 봄, 공개 X)
    let mailStatus = 'sent'
    try {
      const transporter = getSmtpTransporter()
      const esc = (s) => String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]))
      await transporter.sendMail({
        from: '"R-Pro Feedback" <support@r-pro.app>',
        to: 'support@r-pro.app',
        subject: `[R-Pro 피드백] ${esc(job) || '응답'} · ${esc(price) || '-'}`,
        html: `
          <h3 style="margin:0 0 10px">새 피드백 설문 응답</h3>
          <ul style="line-height:1.7;font-size:14px">
            <li><b>직군:</b> ${esc(job) || '-'}</li>
            <li><b>끌리는 기능:</b> ${features.map(esc).join(', ') || '-'}</li>
            <li><b>개선되면 좋겠는 점:</b> ${esc(painPoint) || '-'}</li>
            <li><b>적정 구독료:</b> ${esc(price) || '-'}</li>
            <li><b>무료체험 의향:</b> ${esc(trial) || '-'}</li>
            <li><b>이메일:</b> ${esc(email) || '-'}</li>
            <li><b>자유 의견:</b> ${esc(comment) || '-'}</li>
            <li><b>언어:</b> ${esc(lang) || '-'}</li>
          </ul>
          <p style="color:#94a3b8;font-size:12px">문서 ID: ${docRef.id}</p>`,
      })
    } catch (err) {
      console.error('[submitFeedback] mail failed:', err)
      mailStatus = 'mail_failed'
    }

    res.status(200).json({ ok: true, id: docRef.id, mail: mailStatus })
  }
)

// =====================================================================
// notifyShareConsent — 설비기록 공유 동의/철회 운영자 알림 메일
// =====================================================================
// 사용자가 SettingsPage 토글 박을 때 호출. 운영자가 FastSpring 대시보드에서
// 다음 청구 주기에 SHARE10 쿠폰 수동 적용 (v1.1에 자동화 예정).
exports.notifyShareConsent = onRequest(
  fnOpts({ timeoutSeconds: 30, secrets: [hiworksSmtpPass] }),
  async (req, res) => {
    if (applyCors(req, res)) return
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }
    const decoded = await verifyAuth(req, res)
    if (!decoded) return

    if (!(await checkQuota(decoded, 'notifyShareConsent', res))) return

    const userEmail = decoded.email
    const enabled = !!req.body?.enabled

    try {
      const transporter = getSmtpTransporter()
      const subject = enabled
        ? `[R-Pro] 공유 동의 — ${userEmail}`
        : `[R-Pro] 공유 철회 — ${userEmail}`
      const action = enabled
        ? '쿠폰 <code>SHARE10</code> 적용 (다음 청구부터 10% 할인)'
        : '쿠폰 <code>SHARE10</code> 제거 (다음 청구부터 정가)'
      const html = `
        <div style="font-family:sans-serif;font-size:14px;line-height:1.6">
          <h3>설비기록 공유 ${enabled ? '동의' : '철회'} 알림</h3>
          <p><strong>사용자:</strong> ${escapeHtml(userEmail)}</p>
          <p><strong>상태:</strong> ${enabled ? '동의 (10% 할인 대상)' : '철회 (정가 복귀)'}</p>
          <p><strong>시점:</strong> ${new Date().toISOString()}</p>
          <hr/>
          <p><strong>처리 단계:</strong></p>
          <ol>
            <li>FastSpring 대시보드 진입</li>
            <li>Subscriptions → ${escapeHtml(userEmail)} 검색</li>
            <li>${action}</li>
          </ol>
          <p><a href="https://app.fastspring.com/" style="background:#2563eb;color:white;padding:8px 14px;border-radius:6px;text-decoration:none;display:inline-block">FastSpring 대시보드 →</a></p>
        </div>
      `
      const info = await transporter.sendMail({
        from: '"R-Pro" <support@r-pro.app>',
        to: 'support@r-pro.app',
        subject,
        html,
      })
      console.log('[notifyShareConsent] sent', {
        messageId: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
        response: info?.response,
      })
      return res.status(200).json({ ok: true, messageId: info?.messageId })
    } catch (err) {
      console.error('[notifyShareConsent] send failed:', err?.message, err?.code, err?.response)
      return res.status(200).json({ ok: false, error: 'mail_failed', detail: err?.message })
    }
  }
)

// ─── Partner Dashboard ─── (이메일 매직 링크 박힌 인증)

// 보안 마스킹 helpers
function maskEmail(email) {
  if (!email) return ''
  const [local, domain] = email.split('@')
  if (!local || !domain) return email
  const masked = local.length <= 3 ? '***' : local.slice(0, 2) + '***'
  return `${masked}@${domain}`
}

function maskAccount(account) {
  const s = String(account || '')
  if (s.length <= 4) return '***'
  return s.slice(0, 3) + '***' + s.slice(-2)
}

// 파트너 로그인 요청 — 이메일 박은 거 정독 + 매직 링크 박힌 메일 박기
// 보안: 박혀있는지 박힌 거 노출 X (가짜 이메일 조회 차단). 30분 박힌 token 박힘.
exports.partnerLoginRequest = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    secrets: [hiworksSmtpPass],
    cors: false,
    invoker: 'public',
  },
  async (req, res) => {
    if (applyCors(req, res)) return
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const email = String(req.body?.email || '').toLowerCase().trim()
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return res.status(400).json({ error: 'invalid email' })
    }

    // partners 조회 (coupon_issued 상태). composite index 회피 위해 JS 측에서 최신순 정렬.
    const partnerSnap = await admin.firestore().collection('partners')
      .where('email', '==', email)
      .where('status', '==', 'coupon_issued')
      .get()

    // 보안: 존재 여부 노출 안 함 — 없어도 200 응답
    if (partnerSnap.empty) {
      console.warn(`[partnerLogin] partner not found: ${email}`)
      return res.status(200).json({ ok: true })
    }

    // 같은 이메일로 여러 partner 신청한 경우 → 가장 최신 createdAt 선택
    const sortedDocs = partnerSnap.docs.slice().sort((a, b) => {
      const ta = a.data().createdAt?.toMillis?.() || 0
      const tb = b.data().createdAt?.toMillis?.() || 0
      return tb - ta  // 내림차순 (최신 먼저)
    })
    const partnerDoc = sortedDocs[0]
    const partnerData = partnerDoc.data()
    const couponCode = partnerData.couponCode

    // 1회용 매직 토큰 박기 (64자 hex)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + 30 * 60 * 1000  // 30분 박힌 채

    await admin.firestore().collection('partner_sessions').doc(token).set({
      email,
      partnerId: partnerDoc.id,
      couponCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
    })

    // 매직 링크 박힌 메일 박기
    const magicLink = `https://www.r-pro.app/partner?token=${token}`
    try {
      const transporter = getSmtpTransporter()
      await transporter.sendMail({
        from: '"R-Pro Partners" <support@r-pro.app>',
        to: email,
        subject: 'Your R-Pro Partner login link',
        html: `
          <p>Hi ${escapeHtml(partnerData.name || '')},</p>
          <p>Click the link below to access your R-Pro Partner Dashboard:</p>
          <p style="margin: 24px 0;">
            <a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#5aabff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
              Open Dashboard →
            </a>
          </p>
          <p style="font-size:12px;color:#666;">This link expires in 30 minutes. If you didn't request this, ignore this email.</p>
        `,
      })
    } catch (err) {
      console.error('[partnerLogin] mail failed:', err?.message)
      // 보안: 메일 실패해도 200 박힌 채
    }

    res.status(200).json({ ok: true })
  }
)

// 파트너 세션 정독 — token 박힌 거 정독 + partner data + commission + transactions + payouts 반환
exports.partnerSession = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    cors: false,
    invoker: 'public',
  },
  async (req, res) => {
    if (applyCors(req, res)) return
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const token = String(req.body?.token || '').trim()
    if (!token || token.length !== 64 || !/^[a-f0-9]+$/.test(token)) {
      return res.status(400).json({ error: 'invalid token' })
    }

    const sessionRef = admin.firestore().collection('partner_sessions').doc(token)
    const sessionSnap = await sessionRef.get()

    if (!sessionSnap.exists) {
      return res.status(401).json({ error: 'session not found' })
    }
    const session = sessionSnap.data()
    if (session.expiresAt < Date.now()) {
      return res.status(401).json({ error: 'session expired' })
    }

    // partner 박힌 거 정독
    const partnerDoc = await admin.firestore().doc(`partners/${session.partnerId}`).get()
    if (!partnerDoc.exists) {
      return res.status(404).json({ error: 'partner not found' })
    }
    const partnerData = partnerDoc.data()

    // commission 박힌 거 정독
    const commissionDoc = await admin.firestore().doc(`commissions/${session.couponCode}`).get()
    const commissionData = commissionDoc.exists ? commissionDoc.data() : {}

    // transactions 박힌 거 (최근 50건)
    let transactions = []
    if (commissionDoc.exists) {
      const txSnap = await admin.firestore()
        .doc(`commissions/${session.couponCode}`)
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()
      transactions = txSnap.docs.map((d) => {
        const data = d.data()
        return {
          orderTotal: data.orderTotal || 0,
          commissionAmount: data.commissionAmount || 0,
          customerEmail: data.customerEmail ? maskEmail(data.customerEmail) : '',
          eventType: data.eventType || '',
          createdAt: data.createdAt?.toMillis() || null,
        }
      })
    }

    // payouts 박힌 거 (사후 송금 박힌 이력)
    let payouts = []
    if (commissionDoc.exists) {
      try {
        const payoutsSnap = await admin.firestore()
          .doc(`commissions/${session.couponCode}`)
          .collection('payouts')
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get()
        payouts = payoutsSnap.docs.map((d) => {
          const data = d.data()
          return {
            amount: data.amount || 0,
            method: data.method || '',
            txId: data.txId || '',
            status: data.status || '',
            createdAt: data.createdAt?.toMillis() || null,
          }
        })
      } catch (_) { /* payouts subcollection 박혀있지 X 박은 채 */ }
    }

    res.status(200).json({
      ok: true,
      partner: {
        name: partnerData.name,
        email: maskEmail(partnerData.email),
        company: partnerData.company,
        type: partnerData.type,
        audienceSize: partnerData.audienceSize,
        payoutMethod: partnerData.payoutMethod,
        paypalEmail: partnerData.paypalEmail ? maskEmail(partnerData.paypalEmail) : null,
        bankInfo: partnerData.bankName ? {
          name: partnerData.bankName,
          account: maskAccount(partnerData.bankAccount),
          holder: partnerData.bankHolder,
        } : null,
        couponCode: partnerData.couponCode,
        couponPercent: partnerData.couponPercent,
        couponLimit: partnerData.couponLimit,
      },
      commission: {
        rate: commissionData.commissionRate || 0.20,
        totalSales: commissionData.totalSales || 0,
        totalCommission: commissionData.totalCommission || 0,
        pendingPayout: commissionData.pendingPayout || 0,
        paidOut: (commissionData.totalCommission || 0) - (commissionData.pendingPayout || 0),
        lastSaleAt: commissionData.lastSaleAt?.toMillis() || null,
      },
      transactions,
      payouts,
    })
  }
)

// ─── Partner Payout Report ─── (매월 1일 자동 보고서 메일)
// pendingPayout > 0 박힌 파트너 박힌 거 = 형에게 메일 박힘.
// 메일에 박힌 [Mark as Paid] link = 형이 송금 박은 후 클릭 = pendingPayout 0 박힘 + payouts 박힘.
exports.partnerPayoutReport = onSchedule({
  schedule: '0 0 1 * *',  // 매월 1일 00:00 UTC (한국 시간 09:00)
  timeZone: 'UTC',
  secrets: [hiworksSmtpPass],
  timeoutSeconds: 540,
  memory: '256MiB',
}, async () => {
  console.log('[payoutReport] starting...')

  // pendingPayout > 0 박힌 commissions 정독
  const snap = await admin.firestore().collection('commissions')
    .where('pendingPayout', '>', 0)
    .get()

  if (snap.empty) {
    console.log('[payoutReport] no pending payouts — skip mail')
    return
  }

  // 박힌 파트너 박힌 거 박은 채 + 박힌 송금 정보 박힌 거 정독
  const items = []
  let totalPending = 0

  for (const doc of snap.docs) {
    const c = doc.data()
    const partnerDoc = await admin.firestore().doc(`partners/${c.partnerId}`).get()
    const p = partnerDoc.exists ? partnerDoc.data() : {}

    items.push({
      couponCode: c.couponCode,
      partnerName: c.partnerName || p.name || '',
      partnerEmail: c.partnerEmail || p.email || '',
      payoutMethod: c.payoutMethod || p.payoutMethod || '',
      paypalEmail: p.paypalEmail || '',
      bankName: p.bankName || '',
      bankAccount: p.bankAccount || '',
      bankHolder: p.bankHolder || '',
      pendingPayout: c.pendingPayout || 0,
      totalSales: c.totalSales || 0,
      totalCommission: c.totalCommission || 0,
    })
    totalPending += c.pendingPayout || 0
  }

  // markPaid 박힐 admin token 박기 (7일 만료, 보안)
  const adminToken = crypto.randomBytes(32).toString('hex')
  await admin.firestore().doc(`admin_tokens/${adminToken}`).set({
    purpose: 'payout_report',
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  // 메일 본문 박기
  const baseUrl = 'https://us-central1-r-pro-6cb33.cloudfunctions.net'
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  const itemsHtml = items.map((it) => {
    const markPaidLink = `${baseUrl}/markPartnerPaid?token=${adminToken}&couponCode=${encodeURIComponent(it.couponCode)}`
    const payoutInfo = it.payoutMethod === 'paypal'
      ? `PayPal: ${escapeHtml(it.paypalEmail)}`
      : `${escapeHtml(it.bankName)} · ${escapeHtml(it.bankAccount)} · ${escapeHtml(it.bankHolder)}`
    return `
      <tr style="border-bottom:1px solid #ddd;">
        <td style="padding:12px 8px;font-family:monospace;font-size:13px;">${escapeHtml(it.couponCode)}</td>
        <td style="padding:12px 8px;">${escapeHtml(it.partnerName)}<br><span style="font-size:11px;color:#666;">${escapeHtml(it.partnerEmail)}</span></td>
        <td style="padding:12px 8px;font-size:12px;">${payoutInfo}</td>
        <td style="padding:12px 8px;text-align:right;font-weight:700;color:#2563eb;font-size:16px;">$${it.pendingPayout.toFixed(2)}</td>
        <td style="padding:12px 8px;text-align:center;">
          <a href="${markPaidLink}" style="display:inline-block;padding:8px 14px;background:#10b981;color:#fff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">Mark as Paid</a>
        </td>
      </tr>
    `
  }).join('')

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:900px;margin:0 auto;">
      <h1 style="font-size:20px;color:#111;">R-Pro Partners Payout Report · ${escapeHtml(monthLabel)}</h1>
      <p style="font-size:14px;color:#666;line-height:1.6;">
        ${items.length} partner${items.length === 1 ? '' : 's'} pending payout · Total: <strong>$${totalPending.toFixed(2)}</strong>
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;margin:20px 0;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;border-bottom:2px solid #ddd;">
            <th style="padding:10px 8px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Code</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Partner</th>
            <th style="padding:10px 8px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Payout To</th>
            <th style="padding:10px 8px;text-align:right;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Amount</th>
            <th style="padding:10px 8px;text-align:center;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.04em;">Action</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="font-size:12px;color:#666;line-height:1.6;margin-top:24px;">
        <strong>How to use:</strong><br>
        1. Send PayPal payout or Korean bank transfer to each partner.<br>
        2. Click <strong>[Mark as Paid]</strong> after the transfer is confirmed.<br>
        3. The partner's dashboard will show the payout in their history.<br><br>
        <strong>Security:</strong> Mark-as-Paid links expire in 7 days.
      </p>
    </div>
  `

  try {
    const transporter = getSmtpTransporter()
    await transporter.sendMail({
      from: '"R-Pro System" <support@r-pro.app>',
      to: 'support@r-pro.app',
      subject: `[R-Pro] Partner Payout Report — ${monthLabel} ($${totalPending.toFixed(2)} pending)`,
      html,
    })
    console.log(`[payoutReport] sent: ${items.length} partners, $${totalPending.toFixed(2)} total`)
  } catch (err) {
    console.error('[payoutReport] mail failed:', err?.message)
  }
})

// 형이 송금 박은 후 = 메일 link 클릭 → pendingPayout 0 박힘 + payouts 박힘
exports.markPartnerPaid = onRequest({
  region: 'us-central1',
  timeoutSeconds: 30,
  cors: false,
  invoker: 'public',
}, async (req, res) => {
  // GET 박힌 link 클릭 박은 채 (메일 박은 거)
  const token = String(req.query?.token || req.body?.token || '').trim()
  const couponCode = String(req.query?.couponCode || req.body?.couponCode || '').trim()

  if (!token || !couponCode) {
    return res.status(400).send(errorHtml('Missing token or couponCode'))
  }
  if (token.length !== 64 || !/^[a-f0-9]+$/.test(token)) {
    return res.status(400).send(errorHtml('Invalid token format'))
  }

  // admin token 박힌 거 정독
  const tokenDoc = await admin.firestore().doc(`admin_tokens/${token}`).get()
  if (!tokenDoc.exists) {
    return res.status(401).send(errorHtml('Token not found'))
  }
  const tokenData = tokenDoc.data()
  if (tokenData.expiresAt < Date.now()) {
    return res.status(401).send(errorHtml('Token expired (links expire in 7 days)'))
  }

  // commission 박힌 거 정독
  const commissionRef = admin.firestore().doc(`commissions/${couponCode}`)
  const commissionDoc = await commissionRef.get()
  if (!commissionDoc.exists) {
    return res.status(404).send(errorHtml(`Commission not found for ${couponCode}`))
  }
  const commission = commissionDoc.data()
  const pendingAmount = commission.pendingPayout || 0
  if (pendingAmount <= 0) {
    return res.status(200).send(infoHtml(`Already paid`, `${couponCode} has no pending payout (already marked).`))
  }

  // markPaid 박기
  await commissionRef.update({
    pendingPayout: 0,
    lastPaidOutAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  // payouts subcollection 박힌 거 박기
  await commissionRef.collection('payouts').add({
    amount: pendingAmount,
    method: commission.payoutMethod || 'manual',
    txId: 'manual-' + Date.now(),
    status: 'paid',
    markedBy: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  console.log(`[markPaid] ${couponCode} marked as paid ($${pendingAmount.toFixed(2)})`)

  res.status(200).send(infoHtml(
    'Marked as Paid ✓',
    `<strong>${escapeHtml(couponCode)}</strong> · $${pendingAmount.toFixed(2)} paid out.<br>The partner's dashboard now shows this in their payout history.`,
    true
  ))
})

function errorHtml(message) {
  return `<html><body style="font-family:-apple-system,sans-serif;text-align:center;padding:60px 20px;background:#fef2f2;">
    <h1 style="color:#dc2626;font-size:24px;">⚠ Error</h1>
    <p style="font-size:14px;color:#666;">${escapeHtml(message)}</p>
  </body></html>`
}

function infoHtml(title, body, success) {
  const color = success ? '#10b981' : '#3b82f6'
  return `<html><body style="font-family:-apple-system,sans-serif;text-align:center;padding:60px 20px;background:#f9fafb;">
    <h1 style="color:${color};font-size:28px;">${escapeHtml(title)}</h1>
    <p style="font-size:14px;color:#374151;line-height:1.7;max-width:480px;margin:16px auto;">${body}</p>
    <p style="font-size:11px;color:#9ca3af;margin-top:32px;">You can close this tab.</p>
  </body></html>`
}

// ─── Cleanup (test data 정리용, 일회성) ───
// 출시 전 partners / commissions / partner_sessions / admin_tokens / FastSpring coupons 정리.
// secret token 으로만 호출 가능. 출시 후 endpoint 비활성 권장.
exports.cleanupPartnersData = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 540,
    memory: '512MiB',
    secrets: [cleanupSecret, fastspringApiUsername, fastspringApiPassword],
    cors: false,
    invoker: 'public',
  },
  async (req, res) => {
    // 보안 검증
    const provided = String(req.query?.token || req.body?.token || req.get('x-cleanup-secret') || '')
    const expected = cleanupSecret.value()
    if (!expected || provided !== expected) {
      return res.status(401).json({ error: 'unauthorized' })
    }

    const result = {
      partnersDeleted: 0,
      commissionsDeleted: 0,
      transactionsDeleted: 0,
      payoutsDeleted: 0,
      sessionsDeleted: 0,
      adminTokensDeleted: 0,
      simAllowedUsersDeleted: 0,
      fsCouponsDeleted: 0,
      errors: [],
    }

    const dbAdmin = admin.firestore()

    // 1. partners 컬렉션 — 모든 신청 삭제
    try {
      const snap = await dbAdmin.collection('partners').get()
      for (const doc of snap.docs) {
        await doc.ref.delete()
        result.partnersDeleted++
      }
    } catch (err) {
      result.errors.push(`partners: ${err.message}`)
    }

    // 2. commissions 컬렉션 + subcollections — FastSpring 삭제 대상도 수집
    const couponCodesToDelete = []
    try {
      const snap = await dbAdmin.collection('commissions').get()
      for (const doc of snap.docs) {
        couponCodesToDelete.push(doc.id)
        // transactions subcollection
        try {
          const txSnap = await doc.ref.collection('transactions').get()
          for (const tx of txSnap.docs) {
            await tx.ref.delete()
            result.transactionsDeleted++
          }
        } catch (_) {}
        // payouts subcollection
        try {
          const pSnap = await doc.ref.collection('payouts').get()
          for (const p of pSnap.docs) {
            await p.ref.delete()
            result.payoutsDeleted++
          }
        } catch (_) {}
        await doc.ref.delete()
        result.commissionsDeleted++
      }
    } catch (err) {
      result.errors.push(`commissions: ${err.message}`)
    }

    // 3. partner_sessions
    try {
      const snap = await dbAdmin.collection('partner_sessions').get()
      for (const doc of snap.docs) {
        await doc.ref.delete()
        result.sessionsDeleted++
      }
    } catch (err) {
      result.errors.push(`partner_sessions: ${err.message}`)
    }

    // 4. admin_tokens
    try {
      const snap = await dbAdmin.collection('admin_tokens').get()
      for (const doc of snap.docs) {
        await doc.ref.delete()
        result.adminTokensDeleted++
      }
    } catch (err) {
      result.errors.push(`admin_tokens: ${err.message}`)
    }

    // 5. Phase 2 시뮬용 allowed_users (kshwood100+phase2test@gmail.com)
    // 다른 진짜 사용자 데이터는 절대 삭제 안 함 — gmail alias (+) 만 대상
    try {
      const snap = await dbAdmin.collection('allowed_users').get()
      for (const doc of snap.docs) {
        const email = doc.id
        if (email.includes('+') && email.startsWith('kshwood100+')) {
          await doc.ref.delete()
          result.simAllowedUsersDeleted++
        }
      }
    } catch (err) {
      result.errors.push(`allowed_users(sim): ${err.message}`)
    }

    // 6. FastSpring 쿠폰 삭제 (commissions 에서 수집한 coupon code)
    const username = fastspringApiUsername.value()
    const password = fastspringApiPassword.value()
    if (username && password && couponCodesToDelete.length > 0) {
      const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
      for (const couponCode of couponCodesToDelete) {
        try {
          const response = await fetch(`https://api.fastspring.com/coupons/${encodeURIComponent(couponCode)}`, {
            method: 'DELETE',
            headers: { 'Authorization': authHeader },
          })
          if (response.ok || response.status === 404) {
            result.fsCouponsDeleted++
          } else {
            const errText = await response.text().catch(() => '')
            result.errors.push(`fs ${couponCode}: ${response.status} ${errText.slice(0, 100)}`)
          }
        } catch (err) {
          result.errors.push(`fs ${couponCode}: ${err.message}`)
        }
      }
    }

    console.log('[cleanup] done:', JSON.stringify(result))
    res.status(200).json({ ok: true, ...result })
  }
)

