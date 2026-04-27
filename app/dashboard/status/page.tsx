'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { collection, getCountFromServer } from 'firebase/firestore'
import { auth, db, rtdb } from '@/lib/firebase'
import { AuthGuard } from '@/components/AuthGuard'

import { ThemeToggle } from '@/components/ThemeToggle'

const CPU_SERIES = [34, 48, 40, 52, 58, 44, 36, 42, 50, 61, 47, 43, 39, 46, 55, 62, 57, 49, 41, 38]
const MEMORY_BLOCKS = [184, 212, 96, 144, 228, 188, 120, 164, 132, 208, 176, 152]

export default function SystemStatusPage() {
  const [liveCount, setLiveCount] = useState(0)
  const [incidentCount, setIncidentCount] = useState<number | null>(null)
  const [firebaseStatus, setFirebaseStatus] = useState<'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED')
  const [uptime, setUptime] = useState('00:00:00')

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => {
      const diff = Date.now() - start
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
      setUptime(`${h}:${m}:${s}`)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!auth.currentUser) return
    const liveRef = ref(rtdb, 'live_incidents')
    onValue(
      liveRef,
      (snapshot) => {
        const data = snapshot.val() as Record<string, unknown> | null
        setLiveCount(data ? Object.keys(data).length : 0)
        setFirebaseStatus('CONNECTED')
      },
      () => setFirebaseStatus('DISCONNECTED'),
    )

    return () => off(liveRef)
  }, [])

  useEffect(() => {
    if (!auth.currentUser) return
    const loadCounts = async () => {
      try {
        const result = await getCountFromServer(collection(db, 'incidents'))
        setIncidentCount(result.data().count)
      } catch (err) {
        console.error('Count error:', err)
      }
    }

    loadCounts()
  }, [])

  return (
    <AuthGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', position: 'relative' }}>
        <div className="scanline" />
        
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingBottom: '100px' }}>
          <header className="glass-premium" style={{ 
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            padding: '16px 32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--outline-variant)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/dashboard" className="hover-opacity" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px', border: '1px solid var(--outline)' }}>
                <span className="material-icons-round">arrow_back</span>
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="mono-display" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '0.1em' }}>SYSTEM_DIAGNOSTICS.EXE</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="live-dot" style={{ width: '6px', height: '6px' }} />
                  <span className="mono-display" style={{ color: 'var(--accent)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em' }}>KERNEL_V3.4_ACTIVE</span>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </header>

          <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: '40px', borderLeft: '4px solid var(--accent)', paddingLeft: '24px' }}>
              <div className="mono-display" style={{ fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: '0.2em', fontWeight: 900 }}>
                CORE_TELEMETRY_FEED
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '12px', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
                Monitoring vital signs of the CrisisSync kernel. Real-time data processing, database synchronization, and uptime tracking.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Connection Status */}
              <div className="tactical-border glass-premium" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--outline-variant)' }}>
                <div className="mono-display" style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.2em' }}>NETWORK_LATENCY</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="mono-display" style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>24</span>
                  <span className="mono-display" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>MS</span>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '4px' }}>
                  <div className={firebaseStatus === 'CONNECTED' ? 'live-dot' : ''} style={{ width: '8px', height: '8px', borderRadius: '50%', background: firebaseStatus === 'CONNECTED' ? 'var(--low)' : 'var(--critical)' }} />
                  <span className="mono-display" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{firebaseStatus} RTDB_LINK</span>
                </div>
              </div>

              {/* Database Counters */}
              <div className="tactical-border glass-premium" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--outline-variant)' }}>
                <div className="mono-display" style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.2em' }}>REGISTRY_METRICS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px' }}>
                    <div className="mono-display" style={{ fontSize: '1.5rem', fontWeight: 900 }}>{liveCount.toString().padStart(3, '0')}</div>
                    <div className="mono-display" style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 800, marginTop: '4px' }}>LIVE_NODES</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '4px' }}>
                    <div className="mono-display" style={{ fontSize: '1.5rem', fontWeight: 900 }}>{incidentCount?.toString().padStart(4, '0') ?? '----'}</div>
                    <div className="mono-display" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '4px' }}>ARCHIVE</div>
                  </div>
                </div>
              </div>

              {/* Uptime */}
              <div className="tactical-border glass-premium" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--outline-variant)' }}>
                <div className="mono-display" style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.2em' }}>SESSION_RUNTIME</div>
                <div className="mono-display" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.05em', color: 'var(--accent)' }}>{uptime}</div>
                <div className="mono-display" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '10px' }}>Uptime since last kernel reload</div>
              </div>
            </div>

            {/* Load Simulators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px' }}>
              <div className="tactical-border glass-premium" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div className="mono-display" style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em' }}>CPU_LOAD_PRIMARY</div>
                  <div className="mono-display" style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800 }}>32.4%_UTIL</div>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '16px' }}>
                  <div style={{ height: '100%', width: '32%', background: 'var(--accent)', boxShadow: '0 0 15px var(--accent)' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '60px' }}>
                  {[...CPU_SERIES, ...CPU_SERIES].map((value, i) => {
                    const height = `${value}%`
                    return (
                      <div key={i} style={{ 
                        flex: 1, 
                        height, 
                        background: i > 30 ? 'rgba(255,255,255,0.05)' : 'var(--accent)', 
                        borderRadius: '1px',
                        opacity: i > 30 ? 0.2 : 0.4 + (value / 100) * 0.6
                      }} />
                    )
                  })}
                </div>
              </div>

              <div className="tactical-border glass-premium" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--outline-variant)' }}>
                <div className="mono-display" style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '16px' }}>MEMORY_BLOCK_ALLOCATION</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                  {MEMORY_BLOCKS.map((value, i) => (
                    <div key={i} style={{ 
                      padding: '8px', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--outline-variant)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      borderRadius: '2px'
                    }}>
                      <div className="mono-display" style={{ fontSize: '0.55rem', opacity: 0.5 }}>BLK_{i.toString().padStart(2, '0')}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="mono-display" style={{ fontSize: '0.65rem', fontWeight: 800 }}>{value}M</div>
                        <span className="mono-display" style={{ fontSize: '0.5rem', color: 'var(--low)', fontWeight: 900 }}>OK</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
