export async function classifyRepairNote(transcript, apiKey) {
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
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `냉동기 수리 현장에서 기사가 말한 내용이야. 아래 항목으로 분류해서 JSON만 반환해. 설명 없이 JSON만.\n\n"${transcript}"\n\n형식:\n{"symptom":"증상(고객설명)","diagnosis":"진단결과","materials":"자재목록(줄바꿈으로 구분)","workDone":"수리내용","notes":"기타사항"}\n\n해당 내용이 없으면 빈 문자열로.`,
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `API 오류 ${res.status}`)
  }

  const data = await res.json()
  const text = data.content[0].text.trim()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답을 파싱할 수 없습니다.')
  return JSON.parse(match[0])
}
