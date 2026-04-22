export async function scanBusinessCard(dataUrl) {
  const base64    = dataUrl.split(',')[1]
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'

  const res = await fetch('/api/scan-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mediaType }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `API 오류 ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답 파싱 실패')
  return JSON.parse(match[0])
}
