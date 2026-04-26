import i18n from '../i18n'
import { apiFetch } from './apiClient'

export async function scanEquipment(dataUrl) {
  const base64    = dataUrl.split(',')[1]
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'
  const lang      = i18n.language?.slice(0, 2) || 'en'

  const data    = await apiFetch('/api/scan-equipment', { base64, mediaType, lang })
  const content = data.choices?.[0]?.message?.content ?? ''
  const match   = content.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI response parsing failed')
  return JSON.parse(match[0])
}
