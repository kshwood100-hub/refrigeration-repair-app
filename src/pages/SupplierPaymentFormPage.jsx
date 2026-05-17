import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Save } from 'lucide-react'
import { db } from '../db'
import DateInput from '../components/DateInput'
import { todayLocal } from '../utils/date'
import { consumeTrial } from '../utils/trial'
import { showToast } from '../utils/toast'

export default function SupplierPaymentFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const supplierId = Number(id)
  const [date, setDate] = useState(todayLocal())
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      // 트라이얼 cap — 결제내역도 회계(finance) 카테고리에 통합
      try {
        await consumeTrial('finance')
      } catch (e) {
        if (String(e?.message || e).includes('Trial limit')) {
          showToast(t('trial.limitTitle'))
          setSaving(false)
          return
        }
      }
      await db.supplier_transactions.add({
        supplierId,
        type: 'payment',
        date,
        total: amount ? Number(amount) : null,
        memo,
        createdAt: new Date().toISOString(),
      })
      navigate(`/suppliers/${supplierId}`)
    } catch (e) {
      console.error('Payment save failed:', e)
      setSaving(false)
    }
  }

  const display = amount ? Number(amount).toLocaleString() : ''

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('supplier.back')}
      </button>

      <h1 className="text-xl font-bold mb-4 text-gray-900">{t('payment.addTitle')}</h1>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('tx.dateLabelPayment')}</label>
          <DateInput value={date} onChange={setDate} />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('tx.totalLabelPayment')}</label>
          <input
            type="text"
            inputMode="numeric"
            value={display}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="0"
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-base text-emerald-600 font-semibold outline-none focus:border-blue-500 text-right"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('tx.field.memo')}</label>
          <textarea
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={t('tx.field.memoPaymentPlaceholder')}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !amount}
        className={`mt-6 w-full flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-xl ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 active:bg-emerald-700 disabled:opacity-50'}`}
      >
        <Save size={16} strokeWidth={2} />
        {saving ? t('common.saving') : t('supplier.save')}
      </button>
    </div>
  )
}
