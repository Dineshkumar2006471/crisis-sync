'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { fetchStaffSession, saveStaffSession } from '@/lib/staffProfile'

type OperatorLoginPanelProps = {
  className?: string
}

const E2E_BYPASS_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function OperatorLoginPanel({ className = '' }: OperatorLoginPanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState(() => {
    if (typeof window === 'undefined') {
      return ''
    }

    const params = new URLSearchParams(window.location.search)
    return params.get('registered') === '1'
      ? 'Registration submitted. An administrator must activate your operator account before first login.'
      : ''
  })
  const [loading, setLoading] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const router = useRouter()

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    try {
      if (E2E_BYPASS_ENABLED) {
        saveStaffSession({
          uid: 'e2e-user',
          email,
          display_name: 'E2E Operator',
          role: 'admin',
          hotel_id: 'hotel_001',
          active: true,
        })
        router.push('/dashboard')
        return
      }

      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
      const session = await fetchStaffSession(userCredential.user.uid)

      if (!session) {
        throw new Error('Staff profile not found for this account.')
      }

      if (!session.active) {
        await signOut(auth)
        throw new Error('Operator account is pending approval.')
      }

      saveStaffSession(session)
      router.push(session.role === 'admin' || session.role === 'management' ? '/admin' : '/dashboard')
    } catch (loginError: unknown) {
      setError(getErrorMessage(loginError, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Enter your operator email first to receive a reset link.')
      setInfo('')
      return
    }

    setSendingReset(true)
    setError('')
    setInfo('')

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setInfo('Reset link sent to the operator email address.')
    } catch (resetError: unknown) {
      setError(getErrorMessage(resetError, 'Password reset failed'))
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <div className={`w-full border-[2px] border-[var(--outline)] bg-[var(--surface)] p-0 ${className}`.trim()}>
      {/* Header bar */}
      <div className="px-6 sm:px-8 py-6 border-b-[2px] border-[var(--outline)]">
        <span className="font-data text-[0.6rem] text-[var(--accent)] tracking-[0.3em] uppercase block mb-3">
          AUTH_PROTOCOL // SECURE
        </span>
        <h1 className="font-heading text-3xl font-semibold uppercase tracking-tighter m-0 italic">
          Operator Login
        </h1>
        <p className="mt-2 font-body text-sm text-[var(--text-secondary)] tracking-wide">
          Sign in with your assigned account to access live incidents.
        </p>
      </div>

      <form onSubmit={handleLogin} className="px-6 sm:px-8 py-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="font-data text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[var(--text-muted)]">
            OPERATOR_EMAIL
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@hotel.com"
            className="h-12 w-full border-[2px] border-[var(--outline)] bg-[var(--bg-base)] px-4 text-sm text-white font-data tracking-wide outline-none focus:border-[var(--accent)] transition-colors"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="font-data text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[var(--text-muted)]">
            ACCESS_KEY
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            className="h-12 w-full border-[2px] border-[var(--outline)] bg-[var(--bg-base)] px-4 text-sm text-white font-data tracking-wide outline-none focus:border-[var(--accent)] transition-colors"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? (
          <div className="border-[2px] border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 font-data tracking-wide flex items-center gap-3">
            <span className="material-icons-sharp text-lg text-red-400">error</span>
            {error}
          </div>
        ) : null}

        {info ? (
          <div className="border-[2px] border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 font-data tracking-wide flex items-center gap-3">
            <span className="material-icons-sharp text-lg text-emerald-400">info</span>
            {info}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          aria-label="Authorize access"
          className="btn-tactical flex h-14 w-full items-center justify-center text-sm font-display font-black tracking-widest uppercase disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-3">
              <span className="material-icons-sharp animate-spin text-lg">sync</span>
              AUTHENTICATING...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <span className="material-icons-sharp text-lg">lock_open</span>
              AUTHORIZE ACCESS
            </span>
          )}
        </button>
      </form>

      <div className="px-6 sm:px-8 py-5 border-t-[2px] border-[var(--outline)] flex flex-col gap-3">
        <button
          type="button"
          onClick={handleResetPassword}
          disabled={sendingReset}
          className="w-fit bg-transparent p-0 font-data text-[0.65rem] tracking-[0.15em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
        >
          {sendingReset ? 'SENDING_RESET_LINK...' : 'FORGOT_ACCESS_KEY?'}
        </button>
        <Link href="/register" className="font-data text-[0.65rem] tracking-[0.15em] uppercase text-[var(--accent)] no-underline hover:underline">
          NEW_OPERATOR_REGISTRATION →
        </Link>
      </div>
    </div>
  )
}
