import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { searchVenues } from './actions'
import { getVenueImageUrl } from '@/lib/venue-utils'

interface AvailabilityPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

interface VenueResult {
  id: string
  name: string
  slug?: string
  building: string
  floor: string
  capacity: number
  type: string
  image_url?: string | null
  images?: string[] | null
  specifications?: Record<string, unknown> | null
  venue_facilities?: { facilities: { name: string } | null }[]
}

export default async function AvailabilityPage(props: AvailabilityPageProps) {
  const resolvedSearchParams = (await props.searchParams) || {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: facilitiesList } = await supabase.from('facilities').select('*').order('name')

  const dateParam = typeof resolvedSearchParams.date === 'string' ? resolvedSearchParams.date : ''
  const endDateParam = typeof resolvedSearchParams.endDate === 'string' 
    ? resolvedSearchParams.endDate 
    : typeof resolvedSearchParams.end_date === 'string' 
      ? resolvedSearchParams.end_date 
      : dateParam
  const startTimeParam = typeof resolvedSearchParams.startTime === 'string' ? resolvedSearchParams.startTime : ''
  const endTimeParam = typeof resolvedSearchParams.endTime === 'string' ? resolvedSearchParams.endTime : ''
  const capacityParam = typeof resolvedSearchParams.capacity === 'string' ? resolvedSearchParams.capacity : '20'
  const venueTypeParam = typeof resolvedSearchParams.venueType === 'string' ? resolvedSearchParams.venueType : ''

  const hasSearched = !!dateParam && !!startTimeParam && !!endTimeParam

  let searchResult: VenueResult[] | null = null
  let searchError: string | null = null

  if (hasSearched) {
    const fd = new FormData()
    fd.append('date', dateParam)
    fd.append('endDate', endDateParam)
    fd.append('startTime', startTimeParam)
    fd.append('endTime', endTimeParam)
    fd.append('capacity', capacityParam)
    if (venueTypeParam) fd.append('venueType', venueTypeParam)

    if (resolvedSearchParams.facilities) {
      const fac = Array.isArray(resolvedSearchParams.facilities)
        ? resolvedSearchParams.facilities
        : [resolvedSearchParams.facilities]
      fac.forEach((f) => {
        if (typeof f === 'string') fd.append('facilities', f)
      })
    }

    const result = await searchVenues(fd)
    if (result.error) {
      searchError = result.error
    } else {
      searchResult = result.venues as unknown as VenueResult[]
    }
  } else {
    // If not searched, fetch all active venues
    const { data: allVenues } = await supabase
      .from('venues')
      .select('id, name, slug, building, floor, type, capacity, image_url, images, specifications, venue_facilities(facilities(name))')
      .eq('active', true)
      .order('name')
    searchResult = allVenues as unknown as VenueResult[]
  }

  // Format date for display
  let formattedDate = 'Select Date'
  if (dateParam) {
    const parsed = new Date(dateParam + 'T00:00:00')
    const parsedEnd = endDateParam ? new Date(endDateParam + 'T00:00:00') : parsed
    if (!isNaN(parsed.getTime())) {
      if (endDateParam && endDateParam !== dateParam && !isNaN(parsedEnd.getTime())) {
        formattedDate = `${parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${parsedEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      } else {
        formattedDate = parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <Link
          href="/dashboard"
          aria-label="Go back"
          className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/60 flex items-center justify-center text-on-surface shadow-sm active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[22px]">chevron_left</span>
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">Available Venues</h1>
          <span className="font-label-sm text-label-sm text-outline">Campus Space Finder</span>
        </div>
        <Link
          href="/venues"
          aria-label="All Venues"
          className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/60 flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 transition-transform shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">apartment</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Filter Card */}
        <div className="lg:col-span-1">
          <section className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-4 sm:p-5 shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04)] sticky top-24">
            <h2 className="font-headline-sm text-[16px] font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
              Search Parameters
            </h2>

            <form method="GET" action="/dashboard/availability" className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="date" className="font-label-md text-label-md text-on-surface-variant font-medium">
                  Date
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px] pointer-events-none">
                    calendar_today
                  </span>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    defaultValue={dateParam}
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline-variant/70 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/40 focus:border-primary-container transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1">
                  <label htmlFor="startTime" className="font-label-md text-label-md text-on-surface-variant font-medium">
                    Start
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    required
                    defaultValue={startTimeParam}
                    className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/70 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/40 focus:border-primary-container transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="endTime" className="font-label-md text-label-md text-on-surface-variant font-medium">
                    End
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    required
                    defaultValue={endTimeParam}
                    className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/70 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/40 focus:border-primary-container transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="capacity" className="font-label-md text-label-md text-on-surface-variant font-medium">
                  Expected Attendees
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline material-symbols-outlined text-[18px] pointer-events-none">
                    group
                  </span>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    min="1"
                    required
                    defaultValue={capacityParam}
                    className="w-full h-11 pl-10 pr-4 bg-surface-container-low border border-outline-variant/70 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/40 focus:border-primary-container transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="venueType" className="font-label-md text-label-md text-on-surface-variant font-medium">
                  Venue Type
                </label>
                <select
                  id="venueType"
                  name="venueType"
                  defaultValue={venueTypeParam}
                  className="w-full h-11 px-3 bg-surface-container-low border border-outline-variant/70 rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/40 focus:border-primary-container transition-all"
                >
                  <option value="">Any Type</option>
                  <option value="AUDITORIUM">Auditorium</option>
                  <option value="SEMINAR_HALL">Seminar Hall</option>
                  <option value="GALLERY">Gallery</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-outline-variant/40">
                <label className="font-label-md text-label-md text-on-surface-variant font-medium">Required Facilities</label>
                <div className="space-y-2 max-h-36 overflow-y-auto p-1 scrollbar-hide">
                  {facilitiesList?.map((facility) => {
                    const isChecked = Array.isArray(resolvedSearchParams.facilities)
                      ? resolvedSearchParams.facilities.includes(facility.id)
                      : resolvedSearchParams.facilities === facility.id

                    return (
                      <label key={facility.id} className="flex items-center space-x-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          name="facilities"
                          value={facility.id}
                          defaultChecked={isChecked}
                          className="w-4 h-4 rounded text-primary-container focus:ring-primary-container/30 border-outline-variant cursor-pointer accent-[#FF6835]"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                          {facility.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-primary-container hover:bg-[#C94B24] active:scale-[0.98] text-white font-label-lg text-label-lg rounded-xl shadow-md shadow-primary-container/25 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer font-semibold"
              >
                <span>Find Spaces</span>
                <span className="material-symbols-outlined text-[18px]">search</span>
              </button>
            </form>
          </section>
        </div>

        {/* Right Column: Results matching Stitch design */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Summary Card (When search performed) */}
          {hasSearched && (
            <section className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl p-4 shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04)]">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  </span>
                  <div>
                    <p className="font-headline-sm text-body-md font-semibold text-on-surface">{formattedDate}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      {startTimeParam} – {endTimeParam}
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/availability"
                  className="text-primary-container font-label-md text-label-md font-semibold hover:underline flex items-center gap-0.5"
                >
                  <span>Reset</span>
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </Link>
              </div>
              <div className="pt-3 flex items-center justify-between text-body-sm text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary-container">group</span>
                  <span className="font-label-md text-label-md text-on-surface">Min Capacity: {capacityParam}</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">verified</span>
                  <span className="font-label-md text-label-md text-on-surface">Exclusion-free Check</span>
                </div>
              </div>
            </section>
          )}

          {/* Segmented Tabs */}
          <div className="grid grid-cols-2 p-1 bg-surface-container rounded-xl gap-1">
            <button
              className="py-2.5 px-3 rounded-lg bg-surface-container-lowest text-primary-container font-label-lg text-label-lg font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
              type="button"
            >
              <span>{hasSearched ? 'Available Venues' : 'Directory'}</span>
              <span className="bg-primary-container/10 text-primary-container px-1.5 py-0.5 rounded-full text-[11px] font-bold">
                {searchResult?.length ?? 0}
              </span>
            </button>
            <Link
              href="/venues"
              className="py-2.5 px-3 rounded-lg text-on-surface-variant font-label-lg text-label-lg font-medium hover:text-on-surface transition-colors flex items-center justify-center"
            >
              <span>All Venues Catalog</span>
            </Link>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium">
              Capacity ≥ {capacityParam} Attendees
            </span>
            <span className="font-label-sm text-label-sm text-tertiary font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              Real-time availability
            </span>
          </div>

          {/* Errors or empty states */}
          {searchError ? (
            <div className="p-4 bg-error-container text-on-error-container rounded-xl border border-error/20 flex items-start gap-3">
              <span className="material-symbols-outlined mt-0.5 shrink-0">error</span>
              <div>
                <h3 className="font-label-lg font-bold">Search Error</h3>
                <p className="font-body-sm mt-1">{searchError}</p>
              </div>
            </div>
          ) : !searchResult || searchResult.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[320px] border border-outline-variant/50 rounded-2xl bg-surface-container-lowest text-on-surface-variant p-8 text-center shadow-sm">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-30">domain_disabled</span>
              <p className="font-headline-sm font-semibold text-on-surface">No venues available</p>
              <p className="font-body-sm mt-1 max-w-md text-outline">
                We couldn&apos;t find any venues matching your criteria for the specified time slot. Try adjusting the
                time, reducing capacity requirement, or exploring other spaces.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResult.map((venue) => {
                const img = getVenueImageUrl(venue)
                const bookUrl = hasSearched
                  ? `/dashboard/book?venue=${venue.id}&date=${dateParam}&endDate=${endDateParam}&start=${startTimeParam}&end=${endTimeParam}&attendees=${capacityParam}`
                  : `/dashboard/book?venue=${venue.id}`

                return (
                  <article
                    key={venue.id}
                    className="bg-surface-container-lowest border border-outline-variant/70 rounded-2xl overflow-hidden shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04)] flex flex-col group hover:border-primary-container/40 transition-all"
                  >
                    <div className="relative h-48 w-full bg-surface-dim overflow-hidden">
                      <Image
                        src={img}
                        alt={venue.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-label-sm font-semibold shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Available
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-inverse-surface/85 backdrop-blur-sm text-inverse-on-surface px-2.5 py-1 rounded-lg flex items-center gap-1 text-label-sm font-medium">
                        <span className="material-symbols-outlined text-[15px]">people</span>
                        <span>{venue.capacity} capacity</span>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                            {venue.name}
                          </h2>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {venue.building} · {venue.floor}
                          </p>
                        </div>
                      </div>

                      {/* Facilities */}
                      <div className="flex flex-wrap items-center gap-3 text-on-surface-variant pt-0.5">
                        {venue.venue_facilities && venue.venue_facilities.length > 0 ? (
                          venue.venue_facilities.slice(0, 4).map((vf) => {
                            const fName = vf.facilities?.name || ''
                            let icon = 'domain'
                            if (fName.toLowerCase().includes('projector')) icon = 'videocam'
                            if (fName.toLowerCase().includes('ac') || fName.toLowerCase().includes('air')) icon = 'mode_fan'
                            if (fName.toLowerCase().includes('wi-fi') || fName.toLowerCase().includes('wifi')) icon = 'wifi'
                            if (fName.toLowerCase().includes('mic')) icon = 'mic'

                            return (
                              <div key={fName} className="flex items-center gap-1 font-label-sm text-label-sm">
                                <span className="material-symbols-outlined text-[17px] text-outline">{icon}</span>
                                <span>{fName}</span>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-xs text-outline italic">Standard campus equipment</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Link
                          href={`/venues/${venue.id}`}
                          className="h-11 px-4 bg-surface-container-low border border-outline-variant/60 text-on-surface font-label-lg text-label-lg font-medium rounded-xl flex items-center justify-center hover:bg-surface-container transition-all"
                        >
                          Details
                        </Link>
                        <Link
                          href={bookUrl}
                          className="flex-1 h-11 bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-98 hover:brightness-105 transition-all shadow-sm"
                        >
                          <span>Select Venue</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* Footer Info */}
          <footer className="py-4 text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
              {searchResult?.length ?? 0} venues ready for campus reservation
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}
