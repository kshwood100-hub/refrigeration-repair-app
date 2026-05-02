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

const ALLOWED_ORIGINS = new Set([
  'https://www.r-pro.app',
  'https://r-pro.app',
  'https://r-pro-6cb33.web.app',
  'https://r-pro-6cb33.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:4173',
])

const MAX_BASE64_BYTES = 10 * 1024 * 1024  // 10MB
const MAX_TEXT_LEN = 20000                  // transcript/job text

// 사용자별 일일 호출 한도 (UTC 자정 기준 리셋)
// 정상 사용량 대비 충분히 넉넉. 악용·자동 스크립트 차단 목적.
const DAILY_LIMITS = {
  scanCard: 100,
  scanEquipment: 100,
  scanInvoice: 100,
  whisper: 100,
  classify: 200,
  classifyKnowhow: 200,
  extractKnowhow: 200,
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
  'classify', 'classifyKnowhow', 'extractKnowhow',
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

// 트라이얼 사용자에 한해 카테고리별 누적 카운터 체크. 정식 가입자(trial_until 만료/없음)는 통과.
// Firestore: usage/{email}/trial/total — { ai: 0, jobs: 0, customers: 0, finance: 0, logs: 0 }
async function checkTrialQuota(decoded, category, res) {
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
  const promptText = 'Extract all text from this business card image and return JSON only.\nFormat: {"name":"","company":"","title":"","phone":"","mobile":"","email":"","address":"","memo":""}\nEmpty string for missing fields. For phone numbers include country code if shown.'

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
        max_tokens: 500,
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

exports.extractKnowhow = onRequest(fnOpts({ timeoutSeconds: 60 }), async (req, res) => {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const decoded = await verifyAuth(req, res)
  if (!decoded) return
  if (!(await checkQuota(decoded, 'extractKnowhow', res))) return

  const { job } = req.body || {}
  if (!job || typeof job !== 'object') {
    return res.status(400).json({ error: 'job missing' })
  }
  const apiKey = openaiApiKey.value()
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })

  const text = [
    job?.symptom    && `증상: ${job.symptom}`,
    job?.diagnosis  && `진단: ${job.diagnosis}`,
    job?.materials  && `자재: ${job.materials}`,
    job?.workDone   && `수리내용: ${job.workDone}`,
    job?.notes      && `메모: ${job.notes}`,
  ].filter(Boolean).join('\n')

  if (text.length > MAX_TEXT_LEN) {
    return res.status(413).json({ error: 'job too long' })
  }

  const promptText = `냉동기 수리 기록에서 핵심 노하우를 추출해줘. JSON만 반환해.\n\n${text}\n\n형식:\n{"title":"한줄 제목","category":"증상 분류(예:압축기/냉매/전기/팬/착상/결로/기타)","content":"핵심 노하우 (원인+해결책 위주로 3~5줄)","tags":"태그1,태그2,태그3"}`

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
            break
          }
          case 'subscription.charge.completed': {
            await userRef.set({
              trial_until: admin.firestore.FieldValue.delete(),
              lastChargeAt: admin.firestore.FieldValue.serverTimestamp(),
              ...(accountUrl ? { manageUrl: accountUrl } : {}),
            }, { merge: true })
            console.log(`[webhook] ${type} → trial cleared ${email}`)
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
          case 'order.refunded': {
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
