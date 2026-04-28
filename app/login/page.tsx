'use client'

import Link from 'next/link'
import Image from 'next/image'
import { OperatorLoginPanel } from '@/components/OperatorLoginPanel'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] flex flex-col lg:flex-row">
      
      {/* Left panel — Editorial image (desktop only) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <Image
          src="/images/crisis-command-room.png"
          alt="CrisisSync Command Center"
          fill
          className="object-cover"
          style={{ filter: 'grayscale(1) brightness(0.3) contrast(1.2)' }}
          priority
        />
        <div className="absolute inset-y-0 right-0 w-px bg-[var(--outline)] z-20" />
        
        <div className="absolute top-12 left-12 z-10">
          <div className="flex items-center gap-3">
            <div className="live-dot" />
            <span className="font-display font-black text-lg tracking-tight uppercase text-white/90">CrisisSync</span>
          </div>
          <div className="mt-4">
            <h2 className="font-heading text-5xl italic text-white/80 tracking-tighter leading-[0.9] uppercase">
              COMMAND
              <br />
              <span className="inline-block pt-[10px]">BEGINS HERE</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex flex-col">
        <div className="pt-6 text-center font-data text-[0.55rem] text-[var(--text-muted)] opacity-50 tracking-[0.2em] uppercase">
          AUTH_PROTOCOL: FIREBASE_SECURE // E2E_ENCRYPTED
        </div>

        <nav className="border-b border-[var(--outline-variant)]">
          <div className="mx-auto flex h-16 w-full items-center justify-between px-6 sm:px-8">
            <Link href="/" className="flex items-center gap-3 no-underline text-[var(--text-primary)]">
              <div className="lg:hidden flex items-center gap-3">
                <div className="live-dot" />
                <span className="font-display font-black text-lg tracking-tight uppercase">CrisisSync</span>
              </div>
              <span className="hidden lg:inline font-display text-sm font-bold tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                ← BACK TO BASE
              </span>
            </Link>
            <Link href="/report" className="font-display text-sm font-bold tracking-widest uppercase no-underline text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
              Report
            </Link>
          </div>
        </nav>

        <section className="flex-1 flex items-center justify-center px-6 py-12 sm:px-8">
          <OperatorLoginPanel className="w-full max-w-md" />
        </section>
        
      </div>
    </main>
  )
}
