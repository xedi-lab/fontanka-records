import { NavLink } from 'react-router-dom'
import { useAppContext } from '../App'
import { useState, useEffect } from 'react'

const baseTabs = [
  { to: '/', icon: HomeIcon, label: 'Главная' },
  { to: '/studios', icon: StudiosIcon, label: 'Залы' },
  { to: '/booking', icon: BookIcon, label: 'Запись' },
  { to: '/media', icon: MediaIcon, label: 'Медиа' },
  { to: '/profile', icon: ProfileIcon, label: 'Профиль' },
]

export function BottomNav() {
  const { isAdmin, pendingCount } = useAppContext()
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const initialHeight = vv.height
    const onResize = () => setHidden(vv.height < initialHeight * 0.85)
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  const tabs = isAdmin
    ? [...baseTabs, { to: '/admin', icon: AdminIcon, label: 'Админ' }]
    : baseTabs

  if (hidden) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bottom-nav-height z-50 border-t
      dark:bg-[#111] dark:border-white/10 bg-white border-black/10
      flex items-start pt-2">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-1 transition-colors
            ${isActive
              ? 'text-white'
              : 'dark:text-white/40 text-black/40 hover:dark:text-white/70 hover:text-black/70'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <Icon size={22} />
                {to === '/admin' && pendingCount > 0 && (
                  <span className={`absolute -top-1 -right-1.5 min-w-[16px] h-4 px-0.5
                    rounded-full bg-red-500 text-white text-[9px] font-bold
                    flex items-center justify-center leading-none
                    ${isActive ? '' : ''}`}>
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function HomeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}

function StudiosIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <path d="M8 21h8M12 17v4"/>
      <circle cx="9" cy="10" r="2"/>
      <path d="M13 10h4"/>
      <path d="M13 13h4"/>
    </svg>
  )
}

function BookIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
    </svg>
  )
}

function MediaIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"/>
      <path d="M8 20h8M12 16v4"/>
      <path d="M9 9h6M9 12h4"/>
    </svg>
  )
}

function ProfileIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function AdminIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  )
}
