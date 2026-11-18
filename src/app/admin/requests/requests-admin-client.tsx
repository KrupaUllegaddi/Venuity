'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Building2,
  Users,
  Calendar,
  X,
  ArrowUpDown,
  RotateCcw,
  Check,
  Copy,
  Info,
} from 'lucide-react'
import { approveRequestAction, rejectRequestAction } from '@/app/dashboard/requests/actions'

export interface AdminBookingRequest {
  id: string
  eventName: string
  description: string | null
  startAt: string
  endAt: string
  expectedAttendees: number
  facultyCoordinator: string | null
  contactInfo: string | null
  additionalRequirements: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | string
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  venueId: string
  venueName: string
  venueBuilding: string
  venueFloor: string
  venueCapacity: number
  venueType: string
  departmentId: string | null
  departmentName: string
  departmentCode: string
  requesterId: string
  requesterName: string
  requesterEmail: string
  requesterRole: string
}

interface RequestsAdminClientProps {
  initialRequests: AdminBookingRequest[]
}

export function RequestsAdminClient({ initialRequests }: RequestsAdminClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Modals state
  const [detailsRequest, setDetailsRequest] = useState<AdminBookingRequest | null>(null)
  const [approvingRequest, setApprovingRequest] = useState<AdminBookingRequest | null>(null)
  const [rejectingRequest, setRejectingRequest] = useState<AdminBookingRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)

  // Feedback states
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Overall counts calculated from all requests
  const counts = useMemo(() => {
    let pending = 0
    let approved = 0
    let rejected = 0
    let cancelled = 0

    initialRequests.forEach((r) => {
      if (r.status === 'PENDING') pending++
      else if (r.status === 'APPROVED') approved++
      else if (r.status === 'REJECTED') rejected++
      else if (r.status === 'CANCELLED') cancelled++
    })

    return {
      total: initialRequests.length,
      pending,
      approved,
      rejected,
      cancelled,
    }
  }, [initialRequests])

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return initialRequests
      .filter((r) => {
        // Status filter
        if (statusFilter !== 'ALL' && r.status !== statusFilter) {
          return false
        }

        // Date filter: check if the reservation span includes the selected date
        if (dateFilter) {
          const filterDateObj = new Date(dateFilter + 'T00:00:00')
          const sDate = new Date(r.startAt)
          const eDate = new Date(r.endAt)

          const filterDayStart = new Date(
            filterDateObj.getFullYear(),
            filterDateObj.getMonth(),
            filterDateObj.getDate(),
            0,
            0,
            0
          )
          const filterDayEnd = new Date(
            filterDateObj.getFullYear(),
            filterDateObj.getMonth(),
            filterDateObj.getDate(),
            23,
            59,
            59,
            999
          )

          const overlaps = eDate >= filterDayStart && sDate <= filterDayEnd
          if (!overlaps) return false
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const matchesEvent = r.eventName.toLowerCase().includes(q)
          const matchesVenue = r.venueName.toLowerCase().includes(q)
          const matchesRequester = r.requesterName.toLowerCase().includes(q)
          const matchesEmail = r.requesterEmail.toLowerCase().includes(q)
          const matchesDept = r.departmentName.toLowerCase().includes(q) || r.departmentCode.toLowerCase().includes(q)
          const matchesId = r.id.toLowerCase().includes(q)
          const matchesDesc = (r.description || '').toLowerCase().includes(q)

          if (!matchesEvent && !matchesVenue && !matchesRequester && !matchesEmail && !matchesDept && !matchesId && !matchesDesc) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime()
        const timeB = new Date(b.createdAt).getTime()
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB
      })
  }, [initialRequests, searchQuery, statusFilter, dateFilter, sortOrder])

  // Copy ID helper
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Handle Approve
  const handleConfirmApprove = () => {
    if (!approvingRequest) return
    const id = approvingRequest.id
    const eventName = approvingRequest.eventName

    setFeedback(null)
    startTransition(async () => {
      const res = await approveRequestAction(id)
      if (res.error) {
        setFeedback({ type: 'error', message: res.error })
      } else {
        setFeedback({ type: 'success', message: `Approved "${eventName}" successfully!` })
        setApprovingRequest(null)
        setDetailsRequest(null)
        router.refresh()
      }
    })
  }

  // Handle Reject
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingRequest) return

    if (!rejectReason.trim() || rejectReason.trim().length < 3) {
      setRejectError('Please provide a rejection reason (minimum 3 characters)')
      return
    }

    const id = rejectingRequest.id
    const eventName = rejectingRequest.eventName

    setRejectError(null)
    setFeedback(null)

    const formData = new FormData()
    formData.append('requestId', id)
    formData.append('reason', rejectReason.trim())

    startTransition(async () => {
      const res = await rejectRequestAction(null, formData)
      if (res.error) {
        setRejectError(res.error)
      } else {
        setFeedback({ type: 'success', message: `Rejected booking request for "${eventName}".` })
        setRejectingRequest(null)
        setRejectReason('')
        setDetailsRequest(null)
        router.refresh()
      }
    })
  }

  // Format Date Range
  const formatDateRange = (startIso: string, endIso: string) => {
    const sDate = new Date(startIso)
    const eDate = new Date(endIso)
    const isSingleDay = sDate.toDateString() === eDate.toDateString()

    if (isSingleDay) {
      return sDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }

    return `${sDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    })} – ${eDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  }

  // Format Time Range
  const formatTimeRange = (startIso: string, endIso: string) => {
    const sDate = new Date(startIso)
    const eDate = new Date(endIso)
    return `${sDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – ${eDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
  }

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="size-3 text-amber-600" />
            <span>Pending</span>
          </span>
        )
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="size-3 text-emerald-600" />
            <span>Approved</span>
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="size-3 text-rose-600" />
            <span>Rejected</span>
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
            <span>Cancelled</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-start justify-between gap-3 border shadow-sm transition-all ${feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-error-container/70 text-on-error-container border-error/30'
            }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="size-5 text-error shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground text-xs p-1"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* 1. Overview Cards (Pending, Approved, Rejected, Total) */}
      <section aria-label="Requests Overview" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'ALL'
              ? 'border-primary ring-2 ring-primary/20 bg-surface-container-lowest shadow-sm'
              : 'border-[#E7DED4] bg-surface-container-lowest hover:border-primary/40'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-outline uppercase tracking-wider">Total Requests</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline">
              <CalendarDays className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-on-surface">{counts.total}</p>
          <p className="text-xs text-outline mt-0.5">All booking submissions</p>
        </button>

        {/* Pending */}
        <button
          type="button"
          onClick={() => setStatusFilter('PENDING')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'PENDING'
              ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/60 shadow-sm'
              : 'border-amber-200/80 bg-amber-50/40 hover:border-amber-300'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900">{counts.pending}</p>
          <p className="text-xs text-amber-700/80 mt-0.5">Awaiting administrative review</p>
        </button>

        {/* Approved */}
        <button
          type="button"
          onClick={() => setStatusFilter('APPROVED')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'APPROVED'
              ? 'border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-50/60 shadow-sm'
              : 'border-emerald-200/80 bg-emerald-50/40 hover:border-emerald-300'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Approved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{counts.approved}</p>
          <p className="text-xs text-emerald-700/80 mt-0.5">Confirmed venue allocations</p>
        </button>

        {/* Rejected */}
        <button
          type="button"
          onClick={() => setStatusFilter('REJECTED')}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${statusFilter === 'REJECTED'
              ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/60 shadow-sm'
              : 'border-rose-200/80 bg-rose-50/40 hover:border-rose-300'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Rejected</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
              <XCircle className="size-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-900">{counts.rejected}</p>
          <p className="text-xs text-rose-700/80 mt-0.5">Declined reservation requests</p>
        </button>
      </section>

      {/* 2. Filters & Search Control Bar */}
      <section aria-label="Filters and Search" className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-3.5 size-4.5 text-outline pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event, venue, requester, department, or request ID..."
              className="w-full h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl pl-10 pr-9 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-outline hover:text-on-surface p-1"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-3.5 pr-8 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="ALL">All Statuses ({counts.total})</option>
                <option value="PENDING">Pending Only ({counts.pending})</option>
                <option value="APPROVED">Approved ({counts.approved})</option>
                <option value="REJECTED">Rejected ({counts.rejected})</option>
                {counts.cancelled > 0 && <option value="CANCELLED">Cancelled ({counts.cancelled})</option>}
              </select>
              <Filter className="absolute right-3 top-3.5 size-4 text-outline pointer-events-none" />
            </div>

            {/* Date filter */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-11 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-3 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Sort toggle */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              title={`Sort by submission date: ${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}`}
              className="h-11 px-3 bg-surface-container-lowest border border-[#E7DED4] rounded-xl text-outline hover:text-on-surface flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 transition-all"
            >
              <ArrowUpDown className="size-4" />
              <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>

            {/* Clear filters button */}
            {(searchQuery || statusFilter !== 'ALL' || dateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('ALL')
                  setDateFilter('')
                }}
                className="h-11 px-3 bg-surface-container rounded-xl text-xs font-semibold text-outline hover:text-on-surface flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter feedback tags */}
        {(searchQuery || statusFilter !== 'ALL' || dateFilter) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-outline">
            <span>Active filters:</span>
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-medium border border-outline-variant/40">
                Status: {statusFilter}
                <button type="button" onClick={() => setStatusFilter('ALL')} className="hover:text-primary">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {dateFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-medium border border-outline-variant/40">
                Date: {dateFilter}
                <button type="button" onClick={() => setDateFilter('')} className="hover:text-primary">
                  <X className="size-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-medium border border-outline-variant/40">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-primary">
                  <X className="size-3" />
                </button>
              </span>
            )}
            <span className="ml-auto font-medium text-on-surface-variant">
              Showing {filteredRequests.length} of {initialRequests.length} requests
            </span>
          </div>
        )}
      </section>

      {/* 3. Booking Requests Table */}
      <section aria-label="Booking Requests Table" className="bg-surface-container-lowest rounded-2xl border border-[#E7DED4] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-[#FFF0E8]/40 border-b border-[#E7DED4] text-outline text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th scope="col" className="px-4 py-3.5">Request ID</th>
                <th scope="col" className="px-4 py-3.5">Venue</th>
                <th scope="col" className="px-4 py-3.5">Requested By</th>
                <th scope="col" className="px-4 py-3.5">Department</th>
                <th scope="col" className="px-4 py-3.5">Booking Date</th>
                <th scope="col" className="px-4 py-3.5">Time Slot</th>
                <th scope="col" className="px-4 py-3.5">Purpose</th>
                <th scope="col" className="px-4 py-3.5 text-center">Status</th>
                <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DED4]/60">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-outline">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
                        <CalendarDays className="size-6 opacity-60" />
                      </div>
                      <h3 className="font-headline-sm font-semibold text-on-surface">No Requests Found</h3>
                      <p className="text-xs text-outline">
                        {initialRequests.length === 0
                          ? 'No booking requests have been submitted across the campus yet.'
                          : 'No requests matched the current search criteria or status/date filters.'}
                      </p>
                      {(searchQuery || statusFilter !== 'ALL' || dateFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setStatusFilter('ALL')
                            setDateFilter('')
                          }}
                          className="mt-2 text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const shortId = request.id.slice(0, 8).toUpperCase()
                  const isPendingRow = request.status === 'PENDING'

                  return (
                    <tr
                      key={request.id}
                      className="hover:bg-[#FFF7ED]/50 transition-colors group"
                    >
                      {/* 1. Request ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-outline">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailsRequest(request)}
                            className="font-semibold text-on-surface hover:text-primary transition-colors cursor-pointer"
                            title="View request details"
                          >
                            #{shortId}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyId(request.id)}
                            className="text-outline/50 hover:text-on-surface p-0.5 rounded cursor-pointer"
                            title="Copy full UUID"
                          >
                            {copiedId === request.id ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. Venue */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface text-sm">
                            {request.venueName}
                          </span>
                          <span className="text-xs text-outline">
                            {request.venueBuilding} · {request.venueFloor}
                          </span>
                        </div>
                      </td>

                      {/* 3. Requested By */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface text-sm">
                            {request.requesterName}
                          </span>
                          <span className="text-xs text-outline">
                            {request.requesterEmail}
                          </span>
                        </div>
                      </td>

                      {/* 4. Department */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-surface-container text-on-surface-variant">
                          {request.departmentCode || request.departmentName}
                        </span>
                      </td>

                      {/* 5. Booking Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface font-medium">
                          <Calendar className="size-3.5 text-outline shrink-0" />
                          <span>{formatDateRange(request.startAt, request.endAt)}</span>
                        </div>
                      </td>

                      {/* 6. Time Slot */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-outline">
                          <Clock className="size-3.5 text-outline shrink-0" />
                          <span>{formatTimeRange(request.startAt, request.endAt)}</span>
                        </div>
                      </td>

                      {/* 7. Purpose */}
                      <td className="px-4 py-3.5 max-w-[200px]">
                        <p className="text-xs font-medium text-on-surface truncate" title={request.eventName}>
                          {request.eventName}
                        </p>
                        {request.description && (
                          <p className="text-[11px] text-outline truncate" title={request.description}>
                            {request.description}
                          </p>
                        )}
                      </td>

                      {/* 8. Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {renderStatusBadge(request.status)}
                      </td>

                      {/* 9. Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => setDetailsRequest(request)}
                            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                            title="View full booking details"
                          >
                            <Eye className="size-4" />
                          </button>

                          {/* Approve & Reject buttons only for PENDING requests */}
                          {isPendingRow && (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setApprovingRequest(request)}
                                className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer disabled:opacity-50"
                                title="Approve booking request"
                              >
                                <Check className="size-4" />
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                  setRejectingRequest(request)
                                  setRejectReason('')
                                  setRejectError(null)
                                }}
                                className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                title="Reject booking request"
                              >
                                <X className="size-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. MODAL: View Booking Request Details */}
      {detailsRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl sm:rounded-3xl border border-[#E7DED4] shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#E7DED4]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-outline">
                    #{detailsRequest.id}
                  </span>
                  {renderStatusBadge(detailsRequest.status)}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-on-surface">
                  {detailsRequest.eventName}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailsRequest(null)}
                className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Description */}
            {detailsRequest.description && (
              <div>
                <h4 className="text-xs font-semibold text-outline uppercase tracking-wider mb-1">Event Description</h4>
                <p className="text-sm text-on-surface bg-surface-container-low p-3 rounded-xl border border-outline-variant/30 leading-relaxed">
                  {detailsRequest.description}
                </p>
              </div>
            )}

            {/* Grid Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {/* Venue */}
              <div className="p-3 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
                <span className="text-xs font-semibold text-outline flex items-center gap-1">
                  <Building2 className="size-3.5 text-primary" />
                  Venue Allocation
                </span>
                <p className="font-bold text-on-surface">{detailsRequest.venueName}</p>
                <p className="text-xs text-outline">
                  {detailsRequest.venueBuilding} · {detailsRequest.venueFloor}
                </p>
                <p className="text-xs text-outline">
                  Capacity: <strong className="text-on-surface">{detailsRequest.venueCapacity}</strong>
                </p>
              </div>

              {/* Requester */}
              <div className="p-3 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
                <span className="text-xs font-semibold text-outline flex items-center gap-1">
                  <Users className="size-3.5 text-primary" />
                  Requested By
                </span>
                <p className="font-bold text-on-surface">{detailsRequest.requesterName}</p>
                <p className="text-xs text-outline">{detailsRequest.requesterEmail}</p>
                <p className="text-xs text-outline">
                  Dept: <strong className="text-on-surface">{detailsRequest.departmentName}</strong>
                </p>
              </div>

              {/* Schedule */}
              <div className="p-3 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
                <span className="text-xs font-semibold text-outline flex items-center gap-1">
                  <Calendar className="size-3.5 text-primary" />
                  Booking Dates
                </span>
                <p className="font-semibold text-on-surface">
                  {formatDateRange(detailsRequest.startAt, detailsRequest.endAt)}
                </p>
                <p className="text-xs text-outline">
                  Time: {formatTimeRange(detailsRequest.startAt, detailsRequest.endAt)}
                </p>
              </div>

              {/* Attendees & Coordination */}
              <div className="p-3 rounded-xl border border-[#E7DED4] bg-surface-container-lowest space-y-1">
                <span className="text-xs font-semibold text-outline flex items-center gap-1">
                  <Info className="size-3.5 text-primary" />
                  Attendees & Contact
                </span>
                <p className="font-semibold text-on-surface">
                  {detailsRequest.expectedAttendees} Attendees
                </p>
                <p className="text-xs text-outline truncate">
                  Coord: {detailsRequest.facultyCoordinator || 'None specified'}
                </p>
                {detailsRequest.contactInfo && (
                  <p className="text-xs text-outline truncate">Contact: {detailsRequest.contactInfo}</p>
                )}
              </div>
            </div>

            {/* Additional Requirements */}
            {detailsRequest.additionalRequirements && (
              <div>
                <h4 className="text-xs font-semibold text-outline uppercase tracking-wider mb-1">
                  Special Requirements / Equipment
                </h4>
                <p className="text-xs text-on-surface-variant bg-surface-container p-3 rounded-xl border border-outline-variant/40">
                  {detailsRequest.additionalRequirements}
                </p>
              </div>
            )}

            {/* Rejection Reason if Rejected */}
            {detailsRequest.rejectionReason && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="size-4" />
                  Reason for Rejection
                </span>
                <p className="text-xs sm:text-sm font-medium">{detailsRequest.rejectionReason}</p>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-[11px] text-outline flex items-center justify-between pt-1">
              <span>Submitted: {new Date(detailsRequest.createdAt).toLocaleString('en-IN')}</span>
              <span>Updated: {new Date(detailsRequest.updatedAt).toLocaleString('en-IN')}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E7DED4]">
              {detailsRequest.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingRequest(detailsRequest)
                      setRejectReason('')
                      setRejectError(null)
                    }}
                    className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 font-semibold text-xs sm:text-sm hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Reject Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovingRequest(detailsRequest)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs sm:text-sm hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm"
                  >
                    Approve Request
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setDetailsRequest(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DED4] text-on-surface font-semibold text-xs sm:text-sm hover:bg-surface-container transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: Approve Confirmation */}
      {approvingRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-[#E7DED4] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <h3 className="font-headline-sm font-bold text-on-surface text-base sm:text-lg">
                  Confirm Approval
                </h3>
                <p className="text-xs text-outline">Authorize venue reservation</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#E7DED4] text-xs space-y-1.5 text-on-surface">
              <p>
                <strong>Event:</strong> {approvingRequest.eventName}
              </p>
              <p>
                <strong>Venue:</strong> {approvingRequest.venueName}
              </p>
              <p>
                <strong>Schedule:</strong> {formatDateRange(approvingRequest.startAt, approvingRequest.endAt)} (
                {formatTimeRange(approvingRequest.startAt, approvingRequest.endAt)})
              </p>
              <p>
                <strong>Requested by:</strong> {approvingRequest.requesterName} (
                {approvingRequest.departmentName})
              </p>
            </div>

            <p className="text-xs text-outline leading-relaxed">
              Approving this request will officially confirm the booking in the campus calendar, reserve the venue, and automatically update conflicting pending requests.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DED4] text-xs sm:text-sm font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmApprove}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Reject Confirmation */}
      {rejectingRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-[#E7DED4] shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-headline-sm font-bold text-on-surface text-base sm:text-lg">
                  Reject Booking Request
                </h3>
                <p className="text-xs text-outline">Decline venue reservation</p>
              </div>
            </div>

            <p className="text-xs text-outline leading-relaxed">
              Please enter the specific reason for rejecting <strong>&ldquo;{rejectingRequest.eventName}&rdquo;</strong>. This reason will be logged and communicated to the requester.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label htmlFor="rejectionReason" className="text-xs font-semibold text-on-surface block mb-1">
                  Reason for Rejection <span className="text-rose-600">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value)
                    if (rejectError) setRejectError(null)
                  }}
                  placeholder="e.g. Scheduled university maintenance during this window, or priority department event."
                  className="w-full text-xs sm:text-sm bg-surface-container-lowest border border-[#E7DED4] rounded-xl p-3 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 resize-none transition-colors"
                />
                {rejectError && <p className="text-xs text-rose-600 mt-1 font-medium">{rejectError}</p>}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setRejectingRequest(null)
                    setRejectReason('')
                    setRejectError(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-[#E7DED4] text-xs sm:text-sm font-semibold text-outline hover:text-on-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <>
                      <X className="size-4" />
                      <span>Confirm Rejection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
