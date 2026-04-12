export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { transcript } = req.body
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `냉동기 수리 노하우를 아래 형식 JSON으로 정리해줘. JSON만 반환.\n\n"${transcript}"\n\n{"title":"한줄 제목","category":"압축기/냉매/전기/팬/착상/결로/소음/기타 중 하나","location":"압축기/응축기/증발기/전기패널/배관·냉매/팬·모터/컨트롤러/기타 중 하나","symptoms":"증상 키워드들 (콤마로 구분)","cause":"원인 설명","checkSteps":"1. 점검 순서\\n2. 다음 단계\\n3. ...","solution":"해결 방법","parts":"교체 부품 (없으면 빈값)","notes":"추가 메모 (없으면 빈값)"}`,
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
