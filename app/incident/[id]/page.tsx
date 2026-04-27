'use client'
// app/incident/[id]/page.tsx
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { doc, updateDoc, arrayUnion, serverTimestamp, onSnapshot, addDoc, collection } from 'firebase/firestore'
import { ref, update, remove, get } from 'firebase/database'
import { db, rtdb, auth, storage } from '@/lib/firebase'
import { Incident, ResponseStatus } from '@/lib/types'
import { CrisisMap } from '@/components/CrisisMap'
import { RoleBadge } from '@/components/RoleBadge'
import { useParams, useRouter } from 'next/navigation'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { ThemeToggle } from '@/components/ThemeToggle'
import { toDate } from '@/lib/utils'

const STATUS_FLOW: ResponseStatus[] = ['reported', 'acknowledged', 'responding', 'resolved']

const HOTEL_COORDS: Record<string, { lat: number; lng: number }> = {
  default: { lat: 19.076, lng: 72.877 },
  hotel_001: { lat: 19.076, lng: 72.877 },
}

function buildOperationalChecklist(incident: Incident): string[] {
  const locationLabel = incident.room_number
    ? `room ${incident.room_number}`
    : incident.location_description || 'the reported area'
  const text = `${incident.raw_text} ${incident.gemini_summary}`.toLowerCase()
  const lockIssue = incident.crisis_type === 'security' && /(lock|locked|door|access|key)/.test(text)
  const defaultReported = incident.tactical_objectives?.filter(Boolean).slice(0, 3)

  if (incident.status === 'reported' && defaultReported && defaultReported.length === 3) {
    return defaultReported
  }

  if (lockIssue) {
    const byStatus: Record<ResponseStatus, string[]> = {
      reported: [
        `Confirm whether the guest is locked in or locked out at ${locationLabel}`,
        'Dispatch security or engineering with controlled-access tools',
        'Preserve access-control logs and corridor CCTV for follow-up',
      ],
      acknowledged: [
        `Move the nearest security or engineering unit toward ${locationLabel}`,
        'Keep the guest on comms and verify there is no entrapment or medical risk',
        'Prepare override access or alternate room support if needed',
      ],
      responding: [
        'Restore safe access and verify the guest can enter or exit normally',
        'Check the lock, door frame, and access-control hardware for tampering',
        'Document the resolution outcome and any follow-on security action',
      ],
      resolved: [
        'Confirm normal access control has been restored',
        'Record the final resolution and any hardware issue found',
        'Close the incident after guest follow-up is completed',
      ],
    }

    return byStatus[incident.status]
  }

  const defaults: Record<ResponseStatus, Record<Incident['crisis_type'], string[]>> = {
    reported: {
      fire: [
        `Confirm the fire or smoke source near ${locationLabel}`,
        'Clear guests from the affected area using stairs only',
        'Stage responders and fire-service access immediately',
      ],
      medical: [
        `Confirm the patient condition at ${locationLabel}`,
        'Dispatch the nearest trained responder with first-aid equipment',
        'Prepare ambulance access and crowd control if escalation is required',
      ],
      security: [
        `Verify guest safety at ${locationLabel}`,
        'Dispatch the nearest security unit to assess the threat',
        'Preserve CCTV, witness, and access-control evidence',
      ],
      structural: [
        `Isolate ${locationLabel} and stop nearby guest movement`,
        'Check for collapse risk, debris, or trapped occupants',
        'Escalate to engineering leadership and emergency services if needed',
      ],
      power: [
        `Confirm outage impact around ${locationLabel}`,
        'Dispatch engineering to restore critical systems and trapped-access risks',
        'Protect elevator and corridor safety while updates are issued',
      ],
      other: [
        `Confirm the reported issue at ${locationLabel}`,
        'Stabilize guest safety at the affected location',
        'Route the incident to the correct operational team',
      ],
    },
    acknowledged: {
      fire: [
        'Deploy the nearest fire-response team to the affected zone',
        'Establish stairwell control and guest movement channels',
        'Prepare equipment and fire-service handoff details',
      ],
      medical: [
        'Deploy the nearest trained responder to the patient location',
        'Secure treatment space and maintain guest privacy',
        'Prepare external medical escalation if the patient deteriorates',
      ],
      security: [
        'Deploy the nearest security unit to the scene',
        'Establish controlled communications with front desk and management',
        'Prepare evidence capture and witness coordination',
      ],
      structural: [
        'Deploy engineering and security to assess the hazard perimeter',
        'Establish a safe stand-off distance and reroute guest traffic',
        'Prepare structural escalation and emergency access',
      ],
      power: [
        'Deploy engineering to diagnose the outage scope',
        'Coordinate guest safety checks in dark or stalled-access areas',
        'Prepare backup lighting or contingency systems',
      ],
      other: [
        'Dispatch the relevant response unit to the reported location',
        'Establish field communications and guest-contact continuity',
        'Prepare any tools or support resources required on arrival',
      ],
    },
    responding: {
      fire: [
        'Secure the immediate perimeter and keep guests clear of the hazard',
        'Complete evacuation support and suppress the primary fire source if safe',
        'Maintain continuous SITREP updates until fire services assume control',
      ],
      medical: [
        'Support treatment at scene and protect responder access',
        'Stabilize the guest until handoff or recovery is confirmed',
        'Maintain continuous SITREP updates for management',
      ],
      security: [
        'Secure the immediate perimeter and protect nearby guests',
        'Resolve the primary threat or access-control problem',
        'Maintain continuous SITREP updates and preserve evidence',
      ],
      structural: [
        'Keep the hazard perimeter secure and prevent re-entry',
        'Assess and control the primary structural risk',
        'Maintain continuous SITREP updates for engineering leadership',
      ],
      power: [
        'Protect impacted guests and unsafe dark-access zones',
        'Resolve the primary outage or isolated electrical issue',
        'Maintain continuous SITREP updates until service stabilizes',
      ],
      other: [
        'Secure the immediate area and stabilize guest impact',
        'Address the primary issue with the assigned response team',
        'Maintain continuous SITREP updates until the situation is controlled',
      ],
    },
    resolved: {
      fire: [
        'Conduct a final fire-safety and re-entry sweep',
        'Complete the incident report and responder handoff notes',
        'Release field units once the area is safe and documented',
      ],
      medical: [
        'Confirm final patient disposition and area recovery',
        'Complete the incident report and treatment timeline',
        'Release responders once follow-up actions are assigned',
      ],
      security: [
        'Confirm the scene is safe and guest access is restored',
        'Complete the incident report and evidence notes',
        'Release responders once all follow-up tasks are assigned',
      ],
      structural: [
        'Confirm the area remains isolated or approved for controlled re-entry',
        'Complete the incident report and engineering findings',
        'Release responders once site safety ownership is transferred',
      ],
      power: [
        'Confirm critical systems and guest access have normalized',
        'Complete the incident report and restoration timeline',
        'Release responders once monitoring ownership is transferred',
      ],
      other: [
        'Confirm the issue is fully stabilized and guest impact is closed',
        'Complete the incident report and final resolution notes',
        'Release responders once follow-up ownership is assigned',
      ],
    },
  }

  return defaults[incident.status][incident.crisis_type]
}

function toIncident(id: string, raw: Record<string, unknown>): Incident {
  const staffInstructions = (raw.staff_instructions as Record<string, unknown> | undefined) || {}
  return {
    id,
    hotel_id: String(raw.hotel_id || 'default'),
    hotel_name: String(raw.hotel_name || 'Unknown Hotel'),
    reported_by: (raw.reported_by as Incident['reported_by']) || 'guest',
    reporter_uid: String(raw.reporter_uid || 'anonymous'),
    raw_text: String(raw.raw_text || ''),
    language: String(raw.language || 'English'),
    location_description: String(raw.location_description || 'Unknown'),
    crisis_type: (raw.crisis_type as Incident['crisis_type']) || 'other',
    severity: (raw.severity as Incident['severity']) || 'medium',
    status: (raw.status as Incident['status']) || 'reported',
    gemini_summary: String(raw.gemini_summary || ''),
    guest_instruction: String(raw.guest_instruction || ''),
    staff_instructions: {
      front_desk: String(staffInstructions.front_desk || ''),
      security: String(staffInstructions.security || ''),
      housekeeping: String(staffInstructions.housekeeping || ''),
      management: String(staffInstructions.management || ''),
    },
    tactical_objectives: Array.isArray(raw.tactical_objectives)
      ? raw.tactical_objectives.map((item) => String(item)).filter((item) => item.length > 0)
      : undefined,
    call_emergency_services: Boolean(raw.call_emergency_services),
    emergency_number: raw.emergency_number ? String(raw.emergency_number) : undefined,
    confidence: Number(raw.confidence ?? 0),
    severity_score: raw.severity_score !== undefined ? Number(raw.severity_score) : undefined,
    photo_urls: Array.isArray(raw.photo_urls) ? (raw.photo_urls as string[]) : [],
    created_at: (raw.created_at as Incident['created_at']) || new Date().toISOString(),
    updated_at: (raw.updated_at as Incident['updated_at']) || new Date().toISOString(),
    resolved_at: raw.resolved_at as Incident['resolved_at'],
    response_log: Array.isArray(raw.response_log) ? (raw.response_log as Incident['response_log']) : [],
    floor_number: raw.floor_number as number | undefined,
    room_number: raw.room_number as string | undefined,
    lat: raw.lat !== undefined ? Number(raw.lat) : undefined,
    lng: raw.lng !== undefined ? Number(raw.lng) : undefined,
  }
}

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [updateText, setUpdateText] = useState('')
  const [postingUpdate, setPostingUpdate] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [broadcastLanguage] = useState('All languages')
  const [broadcastFloors, setBroadcastFloors] = useState('')
  const [broadcastRooms, setBroadcastRooms] = useState('')
  const [broadcastMode, setBroadcastMode] = useState<'all' | 'floors' | 'rooms'>('all')
  const [sendingBroadcast, setSendingBroadcast] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showIssueModal, setShowIssueModal] = useState(false)
  const [issueText, setIssueText] = useState('')
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolveSummary, setResolveSummary] = useState('')
  const [resolveOutcome, setResolveOutcome] = useState('successful')

  useEffect(() => {
    if (!id) return

    const unsubscribe = onSnapshot(doc(db, 'incidents', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Record<string, unknown>
        const mappedIncident = toIncident(docSnap.id, data)
        setIncident(mappedIncident)
        setBroadcastMessage((previous) => previous || mappedIncident.guest_instruction || mappedIncident.gemini_summary)
        setLoading(false)
      } else {
        get(ref(rtdb, `live_incidents/${id}`)).then(liveSnap => {
          if (liveSnap.exists()) {
            const liveData = liveSnap.val() as Record<string, unknown>
            setIncident(toIncident(id, liveData))
          }
          setLoading(false)
        })
      }
    })

    return () => unsubscribe()
  }, [id])

  const updateStatus = async (newStatus: ResponseStatus, actionLabel?: string) => {
    if (!incident || !id) return
    setUpdating(true)
    const logEntry = {
      staff_uid: auth.currentUser?.uid || 'unknown',
      staff_name: auth.currentUser?.email || 'Staff',
      action: actionLabel || `Status changed to ${newStatus.toUpperCase()}`,
      timestamp: new Date().toISOString(),
    }

    try {
      await updateDoc(doc(db, 'incidents', id), {
        status: newStatus,
        updated_at: serverTimestamp(),
        response_log: arrayUnion(logEntry),
        ...(newStatus === 'resolved' ? { resolved_at: serverTimestamp() } : {}),
      })

      await addDoc(collection(db, 'logs'), {
        ...logEntry,
        incidentId: id,
        incidentType: incident.crisis_type,
        severity: incident.severity,
        hotelId: incident.hotel_id,
        status: newStatus,
        type: 'status_change'
      })

      if (newStatus === 'resolved') {
        await remove(ref(rtdb, `live_incidents/${id}`))
      } else {
        await update(ref(rtdb, `live_incidents/${id}`), { status: newStatus })
      }
    } finally {
      setUpdating(false)
    }
  }

  const postUpdate = async () => {
    if (!incident || !id || !updateText.trim()) return
    setPostingUpdate(true)
    const logEntry = {
      staff_uid: auth.currentUser?.uid || 'unknown',
      staff_name: auth.currentUser?.email || 'Staff',
      action: updateText.trim(),
      timestamp: new Date().toISOString(),
    }

    try {
      await updateDoc(doc(db, 'incidents', id), {
        updated_at: serverTimestamp(),
        response_log: arrayUnion(logEntry),
      })

      await addDoc(collection(db, 'logs'), {
        ...logEntry,
        incidentId: id,
        incidentType: incident.crisis_type,
        severity: incident.severity,
        hotelId: incident.hotel_id,
        status: incident.status,
        type: 'field_update'
      })

      setUpdateText('')
    } finally {
      setPostingUpdate(false)
    }
  }

  const sendBroadcast = async () => {
    if (!incident || !broadcastMessage.trim()) return
    setSendingBroadcast(true)
    try {
      const floors = broadcastMode === 'floors' ? broadcastFloors.split(',').map(f => Number(f.trim())).filter(f => !isNaN(f)) : []
      const rooms = broadcastMode === 'rooms' ? broadcastRooms.split(',').map(r => r.trim()).filter(r => r.length > 0) : []
      
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incident.id,
          message: broadcastMessage.trim(),
          language: broadcastLanguage,
          target: { mode: broadcastMode, floors, rooms },
          sent_by: auth.currentUser?.email || auth.currentUser?.uid || 'staff',
        }),
      })

      if (!response.ok) throw new Error('Broadcast failed')

      const targetDesc = broadcastMode === 'all' ? 'all guests' : broadcastMode === 'floors' ? `floors ${floors.join(', ')}` : `rooms ${rooms.join(', ')}`
      const logEntry = {
        staff_uid: auth.currentUser?.uid || 'unknown',
        staff_name: auth.currentUser?.email || 'Staff',
        action: `Broadcast sent (${targetDesc}): ${broadcastMessage.trim()}`,
        timestamp: new Date().toISOString(),
      }

      await updateDoc(doc(db, 'incidents', incident.id), {
        updated_at: serverTimestamp(),
        response_log: arrayUnion(logEntry),
      })

      await addDoc(collection(db, 'logs'), {
        ...logEntry,
        incidentId: incident.id,
        incidentType: incident.crisis_type,
        severity: incident.severity,
        hotelId: incident.hotel_id,
        status: incident.status,
        type: 'broadcast'
      })

      setBroadcastOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setSendingBroadcast(false)
    }
  }

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !incident) return
    try {
      const photoPath = `incidents/${incident.id}/photos/${Date.now()}_${file.name}`
      const photoRef = storageRef(storage, photoPath)
      await uploadBytes(photoRef, file)
      const photoUrl = await getDownloadURL(photoRef)
      const logEntry = {
        staff_uid: auth.currentUser?.uid || 'unknown',
        staff_name: auth.currentUser?.email || 'Staff',
        action: 'Uploaded photo evidence',
        timestamp: new Date().toISOString(),
      }
      await updateDoc(doc(db, 'incidents', incident.id), {
        updated_at: serverTimestamp(),
        photo_urls: arrayUnion(photoUrl),
        response_log: arrayUnion(logEntry),
      })
    } finally {
      event.target.value = ''
    }
  }

  const handleIssueReport = async () => {
    if (!issueText.trim()) return
    await updateStatus(incident?.status || 'reported', `ISSUE_REPORTED: ${issueText.trim()}`)
    setShowIssueModal(false)
    setIssueText('')
  }

  const handleResolveMission = async () => {
    if (!resolveSummary.trim()) return
    await updateStatus('resolved', `MISSION_RESOLVED [${resolveOutcome.toUpperCase()}]: ${resolveSummary.trim()}`)
    setShowResolveModal(false)
    setResolveSummary('')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--text-muted)] font-mono text-xs tracking-widest animate-pulse">
      ESTABLISHING SECURE CONNECTION...
    </div>
  )

  if (!incident) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--critical)] font-mono p-6 text-center">
      [!] ERROR: MISSION_FILE_RESTRICTED
    </div>
  )

  const hotelCoords = HOTEL_COORDS[incident.hotel_id] || HOTEL_COORDS.default
  const coords = { lat: incident.lat ?? hotelCoords.lat, lng: incident.lng ?? hotelCoords.lng }
  const currentStatusIdx = STATUS_FLOW.indexOf(incident.status)
  const operationalChecklist = buildOperationalChecklist(incident)

  return (
    <div className="min-h-[100dvh] bg-[var(--bg-base)] flex flex-col font-[var(--font-body)] text-[var(--text-primary)] w-full overflow-hidden">
      {/* Native Sticky Header */}
      <header className="sticky top-0 z-[100] bg-[var(--bg-base)]/80 backdrop-blur-3xl border-b border-[var(--outline-variant)] w-full pt-[var(--safe-top)]">
        <div className="h-20 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-high)] active:scale-90 transition-transform"
            >
              <span className="material-icons-round text-2xl">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <span className="mono-display text-[0.6rem] text-[var(--text-muted)] font-black tracking-widest uppercase mb-0.5">
                Incident_0{incident.id.slice(0,4)}
              </span>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none">
                {incident.crisis_type}
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content - Edge to Edge */}
      <main className="flex-1 w-full overflow-y-auto no-scrollbar pb-40">
        
        {/* Real-time Status Tracker */}
        <div className="w-full px-6 py-8 flex items-center justify-between relative bg-[var(--surface-high)]/10">
          <div className="absolute top-1/2 left-10 right-10 h-[2px] bg-[var(--outline-variant)] -translate-y-1/2 z-0" />
          <div className="absolute top-1/2 left-10 h-[2px] bg-[var(--accent)] -translate-y-1/2 z-0 transition-all duration-700 ease-out" 
               style={{ width: `${(currentStatusIdx / (STATUS_FLOW.length - 1)) * 80}%` }} />
          
          {STATUS_FLOW.map((status, idx) => {
            const isActive = idx <= currentStatusIdx
            const isCurrent = idx === currentStatusIdx
            return (
              <div key={status} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                  isCurrent ? 'bg-[var(--accent)] text-black scale-125 shadow-[0_0_20px_var(--accent)]' :
                  isActive ? 'bg-[var(--accent-muted)] text-[var(--accent)]' :
                  'bg-[var(--surface-high)] text-[var(--text-muted)] border border-[var(--outline-variant)]'
                }`}>
                  {isCurrent ? <span className="material-icons-round text-sm">my_location</span> : idx + 1}
                </div>
                <span className={`text-[0.6rem] font-black uppercase tracking-tighter ${
                  isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                }`}>
                  {status}
                </span>
              </div>
            )
          })}
        </div>

        {/* Tactical Intel Map */}
        <div className="w-full h-[400px] border-b border-[var(--outline-variant)] relative overflow-hidden group">
          <CrisisMap
            lat={coords.lat}
            lng={coords.lng}
            title={`${incident.crisis_type}`}
            severity={incident.severity}
            locationDescription={incident.location_description}
          />
          
          {/* Emergency Alert Overlay - Moved here to prevent map overlap */}
          {incident.call_emergency_services && (
            <div className="absolute top-4 left-4 z-[1000] p-4 bg-red-600 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 animate-pulse">
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                 <span className="material-icons-round text-red-600">emergency</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[0.6rem] font-black uppercase text-white/80 tracking-widest leading-none mb-1">Emergency Required</span>
                  <span className="text-lg font-black text-white leading-none">CALL {incident.emergency_number || '112'}</span>
               </div>
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-20">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 text-white shadow-2xl active:scale-95 transition-transform"
            >
              <span className="material-icons-round text-lg text-[var(--accent)]">near_me</span>
              <span className="mono-display text-[0.6rem] font-black tracking-widest uppercase text-white">Navigate</span>
            </a>
          </div>
        </div>

        {/* Content Body - No Cards, just Sections */}
        <div className="w-full">
          
          {/* Severity & Summary Section */}
          <section className={`px-6 py-10 ${
            incident.severity === 'critical' ? 'bg-red-500/5' : incident.severity === 'high' ? 'bg-orange-500/5' : 'bg-blue-500/5'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${
                   incident.severity === 'critical' ? 'bg-red-500 animate-ping' : 'bg-[var(--accent)]'
                 }`} />
                 <span className={`mono-display text-[0.7rem] font-black tracking-[0.2em] uppercase ${
                   incident.severity === 'critical' ? 'text-red-500' : 'text-[var(--text-muted)]'
                 }`}>
                   Priority_Level_{incident.severity.toUpperCase()}
                 </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="mono-display text-[0.65rem] font-black text-[var(--accent)]">
                  SCORE: {incident.severity_score ?? Math.round(incident.confidence * 100)}/100
                </span>
                <span className="mono-display text-[0.65rem] font-black text-[var(--text-muted)] opacity-50">
                  INIT_TIME: {toDate(incident.created_at).toLocaleTimeString([], { hour12: false })}
                </span>
              </div>
            </div>

            <h2 className="text-3xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
              {incident.location_description}
            </h2>

            <div className="p-6 bg-[var(--surface-high)]/30 rounded-[32px] border border-[var(--outline-variant)]/50 mb-10">
               <p className="text-[1.1rem] font-bold text-[var(--text-primary)] leading-tight">
                 {incident.gemini_summary}
               </p>
            </div>

            {/* Combined Checklist & Directives into the same background flow */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-[2px] w-8 bg-[var(--accent)]" />
              <h3 className="mono-display text-[0.7rem] font-black text-[var(--text-muted)] tracking-[0.2em] uppercase">Tactical_Objectives</h3>
            </div>
            
            <div className="flex flex-col gap-4 mb-10">
              {operationalChecklist.map((task, idx) => (
                <div key={idx} className="flex items-start gap-4 p-5 bg-[var(--surface-high)]/20 rounded-3xl border border-[var(--outline-variant)]/30 group active:bg-[var(--accent-muted)] transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-[var(--bg-base)] flex items-center justify-center border border-[var(--outline-variant)] shrink-0">
                    <span className="material-icons-round text-[0.65rem] text-[var(--accent)]">check</span>
                  </div>
                  <span className="text-[0.95rem] font-bold text-[var(--text-secondary)] leading-tight">{task}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="h-[2px] w-8 bg-[var(--accent)]" />
              <h3 className="mono-display text-[0.7rem] font-black text-[var(--text-muted)] tracking-[0.2em] uppercase">Field_Directives</h3>
            </div>
            
            <div className="flex flex-col gap-6">
               <div className="p-6 bg-white dark:bg-black rounded-[32px] shadow-sm border border-[var(--outline-variant)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons-round text-sm text-[var(--accent)]">record_voice_over</span>
                    <span className="text-[0.6rem] font-black uppercase text-[var(--accent)] tracking-widest">GUEST_PROTOCOL ({incident.language})</span>
                  </div>
                  <p className="text-[1.2rem] font-bold leading-tight">&quot;{incident.guest_instruction}&quot;</p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {Object.entries(incident.staff_instructions || {}).map(([role, text]) => text && (
                    <div key={role} className="p-5 bg-[var(--surface-high)]/50 rounded-3xl border border-[var(--outline-variant)]/30 flex gap-4 items-start">
                       <RoleBadge role={role} />
                       <p className="text-[0.9rem] font-semibold text-[var(--text-secondary)] leading-snug">{text}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* OPERATIONAL TRAY - Integrated into same section to avoid gaps */}
            <div className="mt-12 pt-12 border-t border-[var(--outline-variant)]/30">

            <div className="max-w-md mx-auto flex flex-col gap-6">
               <div className="flex items-center gap-3 mb-2">
                 <div className="h-[2px] w-8 bg-[var(--accent)]" />
                 <h3 className="mono-display text-[0.7rem] font-black text-[var(--text-muted)] tracking-[0.2em] uppercase">Field_Operations</h3>
               </div>

               {/* Secondary Actions Bar */}
               {incident.status !== 'resolved' && (
                 <div className="flex gap-3">
                    <button onClick={() => setBroadcastOpen(true)} className="flex-1 h-14 rounded-2xl bg-[var(--surface-high)] border border-[var(--outline-variant)] flex items-center justify-center gap-2 active:scale-95 transition-all">
                       <span className="material-icons-round text-xl text-[var(--accent)]">campaign</span>
                       <span className="text-[0.65rem] font-black uppercase tracking-widest">Broadcast</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 h-14 rounded-2xl bg-[var(--surface-high)] border border-[var(--outline-variant)] flex items-center justify-center gap-2 active:scale-95 transition-all">
                       <span className="material-icons-round text-xl text-[var(--text-secondary)]">camera_alt</span>
                       <span className="text-[0.65rem] font-black uppercase tracking-widest">Upload Intel</span>
                    </button>
                    <button onClick={() => setShowIssueModal(true)} className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-600/30 flex items-center justify-center active:scale-95 transition-all">
                       <span className="material-icons-round text-xl text-red-500">warning</span>
                    </button>
                 </div>
               )}

               {/* SITREP INPUT */}
               {incident.status !== 'resolved' && (
                 <div className="relative">
                    <input 
                      className="w-full h-14 pl-6 pr-14 bg-[var(--surface-high)]/60 border border-[var(--outline-variant)] rounded-2xl text-[1rem] font-bold placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)] transition-all"
                      placeholder="Transmit SITREP update..."
                      value={updateText}
                      onChange={(e) => setUpdateText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && postUpdate()}
                    />
                    <button 
                      onClick={postUpdate}
                      disabled={postingUpdate || !updateText.trim()}
                      className="absolute right-2.5 top-2.5 w-9 h-9 flex items-center justify-center bg-[var(--accent)] text-black rounded-xl active:scale-90 transition-all disabled:opacity-30 shadow-lg"
                    >
                      <span className="material-icons-round text-xl">send</span>
                    </button>
                 </div>
               )}

               {/* MAIN ACTION BUTTON */}
               <div className="w-full">
                  {incident.status === 'resolved' ? (
                    <button 
                      onClick={() => router.push('/dashboard')}
                      className="w-full h-16 rounded-2xl bg-green-500 text-black flex items-center justify-center gap-4 text-sm font-black uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all"
                    >
                       <span className="material-icons-round text-2xl">check_circle</span>
                       <span>Mission Completed</span>
                    </button>
                  ) : (
                    <button 
                      disabled={updating}
                      onClick={() => {
                        if (incident.status === 'reported') updateStatus('acknowledged', 'Mission acknowledged by field unit')
                        else if (incident.status === 'acknowledged') updateStatus('responding', 'Unit deployed and responding to site')
                        else if (incident.status === 'responding') setShowResolveModal(true)
                      }}
                      className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 text-base font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-xl relative overflow-hidden ${
                        incident.status === 'reported' ? 'bg-[var(--accent)] text-black' :
                        incident.status === 'acknowledged' ? 'bg-blue-600 text-white' :
                        'bg-green-600 text-white'
                      }`}
                    >
                       {updating && (
                         <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm z-20">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                         </div>
                       )}
                       <span className="relative z-10">
                          {incident.status === 'reported' ? 'Acknowledge' : 
                           incident.status === 'acknowledged' ? 'Confirm Deployment' : 
                           'Complete Mission'}
                       </span>
                    </button>
                  )}
               </div>
            </div>

           </div>
         </section>
       </div>

      </main>

      {/* Hidden File Input */}
      <input type="file" ref={fileInputRef} onChange={uploadPhoto} className="hidden" accept="image/*" />

      {/* MODALS - NATIVE FULL-SCREEN BOTTOM SHEETS */}
      
      {/* Resolve Mission Sheet */}
      {showResolveModal && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-md flex items-end justify-center">
           <div className="w-full max-w-lg bg-[var(--bg-base)] rounded-t-[48px] border-t border-[var(--outline-variant)] shadow-2xl animate-slide-up">
              <div className="p-8 pb-[calc(2rem+var(--safe-bottom))]">
                 <div className="w-12 h-1.5 bg-[var(--outline-variant)] rounded-full mx-auto mb-8" onClick={() => setShowResolveModal(false)} />
                 <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Mission_Summary</h3>
                 <p className="mono-display text-[0.7rem] text-[var(--text-muted)] tracking-widest uppercase mb-8">COMPLETING_OPERATION_CYCLE</p>
                 
                 <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                       <label className="mono-display text-[0.6rem] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Outcome_Status</label>
                       <div className="flex gap-2">
                          {['successful', 'partially_resolved', 'referred'].map(o => (
                            <button 
                              key={o} 
                              onClick={() => setResolveOutcome(o)}
                              className={`flex-1 h-12 rounded-xl border mono-display text-[0.6rem] font-black uppercase tracking-widest transition-all ${
                                resolveOutcome === o ? 'bg-[var(--accent)] border-[var(--accent)] text-black' : 'bg-[var(--surface-high)] border-[var(--outline-variant)] text-[var(--text-muted)]'
                              }`}
                            >
                              {o.replace('_', ' ')}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       <label className="mono-display text-[0.6rem] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Final_SITREP_Report</label>
                       <textarea 
                          className="w-full h-40 p-6 bg-[var(--surface-high)] border border-[var(--outline-variant)] rounded-[32px] text-lg font-bold placeholder:text-[var(--text-muted)]/30 focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
                          placeholder="Detail the mission resolution..."
                          value={resolveSummary}
                          onChange={(e) => setResolveSummary(e.target.value)}
                       />
                    </div>

                    <button 
                      onClick={handleResolveMission}
                      disabled={!resolveSummary.trim()}
                      className="w-full h-16 bg-green-500 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_15px_40px_rgba(34,197,94,0.4)] active:scale-95 transition-all disabled:opacity-30"
                    >
                       Submit Mission Log
                    </button>
                    
                    <button 
                      onClick={() => setShowResolveModal(false)}
                      className="w-full h-14 bg-transparent text-[var(--text-muted)] font-black uppercase tracking-widest text-[0.7rem]"
                    >
                       Return to Field
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Broadcast Sheet */}
      {broadcastOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-md flex items-end justify-center">
           <div className="w-full max-w-lg bg-[var(--bg-base)] rounded-t-[48px] border-t border-[var(--outline-variant)] shadow-2xl animate-slide-up">
              <div className="p-8 pb-[calc(2rem+var(--safe-bottom))]">
                 <div className="w-12 h-1.5 bg-[var(--outline-variant)] rounded-full mx-auto mb-8" onClick={() => setBroadcastOpen(false)} />
                 <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">Broadcast_Center</h3>
                 <p className="mono-display text-[0.7rem] text-[var(--text-muted)] tracking-widest uppercase mb-8">DIRECT_TO_GUEST_TRANSMISSION</p>

                 <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                       <label className="mono-display text-[0.6rem] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Transmission_Target</label>
                       <div className="flex gap-2">
                          {(['all', 'floors', 'rooms'] as const).map(m => (
                            <button 
                              key={m} 
                              onClick={() => setBroadcastMode(m)}
                              className={`flex-1 h-12 rounded-xl border mono-display text-[0.6rem] font-black uppercase tracking-widest transition-all ${
                                broadcastMode === m ? 'bg-[var(--accent)] border-[var(--accent)] text-black' : 'bg-[var(--surface-high)] border-[var(--outline-variant)] text-[var(--text-muted)]'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                       </div>
                    </div>

                    {broadcastMode !== 'all' && (
                      <input 
                        className="w-full h-14 px-6 bg-[var(--surface-high)] border border-[var(--outline-variant)] rounded-2xl font-bold"
                        placeholder={broadcastMode === 'floors' ? "e.g. 1, 4, 12" : "e.g. 101, 204, 310"}
                        value={broadcastMode === 'floors' ? broadcastFloors : broadcastRooms}
                        onChange={(e) => broadcastMode === 'floors' ? setBroadcastFloors(e.target.value) : setBroadcastRooms(e.target.value)}
                      />
                    )}

                    <div className="flex flex-col gap-2">
                       <label className="mono-display text-[0.6rem] font-black text-[var(--text-muted)] uppercase tracking-widest ml-4">Message_Data</label>
                       <textarea 
                          className="w-full h-32 p-6 bg-[var(--surface-high)] border border-[var(--outline-variant)] rounded-[32px] text-lg font-bold focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
                          value={broadcastMessage}
                          onChange={(e) => setBroadcastMessage(e.target.value)}
                       />
                    </div>

                    <button 
                      onClick={sendBroadcast}
                      disabled={sendingBroadcast || !broadcastMessage.trim()}
                      className="w-full h-16 bg-[var(--accent)] text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_15px_40px_rgba(255,153,51,0.4)] active:scale-95 transition-all"
                    >
                       {sendingBroadcast ? 'TRANSMITTING...' : 'Engage Broadcast'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-md flex items-center justify-center p-6">
           <div className="w-full max-w-sm bg-[var(--bg-base)] rounded-[40px] border border-red-500/30 p-8 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center mb-6 mx-auto">
                 <span className="material-icons-round text-3xl text-red-500">priority_high</span>
              </div>
              <h3 className="text-2xl font-black text-center uppercase tracking-tight mb-2">Report_Issue</h3>
              <p className="text-[0.7rem] font-black text-center text-[var(--text-muted)] tracking-widest mb-8">ESCALATE_TO_COMMAND</p>

              <textarea 
                 className="w-full h-32 p-5 bg-[var(--surface-high)] border border-[var(--outline-variant)] rounded-2xl font-bold mb-6 focus:border-red-500/50 focus:outline-none"
                 placeholder="Describe the complication..."
                 value={issueText}
                 onChange={(e) => setIssueText(e.target.value)}
              />

              <div className="flex flex-col gap-3">
                 <button 
                   onClick={handleIssueReport}
                   className="w-full h-14 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95"
                 >
                   Transmit Warning
                 </button>
                 <button 
                   onClick={() => setShowIssueModal(false)}
                   className="w-full h-12 bg-transparent text-[var(--text-muted)] font-black uppercase tracking-widest text-[0.6rem]"
                 >
                   Cancel
                 </button>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  )
}
