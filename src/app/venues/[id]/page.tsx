import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { VenueGallery } from './venue-gallery'
import {
  getVenueImages,
  formatSpecValue,
  type VenueSpecifications,
} from '@/lib/venue-utils'

interface VenueDetailsProps {
  params: Promise<{ id: string }>
}

interface VenueBookingItem {
  id: string
  event_name: string
  start_at: string
  end_at: string
  status: string
  departments: { name: string; code: string } | null
}

function SpecItem({
  label,
  value,
  icon,
  suffix,
  fullWidth,
}: {
  label: string
  value: unknown
  icon: string
  suffix?: string
  fullWidth?: boolean
}) {
  const formatted = formatSpecValue(value, suffix)
  const isNotSpecified = formatted === 'Not specified'

  return (
    <div
      className={`p-3 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 flex items-start gap-2.5 ${
        fullWidth ? 'col-span-full' : ''
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-surface-container-high/60 flex items-center justify-center shrink-0 text-primary mt-0.5">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-label-sm text-xs text-outline leading-tight">{label}</p>
        <p
          className={`font-label-md text-sm font-semibold mt-0.5 leading-snug break-words ${
            isNotSpecified ? 'text-on-surface-variant/60 italic font-normal' : 'text-on-surface'
          }`}
        >
          {formatted}
        </p>
      </div>
    </div>
  )
}

export default async function VenueDetailsPage(props: VenueDetailsProps) {
  const { id: venueId } = await props.params

  const supabase = await createClient()

  // 1. Fetch Venue details with facilities, images, and specifications
  const { data: venue } = await supabase
    .from('venues')
    .select('*, venue_facilities(facilities(name))')
    .eq('id', venueId)
    .single()

  if (!venue || !venue.active) {
    notFound()
  }

  // 2. Fetch today's bookings for this venue
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, event_name, start_at, end_at, status, departments(name, code)')
    .eq('venue_id', venueId)
    .eq('status', 'CONFIRMED')
    .gte('end_at', todayStart)
    .lte('start_at', todayEnd)
    .order('start_at', { ascending: true })

  const nowIso = now.toISOString()
  const isCurrentlyOccupied = bookings?.some(
    (b: { start_at: string; end_at: string }) => b.start_at <= nowIso && b.end_at >= nowIso
  )
  const isReservedLater = bookings?.some((b: { start_at: string }) => b.start_at > nowIso)

  // Get gallery images
  const galleryImages = getVenueImages(venue)

  // Parse specifications
  const specs = (venue.specifications as VenueSpecifications) || {}
  const seating = specs.seating || {}
  const audio = specs.audio || {}
  const visual = specs.visual || {}
  const stage = specs.stage || {}
  const facilities = specs.facilities || {}

  return (
    <div className="min-h-screen flex justify-center items-start text-on-surface antialiased p-0 sm:py-6 pb-28">
      {/* Mobile/Desktop responsive card wrapper */}
      <main className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl bg-background relative shadow-2xl overflow-hidden flex flex-col sm:rounded-3xl border border-outline-variant/30">
        {/* GALLERY & TOP BAR */}
        <VenueGallery
          images={galleryImages}
          venueName={venue.name}
          venueId={venue.id}
          isCurrentlyOccupied={Boolean(isCurrentlyOccupied)}
          isReservedLater={Boolean(isReservedLater)}
        />

        {/* MAIN CONTENT OVERVIEW */}
        <div className="relative bg-background pt-5 px-4 sm:px-6 pb-28 flex-1 space-y-6">
          {/* VENUE INFO CARD */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/50 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-label-sm text-label-sm font-semibold tracking-wide text-primary uppercase">
                  {venue.type.replace('_', ' ')}
                </span>
                <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-surface mt-0.5 font-bold tracking-tight">
                  {venue.name}
                </h1>
              </div>
              <span className="p-2.5 rounded-xl bg-surface-container-high/60 text-outline">
                <span className="material-symbols-outlined text-[24px]">apartment</span>
              </span>
            </div>

            {/* Meta Specification Pills */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-container">
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center">
                <span className="material-symbols-outlined text-outline text-[18px]">group</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5">
                  {venue.capacity}
                </span>
                <span className="font-label-sm text-xs text-outline">Capacity</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center">
                <span className="material-symbols-outlined text-outline text-[18px]">domain</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5 truncate max-w-full px-1">
                  {venue.building}
                </span>
                <span className="font-label-sm text-xs text-outline">Building</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center">
                <span className="material-symbols-outlined text-outline text-[18px]">stairs</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold mt-0.5 truncate max-w-full px-1">
                  {venue.floor}
                </span>
                <span className="font-label-sm text-xs text-outline">Floor Level</span>
              </div>
            </div>
          </section>

          {/* ABOUT SECTION */}
          <section className="space-y-2">
            <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              About Venue
            </h2>
            <div className="p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-sm space-y-3">
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                {venue.description ||
                  `Spacious and modern ${venue.type.replace('_', ' ').toLowerCase()} located in ${venue.building}, ${venue.floor}. Ideal for seminars, conferences, academic lectures, and collaborative campus events.`}
              </p>
            </div>
          </section>

          {/* 1. SEATING & CAPACITY SPECIFICATIONS */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">chair</span>
                Seating & Capacity
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              <SpecItem
                label="Total Seating Capacity"
                value={seating.total_capacity ?? venue.capacity}
                icon="groups"
              />
              <SpecItem
                label="Available Chairs"
                value={seating.available_chairs}
                icon="event_seat"
                suffix="chairs"
              />
              <SpecItem
                label="Fixed Chairs"
                value={seating.fixed_chairs}
                icon="chair"
                suffix="fixed"
              />
              <SpecItem
                label="Balcony"
                value={seating.balcony}
                icon="balcony"
              />
            </div>
          </section>

          {/* 2. AUDIO EQUIPMENT SPECIFICATIONS */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">volume_up</span>
                Audio Equipment
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              <SpecItem
                label="Microphones Total"
                value={audio.microphones_total}
                icon="mic"
                suffix="mics"
              />
              <SpecItem
                label="Wireless Microphones"
                value={audio.wireless_microphones}
                icon="podium"
                suffix="units"
              />
              <SpecItem
                label="Podium Microphones"
                value={audio.podium_microphones}
                icon="mic_external_on"
                suffix="units"
              />
              <SpecItem
                label="Headset Microphones"
                value={audio.headset_microphones}
                icon="headset_mic"
                suffix="units"
              />
              <SpecItem
                label="Speakers Total"
                value={audio.speakers_total}
                icon="speaker"
                suffix="speakers"
              />
              <SpecItem
                label="Sound Console"
                value={audio.sound_console ?? facilities.sound_console}
                icon="tune"
              />
              <SpecItem
                label="Subwoofer Speakers"
                value={audio.subwoofer_speakers}
                icon="speaker_group"
                suffix="units"
              />
              <SpecItem
                label="Top Speakers"
                value={audio.top_speakers}
                icon="surround_sound"
                suffix="units"
              />
              <SpecItem
                label="Centre Field Speakers"
                value={audio.centre_field_speakers}
                icon="speaker_phone"
                suffix="units"
              />
              <SpecItem
                label="Monitor Speakers"
                value={audio.monitor_speakers}
                icon="headset"
                suffix="units"
              />
            </div>
          </section>

          {/* 3. VISUAL EQUIPMENT & LIGHTING */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">videocam</span>
                Visual Equipment & Lighting
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              <SpecItem
                label="Projectors"
                value={visual.projectors}
                icon="videocam"
                suffix="projectors"
              />
              <SpecItem
                label="LED Video Wall / Screen"
                value={visual.led_screen}
                icon="tv"
              />
              <SpecItem
                label="PAR Lights"
                value={visual.par_lights}
                icon="highlight"
                suffix="units"
              />
              <SpecItem
                label="LED PAR 26"
                value={visual.led_par_26}
                icon="flare"
                suffix="unit"
              />
              <SpecItem
                label="Warm LED PAR Lights"
                value={visual.warm_led_par_lights}
                icon="wb_incandescent"
              />
              <SpecItem
                label="Computer System"
                value={visual.computer_system ?? facilities.computer_system}
                icon="computer"
                suffix="workstation"
              />
            </div>
          </section>

          {/* 4. STAGE & DIMENSIONS */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">theater_comedy</span>
                Stage & Dimensions
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              <SpecItem
                label="Stage Availability"
                value={stage.available}
                icon="stage"
              />
              <SpecItem
                label="Stage Size (ft)"
                value={stage.size}
                icon="aspect_ratio"
              />
            </div>
          </section>

          {/* 5. FACILITIES & SECURITY */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">room_preferences</span>
                Facilities & Security
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              <SpecItem
                label="Air Conditioning (AC)"
                value={facilities.ac}
                icon="mode_fan"
              />
              <SpecItem
                label="Wi-Fi Availability"
                value={facilities.wifi}
                icon="wifi"
              />
              <SpecItem
                label="Wi-Fi Routers"
                value={facilities.wifi_routers}
                icon="router"
                suffix="routers"
              />
              <SpecItem
                label="CCTV Availability"
                value={facilities.cctv}
                icon="videocam"
              />
              <SpecItem
                label="CCTV Cameras"
                value={facilities.cctv_cameras}
                icon="security"
                suffix="cameras"
              />
              <SpecItem
                label="Green Rooms"
                value={facilities.green_rooms}
                icon="meeting_room"
                suffix="rooms"
              />
              <SpecItem
                label="Entrances"
                value={facilities.entrances}
                icon="door_front"
                suffix="doors"
              />
              <SpecItem
                label="Exits"
                value={facilities.exits}
                icon="door_back"
                suffix="doors"
              />
            </div>
          </section>

          {/* 6. FURNITURE & STRUCTURAL DETAILS */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">table_restaurant</span>
                Furniture & Structural Details
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5">
              <SpecItem
                label="Large Tables"
                value={facilities.large_tables}
                icon="table_restaurant"
                suffix="tables"
              />
              <SpecItem
                label="Small Tables"
                value={facilities.small_tables}
                icon="desk"
                suffix="tables"
              />
              <SpecItem
                label="Sofas"
                value={facilities.sofas}
                icon="weekend"
                suffix="sofas"
              />
              <SpecItem
                label="Swamiji Sofas"
                value={facilities.swamiji_sofas}
                icon="chair_alt"
                suffix="sofas"
              />
              <SpecItem
                label="Pillars & Structural Details"
                value={facilities.pillars}
                icon="foundation"
                fullWidth
              />
            </div>
          </section>

          {/* KEY FACILITIES CHIPS */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-headline-sm text-lg font-bold text-on-surface">Key Amenities</h2>
              <span className="font-label-sm text-xs text-outline">
                {venue.venue_facilities?.length || 0} amenities listed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {venue.venue_facilities && venue.venue_facilities.length > 0 ? (
                venue.venue_facilities.map((vf: { facilities: { name: string } | null }) => {
                  const name = vf.facilities?.name || ''
                  let icon = 'domain'
                  let desc = 'Equipped'
                  let colorClass = 'bg-primary/10 text-primary'

                  if (name.toLowerCase().includes('projector')) {
                    icon = 'videocam'
                    desc = 'Visual Projection'
                    colorClass = 'bg-primary/10 text-primary'
                  } else if (name.toLowerCase().includes('ac') || name.toLowerCase().includes('air')) {
                    icon = 'mode_fan'
                    desc = 'Climate Control'
                    colorClass = 'bg-surface-container text-on-surface-variant'
                  } else if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wifi')) {
                    icon = 'wifi'
                    desc = 'Campus High-Speed'
                    colorClass = 'bg-emerald-50 text-emerald-700'
                  } else if (name.toLowerCase().includes('sound') || name.toLowerCase().includes('speaker')) {
                    icon = 'speaker'
                    desc = 'Sound System'
                    colorClass = 'bg-amber-50 text-amber-700'
                  } else if (name.toLowerCase().includes('mic')) {
                    icon = 'mic'
                    desc = 'Audio Input'
                    colorClass = 'bg-primary/10 text-primary'
                  } else if (name.toLowerCase().includes('cctv')) {
                    icon = 'videocam'
                    desc = 'Security Surveillance'
                    colorClass = 'bg-slate-100 text-slate-700'
                  } else if (name.toLowerCase().includes('stage')) {
                    icon = 'stage'
                    desc = 'Performance Stage'
                    colorClass = 'bg-orange-50 text-orange-700'
                  }

                  return (
                    <div
                      key={name}
                      className="flex items-center gap-3 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                        <span className="material-symbols-outlined text-[19px]">{icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-label-lg text-sm text-on-surface leading-tight font-medium truncate">{name}</p>
                        <p className="font-label-sm text-xs text-outline truncate">{desc}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="col-span-2 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/40 text-outline text-sm italic">
                  Standard collegiate lecture and presentation amenities.
                </div>
              )}
            </div>
          </section>

          {/* UPCOMING TODAY SECTION */}
          <section className="space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-lg font-bold text-on-surface">Today&apos;s Schedule</h2>
                <span className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <Link
                href="/calendar"
                className="font-label-md text-sm text-primary flex items-center gap-0.5 hover:underline"
              >
                Full Calendar
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </Link>
            </div>

            {bookings && bookings.length > 0 ? (
              (bookings as unknown as VenueBookingItem[]).map((booking: VenueBookingItem) => {
                const sDate = new Date(booking.start_at)
                const eDate = new Date(booking.end_at)
                const timeString = `${sDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – ${eDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                const deptName = booking.departments?.name || 'Academic Event'

                return (
                  <div
                    key={booking.id}
                    className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/50 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex flex-col items-center justify-center text-center border border-outline-variant/30 shrink-0">
                        <span className="font-label-sm text-[10px] uppercase font-bold text-outline">
                          {sDate.toLocaleDateString('en-IN', { month: 'short' })}
                        </span>
                        <span className="font-headline-sm text-base text-on-surface leading-none font-bold">
                          {sDate.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-label-sm text-xs font-semibold text-primary">{deptName}</span>
                        </div>
                        <h3 className="font-headline-sm text-sm font-bold text-on-surface mt-0.5 truncate">
                          {booking.event_name}
                        </h3>
                        <p className="font-body-sm text-xs text-outline flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {timeString}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 font-label-sm text-xs text-emerald-700 font-medium shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Confirmed
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-emerald-600">event_available</span>
                <p className="font-body-sm text-sm text-on-surface-variant flex-1">
                  No other events scheduled for today. This venue is completely open for booking!
                </p>
              </div>
            )}
          </section>
        </div>

        {/* BOTTOM STICKY ACTION BAR */}
        <footer className="fixed bottom-0 left-0 right-0 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant p-4 z-40 shadow-lg flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-label-sm text-xs text-outline">Campus Access</span>
            <span className="font-headline-sm text-sm font-bold leading-tight">Institutional Space</span>
            <span className="font-label-sm text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              Open for Reservation
            </span>
          </div>

          <Link
            href={`/dashboard/book?venue=${venue.id}`}
            className="flex-1 h-12 rounded-xl bg-primary text-white font-label-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <span>Book Now</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </footer>
      </main>
    </div>
  )
}
