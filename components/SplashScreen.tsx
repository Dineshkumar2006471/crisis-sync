'use client'
import { useState, useEffect } from 'react'

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('INITIALIZING_CORE')

  useEffect(() => {
    const statusMessages = [
      'BOOTING_OS',
      'ESTABLISHING_SECURE_LINK',
      'LOADING_AI_MODELS',
      'SYNCING_FIREBASE',
      'READY'
    ]
    
    let currentIdx = 0
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 500)
          return 100
        }
        
        // Progress status logic
        if (prev > 20 && currentIdx === 0) { setStatus(statusMessages[1]); currentIdx++ }
        if (prev > 50 && currentIdx === 1) { setStatus(statusMessages[2]); currentIdx++ }
        if (prev > 75 && currentIdx === 2) { setStatus(statusMessages[3]); currentIdx++ }
        if (prev > 95 && currentIdx === 3) { setStatus(statusMessages[4]); currentIdx++ }
        
        return prev + Math.random() * 8
      })
    }, 120)

    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#050505',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: 'white',
      fontFamily: 'var(--font-data)'
    }}>
      {/* Tactical scan-line overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
        pointerEvents: 'none'
      }} />

      <div style={{ marginBottom: '40px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          border: '2px solid var(--accent)', 
          borderRadius: '0px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span className="material-icons-sharp" style={{ fontSize: '48px', color: 'var(--accent)' }}>
            emergency
          </span>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '280px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--accent)', letterSpacing: '0.2em', fontWeight: 900 }}>{status}</span>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900 }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ 
          height: '2px', 
          width: '100%', 
          background: 'rgba(255,255,255,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: 'var(--accent)',
            transition: 'width 0.2s ease-out'
          }} />
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: '40px', 
        fontSize: '0.55rem', 
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.25em',
        fontWeight: 900
      }}>
        CRISIS_SYNC // V1.2.0_SECURE
      </div>
    </div>
  )
}
