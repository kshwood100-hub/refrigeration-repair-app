import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Trash2, AlertTriangle } from 'lucide-react'
import { db } from '../db'
import { softDelete } from '../utils/cloudSync'
import { money } from '../utils/money'

export default function SupplierTransactionDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const tx = useLiveQuery(async () => {
    const r = await db.supplier_transactions.get(Number(id))
    return r?.deletedAt ? null : r
  }, [id])
  const [confirming, setConfirming] = useState(false)

  if (!tx) return <div className="p-4 text-gray-400 text-sm">{t('common.loading')}</div>

  async function handleDelete() {
    await softDelete('supplier_transactions', Number(id))
    navigate(`/suppliers/${tx.supplierId}`)
  }

  const fmt = (n) => (n == null || n === '' ? '-' : money(n))
  const items = tx.items ?? []
  const isPayment = tx.type === 'payment'

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('supplier.back')}
      </button>

      {tx.invoicePhoto && !isPayment && (
        <img
          src={tx.invoicePhoto}
          alt=""
          className="w-full mb-4 rounded-xl border border-gray-300"
        />
      )}

      <div className="bg-white border border-gray-300 rounded-xl p-4 mb-4 text-sm shadow-sm">
        <div className="flex justify-between mb-3">
          <span className="text-gray-500">{isPayment ? t('tx.dateLabelPayment') : t('tx.dateLabel')}</span>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPayment ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {isPayment ? t('tx.paymentLabel') : t('tx.purchaseLabel')}
            </span>
            <span className="text-gray-700">{tx.date || '-'}</span>
          </div>
        </div>

        {items.length > 0 && (
          <div className="mb-3 -mx-1">
            <div className="grid grid-cols-[1fr_60px_90px] gap-1 text-[10px] text-gray-400 px-1 py-1 border-b border-gray-200">
              <span>{t('tx.tableName')}</span>
              <span className="text-right">{t('tx.tableQty')}</span>
              <span className="text-right">{t('tx.tablePrice')}</span>
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_90px] gap-1 text-xs px-1 py-1.5 border-b border-gray-100">
                <span className="text-gray-700 break-all">{it.name || '-'}</span>
                <span className="text-right text-gray-600">{it.qty || '-'}</span>
                <span className="text-right text-amber-700 font-medium">{fmt(it.price)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5 pt-2">
          {!isPayment && (
            <>
              <Row k={t('tx.field.subtotal')} v={fmt(tx.subtotal)} />
              <Row k={t('tx.field.tax')}      v={fmt(tx.tax)} />
            </>
          )}
          <Row k={isPayment ? t('tx.totalLabelPayment') : t('tx.totalLabelPurchase')} v={fmt(tx.total)} bold accent={isPayment ? 'emerald' : 'amber'} />
          {tx.memo && <Row k={t('tx.field.memo')} v={tx.memo} />}
        </div>
      </div>

      {confirming ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-3">
            <AlertTriangle size={16} strokeWidth={2} />
            <span>{t('tx.deleteConfirm')}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl active:bg-gray-50"
            >
              {t('supplier.cancel')}
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl active:bg-red-700"
            >
              <Trash2 size={14} strokeWidth={2} />
              {t('supplier.deleteOK')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl active:bg-red-700"
        >
          <Trash2 size={14} strokeWidth={2} />
          {t('supplier.delete')}
        </button>
      )}
    </div>
  )
}

function Row({ k, v, bold, accent = 'amber' }) {
  const color = bold ? (accent === 'emerald' ? 'text-emerald-600' : 'text-amber-700') : 'text-gray-700'
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className={`text-right ${bold ? 'font-bold' : ''} ${color}`}>{v}</span>
    </div>
  )
}
