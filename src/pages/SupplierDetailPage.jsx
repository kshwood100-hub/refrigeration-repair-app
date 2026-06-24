import { useState } from 'react'
import { money } from '../utils/money'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Pencil, Trash2, Phone, Mail, MapPin, Tag, MessageSquare, Map, Clock, Plus, Receipt, AlertTriangle } from 'lucide-react'
import { db } from '../db'
import { softDeleteSupplierCascade } from '../utils/cloudSync'
import { relativeTime } from '../utils/relativeTime'

export default function SupplierDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()

  const supplier = useLiveQuery(async () => {
    const s = await db.suppliers.get(Number(id))
    return s?.deletedAt ? null : s
  }, [id])
  const transactions = useLiveQuery(
    async () => (await db.supplier_transactions.where('supplierId').equals(Number(id)).reverse().sortBy('date')).filter((r) => !r.deletedAt),
    [id]
  ) ?? []
  const [confirming, setConfirming] = useState(false)

  if (!supplier) return <div className="p-4 text-gray-400 text-sm">{t('common.loading')}</div>

  const purchaseSum = transactions.filter((tr) => tr.type !== 'payment').reduce((s, tr) => s + (Number(tr.total) || 0), 0)
  const paymentSum  = transactions.filter((tr) => tr.type === 'payment').reduce((s, tr) => s + (Number(tr.total) || 0), 0)
  const balance     = purchaseSum - paymentSum

  async function handleDelete() {
    await softDeleteSupplierCascade(Number(id))
    navigate('/finance?tab=supplier', { replace: true })
  }

  function markContacted() {
    db.suppliers.update(Number(id), { lastContactedAt: new Date().toISOString() })
  }

  return (
    <div className="p-4 pb-20">
      <button
        onClick={() => navigate('/finance?tab=supplier')}
        className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('supplier.list')}
      </button>

      {supplier.cardPhoto && (
        <img
          src={supplier.cardPhoto}
          alt=""
          className="h-40 w-auto block mx-auto mb-4 rounded-xl border border-gray-300"
        />
      )}

      <div className="bg-white border border-gray-300 rounded-xl p-4 mb-4 shadow-sm">
        {supplier.items && (
          <div className="flex items-start gap-2 mb-3">
            <Tag size={14} strokeWidth={1.5} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 leading-snug">{supplier.items}</p>
          </div>
        )}
        <h1 className="text-xl font-bold mb-3 text-gray-900">{supplier.name || t('supplier.noName')}</h1>

        <div className="space-y-2 text-sm text-gray-700">
          {supplier.phone && (
            <div className="flex items-center gap-2">
              <Phone size={13} strokeWidth={1.5} className="text-gray-400 shrink-0" />
              <a href={`tel:${supplier.phone}`} className="text-blue-600 active:underline flex-1">{supplier.phone}</a>
              <a
                href={`sms:${supplier.phone}`}
                onClick={markContacted}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 rounded-lg text-white text-xs font-semibold active:bg-sky-700"
              >
                <MessageSquare size={12} strokeWidth={2} />
                {t('supplier.btnSms')}
              </a>
              <a
                href={`tel:${supplier.phone}`}
                onClick={markContacted}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 rounded-lg text-white text-xs font-semibold active:bg-emerald-700"
              >
                <Phone size={12} strokeWidth={2} />
                {t('supplier.btnCall')}
              </a>
            </div>
          )}
          {supplier.phone2 && (
            <div className="flex items-center gap-2">
              <Phone size={13} strokeWidth={1.5} className="text-gray-400 shrink-0" />
              <a href={`tel:${supplier.phone2}`} className="text-blue-600 active:underline flex-1">{supplier.phone2}</a>
              <a
                href={`sms:${supplier.phone2}`}
                onClick={markContacted}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-600 rounded-lg text-white text-xs font-semibold active:bg-sky-700"
              >
                <MessageSquare size={12} strokeWidth={2} />
                {t('supplier.btnSms')}
              </a>
              <a
                href={`tel:${supplier.phone2}`}
                onClick={markContacted}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 rounded-lg text-white text-xs font-semibold active:bg-emerald-700"
              >
                <Phone size={12} strokeWidth={2} />
                {t('supplier.btnCall')}
              </a>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-start gap-2">
              <MapPin size={13} strokeWidth={1.5} className="text-gray-400 shrink-0 mt-0.5" />
              <span className="flex-1">{supplier.address}</span>
              <a
                href={`https://map.kakao.com/?q=${encodeURIComponent(supplier.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 rounded-lg text-white text-xs font-semibold active:bg-violet-700 shrink-0"
              >
                <Map size={12} strokeWidth={2} />
                {t('supplier.btnMap')}
              </a>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-2">
              <Mail size={13} strokeWidth={1.5} className="text-gray-400 shrink-0" />
              <a href={`mailto:${supplier.email}`} className="text-blue-600 active:underline break-all">{supplier.email}</a>
            </div>
          )}
        </div>

        {supplier.memo && (
          <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200 whitespace-pre-wrap">{supplier.memo}</p>
        )}

        {supplier.lastContactedAt && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-200">
            <Clock size={11} strokeWidth={1.5} />
            <span>{t('supplier.lastContact', { when: relativeTime(supplier.lastContactedAt) })}</span>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-300 rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt size={14} strokeWidth={1.8} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-gray-900">{t('supplier.txCount', { n: transactions.length })}</h2>
          </div>
          <div className="flex gap-1.5">
            <Link
              to={`/suppliers/${id}/transactions/new`}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg active:bg-amber-700"
            >
              <Plus size={12} strokeWidth={2.5} />
              {t('supplier.btnPurchase')}
            </Link>
            <Link
              to={`/suppliers/${id}/payments/new`}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg active:bg-emerald-700"
            >
              <Plus size={12} strokeWidth={2.5} />
              {t('supplier.btnPayment')}
            </Link>
          </div>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">{t('supplier.txEmpty')}</p>
        ) : (
          <>
            <div className="space-y-1.5">
              {transactions.map((tr) => {
                const isPayment = tr.type === 'payment'
                return (
                  <Link
                    key={tr.id}
                    to={`/supplier-transactions/${tr.id}`}
                    className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 active:bg-gray-100"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPayment ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isPayment ? t('supplier.txTagPayment') : t('supplier.txTagPurchase')}
                          </span>
                          <p className="text-xs text-gray-500">{tr.date || '-'}</p>
                        </div>
                        {isPayment ? (
                          tr.memo && <p className="text-sm text-gray-700 truncate mt-0.5">{tr.memo}</p>
                        ) : (
                          tr.items?.length > 0 && (
                            <p className="text-sm text-gray-700 truncate mt-0.5">
                              {tr.items[0]?.name}
                              {tr.items.length > 1 && <span className="text-gray-400"> {t('supplier.othersCount', { n: tr.items.length - 1 })}</span>}
                            </p>
                          )
                        )}
                      </div>
                      <p className={`text-sm font-semibold shrink-0 ${isPayment ? 'text-emerald-600' : 'text-amber-700'}`}>
                        {isPayment && tr.total ? '-' : ''}{tr.total ? money(tr.total) : '-'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('supplier.purchaseSum')}</span>
                <span className="text-amber-700 font-medium">{money(purchaseSum)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t('supplier.paymentSum')}</span>
                <span className="text-emerald-600 font-medium">-{money(paymentSum)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-gray-200">
                <span className="text-gray-700 font-semibold">{t('supplier.balance')}</span>
                <span className={`font-bold ${balance > 0 ? 'text-amber-600' : balance < 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                  {money(balance)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {confirming ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold mb-2">
            <AlertTriangle size={16} strokeWidth={2} />
            <span>{t('supplier.deleteConfirm')}</span>
          </div>
          <ul className="text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-2.5 mb-2 space-y-0.5">
            <li>• {t('supplier.cascadeTransactions')}: <span className="font-bold">{transactions.length}{t('customer.cascadeUnit')}</span></li>
          </ul>
          <p className="text-[11px] text-red-600 font-semibold mb-3 leading-relaxed">⚠️ {t('supplier.deleteIrreversibleDetail')}</p>
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
        <div className="flex gap-2">
          <Link
            to={`/suppliers/${id}/edit`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl active:bg-blue-700"
          >
            <Pencil size={14} strokeWidth={2} />
            {t('supplier.edit')}
          </Link>
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl active:bg-red-700"
          >
            <Trash2 size={14} strokeWidth={2} />
            {t('supplier.delete')}
          </button>
        </div>
      )}
    </div>
  )
}
