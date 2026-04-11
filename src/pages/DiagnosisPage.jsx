import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Pencil, ChevronRight, List, Search,
  Settings2, Thermometer, Volume2, Zap, Snowflake,
  RefreshCw, TrendingUp, TrendingDown, Wind, Droplets,
  PowerOff, AlertCircle, Flame, Gauge, FlaskConical, SlidersHorizontal, Cpu,
} from 'lucide-react'
import { useLocalField } from '../hooks/useLang'
import { db } from '../db'

const ICON_MAP = {
  compressor_no_start: { Icon: Settings2,    bg: '#F3F4F6', color: '#374151' },
  poor_cooling:        { Icon: Thermometer,  bg: '#EFF6FF', color: '#3B82F6' },
  abnormal_noise:      { Icon: Volume2,      bg: '#FFF7ED', color: '#F97316' },
  breaker_trip:        { Icon: Zap,          bg: '#FEFCE8', color: '#EAB308' },
  heavy_frost:         { Icon: Snowflake,    bg: '#EFF6FF', color: '#60A5FA' },
  short_cycling:       { Icon: RefreshCw,    bg: '#F5F3FF', color: '#8B5CF6' },
  high_pressure:       { Icon: TrendingUp,   bg: '#FEF2F2', color: '#EF4444' },
  low_pressure:        { Icon: TrendingDown, bg: '#F0FDF4', color: '#22C55E' },
  evap_fan_fail:       { Icon: Wind,         bg: '#F0FDFA', color: '#14B8A6' },
  cond_fan_fail:       { Icon: Wind,         bg: '#FFF7ED', color: '#F97316' },
  drainage_issue:      { Icon: Droplets,     bg: '#EFF6FF', color: '#38BDF8' },
  no_power:            { Icon: PowerOff,        bg: '#F3F4F6', color: '#6B7280' },
  comp_overheating:    { Icon: Flame,           bg: '#FEF2F2', color: '#EF4444' },
  oil_issue:           { Icon: Gauge,           bg: '#FFF7ED', color: '#F97316' },
  refrigerant_moisture:{ Icon: FlaskConical,    bg: '#F0FDF4', color: '#22C55E' },
  txv_issue:           { Icon: SlidersHorizontal, bg: '#F5F3FF', color: '#8B5CF6' },
  inverter_issue:      { Icon: Cpu,             bg: '#FEFCE8', color: '#EAB308' },
  condenser_highpressure: { Icon: TrendingUp,   bg: '#FEF2F2', color: '#DC2626' },
}

export default function DiagnosisPage() {
  const { t } = useTranslation()
  const lf = useLocalField()
  const navigate = useNavigate()
  const categories = useLiveQuery(() => db.flow_categories.toArray())

  if (!categories) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

  return (
    <div className="p-4 pb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-900">{t('diagnosis.title')}</h2>
        <Link
          to="/flow-edit"
          className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-300 rounded-lg px-3 py-1.5 active:bg-gray-50"
        >
          <Pencil size={12} strokeWidth={1.5} />
          진단편집
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-4">{t('diagnosis.subtitle')}</p>

      {/* 키워드 검색 — 메인 */}
      <button
        onClick={() => navigate('/diagnosis/search')}
        className="w-full flex items-center gap-3 px-4 py-4 mb-5 bg-gray-900 text-white rounded-xl shadow-sm active:bg-gray-800"
      >
        <Search size={18} strokeWidth={1.5} className="text-gray-400 shrink-0" />
        <span className="text-sm text-gray-300">증상 키워드로 바로 검색...</span>
      </button>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">문답식 진단</p>
      <div className="space-y-2">
        {categories.map((cat) => {
          const mapped = ICON_MAP[cat.id]
          const Icon = mapped?.Icon ?? AlertCircle
          const bg    = mapped?.bg    ?? '#F3F4F6'
          const color = mapped?.color ?? '#6B7280'
          return (
            <div key={cat.id} className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={18} strokeWidth={1.5} style={{ color }} />
              </div>
              <Link to={`/diagnosis/${cat.id}`} className="flex-1 min-w-0 py-0.5">
                <span className="text-sm font-medium text-gray-800">{lf(cat, 'title')}</span>
              </Link>
              <Link
                to={`/diagnosis/${cat.id}/results`}
                className="text-xs text-gray-500 border border-gray-300 rounded-lg px-2.5 py-1.5 shrink-0 active:bg-gray-50 whitespace-nowrap"
              >
                참고
              </Link>
              <Link to={`/diagnosis/${cat.id}`} className="shrink-0">
                <ChevronRight size={15} strokeWidth={1.5} className="text-gray-300" />
              </Link>
            </div>
          )
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-300">
        <Link
          to="/symptoms"
          className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl py-3 active:bg-gray-50"
        >
          <List size={15} strokeWidth={1.5} />
          {t('diagnosis.browseList')}
        </Link>
      </div>
    </div>
  )
}
