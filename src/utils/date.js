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

// 자국 주 시작 요일 (0=일..6=토) — 유럽 월요일, 미국·한국 일요일, 중동 토요일 등 자동
// 미지원 브라우저(구형 iOS<17·Firefox)는 0(일요일)로 안전 폴백
export function getWeekStart(lang) {
  try {
    const loc = new Intl.Locale(lang || 'en')
    const info = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo
    const fd = info && info.firstDay // 1=월..7=일
    return fd ? (fd === 7 ? 0 : fd) : 0
  } catch { return 0 }
}
