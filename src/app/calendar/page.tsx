import { createClient } from '@/lib/supabase/server'
import { CalendarClient } from './calendar-client'

export interface CalendarEventData {
  id: string
  eventName: string
  venueId: string
  venueName: string
  deptCode: string
  startAt: string
  endAt: string
  status: string
}

export default async function CalendarPage() {
  const supabase = await createClient()

  // Fetch real confirmed bookings with venue and department details
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, event_name, venue_id, start_at, end_at, status, venues(name), departments(code)')
    .eq('status', 'CONFIRMED')
    .order('start_at', { ascending: true })

  const events: CalendarEventData[] =
    bookings?.map((b: {
      id: string
      event_name: string
      venue_id: string
      start_at: string
      end_at: string
      status: string
      venues: { name: string } | { name: string }[] | null
      departments: { code: string } | { code: string }[] | null
    }) => ({
      id: b.id,
      eventName: b.event_name,
      venueId: b.venue_id,
      venueName: Array.isArray(b.venues) ? b.venues[0]?.name : b.venues?.name || 'Main Hall',
      deptCode: Array.isArray(b.departments) ? b.departments[0]?.code : b.departments?.code || 'CAMPUS',
      startAt: b.start_at,
      endAt: b.end_at,
      status: b.status,
    })) || []

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 pb-28">
      <CalendarClient initialEvents={events} />
    </div>
  )
}
