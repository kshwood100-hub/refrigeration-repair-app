import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronRight, Building2, Search, Star, Phone, X } from 'lucide-react'
import { db } from '../db'

export default function SuppliersPage({ hideTitle = false }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const suppliers = useLiveQuery(
    () => db.suppliers.orderBy('createdAt').reverse().toArray(),
    []
  )
  const allTx = useLiveQuery(() => db.supplier_transactions.toArray(), [])

  const purchaseTotal = (allTx ?? []).filter(t => t.type !== 'payment').reduce((s, t) => s + (Number(t.total) || 0), 0)
  const paymentTotal  = (allTx ?? []).filter(t => t.type === 'payment').reduce((s, t) => s + (Number(t.total) || 0), 0)
  const balance = purchaseTotal - paymentTotal

  async function togglePin(e, s) {
    e.preventDefault()
    e.stopPropagation()
    await db.suppliers.update(s.id, { pinned: !s.pinned })
  }

  const kw = q.trim().toLowerCase()
  const filtered = (suppliers ?? []).filter((s) => {
    if (!kw) return true
    return (
      (s.name    || '').toLowerCase().includes(kw) ||
      (s.items   || '').toLowerCase().includes(kw) ||
      (s.phone   || '').includes(kw) ||
      (s.phone2  || '').includes(kw) ||
      (s.address || '').toLowerCase().includes(kw)
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (!!b.pinned - !!a.pinned !== 0) return !!b.pinned - !!a.pinned
    return 0
  })

  return (
    <div className="p-4">
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">{t('supplier.title')}</h2>
        </div>
      )}

      <div className="flex justify-end mb-3">
        <Link
          to="/suppliers/new"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg"
        >
          <Plus size={13} strokeWidth={2.5} />
          {t('supplier.add')}
        </Link>
      </div>

      {suppliers && suppliers.length > 0 && (
        <div className="relative mb-3">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('supplier.searchPlaceholder')}
            className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-9 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 active:text-gray-600"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {!suppliers || suppliers.length === 0 ? (
        <div className="bg-white border border-gray-300 rounded-xl p-8 text-center">
          <Building2 size={32} strokeWidth={1.2} className="mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{t('supplier.empty')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('supplier.emptyHint')}</p>
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center mt-8">{t('supplier.noResult')}</p>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((s) => {
            const tel = s.phone || s.phone2
            return (
              <Link
                key={s.id}
                to={`/suppliers/${s.id}`}
                className="block bg-white border border-gray-300 rounded-lg px-2 py-1.5 active:bg-gray-50 shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => togglePin(e, s)}
                    className="shrink-0 w-6 h-6 flex items-center justify-center"
                  >
                    <Star
                      size={14}
                      strokeWidth={1.8}
                      className={s.pinned ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
                    />
                  </button>

                  <div className="min-w-0 flex-1 flex items-center gap-1.5">
                    <p className="font-semibold text-xs truncate shrink-0 text-gray-900">{s.name || t('supplier.noName')}</p>
                    {s.items && (
                      <p className="text-[11px] text-amber-600 truncate">· {s.items}</p>
                    )}
                  </div>

                  {tel && (
                    <a
                      href={`tel:${tel}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        db.suppliers.update(s.id, { lastContactedAt: new Date().toISOString() })
                      }}
                      className="shrink-0 w-7 h-7 flex items-center justify-center bg-emerald-600 rounded-md text-white active:bg-emerald-700"
                    >
                      <Phone size={12} strokeWidth={2} />
                    </a>
                  )}
                  <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300 shrink-0" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {suppliers && suppliers.length > 0 && <div className="h-28" />}

      {suppliers && suppliers.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 z-30">
          <div className="bg-white border border-gray-300 rounded-xl px-3 py-2 shadow-lg">
            <div className="flex justify-between items-center text-[11px] text-gray-500 mb-0.5">
              <span>{t('supplier.totalPurchase')}</span>
              <span className="font-semibold text-gray-800 text-xs">{purchaseTotal.toLocaleString()}{t('expense.wonUnit')}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-gray-500 mb-1.5">
              <span>{t('supplier.totalPayment')}</span>
              <span className="font-semibold text-emerald-600 text-xs">- {paymentTotal.toLocaleString()}{t('expense.wonUnit')}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-900">{t('supplier.balance')}</span>
              <span className={`text-sm font-bold ${balance > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {balance.toLocaleString()}{t('expense.wonUnit')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
