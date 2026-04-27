'use client'
import { Incident } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'

const CRISIS_ICONS: Record<string, string> = {
  fire: '🔥',
  medical: '🏥',
  security: '🔒',
  structural: '🏗️',
  power: '⚡',
  other: '⚠️',
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
}

interface IncidentCardProps {
  incident: Incident
  compact?: boolean
}

export function IncidentCard({ incident, compact = false }: IncidentCardProps) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/incident/${incident.id}`)
  }

  return (
    <div 
      onClick={handleCardClick}
      className="group cursor-pointer block w-full no-underline"
    >
      <div className={`crisis-card ${incident.severity}-card tactical-border relative overflow-hidden transition-all duration-300 hover:border-[var(--accent)] group-active:scale-[0.98]`}>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-xl bg-[var(--surface-high)] flex items-center justify-center text-2xl border border-[var(--outline-variant)] flex-shrink-0 shadow-inner">
              {CRISIS_ICONS[incident.crisis_type] || '⚠️'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-[var(--font-headline)] font-black text-lg sm:text-xl text-white tracking-tight uppercase leading-tight truncate">
                {incident.location_description}
              </h3>
              <div className="flex items-center gap-2 mt-1 truncate">
                <span className="mono-display text-[0.6rem] font-black text-[var(--accent)] tracking-widest bg-[var(--accent-muted)] px-1.5 py-0.5 rounded uppercase">
                  {incident.hotel_name}
                </span>
                <span className="mono-display text-[0.6rem] text-[var(--text-muted)] font-bold">
                  {formatDateTime(incident.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`severity-badge ${incident.severity} !text-[0.6rem]`}>
              {SEVERITY_LABELS[incident.severity] || 'UNKNOWN'}
            </span>
            <div className="flex items-center gap-2 bg-[var(--surface-high)] px-2 py-1 rounded-md border border-[var(--outline-variant)]">
              <div className={`w-1.5 h-1.5 rounded-full ${incident.status === 'resolved' ? 'bg-[var(--low)]' : 'bg-[var(--accent)] animate-pulse shadow-[0_0_8px_currentColor]'}`} />
              <span className="mono-display text-[0.55rem] text-[var(--text-secondary)] font-black uppercase tracking-widest">
                {incident.status}
              </span>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="mt-5 space-y-4">
            {/* Summary Block */}
            <div className="bg-[var(--surface-low)] rounded-xl p-4 border-l-2 border-[var(--accent)] relative group-hover:bg-[var(--surface-high)] transition-colors">
              <p className="text-[0.9rem] leading-relaxed text-[var(--text-secondary)] font-[var(--font-body)] opacity-90">
                &quot;{incident.gemini_summary}&quot;
              </p>
            </div>

            {/* Footer metadata */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-[var(--outline-variant)]">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-[var(--surface-high)] px-2.5 py-1.5 rounded-lg border border-[var(--outline-variant)]">
                  <span className="material-icons-round text-sm text-[var(--text-muted)]">person</span>
                  <span className="mono-display text-[0.6rem] text-[var(--text-secondary)] font-black">
                    {incident.reported_by.toUpperCase()}
                  </span>
                </div>
                
                {incident.call_emergency_services && (
                  <div className="flex items-center gap-2 bg-[rgba(255,59,59,0.08)] px-2.5 py-1.5 rounded-lg border border-[rgba(255,59,59,0.2)]">
                    <span className="material-icons-round text-sm text-[var(--critical)] animate-pulse">emergency</span>
                    <span className="mono-display text-[0.6rem] text-[var(--critical)] font-black">EMS_NOTIFIED</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Link 
                  href={`/dashboard/map?incidentId=${incident.id}`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="hidden sm:flex items-center gap-2 mono-display text-[0.65rem] text-[var(--text-muted)] font-black hover:text-[var(--accent)] transition-colors"
                >
                  <span className="material-icons-round text-base">map</span>
                  LOCATE
                </Link>
                <div className="flex items-center gap-1.5 mono-display text-[0.7rem] text-[var(--accent)] font-black tracking-widest group-hover:translate-x-1 transition-transform">
                  RESPOND <span className="material-icons-round text-lg">arrow_right_alt</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
