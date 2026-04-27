'use client'
// app/page.tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-6 sm:p-0 relative overflow-hidden bg-[var(--bg-base)]">
      {/* Scanline Overlay */}
      <div className="scanline" />



      {/* Animated Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none blur-[60px] opacity-40">
        <div className="absolute top-[30%] left-[20%] w-full h-full bg-[radial-gradient(circle,rgba(255,153,51,0.15)_0%,transparent_50%)]" />
        <div className="absolute bottom-[30%] right-[20%] w-full h-full bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full sm:max-w-[480px] text-center py-12 sm:py-0">
        <div className="w-full sm:glass-premium sm:tactical-border sm:p-12 sm:rounded-2xl animate-fade-in-up">
          {/* Core Security Orb Icon */}
          <div className="flex justify-center mb-10">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[rgba(255,153,51,0.05)] border border-[var(--accent-muted)] flex items-center justify-center relative shadow-[0_0_30px_rgba(255,153,51,0.1)]">
              <div className="absolute inset-[-8px] rounded-full border-2 border-[var(--accent)] border-b-transparent border-r-transparent opacity-40 animate-spin [animation-duration:4s]" />
              <span className="material-icons-round text-5xl text-[var(--accent)] drop-shadow-[0_0_10px_var(--accent-muted)]">
                security
              </span>
            </div>
          </div>

          {/* Branding */}
          <div className="mb-12">
            <div className="mono-display text-[0.7rem] text-[var(--accent)] tracking-[0.4em] mb-3 font-black">
              CRISIS_SYNC v1.2.4
            </div>
            <h1 className="font-[var(--font-headline)] font-black text-5xl sm:text-6xl text-white uppercase m-0 leading-none tracking-tight">
              CrisisSync
            </h1>
            <p className="font-[var(--font-body)] text-sm sm:text-base text-[var(--text-secondary)] mt-6 leading-relaxed opacity-80">
              Strategic AI coordination for hotel infrastructure.<br/>
              Neutralizing emergencies in real-time.
            </p>
          </div>

          {/* Tactical Actions */}
          <div className="flex flex-col gap-4 w-full">
            <Link href="/report" className="no-underline">
              <button className="btn-tactical btn-primary w-full h-16 sm:h-14 text-sm flex items-center justify-center gap-3 cursor-pointer rounded-xl sm:rounded-lg">
                <span className="material-icons-round text-xl">emergency</span>
                INITIALIZE_INCIDENT_REPORT
              </button>
            </Link>

            <Link href="/login" className="no-underline">
              <button className="btn-ghost hover-accent mono-display w-full h-14 sm:h-12 text-[0.7rem] sm:text-[0.8rem] bg-white/5 backdrop-blur-md cursor-pointer font-black rounded-xl sm:rounded-lg border-[var(--outline-variant)]">
                OPERATOR_AUTHENTICATION &gt;
              </button>
            </Link>
          </div>

          {/* Footer Meta */}
          <div className="mono-display mt-12 text-[0.6rem] text-[var(--text-muted)] flex justify-center gap-4 opacity-50">
            <span>SECURE_LINK: ESTABLISHED</span>
            <span>STATION: CENTRAL_COMMAND</span>
          </div>
        </div>
      </div>
    </main>
  )
}

