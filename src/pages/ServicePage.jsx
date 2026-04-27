import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronRight, Calendar, MapPin, Search, X, User, Camera, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'

export default function ServicePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(location.state?.tab ?? 'customers')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function handleDeleteCustomer() {
    if (!deleteTarget) return
    const cid = deleteTarget.id
    const jobIds = (await db.service_jobs.where('customerId').equals(cid).toArray()).map((j) => j.id)
    if (jobIds.length) {
      await db.job_photos.where('jobId').anyOf(jobIds).delete()
      await db.expenses.where('jobId').anyOf(jobIds).delete()
      await db.user_alarms.filter((a) => jobIds.includes(a.jobId)).delete()
    }
    await db.expenses.filter((e) => e.customerId === cid).delete()
    await db.service_jobs.where('customerId').equals(cid).delete()
    await db.business_cards.where('customerId').equals(cid).delete()
    await db.equipment_maintenance.where('customerId').equals(cid).delete()
    await db.customers.delete(cid)
    setDeleteTarget(null)
  }

  const STATUS = {
    received:   { text: t('service.statusReceived'),   dot: 'bg-gray-400' },
    scheduled:  { text: t('service.statusScheduled'),  dot: 'bg-blue-500' },
    inprogress: { text: t('service.statusInProgress'), dot: 'bg-amber-500' },
    completed:  { text: t('service.statusCompleted'),  dot: 'bg-emerald-500' },
  }

  const TABS = [
    { key: 'customers', label: t('service.tabAll'),       activeClass: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm' },
    { key: 'schedule',  label: t('service.tabSchedule'),  activeClass: 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-sm' },
    { key: 'completed', label: t('service.tabCompleted'), activeClass: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm' },
  ]

  const jobs = useLiveQuery(
    () => db.service_jobs.orderBy('receiptDate').reverse().toArray(), []
  )
  const customers = useLiveQuery(() => db.customers.orderBy('name').toArray(), [])

  if (!jobs || !customers) {
    return <div className="p-4 text-gray-400 text-sm">{t('logs.loading')}</div>
  }

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]))
  const q = search.trim().toLowerCase()

  // 전체 탭: 고객 리스트
  const filteredCustomers = q
    ? customers.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.address?.toLowerCase().includes(q)
      )
    : customers

  // 스케쥴/완료 탭: 수리의뢰
  const filteredJobs = jobs.filter((j) => {
    if (tab === 'schedule') return j.visitDate && j.status !== 'completed'
    if (tab === 'completed') return j.status === 'completed'
    return false
  })

  const searchedJobs = q
    ? filteredJobs.filter((j) => {
        const c = customerMap[j.customerId]
        return (
          c?.name?.toLowerCase().includes(q) ||
          c?.phone?.includes(q) ||
          (j.symptoms ?? j.symptom)?.toLowerCase().includes(q) ||
          j.receiptDate?.includes(q)
        )
      })
    : filteredJobs

  const displayedJobs = tab === 'schedule'
    ? [...searchedJobs].sort((a, b) => (a.visitDate ?? '').localeCompare(b.visitDate ?? ''))
    : searchedJobs

  return (
    <div className="p-4 pb-4">
      {/* 헤더 */}
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900 mb-3">{t('service.title')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/business-cards?scan=1')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold bg-violet-600 text-white rounded-xl shadow-md active:bg-violet-700"
          >
            <Camera size={16} strokeWidth={2.5} />
            {t('service.businessCards')}
          </button>
          <button
            onClick={() => navigate('/service/new')}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-bold bg-emerald-600 text-white rounded-xl shadow-md active:bg-emerald-700"
          >
            <Plus size={16} strokeWidth={2.5} />
            {t('service.newRequest')}
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
          placeholder={t('service.searchPlaceholder')}
          className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-xl outline-none focus:border-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-4 bg-gray-100 border border-gray-200 p-1 rounded-xl">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => { setTab(tb.key); setSearch('') }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === tb.key ? tb.activeClass : 'text-gray-500'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* 전체 탭 - 고객 리스트 */}
      {tab === 'customers' && (
        filteredCustomers.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {t('service.empty')}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="w-full bg-white border border-gray-300 rounded-lg flex items-center gap-1 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => navigate(`/customers/${c.id}`)}
                  className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 text-left active:bg-gray-50"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <User size={12} strokeWidth={1.5} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{c.name}</p>
                    {c.phone && <p className="text-[11px] text-gray-400 mt-0.5">{c.phone}</p>}
                  </div>
                  <ChevronRight size={12} strokeWidth={1.5} className="text-gray-300 shrink-0" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(c) }}
                  className="px-2 py-1.5 text-gray-300 active:text-red-500 active:bg-red-50"
                  aria-label={t('customer.delete')}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* 스케쥴/완료 탭 - 수리의뢰 */}
      {tab !== 'customers' && (
        displayedJobs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-sm">{t('service.empty')}</div>
            {tab === 'schedule' && (
              <button
                onClick={() => navigate('/service/new')}
                className="mt-3 text-xs text-blue-600 font-medium"
              >
                {t('service.addFirst')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {displayedJobs.map((job) => {
              const customer = customerMap[job.customerId]
              const st = STATUS[job.status] ?? STATUS.received
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/service/${job.id}`)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-left active:bg-gray-50 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-900 text-xs truncate">
                          {customer?.name ?? t('home.noCustomer')}
                        </span>
                        {customer?.phone && (
                          <span className="text-[11px] text-gray-400 shrink-0">{customer.phone}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mb-1">
                        {(job.symptoms ?? job.symptom) || t('home.noSymptom')}
                      </p>
                      <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} strokeWidth={1.5} />
                          {job.receiptDate}
                        </span>
                        {job.visitDate && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} strokeWidth={1.5} />
                            {job.visitDate}
                          </span>
                        )}
                        {job.cost > 0 && (
                          <span className="ml-auto font-medium text-gray-600">
                            {Number(job.cost).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        <span className="text-[11px] text-gray-500">{st.text}</span>
                      </div>
                      <ChevronRight size={12} strokeWidth={1.5} className="text-gray-300" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )
      )}

      {/* 고객 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">{t('customer.deleteConfirm')}</p>
            <p className="text-sm text-gray-500 mb-1">{deleteTarget.name}</p>
            <p className="text-sm text-gray-400 mb-5">{t('customer.deleteDesc')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600"
              >
                {t('customer.cancel')}
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl"
              >
                {t('customer.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
