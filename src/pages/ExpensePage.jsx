import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronRight, Calendar, ChevronLeft } from 'lucide-react'
import { db } from '../db'
import { softDelete } from '../utils/cloudSync'

// ── 날짜 유틸 ──────────────────────────────────────────
function toISO(d) { return d.toISOString().slice(0, 10) }
function startOfWeek(d) {
  const r = new Date(d); r.setDate(d.getDate() - d.getDay()); return r
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0) }
function startOfQuarter(d) {
  const q = Math.floor(d.getMonth() / 3)
  return new Date(d.getFullYear(), q * 3, 1)
}
function endOfQuarter(d) {
  const q = Math.floor(d.getMonth() / 3)
  return new Date(d.getFullYear(), q * 3 + 3, 0)
}
function startOfYear(d) { return new Date(d.getFullYear(), 0, 1) }
function endOfYear(d)   { return new Date(d.getFullYear(), 11, 31) }

function getRange(base, period) {
  const d = new Date(base)
  if (period === 'week') {
    const s = startOfWeek(d)
    const e = new Date(s); e.setDate(s.getDate() + 6)
    return [toISO(s), toISO(e)]
  }
  if (period === 'month')   return [toISO(startOfMonth(d)), toISO(endOfMonth(d))]
  if (period === 'quarter') return [toISO(startOfQuarter(d)), toISO(endOfQuarter(d))]
  if (period === 'year')    return [toISO(startOfYear(d)), toISO(endOfYear(d))]
  return [toISO(d), toISO(d)]
}

// ── 미니 캘린더 ────────────────────────────────────────
function MiniCalendar({ selected, onSelect, expenseDates }) {
  const { t } = useTranslation()
  const [view, setView] = useState(() => {
    const d = new Date(selected); return { y: d.getFullYear(), m: d.getMonth() }
  })

  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const firstDay    = new Date(view.y, view.m, 1).getDay()
  const weeks       = t('expense.weekdays').split(',')

  function prevMonth() {
    setView(v => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })
  }
  function nextMonth() {
    setView(v => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bg-white border border-gray-300 rounded-2xl p-4 shadow-sm">
      {/* 월 네비 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 text-gray-500 active:bg-gray-100 rounded-lg">
          <ChevronLeft size={18} strokeWidth={1.5} />
        </button>
        <span className="text-sm font-semibold text-gray-900">{t('expense.yearMonth', { year: view.y, month: view.m + 1 })}</span>
        <button onClick={nextMonth} className="p-1 text-gray-500 active:bg-gray-100 rounded-lg">
          <ChevronRight size={18} strokeWidth={1.5} />
        </button>
      </div>
      {/* 요일 */}
      <div className="grid grid-cols-7 mb-1">
        {weeks.map((w, i) => (
          <div key={w} className={`text-center text-[10px] font-medium pb-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{w}</div>
        ))}
      </div>
      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />
          const iso = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const isSelected = iso === selected
          const hasExp = expenseDates.has(iso)
          const dow = (firstDay + d - 1) % 7
          return (
            <button
              key={d}
              onClick={() => onSelect(iso)}
              className={`relative flex items-center justify-center h-8 rounded-lg text-xs font-medium transition-colors
                ${isSelected ? 'bg-blue-600 text-white' : 'active:bg-gray-100'}
                ${!isSelected && dow === 0 ? 'text-red-400' : ''}
                ${!isSelected && dow === 6 ? 'text-blue-400' : ''}
                ${!isSelected && dow !== 0 && dow !== 6 ? 'text-gray-700' : ''}
              `}
            >
              {d}
              {hasExp && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 메인 페이지 ────────────────────────────────────────
export default function ExpensePage({ hideTitle = false }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [mainTab, setMainTab] = useState('revenue')  // 'revenue' | 'list' | 'summary'
  const [period, setPeriod] = useState('month')      // week/month/quarter/year
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()))
  const [deleting, setDeleting] = useState(null)
  const [showDaily, setShowDaily] = useState(false)
  const [showPeriod, setShowPeriod] = useState(false)

  const expenses = useLiveQuery(
    () => db.expenses.orderBy('date').reverse().filter((r) => !r.deletedAt).toArray(), []
  )
  const jobs = useLiveQuery(() => db.service_jobs.filter((r) => !r.deletedAt).toArray(), [])
  const customers = useLiveQuery(() => db.customers.filter((r) => !r.deletedAt).toArray(), [])

  if (!expenses || !jobs || !customers) {
    return <div className="p-4 text-gray-400 text-sm">{t('expense.loading')}</div>
  }

  const jobMap      = Object.fromEntries(jobs.map((j) => [j.id, j]))
  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c]))
  const expenseDates = new Set(expenses.map((e) => e.date))

  async function handleDelete(id) {
    await softDelete('expenses', id)
    setDeleting(null)
  }

  // 합계 탭 필터
  const [rangeStart, rangeEnd] = getRange(selectedDate, period)
  const rangeExpenses = expenses.filter((e) => e.date >= rangeStart && e.date <= rangeEnd)
  const rangeTotal = rangeExpenses.reduce((s, e) => s + (e.items ?? []).reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0)
  const rangeJobs = jobs.filter((j) => (j.cost || 0) > 0 && j.receiptDate >= rangeStart && j.receiptDate <= rangeEnd)
  const rangeRevenue = rangeJobs.reduce((s, j) => s + (j.cost || 0), 0)
  const rangeNet = rangeRevenue - rangeTotal

  const PERIOD_TABS = [
    { key: 'week',    label: t('expense.periodWeek') },
    { key: 'month',   label: t('expense.periodMonth') },
    { key: 'quarter', label: t('expense.periodQuarter') },
    { key: 'year',    label: t('expense.periodYear') },
  ]

  return (
    <div className="p-4 pb-4">
      {/* 헤더 */}
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">{t('expense.title')}</h2>
          {mainTab === 'list' && (
            <button
              onClick={() => navigate('/expenses/new')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md active:bg-blue-700"
            >
              <Plus size={13} strokeWidth={2.5} />
              {t('expense.newExpense')}
            </button>
          )}
        </div>
      )}
      {hideTitle && mainTab === 'list' && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => navigate('/expenses/new')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md active:bg-blue-700"
          >
            <Plus size={13} strokeWidth={2.5} />
            {t('expense.newExpense')}
          </button>
        </div>
      )}

      {/* 메인 탭 */}
      <div className="flex gap-1 mb-4 bg-gray-100 border border-gray-200 p-1 rounded-xl">
        {[
          { key: 'revenue', label: t('expense.tabRevenue'), activeClass: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm' },
          { key: 'list',    label: t('expense.tabList'),    activeClass: 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-sm' },
          { key: 'summary', label: t('expense.tabSummary'), activeClass: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm' },
        ].map((tb) => (
          <button
            key={tb.key}
            onClick={() => setMainTab(tb.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              mainTab === tb.key ? tb.activeClass : 'text-gray-500'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* ── 매출내역 탭 (AS 기반) ── */}
      {mainTab === 'revenue' && (
        (() => {
          const revenueJobs = jobs.filter((j) => (j.cost || 0) > 0).sort((a, b) => (b.receiptDate ?? '').localeCompare(a.receiptDate ?? ''))
          const totalRevenue = revenueJobs.reduce((s, j) => s + (j.cost || 0), 0)
          if (revenueJobs.length === 0) {
            return (
              <div className="text-center py-20 text-gray-400">
                <div className="text-sm mb-4">{t('expense.revenueEmpty')}</div>
                <button
                  onClick={() => navigate('/service', { state: { tab: 'customers', revenueAddMode: true } })}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg active:bg-emerald-700"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  {t('expense.revenueAddBtn')}
                </button>
              </div>
            )
          }
          return (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-600 rounded-xl mb-2">
                <span className="text-xs text-white font-medium">{t('expense.revenueTotal')}</span>
                <span className="text-sm font-bold text-white">{totalRevenue.toLocaleString()}{t('expense.wonUnit')}</span>
              </div>
              {revenueJobs.map((job) => {
                const customer = customerMap[job.customerId]
                return (
                  <button
                    key={job.id}
                    onClick={() => navigate(`/service/${job.id}`)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-left active:bg-gray-50 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {customer?.name ?? t('home.noCustomer')}
                        </p>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {(job.symptoms ?? job.symptom) || t('home.noSymptom')}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} strokeWidth={1.5} />
                            {job.receiptDate}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${job.paid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                            {job.paid ? t('expense.paidYes') : t('expense.paidNo')}
                          </span>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${job.paid ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(job.cost || 0).toLocaleString()}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        })()
      )}

      {/* ── 경비내역기록 탭 ── */}
      {mainTab === 'list' && (
        expenses.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-sm">{t('expense.empty')}</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {expenses.map((exp) => {
              const job      = jobMap[exp.jobId]
              const customer = customerMap[exp.customerId] ?? (job ? customerMap[job.customerId] : null)
              const total    = (exp.items ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
              return (
                <button
                  key={exp.id}
                  onClick={() => navigate(`/expenses/${exp.id}`)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-left active:bg-gray-50 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-gray-900 text-xs truncate">
                          {exp.title || customer?.name || t('expense.noTitle')}
                        </span>
                      </div>
                      {customer && (
                        <p className="text-[11px] text-gray-400 mb-0.5">{t('expense.linkedJob', { name: customer.name })}</p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} strokeWidth={1.5} />
                          {exp.date}
                        </span>
                        <span className="ml-auto font-semibold text-gray-700 text-xs">{total.toLocaleString()}</span>
                      </div>
                    </div>
                    <ChevronRight size={12} strokeWidth={1.5} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                </button>
              )
            })}
          </div>
        )
      )}

      {/* ── 경비내역합계 탭 ── */}
      {mainTab === 'summary' && (
        <div className="space-y-4">
          {/* 기간 탭 */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {PERIOD_TABS.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setPeriod(tb.key)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === tb.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* 캘린더 */}
          <MiniCalendar
            selected={selectedDate}
            onSelect={setSelectedDate}
            expenseDates={expenseDates}
          />

          {(() => {
            const dayExp = expenses.filter((e) => e.date === selectedDate)
            const dayTotal = dayExp.reduce((s, e) => s + (e.items ?? []).reduce((ss, i) => ss + (Number(i.amount) || 0), 0), 0)
            return (
              <>
                {/* 선택된 기간 합계 (매출/지출/순이익) */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    {t('expense.periodTotal', { period: PERIOD_TABS.find(p => p.key === period)?.label })}
                  </p>
                  <p className="text-[10px] text-gray-400 mb-2">{rangeStart} ~ {rangeEnd}</p>
                  <div className="space-y-1.5 mb-2">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-emerald-600 rounded-xl">
                      <span className="text-xs text-white font-medium">{t('expense.revenueTotal')}</span>
                      <span className="text-sm font-bold text-white">{rangeRevenue.toLocaleString()}{t('expense.wonUnit')}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-red-600 rounded-xl">
                      <span className="text-xs text-white font-medium">{t('expense.expenseTotal')}</span>
                      <span className="text-sm font-bold text-white">−{rangeTotal.toLocaleString()}{t('expense.wonUnit')}</span>
                    </div>
                    <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${rangeNet >= 0 ? 'bg-blue-600' : 'bg-gray-700'}`}>
                      <span className="text-xs text-white font-medium">{t('expense.netProfit')}</span>
                      <span className="text-sm font-bold text-white">{rangeNet.toLocaleString()}{t('expense.wonUnit')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPeriod(v => !v)}
                    className="w-full text-[11px] text-gray-500 py-1 active:text-gray-800"
                  >
                    {showPeriod ? '▲' : '▼'} {t('expense.tabList')}
                  </button>
                  {showPeriod && (
                    rangeExpenses.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">{t('expense.periodEmpty')}</div>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        {rangeExpenses.map((exp) => {
                          const job      = jobMap[exp.jobId]
                          const customer = customerMap[exp.customerId] ?? (job ? customerMap[job.customerId] : null)
                          const total    = (exp.items ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
                          return (
                            <button
                              key={exp.id}
                              onClick={() => navigate(`/expenses/${exp.id}`)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-left active:bg-gray-50 shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">
                                    {exp.title || customer?.name || t('expense.noTitle')}
                                  </p>
                                  <div className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-400">
                                    <Calendar size={10} strokeWidth={1.5} />
                                    {exp.date}
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-gray-700 shrink-0">{total.toLocaleString()}{t('expense.wonUnit')}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )
                  )}
                </div>

                {/* 당일 합계 (그 다음) */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">{t('expense.dailyHeader', { date: selectedDate })}</p>
                  <button
                    onClick={() => setShowDaily(v => !v)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 flex items-center justify-between active:bg-gray-200"
                  >
                    <span className="text-xs text-gray-500">{selectedDate}</span>
                    <span className="text-sm font-bold text-gray-800">{dayTotal.toLocaleString()}{t('expense.wonUnit')}</span>
                  </button>
                  {showDaily && (
                    dayExp.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-xs">{t('expense.dailyEmpty')}</div>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        {dayExp.map((exp) => {
                          const job      = jobMap[exp.jobId]
                          const customer = customerMap[exp.customerId] ?? (job ? customerMap[job.customerId] : null)
                          const total    = (exp.items ?? []).reduce((s, i) => s + (Number(i.amount) || 0), 0)
                          return (
                            <button
                              key={exp.id}
                              onClick={() => navigate(`/expenses/${exp.id}`)}
                              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-left active:bg-gray-50 shadow-sm flex items-center justify-between gap-2"
                            >
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {exp.title || customer?.name || t('expense.noTitle')}
                              </p>
                              <span className="text-xs font-semibold text-gray-700 shrink-0">{total.toLocaleString()}{t('expense.wonUnit')}</span>
                            </button>
                          )
                        })}
                      </div>
                    )
                  )}
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">{t('expense.deleteConfirm')}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600">
                {t('expense.cancel')}
              </button>
              <button onClick={() => handleDelete(deleting)}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl">
                {t('expense.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
