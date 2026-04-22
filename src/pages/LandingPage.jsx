import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Wrench, Wallet, ClipboardList } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

const FEATURES = [
  {
    Icon: Search,
    titleKey: 'landing.feat1Title',
    descKey: 'landing.feat1Desc',
    to: '/diagnosis',
    gradient: 'from-blue-500 to-blue-700',
    iconBg: 'bg-blue-400/30',
  },
  {
    Icon: Wrench,
    titleKey: 'landing.feat2Title',
    descKey: 'landing.feat2Desc',
    to: '/service',
    gradient: 'from-orange-500 to-red-600',
    iconBg: 'bg-orange-300/30',
  },
  {
    Icon: Wallet,
    titleKey: 'landing.feat3Title',
    descKey: 'landing.feat3Desc',
    to: '/finance',
    gradient: 'from-emerald-500 to-teal-700',
    iconBg: 'bg-emerald-300/30',
  },
  {
    Icon: ClipboardList,
    titleKey: 'landing.feat4Title',
    descKey: 'landing.feat4Desc',
    to: '/knowhow',
    gradient: 'from-purple-500 to-indigo-700',
    iconBg: 'bg-purple-300/30',
  },
]

export default function LandingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const ctaTo = user ? '/home' : '/login'

  return (
    <div
      className="h-screen flex flex-col items-center px-6 pt-8 pb-6 relative"
      style={{ backgroundColor: 'var(--landing-bg)', color: 'var(--landing-text)' }}
    >

      {/* 우상단 로그인 버튼 (비로그인 시에만) */}
      {!user && (
        <Link
          to="/login"
          className="absolute top-3 right-4 text-xs px-3 py-1.5 rounded-md"
          style={{ backgroundColor: 'var(--landing-card)', color: 'var(--landing-text)', border: '1px solid var(--landing-card-border)' }}
        >
          {t('landing.login')}
        </Link>
      )}

      {/* 로고 */}
      <div className="flex flex-col items-center mb-4">
        <img src="/logo-transparent.png" alt="R-Pro" className="w-14 h-14 mb-2" />
        <h1 className="text-2xl font-bold tracking-tight">R-Pro</h1>
        <p className="text-sm mt-1 text-center leading-relaxed" style={{ color: 'var(--landing-muted)' }}>
          {t('landing.subtitle').split('\n').map((line, i) => (
            <span key={i}>{line}{i === 0 && <br />}</span>
          ))}
        </p>
      </div>

      {/* 기능 소개 */}
      <div className="w-full max-w-sm space-y-2.5 flex-1 min-h-0">
        {FEATURES.map(({ Icon, titleKey, descKey, to, gradient, iconBg }) => (
          <Link
            key={titleKey}
            to={to}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-md bg-gradient-to-br ${gradient} active:scale-[0.98] transition-transform`}
          >
            <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
              <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{t(titleKey)}</p>
              <p className="text-xs mt-0.5 text-white/80">{t(descKey)}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA 버튼 */}
      <div className="w-full max-w-sm mt-3 space-y-1.5">
        <Link
          to={ctaTo}
          replace
          className="block w-full py-4 bg-blue-600 active:bg-blue-700 rounded-xl text-sm font-semibold text-center text-white transition-colors"
        >
          {t('landing.start')}
        </Link>
        <p className="text-xs text-center" style={{ color: 'var(--landing-muted)' }}>
          {t('landing.offline')}
        </p>
      </div>

    </div>
  )
}
