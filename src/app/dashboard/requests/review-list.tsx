'use client'

import { useState, useTransition } from 'react'
import { approveRequestAction, rejectRequestAction } from './actions'
import { useRouter } from 'next/navigation'

interface RequestItem {
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
}

export function ReviewRequestsList({ requests }: { requests: RequestItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [activeSuccess, setActiveSuccess] = useState<string | null>(null)

  const handleApprove = (id: string, eventName: string) => {
    setActionError(null)
    setActiveSuccess(null)
    startTransition(async () => {
      const res = await approveRequestAction(id)
      if (res.error) {
        setActionError(res.error)
      } else {
        setActiveSuccess(`Approved "${eventName}" successfully!`)
        router.refresh()
      }
    })
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingId) return
    setActionError(null)
    setActiveSuccess(null)

    const formData = new FormData()
    formData.append('requestId', rejectingId)
    formData.append('reason', rejectReason)

    startTransition(async () => {
      const res = await rejectRequestAction(null, formData)
      if (res.error) {
        setActionError(res.error)
      } else {
        setActiveSuccess('Booking request rejected.')
        setRejectingId(null)
        setRejectReason('')
        router.refresh()
      }
    })
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-outline bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm">
        <span className="material-symbols-outlined text-[40px] opacity-40 mb-2">task_alt</span>
        <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-1">
          No Pending Requests
        </h3>
        <p className="font-body-sm text-outline max-w-sm mx-auto">
          All booking requests have been reviewed or none have been submitted yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container text-body-sm border border-error/30 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-error">error</span>
          <span>{actionError}</span>
        </div>
      )}

      {activeSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-body-sm border border-emerald-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
          <span>{activeSuccess}</span>
        </div>
      )}

      {requests.map((request) => {
        const sDate = new Date(request.start_at)
        const eDate = new Date(request.end_at)
        const isThisRejecting = rejectingId === request.id

        return (
          <article
            key={request.id}
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 p-4 sm:p-5 shadow-sm hover:border-primary-container/40 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-label-sm text-label-sm font-semibold text-primary uppercase">
                    {request.venue_name}
                  </span>
                  {request.department_name && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                      {request.department_name}
                    </span>
                  )}
                  {request.requester_name && (
                    <span className="text-xs text-outline">
                      by {request.requester_name}
                    </span>
                  )}
                </div>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface mt-0.5">
                  {request.event_name}
                </h2>
                {request.description && (
                  <p className="font-body-sm text-outline mt-1 line-clamp-2">
                    {request.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  PENDING REVIEW
                </span>
              </div>
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
                <span className="material-symbols-outlined text-[17px] text-outline">person</span>
                <span className="truncate">{request.faculty_coordinator || 'No Coordinator'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-3 pt-1">
              {!isThisRejecting ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(request.id)
                      setRejectReason('')
                    }}
                    disabled={isPending}
                    className="px-4 py-2 rounded-xl text-error font-label-md text-label-md font-semibold border border-error/30 hover:bg-error-container/40 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(request.id, request.event_name)}
                    disabled={isPending}
                    className="px-5 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:bg-[#C94B24] active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Approve
                  </button>
                </>
              ) : (
                <form onSubmit={handleRejectSubmit} className="w-full flex flex-col sm:flex-row gap-2 mt-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    required
                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-outline-variant bg-surface-container-lowest focus:border-primary focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectingId(null)}
                      className="px-3 py-2 rounded-xl text-outline hover:bg-surface-container font-label-sm text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="px-4 py-2 rounded-xl bg-error text-white font-label-sm text-sm font-semibold hover:bg-error/90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </form>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
