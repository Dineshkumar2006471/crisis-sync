import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminFirestore } from '@/lib/firebase-admin'
import * as admin from 'firebase-admin'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'
const CLASSIFY_TIMEOUT_MS = 6500
const RTDB_TIMEOUT_MS = 2500
const FIRESTORE_TIMEOUT_MS = 3500

type CrisisType = 'fire' | 'medical' | 'security' | 'structural' | 'power' | 'other'
type Severity = 'critical' | 'high' | 'medium' | 'low'

type NormalizedClassification = {
  crisis_type: CrisisType
  severity: Severity
  confidence: number
  summary_english: string
  guest_instruction: string
  staff_instructions: {
    front_desk: string
    security: string
    housekeeping: string
    management: string
  }
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

function classifyLocally(incidentText: string): Pick<NormalizedClassification, 'crisis_type' | 'severity' | 'call_emergency_services' | 'emergency_number'> {
  const text = incidentText.toLowerCase()

  if (/(fire|smoke|burn|flame|alarm)/.test(text)) {
    return { crisis_type: 'fire', severity: 'critical', call_emergency_services: true, emergency_number: '101' }
  }

  if (/(blood|injur|unconscious|choking|heart|medical|ambulance)/.test(text)) {
    return { crisis_type: 'medical', severity: 'high', call_emergency_services: true, emergency_number: '102' }
  }

  if (/(weapon|attack|fight|theft|intrud|security|violence)/.test(text)) {
    return { crisis_type: 'security', severity: 'high', call_emergency_services: true, emergency_number: '112' }
  }

  if (/(collapse|crack|ceiling|structural)/.test(text)) {
    return { crisis_type: 'structural', severity: 'high', call_emergency_services: true, emergency_number: '112' }
  }

  if (/(blackout|power|electric|outage)/.test(text)) {
    return { crisis_type: 'power', severity: 'medium', call_emergency_services: false, emergency_number: '112' }
  }

  return { crisis_type: 'other', severity: 'medium', call_emergency_services: false, emergency_number: '112' }
}

async function classifyWithTimeout(incident_text: string, language: string, hotel_name: string): Promise<NormalizedClassification> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort('classification timeout'), CLASSIFY_TIMEOUT_MS)

  try {
    const classifyRes = await fetch(`${BACKEND_URL}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_text, language, hotel_name }),
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!classifyRes.ok) {
      const errText = await classifyRes.text()
      throw new Error(`AI backend error: ${errText}`)
    }

    const classification = await classifyRes.json()
    return {
      crisis_type: normalizeCrisisType(classification.crisis_type),
      severity: normalizeSeverity(classification.severity),
      confidence: Number(classification.confidence ?? 0.8),
      summary_english: String(classification.summary_english || 'Incident reported and classified.'),
      guest_instruction: String(classification.guest_instruction || 'Please move to a safe area and follow hotel staff instructions.'),
      staff_instructions: normalizeStaffInstructions(classification.staff_instructions),
      call_emergency_services: Boolean(classification.call_emergency_services),
      emergency_number: String(classification.emergency_number || '112'),
    }
  } catch (error) {
    console.warn('AI classify timed out/failed, using local fallback:', error)
    const fallback = classifyLocally(incident_text)
    return {
      ...fallback,
      confidence: 0.55,
      summary_english: 'Fast local fallback classification used while AI response was delayed.',
      guest_instruction: 'Please remain calm, move to a safe area immediately, and follow staff instructions.',
      staff_instructions: {
        front_desk: 'Acknowledge report and alert relevant response teams immediately.',
        security: 'Secure incident area and guide guests away from hazards.',
        housekeeping: 'Assist evacuation routes and support vulnerable guests.',
        management: 'Coordinate escalation and contact emergency services if needed.',
      },
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
      textForClassification,
      String(language || 'English'),
      String(hotel_name || 'Unknown Hotel')
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
        status: 'reported',
        gemini_summary: normalizedClassification.summary_english,
        guest_instruction: normalizedClassification.guest_instruction,
        staff_instructions: normalizedClassification.staff_instructions,
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
