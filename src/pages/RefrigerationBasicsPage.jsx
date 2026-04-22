import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronDown, Snowflake, RefreshCw, BarChart3, Target, Cog, Thermometer, Droplets, Cylinder, Wind, Wrench, Zap, Search, ClipboardList, Factory, ShieldCheck } from 'lucide-react'
import { REFRIGERATION_BASICS } from '../data/refrigerationTypes'
import { useLocalField } from '../hooks/useLang'

export default function RefrigerationBasicsPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const lf = useLocalField()
  const [open, setOpen] = useState(null)

  const ICON_MAP = {
    what_is: Snowflake, basic_cycle: RefreshCw, pressure_temp: BarChart3,
    superheat_subcool: Target, compressor_types: Cog, temp_range: Thermometer,
    refrigerants: Droplets, oil: Cylinder, cooling_method: Wind,
    expansion: Wrench, defrost: Snowflake, electric_control: Zap,
    common_failures: Search, site_checklist: ClipboardList,
    special_systems: Factory, safety: ShieldCheck,
  }

  return (
    <div className="p-4 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200">
        <ChevronLeft size={18} strokeWidth={2} />
        {t('basics.back')}
      </button>
      <h2 className="text-base font-semibold text-gray-900 mb-5">{t('basics.title')}</h2>

      <p className="text-xs text-gray-400 mb-4">{t('basics.subtitle')}</p>

      <div className="space-y-2">
        {REFRIGERATION_BASICS.map((item) => (
          <div key={item.id} className="bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
            <button
              onClick={() => setOpen(open === item.id ? null : item.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50"
            >
              {(() => { const Icon = ICON_MAP[item.id]; return Icon ? <Icon size={18} strokeWidth={1.5} className="text-blue-400 shrink-0" /> : <span className="text-xl w-7 text-center">{item.icon}</span> })()}
              <span className="flex-1 text-sm font-medium text-gray-800">{lf(item, 'title')}</span>
              <ChevronDown
                size={15} strokeWidth={1.5}
                className={`text-gray-400 transition-transform shrink-0 ${open === item.id ? 'rotate-180' : ''}`}
              />
            </button>
            {open === item.id && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{lf(item, 'content')}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
