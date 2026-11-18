'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const requestSchema = z.object({
  venueId: z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    'Invalid venue ID format'
  ),
  date: z.string().min(1, 'Date is required'),
  endDate: z.string().min(1, 'End date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  eventName: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  expectedAttendees: z.coerce.number().int().positive('Expected attendees must be a positive number'),
  facultyCoordinator: z.string().optional(),
  contactInfo: z.string().optional(),
  additionalRequirements: z.string().optional()
}).refine(data => {
  return data.endDate >= data.date
}, {
  message: 'End date cannot be earlier than start date',
  path: ['endDate']
}).refine(data => {
  const start = new Date(`${data.date}T${data.startTime}`)
  const end = new Date(`${data.endDate}T${data.endTime}`)
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start
}, {
  message: 'End time must be after start time',
  path: ['endTime']
})

export type BookingActionState = {
  error?: string
  success?: boolean
}

export async function submitBookingRequest(prevState: BookingActionState, formData: FormData): Promise<BookingActionState> {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 2. Profile/Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, department_id, active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.active) {
    return { error: 'Invalid or inactive profile' }
  }

  if (profile.role !== 'FACULTY' && profile.role !== 'HOD' && profile.role !== 'ADMIN') {
    return { error: 'Unauthorized role' }
  }

  // 3. Parse and validate form data
  const rawDate = (formData.get('date') ?? formData.get('startDate')) as string | null
  const rawEndDate = (formData.get('endDate') ?? (formData.has('endDate') ? formData.get('endDate') : rawDate)) as string | null

  const rawData = {
    venueId: formData.get('venueId'),
    date: rawDate,
    endDate: rawEndDate,
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    eventName: formData.get('eventName'),
    description: formData.get('description') || undefined,
    expectedAttendees: formData.get('expectedAttendees'),
    facultyCoordinator: formData.get('facultyCoordinator') || undefined,
    contactInfo: formData.get('contactInfo') || undefined,
    additionalRequirements: formData.get('additionalRequirements') || undefined
  }

  const parsed = requestSchema.safeParse(rawData)
  if (!parsed.success) {
    console.error('[Booking validation failed]', {
      venueId: rawData.venueId,
      issues: parsed.error.issues,
    })

    return { error: parsed.error.issues[0].message }
  }
  const {
    venueId, date, endDate, startTime, endTime, eventName, description,
    expectedAttendees, facultyCoordinator, contactInfo, additionalRequirements
  } = parsed.data

  const startAt = new Date(`${date}T${startTime}:00`).toISOString()
  const endAt = new Date(`${endDate}T${endTime}:00`).toISOString()

  // 4. Validate venue and capacity
  const { data: venue } = await supabase
    .from('venues')
    .select('id, active, capacity')
    .eq('id', venueId)
    .single()

  if (!venue) return { error: 'Venue not found' }
  if (!venue.active) return { error: 'Venue is currently inactive' }
  if (expectedAttendees > venue.capacity) {
    return { error: `Expected attendees (${expectedAttendees}) exceeds venue capacity (${venue.capacity})` }
  }

  // 5. Re-check availability (RPC)
  const { data: availableVenues, error: rpcError } = await supabase.rpc('search_available_venues', {
    p_start_at: startAt,
    p_end_at: endAt,
    p_capacity: expectedAttendees
  })

  if (rpcError) {
    console.error('Availability check failed:', rpcError)
    return { error: 'Failed to verify availability' }
  }

  const isAvailable = availableVenues?.some((v: { id: string }) => v.id === venueId)
  if (!isAvailable) {
    return { error: 'The venue is no longer available for the selected time, or is under maintenance.' }
  }

  // 6. Insert booking request
  const { data: newRequest, error: insertError } = await supabase
    .from('booking_requests')
    .insert({
      requester_id: profile.id,
      department_id: profile.department_id,
      venue_id: venueId,
      event_name: eventName,
      description,
      start_at: startAt,
      end_at: endAt,
      expected_attendees: expectedAttendees,
      faculty_coordinator: facultyCoordinator,
      contact_info: contactInfo,
      additional_requirements: additionalRequirements,
      status: 'PENDING'
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('Insert booking request error:', insertError)
    return { error: 'Failed to submit booking request' }
  }

  // 7. Insert Notification & Audit Log
  await Promise.allSettled([
    supabase.from('notifications').insert({
      user_id: profile.id,
      type: 'BOOKING_SUBMITTED',
      title: 'Booking Request Submitted',
      message: `Your booking request for "${eventName}" has been submitted and is pending review.`
    }),
    supabase.from('audit_logs').insert({
      actor_id: profile.id,
      action: 'SUBMIT_BOOKING_REQUEST',
      entity_type: 'booking_requests',
      entity_id: newRequest.id,
      metadata: {
        venue_id: venueId,
        event_name: eventName,
        start_at: startAt,
        end_at: endAt,
        expected_attendees: expectedAttendees
      }
    })
  ])

  revalidatePath('/dashboard/requests')
  revalidatePath('/dashboard')
  revalidatePath('/admin/requests')
  revalidatePath('/calendar')

  return { success: true }
}
