import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminFirestore } from '@/lib/firebase-admin'
import * as admin from 'firebase-admin'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const CLASSIFY_TIMEOUT_MS = 90000
const RTDB_TIMEOUT_MS = 2500
const FIRESTORE_TIMEOUT_MS = 3500

type CrisisType = 'fire' | 'medical' | 'security' | 'structural' | 'power' | 'other'
type Severity = 'critical' | 'high' | 'medium' | 'low'

type NormalizedClassification = {
  crisis_type: CrisisType
  severity: Severity
  severity_score: number
  confidence: number
  summary_english: string
  guest_instruction: string
  staff_instructions: {
    front_desk: string
    security: string
    housekeeping: string
    management: string
  }
  tactical_objectives: string[]
  call_emergency_services: boolean
  emergency_number: string
}

const CRISIS_TYPE_MAP: Record<string, 'fire' | 'medical' | 'security' | 'structural' | 'power' | 'other'> = {
  fire: 'fire',
  medical: 'medical',
  security: 'security',
  structural: 'structural',
  power: 'power',
  other: 'other',
  'natural disaster': 'other',
  disaster: 'other',
}

const SEVERITY_MAP: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

const DEFAULT_SEVERITY_SCORES: Record<Severity, number> = {
  critical: 92,
  high: 78,
  medium: 55,
  low: 25,
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
  ) as T
}

function normalizeCrisisType(input: unknown): 'fire' | 'medical' | 'security' | 'structural' | 'power' | 'other' {
  const key = String(input || 'other').trim().toLowerCase()
  return CRISIS_TYPE_MAP[key] || 'other'
}

function normalizeSeverity(input: unknown): 'critical' | 'high' | 'medium' | 'low' {
  const key = String(input || 'medium').trim().toLowerCase()
  return SEVERITY_MAP[key] || 'medium'
}

function normalizeStaffInstructions(input: unknown) {
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  return {
    front_desk: String(source.front_desk || source.front_office || source.general || 'Coordinate guest communication and announcements.'),
    security: String(source.security || source.general || 'Secure access points and guide evacuation routes.'),
    housekeeping: String(source.housekeeping || source.engineering || source.general || 'Assist guests and clear evacuation pathways.'),
    management: String(source.management || source.general || 'Oversee escalation and coordinate with responders.'),
  }
}

function normalizeSeverityScore(input: unknown, severity: Severity): number {
  const fallback = DEFAULT_SEVERITY_SCORES[severity]
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.max(0, Math.min(100, Math.round(input)))
  }

  if (typeof input === 'string') {
    const parsed = Number(input)
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(100, Math.round(parsed)))
    }
  }

  return fallback
}

function buildDefaultObjectives(crisisType: CrisisType, summary: string): string[] {
  const lowerSummary = summary.toLowerCase()

  if (crisisType === 'security' && /(lock|door|access|key)/.test(lowerSummary)) {
    return [
      'Confirm whether the guest is locked in, locked out, or otherwise unsafe',
      'Dispatch security or engineering to restore controlled access',
      'Preserve access-control or CCTV evidence and document the resolution',
    ]
  }

  const defaults: Record<CrisisType, string[]> = {
    fire: [
      'Confirm smoke or flame source and trigger fire protocol',
      'Clear guests from the affected floor using stair routes',
      'Stage responders and fire services access at the nearest safe approach',
    ],
    medical: [
      'Confirm the patient condition and keep the area clear for treatment',
      'Dispatch the nearest trained responder with first-aid equipment',
      'Prepare ambulance handoff and route access if escalation is needed',
    ],
    security: [
      'Verify the guest or area is safe and isolate the affected access point',
      'Dispatch the nearest security unit to the reported location',
      'Preserve CCTV and witness details for follow-up',
    ],
    structural: [
      'Isolate the affected area and stop guest traffic nearby',
      'Check for debris, collapse risk, or trapped occupants',
      'Escalate to engineering leadership and emergency services if instability is confirmed',
    ],
    power: [
      'Confirm the outage scope and identify impacted guest areas',
      'Dispatch engineering to restore critical systems and trapped-access risks',
      'Issue calm guest guidance and protect elevator and corridor safety',
    ],
    other: [
      'Confirm the reported situation with the nearest staff unit',
      'Stabilize guest safety at the reported location',
      'Escalate to the correct department and maintain incident updates',
    ],
  }

  return defaults[crisisType]
}

function normalizeTacticalObjectives(input: unknown, crisisType: CrisisType, summary: string): string[] {
  if (Array.isArray(input)) {
    const cleaned = input
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0)
      .slice(0, 3)

    if (cleaned.length === 3) {
      return cleaned
    }
  }

  return buildDefaultObjectives(crisisType, summary)
}

function classifyLocally(
  incidentText: string,
  hint?: CrisisType | null
): Pick<NormalizedClassification, 'crisis_type' | 'severity' | 'severity_score' | 'call_emergency_services' | 'emergency_number' | 'summary_english' | 'guest_instruction' | 'staff_instructions' | 'tactical_objectives'> {
  const text = incidentText.toLowerCase()
  const lowerHint = hint || null

  if (/(fire|smoke|burn|flame|alarm)/.test(text)) {
    return {
      crisis_type: 'fire',
      severity: 'critical',
      severity_score: 95,
      call_emergency_services: true,
      emergency_number: '101',
      summary_english: 'Fire or smoke hazard reported in the hotel.',
      guest_instruction: 'Please evacuate using the nearest stairwell and do not use elevators.',
      staff_instructions: {
        front_desk: 'Trigger fire protocol and direct guests to evacuation routes.',
        security: 'Respond to the affected zone, secure corridors, and support fire service access.',
        housekeeping: 'Sweep nearby rooms and guide guests to safe exits.',
        management: 'Activate the incident command plan and coordinate emergency services.',
      },
      tactical_objectives: buildDefaultObjectives('fire', text),
    }
  }

  if (/(blood|injur|unconscious|choking|heart|medical|ambulance)/.test(text)) {
    return {
      crisis_type: 'medical',
      severity: 'high',
      severity_score: 82,
      call_emergency_services: true,
      emergency_number: '102',
      summary_english: 'Medical assistance appears to be required for a guest or staff member.',
      guest_instruction: 'Please remain calm. Help is being dispatched to your location.',
      staff_instructions: {
        front_desk: 'Call for medical support and keep a clear access path for responders.',
        security: 'Move to the scene quickly and help maintain space for treatment.',
        housekeeping: 'Bring nearby support resources and assist vulnerable guests nearby.',
        management: 'Oversee escalation and ambulance coordination if required.',
      },
      tactical_objectives: buildDefaultObjectives('medical', text),
    }
  }

  if (/(lock|locked|door stuck|jammed|can't open|cannot open|stuck door|key card not working)/.test(text)) {
    return {
      crisis_type: 'security',
      severity: /(trapped|stuck inside|cannot get out|can't get out)/.test(text) ? 'high' : 'medium',
      severity_score: /(trapped|stuck inside|cannot get out|can't get out)/.test(text) ? 72 : 58,
      call_emergency_services: false,
      emergency_number: '112',
      summary_english: 'A guest reported a locked or inaccessible door requiring staff assistance.',
      guest_instruction: 'Please remain calm. Staff are being sent to help you regain safe access.',
      staff_instructions: {
        front_desk: 'Keep contact with the guest and dispatch security or engineering support.',
        security: 'Go to the reported door, verify guest safety, and restore controlled access.',
        housekeeping: 'Stand by in case corridor support or guest assistance is needed.',
        management: 'Monitor resolution time and escalate if the guest may be trapped or vulnerable.',
      },
      tactical_objectives: buildDefaultObjectives('security', 'locked door access issue'),
    }
  }

  if (/(weapon|attack|fight|theft|intrud|violence)/.test(text)) {
    return {
      crisis_type: 'security',
      severity: 'high',
      severity_score: 80,
      call_emergency_services: true,
      emergency_number: '112',
      summary_english: 'A security threat or unauthorized access concern has been reported.',
      guest_instruction: 'Please remain where you are if safe, avoid confrontation, and wait for staff instructions.',
      staff_instructions: {
        front_desk: 'Keep the line open with the guest and dispatch security immediately.',
        security: 'Respond to the reported location, assess the threat, and protect guests nearby.',
        housekeeping: 'Avoid the affected area unless requested for support.',
        management: 'Monitor escalation and contact law enforcement if the threat is active.',
      },
      tactical_objectives: buildDefaultObjectives('security', text),
    }
  }

  if (/(collapse|crack|ceiling|structural)/.test(text)) {
    return {
      crisis_type: 'structural',
      severity: 'high',
      severity_score: 84,
      call_emergency_services: true,
      emergency_number: '112',
      summary_english: 'A structural safety issue has been reported.',
      guest_instruction: 'Please move away from the affected area and wait for staff instructions.',
      staff_instructions: {
        front_desk: 'Lock down access to the reported area and notify engineering leadership.',
        security: 'Secure the perimeter and keep guests away from the affected zone.',
        housekeeping: 'Do not enter the affected area unless specifically requested for support.',
        management: 'Assess escalation to emergency services and alternate guest routing.',
      },
      tactical_objectives: buildDefaultObjectives('structural', text),
    }
  }

  if (/(blackout|power|electric|outage)/.test(text)) {
    return {
      crisis_type: 'power',
      severity: 'medium',
      severity_score: 62,
      call_emergency_services: false,
      emergency_number: '112',
      summary_english: 'A power or electrical service interruption has been reported.',
      guest_instruction: 'Please stay calm and remain where it is safe while staff assess the outage.',
      staff_instructions: {
        front_desk: 'Log the outage and direct guests away from affected systems such as elevators if needed.',
        security: 'Check common areas and elevators for trapped or distressed guests.',
        housekeeping: 'Support guest communication and corridor safety while lighting is assessed.',
        management: 'Coordinate engineering response and broader guest communication.',
      },
      tactical_objectives: buildDefaultObjectives('power', text),
    }
  }

  if (lowerHint === 'security') {
    return {
      crisis_type: 'security',
      severity: 'medium',
      severity_score: 56,
      call_emergency_services: false,
      emergency_number: '112',
      summary_english: 'A guest reported a security-related concern requiring staff follow-up.',
      guest_instruction: 'Please remain calm and wait for hotel staff assistance.',
      staff_instructions: {
        front_desk: 'Keep contact with the guest and dispatch the appropriate response unit.',
        security: 'Assess the reported concern and secure the location if required.',
        housekeeping: 'Stand by for support if guest relocation or corridor assistance is needed.',
        management: 'Monitor escalation and resolution progress.',
      },
      tactical_objectives: buildDefaultObjectives('security', 'security-related guest concern'),
    }
  }

  return {
    crisis_type: lowerHint || 'other',
    severity: lowerHint === 'other' ? 'low' : 'medium',
    severity_score: lowerHint === 'other' ? 28 : 50,
    call_emergency_services: false,
    emergency_number: '112',
    summary_english: 'A guest reported an issue that requires staff assessment.',
    guest_instruction: 'Please remain calm and follow staff instructions.',
    staff_instructions: {
      front_desk: 'Acknowledge the report and route it to the correct operational team.',
      security: 'Assess on scene if guest safety or access control may be affected.',
      housekeeping: 'Assist only if corridor access or guest relocation support is required.',
      management: 'Monitor the issue and escalate if it affects guest safety.',
    },
    tactical_objectives: buildDefaultObjectives(lowerHint || 'other', text),
  }
}

async function classifyWithTimeout(
  incidentText: string,
  language: string,
  hotelName: string,
  hint?: CrisisType | null
): Promise<NormalizedClassification> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort('classification timeout'), CLASSIFY_TIMEOUT_MS)

  try {
    const classifyRes = await fetch(`${BACKEND_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_text: incidentText, language, hotel_name: hotelName }),
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!classifyRes.ok) {
      const errText = await classifyRes.text()
      throw new Error(`AI backend error: ${errText}`)
    }

    const classification = await classifyRes.json()
    const crisisType = normalizeCrisisType(classification.crisis_type)
    const severity = normalizeSeverity(classification.severity)
    const summaryEnglish = String(classification.summary_english || 'Incident reported and classified.')
    return {
      crisis_type: crisisType,
      severity,
      severity_score: normalizeSeverityScore(classification.severity_score, severity),
      confidence: Number(classification.confidence ?? 0.8),
      summary_english: summaryEnglish,
      guest_instruction: String(classification.guest_instruction || 'Please move to a safe area and follow hotel staff instructions.'),
      staff_instructions: normalizeStaffInstructions(classification.staff_instructions),
      tactical_objectives: normalizeTacticalObjectives(classification.tactical_objectives, crisisType, summaryEnglish),
      call_emergency_services: Boolean(classification.call_emergency_services),
      emergency_number: String(classification.emergency_number || '112'),
    }
  } catch (error) {
    console.warn('AI classify timed out/failed, using local fallback:', error)
    const fallback = classifyLocally(incidentText, hint)
    return {
      ...fallback,
      confidence: 0.55,
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function writeRtdbWithTimeout(path: string, data: unknown) {
  const database = getAdminDb()

  return Promise.race([
    database.ref(path).set(data),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`RTDB timeout after ${RTDB_TIMEOUT_MS}ms`)), RTDB_TIMEOUT_MS)),
  ])
}

async function writeFirestoreWithTimeout(id: string, data: Record<string, unknown>) {
  const firestore = getAdminFirestore()

  return Promise.race([
    firestore.collection('incidents').doc(id).set(data),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Firestore timeout after ${FIRESTORE_TIMEOUT_MS}ms`)), FIRESTORE_TIMEOUT_MS)),
  ])
}

export async function POST(req: NextRequest) {
  // 1. Initial Health Check for Firebase Admin
  try {
    getAdminDb()
    getAdminFirestore()
  } catch {
    console.error('API Error: Firebase Admin SDK failed to initialize. Check service account JSON.')
    return NextResponse.json({ 
      error: 'CRITICAL_SYSTEM_ERROR: Database connectivity offline.',
      classification: null 
    }, { status: 503 })
  }

  try {
    const body = await req.json()
    const {
      incident_text,
      raw_text,
      crisis_type,
      language,
      hotel_id,
      hotel_name,
      location_description,
      room_number,
      reporter_uid,
      lat,
      lng,
    } = body

    const normalizedHint = crisis_type ? normalizeCrisisType(crisis_type) : null
    const normalizedText = String(raw_text || incident_text || '').trim()
    const textForClassification = normalizedHint
      ? `Panic type hint: ${normalizedHint}. ${normalizedText}`.trim()
      : normalizedText

    if (!textForClassification) {
      return NextResponse.json({ error: 'raw_text or incident_text is required' }, { status: 400 })
    }

    console.log('Sending to FastAPI:', `${BACKEND_URL}/classify`)
    const normalizedClassification = await classifyWithTimeout(
      normalizedText,
      String(language || 'English'),
      String(hotel_name || 'Unknown Hotel'),
      normalizedHint
    )
    console.log('Classification resolved:', normalizedClassification.crisis_type)

    const incident_id = `incident_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const incidentData = omitUndefined({
        id: incident_id,
        hotel_id: hotel_id || 'default',
        hotel_name: hotel_name || 'Unknown Hotel',
        reported_by: 'guest',
        reporter_uid: String(reporter_uid || 'anonymous'),
        raw_text: normalizedText,
        language: language || 'English',
        location_description: location_description || 'Unknown',
        room_number: room_number ? String(room_number) : undefined,
        lat: lat !== undefined ? Number(lat) : undefined,
        lng: lng !== undefined ? Number(lng) : undefined,
        crisis_type: normalizedClassification.crisis_type,
        severity: normalizedClassification.severity,
        severity_score: normalizedClassification.severity_score,
        status: 'reported',
        gemini_summary: normalizedClassification.summary_english,
        guest_instruction: normalizedClassification.guest_instruction,
        staff_instructions: normalizedClassification.staff_instructions,
        tactical_objectives: normalizedClassification.tactical_objectives,
        call_emergency_services: normalizedClassification.call_emergency_services,
        emergency_number: normalizedClassification.emergency_number,
        confidence: normalizedClassification.confidence,
        photo_urls: [],
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        response_log: [],
      })

    let rtdbWriteOk = false
    let rtdbError = ''

    // Prioritize RTDB broadcast for realtime staff visibility.
    try {
      await writeRtdbWithTimeout(`live_incidents/${incident_id}`, {
        ...omitUndefined(incidentData),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      rtdbWriteOk = true
      console.log('Incident broadcast to RTDB')
    } catch (err) {
      rtdbError = err instanceof Error ? err.message : 'Unknown RTDB write failure'
      console.error('RTDB write failed:', rtdbError)
    }

    let firestoreWriteOk = false
    let firestoreError = ''

    // Persist for audit/history before returning success so failures are visible to clients.
    try {
      await writeFirestoreWithTimeout(incident_id, incidentData)
      firestoreWriteOk = true
      console.log('Incident saved to Firestore (Admin)')
    } catch (err) {
      firestoreError = err instanceof Error ? err.message : 'Unknown Firestore write failure'
      console.error('Firestore write failed:', firestoreError)
    }

    if (!rtdbWriteOk) {
      throw new Error(`RTDB write failed: ${rtdbError || 'Unknown RTDB write failure'}`)
    }

    const writeWarnings = [] as string[]
    if (!firestoreWriteOk) {
      writeWarnings.push('incident_history_persistence_failed')
    }

    return NextResponse.json({
      success: true,
      incident_id,
      classification: normalizedClassification,
      write_status: {
        rtdb: rtdbWriteOk ? 'ok' : 'failed',
        firestore: firestoreWriteOk ? 'ok' : 'failed',
      },
      write_errors: {
        rtdb: rtdbError || null,
        firestore: firestoreError || null,
      },
      warnings: writeWarnings,
    })
  } catch (error: unknown) {
    console.error('Classification Route Error:', error)
    return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Unknown Server Error',
        classification: null
    }, { status: 500 })
  }
}
