import { NavLink } from 'react-router-dom'
import { Home, ScanSearch, Wrench, BookOpen, Settings, Receipt } from 'lucide-react'

const navItems = [
  { to: '/',          label: '홈',     Icon: Home },
  { to: '/diagnosis', label: '진단',   Icon: ScanSearch },
  { to: '/service',   label: '수리의뢰', Icon: Wrench },
  { to: '/expenses',  label: '경비내역', Icon: Receipt },
  { to: '/knowhow',   label: '노하우',  Icon: BookOpen },
  { to: '/settings',  label: '설정',   Icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-gray-300 flex">
      {navItems.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors ${
              isActive ? 'text-blue-600' : 'text-gray-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
