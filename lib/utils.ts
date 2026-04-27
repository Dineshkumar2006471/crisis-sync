import { Timestamp } from 'firebase/firestore'

type TimestampLike =
  | Timestamp
  | Date
  | string
  | number
  | {
      seconds?: number
      nanoseconds?: number
      toDate?: () => Date
    }
  | null
  | undefined

/**
 * Safely converts various timestamp formats (string, number, Firestore Timestamp) to a JavaScript Date object.
 */
export function toDate(ts: TimestampLike): Date {
  if (!ts) return new Date()
  
  if (ts instanceof Date) return ts
  
  // Firestore Timestamp
  if (ts instanceof Timestamp) return ts.toDate()
  
  // Object with toDate method (like a Timestamp that lost its prototype during serialization)
  if (typeof ts === 'object' && typeof ts.toDate === 'function') return ts.toDate()
  
  // Object with seconds/nanoseconds (raw Firestore Timestamp data)
  if (typeof ts === 'object' && ts.seconds !== undefined) {
    return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000)
  }
  
  // ISO string or numeric timestamp
  if (typeof ts === 'string' || typeof ts === 'number') {
    const date = new Date(ts)
    if (!isNaN(date.getTime())) return date
  }
  
  return new Date()
}

/**
 * Formats a timestamp into a human-readable time string (e.g., "14:30").
 */
export function formatTime(ts: TimestampLike): string {
  const date = toDate(ts)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Formats a timestamp into a full date-time string.
 */
export function formatDateTime(ts: TimestampLike): string {
  const date = toDate(ts)
  return date.toLocaleString()
}
