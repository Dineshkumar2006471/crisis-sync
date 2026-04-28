// app/report/page.tsx
import { ReportForm } from '@/components/ReportForm'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Report Emergency — CrisisSync',
  description: 'Report a hotel emergency immediately. Your report will be classified by AI and broadcast to staff within seconds.',
}

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] flex flex-col items-center justify-start">
      {/* Top bar — Brute editorial nav */}
      <div className="w-full bg-[var(--surface)] border-b-[2px] border-[var(--outline)] px-6 py-0 flex items-center justify-between sticky top-0 z-50 h-16">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center border-[2px] border-[var(--outline)] bg-[var(--surface-high)] text-[var(--text-primary)] no-underline transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <span className="material-icons-sharp text-lg">arrow_back</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="live-dot" />
            <span className="font-data text-xs font-bold text-[var(--accent)] tracking-[0.12em] uppercase">
              EMERGENCY_PROTOCOL
            </span>
          </div>
        </div>
        <div className="font-data text-[0.55rem] text-[var(--text-muted)] tracking-[0.15em] uppercase hidden sm:block">
          SECURE_CHANNEL // ACTIVE
        </div>
      </div>

      {/* Form container */}
      <div className="w-full sm:max-w-[540px] px-6 py-10 sm:py-16 relative z-10">
        <div className="mb-10 reveal-on-scroll">
          <span className="font-data text-[var(--accent)] text-[0.65rem] tracking-[0.3em] uppercase flex items-center gap-3 mb-4">
            <span className="w-6 h-px bg-[var(--accent)]" />
            INCIDENT_INTAKE_MODULE
          </span>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-white uppercase m-0 tracking-tighter leading-[0.9]">
            Report<br /><span className="italic font-light text-[var(--text-secondary)]">Emergency</span>
          </h1>
          <p className="mt-4 font-body text-sm text-[var(--text-muted)] uppercase tracking-wide leading-relaxed">
            Your report will be classified by Gemini AI and broadcast to all active operators within 60 seconds.
          </p>
        </div>
        
        <div className="w-full border-[2px] border-[var(--outline)] bg-[var(--surface)] p-6 sm:p-8">
          <ReportForm />
        </div>
      </div>
      
      {/* Footer decorative text */}
      <div className="mt-auto pb-8 font-data text-[0.55rem] text-[var(--text-muted)] opacity-30 tracking-[0.2em] uppercase">
        SIGNAL_STATUS: ENCRYPTED_END_TO_END
      </div>
    </main>
  )
}
