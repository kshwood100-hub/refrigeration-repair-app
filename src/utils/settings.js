const KEY = 'rfg_settings'

const DEFAULTS = {
  unitKey: 'bar',
  isGauge: true,
  theme: 'dark',
  fontSize: 'medium',
  bizName: '',
  bizOwner: '',
  bizPhone: '',
  bizAddress: '',
  bizRegNo: '',
  userTier: 'free', // free | paid | group
  shareConsent: false, // 결제 후 ShareConsentModal에서 동의 시 true. 설정에서 언제든 변경 가능.
  taxRate: 0, // 매출 등록 시 세금 자동 계산용 세율 (%) — 사용자가 자기 나라 세율 직접 입력
}

export function loadSettings() {
  try {
    const merged = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }
    // 폐기된 'lavender' 테마는 dark로 자동 마이그레이션
    if (merged.theme === 'lavender') merged.theme = 'dark'
    return merged
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(patch) {
  const current = loadSettings()
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }))
}
