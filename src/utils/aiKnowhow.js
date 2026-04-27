import { apiFetch } from './apiClient'

export async function extractKnowhow(job, customer) {
  const data = await apiFetch('/api/extract-knowhow', { job, customer })
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답 파싱 실패')
  return JSON.parse(match[0])
}
