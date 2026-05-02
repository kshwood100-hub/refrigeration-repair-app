import i18n from '../i18n'
import { apiFetch } from './apiClient'

export async function scanBusinessCard(dataUrl) {
  const base64    = dataUrl.split(',')[1]
  const mediaType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'

  const data = await apiFetch('/api/scan-card', { base64, mediaType })
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(i18n.t('error.aiParseFailed'))
  return JSON.parse(match[0])
}
