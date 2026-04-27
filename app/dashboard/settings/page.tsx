'use client'
import { useState } from 'react'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import { ThemeToggle } from '@/components/ThemeToggle'
import { auth } from '@/lib/firebase'

export default function SettingsPage() {
  const [simulationMode, setSimulationMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', marginBottom: '8px' }}>
              <span className="material-icons-round" style={{ fontSize: '18px' }}>settings</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em' }}>COMMAND_CONFIG_ROOT</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '2.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>System Settings</h1>
          </div>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button className="btn-ghost" style={{ border: '1px solid var(--outline-variant)', borderRadius: '8px', padding: '10px 20px', fontWeight: 700 }}>
              SAVE & EXIT
            </button>
          </Link>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
          {/* Navigation Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="nav-item active" style={{ background: 'var(--surface-high)', border: 'none', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
              <span className="material-icons-round">person</span> Profile & Security
            </button>
            <button className="nav-item" style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
              <span className="material-icons-round">visibility</span> Display Preferences
            </button>
            <button className="nav-item" style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
              <span className="material-icons-round">notifications</span> Notifications
            </button>
            <button className="nav-item" style={{ background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 16px', borderRadius: '8px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 600 }}>
              <span className="material-icons-round">terminal</span> Terminal Config
            </button>
          </aside>

          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Account Profile */}
            <section className="glass" style={{ padding: '32px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '24px' }}>OPERATOR_IDENTITY</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--surface-high)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-icons-round" style={{ fontSize: '40px', color: 'var(--accent)' }}>person</span>
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '4px' }}>{auth.currentUser?.displayName || 'OPERATOR_01'}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{auth.currentUser?.email}</div>
                  <div style={{ marginTop: '12px' }}>
                    <span className="severity-badge medium" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>LEVEL_4_CLEARANCE</span>
                  </div>
                </div>
                <button className="btn-ghost" style={{ marginLeft: 'auto', border: '1px solid var(--outline-variant)', fontSize: '0.8rem' }}>EDIT_PROFILE</button>
              </div>
            </section>

            {/* Preferences */}
            <section className="glass" style={{ padding: '32px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '32px' }}>SYSTEM_PARAMETERS</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Visual Theme</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Maneuver between dark and light modes</div>
                  </div>
                  <ThemeToggle />
                </div>

                <div style={{ borderTop: '1px solid var(--outline-variant)' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Simulation Mode</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Generate mock incidents for training purposes</div>
                  </div>
                  <button 
                    onClick={() => setSimulationMode(!simulationMode)}
                    style={{
                      width: '50px',
                      height: '26px',
                      borderRadius: '13px',
                      background: simulationMode ? 'var(--accent)' : 'var(--surface-high)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      left: simulationMode ? '27px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      background: 'white',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>

                <div style={{ borderTop: '1px solid var(--outline-variant)' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Emergency Notifications</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Push alerts for critical-level incidents</div>
                  </div>
                  <button 
                    onClick={() => setNotifications(!notifications)}
                    style={{
                      width: '50px',
                      height: '26px',
                      borderRadius: '13px',
                      background: notifications ? 'var(--low)' : 'var(--surface-high)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '3px',
                      left: notifications ? '27px' : '3px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      background: 'white',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }} />
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
