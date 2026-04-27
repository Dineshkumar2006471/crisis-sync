import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type StaffRole = 'front_desk' | 'security' | 'housekeeping' | 'management' | 'admin'

export interface StaffSession {
  uid: string
  email: string
  display_name: string
  role: StaffRole
  hotel_id: string
}

const STAFF_SESSION_KEY = 'crisis_sync_staff_session'

function normalizeRole(input: unknown): StaffRole {
  const raw = String(input || '').trim().toLowerCase()
  if (raw === 'admin') return 'admin'
  if (raw === 'management' || raw === 'manager') return 'management'
  if (raw === 'security') return 'security'
  if (raw === 'housekeeping') return 'housekeeping'
  if (raw === 'front_desk' || raw === 'front desk' || raw === 'frontdesk') return 'front_desk'
  return 'front_desk'
}

export async function fetchStaffSession(uid: string): Promise<StaffSession | null> {
  const snap = await getDoc(doc(db, 'staff', uid))
  if (!snap.exists()) {
    return null
  }

  const data = snap.data() as Record<string, unknown>
  return {
    uid,
    email: String(data.email || ''),
    display_name: String(data.display_name || data.name || 'Staff'),
    role: normalizeRole(data.role),
    hotel_id: String(data.hotel_id || 'default'),
  }
}

export function saveStaffSession(session: StaffSession) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session))
}

export function getSavedStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STAFF_SESSION_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      uid: String(parsed.uid || ''),
      email: String(parsed.email || ''),
      display_name: String(parsed.display_name || 'Staff'),
      role: normalizeRole(parsed.role),
      hotel_id: String(parsed.hotel_id || 'default'),
    }
  } catch {
    return null
  }
}

export function clearStaffSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STAFF_SESSION_KEY)
}

export function canResolveIncident(role: StaffRole | null): boolean {
  void role
  return true
}
