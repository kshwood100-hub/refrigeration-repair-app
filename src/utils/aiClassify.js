import { apiFetch } from './apiClient'

export async function classifyRepairNote(transcript) {
  const data = await apiFetch('/api/classify', { transcript })
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답을 파싱할 수 없습니다.')
  return JSON.parse(match[0])
}
