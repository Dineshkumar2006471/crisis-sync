'use client'
// app/register/page.tsx
import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StaffRole, saveStaffSession } from '@/lib/staffProfile'
import { ThemeToggle } from '@/components/ThemeToggle'

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<StaffRole>('front_desk')
  const [hotelId, setHotelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !displayName || !hotelId) {
      setError('All fields are required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      const staffData = {
        email,
        display_name: displayName,
        role,
        hotel_id: hotelId,
        created_at: new Date().toISOString(),
      }

      await setDoc(doc(db, 'staff', user.uid), staffData)
      
      saveStaffSession({
        uid: user.uid,
        email,
        display_name: displayName,
        role,
        hotel_id: hotelId,
      })

      router.push(role === 'admin' ? '/admin' : '/dashboard')
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[var(--bg-base)] flex flex-col relative overflow-hidden text-[var(--text-primary)]">
      {/* Immersive Edge-to-Edge Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-[40%] bg-gradient-to-b from-[var(--accent)]/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-[var(--accent)]/5 to-transparent" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 flex items-center justify-between px-6 pt-[calc(var(--safe-top)+1.5rem)]">
        <Link href="/login" className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-high)] active:scale-90 transition-transform no-underline text-[var(--text-primary)]">
          <span className="material-icons-round">arrow_back</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Hero Section */}
      <div className="relative z-10 px-8 pt-10 pb-8">
        <h1 className="text-4xl font-black tracking-tighter leading-none uppercase mb-2">
          Request<br /><span className="text-[var(--accent)]">Access</span>
        </h1>
        <p className="mono-display text-[0.6rem] font-black tracking-widest uppercase opacity-50">New_Operator_Enrollment</p>
      </div>

      {/* Register Form - truly Edge-to-Edge */}
      <div className="relative z-10 flex-1 flex flex-col px-6 overflow-y-auto no-scrollbar pb-10">
        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          
          <div className="relative group">
            <label className="absolute -top-2.5 left-4 px-2 bg-[var(--bg-base)] text-[0.55rem] font-black text-[var(--accent)] tracking-widest uppercase z-10">Full_Identity</label>
            <input
              className="w-full h-14 px-6 bg-transparent border-2 border-[var(--outline-variant)] rounded-2xl font-bold focus:outline-none focus:border-[var(--accent)] transition-all"
              type="text" required placeholder="DISPLAY_NAME"
              value={displayName} onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          <div className="relative group">
            <label className="absolute -top-2.5 left-4 px-2 bg-[var(--bg-base)] text-[0.55rem] font-black text-[var(--accent)] tracking-widest uppercase z-10">Operator_Email</label>
            <input
              className="w-full h-14 px-6 bg-transparent border-2 border-[var(--outline-variant)] rounded-2xl font-bold focus:outline-none focus:border-[var(--accent)] transition-all"
              type="email" required placeholder="EMAIL_ADDRESS"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <label className="absolute -top-2.5 left-4 px-2 bg-[var(--bg-base)] text-[0.55rem] font-black text-[var(--accent)] tracking-widest uppercase z-10">Security_Code</label>
            <input
              className="w-full h-14 px-6 bg-transparent border-2 border-[var(--outline-variant)] rounded-2xl font-bold focus:outline-none focus:border-[var(--accent)] transition-all"
              type="password" required placeholder="PASSWORD"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="relative group">
            <label className="absolute -top-2.5 left-4 px-2 bg-[var(--bg-base)] text-[0.55rem] font-black text-[var(--accent)] tracking-widest uppercase z-10">Facility_ID</label>
            <input
              className="w-full h-14 px-6 bg-transparent border-2 border-[var(--outline-variant)] rounded-2xl font-bold focus:outline-none focus:border-[var(--accent)] transition-all"
              type="text" required placeholder="HOTEL_ID"
              value={hotelId} onChange={e => setHotelId(e.target.value)}
            />
          </div>

          <div className="relative group">
             <label className="absolute -top-2.5 left-4 px-2 bg-[var(--bg-base)] text-[0.55rem] font-black text-[var(--accent)] tracking-widest uppercase z-10">Operational_Role</label>
             <select 
               className="w-full h-14 px-6 bg-transparent border-2 border-[var(--outline-variant)] rounded-2xl font-bold focus:outline-none focus:border-[var(--accent)] transition-all appearance-none"
               value={role} onChange={e => setRole(e.target.value as StaffRole)}
             >
                <option value="front_desk">FRONT_DESK</option>
                <option value="security">SECURITY</option>
                <option value="housekeeping">HOUSEKEEPING</option>
                <option value="management">MANAGEMENT</option>
                <option value="admin">ADMIN_CORE</option>
             </select>
             <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <span className="material-icons-round">unfold_more</span>
             </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 animate-fade-in">
              <span className="material-icons-round">error_outline</span>
              <span className="text-[0.7rem] font-black uppercase tracking-widest leading-tight">{error}</span>
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full h-16 bg-[var(--accent)] text-black font-black text-[1rem] uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_50px_rgba(255,153,51,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 mt-2"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <span>Enroll Now</span>
                <span className="material-icons-round">app_registration</span>
              </>
            )}
          </button>
        </form>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  )
}
