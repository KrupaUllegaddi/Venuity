import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface BookingWithVenue {
  id: string
  event_name: string
  venue_id: string
  start_at: string
  end_at: string
  status: string
  venues: { name: string; capacity: number } | { name: string; capacity: number }[] | null
}

interface RequestWithVenue {
  id: string
  event_name: string
  status: string
  created_at: string
  venues: { name: string; capacity: number } | { name: string; capacity: number }[] | null
}

interface VenueRecord {
  id: string
  name: string
  type: string
  building: string
  floor: string
  capacity: number
}

const VENUE_IMAGE_MAP: Record<string, string> = {
  AUDITORIUM: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS6Skr3cNKFCsolPXX8pIb6YECV1ma8dxZWWkTIuZxQHK_N6Nl6DF35FzZqJmUibNL_van5wDfkl8rB-N2Ib6kEsVw75-YJKpA-naH6cccqDkuVtJHmtt8k6-_mpguQ72WPj39Pbwlb4nEnJmW9G8bEw5MItATPGuQSdNyrsevnqXtgCNDo4Zkw6F8Z1m55VRB_UAy8NLUNzoIHTyfqfREiywdlgNALP0csgyOVkiNe_IDe66_vaQscQ',
  SEMINAR_HALL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfe3WTQYKasTwiXf7BysgY1qQoRCo-eC8AOFHBPv0r7AvrBHZEKGv3tiGXcNoJnWGfFVU2JA9GL92rQt5HQtxq0jWoe8mX-eyFwiuzQgRrwuYbzyFN3fy1cgDoAxnTZNw1pjHABT4J0cABfp_WD8Rv2m0lMHS2mMTMy1IRKCfjPCUWC9WnWUEea_hV8QtrHqP8PD0P48TUIVYwnkdt3jlpiwDAoK0ATL56qntlSRi3FLeZOR87FE0yhA',
  GALLERY: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4qHnF1SRCX88MBaCADWb9-DCnRAMIQ6Tcfmp8WFq9y1eI9efCHWB_RI30SNTUvzLTKebERN-KLmMMrrjra0gyZCy8yokaKZq6V6kKwYnvMbEqNtIMGJy5tYeLlzj56K7P8yCKGyr9jm2L9PQc-ZgibIohvm94pz-sVV3VhWMGxw4QQH-rabrsX9libyhKzZSa9knbWSuwHEQQ0oOWArBNdQ3YifKm1Ieoj_iMZglVLGZVbIRQK4GRIw',
  CONFERENCE_ROOM: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0dMpEPHrj_9_dVImAlQo1B3IFlXcs-wQxaGxGcAiaAI97n1K32ybpL_BCeOq3GFi1CWh8hGWHby3MzHSK-_zoivtExpINzvDaVD71vTXigh7DVYO6MA-yGW-smFii70faWQVqyzXFmRkPEW6vSinQP_Laat3gb89A9Ojwji8GXGDhSny8W4sARfVJ4mdT0LbhI7l1crMR4VEKiGK6jz8ywuvCtg3ff0MPAUOkVjolx4jpZoZ6P3Yo2g',
  CLASSROOM: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCBx6xcT2aWWiRVsCfVB9p4LIaqhPsI4zLLHZnwe0VkKoeetXLnrRYCpZlHVqpyjuiGhlElbpa3acCUdC9GB4xwHUIe0lIlPQ71T-eQRFWk05EHNoipfU3NDHBCLW7SxrVbPGfarOWlzizviMbhrx9uW5SUXjN1cJXohPDyjfpIkvpBfi7DM5x4Y-twHoKtxMu0ZXEvbZfFfhzoe2SzTANw78Sj1mtxaoIHBJ5bTfobZT-H8T7qQ65jBw',
  OTHER: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBldDKWXNoZDYg39N6uAsxsSuZIQuJJruXeBslHsal2kgJSW3gEb1k5ziuYgcOW_sA9eUT4DH1kqBxsib0k83cb4qYkb66oX3MFw_olp6_qQpLDzkcliokMz3sJhb5WjmZQQ7JVwTMpOC_XnEYzeEmEvEmj32Eqjvj3BlhgOCznF7D3nWSkTfZpV3l1un4sV3saOn6ZjrK_IT9wSqa2qrXav9kIkCvX2EITeERL04V_R1ME0guonBCDEA',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Authoritative profile & department check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, department_id, departments(name, code)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const role = profile.role
  const deptName = Array.isArray(profile.departments) 
    ? profile.departments[0]?.name 
    : (profile.departments as { name: string } | null)?.name || 'Campus Member'

  // 2. Fetch real venues
  const { data: venues, count: venueCount } = await supabase
    .from('venues')
    .select('id, name, type, building, floor, capacity', { count: 'exact' })
    .eq('active', true)
    .order('name')

  // 3. Fetch real pending requests count
  const { count: pendingCount } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PENDING')

  // 4. Fetch today's bookings
  const now = new Date()
  const nowIso = now.toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()

  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('id, venue_id, start_at, end_at, event_name, status, departments(code)')
    .eq('status', 'CONFIRMED')
    .gte('end_at', todayStart)
    .lte('start_at', todayEnd)

  // Calculate real Occupied vs Available venues right now
  const totalVenueCount = venueCount ?? 0
  const occupiedVenueIds = new Set<string>()
  todayBookings?.forEach((b: { venue_id: string; start_at: string; end_at: string }) => {
    if (b.start_at <= nowIso && b.end_at >= nowIso) {
      occupiedVenueIds.add(b.venue_id)
    }
  })
  const occupiedCount = occupiedVenueIds.size
  const availableCount = Math.max(0, totalVenueCount - occupiedCount)

  // 5. Fetch upcoming bookings for schedule
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('id, event_name, venue_id, start_at, end_at, status, venues(name, capacity)')
    .eq('status', 'CONFIRMED')
    .gte('end_at', nowIso)
    .order('start_at', { ascending: true })
    .limit(5)

  // 6. Fetch recent requests
  const { data: recentRequests } = await supabase
    .from('booking_requests')
    .select('id, event_name, status, created_at, venues(name, capacity)')
    .order('created_at', { ascending: false })
    .limit(4)

  // Determine greeting based on local time
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good Morning,' : hour < 18 ? 'Good Afternoon,' : 'Good Evening,'

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 pb-28">
      {/* Greeting Section */}
      <section className="space-y-0.5 mb-6">
        <p className="font-body-sm text-body-sm text-outline font-medium tracking-wide">{greeting}</p>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight truncate">
          {profile.full_name}
        </h1>
        <p className="font-label-md text-label-md text-outline font-medium">
          {deptName} • {role === 'ADMIN' ? 'System Administrator' : role === 'HOD' ? 'Head of Department' : 'Faculty'}
        </p>
      </section>

      {/* Metric Cards (2x2 on mobile, 4 columns on desktop) */}
      <section aria-label="Venue Metric Highlights" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {/* 1. Total Venues */}
        <article className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 border border-[#E7DED4] shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04),0_2px_6px_-1px_rgba(255,104,53,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
          </div>
          <div>
            <span className="font-label-sm text-label-sm text-outline block mb-0.5">Total Venues</span>
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface leading-none">
              {totalVenueCount}
            </span>
          </div>
        </article>

        {/* 2. Available */}
        <article className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 border border-[#E7DED4] shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04),0_2px_6px_-1px_rgba(255,104,53,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-full bg-[#EDF4EE] flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div>
            <span className="font-label-sm text-label-sm text-outline block mb-0.5">Available</span>
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface leading-none">
              {availableCount}
            </span>
          </div>
        </article>

        {/* 3. Occupied */}
        <article className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 border border-[#E7DED4] shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04),0_2px_6px_-1px_rgba(255,104,53,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-full bg-[#FDF1F1] flex items-center justify-center text-[#D66F6F]">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </div>
          <div>
            <span className="font-label-sm text-label-sm text-outline block mb-0.5">Occupied</span>
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface leading-none">
              {occupiedCount}
            </span>
          </div>
        </article>

        {/* 4. Pending */}
        <article className="bg-surface-container-lowest rounded-2xl p-3.5 sm:p-4 border border-[#E7DED4] shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04),0_2px_6px_-1px_rgba(255,104,53,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
          </div>
          <div>
            <span className="font-label-sm text-label-sm text-outline block mb-0.5">Pending</span>
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface leading-none">
              {pendingCount ?? 0}
            </span>
          </div>
        </article>
      </section>

      {/* Main Grid: Today's Venue Overview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Venue Overview */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">Today&apos;s Venue Overview</h2>
              <Link
                href="/venues"
                className="font-label-lg text-primary-container hover:text-primary transition-colors flex items-center gap-0.5 active:scale-95"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>

            <div className="space-y-2.5">
              {venues && venues.length > 0 ? (
                venues.slice(0, 5).map((v: VenueRecord) => {
                  const venueBookings = todayBookings?.filter((b: { venue_id: string }) => b.venue_id === v.id) || []
                  const currentBooking = venueBookings.find(
                    (b: { start_at: string; end_at: string }) => b.start_at <= nowIso && b.end_at >= nowIso
                  )
                  const nextBooking = venueBookings.find((b: { start_at: string }) => b.start_at > nowIso)

                  let badge = (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EDF4EE] text-[#78977B] font-label-sm text-[11px] font-semibold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#78977B]"></span>
                      Free
                    </span>
                  )
                  let timeText = 'Available all day'

                  if (currentBooking) {
                    const dept = Array.isArray(currentBooking.departments)
                      ? currentBooking.departments[0]?.code
                      : (currentBooking.departments as { code: string } | null)?.code || 'Occupied'
                    badge = (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FDF1F1] text-[#D66F6F] font-label-sm text-[11px] font-semibold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D66F6F]"></span>
                        {dept}
                      </span>
                    )
                    timeText = `${new Date(currentBooking.start_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(currentBooking.end_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                  } else if (nextBooking) {
                    badge = (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] font-label-sm text-[11px] font-semibold shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
                        Reserved
                      </span>
                    )
                    timeText = `Next: ${new Date(nextBooking.start_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                  }

                  const img = VENUE_IMAGE_MAP[v.type] || VENUE_IMAGE_MAP.OTHER

                  return (
                    <Link key={v.id} href={`/venues/${v.id}`} className="block">
                      <article className="bg-surface-container-lowest rounded-xl border border-[#E7DED4] p-3 shadow-sm flex items-center gap-3 hover:border-primary-container/40 transition-all cursor-pointer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={v.name}
                          src={img}
                          className="w-[62px] h-[62px] rounded-lg object-cover shrink-0 bg-surface-container"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <h3 className="font-headline-sm text-[14px] font-bold text-on-surface truncate">
                              {v.name}
                            </h3>
                            {badge}
                          </div>
                          <div className="flex items-center text-outline font-body-sm text-[12px] gap-2 mb-1">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">groups</span>
                              {v.capacity} capacity
                            </span>
                            <span>•</span>
                            <span className="truncate">{v.building}</span>
                          </div>
                          <div className="flex items-center text-outline font-label-sm text-[11px] gap-1">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            <span>{timeText}</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  )
                })
              ) : (
                <div className="bg-surface-container-lowest rounded-xl border border-[#E7DED4] p-6 text-center text-outline">
                  No venues found.
                </div>
              )}
            </div>
          </section>

          {/* Upcoming Bookings */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-[16px] font-bold text-on-surface">Upcoming Confirmed Events</h2>
              <Link
                href="/calendar"
                className="font-label-lg text-primary-container hover:text-primary transition-colors flex items-center gap-0.5 active:scale-95"
              >
                <span>Calendar</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingBookings && upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking: BookingWithVenue) => (
                  <article
                    key={booking.id}
                    className="bg-surface-container-lowest rounded-xl border border-[#E7DED4] p-3 shadow-sm flex items-center gap-3 hover:border-primary-container/40 transition-all"
                  >
                    <div className="w-[62px] h-[62px] rounded-lg shrink-0 bg-surface-container flex items-center justify-center text-primary/40 border border-outline-variant/30">
                      <span className="material-symbols-outlined text-[32px]">event</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className="font-headline-sm text-[14px] font-bold text-on-surface truncate">
                          {booking.event_name}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EDF4EE] text-[#78977B] font-label-sm text-[11px] font-semibold shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#78977B]"></span>
                          Confirmed
                        </span>
                      </div>
                      <div className="flex items-center text-outline font-body-sm text-[12px] gap-2 mb-1">
                        <span className="flex items-center gap-1 truncate">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {Array.isArray(booking.venues) ? booking.venues[0]?.name : booking.venues?.name ?? 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center text-outline font-label-sm text-[11px] gap-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        <span>
                          {new Date(booking.start_at).toDateString() === new Date(booking.end_at).toDateString()
                            ? `${new Date(booking.start_at).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })} • ${new Date(booking.start_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`
                            : `${new Date(booking.start_at).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })} – ${new Date(booking.end_at).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                              })} • ${new Date(booking.start_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`}
                        </span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="bg-surface-container-lowest rounded-xl border border-[#E7DED4] p-6 text-center shadow-sm">
                  <span className="material-symbols-outlined text-outline/50 text-[48px] mb-2">event_busy</span>
                  <p className="font-body-md text-outline">No upcoming bookings scheduled.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right 1 Col: Quick Actions & Recent Requests */}
        <div className="space-y-6">
          <section className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] p-5 shadow-sm">
            <h3 className="font-headline-sm text-[16px] font-bold text-on-surface mb-4">Quick Actions</h3>
            <div className="space-y-2.5">
              <Link
                href="/dashboard/book"
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-primary-container text-white hover:bg-primary active:scale-[0.98] transition-all shadow-sm shadow-primary-container/30"
              >
                <span className="material-symbols-outlined text-[20px]">add_circle</span>
                <span className="font-label-lg font-semibold">Book a Venue</span>
              </Link>
              <Link
                href="/dashboard/availability"
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-surface-container border border-outline-variant/50 text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-primary">search</span>
                <span className="font-label-lg font-medium">Check Availability</span>
              </Link>
              <Link
                href="/calendar"
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-surface-container border border-outline-variant/50 text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-secondary">calendar_month</span>
                <span className="font-label-lg font-medium">Campus Calendar</span>
              </Link>
              <Link
                href="/dashboard/requests"
                className="flex items-center gap-3 w-full p-3 rounded-xl bg-surface-container border border-outline-variant/50 text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-[20px] text-tertiary">receipt_long</span>
                <span className="font-label-lg font-medium">My Booking Requests</span>
              </Link>
              {role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 w-full p-3 rounded-xl bg-surface-container border border-outline-variant/50 text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
                  <span className="font-label-lg font-medium">Admin Panel</span>
                </Link>
              )}
            </div>
          </section>

          {/* Recent Requests Summary */}
          <section className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-sm text-[16px] font-bold text-on-surface">Recent Requests</h3>
              <Link
                href="/dashboard/requests"
                className="font-label-md text-primary-container hover:text-primary flex items-center gap-0.5"
              >
                <span>All</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </Link>
            </div>
            <div className="space-y-2">
              {recentRequests && recentRequests.length > 0 ? (
                recentRequests.map((req: RequestWithVenue) => (
                  <div key={req.id} className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="font-label-md font-semibold text-on-surface truncate">{req.event_name}</p>
                      <p className="font-label-sm text-outline truncate">
                        {Array.isArray(req.venues) ? req.venues[0]?.name : req.venues?.name || 'Venue'}
                      </p>
                    </div>
                    <span className="font-label-sm px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] shrink-0 font-medium text-[11px]">
                      {req.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="font-body-sm text-outline text-center py-2">No recent booking requests.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
