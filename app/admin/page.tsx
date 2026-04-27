'use client'
// app/admin/page.tsx
import { useCallback, useEffect, useState } from 'react'
import { collection, query, orderBy, limit, getDocs, where, startAfter, QueryDocumentSnapshot, DocumentData, QueryConstraint } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Incident, CrisisType, SeverityLevel } from '@/lib/types'
import { IncidentCard } from '@/components/IncidentCard'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { StaffRole } from '@/lib/staffProfile'
import { MobileNavBar } from '@/components/MobileNavBar'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function AdminPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<CrisisType | 'all'>('all')
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all')
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchIncidents = useCallback(async (reset = false, cursor: QueryDocumentSnapshot<DocumentData> | null = null) => {
    setLoading(true)
    const effectiveLastDoc = reset ? null : cursor
    if (reset) {
      setLastDoc(null)
    }
    const constraints: QueryConstraint[] = []
    if (filterType && filterType !== 'all') constraints.push(where('crisis_type', '==', filterType))
    if (filterSeverity && filterSeverity !== 'all') constraints.push(where('severity', '==', filterSeverity))
    constraints.push(orderBy('created_at', 'desc'))
    constraints.push(limit(20))
    if (effectiveLastDoc) constraints.push(startAfter(effectiveLastDoc))

    try {
      const q = query(collection(db, 'incidents'), ...constraints)
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Incident))

      setIncidents(reset ? data : prev => [...prev, ...data])
      setLastDoc(snap.docs[snap.docs.length - 1] || null)
      setHasMore(snap.docs.length === 20)
    } catch (error) {
      console.error('Error fetching incidents:', error)
    } finally {
      setLoading(false)
    }
  }, [filterSeverity, filterType])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchIncidents(true)
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchIncidents])

  const totalResolved = incidents.filter(i => i.status === 'resolved').length
  const criticalCount = incidents.filter(i => i.severity === 'critical').length
  
  const analyticsCards = [
    { label: 'TOTAL INCIDENTS', value: incidents.length, color: 'var(--text-primary)', icon: 'layers' },
    { label: 'CRITICAL', value: criticalCount, color: 'var(--critical)', icon: 'warning' },
    { label: 'RESOLVED', value: totalResolved, color: 'var(--low)', icon: 'check_circle' },
    { label: 'RESOLUTION RATE', value: incidents.length ? `${Math.round((totalResolved / incidents.length) * 100)}%` : '—', color: 'var(--accent)', icon: 'analytics' },
  ]

  return (
    <AuthGuard requiredRoles={['admin', 'management'] as StaffRole[]}>
      <div className="flex min-h-screen bg-[var(--bg-base)] flex-col pb-[calc(76px+var(--safe-bottom))] lg:pb-0">
        <header className="sticky top-0 z-[1000] bg-[var(--bg-base)]/90 backdrop-blur-2xl border-b border-[var(--outline-variant)] w-full pt-[var(--safe-top)]">
          <div className="max-w-[1200px] mx-auto px-5 h-16 sm:h-20 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <Link href="/dashboard" className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-[var(--surface-high)] rounded-xl border border-[var(--outline-variant)] text-[var(--text-muted)] no-underline hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shrink-0">
                <span className="material-icons-round text-lg">arrow_back</span>
              </Link>
              <div className="flex flex-col min-w-0">
                <h1 className="font-[var(--font-headline)] font-black text-base sm:text-xl text-white tracking-tight uppercase truncate leading-none">
                  Analytics_Core
                </h1>
                <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                  <div className="live-dot w-1 h-1" />
                  <span className="mono-display text-[0.5rem] sm:text-[0.55rem] text-[var(--accent)] font-black uppercase tracking-widest opacity-80">
                    SECURE_STREAM
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden xs:flex items-center gap-2 bg-[rgba(52,199,89,0.05)] px-2.5 py-1 rounded-lg border border-[rgba(52,199,89,0.1)]">
                <div className="live-dot w-1 h-1" />
                <span className="mono-display text-[0.55rem] text-[var(--low)] font-black tracking-widest">LIVE</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8">
          {/* Analytics Section - More compact on mobile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {analyticsCards.map((card, idx) => (
              <div key={idx} className="crisis-card p-3 sm:p-5 flex flex-col gap-1 sm:gap-2 bg-[var(--surface)] border border-[var(--outline-variant)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-icons-round text-2xl">{card.icon}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-60">
                  <span className="mono-display text-[0.5rem] sm:text-[0.6rem] font-black tracking-widest truncate">
                    {card.label}
                  </span>
                </div>
                <div 
                  className="font-[var(--font-mono)] font-black text-xl sm:text-3xl leading-none mt-1"
                  style={{ color: card.color }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Controls & List */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="mono-display text-[0.65rem] sm:text-[0.7rem] font-black text-[var(--text-secondary)] tracking-[0.2em] uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                Records_Vault // <span className="text-[var(--accent)]">{incidents.length}</span>
              </h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <select 
                    className="crisis-input !w-full sm:!w-auto !py-2 !pl-3 !pr-8 !text-[0.7rem] !h-10 appearance-none bg-[var(--surface-high)]" 
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value as CrisisType | 'all'); fetchIncidents(true); }}
                  >
                    <option value="all">All Types</option>
                    <option value="fire">Fire</option>
                    <option value="medical">Medical</option>
                    <option value="security">Security</option>
                    <option value="structural">Structural</option>
                    <option value="power">Power</option>
                  </select>
                  <span className="material-icons-round absolute right-2 top-1/2 -translate-y-1/2 text-lg pointer-events-none opacity-40">expand_more</span>
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <select 
                    className="crisis-input !w-full sm:!w-auto !py-2 !pl-3 !pr-8 !text-[0.7rem] !h-10 appearance-none bg-[var(--surface-high)]" 
                    value={filterSeverity}
                    onChange={(e) => { setFilterSeverity(e.target.value as SeverityLevel | 'all'); fetchIncidents(true); }}
                  >
                    <option value="all">All Severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <span className="material-icons-round absolute right-2 top-1/2 -translate-y-1/2 text-lg pointer-events-none opacity-40">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:gap-4">
              {loading && incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-10 h-10 border-4 border-[var(--accent-muted)] border-t-[var(--accent)] rounded-full animate-spin" />
                  <div className="mono-display text-[0.7rem] text-[var(--text-muted)] font-black animate-pulse">ESTABLISHING_UPLINK...</div>
                </div>
              ) : incidents.length === 0 ? (
                <div className="crisis-card tactical-border text-center py-16 bg-white/[0.02]">
                  <span className="material-icons-round text-5xl text-[var(--text-muted)] opacity-20 mb-4">inventory_2</span>
                  <div className="mono-display text-[0.85rem] text-[var(--text-muted)] font-black tracking-widest uppercase">NO_RECORDS_AVAILABLE</div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {incidents.map(incident => (
                    <IncidentCard key={incident.id} incident={incident} compact={true} />
                  ))}
                </div>
              )}
            </div>

            {hasMore && !loading && incidents.length > 0 && (
              <div className="flex justify-center mt-10">
                <button 
                  className="btn-ghost !w-full max-w-sm !py-4 mono-display text-[0.75rem] font-black tracking-widest hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all bg-[var(--surface)]" 
                  onClick={() => fetchIncidents(false, lastDoc)}
                >
                  DECRYPT_MORE_DATA
                </button>
              </div>
            )}
          </div>
        </main>
        <MobileNavBar />
      </div>
    </AuthGuard>
  )
}
