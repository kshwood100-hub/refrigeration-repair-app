import { useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, ChevronRight, Wrench, ScanSearch, ClipboardList, Thermometer, Calendar, AlertCircle, BookOpen } from 'lucide-react'
import { db } from '../db'

const today = () => new Date().toISOString().slice(0, 10)

export default function HomePage() {
  const navigate = useNavigate()

  const jobs = useLiveQuery(() => db.service_jobs.toArray(), [])
  const customers = useLiveQuery(() => db.customers.toArray(), [])

  const customerMap = Object.fromEntries((customers ?? []).map((c) => [c.id, c]))

  const todayVisits = (jobs ?? []).filter(
    (j) => j.visitDate === today() && j.status !== 'completed'
  )

  const pending = (jobs ?? []).filter(
    (j) => j.status === 'received' || j.status === 'inprogress'
  ).sort((a, b) => (b.receiptDate ?? '').localeCompare(a.receiptDate ?? ''))
    .slice(0, 5)

  const menus = [
    { to: '/diagnosis',   label: '고장 진단',   Icon: ScanSearch },
    { to: '/refrigerant', label: '냉매 PT',     Icon: Thermometer },
    { to: '/basics',      label: '냉동 기초', Icon: BookOpen },
  ]

  return (
    <div className="p-4 pb-6 space-y-5">

      {/* 헤더 */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg font-bold text-gray-900">냉동기수리실무</h1>
          <p className="text-xs text-gray-400 mt-0.5">{today()}</p>
        </div>
        <button
          onClick={() => navigate('/service/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl"
        >
          <Plus size={14} strokeWidth={2} />
          새 의뢰
        </button>
      </div>

      {/* 오늘 방문 일정 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} strokeWidth={1.5} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">오늘 방문 일정</span>
          </div>
          <button onClick={() => navigate('/service')} className="text-xs text-gray-400">전체 보기</button>
        </div>
        {todayVisits.length === 0 ? (
          <div className="bg-white border border-gray-300 rounded-xl px-4 py-5 text-center shadow-sm">
            <p className="text-xs text-gray-400">오늘 예정된 방문이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayVisits.map((job) => {
              const c = customerMap[job.customerId]
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/service/${job.id}`)}
                  className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 text-left flex items-center justify-between shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-sm">{c?.name ?? '고객 미등록'}</p>
                    <p className="text-xs text-blue-200 mt-0.5 line-clamp-1">{job.symptom || '증상 미입력'}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-blue-300 shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* 미완료 의뢰 */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} strokeWidth={1.5} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-700">미완료 의뢰</span>
            </div>
            <button onClick={() => navigate('/service')} className="text-xs text-gray-400">전체 보기</button>
          </div>
          <div className="bg-white border border-gray-300 rounded-xl shadow-sm divide-y divide-gray-50">
            {pending.map((job) => {
              const c = customerMap[job.customerId]
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/service/${job.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c?.name ?? '고객 미등록'}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{job.symptom || '증상 미입력'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-gray-400">{job.receiptDate}</span>
                    <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* 메뉴 */}
      <section>
        <p className="text-sm font-semibold text-gray-700 mb-2">현장 도구</p>
        <div className="grid grid-cols-3 gap-2">
          {menus.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className="bg-white border border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm active:bg-gray-50"
            >
              <Icon size={22} strokeWidth={1.5} className="text-gray-600" />
              <span className="text-xs font-medium text-gray-700 text-center">{label}</span>
            </Link>
          ))}
        </div>
        <Link
          to="/service"
          className="mt-2 flex items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-3.5 shadow-sm active:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <Wrench size={18} strokeWidth={1.5} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">수리 의뢰 관리</span>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300" />
        </Link>
      </section>

    </div>
  )
}
