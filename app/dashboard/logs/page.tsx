'use client'
import { useEffect, useState, useMemo } from 'react'
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toDate } from '@/lib/utils'
import { MobileNavBar } from '@/components/MobileNavBar'
import { AuthGuard } from '@/components/AuthGuard'
import Link from 'next/link'
import { Timestamp } from 'firebase/firestore'
import { getSavedStaffSession } from '@/lib/staffProfile'

interface ActivityLog {
  id: string
  staff_name: string
  action: string
  timestamp: string | Timestamp
  incidentId: string
  incidentType: string
  severity: string
  type: string
  status?: string
}

export default function LogsPage() {
  return (
    <AuthGuard>
      <LogsContent />
    </AuthGuard>
  )
}

function LogsContent() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const hotelId = getSavedStaffSession()?.hotel_id || 'default'

  useEffect(() => {
    const q = query(
      collection(db, 'logs'),
      where('hotelId', '==', hotelId),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[]
      setLogs(data)
      setLoading(false)
    }, (error) => {
      console.error("Logs Stream Error:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [hotelId])

  const groupedLogs = useMemo(() => {
    const groups: { [key: string]: ActivityLog[] } = {}
    logs.forEach(log => {
      const dateObj = toDate(log.timestamp)
      const dateKey = dateObj.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(log)
    })
    return groups
  }, [logs])

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] flex flex-col w-full overflow-x-hidden">
      {/* Native Tactical Header */}
      <header className="sticky top-0 z-[100] bg-[var(--bg-base)]/80 backdrop-blur-3xl border-b border-[var(--outline-variant)] pt-[var(--safe-top)]">
        <div className="h-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center border-2 border-[var(--outline-variant)] bg-[var(--surface-high)] text-[var(--text-primary)] no-underline transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{ borderRadius: '0px' }}
            >
              <span className="material-icons-sharp text-lg">arrow_back</span>
            </Link>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-[var(--accent)] animate-pulse" />
              <span className="mono-display text-[0.6rem] font-black text-[var(--accent)] tracking-[0.3em] uppercase">SYSTEM_JOURNAL</span>
              </div>
              <h1 className="font-[var(--font-headline)] font-black text-2xl tracking-tight text-white uppercase leading-none">
                Activity_Logs
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[var(--surface-high)] px-3 py-1.5 border-2 border-[var(--outline-variant)]" style={{ borderRadius: '0px' }}>
             <span className="material-icons-sharp text-xs text-[var(--accent)] animate-spin-slow">sync</span>
             <span className="mono-display text-[0.55rem] font-black text-[var(--text-muted)] tracking-widest">LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-[calc(80px+var(--safe-bottom))]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent animate-spin" />
            <span className="mono-display text-[0.6rem] font-black tracking-[0.4em] text-[var(--text-muted)] animate-pulse uppercase">Accessing_Archive...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
            <div className="w-20 h-20 bg-[var(--surface-high)] flex items-center justify-center mb-6 border-2 border-[var(--outline-variant)] opacity-20">
              <span className="material-icons-sharp text-4xl text-[var(--text-muted)]">history_toggle_off</span>
            </div>
            <div className="mono-display text-[0.8rem] font-black tracking-[0.4em] text-[var(--text-muted)] uppercase mb-2">Null_Activity</div>
            <p className="text-[0.7rem] text-[var(--text-secondary)] max-w-[200px] leading-relaxed opacity-40 font-medium">No tactical events recorded in this cycle.</p>
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
              <div key={date} className="flex flex-col w-full">
                {/* Date Header */}
                <div className="px-6 py-4 bg-[var(--surface-high)]/20 border-b border-[var(--outline-variant)] flex items-center justify-between">
                  <span className="mono-display text-[0.65rem] font-black text-white/40 tracking-widest uppercase">
                    {date === todayStr ? 'TODAY // OPERATIONS' : date}
                  </span>
                  <div className="h-[1px] flex-1 mx-4 bg-[var(--outline-variant)]/20" />
                  <span className="mono-display text-[0.5rem] font-black text-[var(--text-muted)] uppercase">
                    {dateLogs.length} Events
                  </span>
                </div>

                <div className="w-full">
                  {dateLogs.map((log) => (
                    <Link 
                      key={log.id} 
                      href={`/incident/${log.incidentId}`}
                      className="block w-full active:bg-[var(--surface-high)]/60 transition-colors no-underline"
                    >
                      <div className="px-6 py-5 flex gap-5 items-start border-b border-[var(--outline-variant)]/30">
                        {/* Status Icon */}
                        <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                          log.severity === 'critical' ? 'bg-red-500/10 border-red-500/40 text-red-500' :
                          log.severity === 'high' ? 'bg-orange-500/10 border-orange-500/40 text-orange-500' :
                          'bg-[var(--accent)]/10 border-[var(--accent)]/40 text-[var(--accent)]'
                        }`} style={{ borderRadius: '0px' }}>
                          <span className="material-icons-sharp text-2xl">
                            {log.type === 'status_change' ? 'published_with_changes' : 
                             log.type === 'broadcast' ? 'campaign' :
                             log.type === 'photo_upload' ? 'photo_camera' : 'edit_note'}
                          </span>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <span className={`mono-display text-[0.55rem] font-black tracking-widest uppercase truncate ${
                                  log.staff_name?.includes('SYSTEM') ? 'text-[var(--text-muted)]' : 'text-[var(--accent)]'
                                }`}>
                                  {log.staff_name?.split('@')[0] || 'OP_CORE'}
                                </span>
                                <div className="w-1 h-1 bg-[var(--outline-variant)] shrink-0" />
                                <span className="mono-display text-[0.55rem] text-[var(--text-muted)] font-bold truncate">
                                  {log.incidentType?.toUpperCase()}
                                </span>
                             </div>
                             <span className="mono-display text-[0.55rem] text-white/30 font-black shrink-0 ml-2">
                               {toDate(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                             </span>
                          </div>
                          
                          <div className="text-[1.1rem] text-white font-black leading-tight tracking-tight uppercase truncate">
                            {log.action}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5">
                             <div className={`px-2 py-0.5 border text-[0.5rem] font-black uppercase tracking-widest ${
                                log.status === 'resolved' ? 'bg-green-500/10 border-green-500/40 text-green-500' : 'bg-[var(--surface-high)] border-[var(--outline-variant)] text-[var(--text-muted)]'
                             }`} style={{ borderRadius: '0px' }}>
                               {log.status || 'ACTIVE'}
                             </div>
                             <span className="mono-display text-[0.5rem] text-[var(--text-muted)] font-black tracking-[0.2em] opacity-40">
                               REF_{log.incidentId.slice(-6).toUpperCase()}
                             </span>
                          </div>
                        </div>
                        
                        <div className="self-center opacity-20">
                          <span className="material-icons-sharp text-xl text-white">chevron_right</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <MobileNavBar />

      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
