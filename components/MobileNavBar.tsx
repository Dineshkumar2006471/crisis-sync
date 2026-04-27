'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { icon: 'dashboard', label: 'Home', href: '/dashboard' },
  { icon: 'map', label: 'Map', href: '/dashboard/map' },
  { icon: 'add_circle', label: 'Report', href: '/report' },
  { icon: 'history', label: 'Logs', href: '/dashboard/logs' },
  { icon: 'settings', label: 'Admin', href: '/admin' },
]

export function MobileNavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[calc(68px+env(safe-area-inset-bottom))] bg-[var(--surface)]/95 backdrop-blur-2xl lg:hidden flex items-center justify-around px-3 pb-[env(safe-area-inset-bottom)] border-t border-[var(--outline-variant)] z-[10000] shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
      {ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/incident'))
        return (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 no-underline flex-1 h-[68px] transition-all duration-200 relative ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
          >
            {isActive && (
              <div className="absolute top-0 w-8 h-0.5 bg-[var(--accent)] rounded-b-full shadow-[0_0_12px_rgba(255,153,51,0.6)]" />
            )}
            <span 
              className={`material-icons-round text-[26px] transition-all duration-200 ${isActive ? 'scale-110 text-[var(--accent)]' : 'scale-100 text-[var(--text-secondary)] opacity-60'}`}
            >
              {item.icon}
            </span>
            <span className={`text-[9px] tracking-tight uppercase font-[var(--font-mono)] transition-opacity duration-200 ${isActive ? 'font-black opacity-100' : 'font-bold opacity-60'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
