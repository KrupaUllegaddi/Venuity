import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { getVenueImageUrl } from '@/lib/venue-utils'

interface VenuesPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function VenuesListPage(props: VenuesPageProps) {
  const resolvedSearchParams = (await props.searchParams) || {}
  const query = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : ''
  const selectedType = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type.toUpperCase() : ''

  const supabase = await createClient()

  // 1. Fetch active venues with facilities
  let venuesQuery = supabase
    .from('venues')
    .select('id, name, slug, type, building, floor, capacity, description, active, image_url, images, specifications, venue_facilities(facilities(name))')
    .eq('active', true)

  if (query) {
    venuesQuery = venuesQuery.ilike('name', `%${query}%`)
  }

  if (selectedType && selectedType !== 'ALL') {
    venuesQuery = venuesQuery.eq('type', selectedType)
  }

  const { data: venues } = await venuesQuery.order('name')

  // 2. Fetch current & upcoming bookings today to calculate status
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('venue_id, start_at, end_at, status')
    .eq('status', 'CONFIRMED')
    .gte('end_at', todayStart)
    .lte('start_at', todayEnd)

  const nowIso = now.toISOString()

  const categories = [
    { label: 'All', value: '' },
    { label: 'Auditorium', value: 'AUDITORIUM' },
    { label: 'Seminar Hall', value: 'SEMINAR_HALL' },
    { label: 'Gallery', value: 'GALLERY' },
  ]

  return (
    <div className="mx-auto w-full max-w-4xl px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28">
      {/* Screen Header */}
      <header className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Venues</h1>
          <p className="font-body-sm text-body-sm text-outline">Explore campus spaces and check their status</p>
        </div>
        <Link
          href="/dashboard/availability"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all active:scale-95 shadow-sm self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">search</span>
          <span>Find by Availability</span>
        </Link>
      </header>

      {/* Search Input Form */}
      <form method="GET" action="/venues" className="mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3.5 text-outline material-symbols-outlined text-[20px] pointer-events-none">
              search
            </span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Search venues..."
              type="text"
              className="w-full h-11 sm:h-12 pl-10 pr-4 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all shadow-[0_2px_8px_rgba(41,37,36,0.03)]"
            />
          </div>
          {selectedType && <input type="hidden" name="type" value={selectedType} />}
          <button
            type="submit"
            aria-label="Filter"
            className="h-11 sm:h-12 px-3.5 sm:px-4 bg-surface-container-lowest border border-outline-variant/60 rounded-xl flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all shadow-[0_2px_8px_rgba(41,37,36,0.03)] font-label-md text-label-md shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant mr-1">tune</span>
            Filter
          </button>
        </div>
      </form>

      {/* Horizontal Category Filter Chips */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const isActive = (cat.value === '' && !selectedType) || selectedType === cat.value
          const href = cat.value
            ? `/venues?type=${cat.value}${query ? `&q=${encodeURIComponent(query)}` : ''}`
            : `/venues${query ? `?q=${encodeURIComponent(query)}` : ''}`

          return (
            <Link
              key={cat.label}
              href={href}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-label-md text-label-md transition-all active:scale-95 ${
                isActive
                  ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                  : 'bg-surface-container-lowest border border-outline-variant/70 text-on-surface hover:bg-surface-container'
              }`}
            >
              {cat.label}
            </Link>
          )
        })}
      </div>

      {/* Venue Card List */}
      <main className="space-y-3.5">
        {!venues || venues.length === 0 ? (
          <div className="p-12 text-center text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/60">
            <span className="material-symbols-outlined text-[48px] opacity-40 mb-2">apartment</span>
            <p className="font-headline-sm text-on-surface font-semibold">No venues found</p>
            <p className="font-body-sm mt-1">Try clearing your search query or filters.</p>
            <Link
              href="/venues"
              className="inline-block mt-4 px-4 py-2 bg-primary-container text-on-primary rounded-xl font-label-md"
            >
              Reset Filters
            </Link>
          </div>
        ) : (
          venues.map((venue) => {
            // Calculate status from real bookings
            const venueBookings = todayBookings?.filter((b: { venue_id: string }) => b.venue_id === venue.id) || []
            const isCurrentlyOccupied = venueBookings.some(
              (b: { start_at: string; end_at: string }) => b.start_at <= nowIso && b.end_at >= nowIso
            )
            const hasFutureBookingToday = venueBookings.some((b: { start_at: string }) => b.start_at > nowIso)

            let statusBadge = (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-container font-label-sm text-label-sm flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                Available
              </span>
            )

            if (isCurrentlyOccupied) {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  Occupied
                </span>
              )
            } else if (hasFutureBookingToday) {
              statusBadge = (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  Reserved
                </span>
              )
            }

            const imgUrl = getVenueImageUrl(venue)

            return (
              <Link
                key={venue.id}
                href={`/venues/${venue.id}`}
                className="block"
              >
                <article className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-3 sm:p-4 flex gap-3.5 sm:gap-4 items-center shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04),0_2px_6px_-1px_rgba(255,104,53,0.03)] hover:border-primary-container/40 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container">
                    <Image
                      src={imgUrl}
                      alt={`${venue.name} thumbnail`}
                      fill
                      sizes="(max-width: 640px) 96px, 112px"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface truncate group-hover:text-primary transition-colors">
                        {venue.name}
                      </h2>
                      {statusBadge}
                    </div>

                    <div className="flex items-center gap-3 text-outline font-body-sm text-body-sm mt-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-outline">groups</span>
                        <span>{venue.capacity} capacity</span>
                      </span>
                      <span>•</span>
                      <span className="truncate">{venue.building}, {venue.floor}</span>
                    </div>

                    {/* Facilities Row */}
                    <div className="flex flex-wrap items-center gap-3 text-outline text-[12px] font-label-md mt-2 pt-1 border-t border-surface-container-high/60">
                      {venue.venue_facilities && venue.venue_facilities.length > 0 ? (
                        venue.venue_facilities.slice(0, 3).map((vf: { facilities: { name: string } | { name: string }[] | null }) => {
                          const fName = Array.isArray(vf.facilities) ? vf.facilities[0]?.name || '' : vf.facilities?.name || ''
                          let icon = 'domain'
                          if (fName.toLowerCase().includes('projector')) icon = 'videocam'
                          if (fName.toLowerCase().includes('ac') || fName.toLowerCase().includes('air')) icon = 'mode_fan'
                          if (fName.toLowerCase().includes('wi-fi') || fName.toLowerCase().includes('wifi')) icon = 'wifi'
                          if (fName.toLowerCase().includes('mic')) icon = 'mic'

                          return (
                            <div key={fName} className="flex items-center gap-1" title={fName}>
                              <span className="material-symbols-outlined text-[15px]">{icon}</span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant">{fName}</span>
                            </div>
                          )
                        })
                      ) : (
                        <span className="font-label-sm text-label-sm text-outline italic">Standard campus equipment</span>
                      )}
                    </div>
                  </div>
                </article>
              </Link>
            )
          })
        )}
      </main>
    </div>
  )
}
