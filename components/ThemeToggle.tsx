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
        background: 'var(--accent)',
        border: '3px solid var(--surface)',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#FFFFFF',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
      }}
      aria-label="Toggle Theme"
      className="theme-toggle-dock"
    >
      <span className="material-icons-round" style={{ fontSize: '14px' }}>
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  )
}
