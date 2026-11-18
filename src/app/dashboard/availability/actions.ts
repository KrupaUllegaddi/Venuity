'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const searchSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  endDate: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  capacity: z.coerce.number().int().positive('Capacity must be positive').default(1),
  venueType: z.string().optional(),
  facilities: z.array(z.string()).optional()
}).refine(data => {
  const endDate = data.endDate || data.date
  return endDate >= data.date
}, {
  message: 'End date cannot be earlier than start date',
  path: ['endDate']
}).refine(data => {
  const endDate = data.endDate || data.date
  const start = new Date(`${data.date}T${data.startTime}`)
  const end = new Date(`${endDate}T${data.endTime}`)
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start
}, {
  message: 'End time must be after start time',
  path: ['endTime']
})

export async function searchVenues(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const facilities = formData.getAll('facilities') as string[]
  
  const rawDate = (formData.get('date') ?? formData.get('startDate')) as string | null
  const rawEndDate = (formData.get('endDate') ?? rawDate) as string | null

  const rawData = {
    date: rawDate,
    endDate: rawEndDate,
    startTime: formData.get('startTime'),
    endTime: formData.get('endTime'),
    capacity: formData.get('capacity'),
    venueType: formData.get('venueType') || undefined,
    facilities: facilities.length > 0 ? facilities : undefined
  }

  const parsed = searchSchema.safeParse(rawData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, venues: null }
  }

  const { date, endDate, startTime, endTime, capacity, venueType, facilities: parsedFacilities } = parsed.data
  const effectiveEndDate = endDate || date

  // Combine date and time assuming local timezone for now, or just send ISO string
  const startAt = new Date(`${date}T${startTime}:00`).toISOString()
  const endAt = new Date(`${effectiveEndDate}T${endTime}:00`).toISOString()

  // Use the RPC to handle complex overlaps
  const { data: venues, error } = await supabase.rpc('search_available_venues', {
    p_start_at: startAt,
    p_end_at: endAt,
    p_capacity: capacity,
    p_venue_type: venueType || null,
    p_facility_ids: parsedFacilities || null
  })

  if (error) {
    console.error('Search RPC error:', error)
    return { error: 'Failed to search venues', venues: null }
  }

  // We need to fetch the facilities for these venues to display them nicely
  if (venues && venues.length > 0) {
    const venueIds = venues.map((v: { id: string }) => v.id)
    const { data: enriched } = await supabase
      .from('venues')
      .select('*, venue_facilities(facilities(name))')
      .in('id', venueIds)
      
    // Sort them like the RPC returned or by name
    if (enriched) {
        enriched.sort((a, b) => a.name.localeCompare(b.name))
        return { error: null, venues: enriched }
    }
  }

  return { error: null, venues: [] }
}
