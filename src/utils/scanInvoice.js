export async function scanInvoice(dataUrl) {
  const base64    = dataUrl.split(',')[1]
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'

  const res = await fetch('/api/scan-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mediaType }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `API ${res.status}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI parse failed')
  return JSON.parse(match[0])
}
