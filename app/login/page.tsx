'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { ThemeToggle } from '@/components/ThemeToggle'
import { auth } from '@/lib/firebase'
import { saveStaffSession } from '@/lib/staffProfile'

const E2E_BYPASS_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (E2E_BYPASS_ENABLED) {
        saveStaffSession({
          uid: 'e2e-user',
          email,
          display_name: 'E2E Operator',
          role: 'admin',
          hotel_id: 'hotel_001',
        })
        router.push('/dashboard')
        return
      }

      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (loginError: unknown) {
      setError(getErrorMessage(loginError, 'Login failed'))
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#0A0C10] font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,153,51,0.05),transparent_70%)]" />

      <div className="z-10 flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="mb-12 text-center">
            <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[28px] border border-[#323948] bg-gradient-to-br from-[#1E212B] to-[#12141C] shadow-2xl">
              <span className="material-icons-round text-4xl text-[#FF9933]">security</span>
            </div>
            <h1 className="mb-3 text-4xl font-black uppercase tracking-tighter text-white">CrisisSync</h1>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-[#A0A5B1] opacity-60">
              Field Operations Link
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="ml-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#626875]"
              >
                Operator Identifier
              </label>
              <input
                id="email"
                type="email"
                placeholder="op_alpha@crisis-sync.com"
                className="h-16 w-full rounded-2xl border border-[#262B37] bg-[#12141C] px-6 font-bold text-white placeholder:text-[#323948] focus:border-[#FF9933] focus:outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="ml-4 text-[0.6rem] font-black uppercase tracking-[0.2em] text-[#626875]"
              >
                Tactical Access Key
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                className="h-16 w-full rounded-2xl border border-[#262B37] bg-[#12141C] px-6 font-bold text-white placeholder:text-[#323948] focus:border-[#FF9933] focus:outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <span className="material-icons-round text-lg text-red-500">report</span>
                <p className="text-[0.7rem] font-black uppercase tracking-tight text-red-500">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-label="Authorize access"
              className="mt-4 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#FF9933] text-sm font-black uppercase tracking-[0.2em] text-black shadow-[0_15px_35px_rgba(255,153,51,0.2)] transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : (
                <>
                  <span>Authorize Access</span>
                  <span className="material-icons-round">bolt</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="z-10 flex flex-col items-center gap-8 px-8 pb-12">
        <Link
          href="/"
          className="flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#626875] no-underline transition-colors hover:text-white"
        >
          <span className="material-icons-round text-sm">terminal</span>
          Abort to Command Hub
        </Link>

        <div className="flex items-center gap-6 opacity-40">
          <ThemeToggle />
          <div className="h-4 w-px bg-[#262B37]" />
          <span className="text-[0.5rem] font-black uppercase tracking-[0.4em] text-[#626875]">SECURE_V1.2.4</span>
        </div>
      </div>
    </main>
  )
}
