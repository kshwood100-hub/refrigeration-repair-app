const { setGlobalOptions } = require('firebase-functions')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

setGlobalOptions({ maxInstances: 10 })

const openaiApiKey = defineSecret('OPENAI_API_KEY')

exports.scanCard = onRequest(
  { secrets: [openaiApiKey], cors: true, invoker: 'public', timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const { base64, mediaType } = req.body
    const apiKey = openaiApiKey.value()

    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
      return
    }

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
        res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
        return
      }
      const data = await response.json()
      res.status(200).json(data)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

exports.classifyKnowhow = onRequest(
  { secrets: [openaiApiKey], cors: true, invoker: 'public' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    const { transcript } = req.body
    const apiKey = openaiApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
      return
    }

    const promptText = `냉동기 수리 노하우를 아래 형식 JSON으로 정리해줘. JSON만 반환.\n\n"${transcript}"\n\n{"title":"한줄 제목","category":"압축기/냉매/전기/팬/착상/결로/소음/기타 중 하나","location":"압축기/응축기/증발기/전기패널/배관·냉매/팬·모터/컨트롤러/기타 중 하나","symptoms":"증상 키워드들 (콤마로 구분)","cause":"원인 설명","checkSteps":"1. 점검 순서\\n2. 다음 단계\\n3. ...","solution":"해결 방법","parts":"교체 부품 (없으면 빈값)","notes":"추가 메모 (없으면 빈값)"}`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: promptText }],
          response_format: { type: 'json_object' },
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
        return
      }
      const data = await response.json()
      res.status(200).json(data)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

exports.classify = onRequest(
  { secrets: [openaiApiKey], cors: true, invoker: 'public', timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    const { transcript } = req.body
    const apiKey = openaiApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
      return
    }

    const promptText = `냉동기 수리 현장에서 기사가 말한 내용이야. 아래 항목으로 분류해서 JSON만 반환해. 설명 없이 JSON만.\n\n"${transcript}"\n\n형식:\n{"symptom":"증상(고객설명)","diagnosis":"진단결과","materials":"자재목록(줄바꿈으로 구분)","workDone":"수리내용","notes":"기타사항"}\n\n해당 내용이 없으면 빈 문자열로.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: promptText }],
          response_format: { type: 'json_object' },
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
        return
      }
      const data = await response.json()
      res.status(200).json(data)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

exports.whisper = onRequest(
  { secrets: [openaiApiKey], cors: true, invoker: 'public', timeoutSeconds: 300, memory: '512MiB' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    const apiKey = openaiApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
      return
    }

    const { base64, mimeType, language } = req.body
    if (!base64) {
      res.status(400).json({ error: 'audio base64 missing' })
      return
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
        res.status(response.status).json({ error: err?.error?.message ?? `Whisper API ${response.status}` })
        return
      }
      const data = await response.json()
      res.status(200).json({ text: data.text ?? '' })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

exports.scanEquipment = onRequest(
  { secrets: [openaiApiKey], cors: true, invoker: 'public', timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    const apiKey = openaiApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
      return
    }

    const { base64, mediaType, lang } = req.body
    if (!base64) {
      res.status(400).json({ error: 'image base64 missing' })
      return
    }

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
        res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
        return
      }
      const data = await response.json()
      res.status(200).json(data)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

exports.scanInvoice = onRequest(
  { secrets: [openaiApiKey], cors: true, invoker: 'public', timeoutSeconds: 120 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    const apiKey = openaiApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
      return
    }

    const { base64, mediaType } = req.body
    if (!base64) {
      res.status(400).json({ error: 'image base64 missing' })
      return
    }

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
        res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
        return
      }
      const data = await response.json()
      res.status(200).json(data)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)

exports.extractKnowhow = onRequest(
  { secrets: [openaiApiKey], cors: true, invoker: 'public', timeoutSeconds: 60 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    const { job } = req.body
    const apiKey = openaiApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
      return
    }

    const text = [
      job?.symptom    && `증상: ${job.symptom}`,
      job?.diagnosis  && `진단: ${job.diagnosis}`,
      job?.materials  && `자재: ${job.materials}`,
      job?.workDone   && `수리내용: ${job.workDone}`,
      job?.notes      && `메모: ${job.notes}`,
    ].filter(Boolean).join('\n')

    const promptText = `냉동기 수리 기록에서 핵심 노하우를 추출해줘. JSON만 반환해.\n\n${text}\n\n형식:\n{"title":"한줄 제목","category":"증상 분류(예:압축기/냉매/전기/팬/착상/결로/기타)","content":"핵심 노하우 (원인+해결책 위주로 3~5줄)","tags":"태그1,태그2,태그3"}`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: promptText }],
          response_format: { type: 'json_object' },
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
        return
      }
      const data = await response.json()
      res.status(200).json(data)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }
)
