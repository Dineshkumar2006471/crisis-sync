// lib/audit-server.ts
import { getAdminFirestore } from './firebase-admin'

export type AuditEventType = 
  | 'INCIDENT_CREATED' 
  | 'STATUS_CHANGE' 
  | 'FIELD_UPDATE' 
  | 'BROADCAST_SENT' 
  | 'INTEL_UPLOAD' 
  | 'MISSION_RESOLVED'
  | 'ISSUE_REPORTED'

export async function logServerTacticalEvent(
  incidentData: any,
  type: AuditEventType,
  action: string,
  staffInfo: { uid: string, email: string },
  metadata?: Record<string, any>
) {
  const db = getAdminFirestore()
  
  const logEntry = {
    type,
    incidentId: incidentData.id,
    incidentType: incidentData.crisis_type,
    severity: incidentData.severity,
    hotelId: incidentData.hotel_id,
    status: incidentData.status,
    action,
    staff_uid: staffInfo.uid,
    staff_name: staffInfo.email,
    timestamp: new Date().toISOString(),
    metadata: metadata || {}
  }

  try {
    await db.collection('logs').add(logEntry)
    return true
  } catch (error) {
    console.error('Server Audit Log Error:', error)
    return false
  }
}
