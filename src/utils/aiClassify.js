import i18n from '../i18n'
import { apiFetch } from './apiClient'

export async function classifyRepairNote(transcript) {
  const data = await apiFetch('/api/classify', { transcript })
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(i18n.t('error.aiParseFailed'))
  return JSON.parse(match[0])
}
