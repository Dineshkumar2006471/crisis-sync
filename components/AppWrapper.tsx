'use client'

import { useEffect } from 'react'

export function AppWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.reveal-on-scroll'))

    if (!elements.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [children])

  return (
    <div className="flex min-h-screen flex-col" style={{
      paddingTop: 'var(--safe-top)',
      paddingBottom: 'var(--safe-bottom)',
      background: 'var(--bg-base)',
    }}>
      {children}
    </div>
  )
}
