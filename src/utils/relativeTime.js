import i18n from '../i18n'

export function relativeTime(iso) {
  if (!iso) return ''
  const t = i18n.t.bind(i18n)
  const diff = Date.now() - new Date(iso).getTime()
  const day = 24 * 60 * 60 * 1000
  if (diff < day) return t('relativeTime.today')
  if (diff < 2 * day) return t('relativeTime.yesterday')
  const days = Math.floor(diff / day)
  if (days < 7) return t('relativeTime.daysAgo', { n: days })
  if (days < 30) return t('relativeTime.weeksAgo', { n: Math.floor(days / 7) })
  if (days < 365) return t('relativeTime.monthsAgo', { n: Math.floor(days / 30) })
  return t('relativeTime.yearsAgo', { n: Math.floor(days / 365) })
}
