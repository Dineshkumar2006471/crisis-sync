'use client'
// components/AuthGuard.tsx
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { StaffRole, fetchStaffSession, getSavedStaffSession, saveStaffSession } from '@/lib/staffProfile'

interface AuthGuardProps {
  children: React.ReactNode
  fallbackHref?: string
  requiredRoles?: StaffRole[]
}

function getInitialSession() {
  return getSavedStaffSession()
}

export function AuthGuard({ children, fallbackHref = '/login', requiredRoles }: AuthGuardProps) {
  const e2eBypassEnabled = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true'
  const [hydrated, setHydrated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [cachedSession, setCachedSession] = useState<ReturnType<typeof getInitialSession> | null>(null)
  const bypassAllowed = Boolean(e2eBypassEnabled && cachedSession && cachedSession.active !== false)
  const [sessionAllowed, setSessionAllowed] = useState(false)
  const [roleAllowed, setRoleAllowed] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const session = getInitialSession()
    setCachedSession(session)
    setSessionAllowed(Boolean(session && session.active !== false))
    if (!session || session.active === false) {
      setRoleAllowed(false)
    } else if (!requiredRoles || requiredRoles.length === 0) {
      setRoleAllowed(true)
    } else {
      setRoleAllowed(requiredRoles.includes(session.role))
    }
    setHydrated(true)
  }, [requiredRoles])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (e2eBypassEnabled && cachedSession) {
      if (!auth.currentUser) {
        void signInAnonymously(auth).catch((error) => {
          console.warn('Anonymous sign-in failed in bypass mode:', error)
        })
      }
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (!currentUser) {
        setSessionAllowed(false)
        setRoleAllowed(true)
        setLoading(false)
        return
      }

      const cached = getSavedStaffSession()
      let session = cached && cached.uid === currentUser.uid ? cached : null

      if (!session) {
        session = await fetchStaffSession(currentUser.uid)
        if (session) {
          saveStaffSession(session)
        }
      }

      if (!session || session.active === false) {
        setSessionAllowed(false)
        setRoleAllowed(false)
        setLoading(false)
        return
      }

      setSessionAllowed(true)

      if (requiredRoles && requiredRoles.length > 0) {
        setRoleAllowed(requiredRoles.includes(session.role))
      } else {
        setRoleAllowed(true)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [cachedSession, e2eBypassEnabled, hydrated, requiredRoles])

  useEffect(() => {
    if (!loading && (!user || !sessionAllowed) && !bypassAllowed) {
      router.push(fallbackHref)
    }
  }, [user, loading, router, fallbackHref, bypassAllowed, sessionAllowed])

  useEffect(() => {
    if (!loading && user && (!sessionAllowed || !roleAllowed)) {
      router.push('/dashboard')
    }
  }, [loading, roleAllowed, router, user, bypassAllowed, sessionAllowed])

  useEffect(() => {
    if (!loading && bypassAllowed && !roleAllowed) {
      router.push('/dashboard')
    }
  }, [bypassAllowed, loading, roleAllowed, router])

  if (!hydrated) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-base)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        letterSpacing: '0.1em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="live-dot" />
          VERIFYING ACCESS PRIVILEGES...
        </div>
      </div>
    )
  }

  if (bypassAllowed && roleAllowed && sessionAllowed) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-base)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        letterSpacing: '0.1em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="live-dot" />
          VERIFYING ACCESS PRIVILEGES...
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will be redirected by useEffect
  }

  if (!sessionAllowed || !roleAllowed) {
    return null
  }

  return <>{children}</>
}
