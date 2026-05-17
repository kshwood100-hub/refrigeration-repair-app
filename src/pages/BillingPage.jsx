import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, FileText, Check, Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { showToast } from '../utils/toast'
import { loadSettings } from '../utils/settings'
import { todayLocal } from '../utils/date'
import { pushCollection } from '../utils/cloudSync'

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

// 13종 비용 항목 키 (사용자 명시 순서)
// type: positive=양수합산, discount=차감, tax=자동계산(readonly)
const POSITIVE_KEYS = ['generalRevenue','diagnosisFee','emergencyFee','maintenanceFee','demolitionFee','rentalFee','deliveryFee','partsCost','laborCost','travelCost','otherCost']

function buildFields(t) {
  return [
    { key: 'generalRevenue',  label: t('billing.generalRevenue'),  type: 'positive' },
    { key: 'diagnosisFee',    label: t('billing.diagnosisFee'),    type: 'positive' },
    { key: 'emergencyFee',    label: t('billing.emergencyFee'),    type: 'positive' },
    { key: 'maintenanceFee',  label: t('billing.maintenanceFee'),  type: 'positive' },
    { key: 'demolitionFee',   label: t('billing.demolitionFee'),   type: 'positive' },
    { key: 'rentalFee',       label: t('billing.rentalFee'),       type: 'positive' },
    { key: 'deliveryFee',     label: t('billing.deliveryFee'),     type: 'positive' },
    { key: 'partsCost',       label: t('billing.partsCost'),       type: 'positive' },
    { key: 'laborCost',       label: t('billing.laborCost'),       type: 'positive' },
    { key: 'travelCost',      label: t('billing.travelCost'),      type: 'positive' },
    { key: 'discount',        label: t('billing.discount'),        type: 'discount' },
    { key: 'taxAmount',       label: t('billing.taxAmount'),       type: 'tax', readonly: true },
    { key: 'otherCost',       label: t('billing.otherCost'),       type: 'positive' },
  ]
}

// 합계 계산: cost = (양수 11종 합) - 할인 + 세금
// 세금 = (양수합 - 할인) × taxRate / 100 (음수 방지)
function calcAmounts(values, taxRate) {
  const posSum = POSITIVE_KEYS.reduce((s, k) => s + (Number(values[k]) || 0), 0)
  const discount = Number(values.discount) || 0
  const subtotal = Math.max(0, posSum - discount)
  const taxAmount = Math.round(subtotal * ((Number(taxRate) || 0) / 100))
  const cost = posSum - discount + taxAmount
  return { posSum, discount, subtotal, taxAmount, cost }
}

export default function BillingPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t, i18n } = useTranslation()

  // 신규 모드: id 없으면 회계 → 매출 등록 진입 (거래처 선택 + 신규 service_jobs add)
  const isNew = !id
  const FIELDS = buildFields(t)
  const settings = loadSettings()
  const taxRate = Number(settings.taxRate) || 0

  const job = useLiveQuery(() => isNew ? null : db.service_jobs.get(Number(id)), [id, isNew])
  const [saving, setSaving] = useState(false)

  // 신규 모드 전용 state
  const [newCustomerId, setNewCustomerId] = useState(null)
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [newValues, setNewValues] = useState({}) // 13종 입력값 (신규 모드)

  const customers = useLiveQuery(
    () => isNew ? db.customers.filter((r) => !r.deletedAt).toArray() : null, [isNew]
  )

  // 기존 모드: 데이터 로딩 중 표시
  if (!isNew && !job) return <div className="p-4 text-gray-400 text-sm">{t('logs.loading')}</div>

  // 라이브 합계 계산 — 신규 모드는 newValues, 기존 모드는 job에서
  const sourceValues = isNew ? newValues : job
  const { taxAmount: liveTax, cost: liveCost } = calcAmounts(sourceValues, taxRate)

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

  // 기존 모드: 필드 변경 시 자동 세금 + cost 갱신 (DB 직접 패치)
  async function patchExisting(key, value) {
    const cur = await db.service_jobs.get(Number(id))
    const merged = { ...cur, [key]: parseAmount(value) }
    const { taxAmount, cost } = calcAmounts(merged, taxRate)
    await db.service_jobs.update(Number(id), {
      [key]: parseAmount(value),
      taxAmount,
      cost,
      updatedAt: new Date().toISOString(),
    })
  }

  // 신규 모드: 필드 변경 시 state만 갱신 (저장 시 한 번에 add)
  function patchNew(key, value) {
    setNewValues((p) => ({ ...p, [key]: parseAmount(value) }))
  }

  // "저장" 버튼: 두 모드 분기
  async function handleSave() {
    if (saving) return
    if (isNew && !newCustomerId) {
      showToast(t('billing.customerRequired'))
      return
    }
    setSaving(true)
    try {
      const inputs = document.querySelectorAll('[data-billing-field]')
      const update = {}
      inputs.forEach((input) => {
        const key = input.getAttribute('data-billing-field')
        update[key] = parseAmount(input.value)
      })
      const { taxAmount, cost } = calcAmounts(update, taxRate)
      update.taxAmount = taxAmount
      update.cost = cost
      update.updatedAt = new Date().toISOString()

      if (isNew) {
        // 신규 모드: service_jobs 신규 add (status=completed, 거래처 박힘, 오늘 날짜)
        const now = new Date().toISOString()
        const newJobId = await db.service_jobs.add({
          ...update,
          customerId: newCustomerId,
          status: 'completed',
          receiptDate: todayLocal(),
          completedAt: now,
          createdAt: now,
        })
        pushCollection('service_jobs').catch(() => {})
        showToast(t('billing.saved'))
        navigate(`/service/${newJobId}/receipt`, { replace: true })
      } else {
        // 기존 모드: AS의 cost 업데이트
        await db.service_jobs.update(Number(id), update)
        pushCollection('service_jobs').catch(() => {})
        showToast(t('billing.saved'))
      }
    } catch (e) {
      console.error('Billing save failed:', e)
      showToast(t('billing.saved') + ' (error: ' + (e?.message || e) + ')')
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
    const [intPart, decPart] = raw.split(decimalSep)
    const intNum = intPart ? Number(intPart.replace(/,/g, '').replace(/\./g, '')) : 0
    const intFormatted = intPart ? new Intl.NumberFormat(locale).format(intNum) : ''
    e.target.value = decPart !== undefined ? `${intFormatted}${decimalSep}${decPart}` : intFormatted
    if (cursorAtEnd) e.target.setSelectionRange(e.target.value.length, e.target.value.length)
  }

  const selectedCustomer = isNew && newCustomerId
    ? customers?.find((c) => c.id === newCustomerId)
    : null

  return (
    <div className="p-4 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {isNew ? t('billing.backToFinance') : t('billing.backToJob')}
      </button>

      {/* 신규 모드: 거래처 드롭다운 (필수) */}
      {isNew && (
        <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {t('billing.selectCustomerSection')}
          </p>
          {customers && customers.length === 0 ? (
            <button
              onClick={() => navigate('/service')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-100 border-2 border-amber-400 text-amber-900 text-sm font-semibold rounded-xl active:bg-amber-200"
            >
              <Building2 size={16} strokeWidth={2} />
              {t('knowhow.customerNoneAdd')}
            </button>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setShowCustomerList((v) => !v)}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm bg-white border-2 rounded-lg outline-none text-left ${newCustomerId ? 'border-blue-400 text-gray-900 font-medium' : 'border-gray-300 text-gray-500'}`}
              >
                <Building2 size={16} strokeWidth={2} className={newCustomerId ? 'text-blue-600' : 'text-gray-400'} />
                <span className="flex-1 truncate">
                  {selectedCustomer?.name ?? t('billing.selectCustomer')}
                </span>
                <span className="text-gray-400 text-xs">{showCustomerList ? '▲' : '▼'}</span>
              </button>

              {showCustomerList && (
                <div className="mt-1 border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder={t('billing.selectCustomer')}
                    className="w-full px-3 py-2.5 text-sm border-b border-gray-200 outline-none"
                  />
                  <div className="max-h-48 overflow-y-auto">
                    {customers
                      ?.filter((c) => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()))
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setNewCustomerId(c.id)
                            setShowCustomerList(false)
                            setCustomerSearch('')
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm border-b border-gray-100 last:border-b-0 active:bg-blue-50 ${newCustomerId === c.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700'}`}
                        >
                          {c.name}
                          {c.phone && <span className="text-xs text-gray-400 ml-2">{c.phone}</span>}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{t('billing.sectionTitle')}</p>

        {FIELDS.map(({ key, label, type, readonly }) => {
          // 세금: 자동 계산 결과 표시 (readonly)
          const sourceVal = isNew ? newValues[key] : job?.[key]
          const displayValue = key === 'taxAmount' ? formatInput(liveTax) : formatInput(sourceVal)
          const labelClass = type === 'discount' ? 'text-amber-600' : type === 'tax' ? 'text-blue-600' : 'text-gray-400'
          return (
            <div key={key}>
              <label className={`text-xs block mb-1 ${labelClass}`}>
                {label}
                {type === 'discount' && <span className="ml-1 text-[10px] text-amber-500">({t('billing.discountHint')})</span>}
                {type === 'tax' && <span className="ml-1 text-[10px] text-blue-500">({t('billing.taxAutoHint', { rate: taxRate })})</span>}
              </label>
              <input
                type="text"
                inputMode="decimal"
                key={`${key}-${id || 'new'}-${readonly ? liveTax : ''}`}
                defaultValue={displayValue}
                onInput={readonly ? undefined : handleInput}
                onBlur={readonly ? undefined : (e) => isNew ? patchNew(key, e.target.value) : patchExisting(key, e.target.value)}
                readOnly={!!readonly}
                placeholder="0"
                data-billing-field={key}
                className={`w-full text-sm border rounded-lg px-3 py-2 outline-none ${readonly ? 'bg-gray-50 border-gray-200 text-gray-600' : 'border-gray-300 focus:border-blue-400'}`}
              />
            </div>
          )
        })}

        <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-base font-bold">
          <span className="text-gray-500">{t('billing.total')}</span>
          <span className="text-gray-900">{formatAmount(liveCost, i18n.language)}</span>
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

      {!isNew && (
        <button
          onClick={() => navigate(`/service/${id}/receipt`)}
          className="mt-2 w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-blue-700"
        >
          <FileText size={16} strokeWidth={2} />
          {t('billing.issueReceipt')}
        </button>
      )}
    </div>
  )
}
