'use client'
// components/AlertBanner.tsx
import { useEffect, useState } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { Incident } from '@/lib/types'
import Link from 'next/link'

export function AlertBanner() {
  const [activeAlerts, setActiveAlerts] = useState<Incident[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const liveRef = ref(rtdb, 'live_incidents')
    onValue(liveRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) { setActiveAlerts([]); return }
      const alerts = Object.values(data) as Incident[]
      const urgent = alerts.filter(a => a.severity === 'critical' || a.severity === 'high')
      setActiveAlerts(urgent)
    })
    return () => off(liveRef)
  }, [])

  useEffect(() => {
    if (activeAlerts.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % activeAlerts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeAlerts.length])

  if (activeAlerts.length === 0) return null

  const alert = activeAlerts[currentIndex]
  const isCritical = alert.severity === 'critical'

  return (
    <div
      style={{
        background: isCritical ? 'rgba(255,59,48,0.1)' : 'rgba(255,149,0,0.1)',
        border: `1px solid ${isCritical ? 'var(--critical)' : 'var(--high)'}`,
        borderLeft: `4px solid ${isCritical ? 'var(--critical)' : 'var(--high)'}`,
        borderRadius: '4px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Link
        href={`/incident/${alert.id}`}
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          width: '100%',
          cursor: 'pointer'
        }}
      >
        <div className="live-dot" style={{ background: isCritical ? 'var(--critical)' : 'var(--high)', boxShadow: `0 0 10px ${isCritical ? 'var(--critical)' : 'var(--high)'}` }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              color: isCritical ? 'var(--critical)' : 'var(--high)', 
              fontWeight: 900,
              fontSize: '0.65rem',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em'
            }}>
              {alert.severity.toUpperCase()}_ALERT_ACTIVE
            </span>
            {activeAlerts.length > 1 && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                +{activeAlerts.length - 1} OTHER_INCIDENTS
              </span>
            )}
          </div>
          <div style={{ 
            color: 'var(--text-primary)', 
            fontWeight: 800, 
            fontSize: '0.9rem',
            marginTop: '2px',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-headline)',
            textTransform: 'uppercase'
          }}>
            {alert.crisis_type} : {alert.location_description}
          </div>
        </div>
        
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.65rem', 
          color: isCritical ? 'var(--critical)' : 'var(--high)', 
          fontWeight: 900,
          letterSpacing: '0.1em',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          VIEW <span className="material-icons-round" style={{ fontSize: '16px' }}>arrow_forward</span>
        </span>
      </Link>
    </div>
  )
}
