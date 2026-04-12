const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function scanBusinessCardGemini(dataUrl) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API 키가 설정되지 않았습니다.')

  const base64    = dataUrl.split(',')[1]
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mediaType, data: base64 } },
            {
              text: 'Extract all text from this business card image and return JSON only.\nFormat: {"name":"","company":"","title":"","phone":"","mobile":"","email":"","address":"","memo":""}\nEmpty string for missing fields. For phone numbers include country code if shown.',
            },
          ],
        }],
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Gemini API 오류 ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답 파싱 실패')
  return JSON.parse(match[0])
}
