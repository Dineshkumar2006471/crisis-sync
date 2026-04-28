'use client'
// app/dashboard/page.tsx
import { useEffect, useState, useMemo } from 'react'
import { collection, onSnapshot, query, where, orderBy, limit, QueryConstraint } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '@/lib/firebase'
import { Incident, ResponseLogEntry } from '@/lib/types'
import { IncidentCard } from '@/components/IncidentCard'
import { AlertBanner } from '@/components/AlertBanner'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import { ThemeToggle } from '@/components/ThemeToggle'
import { MobileNavBar } from '@/components/MobileNavBar'
import { clearStaffSession, getSavedStaffSession, StaffSession } from '@/lib/staffProfile'
import { toDate } from '@/lib/utils'

const NAV_ITEMS = [
  { icon: 'dashboard', label: 'Command', href: '/dashboard' },
  { icon: 'map', label: 'Tactical Map', href: '/dashboard/map' },
  { icon: 'bolt', label: 'Features', href: '/dashboard/features' },
  { icon: 'history', label: 'Audit Logs', href: '/dashboard/logs' },
  { icon: 'settings', label: 'Settings', href: '/dashboard/settings' },
]

type DashboardLogEntry = ResponseLogEntry & {
  incidentId: string
  incidentType: Incident['crisis_type']
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-base)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        letterSpacing: '0.1em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="live-dot" />
          INITIALIZING OPERATOR TERMINAL...
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const e2eBypassEnabled =
    process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true'
  const [staffSession] = useState<StaffSession | null>(() => getSavedStaffSession())
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([])
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState({ total: 0, critical: 0, resolved: 0, active: 0 })
  const [syncStatus, setSyncStatus] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'resolved' | 'active'>('all')
  const [clockText, setClockText] = useState('--:--')
  const hotelId = staffSession?.hotel_id || 'hotel_001'
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const updateClock = () => {
      setClockText(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
    }

    updateClock()
    const intervalId = window.setInterval(updateClock, 30_000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!auth.currentUser && !e2eBypassEnabled) return

    const constraints: QueryConstraint[] = [
      where('hotel_id', '==', hotelId),
      orderBy('created_at', 'desc'),
      limit(40),
    ]

    const incidentsQuery = query(collection(db, 'incidents'), ...constraints)
    const unsubscribe = onSnapshot(
      incidentsQuery,
      (snapshot) => {
        const incidents = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Incident))
          .sort((a, b) => toDate(b.created_at).getTime() - toDate(a.created_at).getTime())

        setRecentIncidents(incidents)
        setLiveIncidents(incidents.filter((incident) => incident.status !== 'resolved'))
        setStats({
          total: incidents.length,
          active: incidents.filter((incident) => incident.status !== 'resolved').length,
          critical: incidents.filter(
            (incident) => incident.status !== 'resolved' && incident.severity === 'critical'
          ).length,
          resolved: incidents.filter((incident) => incident.status === 'resolved').length,
        })
        setSyncStatus('CONNECTED')
      },
      (err) => {
        console.error('Fetch error:', err)
        setSyncStatus('DISCONNECTED')
      }
    )

    return () => unsubscribe()
  }, [e2eBypassEnabled, hotelId])

  const combinedLogs = useMemo(() => {
    const allLogs: DashboardLogEntry[] = []
    liveIncidents.forEach(inc => {
      if (inc.response_log) {
        inc.response_log.forEach(log => {
          allLogs.push({ ...log, incidentId: inc.id, incidentType: inc.crisis_type })
        })
      }
      allLogs.push({
        staff_uid: 'system',
        staff_name: 'SYSTEM',
        action: `${inc.crisis_type.toUpperCase()} incident reported at ${inc.location_description}`,
        timestamp: inc.created_at,
        incidentId: inc.id,
        incidentType: inc.crisis_type
      })
    })
    recentIncidents.forEach(inc => {
      if (liveIncidents.find(li => li.id === inc.id)) return
      if (inc.response_log) {
        inc.response_log.forEach(log => {
          allLogs.push({ ...log, incidentId: inc.id, incidentType: inc.crisis_type })
        })
      }
      allLogs.push({
        staff_uid: 'system',
        staff_name: 'SYSTEM',
        action: `${inc.crisis_type.toUpperCase()} incident reported`,
        timestamp: inc.created_at,
        incidentId: inc.id,
        incidentType: inc.crisis_type
      })
    })
    return allLogs.sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime()).slice(0, 15)
  }, [liveIncidents, recentIncidents])

  const filteredIncidents = useMemo(() => {
    const all = [...liveIncidents]
    recentIncidents.forEach((recentIncident) => {
      if (!all.find((liveIncident) => liveIncident.id === recentIncident.id)) {
        all.push(recentIncident)
      }
    })

    return all
      .filter((incident) => {
        if (activeFilter === 'critical') return incident.severity === 'critical'
        if (activeFilter === 'resolved') return incident.status === 'resolved'
        if (activeFilter === 'active') return incident.status !== 'resolved'
        return true
      })
      .sort((a, b) => toDate(b.created_at).getTime() - toDate(a.created_at).getTime())
  }, [activeFilter, liveIncidents, recentIncidents])

  const handleLogout = async () => {
    await signOut(auth)
    clearStaffSession()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)] relative w-full overflow-hidden font-body">

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative w-full overflow-hidden pb-24 lg:pb-0">
        {/* ═══════════════════════════════════════════════════════
            HEADER — Brute Editorial command bar
            ═══════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-[1000] bg-[var(--bg-base)] border-b-[2px] border-[var(--outline)] w-full pt-[var(--safe-top)]">
          <div className="mx-auto px-5 h-16 sm:h-16 sm:px-8 flex items-center justify-between w-full box-border">
            <div className="flex items-center gap-4 min-w-0">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center gap-3">
                <div className="live-dot" />
                <span className="font-display font-black text-sm tracking-tight uppercase">CrisisSync</span>
              </div>
              
              {/* Desktop Sector Label */}
              <div className="hidden md:flex items-center gap-3 border-[2px] border-[var(--outline)] bg-[var(--surface)] px-4 py-2 font-data text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                <span className="material-icons-sharp text-lg text-[var(--accent)]">shield</span>
                SECURE_SECTOR // {hotelId.toUpperCase()}
              </div>
            </div>

            <div className="flex items-center gap-0">
              {/* Sync status */}
              <div className="hidden sm:flex items-center gap-2 h-16 px-4 border-l-[2px] border-[var(--outline)]">
                <div className={`w-2 h-2 ${syncStatus === 'CONNECTED' ? 'bg-emerald-500' : syncStatus === 'CONNECTING' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`} />
                <span className="font-data text-[0.55rem] font-bold tracking-[0.15em] text-[var(--text-muted)]">
                  {syncStatus}
                </span>
              </div>

              {/* Clock */}
              <div className="hidden sm:flex items-center h-16 px-4 border-l-[2px] border-[var(--outline)]">
                <span className="font-data text-[0.7rem] font-black text-[var(--text-secondary)]">
                  {clockText}
                </span>
              </div>

              <div className="flex items-center h-16 px-3 border-l-[2px] border-[var(--outline)]">
                <ThemeToggle />
              </div>

              {/* User menu */}
              <div className="relative h-16 flex items-center px-3 border-l-[2px] border-[var(--outline)]">
                <div 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`w-9 h-9 bg-[var(--surface)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer border-[2px] transition-all shrink-0 ${showUserMenu ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--outline)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}
                >
                  <span className="material-icons-sharp text-xl">person</span>
                </div>

                {showUserMenu && (
                  <div className="absolute top-[calc(100%+4px)] right-0 z-[2000] w-64 border-[2px] border-[var(--outline)] bg-[var(--surface)] animate-fade-in-up">
                    <div className="px-5 py-4 border-b-[2px] border-[var(--outline)]">
                      <div className="font-display text-sm font-black uppercase tracking-tight">{staffSession?.display_name || 'Operator'}</div>
                      <div className="font-data text-[0.55rem] text-[var(--accent)] mt-1 font-bold tracking-[0.2em]">
                        ROLE: {staffSession?.role?.toUpperCase() || 'STAFF'}
                      </div>
                    </div>
                    <button 
                      className="w-full bg-transparent border-none cursor-pointer flex items-center gap-3 px-5 py-4 font-data text-[0.7rem] font-bold text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-400 transition-colors uppercase tracking-[0.15em]"
                      onClick={handleLogout}
                    >
                      <span className="material-icons-sharp text-lg">power_settings_new</span>
                      TERMINATE_SESSION
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-[220px_1fr_360px] gap-0 mx-auto w-full box-border">
          {/* ═══════════════════════════════════════════════════════
              SIDEBAR — Desktop navigation
              ═══════════════════════════════════════════════════════ */}
          <aside className="hidden xl:flex h-full bg-[var(--surface)] border-r-[2px] border-[var(--outline)] flex-col flex-shrink-0 overflow-hidden">
            {/* Link status */}
            <div className="p-5 border-b-[2px] border-[var(--outline)]">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 ${syncStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                <div className="flex flex-col">
                  <span className="font-data text-[0.5rem] text-[var(--text-muted)] font-bold tracking-[0.15em]">LINK_STATUS</span>
                  <span className={`font-data text-[0.6rem] font-black ${syncStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {syncStatus}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex-1 flex flex-col py-2">
              {NAV_ITEMS.map(item => (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center gap-3 px-5 py-3.5 no-underline transition-all border-l-[2px] font-data text-[0.7rem] font-bold tracking-[0.1em] uppercase ${
                    pathname === item.href 
                      ? 'border-l-[var(--accent)] bg-[var(--surface-low)] text-[var(--accent)]' 
                      : 'border-l-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-low)]'
                  }`}
                >
                  <span className="material-icons-sharp text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t-[2px] border-[var(--outline)] p-3">
              <button 
                className="w-full bg-transparent border-[2px] border-[var(--outline)] cursor-pointer flex items-center gap-3 px-4 py-3 font-data text-[0.65rem] font-bold text-[var(--text-muted)] hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all uppercase tracking-[0.12em]"
                onClick={handleLogout}
              >
                <span className="material-icons-sharp text-lg">logout</span>
                END_SESSION
              </button>
            </div>
          </aside>

          {/* ═══════════════════════════════════════════════════════
              MAIN FEED — Incidents & stats
              ═══════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-0 min-w-0 overflow-y-auto custom-scrollbar">
            <AlertBanner alerts={liveIncidents} />
            
            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b-[2px] border-[var(--outline)]">
              {[
                { id: 'active', label: 'ACTIVE', value: stats.active, icon: 'sensors', accent: false },
                { id: 'critical', label: 'CRITICAL', value: stats.critical, icon: 'report', accent: false },
                { id: 'resolved', label: 'RESOLVED', value: stats.resolved, icon: 'check_circle', accent: false },
                { id: 'all', label: 'TOTAL', value: stats.total + stats.active, icon: 'database', accent: false },
              ].map((stat, i) => (
                <div
                  key={stat.label} 
                  onClick={() => setActiveFilter(stat.id as typeof activeFilter)}
                  className={`flex cursor-pointer flex-col p-5 transition-all relative ${
                    i < 3 ? 'border-r-[2px] border-[var(--outline)]' : ''
                  } ${
                    activeFilter === stat.id 
                      ? 'bg-[var(--surface)] border-b-[2px] border-b-[var(--accent)]' 
                      : 'hover:bg-[var(--surface-low)]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`material-icons-sharp text-lg ${activeFilter === stat.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] opacity-40'}`}>{stat.icon}</span>
                  </div>
                  <div className="font-data text-3xl font-black text-[var(--text-primary)] leading-none mb-1.5 tracking-tight">
                    {stat.value.toString().padStart(2, '0')}
                  </div>
                  <div className="font-data text-[0.5rem] font-bold text-[var(--text-muted)] tracking-[0.2em]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Incidents list */}
            <div className="p-5 md:p-8 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-px bg-[var(--accent)]" />
                  <span className="font-data text-[0.65rem] font-bold text-[var(--text-muted)] tracking-[0.2em] uppercase">
                    {activeFilter === 'resolved' ? 'MISSION_ARCHIVE' : 'LIVE_OPERATIONS'}
                  </span>
                </div>
                <span className="font-data text-[0.55rem] text-[var(--text-muted)] font-bold tracking-[0.15em]">
                  FILTER: {activeFilter.toUpperCase()}
                </span>
              </div>
              
              <div className="flex flex-col gap-4">
                {filteredIncidents.map(incident => (
                  <IncidentCard 
                    key={incident.id} 
                    incident={incident} 
                    compact={activeFilter === 'all' && incident.status === 'resolved'} 
                  />
                ))}

                {liveIncidents.length === 0 && recentIncidents.length === 0 && (
                  <div className="border-[2px] border-[var(--outline)] bg-[var(--surface)] px-6 py-20 text-center">
                    <span className="material-icons-sharp text-5xl text-emerald-500/20 mb-4 block">verified_user</span>
                    <div className="font-data text-sm font-black tracking-[0.2em] text-[var(--text-primary)] mb-2">ALL_SECTORS_SECURE</div>
                    <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed font-body">
                      No active threats detected. Monitoring protocols active.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              TELEMETRY PANEL — Desktop right sidebar
              ═══════════════════════════════════════════════════════ */}
          <aside className="hidden xl:flex h-full flex-col gap-0 border-l-[2px] border-[var(--outline)] bg-[var(--surface)]">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Telemetry header */}
              <div className="px-6 py-5 border-b-[2px] border-[var(--outline)] flex items-center gap-3">
                <span className="material-icons-sharp text-lg text-[var(--accent)]">analytics</span>
                <span className="font-data text-[0.65rem] font-bold text-[var(--text-muted)] tracking-[0.2em] uppercase">
                  TELEMETRY_STREAM
                </span>
              </div>

              {/* Log entries */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {combinedLogs.map((log, i) => (
                  <div key={i} className="px-6 py-4 border-b-[2px] border-[var(--outline)] hover:bg-[var(--surface-low)] transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-data font-black text-[0.6rem] tracking-[0.1em] ${log.staff_name === 'SYSTEM' ? 'text-[var(--text-muted)]' : 'text-[var(--accent)]'}`}>
                        {log.staff_name}
                      </span>
                      <span className="font-data text-[0.55rem] text-[var(--text-muted)] font-bold">
                        {toDate(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <Link href={`/incident/${log.incidentId}`} className="no-underline hover:opacity-80 transition-opacity">
                      <div className="text-[0.75rem] leading-relaxed text-[var(--text-secondary)] font-body">
                        <span className="inline-block mr-2 border-[2px] border-[var(--outline)] bg-[var(--surface-low)] px-1.5 py-0.5 font-data text-[0.55rem] font-black uppercase tracking-wider text-[var(--text-muted)]">
                          {log.incidentType}
                        </span>
                        {log.action}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="p-5 border-t-[2px] border-[var(--outline)] bg-[var(--surface-low)]">
              <span className="font-data text-[0.55rem] font-bold text-[var(--text-muted)] tracking-[0.2em] uppercase block mb-4">
                QUICK_ACTIONS
              </span>
              <Link href="/report" className="no-underline block">
                <button className="btn-tactical w-full py-4 flex items-center justify-center gap-3">
                  <span className="material-icons-sharp">emergency</span>
                  <span className="font-display text-sm font-black tracking-widest">REPORT INCIDENT</span>
                </button>
              </Link>
              <a href="tel:112" className="no-underline mt-3 block">
                <button className="w-full py-3 flex items-center justify-center gap-2 border-[2px] border-[var(--outline)] bg-transparent text-[var(--text-secondary)] font-data text-[0.7rem] font-bold tracking-[0.15em] uppercase hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all cursor-pointer">
                  <span className="material-icons-sharp text-lg">call</span>
                  EMERGENCY_CALL // 112
                </button>
              </a>
            </div>
          </aside>
        </div>
      </main>

      <MobileNavBar />
    </div>
  )
}
