'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { StaffProfile } from '@/lib/types'
import { AuthGuard } from '@/components/AuthGuard'
import { getSavedStaffSession } from '@/lib/staffProfile'

import { ThemeToggle } from '@/components/ThemeToggle'

export default function PersonnelPage() {
  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [loading, setLoading] = useState(true)
  const hotelId = getSavedStaffSession()?.hotel_id || 'default'

  useEffect(() => {
    let isMounted = true

    if (!auth.currentUser) {
      Promise.resolve().then(() => {
        if (isMounted) setLoading(false)
      })
      return
    }

    const loadStaff = async () => {
      try {
        const q = query(collection(db, 'staff'), where('hotel_id', '==', hotelId))
        const snap = await getDocs(q)
        const rows = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() } as StaffProfile))
          .filter((member) => member.active)
        if (isMounted) setStaff(rows)
      } catch (err) {
        console.error('Failed to load staff:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadStaff()

    return () => {
      isMounted = false
    }
  }, [hotelId])

  return (
    <AuthGuard>
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', position: 'relative', overflowX: 'hidden' }} id="personnel-root">
        <div className="scanline" />
        
        <header id="personnel-header" className="glass-premium" style={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          padding: '16px 32px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--outline-variant)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} id="header-left">
            <Link href="/dashboard" className="hover-opacity" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '0px', border: '2px solid var(--outline)' }}>
              <span className="material-icons-sharp">arrow_back</span>
            </Link>
            <div>
              <h1 className="mono-display" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '0.1em' }}>PERSONNEL_ROSTER.EXE</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="live-dot" style={{ width: '6px', height: '6px' }} />
                <span className="mono-display" style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em' }}>LIVE_FEED</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }} id="header-right">
            <div className="mono-display" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }} id="count-badge">
              <span className="material-icons-sharp" style={{ fontSize: '16px' }}>group</span>
              <span>COUNT: {staff.length.toString().padStart(2, '0')}</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <div id="personnel-container" style={{ padding: '40px 32px', maxWidth: '1400px', margin: '0 auto' }}>
          <div id="personnel-intro" style={{ marginBottom: '40px', borderLeft: '4px solid var(--accent)', paddingLeft: '24px' }}>
            <div className="mono-display" style={{ fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: '0.2em', fontWeight: 900 }}>
              ACTIVE_OPERATORS_REGISTRY
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '12px', opacity: 0.9, maxWidth: '600px', lineHeight: 1.6 }}>
              Current tactical assignments and monitoring personnel across the hospitality network. Personnel readiness is verified via biometric telemetry.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
              <div className="live-dot" style={{ width: '12px', height: '12px', margin: '0 auto 24px' }} />
              <div className="mono-display" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 800, letterSpacing: '0.2em' }}>SCANNING_BIOMETRIC_RECORDS...</div>
            </div>
          ) : staff.length === 0 ? (
            <div className="tactical-border glass-premium" style={{ padding: '80px 40px', textAlign: 'center', opacity: 0.5, border: '2px dashed var(--outline-variant)', borderRadius: '0px' }}>
              <span className="material-icons-sharp" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}>no_accounts</span>
              <p className="mono-display" style={{ margin: 0, fontWeight: 900, letterSpacing: '0.2em' }}>ZERO_OPERATORS_DETECTED</p>
              <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Standing by for personnel deployment.</p>
            </div>
          ) : (
            <div id="staff-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {staff.map((member) => (
                <div key={member.uid} className="tactical-border glass-premium" style={{ 
                  padding: '24px', 
                  background: 'rgba(255,255,255,0.02)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '3px solid var(--outline-variant)',
                  borderRadius: '0px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'var(--outline-variant)';
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      borderRadius: '0px', 
                      background: 'rgba(255, 153, 51, 0.05)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      border: '2px solid var(--accent-muted)'
                    }}>
                      <span className="material-icons-sharp" style={{ fontSize: '24px' }}>person</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div className="mono-display" style={{ 
                        fontSize: '0.65rem', 
                        color: 'var(--accent)', 
                        fontWeight: 900,
                        background: 'rgba(255, 153, 51, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '0px',
                        border: '2px solid var(--accent-muted)'
                      }}>
                        {member.role.toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div className="live-dot" style={{ width: '6px', height: '6px' }} />
                        <span className="mono-display" style={{ fontSize: '0.6rem', color: 'var(--low)', fontWeight: 800 }}>READY</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '0.02em' }}>
                    {member.display_name.toUpperCase() || 'UNKNOWN_SUBJECT'}
                  </div>
                  <div className="mono-display" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.email}
                  </div>
                  
                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="mono-display" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      ID_{member.uid.slice(0, 8).toUpperCase()}
                    </div>
                    <span className="material-icons-sharp" style={{ fontSize: '16px', color: 'var(--text-muted)', opacity: 0.5 }}>verified_user</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx global>{`
          @media (max-width: 768px) {
            #personnel-header {
              padding: 12px 16px !important;
            }
            #header-right {
              gap: 12px !important;
            }
            #count-badge span:first-child {
              display: none;
            }
            #personnel-container {
              padding: 24px 16px !important;
            }
            #personnel-intro {
              padding-left: 16px !important;
              margin-bottom: 32px !important;
            }
            #staff-grid {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
          }
        `}</style>
      </div>
    </AuthGuard>

  )
}
