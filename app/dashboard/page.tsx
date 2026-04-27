'use client'
// app/dashboard/page.tsx
import { useEffect, useState, useMemo } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { collection, query, orderBy, limit, getDocs, QueryConstraint } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { rtdb, db, auth } from '@/lib/firebase'
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
  { icon: 'dashboard', label: 'Home', href: '/dashboard' },
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
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const [staffSession] = useState<StaffSession | null>(() => getSavedStaffSession())
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([])
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState({ total: 0, critical: 0, resolved: 0, active: 0 })
  const [syncStatus, setSyncStatus] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'resolved' | 'active'>('all')
  const hotelId = staffSession?.hotel_id || 'default'
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!auth.currentUser) return

    const liveRef = ref(rtdb, 'live_incidents')
    onValue(liveRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const incidents = (Object.values(data) as Incident[])
        setLiveIncidents(incidents.sort((a, b) => {
          return toDate(b.created_at).getTime() - toDate(a.created_at).getTime()
        }))
        setStats(prev => ({
          ...prev,
          active: incidents.length,
          critical: incidents.filter(i => i.severity === 'critical').length,
        }))
      } else {
        setLiveIncidents([])
      }
      setSyncStatus('CONNECTED')
    }, () => setSyncStatus('DISCONNECTED'))

    const fetchRecent = async () => {
      try {
        const constraints: QueryConstraint[] = [orderBy('created_at', 'desc'), limit(10)]
        const q = query(collection(db, 'incidents'), ...constraints)
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Incident))
        setRecentIncidents(data)
        setStats(prev => ({
          ...prev,
          total: data.length,
          resolved: data.filter(i => i.status === 'resolved').length,
        }))
      } catch (err) {
        console.error('Fetch error:', err)
      }
    }
    fetchRecent()

    return () => off(liveRef)
  }, [hotelId])

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
    <div className="flex h-screen bg-[var(--bg-base)] relative w-full overflow-hidden font-[var(--font-body)]">

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen relative w-full overflow-hidden pb-24 lg:pb-0">
        {/* Optimized Header */}
        <header className="sticky top-0 z-[1000] bg-[#0A0C10]/95 backdrop-blur-2xl border-b border-[var(--outline-variant)] w-full pt-[var(--safe-top)]">
          <div className="max-w-[1600px] mx-auto px-5 h-16 sm:h-20 sm:px-8 flex items-center justify-between w-full box-border">
            <div className="flex items-center gap-4 min-w-0">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white flex-shrink-0">
                  <span className="material-icons-round text-xl">security</span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="font-[var(--font-headline)] font-black text-sm text-white tracking-tight leading-none uppercase truncate">
                    Crisis Sync
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="mono-display text-[0.5rem] text-[var(--accent)] font-black uppercase tracking-[0.1em]">
                      Live_Stream
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Desktop Sector Label */}
              <div className="hidden md:flex items-center gap-3 text-[0.8rem] font-extrabold text-[var(--text-muted)] truncate bg-[var(--surface-high)] px-3 py-1.5 rounded-lg border border-[var(--outline-variant)]">
                <span className="material-icons-round text-lg text-[var(--accent)]">shield</span>
                SECURE SECTOR / {hotelId.toUpperCase()}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[var(--text-muted)] border-r border-[var(--outline-variant)] pr-4 mr-1">
                <span className="material-icons-round text-lg">schedule</span>
                <span className="mono-display text-[0.75rem] font-black">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
              <ThemeToggle />
              <div className="relative">
                <div 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--surface-high)] flex items-center justify-center text-[var(--accent)] cursor-pointer border transition-all shrink-0 ${showUserMenu ? 'border-[var(--accent)] shadow-[0_0_15px_rgba(255,153,51,0.2)]' : 'border-[var(--outline-variant)] hover:border-[var(--accent)]'}`}
                >
                  <span className="material-icons-round text-2xl">account_circle</span>
                </div>

                {showUserMenu && (
                  <div className="absolute top-[calc(100%+12px)] right-0 w-64 bg-[var(--surface)] rounded-2xl p-2 z-[2000] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-[var(--outline-variant)] animate-fade-in-up">
                    <div className="px-4 py-3 border-b border-[var(--outline-variant)] mb-1">
                      <div className="text-[0.85rem] font-black uppercase text-white">{staffSession?.display_name || 'Emergency Operator'}</div>
                      <div className="mono-display text-[0.6rem] text-[var(--accent)] mt-1 font-black tracking-widest">
                        {staffSession?.role?.toUpperCase() || 'STAFF OFFICER'}
                      </div>
                    </div>
                    <button 
                      className="nav-item hover:bg-[rgba(255,59,59,0.1)] hover:text-[var(--critical)] w-full bg-transparent border-none cursor-pointer flex justify-start px-4 py-3 transition-colors"
                      onClick={handleLogout}
                    >
                      <span className="material-icons-round text-lg">power_settings_new</span>
                      <span className="mono-display text-[0.75rem] font-black">End Session</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-[240px_1fr_380px] gap-0 max-w-full mx-auto w-full box-border">
          {/* Sidebar - Desktop Integration */}
          <aside className="hidden xl:flex h-full bg-[var(--surface-low)] border-r border-[var(--outline-variant)] flex-col py-8 z-50 flex-shrink-0 overflow-hidden">
            <div className="px-6 pb-8">
              <div className="flex items-center gap-2 mt-6 bg-[var(--surface-high)] px-3.5 py-2.5 rounded-lg border border-[var(--outline-variant)]">
                <div className="flex flex-col">
                  <span className="mono-display text-[0.6rem] text-[var(--text-muted)] font-bold">LINK_STATUS:</span>
                  <span className={`mono-display text-[0.65rem] font-black ${syncStatus === 'CONNECTED' ? 'text-[var(--low)]' : 'text-[var(--critical)]'}`}>
                    {syncStatus}
                  </span>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-3">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href} className={`nav-item mb-2 ${pathname === item.href ? 'active' : ''}`}>
                  <span className="material-icons-round text-xl">{item.icon}</span>
                  <span className="mono-display text-[0.75rem]">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="px-4 pt-4 border-t border-[var(--outline-variant)]">
              <button className="nav-item hover-accent w-full bg-transparent border-none cursor-pointer" onClick={handleLogout}>
                <span className="material-icons-round text-xl">logout</span>
                <span className="mono-display text-[0.75rem]">Term Session</span>
              </button>
            </div>
          </aside>
          {/* Main Feed */}
          <div className="flex flex-col gap-6 min-w-0 overflow-y-auto custom-scrollbar p-4 md:p-8">
            <AlertBanner />
            
            {/* Stats Dashboard */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'active', label: 'ACTIVE', value: stats.active, color: 'var(--accent)', icon: 'sensors' },
                { id: 'critical', label: 'CRITICAL', value: stats.critical, color: 'var(--critical)', icon: 'report' },
                { id: 'resolved', label: 'RESOLVED', value: stats.resolved, color: 'var(--low)', icon: 'check_circle' },
                { id: 'all', label: 'TOTAL', value: stats.total + stats.active, color: 'var(--text-muted)', icon: 'database' },
              ].map(stat => (
                <div 
                  key={stat.label} 
                  onClick={() => setActiveFilter(stat.id as typeof activeFilter)}
                  className={`crisis-card p-4 flex flex-col cursor-pointer transition-all border ${activeFilter === stat.id ? 'bg-[var(--surface-high)] border-[var(--accent)] shadow-[0_0_20px_rgba(255,153,51,0.1)]' : 'border-transparent hover:border-[var(--outline-variant)]'}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`material-icons-round text-xl ${activeFilter === stat.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{stat.icon}</span>
                  </div>
                  <div className="text-3xl font-black text-white leading-none mb-1">
                    {stat.value.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[0.6rem] font-black text-[var(--text-muted)] mono-display tracking-widest">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Incidents Section */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <div className="mono-display text-[0.7rem] font-black text-[var(--accent)] tracking-widest flex items-center gap-2">
                  {activeFilter === 'resolved' ? 'MISSION ARCHIVE' : 'LIVE OPERATIONS'}
                </div>
                <div className="mono-display text-[0.6rem] text-[var(--text-muted)] font-black">
                  FILTER: {activeFilter.toUpperCase()}
                </div>
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
                  <div className="crisis-card tactical-border text-center py-16 px-6 bg-white/2">
                    <span className="material-icons-round text-5xl text-[var(--low)] opacity-20 mb-4 font-thin">verified_user</span>
                    <div className="mono-display text-[0.85rem] font-black tracking-[0.2em]">ALL SECTORS SECURE</div>
                    <p className="mt-3 text-[0.8rem] text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">No active threats detected. Monitoring protocols active.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Telemetry Panel - Desktop Only */}
          <aside className="hidden xl:flex h-full flex-col gap-0 border-l border-[var(--outline-variant)] bg-[var(--surface-low)]">
            <div className="p-6 flex-1 flex flex-col overflow-hidden">
              <div className="mono-display text-[0.7rem] font-black text-[var(--accent)] mb-6 flex items-center gap-2 border-b border-[var(--outline-variant)] pb-4">
                <span className="material-icons-round text-lg">analytics</span>
                TELEMETRY_STREAM
              </div>
              <div className="flex-1 overflow-hidden pr-2 space-y-4">
                {combinedLogs.map((log, i) => (
                  <div key={i} className="text-[0.75rem] border-b border-[var(--outline-variant)] pb-4 last:border-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className={`font-black text-[0.65rem] mono-display ${log.staff_name === 'SYSTEM' ? 'text-[var(--text-muted)]' : 'text-[var(--accent)]'}`}>
                        {log.staff_name}
                      </span>
                      <span className="text-[0.6rem] text-[var(--text-muted)] font-bold">
                        {toDate(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </div>
                    <Link href={`/incident/${log.incidentId}`} className="no-underline hover:opacity-80 transition-opacity">
                      <div className="leading-snug text-white/90">
                        <span className="font-[var(--font-mono)] uppercase text-[0.6rem] font-black mr-2 bg-[var(--surface-high)] px-1.5 py-0.5 rounded border border-[var(--outline-variant)]">
                          {log.incidentType}
                        </span>
                        {log.action}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-[var(--surface-high)] border-t border-[var(--outline-variant)]">
               <div className="mono-display text-[0.7rem] font-black text-white mb-4 tracking-widest opacity-60">QUICK ACTIONS</div>
               <Link href="/report">
                <button className="btn-tactical w-full py-4 flex items-center justify-center gap-3">
                  <span className="material-icons-round">add_alert</span>
                  <span className="mono-display text-sm font-black">REPORT INCIDENT</span>
                </button>
              </Link>
              <a href="tel:112" className="no-underline mt-3 block">
                <button className="btn-ghost hover:border-[var(--critical)] hover:text-[var(--critical)] w-full py-3 flex items-center justify-center gap-2 transition-colors">
                  <span className="material-icons-round text-lg">emergency</span>
                  <span className="mono-display text-[0.75rem] font-black">EMERGENCY CALL</span>
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
