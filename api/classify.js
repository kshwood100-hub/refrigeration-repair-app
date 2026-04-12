export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { transcript } = req.body
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `냉동기 수리 현장에서 기사가 말한 내용이야. 아래 항목으로 분류해서 JSON만 반환해. 설명 없이 JSON만.\n\n"${transcript}"\n\n형식:\n{"symptom":"증상(고객설명)","diagnosis":"진단결과","materials":"자재목록(줄바꿈으로 구분)","workDone":"수리내용","notes":"기타사항"}\n\n해당 내용이 없으면 빈 문자열로.`,
          }],
        }],
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
  }

  const data = await response.json()
  return res.status(200).json(data)
}
