import { NavLink } from 'react-router-dom'
import { Home, ScanSearch, Wrench, BookOpen, Settings, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function BottomNav() {
  const { t } = useTranslation()

  const navItems = [
    { to: '/home',      label: t('nav.home'),      Icon: Home },
    { to: '/diagnosis', label: t('nav.diagnosis'), Icon: ScanSearch },
    { to: '/service',   label: t('nav.service'),   Icon: Wrench },
    { to: '/finance',   label: t('nav.finance'),   Icon: Wallet },
    { to: '/knowhow',   label: t('nav.knowhow'),   Icon: BookOpen },
    { to: '/settings',  label: t('nav.settings'),  Icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-300 flex">
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          replace
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 min-w-0 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="whitespace-nowrap truncate max-w-full px-0.5">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
