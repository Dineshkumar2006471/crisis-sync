// lib/audit.ts
import { db, auth } from './firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Incident } from './types'

export type AuditEventType = 
  | 'INCIDENT_CREATED' 
  | 'STATUS_CHANGE' 
  | 'FIELD_UPDATE' 
  | 'BROADCAST_SENT' 
  | 'INTEL_UPLOAD' 
  | 'MISSION_RESOLVED'
  | 'ISSUE_REPORTED'

export interface AuditLogEntry {
  type: AuditEventType
  incidentId: string
  incidentType: string
  severity: string
  hotelId: string
  status: string
  action: string
  staff_uid: string
  staff_name: string
  timestamp: any
  metadata?: Record<string, any>
}

export async function logTacticalEvent(
  incident: Incident,
  type: AuditEventType,
  action: string,
  metadata?: Record<string, any>
) {
  const logEntry: AuditLogEntry = {
    type,
    incidentId: incident.id,
    incidentType: incident.crisis_type,
    severity: incident.severity,
    hotelId: incident.hotel_id,
    status: incident.status,
    action,
    staff_uid: auth.currentUser?.uid || 'unknown',
    staff_name: auth.currentUser?.email || 'Staff',
    timestamp: serverTimestamp(),
    metadata: metadata || {}
  }

  try {
    await addDoc(collection(db, 'logs'), logEntry)
    return true
  } catch (error) {
    console.error('Audit Log Error:', error)
    return false
  }
}
