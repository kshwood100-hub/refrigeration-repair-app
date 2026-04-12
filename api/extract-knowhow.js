export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { job, customer } = req.body
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })

  const text = [
    job.symptom    && `증상: ${job.symptom}`,
    job.diagnosis  && `진단: ${job.diagnosis}`,
    job.materials  && `자재: ${job.materials}`,
    job.workDone   && `수리내용: ${job.workDone}`,
    job.notes      && `메모: ${job.notes}`,
  ].filter(Boolean).join('\n')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `냉동기 수리 기록에서 핵심 노하우를 추출해줘. JSON만 반환해.\n\n${text}\n\n형식:\n{"title":"한줄 제목","category":"증상 분류(예:압축기/냉매/전기/팬/착상/결로/기타)","content":"핵심 노하우 (원인+해결책 위주로 3~5줄)","tags":"태그1,태그2,태그3"}`,
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
