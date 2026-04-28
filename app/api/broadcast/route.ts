import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, getAdminFirestore } from '@/lib/firebase-admin'
import * as admin from 'firebase-admin'
import { logServerTacticalEvent } from '@/lib/audit-server'

type BroadcastTarget = {
  mode: 'all' | 'floors' | 'rooms'
  floors: number[]
  rooms: string[]
}

export async function POST(req: NextRequest) {
  let adminDb
  let adminFirestore
  try {
    adminDb = getAdminDb()
    adminFirestore = getAdminFirestore()
  } catch {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
  }

  try {
    const body = await req.json()
    const incidentId = String(body.incident_id || '').trim()
    const message = String(body.message || '').trim()
    const language = String(body.language || 'All languages')
    const sentBy = String(body.sent_by || 'staff')
    const target = (body.target || { mode: 'all', floors: [], rooms: [] }) as BroadcastTarget

    if (!incidentId || !message) {
      return NextResponse.json({ error: 'incident_id and message are required' }, { status: 400 })
    }

    const broadcastPayload = {
      incident_id: incidentId,
      message,
      language,
      target: {
        mode: (['all', 'floors', 'rooms'].includes(target.mode)) ? target.mode : 'all',
        floors: Array.isArray(target.floors)
          ? target.floors.filter((value) => Number.isFinite(value)).map((value) => Number(value))
          : [],
        rooms: Array.isArray(target.rooms)
          ? target.rooms.map(r => String(r).trim()).filter(r => r.length > 0)
          : [],
      },
      sent_by: sentBy,
      sent_at: new Date().toISOString(),
    }

    await adminFirestore
      .collection('incidents')
      .doc(incidentId)
      .collection('guest_broadcasts')
      .add({
        ...broadcastPayload,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      })

    await adminDb.ref(`live_incidents/${incidentId}/guest_broadcast`).set(broadcastPayload)

    // Server-side Audit Logging
    try {
      const incidentDoc = await adminFirestore.collection('incidents').doc(incidentId).get()
      if (incidentDoc.exists) {
        const incidentData = incidentDoc.data()
        await logServerTacticalEvent(
          { id: incidentId, ...incidentData },
          'BROADCAST_SENT',
          `Server-initiated broadcast: ${message}`,
          { uid: 'system', email: sentBy }
        )
      }
    } catch (logError) {
      console.error('Failed to log broadcast event:', logError)
    }

    return NextResponse.json({ success: true, broadcast: broadcastPayload })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Broadcast failed' },
      { status: 500 }
    )
  }
}
