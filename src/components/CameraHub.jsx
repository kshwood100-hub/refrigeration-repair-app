import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Camera, X, Wrench, CreditCard, ChevronRight } from 'lucide-react'

const TOP_LEVEL_PATHS = ['/diagnosis', '/service', '/expenses', '/knowhow', '/settings']

export default function CameraHub() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  if (!TOP_LEVEL_PATHS.includes(location.pathname)) return null

  const items = [
    {
      key: 'equipment',
      Icon: Wrench,
      bg: 'bg-blue-600',
      fg: '#ffffff',
      label: t('camera.equipment'),
      desc: t('camera.equipmentDesc'),
      onClick: () => { setOpen(false); navigate('/scan/equipment') },
    },
    {
      key: 'card',
      Icon: CreditCard,
      bg: 'bg-emerald-600',
      fg: '#ffffff',
      label: t('camera.card'),
      desc: t('camera.cardDesc'),
      onClick: () => { setOpen(false); navigate('/business-cards?scan=1') },
    },
  ]

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('camera.open')}
        className="fixed right-4 bottom-[5.5rem] z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center active:bg-blue-700"
        style={{ boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}
      >
        <Camera size={24} strokeWidth={2} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">{t('camera.title')}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 p-1" aria-label={t('camera.close')}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map(({ key, Icon, bg, fg, label, desc, onClick }) => (
                <button
                  key={key}
                  onClick={onClick}
                  className={`w-full flex items-center gap-3 ${bg} rounded-xl px-4 py-3.5 shadow-sm active:opacity-80`}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Icon size={20} strokeWidth={2} color={fg} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm" style={{ color: fg }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: fg, opacity: 0.85 }}>{desc}</p>
                  </div>
                  <ChevronRight size={18} strokeWidth={2} color={fg} style={{ opacity: 0.7 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
