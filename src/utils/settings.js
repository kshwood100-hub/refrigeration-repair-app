const KEY = 'rfg_settings'

const DEFAULTS = {
  unitKey: 'bar',
  isGauge: true,
  claudeApiKey: '',
}

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY)) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(patch) {
  const current = loadSettings()
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch }))
}
