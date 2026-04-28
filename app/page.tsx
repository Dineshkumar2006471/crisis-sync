'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-body">
      <nav className="h-16 border-b-2 border-[var(--outline)] bg-[var(--surface)]">
        <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="live-dot" />
            <span className="font-display text-lg font-black uppercase tracking-tight">CrisisSync</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/report" className="btn-tactical border-2 px-4 py-2 text-xs sm:text-sm no-underline">
              Report Incident
            </Link>
            <Link href="/login" className="btn-ghost border-2 px-4 py-2 text-xs sm:text-sm no-underline">
              Operator Login
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative border-b-2 border-[var(--outline)]">
        <div className="absolute inset-0">
          <Image
            src="/images/crisis-hero-editorial.png"
            alt="Crisis response command center"
            fill
            priority
            className="object-cover"
            style={{ filter: 'grayscale(1) brightness(0.32) contrast(1.1)' }}
          />
        </div>
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative mx-auto flex min-h-[72vh] w-full max-w-6xl flex-col justify-center px-4 py-14 sm:px-6 sm:py-16">
          <p className="mb-4 font-data text-[0.68rem] uppercase tracking-[0.26em] text-[var(--accent)]">HOTEL CRISIS RESPONSE PLATFORM</p>
          <h1 className="max-w-4xl font-display text-3xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl">
            CONTROL EVERY SECOND OF EVERY INCIDENT
          </h1>
          <p className="mt-4 max-w-3xl font-display text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] sm:text-base">
            SMART PRICING. FASTER RESPONSE. SAFER GUEST EXPERIENCES.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/report" className="btn-tactical border-2 px-6 py-3 text-sm no-underline">
              Report Incident
            </Link>
            <Link href="/login" className="btn-ghost border-2 px-6 py-3 text-sm no-underline">
              Operator Login
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[var(--outline)] bg-[var(--surface)]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-0 sm:grid-cols-4">
          {[
            ['<3s', 'AI Classification'],
            ['60s', 'Alert Broadcast'],
            ['24/7', 'Monitoring'],
            ['99.9%', 'Uptime Target'],
          ].map(([value, label], idx) => (
            <div key={label} className={`p-5 sm:p-6 ${idx < 3 ? 'sm:border-r-2' : ''} border-[var(--outline)]`}>
              <div className="font-data text-2xl font-black sm:text-3xl">{value}</div>
              <div className="mt-1 font-data text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
