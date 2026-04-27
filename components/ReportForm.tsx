'use client'

import { useEffect, useRef, useState } from 'react'
import { auth } from '@/lib/firebase'
import { GeminiClassifyResponse } from '@/lib/types'

const E2E_BYPASS_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true'
const REPORT_REQUEST_TIMEOUT_MS = 95000

interface ReportFormProps {
  hotelId?: string
  hotelName?: string
  onSuccess?: (incidentId: string) => void
}

type PanicType = 'fire' | 'medical' | 'security' | 'other'

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

const PANIC_BUTTONS: { type: PanicType; icon: string; label: string; colorClass: string }[] = [
  { type: 'fire', icon: 'local_fire_department', label: 'Fire', colorClass: 'text-red-400 border-red-500/40 bg-red-500/10' },
  { type: 'medical', icon: 'medical_services', label: 'Medical', colorClass: 'text-orange-300 border-orange-400/40 bg-orange-500/10' },
  { type: 'security', icon: 'gpp_maybe', label: 'Security', colorClass: 'text-amber-300 border-amber-400/40 bg-amber-500/10' },
  { type: 'other', icon: 'warning', label: 'Other', colorClass: 'text-blue-300 border-blue-400/40 bg-blue-500/10' },
]

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }

  return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null
}

export function ReportForm({
  hotelId = 'hotel_001',
  hotelName = 'The Grand Meridian',
  onSuccess,
}: ReportFormProps) {
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [language, setLanguage] = useState('English')
  const [panicType, setPanicType] = useState<PanicType | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeminiClassifyResponse | null>(null)
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [allowReportAnother, setAllowReportAnother] = useState(false)
  const [lat, setLat] = useState<number | undefined>()
  const [lng, setLng] = useState<number | undefined>()
  const [detectingLocation, setDetectingLocation] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const startVoice = () => {
    const Recognition = getSpeechRecognitionConstructor()
    if (!Recognition) {
      alert('Voice input is not supported in this browser.')
      return
    }

    const recognition = new Recognition()
    recognition.lang = 'en-IN'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()
      if (transcript) {
        setText((previous) => (previous ? `${previous} ${transcript}` : transcript))
      }
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setDetectingLocation(false)

        if (!location) {
          setLocation(
            `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`
          )
        }
      },
      () => {
        setError('Could not detect location. Please enter it manually.')
        setDetectingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    if (!result) {
      return
    }

    const timer = window.setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer)
          setAllowReportAnother(true)
          return 0
        }

        return previous - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [result])

  const getReporterUid = async () => {
    if (E2E_BYPASS_ENABLED) {
      return 'e2e-reporter'
    }

    if (auth.currentUser?.uid) {
      return auth.currentUser.uid
    }

    if (typeof window !== 'undefined') {
      let guestId = localStorage.getItem('crisis_sync_guest_id')
      if (!guestId) {
        guestId = `guest_${Math.random().toString(36).slice(2, 15)}`
        localStorage.setItem('crisis_sync_guest_id', guestId)
      }
      return guestId
    }

    return 'anonymous'
  }

  const resetForAnotherReport = () => {
    setResult(null)
    setCountdown(60)
    setAllowReportAnother(false)
    setError('')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!text.trim() && !panicType) {
      setError('Please describe the emergency or tap a panic button.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const reporterUid = await getReporterUid()
      const incidentText =
        panicType && !text.trim()
          ? `Emergency type: ${panicType}. Location: ${location || 'Unknown'}`
          : text

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), REPORT_REQUEST_TIMEOUT_MS)

      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          raw_text: incidentText,
          incident_text: incidentText,
          crisis_type: panicType,
          language,
          hotel_id: hotelId,
          hotel_name: hotelName,
          location_description: location,
          room_number: roomNumber.trim(),
          reporter_uid: reporterUid,
          lat,
          lng,
          photo_urls: [],
        }),
      }).finally(() => {
        window.clearTimeout(timeoutId)
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text()
        console.error('Non-JSON response:', responseText)
        throw new Error(
          `Server returned a non-JSON response (${response.status}). Check server logs.`
        )
      }

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Classification failed')
      }

      setCountdown(60)
      setAllowReportAnother(false)
      setResult(data.classification)
      onSuccess?.(data.incident_id)
    } catch (submitError: unknown) {
      if (submitError instanceof Error && submitError.name === 'AbortError') {
        setError('Request timed out. Please try again or call emergency services immediately.')
      } else {
        setError(submitError instanceof Error ? submitError.message : 'An error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="flex flex-col gap-6 px-1 py-2 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <span className="material-icons-round text-4xl">check_circle</span>
        </div>

        <div className="space-y-2">
          <h2 className="font-[var(--font-headline)] text-2xl font-black uppercase tracking-tight text-[var(--low)]">
            Alert Sent
          </h2>
          <p className="mx-auto max-w-md text-sm leading-6 text-[var(--text-secondary)]">
            {result.guest_instruction}
          </p>
          <div className="mono-display text-[0.7rem] font-black tracking-[0.18em] text-[var(--accent)]">
            AI SEVERITY SCORE: {result.severity_score ?? Math.round(result.confidence * 100)}/100
          </div>
        </div>

        {result.call_emergency_services && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
            <p className="mono-display text-xs font-black tracking-wider text-red-400">
              CALL EMERGENCY SERVICES: {result.emergency_number}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="mono-display text-lg font-black text-[var(--low)]">
            Staff responding in: {countdown}s
          </div>
          {countdown === 0 && (
            <p className="text-sm text-[var(--text-muted)]">
              Staff should be on their way. If no one has arrived, call 112 now.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href="tel:112" className="btn-primary inline-flex items-center justify-center">
            Call 112
          </a>
          {allowReportAnother && (
            <button className="btn-ghost" onClick={resetForAnotherReport}>
              Report Another Incident
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="mono-display text-[0.68rem] font-black tracking-[0.22em] text-[var(--text-muted)]">
          {hotelName.toUpperCase()}
        </div>
        <h2 className="font-[var(--font-headline)] text-2xl font-black uppercase tracking-tight text-[var(--text-primary)]">
          Emergency Report
        </h2>
      </div>

      <div className="space-y-3">
        <label className="mono-display text-[0.7rem] font-black tracking-[0.18em] text-[var(--text-muted)]">
          Select Emergency Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {PANIC_BUTTONS.map((button) => {
            const isActive = panicType === button.type
            return (
              <button
                key={button.type}
                type="button"
                onClick={() => setPanicType(isActive ? null : button.type)}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border px-4 py-4 text-center transition-all ${
                  isActive
                    ? button.colorClass
                    : 'border-[var(--outline-variant)] bg-[var(--surface-low)] text-[var(--text-secondary)]'
                }`}
              >
                <span className="material-icons-round text-3xl">{button.icon}</span>
                <span className="text-xs font-black uppercase tracking-[0.18em]">{button.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="mono-display text-[0.7rem] font-black tracking-[0.18em] text-[var(--text-muted)]">
            Describe The Emergency
          </label>
          <button
            type="button"
            onClick={listening ? stopVoice : startVoice}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.14em] ${
              listening
                ? 'border-red-500/40 bg-red-500/10 text-red-400'
                : 'border-[var(--outline-variant)] bg-[var(--surface-low)] text-[var(--text-muted)]'
            }`}
          >
            {listening && <div className="live-dot" />}
            {listening ? 'Listening...' : 'Voice'}
          </button>
        </div>
        <textarea
          className="crisis-input min-h-28 resize-y"
          placeholder="Smoke coming from the third floor near the elevator..."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="mono-display text-[0.7rem] font-black tracking-[0.18em] text-[var(--text-muted)]">
            Room Number
          </label>
          <input
            className="crisis-input"
            type="text"
            placeholder="412"
            value={roomNumber}
            onChange={(event) => setRoomNumber(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="mono-display text-[0.7rem] font-black tracking-[0.18em] text-[var(--text-muted)]">
            Language
          </label>
          <select
            className="crisis-input cursor-pointer"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          >
            {['English', 'Hindi', 'Tamil', 'Bengali', 'Telugu', 'Marathi', 'Kannada', 'Malayalam', 'Gujarati'].map(
              (item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="mono-display text-[0.7rem] font-black tracking-[0.18em] text-[var(--text-muted)]">
          Location
        </label>
        <input
          className="crisis-input"
          type="text"
          placeholder="3rd floor, Room 312, near elevator"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        />
        <button
          type="button"
          onClick={detectLocation}
          disabled={detectingLocation}
          className={`flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-[0.16em] transition-all ${
            lat
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-[var(--outline-variant)] bg-[var(--surface-high)] text-[var(--text-primary)]'
          }`}
        >
          <span className="material-icons-round text-xl">
            {detectingLocation ? 'sync' : lat ? 'check_circle' : 'my_location'}
          </span>
          {detectingLocation ? 'Auto Detecting...' : lat ? 'Location Detected' : 'Detect My Location'}
        </button>
        {lat && lng && (
          <div className="mono-display rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-center text-[0.62rem] font-black tracking-[0.16em] text-emerald-300">
            Coordinates Locked: {lat.toFixed(5)}, {lng.toFixed(5)}
          </div>
        )}
      </div>

      <a href="tel:112" className="btn-ghost text-center">
        Emergency Fallback: 112
      </a>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          ALERT: {error}
        </div>
      )}

      <button type="submit" className="btn-tactical h-14 w-full" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Classifying...' : 'Report Emergency'}
      </button>
    </form>
  )
}
