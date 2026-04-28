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
    { label: 'TOTAL_INCIDENTS', value: incidents.length, icon: 'layers' },
    { label: 'CRITICAL', value: criticalCount, icon: 'warning' },
    { label: 'RESOLVED', value: totalResolved, icon: 'check_circle' },
    { label: 'RESOLUTION_RATE', value: incidents.length ? `${Math.round((totalResolved / incidents.length) * 100)}%` : '—', icon: 'analytics' },
  ]

  return (
    <AuthGuard requiredRoles={['admin', 'management'] as StaffRole[]}>
      <div className="flex min-h-screen bg-[var(--bg-base)] flex-col pb-[calc(76px+var(--safe-bottom))] lg:pb-0 font-body">
        {/* ═══════════════════════════════════════════════════════
            HEADER — Admin command bar
            ═══════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-[1000] bg-[var(--bg-base)] border-b-[2px] border-[var(--outline)] w-full pt-[var(--safe-top)]">
          <div className="max-w-[1200px] mx-auto px-5 h-16 sm:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 border-[2px] border-[var(--outline)] bg-[var(--surface)] text-[var(--text-muted)] no-underline hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all shrink-0">
                <span className="material-icons-sharp text-lg">arrow_back</span>
              </Link>
              <div className="flex flex-col min-w-0">
                <h1 className="font-display font-black text-base sm:text-lg text-[var(--text-primary)] tracking-tight uppercase leading-none m-0">
                  Analytics Core
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="live-dot" />
                  <span className="font-data text-[0.5rem] text-[var(--accent)] font-bold tracking-[0.2em] uppercase">
                    SECURE_STREAM
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0">
              <div className="flex items-center h-16 px-3 border-l-[2px] border-[var(--outline)]">
                <ThemeToggle />
              </div>
              <div className="hidden sm:flex items-center gap-2 h-16 px-4 border-l-[2px] border-[var(--outline)]">
                <div className="live-dot" />
                <span className="font-data text-[0.55rem] text-emerald-400 font-bold tracking-[0.15em]">LIVE</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1200px] mx-auto border-x-[2px] border-[var(--outline)] bg-[var(--bg-base)]">
          {/* ═══════════════════════════════════════════════════════
              ANALYTICS GRID — Stats bar
              ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 border-b-[2px] border-[var(--outline)]">
            {analyticsCards.map((card, idx) => (
              <div 
                key={idx} 
                className={`p-4 sm:p-5 flex flex-col gap-1 relative overflow-hidden group hover:bg-[var(--surface-low)] transition-colors ${
                  idx < analyticsCards.length - 1 ? 'border-r-[2px] border-[var(--outline)]' : ''
                } ${idx < 2 ? 'border-b-[2px] lg:border-b-0 border-[var(--outline)]' : ''}`}
              >
                <div className="absolute top-2 right-2 opacity-[0.04] group-hover:opacity-[0.1] transition-opacity">
                  <span className="material-icons-sharp text-3xl">{card.icon}</span>
                </div>
                <span className="font-data text-[0.5rem] font-bold tracking-[0.25em] text-[var(--text-muted)] uppercase">
                  {card.label}
                </span>
                <span className="font-data font-black text-2xl sm:text-3xl leading-none text-[var(--text-primary)] tracking-tight">
                  {card.value}
                </span>
              </div>
            ))}
          </div>

          {/* ═══════════════════════════════════════════════════════
              CONTROLS & LIST
              ═══════════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-6">
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b-[2px] border-[var(--outline)] border-dashed">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-[var(--accent)]" />
                <span className="font-data text-[0.6rem] font-black text-[var(--text-muted)] tracking-[0.2em] uppercase">
                  ACTIVE_ARCHIVE // <span className="text-[var(--accent)]">{incidents.length}</span>_ENTRIES
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <select 
                    className="w-full sm:w-auto h-9 border-[2px] border-[var(--outline)] bg-[var(--surface)] px-3 pr-8 font-data text-[0.6rem] font-black text-[var(--text-secondary)] tracking-[0.1em] uppercase appearance-none cursor-pointer outline-none focus:border-[var(--accent)] transition-colors" 
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value as CrisisType | 'all'); fetchIncidents(true); }}
                  >
                    <option value="all">TYPE: ALL</option>
                    <option value="fire">TYPE: FIRE</option>
                    <option value="medical">TYPE: MEDICAL</option>
                    <option value="security">TYPE: SECURITY</option>
                    <option value="structural">TYPE: STRUCTURAL</option>
                    <option value="power">TYPE: POWER</option>
                  </select>
                  <span className="material-icons-sharp absolute right-2 top-1/2 -translate-y-1/2 text-base pointer-events-none opacity-40">expand_more</span>
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <select 
                    className="w-full sm:w-auto h-9 border-[2px] border-[var(--outline)] bg-[var(--surface)] px-3 pr-8 font-data text-[0.6rem] font-black text-[var(--text-secondary)] tracking-[0.1em] uppercase appearance-none cursor-pointer outline-none focus:border-[var(--accent)] transition-colors" 
                    value={filterSeverity}
                    onChange={(e) => { setFilterSeverity(e.target.value as SeverityLevel | 'all'); fetchIncidents(true); }}
                  >
                    <option value="all">SEV: ALL</option>
                    <option value="critical">SEV: CRITICAL</option>
                    <option value="high">SEV: HIGH</option>
                    <option value="medium">SEV: MEDIUM</option>
                    <option value="low">SEV: LOW</option>
                  </select>
                  <span className="material-icons-sharp absolute right-2 top-1/2 -translate-y-1/2 text-base pointer-events-none opacity-40">expand_more</span>
                </div>
              </div>
            </div>

            {/* Incident list */}
            <div className="grid grid-cols-1 gap-2">
              {loading && incidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-[var(--surface-low)] border-[2px] border-[var(--outline)] border-dashed">
                  <div className="w-8 h-8 border-[2px] border-[var(--outline)] border-t-[var(--accent)] animate-spin" />
                  <div className="font-data text-[0.6rem] text-[var(--text-muted)] font-black tracking-[0.2em] animate-pulse uppercase">QUERYING_DATABASE_NODE...</div>
                </div>
              ) : incidents.length === 0 ? (
                <div className="border-[2px] border-[var(--outline)] border-dashed bg-[var(--surface-low)] text-center py-20">
                  <span className="material-icons-sharp text-4xl text-[var(--text-muted)] opacity-20 mb-4 block">inventory_2</span>
                  <div className="font-data text-[0.6rem] text-[var(--text-muted)] font-black tracking-[0.2em] uppercase">ZERO_MATCHING_RECORDS_FOUND</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {incidents.map(incident => (
                    <IncidentCard key={incident.id} incident={incident} compact={true} />
                  ))}
                </div>
              )}
            </div>

            {/* Load more */}
            {hasMore && !loading && incidents.length > 0 && (
              <div className="flex justify-center mt-6">
                <button 
                  className="w-full h-12 border-[2px] border-[var(--outline)] bg-[var(--surface)] font-data text-[0.65rem] font-black tracking-[0.2em] text-[var(--text-secondary)] uppercase hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer active:bg-[var(--accent-muted)]" 
                  onClick={() => fetchIncidents(false, lastDoc)}
                >
                  LOAD_NEXT_PAGE_OF_RECORDS
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
