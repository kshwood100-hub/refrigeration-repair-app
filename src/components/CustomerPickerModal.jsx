import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Search, User } from 'lucide-react'

// 거래처 선택 모달.
// 사용: <CustomerPickerModal open={...} customers={...} onSelect={(c) => ...} onClose={() => ...} />
export default function CustomerPickerModal({ open, customers, onSelect, onClose }) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQ('')
      // 모달 열리면 검색창에 포커스
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const list = customers ?? []
  const filtered = q.trim()
    ? list.filter((c) => {
        const k = q.trim().toLowerCase()
        return (
          c.name?.toLowerCase().includes(k) ||
          c.phone?.includes(k) ||
          c.address?.toLowerCase().includes(k)
        )
      })
    : list

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">{t('job.pickCustomerTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 active:text-gray-600 p-1">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* 검색 */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('job.customerSearch')}
              className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-400"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            {t('job.pickCustomerCount', { count: filtered.length, total: list.length })}
          </p>
        </div>

        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              {t('job.noSearchResult')}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  className="w-full text-left px-4 py-3 active:bg-gray-50 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={14} strokeWidth={1.5} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{c.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {c.phone || (c.address ? c.address : <span className="text-gray-300">—</span>)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
