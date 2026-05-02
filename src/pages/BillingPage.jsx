import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, FileText, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { showToast } from '../utils/toast'

const LOCALE_MAP = {
  ko: { locale: 'ko-KR', currency: 'KRW', suffix: '원' },
  en: { locale: 'en-US', currency: 'USD', suffix: '' },
  zh: { locale: 'zh-CN', currency: 'CNY', suffix: '' },
  ja: { locale: 'ja-JP', currency: 'JPY', suffix: '' },
  es: { locale: 'es-ES', currency: 'EUR', suffix: '' },
  hi: { locale: 'hi-IN', currency: 'INR', suffix: '' },
}

function formatAmount(amount, lang) {
  const { locale, currency, suffix } = LOCALE_MAP[lang] ?? LOCALE_MAP['ko']
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'KRW' || currency === 'JPY' ? 0 : 2,
  }).format(amount)
  return suffix ? `${new Intl.NumberFormat(locale).format(amount)} ${suffix}` : formatted
}

export default function BillingPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t, i18n } = useTranslation()

  const FIELDS = [
    { key: 'partsCost',  label: t('billing.partsCost') },
    { key: 'laborCost',  label: t('billing.laborCost') },
    { key: 'travelCost', label: t('billing.travelCost') },
    { key: 'taxAmount',  label: t('billing.taxAmount') },
    { key: 'otherCost',  label: t('billing.otherCost') },
  ]

  const job = useLiveQuery(() => db.service_jobs.get(Number(id)), [id])
  const [saving, setSaving] = useState(false)

  if (!job) return <div className="p-4 text-gray-400 text-sm">{t('logs.loading')}</div>

  const total = FIELDS.reduce((sum, f) => sum + (Number(job[f.key]) || 0), 0)

  const { locale } = LOCALE_MAP[i18n.language] ?? LOCALE_MAP['ko']

  // locale 소수점 구분자(. 또는 ,)
  const decimalSep = (1.1).toLocaleString(locale).replace(/\d/g, '')

  function parseAmount(str) {
    if (!str) return 0
    let s = String(str).replace(/\s/g, '')
    if (decimalSep === ',') {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
    s = s.replace(/[^0-9.]/g, '').replace(/(\..*?)\..*/g, '$1')
    return Number(s) || 0
  }

  function formatInput(value) {
    if (value === '' || value == null) return ''
    const n = Number(value)
    if (isNaN(n)) return ''
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(n)
  }

  async function patch(key, value) {
    await db.service_jobs.update(Number(id), {
      [key]: parseAmount(value),
      updatedAt: new Date().toISOString(),
    })
  }

  // "저장" 버튼: 모든 input을 일괄 commit + 토스트로 명시적 확인
  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const inputs = document.querySelectorAll('[data-billing-field]')
      const update = { updatedAt: new Date().toISOString() }
      inputs.forEach((input) => {
        const key = input.getAttribute('data-billing-field')
        update[key] = parseAmount(input.value)
      })
      // 합계 cost 갱신 — JobDetailPage의 paid 토글 노출 조건(cost > 0)과 미결제 추적 위해 필요
      update.cost = FIELDS.reduce((sum, f) => sum + (Number(update[f.key]) || 0), 0)
      await db.service_jobs.update(Number(id), update)
      showToast(t('billing.saved'))
    } catch (e) {
      console.error('Billing save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  function handleInput(e) {
    const cursorAtEnd = e.target.selectionStart === e.target.value.length
    const allowed = decimalSep === ',' ? /[^0-9.,]/g : /[^0-9.,]/g
    let raw = e.target.value.replace(allowed, '')
    // 소수점 1개만 유지
    if (decimalSep === ',') {
      const parts = raw.split(',')
      raw = parts[0].replace(/\./g, '') + (parts.length > 1 ? ',' + parts.slice(1).join('').replace(/\./g, '') : '')
    } else {
      const parts = raw.split('.')
      raw = parts[0].replace(/,/g, '') + (parts.length > 1 ? '.' + parts.slice(1).join('').replace(/,/g, '') : '')
    }
    // 정수부만 천단위 포맷, 소수부는 그대로
    const [intPart, decPart] = raw.split(decimalSep)
    const intNum = intPart ? Number(intPart.replace(/,/g, '').replace(/\./g, '')) : 0
    const intFormatted = intPart ? new Intl.NumberFormat(locale).format(intNum) : ''
    e.target.value = decPart !== undefined ? `${intFormatted}${decimalSep}${decPart}` : intFormatted
    if (cursorAtEnd) e.target.setSelectionRange(e.target.value.length, e.target.value.length)
  }

  return (
    <div className="p-4 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('billing.backToJob')}
      </button>

      <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('billing.sectionTitle')}</p>

        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs text-gray-400 block mb-1">{label}</label>
            <input
              type="text"
              inputMode="decimal"
              key={`${key}-${id}`}
              defaultValue={formatInput(job[key])}
              onInput={handleInput}
              onBlur={(e) => patch(key, e.target.value)}
              placeholder="0"
              data-billing-field={key}
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            />
          </div>
        ))}

        <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-base font-bold">
          <span className="text-gray-500">{t('billing.total')}</span>
          <span className="text-gray-900">{formatAmount(total, i18n.language)}</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`mt-4 w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-xl ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 active:bg-emerald-700'}`}
      >
        <Check size={16} strokeWidth={2.5} />
        {saving ? t('common.saving') : t('billing.save')}
      </button>

      <button
        onClick={() => navigate(`/service/${id}/receipt`)}
        className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-blue-700"
      >
        <FileText size={16} strokeWidth={2} />
        {t('billing.issueReceipt')}
      </button>
    </div>
  )
}
