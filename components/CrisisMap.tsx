'use client'

import { useEffect, useRef, memo } from 'react'
import { useGoogleMaps } from './GoogleMapsProvider'

interface CrisisMapProps {
  lat: number
  lng: number
  title: string
  severity: string
  locationDescription: string
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF3B3B',
  high: '#FF8C00',
  medium: '#F5A623',
  low: '#00E676',
}

export const CrisisMap = memo(function CrisisMap({ lat, lng, title, severity, locationDescription }: CrisisMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const { isLoaded } = useGoogleMaps()

  useEffect(() => {
    if (!isLoaded || !mapRef.current) {
      return
    }

    let cancelled = false

    const initialize = async () => {
      if (cancelled || !mapRef.current) {
        return
      }

      const position = { lat, lng }
      const map =
        mapInstanceRef.current ||
        new google.maps.Map(mapRef.current, {
          center: position,
          zoom: 17,
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#1a1c20' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0c10' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#8c909f' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#282a2e' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c0e12' }] },
          ],
        })

      mapInstanceRef.current = map
      map.setCenter(position)

      if (!markerRef.current) {
        markerRef.current = new google.maps.Marker({
          map,
          position,
          title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: SEVERITY_COLORS[severity] || '#FF3B3B',
            fillOpacity: 0.95,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 9,
          },
        })
      } else {
        markerRef.current.map = map
        markerRef.current.position = position
        markerRef.current.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: SEVERITY_COLORS[severity] || '#FF3B3B',
          fillOpacity: 0.95,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 9,
        })
      }

      if (!infoWindowRef.current) {
        infoWindowRef.current = new google.maps.InfoWindow()
        markerRef.current.addListener('click', () => {
          infoWindowRef.current?.open({
            map,
            anchor: markerRef.current ?? undefined,
          })
        })
      }

      infoWindowRef.current.setContent(
        `<div style="background:#1E2024;color:#E2E2E8;padding:12px;border:2px solid var(--outline-variant);border-radius:0px;font-family:monospace;font-size:0.8rem;min-width:200px;">
          <div style="color:${SEVERITY_COLORS[severity]};font-weight:700;text-transform:uppercase;margin-bottom:4px;">${severity.toUpperCase()}</div>
          <div style="font-weight:600;">${title}</div>
          <div style="color:#8C909F;margin-top:4px;">${locationDescription}</div>
        </div>`
      )
    }

    void initialize()

    return () => {
      cancelled = true
      infoWindowRef.current?.close()
      if (markerRef.current) {
        markerRef.current.map = null
      }
    }
  }, [isLoaded, lat, lng, locationDescription, severity, title])

  return (
    <div className="crisis-card relative overflow-hidden !p-0">
      <div ref={mapRef} className="h-[calc(40vh+100px)] min-h-[280px] max-h-[500px] w-full" />
      <div className="absolute bottom-3 left-3 border-2 border-[var(--outline-variant)] bg-[rgba(10,12,16,0.9)] px-3 py-2 text-[0.75rem] text-[var(--text-secondary)]">
        Location: {locationDescription}
      </div>
    </div>
  )
})
