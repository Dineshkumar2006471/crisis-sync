'use client'

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen" style={{ 
      paddingTop: 'var(--safe-top)',
      paddingBottom: 'var(--safe-bottom)',
      background: '#0A0C10'
    }}>
      {children}
    </div>
  )
}
