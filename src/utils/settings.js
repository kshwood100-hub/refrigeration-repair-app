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
  shareConsent: false, // v2 가동 시까지 비활성, UI는 잠금 상태로 표시
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
