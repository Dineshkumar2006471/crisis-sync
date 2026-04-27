'use client'
import { ReactNode, createContext, useContext } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = ['places', 'geometry'];

const GoogleMapsContext = createContext<{ isLoaded: boolean }>({ isLoaded: false });

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  if (loadError) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0b0e', color: 'var(--critical)', padding: '24px', textAlign: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '16px' }}>MAP_CONNECTION_FAILED</h2>
          <p style={{ opacity: 0.7 }}>Please check your network connection and API key configuration.</p>
        </div>
      </div>
    )
  }

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}

export const useGoogleMaps = () => useContext(GoogleMapsContext);
