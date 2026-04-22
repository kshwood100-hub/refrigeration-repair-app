import i18n from '../i18n'

export async function scanEquipment(dataUrl) {
  const base64    = dataUrl.split(',')[1]
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'
  const lang      = i18n.language?.slice(0, 2) || 'en'

  const res = await fetch('/api/scan-equipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64, mediaType, lang }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error ?? `API ${res.status}`)
  }

  const data    = await res.json()
  const content = data.choices?.[0]?.message?.content ?? ''
  const match   = content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI response parsing failed')
  return JSON.parse(match[0])
}
