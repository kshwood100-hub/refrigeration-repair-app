import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Save } from 'lucide-react'
import { db } from '../db'

export default function SupplierPaymentFormPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const supplierId = Number(id)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  async function handleSave() {
    await db.supplier_transactions.add({
      supplierId,
      type: 'payment',
      date,
      total: amount ? Number(amount) : null,
      memo,
      createdAt: new Date().toISOString(),
    })
    navigate(`/suppliers/${supplierId}`)
  }

  const display = amount ? Number(amount).toLocaleString() : ''

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-4 text-gray-600"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        <span className="text-sm">{t('supplier.back')}</span>
      </button>

      <h1 className="text-xl font-bold mb-4 text-gray-900">{t('payment.addTitle')}</h1>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">{t('tx.dateLabelPayment')}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500"
          />
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
        disabled={!amount}
        className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl active:bg-emerald-700 disabled:opacity-50"
      >
        <Save size={16} strokeWidth={2} />
        {t('supplier.save')}
      </button>
    </div>
  )
}
