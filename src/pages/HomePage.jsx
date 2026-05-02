import RProLogo from '../components/RProLogo'
import { useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Plus, ChevronRight, Wrench, ScanSearch, ClipboardList, Thermometer, Calendar, AlertCircle, BookOpen, Bell, X, Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { getTomorrowSchedule, getTodayMaintenances } from '../utils/alarmManager'
import { loadSettings } from '../utils/settings'
import { useAuth } from '../hooks/useAuth.jsx'

// 개발자/관리자 이메일 — 자동 정식 등급
const DEV_EMAILS = ['kshwood100@gmail.com', 'gshwood11@gmail.com', 'kkswood@gmail.com', 'kkswood386@gmail.com']

// 사용자 등급별 R 색상
const TIER_COLOR = {
  free:  { color: '#7dd3fc', shadow: 'rgba(125,211,252,0.5)' },  // 연파랑 (무료)
  paid:  { color: '#facc15', shadow: 'rgba(250,204,21,0.5)' },   // 노랑 (정식)
  group: { color: '#b08968', shadow: 'rgba(176,137,104,0.5)' },  // 연한 갈색 (그룹 키입력)
}

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function HomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tomorrowBanner, setTomorrowBanner] = useState(null)
  const [showBanner, setShowBanner] = useState(false)

  const jobs = useLiveQuery(() => db.service_jobs.filter((r) => !r.deletedAt).toArray(), [])
  const customers = useLiveQuery(() => db.customers.filter((r) => !r.deletedAt).toArray(), [])
  const todayMaintenances = useLiveQuery(() => db.equipment_maintenance.where('nextDueDate').equals(todayStr()).filter((r) => !r.deletedAt).toArray(), [])

  const customerMap = Object.fromEntries((customers ?? []).map((c) => [c.id, c]))

  const todayVisitsAll = (jobs ?? []).filter(
    (j) => j.visitDate === todayStr() && j.status !== 'completed'
  )
  const todayVisits = todayVisitsAll.slice(0, 2)
  const todayVisitsMore = todayVisitsAll.length - todayVisits.length

  const pending = (jobs ?? []).filter(
    (j) => j.status === 'received' || j.status === 'inprogress'
  ).sort((a, b) => (b.receiptDate ?? '').localeCompare(a.receiptDate ?? ''))
    .slice(0, 10)

  useEffect(() => {
    getTomorrowSchedule().then(({ jobs, maintenances }) => {
      if (jobs.length > 0 || maintenances.length > 0) {
        setTomorrowBanner({ jobs: jobs.length, maintenances: maintenances.length })
        setShowBanner(true)
      }
    })
  }, [])

  const menus = [
    { to: '/diagnosis',      label: t('home.symptoms'),       Icon: ScanSearch,  bg: 'bg-red-600',     fg: '#ffffff' },
    { to: '/refrigerant',    label: t('home.refrigerantPT'),  Icon: Thermometer, bg: 'bg-blue-600',    fg: '#ffffff' },
    { to: '/basics',         label: t('home.basics'),         Icon: BookOpen,    bg: 'bg-amber-500',   fg: '#1f2937' },
    { to: '/scan/equipment', label: t('camera.equipment'),    Icon: Camera,      bg: 'bg-emerald-600', fg: '#ffffff' },
  ]

  const savedTier = loadSettings().userTier ?? 'free'
  const tier = DEV_EMAILS.includes(user?.email) ? 'paid' : savedTier
  const rStyle = TIER_COLOR[tier] ?? TIER_COLOR.free

  return (
    <div className="h-full flex flex-col" style={{ marginBottom: '-5rem', paddingBottom: '0', backgroundColor: 'var(--app-bg)' }}>
    <div className="flex-1 min-h-0 overflow-hidden p-4 pb-0 flex flex-col gap-3">

      {/* 헤더 */}
      <div className="relative flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">
            <span className="text-3xl" style={{color: rStyle.color, textShadow: `0 0 6px ${rStyle.shadow}, 0 1px 2px rgba(0,0,0,0.6)`}}>R</span><span className="text-gray-900">-Pro</span>
          </span>
          <p className="text-xs text-gray-500">{todayStr()}</p>
        </div>
        <button
          onClick={() => navigate('/service/new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl"
        >
          <Plus size={14} strokeWidth={2} />
          {t('home.newRequest')}
        </button>
      </div>

      {/* 오늘 방문 일정 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} strokeWidth={1.5} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">{t('home.todaySchedule')}</span>
          </div>
          <button onClick={() => navigate('/service')} className="text-xs text-gray-500">{t('home.viewAll')}</button>
        </div>
        {tomorrowBanner && todayVisits.length === 0 && (
          <button
            onClick={() => navigate('/service', { state: { tab: 'schedule' } })}
            className="w-full flex items-center gap-2.5 px-4 py-3 mb-2 rounded-xl bg-blue-50 border border-blue-300 shadow-sm active:bg-blue-100"
          >
            <Bell size={18} strokeWidth={2} className="text-blue-700 shrink-0" />
            <span className="text-sm font-semibold text-blue-800 text-left">
              {t('home.tomorrowSchedule')}: {tomorrowBanner.jobs > 0 && t('home.tomorrowJobs', { count: tomorrowBanner.jobs })}{tomorrowBanner.jobs > 0 && tomorrowBanner.maintenances > 0 && ' · '}{tomorrowBanner.maintenances > 0 && t('home.tomorrowMaint', { count: tomorrowBanner.maintenances })}
            </span>
            <ChevronRight size={16} strokeWidth={2} className="text-blue-700 shrink-0 ml-auto" />
          </button>
        )}
        {todayVisits.length > 0 && (
          <div className="space-y-2">
            {todayVisits.map((job) => {
              const c = customerMap[job.customerId]
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/service/${job.id}`)}
                  className="w-full bg-blue-600 text-white rounded-lg px-3 py-1.5 text-left flex items-center justify-between shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-xs">{c?.name ?? t('home.noCustomer')}</p>
                    <p className="text-[11px] text-blue-200 mt-0.5 line-clamp-1">{(job.symptoms ?? job.symptom) || t('home.noSymptom')}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-blue-300 shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* 오늘 정기점검 일정 */}
      {todayMaintenances && todayMaintenances.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 mb-2">
            <Wrench size={14} strokeWidth={1.5} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">{t('home.todayMaintenance')}</span>
          </div>
          <div className="space-y-2">
            {todayMaintenances.map((item) => {
              const c = customerMap[item.customerId]
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/customers/${item.customerId}`)}
                  className="w-full bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-left flex items-center justify-between shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-xs">{c?.name ?? '-'}</p>
                    <p className="text-[11px] text-emerald-200 mt-0.5">{item.name}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-emerald-300 shrink-0" />
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* 미완료 의뢰 */}
      {pending.length > 0 && (
        <section className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={14} strokeWidth={1.5} className="text-amber-700" />
              <span className="text-sm font-semibold text-gray-900">{t('home.pendingJobs')}</span>
            </div>
            <button onClick={() => navigate('/service')} className="text-xs text-gray-500">{t('home.viewAll')}</button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-white border border-gray-300 rounded-xl shadow-sm divide-y divide-gray-50">
            {pending.map((job) => {
              const c = customerMap[job.customerId]
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/service/${job.id}`)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-left active:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{c?.name ?? t('home.noCustomer')}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{(job.symptoms ?? job.symptom) || t('home.noSymptom')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[11px] text-gray-400">{job.receiptDate}</span>
                    <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

    </div>

    {/* 현장 도구 (메인메뉴 바로 위 고정) */}
    <section
      className="shrink-0 px-4 py-4 border-t border-b border-gray-300 flex items-center justify-center relative"
      style={{ backgroundColor: 'var(--app-bg)', transform: 'translateY(22px)', zIndex: 10 }}
    >
      <div className="grid grid-cols-4 gap-2 w-full">
        {menus.map(({ to, label, Icon, bg, fg }) => (
          <Link
            key={to}
            to={to}
            className={`${bg} rounded-xl px-1 py-3 flex flex-col items-center justify-center gap-1.5 shadow-md active:opacity-80`}
          >
            <Icon size={22} strokeWidth={2} color={fg} />
            <span className="text-[11px] font-bold text-center leading-tight" style={{ color: fg }}>{label}</span>
          </Link>
        ))}
      </div>
    </section>

    </div>
  )
}
