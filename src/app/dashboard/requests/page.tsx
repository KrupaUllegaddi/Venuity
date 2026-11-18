import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReviewRequestsList } from './review-list'

interface BookingRequestItem {
  id: string
  event_name: string
  status: string
  venues: { name: string } | { name: string }[] | null
  start_at: string
  end_at: string
  expected_attendees: number
  created_at: string
  rejection_reason: string | null
}

export default async function RequestsPage(props: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const resolvedSearchParams = (await props.searchParams) || {}
  const currentTab = resolvedSearchParams?.tab || 'my'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user's profile for role and department info
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, department_id, full_name')
    .eq('id', user.id)
    .single()

  const isReviewer = profile?.role === 'HOD' || profile?.role === 'ADMIN'

  // Fetch user's own booking requests
  const { data: myRequests } = await supabase
    .from('booking_requests')
    .select('*, venues(name)')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })

  // If HOD or ADMIN, fetch pending requests that they are authorized to review
  let reviewRequests: Array<{
    id: string
    event_name: string
    status: string
    venue_name: string
    start_at: string
    end_at: string
    expected_attendees: number
    created_at: string
    faculty_coordinator?: string | null
    contact_info?: string | null
    description?: string | null
    requester_name?: string
    requester_email?: string
    department_name?: string
  }> = []

  if (isReviewer) {
    let query = supabase
      .from('booking_requests')
      .select('*, venues(name), departments(name), profiles:requester_id(full_name, email)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })

    if (profile?.role === 'HOD' && profile.department_id) {
      query = query.eq('department_id', profile.department_id)
    }

    const { data: pendingData } = await query

    if (pendingData) {
      reviewRequests = pendingData.map((r: {
        id: string
        event_name: string
        status: string
        start_at: string
        end_at: string
        expected_attendees: number
        created_at: string
        faculty_coordinator?: string | null
        contact_info?: string | null
        description?: string | null
        venues?: { name: string } | { name: string }[] | null
        departments?: { name: string } | { name: string }[] | null
        profiles?: { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null
      }) => {
        const vName = Array.isArray(r.venues) ? r.venues[0]?.name : r.venues?.name || 'Venue'
        const dName = Array.isArray(r.departments) ? r.departments[0]?.name : r.departments?.name || undefined
        const pObj = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
        return {
          id: r.id,
          event_name: r.event_name,
          status: r.status,
          venue_name: vName,
          start_at: r.start_at,
          end_at: r.end_at,
          expected_attendees: r.expected_attendees,
          created_at: r.created_at,
          faculty_coordinator: r.faculty_coordinator,
          contact_info: r.contact_info,
          description: r.description,
          requester_name: pObj?.full_name,
          requester_email: pObj?.email,
          department_name: dName,
        }
      })
    }
  }

  const showReviewTab = isReviewer && currentTab === 'review'

  return (
    <div className="mx-auto max-w-4xl px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 pb-28">
      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]">receipt_long</span>
            Booking Requests
          </h1>
          <p className="mt-1 font-body-sm text-body-sm text-outline">
            Track and monitor the status of campus venue reservations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/book"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:bg-[#C94B24] active:scale-95 transition-all self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            New Request
          </Link>
        </div>
      </div>

      {/* Tabs for HOD / Admin */}
      {isReviewer && (
        <div className="flex items-center gap-2 border-b border-surface-container-high mb-6 pb-2">
          <Link
            href="/dashboard/requests?tab=my"
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              !showReviewTab
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            My Requests ({myRequests?.length ?? 0})
          </Link>
          <Link
            href="/dashboard/requests?tab=review"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              showReviewTab
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span>Review Pending</span>
            {reviewRequests.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                showReviewTab ? 'bg-white text-primary' : 'bg-primary text-white'
              }`}>
                {reviewRequests.length}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Review Tab Content */}
      {showReviewTab ? (
        <ReviewRequestsList requests={reviewRequests} />
      ) : (
        /* User's Requests List */
        <div className="space-y-4">
          {myRequests && myRequests.length > 0 ? (
            myRequests.map((request: BookingRequestItem) => {
              const venueName = Array.isArray(request.venues) ? request.venues[0]?.name : request.venues?.name || 'Venue'
              const sDate = new Date(request.start_at)
              const eDate = new Date(request.end_at)

              return (
                <article
                  key={request.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 sm:p-5 shadow-[0_4px_16px_-2px_rgba(41,37,36,0.04)] hover:border-primary-container/40 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm font-semibold text-primary uppercase">
                          {venueName}
                        </span>
                      </div>
                      <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">
                        {request.event_name}
                      </h2>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 py-3 border-t border-b border-surface-container text-outline text-xs sm:text-body-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-outline">calendar_today</span>
                      <span>
                        {sDate.toDateString() === eDate.toDateString()
                          ? sDate.toLocaleDateString('en-IN', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })
                          : `${sDate.toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                            })} – ${eDate.toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: sDate.getFullYear() !== eDate.getFullYear() ? 'numeric' : undefined,
                            })}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-outline">schedule</span>
                      <span>
                        {sDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {eDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-outline">group</span>
                      <span>{request.expected_attendees} Attendees</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-outline">history</span>
                      <span>Req: {new Date(request.created_at).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>

                  {request.rejection_reason && (
                    <div className="mt-3 p-3 bg-error-container/50 text-on-error-container text-body-sm rounded-xl border border-error/20 flex items-start gap-2">
                      <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">error</span>
                      <div>
                        <span className="font-bold">Reason for Rejection:</span> {request.rejection_reason}
                      </div>
                    </div>
                  )}
                </article>
              )
            })
          ) : (
            <div className="p-12 text-center text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm">
              <span className="material-symbols-outlined text-[48px] opacity-30 mb-3">receipt_long</span>
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1">No requests found</h3>
              <p className="font-body-sm max-w-sm mx-auto mb-6 text-outline">
                You haven&apos;t submitted any booking requests yet. Check venue availability or start a new booking.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs mx-auto">
                <Link
                  href="/dashboard/availability"
                  className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-on-surface font-label-md hover:bg-surface-container transition-all"
                >
                  Check Availability
                </Link>
                <Link
                  href="/dashboard/book"
                  className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md font-semibold hover:bg-[#C94B24] transition-all shadow-sm"
                >
                  Book a Venue
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; dot: string; icon: string }> = {
    PENDING: {
      bg: 'bg-[#FEF3C7]',
      text: 'text-[#D97706]',
      dot: 'bg-[#D97706]',
      icon: 'hourglass_top',
    },
    APPROVED: {
      bg: 'bg-[#EDF4EE]',
      text: 'text-[#78977B]',
      dot: 'bg-[#78977B]',
      icon: 'check_circle',
    },
    CONFIRMED: {
      bg: 'bg-[#EDF4EE]',
      text: 'text-[#78977B]',
      dot: 'bg-[#78977B]',
      icon: 'check_circle',
    },
    REJECTED: {
      bg: 'bg-[#FDF1F1]',
      text: 'text-[#D66F6F]',
      dot: 'bg-[#D66F6F]',
      icon: 'cancel',
    },
    CANCELLED: {
      bg: 'bg-surface-variant',
      text: 'text-on-surface-variant',
      dot: 'bg-outline',
      icon: 'block',
    },
  }

  const conf = styles[status] || styles.PENDING

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${conf.bg} ${conf.text} font-label-sm text-[12px] font-semibold shrink-0`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`}></span>
      <span className="material-symbols-outlined text-[14px]">{conf.icon}</span>
      {status}
    </span>
  )
}
