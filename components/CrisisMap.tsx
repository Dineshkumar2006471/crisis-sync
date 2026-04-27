'use client'

import { useEffect, useRef } from 'react'
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

export function CrisisMap({ lat, lng, title, severity, locationDescription }: CrisisMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const { isLoaded } = useGoogleMaps()

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) {
      return
    }

    const map = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 17,
      disableDefaultUI: true,
      zoomControl: true,
      mapId: 'CRISISSYNC_MAP',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1a1c20' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0a0c10' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8c909f' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#282a2e' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c0e12' }] },
      ],
    })

    mapInstanceRef.current = map

    const marker = new google.maps.Marker({
      map,
      position: { lat, lng },
      title,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: SEVERITY_COLORS[severity] || '#FF3B3B',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    })

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="background:#1E2024;color:#E2E2E8;padding:12px;border-radius:4px;font-family:monospace;font-size:0.8rem;min-width:200px;">
        <div style="color:${SEVERITY_COLORS[severity]};font-weight:700;text-transform:uppercase;margin-bottom:4px;">${severity.toUpperCase()}</div>
        <div style="font-weight:600;">${title}</div>
        <div style="color:#8C909F;margin-top:4px;">${locationDescription}</div>
      </div>`,
    })

    marker.addListener('click', () => infoWindow.open(map, marker))

    return () => {
      marker.setMap(null)
      infoWindow.close()
      mapInstanceRef.current = null
    }
  }, [isLoaded, lat, lng, locationDescription, severity, title])

  return (
    <div className="crisis-card relative overflow-hidden !p-0">
      <div ref={mapRef} className="h-[calc(40vh+100px)] min-h-[280px] max-h-[500px] w-full" />
      <div className="absolute bottom-3 left-3 rounded border border-[var(--outline-variant)] bg-[rgba(10,12,16,0.9)] px-3 py-2 text-[0.75rem] text-[var(--text-secondary)]">
        Location: {locationDescription}
      </div>
    </div>
  )
}
