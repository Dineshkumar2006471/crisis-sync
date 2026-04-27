// app/report/page.tsx
import { ReportForm } from '@/components/ReportForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Report Emergency — CrisisSync',
  description: 'Report a hotel emergency immediately. Your report will be classified by AI and broadcast to staff within seconds.',
}

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-start">
      {/* Top bar */}
      <div className="w-full bg-[var(--surface)] border-b border-[var(--outline-variant)] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="mono-display text-[0.7rem] text-[var(--accent)] tracking-[0.2em] font-black">
          CRISIS_SYNC // EMERGENCY_PROTOCOL
        </div>
        <div className="live-dot" />
      </div>

      {/* Form container */}
      <div className="w-full sm:max-w-[540px] px-6 py-10 sm:py-12 relative z-10">
        <div className="text-center mb-10">
          <div className="mono-display text-[0.6rem] text-[var(--accent)] tracking-[0.3em] mb-3 opacity-60">
            [ INCIDENT_INTAKE_MODULE ]
          </div>
          <h1 className="font-[var(--font-headline)] font-black text-3xl sm:text-4xl text-white uppercase m-0">
            Report Emergency
          </h1>
        </div>
        
        <div className="w-full sm:glass-premium sm:tactical-border sm:p-8 sm:rounded-2xl">
          <ReportForm />
        </div>
      </div>
      
      {/* Footer decorative text */}
      <div className="mt-auto pb-8 mono-display text-[0.55rem] text-[var(--text-muted)] opacity-30 tracking-[0.2em]">
        SIGNAL_STATUS: ENCRYPTED_END_TO_END
      </div>
    </main>
  )
}
