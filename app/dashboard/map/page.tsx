'use client'
import { useEffect, useRef, useState } from 'react'
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Incident } from '@/lib/types'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'

import { GoogleMap } from '@react-google-maps/api'
import { useGoogleMaps } from '@/components/GoogleMapsProvider'

import { useSearchParams } from 'next/navigation'
import { MobileNavBar } from '@/components/MobileNavBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { formatTime, toDate } from '@/lib/utils'
import { getSavedStaffSession } from '@/lib/staffProfile'

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

function getIncidentPosition(incident: IncidentWithCoordinates) {
  if (typeof incident.lat === 'number' && Number.isFinite(incident.lat) &&
      typeof incident.lng === 'number' && Number.isFinite(incident.lng)) {
    return { lat: incident.lat, lng: incident.lng }
  }

  return null
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const hotelId = getSavedStaffSession()?.hotel_id || 'hotel_001'

  const searchParams = useSearchParams()
  const focusedIncidentId = searchParams.get('incidentId')

  const { isLoaded } = useGoogleMaps()

  useEffect(() => {
    const liveQuery = query(
      collection(db, 'incidents'),
      where('hotel_id', '==', hotelId),
      orderBy('created_at', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(liveQuery, (snapshot) => {
      const list = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as IncidentWithCoordinates))
        .filter((incident) => incident.status !== 'resolved')

      setIncidents(list)

      if (focusedIncidentId) {
        const focused = list.find((incident) => incident.id === focusedIncidentId)
        if (focused) setSelectedIncident(focused)
      }
    })

    return () => unsubscribe()
  }, [focusedIncidentId, hotelId])

  const mappableIncidents = incidents.filter((incident) => getIncidentPosition(incident) !== null)
  const incidentsWithoutLocation = incidents.length - mappableIncidents.length
  const center =
    (selectedIncident ? getIncidentPosition(selectedIncident as IncidentWithCoordinates) : null)
    || (mappableIncidents.length > 0 ? getIncidentPosition(mappableIncidents[0]) : null)
    || centerDefault

  useEffect(() => {
    if (!isLoaded || !mapInstance) {
      return
    }

    let cancelled = false

    const syncMarkers = async () => {
      if (cancelled) {
        return
      }

      markersRef.current.forEach((marker) => {
        marker.setMap(null)
      })
      markersRef.current = []

      if (!infoWindowRef.current) {
        infoWindowRef.current = new google.maps.InfoWindow()
      }

      markersRef.current = mappableIncidents
        .map((incident) => {
          const position = getIncidentPosition(incident)
          if (!position) {
            return null
          }

          const marker = new google.maps.Marker({
            map: mapInstance,
            position,
            title: incident.location_description,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor:
                incident.severity === 'critical'
                  ? '#FF3B3B'
                  : incident.severity === 'high'
                    ? '#FF9F0A'
                    : '#3B82F6',
              fillOpacity: 0.95,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 9,
            },
          })

          marker.addListener('click', () => {
            setSelectedIncident(incident)
            setIsSidebarOpen(true)
            infoWindowRef.current?.setContent(
              `<div style="background:#0a0c10;color:#FFFFFF;padding:16px;border:2px solid var(--accent);min-width:220px;font-family:var(--font-mono),monospace;">
                <div style="font-family:var(--font-mono),monospace;font-size:11px;font-weight:800;letter-spacing:0.12em;color:${
                  incident.severity === 'critical' ? '#FF3B3B' : '#FF9933'
                };">
                  ${incident.severity.toUpperCase()} / ${incident.crisis_type.toUpperCase()}
                </div>
                <div style="margin-top:8px;font-weight:800;font-size:16px;">${incident.location_description}</div>
                <div style="margin-top:8px;font-size:13px;color:#A0A5B1;border-top:2px solid rgba(255,255,255,0.1);padding-top:8px;">${incident.gemini_summary || 'Incident active.'}</div>
              </div>`
            )
            infoWindowRef.current?.open({
              map: mapInstance,
              anchor: marker,
            })
          })

          return marker
        })
        .filter((marker): marker is google.maps.Marker => marker !== null)
    }

    void syncMarkers()

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => {
        marker.setMap(null)
      })
      markersRef.current = []
    }
  }, [isLoaded, mapInstance, mappableIncidents])

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
            borderBottom: '2px solid var(--outline-variant)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href="/dashboard" className="hover-opacity" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '0px', border: '2px solid var(--outline)' }}>
                <span className="material-icons-sharp">arrow_back</span>
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
                  border: '2px solid var(--outline)',
                  borderRadius: '0px',
                  color: 'var(--text-primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <span className="material-icons-sharp" style={{ fontSize: '18px' }}>{isSidebarOpen ? 'visibility_off' : 'list'}</span>
                <span className="mono-display">{isSidebarOpen ? 'HIDE_LOG' : 'SHOW_LOG'}</span>
              </button>
              <ThemeToggle />
            </div>
          </header>

          <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
            {/* Main Map */}
            <div className="map-container-wrapper" style={{ flex: 1, position: 'relative' }}>
              {isLoaded ? (
                <>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={center}
                  zoom={14}
                  onLoad={(map) => setMapInstance(map)}
                  options={{
                    styles: darkMapStyle,
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: false,
                  }}
                >
                </GoogleMap>
                {incidentsWithoutLocation > 0 ? (
                  <div className="absolute left-4 top-4 z-10 max-w-sm border-2 border-[var(--accent)] bg-[rgba(10,12,16,0.95)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                    <div className="mono-display text-[0.58rem] font-black tracking-[0.18em] text-[var(--accent)]">
                      LIVE LOCATION REQUIRED
                    </div>
                    <p className="mt-2 mb-0 leading-5">
                      {incidentsWithoutLocation} active incident{incidentsWithoutLocation === 1 ? '' : 's'} do not include live coordinates, so no synthetic marker is shown.
                    </p>
                  </div>
                ) : null}
                </>
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
                borderLeft: '2px solid var(--outline-variant)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{ padding: '24px', borderBottom: '2px solid var(--outline-variant)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 className="mono-display" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0, letterSpacing: '0.1em' }}>OPERATIONAL_LOG</h3>
                    <div className="flex items-center gap-2">
                      <div className="live-dot" />
                      <div className="mono-display" style={{ fontSize: '0.6rem', color: 'var(--accent)', marginTop: '4px' }}>LIVE_TELEMETRY_STREAM</div>
                    </div>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '2px solid var(--outline)', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '0px' }} className="hover-opacity">
                    <span className="material-icons-sharp" style={{ fontSize: '20px' }}>close</span>
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
                        background: selectedIncident?.id === inc.id ? 'rgba(255, 153, 51, 0.08)' : 'rgba(255,255,255,0.03)',
                        borderTopWidth: '2px',
                        borderRightWidth: '2px',
                        borderBottomWidth: '2px',
                        borderLeftWidth: '6px',
                        borderStyle: 'solid',
                        borderTopColor: selectedIncident?.id === inc.id ? 'var(--accent)' : 'var(--outline-variant)',
                        borderRightColor: selectedIncident?.id === inc.id ? 'var(--accent)' : 'var(--outline-variant)',
                        borderBottomColor: selectedIncident?.id === inc.id ? 'var(--accent)' : 'var(--outline-variant)',
                        borderLeftColor: inc.severity === 'critical' ? 'var(--critical)' : inc.severity === 'high' ? 'var(--high)' : 'var(--accent)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '0px'
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
                          style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textDecoration: 'none', borderBottom: '2px solid transparent' }}
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
                      <span className="material-icons-sharp" style={{ fontSize: '40px', marginBottom: '16px', display: 'block' }}>radar</span>
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
              border-top: 2px solid var(--outline-variant);
              border-radius: 0px;
              transform: ${isSidebarOpen ? 'translateY(0)' : 'translateY(100%)'};
              background: var(--bg-base) !important;
              padding-bottom: 80px;
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
