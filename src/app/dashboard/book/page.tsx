
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookingRequestForm } from './form'

interface BookVenuePageProps {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export default async function BookVenuePage({
  searchParams,
}: BookVenuePageProps) {
  const resolvedSearchParams = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const venueId =
    typeof resolvedSearchParams.venue === 'string'
      ? resolvedSearchParams.venue
      : ''

  const date =
    typeof resolvedSearchParams.date === 'string'
      ? resolvedSearchParams.date
      : ''

  const endDate =
    typeof resolvedSearchParams.endDate === 'string'
      ? resolvedSearchParams.endDate
      : typeof resolvedSearchParams.end_date === 'string'
        ? resolvedSearchParams.end_date
        : ''

  const startTime =
    typeof resolvedSearchParams.start === 'string'
      ? resolvedSearchParams.start
      : typeof resolvedSearchParams.startTime === 'string'
        ? resolvedSearchParams.startTime
        : ''

  const endTime =
    typeof resolvedSearchParams.end === 'string'
      ? resolvedSearchParams.end
      : typeof resolvedSearchParams.endTime === 'string'
        ? resolvedSearchParams.endTime
        : ''

  const attendees =
    typeof resolvedSearchParams.attendees === 'string'
      ? resolvedSearchParams.attendees
      : ''

  // Fetch active departments
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, code')
    .eq('active', true)
    .order('name')

  // Fetch selected venue if an ID is provided
  let selectedVenue = null

  if (venueId) {
    const { data: venue } = await supabase
      .from('venues')
      .select('id, name, slug, capacity, building, floor, type, image_url, images, specifications, venue_facilities(facilities(name))')
      .eq('id', venueId)
      .eq('active', true)
      .single()

    selectedVenue = venue
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, department_id')
    .eq('id', user.id)
    .single()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-28 sm:px-6">
      <BookingRequestForm
        selectedVenue={selectedVenue}
        departments={departments || []}
        userProfile={profile}
        prefilledDate={date}
        prefilledEndDate={endDate}
        prefilledStart={startTime}
        prefilledEnd={endTime}
        prefilledAttendees={attendees}
      />
    </div>
  )
}
