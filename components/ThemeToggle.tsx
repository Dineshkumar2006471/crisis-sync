'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const effectiveTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : theme
    document.documentElement.setAttribute('data-theme', effectiveTheme)
    localStorage.setItem('theme', effectiveTheme)
  }, [theme])

  const toggleTheme = (event: React.MouseEvent) => {
    event.stopPropagation()
    setTheme((previous) => (previous === 'light' ? 'dark' : 'light'))
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'var(--surface)',
        border: '2px solid var(--outline)',
        borderRadius: '0px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-primary)',
        transition: 'all 0.15s ease',
      }}
      aria-label="Toggle Theme"
      className="theme-toggle-dock hover:border-[var(--accent)] hover:text-[var(--accent)]"
    >
      <span className="material-icons-sharp" style={{ fontSize: '16px' }}>
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  )
}
