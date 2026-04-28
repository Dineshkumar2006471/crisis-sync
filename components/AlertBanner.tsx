'use client'
// components/AlertBanner.tsx
import { useEffect, useMemo, useState } from 'react'
import { Incident } from '@/lib/types'
import Link from 'next/link'

interface AlertBannerProps {
  alerts: Incident[]
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const activeAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          alert.status !== 'resolved' && (alert.severity === 'critical' || alert.severity === 'high')
      ),
    [alerts]
  )

  useEffect(() => {
    if (activeAlerts.length <= 1) return
    const interval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % activeAlerts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [activeAlerts.length])

  if (activeAlerts.length === 0) return null

  const alert = activeAlerts[currentIndex % activeAlerts.length]
  const isCritical = alert.severity === 'critical'

  return (
    <div
      style={{
        background: isCritical ? 'rgba(255,59,48,0.15)' : 'rgba(255,149,0,0.15)',
        border: `2px solid ${isCritical ? 'var(--critical)' : 'var(--high)'}`,
        borderLeft: `8px solid ${isCritical ? 'var(--critical)' : 'var(--high)'}`,
        borderRadius: '0px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: 'none',
        backdropFilter: 'none',
        fontFamily: 'var(--font-data)'
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
        <div className="live-dot" style={{ background: isCritical ? 'var(--critical)' : 'var(--high)' }} />
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
          VIEW <span className="material-icons-sharp" style={{ fontSize: '16px' }}>arrow_forward</span>
        </span>
      </Link>
    </div>
  )
}
