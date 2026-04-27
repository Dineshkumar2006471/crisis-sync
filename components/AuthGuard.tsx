'use client'
// components/AuthGuard.tsx
import { useEffect, useState } from 'react'
import { onAuthStateChanged, User } from 'firebase/auth'
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
  const [user, setUser] = useState<User | null>(null)
  const [cachedSession] = useState(getInitialSession)
  const [bypassAllowed] = useState(Boolean(cachedSession))
  const [roleAllowed, setRoleAllowed] = useState(() => {
    if (!cachedSession || !requiredRoles || requiredRoles.length === 0) {
      return true
    }

    return requiredRoles.includes(cachedSession.role)
  })
  const [loading, setLoading] = useState(!cachedSession)
  const router = useRouter()

  useEffect(() => {
    if (e2eBypassEnabled && cachedSession) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (!currentUser) {
        setRoleAllowed(true)
        setLoading(false)
        return
      }

      if (requiredRoles && requiredRoles.length > 0) {
        const cached = getSavedStaffSession()
        if (cached && cached.uid === currentUser.uid) {
          setRoleAllowed(requiredRoles.includes(cached.role))
        } else {
          const session = await fetchStaffSession(currentUser.uid)
          if (session) {
            saveStaffSession(session)
            setRoleAllowed(requiredRoles.includes(session.role))
          } else {
            setRoleAllowed(false)
          }
        }
      } else {
        setRoleAllowed(true)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [cachedSession, e2eBypassEnabled, requiredRoles])

  useEffect(() => {
    if (!loading && !user && !bypassAllowed) {
      router.push(fallbackHref)
    }
  }, [user, loading, router, fallbackHref, bypassAllowed])

  useEffect(() => {
    if (!loading && user && !roleAllowed) {
      router.push('/dashboard')
    }
  }, [loading, roleAllowed, router, user, bypassAllowed])

  useEffect(() => {
    if (!loading && bypassAllowed && !roleAllowed) {
      router.push('/dashboard')
    }
  }, [bypassAllowed, loading, roleAllowed, router])

  if (bypassAllowed && roleAllowed) {
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

  if (!roleAllowed) {
    return null
  }

  return <>{children}</>
}
