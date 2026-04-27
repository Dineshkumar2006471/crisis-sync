'use client'
import { AuthGuard } from '@/components/AuthGuard'
import { MobileNavBar } from '@/components/MobileNavBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'

const FEATURES = [
  {
    title: 'AI Incident Analysis',
    desc: 'Automated classification and severity assessment using Gemini Pro Vision and Text models. Reports are summarized into actionable intel in seconds.',
    icon: 'psychology',
    color: '#A855F7'
  },
  {
    title: 'Emergency Broadcast',
    desc: 'Send real-time safety instructions and evacuation alerts to guests via web notifications and digital signage across specific floors or the entire hotel.',
    icon: 'podcasts',
    color: '#EF4444'
  },
  {
    title: 'Tactical Mapping',
    desc: 'Real-time geospatial visualization of all active incidents. Track responders and identify bottleneck areas during evacuations.',
    icon: 'explore',
    color: '#3B82F6'
  },
  {
    title: 'Audit Trail',
    desc: 'End-to-end immutable logging of all staff actions, photo evidence, and status changes for post-incident review and legal compliance.',
    icon: 'verified_user',
    color: '#10B981'
  },
  {
    title: 'Multi-Role Coordination',
    desc: 'Tailored instructions for Front Desk, Security, Housekeeping, and Management to ensure every department knows exactly what to do.',
    icon: 'groups',
    color: '#F59E0B'
  }
]

export default function FeaturesPage() {
  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: '100px' }}>
          <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-low)',
            borderBottom: '1px solid var(--outline-variant)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                <span className="material-icons-round">arrow_back</span>
              </Link>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>System Features</h1>
            </div>
            <ThemeToggle />
          </header>

          <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '2rem', fontWeight: 900, marginBottom: '8px' }}>Tactical Capabilities</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                CrisisSync leverages advanced AI and real-time networking to protect your guests and assets.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {FEATURES.map((f, i) => (
                <div key={i} className="crisis-card" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: '56px', 
                    height: '56px', 
                    borderRadius: '16px', 
                    background: `${f.color}20`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: f.color,
                    border: `1px solid ${f.color}40`,
                    flexShrink: 0
                  }}>
                    <span className="material-icons-round" style={{ fontSize: '32px' }}>{f.icon}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>{f.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '40px', padding: '32px', textAlign: 'center', background: 'var(--surface-high)', borderRadius: '16px', border: '1px dashed var(--outline-variant)' }}>
              <h3 style={{ fontWeight: 800, marginBottom: '12px' }}>Ready to deploy?</h3>
              <Link href="/report">
                <button className="btn-primary" style={{ padding: '12px 32px' }}>SIMULATE INCIDENT</button>
              </Link>
            </div>
          </div>
        </main>

        <MobileNavBar />
      </div>
    </AuthGuard>
  )
}
