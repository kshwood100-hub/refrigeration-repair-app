export async function extractKnowhow(job, customer, apiKey) {
  const text = [
    job.symptom    && `증상: ${job.symptom}`,
    job.diagnosis  && `진단: ${job.diagnosis}`,
    job.materials  && `자재: ${job.materials}`,
    job.workDone   && `수리내용: ${job.workDone}`,
    job.notes      && `메모: ${job.notes}`,
  ].filter(Boolean).join('\n')

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
        content: `냉동기 수리 기록에서 핵심 노하우를 추출해줘. JSON만 반환해.\n\n${text}\n\n형식:\n{"title":"한줄 제목","category":"증상 분류(예:압축기/냉매/전기/팬/착상/결로/기타)","content":"핵심 노하우 (원인+해결책 위주로 3~5줄)","tags":"태그1,태그2,태그3"}`,
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `API 오류 ${res.status}`)
  }

  const data = await res.json()
  const match = data.content[0].text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('AI 응답 파싱 실패')
  return JSON.parse(match[0])
}
