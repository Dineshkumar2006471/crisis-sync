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
      <div className={`crisis-card brute-border relative overflow-hidden transition-all duration-300 hover:border-[var(--text-primary)] group-active:scale-[0.98] border-[2px]`}>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-12 h-12 bg-[var(--surface-high)] flex items-center justify-center text-2xl border-[2px] border-[var(--outline)] flex-shrink-0">
              {CRISIS_ICONS[incident.crisis_type] || '⚠️'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-lg sm:text-xl text-[var(--text-primary)] tracking-tight uppercase leading-tight truncate">
                {incident.location_description}
              </h3>
              <div className="flex items-center gap-2 mt-1 truncate">
                <span className="font-data text-[0.6rem] font-bold text-[var(--accent)] tracking-widest bg-[var(--accent-muted)] px-1.5 py-0.5 uppercase border-[2px] border-[var(--accent)]">
                  {incident.hotel_name}
                </span>
                <span className="font-data text-[0.6rem] text-[var(--text-muted)] font-bold">
                  {formatDateTime(incident.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`font-data severity-badge ${incident.severity} !text-[0.6rem] border-[2px] border-current`}>
              {SEVERITY_LABELS[incident.severity] || 'UNKNOWN'}
            </span>
            <div className="flex items-center gap-2 bg-[var(--surface-high)] px-2 py-1 border-[2px] border-[var(--outline)]">
              <div className={`w-2 h-2 ${incident.status === 'resolved' ? 'bg-[var(--low)]' : 'bg-[var(--accent)] animate-pulse'}`} />
              <span className="font-data text-[0.55rem] text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                {incident.status}
              </span>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="mt-5 space-y-4">
            {/* Summary Block */}
            <div className="bg-[var(--surface-low)] p-4 border-l-[2px] border-[var(--accent)] relative group-hover:bg-[var(--surface-high)] transition-colors">
              <p className="text-[0.9rem] leading-relaxed text-[var(--text-secondary)] font-body opacity-90">
                &quot;{incident.gemini_summary}&quot;
              </p>
            </div>

            {/* Footer metadata */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t-[2px] border-[var(--outline)]">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-[var(--surface-high)] px-2.5 py-1.5 border-[2px] border-[var(--outline)]">
                  <span className="material-icons-sharp text-sm text-[var(--text-muted)]">person</span>
                  <span className="font-data text-[0.6rem] text-[var(--text-secondary)] font-bold">
                    {incident.reported_by.toUpperCase()}
                  </span>
                </div>
                
                {incident.call_emergency_services && (
                  <div className="flex items-center gap-2 bg-[var(--accent-muted)] px-2.5 py-1.5 border-[2px] border-[var(--accent)]">
                    <span className="material-icons-sharp text-sm text-[var(--accent)] animate-pulse">emergency</span>
                    <span className="font-data text-[0.6rem] text-[var(--accent)] font-bold tracking-widest">EMS_NOTIFIED</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Link 
                  href={`/dashboard/map?incidentId=${incident.id}`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="hidden sm:flex items-center gap-2 font-data text-[0.65rem] text-[var(--text-muted)] font-bold hover:text-[var(--accent)] transition-colors"
                >
                  <span className="material-icons-sharp text-base">map</span>
                  LOCATE
                </Link>
                <div className="flex items-center gap-1.5 font-display text-[0.7rem] text-[var(--accent)] font-black tracking-widest group-hover:translate-x-1 transition-transform uppercase">
                  RESPOND <span className="material-icons-sharp text-lg">arrow_right_alt</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
