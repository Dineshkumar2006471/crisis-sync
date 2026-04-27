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
      background: '#0A0C10',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: 'white',
      fontFamily: 'var(--font-mono)'
    }}>
      {/* Tactical Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        background: 'var(--accent)',
        filter: 'blur(100px)',
        opacity: 0.1,
        borderRadius: '50%'
      }} />

      <div className="animate-pulse-tactical" style={{ marginBottom: '40px' }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          border: '4px solid var(--accent)', 
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span className="material-icons-round" style={{ fontSize: '48px', color: 'var(--accent)' }}>
            emergency
          </span>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '240px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--accent)', letterSpacing: '0.1em' }}>{status}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{Math.round(progress)}%</span>
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
            transition: 'width 0.2s ease-out',
            boxShadow: '0 0 10px var(--accent)'
          }} />
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: '40px', 
        fontSize: '0.6rem', 
        color: 'var(--text-muted)',
        letterSpacing: '0.2em'
      }}>
        CRISIS_SYNC // V1.2.0_SECURE
      </div>
    </div>
  )
}
