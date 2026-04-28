'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { icon: 'dashboard', label: 'Command', href: '/dashboard' },
  { icon: 'map', label: 'Tactical', href: '/dashboard/map' },
  { icon: 'emergency', label: 'Report', href: '/report' },
  { icon: 'history', label: 'Logs', href: '/dashboard/logs' },
  { icon: 'admin_panel_settings', label: 'Admin', href: '/admin' },
]

export function MobileNavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[calc(72px+env(safe-area-inset-bottom))] bg-[var(--bg-base)] lg:hidden flex items-stretch px-0 pb-[env(safe-area-inset-bottom)] border-t-[2px] border-[var(--outline)] z-[10000]">
      {ITEMS.map((item, index) => {
        const isActive = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/incident'))
        const isReport = item.href === '/report'
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1.5 no-underline flex-1 relative transition-all duration-200 ${
              index < ITEMS.length - 1 ? 'border-r border-[var(--outline)]' : ''
            } ${
              isReport 
                ? 'bg-[var(--accent)] text-white' 
                : isActive 
                  ? 'bg-[var(--surface)] text-[var(--accent)]' 
                  : 'bg-[var(--bg-base)] text-[var(--text-muted)]'
            }`}
          >
            {isActive && !isReport && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)]" />
            )}
            <span 
              className={`material-icons-sharp text-[22px] transition-all duration-200 ${
                isActive || isReport ? 'scale-110' : 'scale-100 opacity-60'
              }`}
            >
              {item.icon}
            </span>
            <span className={`font-data text-[0.5rem] tracking-[0.15em] uppercase transition-opacity duration-200 ${
              isActive || isReport ? 'font-black opacity-100' : 'font-bold opacity-50'
            }`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
