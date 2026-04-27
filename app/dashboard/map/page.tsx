'use client'
import { useEffect, useState } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { auth, rtdb } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Incident } from '@/lib/types'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'

import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import { useGoogleMaps } from '@/components/GoogleMapsProvider'

import { useSearchParams } from 'next/navigation'
import { MobileNavBar } from '@/components/MobileNavBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { formatTime, toDate } from '@/lib/utils'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const centerDefault = {
  lat: 19.076, // Mumbai default to match HOTEL_COORDS
  lng: 72.877,
}

type IncidentWithCoordinates = Incident & {
  lat?: number
  lng?: number
}

function hashString(value: string) {
  let hash = 0
  if (!value) return 0
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function deriveFallbackPosition(incident: IncidentWithCoordinates) {
  if (typeof incident.lat === 'number' && typeof incident.lng === 'number') {
    return { lat: incident.lat, lng: incident.lng }
  }

  const seed = hashString(incident.id || incident.location_description || 'incident')
  const latOffset = ((seed % 1000) / 1000 - 0.5) * 0.01 // Smaller offset
  const lngOffset = (((seed / 1000) % 1000) / 1000 - 0.5) * 0.01

  return {
    lat: centerDefault.lat + latOffset,
    lng: centerDefault.lng + lngOffset,
  }
}

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#1a1c1e" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a1c1e" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#101214" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#101214" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
]

import { Suspense } from 'react'

function MapPageContent() {
  const [incidents, setIncidents] = useState<IncidentWithCoordinates[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [user, setUser] = useState(auth.currentUser)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const searchParams = useSearchParams()
  const focusedIncidentId = searchParams.get('incidentId')

  const { isLoaded } = useGoogleMaps()

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (!user) return
    const liveRef = ref(rtdb, 'live_incidents')
    onValue(liveRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.entries(data as Record<string, Omit<IncidentWithCoordinates, 'id'>>).map(
          ([id, value]) => ({ id, ...value })
        )
        setIncidents(list)
        
        if (focusedIncidentId) {
          const focused = list.find(i => i.id === focusedIncidentId)
          if (focused) setSelectedIncident(focused)
        }
      }
      else setIncidents([])
    })
    return () => {
      off(liveRef)
    }
  }, [user, focusedIncidentId])

  const center = selectedIncident 
    ? deriveFallbackPosition(selectedIncident as IncidentWithCoordinates)
    : (incidents.length > 0 ? deriveFallbackPosition(incidents[0]) : centerDefault)

  return (
    <AuthGuard>
      <div style={{ 
        display: 'flex', 
        minHeight: '100vh', 
        background: 'var(--bg-base)', 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden'
      }}>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <header style={{ 
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            padding: '16px 32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            background: 'var(--surface-low)',
            borderBottom: '1px solid var(--outline-variant)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/dashboard" className="hover-opacity" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px', border: '1px solid var(--outline)' }}>
                <span className="material-icons-round">arrow_back</span>
              </Link>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 className="mono-display" style={{ fontSize: '1rem', fontWeight: 800, margin: 0, letterSpacing: '0.1em' }}>TACTICAL_MAP.SYS</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="live-dot" style={{ width: '6px', height: '6px' }} />
                  <span className="mono-display animate-pulse" style={{ color: 'var(--accent)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em' }}>
                    {incidents.length} ACTIVE_NODES // SECTOR_G1
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{ 
                  padding: '8px 16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  background: 'var(--surface-high)',
                  border: '1px solid var(--outline)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span className="material-icons-round" style={{ fontSize: '18px' }}>{isSidebarOpen ? 'visibility_off' : 'list'}</span>
                <span className="mono-display">{isSidebarOpen ? 'HIDE_LOG' : 'SHOW_LOG'}</span>
              </button>
              <ThemeToggle />
            </div>
          </header>

          <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
            {/* Main Map */}
            <div className="map-container-wrapper" style={{ flex: 1, position: 'relative' }}>
              {isLoaded ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={14}
                  options={{
                    styles: darkMapStyle,
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                  }}
                >
                  {incidents.map((incident, idx) => (
                    <Marker
                      key={idx}
                      position={deriveFallbackPosition(incident)}
                      onClick={() => {
                        setSelectedIncident(incident)
                        setIsSidebarOpen(true)
                      }}
                      icon={{
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                        fillColor: incident.severity === 'critical' ? '#FF3B3B' : incident.severity === 'high' ? '#FF9F0A' : '#3B82F6',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#FFFFFF',
                        scale: 1.8,
                      }}
                    />
                  ))}

                  {selectedIncident && (
                    <InfoWindow
                      position={deriveFallbackPosition(selectedIncident as IncidentWithCoordinates)}
                      onCloseClick={() => setSelectedIncident(null)}
                    >
                      <div style={{ 
                        padding: '20px', 
                        background: 'var(--surface)',
                        color: 'var(--text-primary)', 
                        maxWidth: '300px', 
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'var(--outline)',
                        borderTopWidth: '4px',
                        borderTopColor: selectedIncident.severity === 'critical' ? 'var(--critical)' : selectedIncident.severity === 'high' ? 'var(--high)' : 'var(--accent)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        borderRadius: '8px'
                      }}>
                        <div className="mono-display" style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 900, 
                          color: selectedIncident.severity === 'critical' ? 'var(--critical)' : 'var(--accent)',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span className="material-icons-round" style={{ fontSize: '14px' }}>
                            {selectedIncident.severity === 'critical' ? 'report_problem' : 'info'}
                          </span>
                          [{selectedIncident.severity.toUpperCase()}] {selectedIncident.crisis_type.toUpperCase()}_NODE
                        </div>
                        <h3 className="mono-display" style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {selectedIncident.location_description}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, opacity: 0.9 }}>
                          {selectedIncident.gemini_summary?.slice(0, 120)}...
                        </p>
                        <Link 
                          href={`/incident/${selectedIncident.id}`}
                          className="mono-display hover-opacity"
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: 900, 
                            color: 'var(--accent)',
                            textDecoration: 'none',
                            padding: '10px 16px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '4px',
                            border: '1px solid var(--accent-muted)',
                            width: 'fit-content'
                          }}
                        >
                          OPEN_CHANNEL <span className="material-icons-round" style={{ fontSize: '16px' }}>arrow_forward</span>
                        </Link>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b0e' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="live-dot" style={{ width: '48px', height: '48px', margin: '0 auto 24px' }} />
                    <div className="mono-display" style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.2em' }}>INITIALIZING_TACTICAL_OVERLAY...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar / Incident Feed */}
            {isSidebarOpen && (
              <div className="sidebar" style={{ 
                width: '400px', 
                background: 'var(--surface)',
                borderLeft: '1px solid var(--outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="mono-display" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0, letterSpacing: '0.1em' }}>OPERATIONAL_LOG</h3>
                    <div className="flex items-center gap-2">
                      <div className="live-dot" />
                      <div className="mono-display" style={{ fontSize: '0.6rem', color: 'var(--accent)', marginTop: '4px' }}>LIVE_TELEMETRY_STREAM</div>
                    </div>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--outline)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} className="hover-opacity">
                    <span className="material-icons-round" style={{ fontSize: '20px' }}>close</span>
                  </button>
                  </div>
                </div>
                
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {incidents.length > 0 ? incidents.map((inc, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedIncident(inc)} 
                      className={`tactical-border incident-list-item ${selectedIncident?.id === inc.id ? 'active' : ''}`}
                      style={{ 
                        padding: '16px', 
                        background: selectedIncident?.id === inc.id ? 'rgba(255, 153, 51, 0.08)' : 'rgba(255,255,255,0.03)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: selectedIncident?.id === inc.id ? 'rgba(255, 153, 51, 0.4)' : 'var(--outline-variant)',
                        borderLeftWidth: '4px',
                        borderLeftColor: inc.severity === 'critical' ? 'var(--critical)' : inc.severity === 'high' ? 'var(--high)' : 'var(--accent)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '4px'
                      }}
                    >
                      {selectedIncident?.id === inc.id && (
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: 'linear-gradient(45deg, transparent 50%, rgba(255,153,51,0.2) 50%)' }} />
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
                        <div className="mono-display" style={{ fontSize: '0.85rem', fontWeight: 800, color: inc.severity === 'critical' ? 'var(--critical)' : 'var(--text-primary)' }}>
                          {inc.crisis_type.toUpperCase()}
                        </div>
                        <div className="mono-display" style={{ fontSize: '0.6rem', color: 'var(--text-muted)', opacity: 0.8 }}>
                          {formatTime(toDate(inc.created_at))}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>{inc.location_description}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                        <Link 
                          href={`/incident/${inc.id}`} 
                          className="mono-display hover-opacity"
                          style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid transparent' }}
                        >
                          ACCESS_CHANNEL
                        </Link>
                        <span className="severity-badge" style={{ 
                          fontSize: '0.55rem', 
                          color: inc.severity === 'critical' ? 'var(--critical)' : inc.severity === 'high' ? 'var(--high)' : 'var(--accent)',
                          borderColor: 'currentColor',
                          padding: '2px 6px'
                        }}>
                          {inc.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '80px 24px', opacity: 0.3 }}>
                      <span className="material-icons-round" style={{ fontSize: '40px', marginBottom: '16px', display: 'block' }}>radar</span>
                      <div className="mono-display" style={{ fontSize: '0.8rem', fontWeight: 800 }}>SYSTEMS_CLEAR</div>
                      <div className="mono-display" style={{ fontSize: '0.65rem', marginTop: '6px' }}>Scanning for anomalies...</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <MobileNavBar />
        </main>

        <style jsx>{`
          .sidebar {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .incident-list-item:hover {
            background: rgba(255, 255, 255, 0.05) !important;
            transform: translateX(4px);
          }
          .incident-list-item.active {
            transform: translateX(8px);
            box-shadow: -8px 0 20px rgba(255, 153, 51, 0.1);
          }
          @media (max-width: 768px) {
            .sidebar {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100% !important;
              height: 45vh !important;
              border-left: none;
              border-top: 1px solid var(--outline-variant);
              border-radius: 20px 20px 0 0;
              transform: ${isSidebarOpen ? 'translateY(0)' : 'translateY(100%)'};
              background: var(--bg-base) !important;
              padding-bottom: 80px;
              box-shadow: 0 -8px 48px rgba(0,0,0,0.6);
            }
            .incident-list-item:hover {
              transform: none;
            }
            .incident-list-item.active {
              transform: scale(1.02);
            }
            .map-container-wrapper {
              height: ${isSidebarOpen ? '55vh' : '100%'} !important;
              transition: height 0.3s ease;
            }
          }
        `}</style>
      </div>
    </AuthGuard>
  )
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b0e' }}>
        <div className="mono-display" style={{ color: 'var(--accent)' }}>LOADING_MAP_RESOURCES...</div>
      </div>
    }>
      <MapPageContent />
    </Suspense>
  )
}
