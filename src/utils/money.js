// 금액 표시 유틸 — 자국식 숫자 포맷 + 자국 통화 기호.
// 통화는 settings.currency(사용자 설정), 숫자 천단위는 앱 언어(i18n.language) locale.
import i18n from '../i18n'
import { loadSettings } from './settings'

// 언어별 자국 숫자 포맷 (es/vi/id=점 1.234.567, 인도=라크 12,34,567, 그 외 콤마). ar은 비즈니스 관행상 서양 숫자.
const NUM_LOCALE = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', es: 'es-ES', hi: 'en-IN', vi: 'vi-VN', th: 'th-TH', id: 'id-ID', ar: 'en-US', pt: 'pt-BR' }
const numLocale = () => NUM_LOCALE[i18n.language] || 'en-US'

// 숫자 → 자국식 천단위 (통화기호 없음)
export function fmtMoney(n) {
  const f = Number(n)
  if (!isFinite(f)) return '0'
  return f.toLocaleString(numLocale(), { maximumFractionDigits: 4 })
}

// 자국 통화 기호 (설정값, 기본 ₩)
export function getCurrency() {
  return loadSettings().currency || '₩'
}

// 금액 + 통화 (R-Pro 패턴: 숫자 뒤 통화, 예 "1,234 ₩")
export function money(n) {
  return `${fmtMoney(n)} ${getCurrency()}`
}

// 자국식 입력 문자열 → 표준 문자열(소수점은 '.', 입력 중 '12.'도 보존). 입력칸 onChange용.
// 독일/스페인(콤마=소수점·점=천단위)도 표준화. 저장 전엔 parseNum으로 숫자화.
export function parseNumInput(str) {
  if (str == null) return ''
  const sep = (1.1).toLocaleString(numLocale()).replace(/\d/g, '') // 소수점 구분자(. 또는 ,)
  let s = String(str).replace(/\s/g, '')
  if (sep === ',') {
    s = s.replace(/\./g, '').replace(/,/g, '.') // 점=천단위 제거, 콤마=소수점→'.'
  } else {
    s = s.replace(/,/g, '') // 콤마=천단위 제거
  }
  s = s.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1') // 숫자·점만, 점 1개
  return s
}

// 표준 문자열/숫자 → 입력칸 자국식 천단위 표시(소수 입력 보존). 입력칸 value용.
export function fmtNumInput(val) {
  if (val === '' || val == null) return ''
  const [intp, decp] = String(val).split('.')
  const n = Number(intp || '0')
  if (isNaN(n)) return ''
  const intFmt = n.toLocaleString(numLocale(), { maximumFractionDigits: 0 })
  if (decp === undefined) return intFmt
  const sep = (1.1).toLocaleString(numLocale()).replace(/\d/g, '') // 자국 소수점
  return `${intFmt}${sep}${decp}`
}

// 표준 문자열/숫자 → number (저장·계산용)
export function parseNum(val) {
  const n = Number(String(val).replace(/[^0-9.]/g, ''))
  return isFinite(n) ? n : 0
}

// 통화별 소수 자릿수 (원·엔·동·루피아=0, 나머지=2). 세금 등 자동계산 반올림용.
const ZERO_DECIMAL = ['₩', '¥', '円', '원', '₫', 'đ', 'Rp', 'rp']
export function currencyDecimals() {
  return ZERO_DECIMAL.includes(getCurrency()) ? 0 : 2
}

// 통화별 자릿수로 반올림 (유로/달러=센트 2자리, 원화/엔화=정수)
export function roundCurrency(n) {
  const f = 10 ** currencyDecimals()
  return Math.round((Number(n) || 0) * f) / f
}
