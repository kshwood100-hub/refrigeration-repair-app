// 날짜 유틸 — 사용자 로컬 시간대 기준 YYYY-MM-DD
// (toISOString().slice(0,10)은 UTC 기준이라 사용자 로컬 자정 ~ UTC 자정 사이 시간대에 어제/내일로 어긋남)
// DateInput.toISO()와 동일 표준 사용 → 입력/비교 일관성 보장

function pad(n) { return String(n).padStart(2, '0') }

export function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function tomorrowLocal() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 임의 Date → 로컬 YYYY-MM-DD
export function toLocalISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
