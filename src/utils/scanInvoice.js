import { apiFetch } from './apiClient'

export async function scanInvoice(dataUrl) {
  const base64    = dataUrl.split(',')[1]
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'

  const data = await apiFetch('/api/scan-invoice', { base64, mediaType })
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI parse failed')
  return JSON.parse(match[0])
}
