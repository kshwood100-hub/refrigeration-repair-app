import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronRight, Calendar, MapPin, Search, X, CreditCard } from 'lucide-react'
import { db } from '../db'

const STATUS = {
  received:   { text: '접수',    dot: 'bg-gray-400' },
  scheduled:  { text: '방문예약', dot: 'bg-blue-500' },
  inprogress: { text: '진행중',  dot: 'bg-amber-500' },
  completed:  { text: '완료',    dot: 'bg-emerald-500' },
}

const TABS = [
  { key: 'all',       label: '전체' },
  { key: 'schedule',  label: '스케줄' },
  { key: 'completed', label: '완료' },
]

export default function ServicePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  const jobs = useLiveQuery(
    () => db.service_jobs.orderBy('receiptDate').reverse().toArray(), []
  )
  const customers = useLiveQuery(() => db.customers.toArray(), [])

  if (!jobs || !customers) {
    return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>
  }

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]))

  const filtered = jobs.filter((j) => {
    if (tab === 'all') return true
    if (tab === 'schedule') return j.visitDate && j.status !== 'completed'
    return j.status === tab
  })

  const searched = search.trim()
    ? filtered.filter((j) => {
        const c = customerMap[j.customerId]
        const q = search.trim().toLowerCase()
        return (
          c?.name?.toLowerCase().includes(q) ||
          c?.phone?.includes(q) ||
          j.symptom?.toLowerCase().includes(q) ||
          j.receiptDate?.includes(q)
        )
      })
    : filtered

  const displayed = tab === 'schedule'
    ? [...searched].sort((a, b) => (a.visitDate ?? '').localeCompare(b.visitDate ?? ''))
    : searched


  return (
    <div className="p-4 pb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-gray-900">수리 의뢰</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/business-cards')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-600 rounded-lg"
          >
            <CreditCard size={13} strokeWidth={1.5} />
            명함
          </button>
          <button
            onClick={() => navigate('/service/new')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg"
          >
            <Plus size={13} strokeWidth={2} />
            새 의뢰
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="relative mb-3">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="고객명, 전화번호, 증상 검색"
          className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-xl outline-none focus:border-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      {displayed.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-sm">의뢰 내역이 없습니다</div>
          {tab !== 'completed' && (
            <button
              onClick={() => navigate('/service/new')}
              className="mt-3 text-xs text-blue-600 font-medium"
            >
              첫 의뢰 등록하기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((job) => {
            const customer = customerMap[job.customerId]
            const st = STATUS[job.status] ?? STATUS.received
            return (
              <button
                key={job.id}
                onClick={() => navigate(`/service/${job.id}`)}
                className="w-full bg-white border border-gray-300 rounded-xl p-4 text-left active:bg-gray-50 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {customer?.name ?? '고객 미등록'}
                      </span>
                      {customer?.phone && (
                        <span className="text-xs text-gray-400 shrink-0">{customer.phone}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                      {job.symptom || '증상 미입력'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} strokeWidth={1.5} />
                        {job.receiptDate}
                      </span>
                      {job.visitDate && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} strokeWidth={1.5} />
                          {job.visitDate}
                        </span>
                      )}
                      {job.cost > 0 && (
                        <span className="ml-auto font-medium text-gray-600">
                          {Number(job.cost).toLocaleString()}원
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      <span className="text-xs text-gray-500">{st.text}</span>
                    </div>
                    <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

    </div>
  )
}
