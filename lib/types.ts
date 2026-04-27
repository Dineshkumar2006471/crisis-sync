// lib/types.ts
import { Timestamp } from 'firebase/firestore'

export type CrisisType = 'fire' | 'medical' | 'security' | 'structural' | 'power' | 'other'
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'
export type ResponseStatus = 'reported' | 'acknowledged' | 'responding' | 'resolved'

export interface StaffInstructions {
  front_desk: string
  security: string
  housekeeping: string
  management: string
}

export interface ResponseLogEntry {
  staff_uid: string
  staff_name: string
  action: string
  timestamp: Timestamp | string
}

export interface Incident {
  id: string
  hotel_id: string
  hotel_name: string
  reported_by: 'guest' | 'staff'
  reporter_uid: string
  raw_text: string
  language: string
  location_description: string
  floor_number?: number
  room_number?: string
  crisis_type: CrisisType
  severity: SeverityLevel
  status: ResponseStatus
  gemini_summary: string
  guest_instruction: string
  staff_instructions: StaffInstructions
  call_emergency_services: boolean
  emergency_number?: string
  confidence: number
  photo_urls: string[]
  created_at: Timestamp | string
  updated_at: Timestamp | string
  resolved_at?: Timestamp | string
  response_log: ResponseLogEntry[]
  lat?: number
  lng?: number
}

export interface StaffProfile {
  uid: string
  email: string
  display_name: string
  role: 'front_desk' | 'security' | 'housekeeping' | 'management' | 'admin'
  hotel_id: string
  active: boolean
}

export interface Hotel {
  id: string
  name: string
  address: string
  city: string
  floors: number
  lat: number
  lng: number
  emergency_contacts: {
    police: string
    fire: string
    ambulance: string
    front_desk: string
  }
}

export interface GeminiClassifyResponse {
  crisis_type: CrisisType
  severity: SeverityLevel
  confidence: number
  summary_english: string
  guest_instruction: string
  staff_instructions: StaffInstructions
  call_emergency_services: boolean
  emergency_number: string
}
