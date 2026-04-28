'use client'
import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import Link from 'next/link'

export default function SetupPage() {
  const setupAllowed = process.env.NODE_ENV !== 'production'
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR'>('IDLE')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('admin@crisis-sync.com')
  const [password, setPassword] = useState('')
  const [hotelId, setHotelId] = useState('hotel_001')

  const initializeSystem = async () => {
    if (!setupAllowed) {
      setStatus('ERROR')
      setMessage('Setup route is disabled in production.')
      return
    }

    if (!email.trim() || password.length < 8 || !hotelId.trim()) {
      setStatus('ERROR')
      setMessage('Provide valid email, password (8+ chars), and hotel ID.')
      return
    }

    setStatus('PENDING')
    try {
      // 1. Create the Auth User
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      
      // 2. Create the Firestore Profile
      await setDoc(doc(db, 'staff', userCred.user.uid), {
        email: email.trim(),
        display_name: 'System Admin',
        role: 'admin',
        hotel_id: hotelId.trim(),
        active: true,
        created_at: new Date().toISOString()
      })

      setStatus('SUCCESS')
      setMessage('Initial staff account created successfully!')
    } catch (err: unknown) {
      setStatus('ERROR')
      setMessage(err instanceof Error ? err.message : 'Failed to initialize.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: '24px' }}>
      <div style={{ maxWidth: '400px', width: '100%', background: 'var(--surface)', padding: '32px', borderRadius: '0px', border: '2px solid var(--outline-variant)' }}>
        <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: '1.25rem', marginBottom: '16px' }}>System Initializer</h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          This tool is intended for local development initialization only.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <input
            className="crisis-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Admin email"
          />
          <input
            className="crisis-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
          />
          <input
            className="crisis-input"
            type="text"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            placeholder="Hotel ID"
          />
        </div>

        {status === 'IDLE' && (
          <button
            onClick={initializeSystem}
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={!setupAllowed}
          >
            {setupAllowed ? 'INITIALIZE STAFF ACCOUNT' : 'DISABLED IN PRODUCTION'}
          </button>
        )}

        {status === 'PENDING' && (
          <div style={{ textAlign: 'center', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>PROVISIONING...</div>
        )}

        {status === 'SUCCESS' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--low)', marginBottom: '16px' }}>✓ {message}</div>
            <Link href="/login">
              <button className="btn-primary" style={{ width: '100%' }}>GO TO LOGIN</button>
            </Link>
          </div>
        )}

        {status === 'ERROR' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--critical)', marginBottom: '16px' }}>⚠ {message}</div>
            <button onClick={() => setStatus('IDLE')} className="btn-ghost">TRY AGAIN</button>
          </div>
        )}
      </div>
    </div>
  )
}
