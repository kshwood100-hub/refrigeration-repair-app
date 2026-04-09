export async function scanBusinessCard(dataUrl, apiKey) {
  const base64 = dataUrl.split(',')[1]
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: 'Extract all text from this business card image and return JSON only.\nFormat: {"name":"","company":"","title":"","phone":"","mobile":"","email":"","address":"","memo":""}\nEmpty string for missing fields. For phone numbers include country code if shown.',
          },
        ],
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `API 오류 ${res.status}`)
  }

  const data = await res.json()
  const match = data.content[0].text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답 파싱 실패')
  return JSON.parse(match[0])
}
