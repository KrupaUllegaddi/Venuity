'use client'

import { useActionState, useState } from 'react'
import { submitBookingRequest, type BookingActionState } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getVenueImageUrl, type VenueSpecifications } from '@/lib/venue-utils'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Info,
  Users,
  AlertCircle,
} from 'lucide-react'

interface DepartmentOption {
  id: string
  name: string
  code: string
}

interface VenueOption {
  id: string
  name: string
  slug?: string
  capacity: number
  building: string
  floor: string
  type: string
  image_url?: string | null
  images?: string[] | null
  specifications?: VenueSpecifications | null
  venue_facilities?: { facilities: { name: string } | { name: string }[] | null }[]
}

interface BookingRequestFormProps {
  selectedVenue: VenueOption | null
  departments: DepartmentOption[]
  userProfile: { full_name: string; department_id: string | null } | null
  prefilledDate?: string
  prefilledEndDate?: string
  prefilledStart?: string
  prefilledEnd?: string
  prefilledAttendees?: string
}

const initialActionState: BookingActionState = {
  error: undefined,
  success: false,
}

export function BookingRequestForm({
  selectedVenue,
  departments,
  userProfile,
  prefilledDate = '',
  prefilledEndDate = '',
  prefilledStart = '',
  prefilledEnd = '',
  prefilledAttendees = '',
}: BookingRequestFormProps) {
  const [state, formAction, isPending] = useActionState(submitBookingRequest, initialActionState)
  const router = useRouter()

  // State for availability forwarding when no venue is preselected
  const [date, setDate] = useState(prefilledDate || new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(prefilledEndDate || prefilledDate || new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(prefilledStart || '09:00')
  const [endTime, setEndTime] = useState(prefilledEnd || '11:00')
  const [attendees, setAttendees] = useState(prefilledAttendees || (selectedVenue ? '20' : '50'))
  const [clientError, setClientError] = useState<string | null>(null)

  if (state?.success) {
    return (
      <div className="bg-[#FFF7ED] min-h-[calc(100vh-160px)] text-on-surface antialiased flex justify-center py-6 px-3">
        <div className="w-full max-w-[420px] bg-surface-container-lowest shadow-[0_4px_24px_-4px_rgba(41,37,36,0.08)] rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center border border-outline-variant/30">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5 sm:mb-6">
            <CheckCircle2 className="size-8 sm:size-10 text-emerald-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">Request Submitted!</h2>
          <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
            Your booking request for{' '}
            <span className="font-semibold text-on-surface">{selectedVenue?.name || 'the venue'}</span> has been sent. It
            is currently <strong className="text-[#FF6835]">PENDING</strong> approval.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Link
              href="/dashboard/requests"
              className="w-full h-12 rounded-xl bg-[#FF6835] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-[#C94B24] active:scale-95 transition-all cursor-pointer"
            >
              <span>View My Requests</span>
              <FileText className="size-4.5" />
            </Link>
            <Link
              href="/dashboard"
              className="w-full h-12 rounded-xl bg-surface-container-low border border-outline-variant/60 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Handle form submission, client validation, and availability redirect
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (endDate < date) {
      e.preventDefault()
      setClientError('End date cannot be earlier than start date')
      return
    }
    if (endDate === date && endTime <= startTime) {
      e.preventDefault()
      setClientError('End time must be after start time')
      return
    }
    setClientError(null)

    if (!selectedVenue) {
      e.preventDefault()
      const form = e.currentTarget
      const formData = new FormData(form)
      const d = formData.get('date') as string
      const endD = (formData.get('endDate') as string) || d
      const s = formData.get('startTime') as string
      const end = formData.get('endTime') as string
      const att = formData.get('expectedAttendees') as string

      const queryParams = new URLSearchParams({
        date: d,
        endDate: endD,
        startTime: s,
        endTime: end,
        capacity: att || '20',
      })

      const facilities = formData.getAll('facilities')
      facilities.forEach((f) => queryParams.append('facilities', f as string))

      router.push(`/dashboard/availability?${queryParams.toString()}`)
    }
  }

  return (
    <main className="w-full max-w-2xl mx-auto bg-[#FFF7ED] shadow-[0_4px_24px_-4px_rgba(41,37,36,0.08)] flex flex-col relative rounded-2xl sm:rounded-3xl border border-outline-variant/30 overflow-hidden">
      {/* Top App Navigation */}
      <nav className="w-full px-4 sm:px-6 py-4 flex items-center gap-3 bg-surface-container-lowest border-b border-outline-variant/30 sticky top-0 z-10">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest hover:bg-surface-container-high transition-colors active:scale-95 duration-150 border border-outline-variant/60 text-on-surface shadow-sm cursor-pointer"
          type="button"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-lg sm:text-xl font-bold text-on-surface leading-tight">
            {selectedVenue ? `Book ${selectedVenue.name}` : 'Book a Venue'}
          </h1>
          <p className="text-xs text-outline tracking-normal">
            {selectedVenue
              ? `${selectedVenue.building} · Capacity ${selectedVenue.capacity}`
              : 'Campus Reservation System'}
          </p>
        </div>
      </nav>

      {/* Content Canvas */}
      <div className="px-4 sm:px-6 pt-4 pb-8 flex-1 flex flex-col gap-4 bg-surface-container-lowest">
        {/* Department Priority Notice Card */}
        <section className="bg-[#FFF0E8] border border-[#FF6835]/25 rounded-xl p-3.5 flex gap-3 items-start shadow-sm">
          <div className="w-6 h-6 rounded-full bg-[#FF6835]/15 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="size-4 text-[#FF6835]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-xs sm:text-sm font-semibold text-[#292524] leading-tight">
              Department Booking Priority
            </h2>
            <p className="text-xs text-[#78716C] leading-snug">
              Requests are subject to venue availability and departmental approval.
            </p>
          </div>
        </section>

        {/* Selected Venue Compact Overview Card */}
        {selectedVenue && (
          <section className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col gap-3">
            <div className="flex gap-3 sm:gap-4 items-center">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container">
                <Image
                  src={getVenueImageUrl(selectedVenue)}
                  alt={selectedVenue.name}
                  fill
                  sizes="96px"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-[11px] font-semibold tracking-wide text-primary uppercase">
                    {selectedVenue.type.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-on-surface truncate">
                  {selectedVenue.name}
                </h2>
                <p className="text-xs text-outline mt-0.5">
                  {selectedVenue.building} · Floor: {selectedVenue.floor}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-lowest text-xs font-medium text-on-surface border border-outline-variant/40">
                    <Users className="size-3 text-outline" />
                    <span>Max {selectedVenue.capacity}</span>
                  </span>
                  {selectedVenue.specifications?.seating?.total_capacity && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-lowest text-xs font-medium text-on-surface border border-outline-variant/40">
                      <span>Seating: {selectedVenue.specifications.seating.total_capacity}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Compact Specs & Amenities Highlights */}
            <div className="pt-2 border-t border-outline-variant/30 flex flex-wrap gap-1.5 sm:gap-2">
              {selectedVenue.specifications?.visual?.projectors && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-lowest text-[11px] font-medium text-on-surface-variant border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[14px] text-primary">videocam</span>
                  {selectedVenue.specifications.visual.projectors} Projector(s)
                </span>
              )}
              {selectedVenue.specifications?.visual?.led_screen && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-lowest text-[11px] font-medium text-on-surface-variant border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[14px] text-primary">tv</span>
                  LED Wall: {selectedVenue.specifications.visual.led_screen}
                </span>
              )}
              {selectedVenue.specifications?.audio?.microphones_total && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-lowest text-[11px] font-medium text-on-surface-variant border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[14px] text-primary">mic</span>
                  {selectedVenue.specifications.audio.microphones_total} Microphones
                </span>
              )}
              {selectedVenue.specifications?.audio?.speakers_total && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-lowest text-[11px] font-medium text-on-surface-variant border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[14px] text-primary">volume_up</span>
                  {selectedVenue.specifications.audio.speakers_total} Speakers
                </span>
              )}
              {selectedVenue.specifications?.facilities?.ac && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-lowest text-[11px] font-medium text-on-surface-variant border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[14px] text-primary">mode_fan</span>
                  AC: {String(selectedVenue.specifications.facilities.ac)}
                </span>
              )}
              {selectedVenue.specifications?.stage?.size && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-lowest text-[11px] font-medium text-on-surface-variant border border-outline-variant/30">
                  <span className="material-symbols-outlined text-[14px] text-primary">stage</span>
                  Stage: {selectedVenue.specifications.stage.size}
                </span>
              )}
              <Link
                href={`/venues/${selectedVenue.id}`}
                target="_blank"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-semibold transition-colors ml-auto"
              >
                <span>View Full Specifications & Gallery</span>
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              </Link>
            </div>
          </section>
        )}

        {/* Form */}
        <form
          action={selectedVenue ? formAction : undefined}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 pt-1"
        >
          {selectedVenue && <input type="hidden" name="venueId" value={selectedVenue.id} />}

          {/* Event Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-0.5" htmlFor="eventName">
              <span>Event Name</span>
              <span className="text-[#FF6835] text-xs">*</span>
            </label>
            <div className="relative">
              <input
                id="eventName"
                name="eventName"
                type="text"
                required
                placeholder="Enter event title (e.g. Guest Lecture on AI)"
                className="w-full h-11 sm:h-12 bg-surface-container-lowest border border-[#E7DED4] rounded-xl px-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-[#FF6835] focus:ring-1 focus:ring-[#FF6835] shadow-[0_2px_6px_-1px_rgba(41,37,36,0.03)] transition-colors"
              />
            </div>
          </div>

          {/* Department Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-0.5" htmlFor="department">
              <span>Department</span>
              <span className="text-[#FF6835] text-xs">*</span>
            </label>
            <div className="relative flex items-center">
              <Building2 className="absolute left-3.5 size-4.5 text-[#8E7168] pointer-events-none" />
              <select
                id="department"
                name="department"
                defaultValue={userProfile?.department_id || ''}
                required
                className="w-full h-11 sm:h-12 bg-surface-container-lowest border border-[#E7DED4] rounded-xl pl-10 pr-10 text-sm text-on-surface focus:outline-none focus:border-[#FF6835] focus:ring-1 focus:ring-[#FF6835] appearance-none shadow-[0_2px_6px_-1px_rgba(41,37,36,0.03)] cursor-pointer transition-colors"
              >
                <option value="" disabled>
                  Select your department
                </option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 size-4.5 text-[#8E7168] pointer-events-none" />
            </div>
          </div>

          {/* Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-0.5" htmlFor="date">
                <span>Start Date</span>
                <span className="text-[#FF6835] text-xs">*</span>
              </label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3.5 size-4.5 text-[#8E7168] pointer-events-none" />
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    const newStart = e.target.value
                    setDate(newStart)
                    if (endDate && endDate < newStart) {
                      setEndDate(newStart)
                    }
                    if (clientError) setClientError(null)
                  }}
                  className="w-full h-11 sm:h-12 bg-surface-container-lowest border border-[#E7DED4] rounded-xl pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-[#FF6835] focus:ring-1 focus:ring-[#FF6835] shadow-[0_2px_6px_-1px_rgba(41,37,36,0.03)] transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-0.5" htmlFor="endDate">
                <span>End Date</span>
                <span className="text-[#FF6835] text-xs">*</span>
              </label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3.5 size-4.5 text-[#8E7168] pointer-events-none" />
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  min={date}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    if (clientError) setClientError(null)
                  }}
                  className={`w-full h-11 sm:h-12 bg-surface-container-lowest border rounded-xl pl-10 pr-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 shadow-[0_2px_6px_-1px_rgba(41,37,36,0.03)] transition-colors ${
                    endDate && date && endDate < date
                      ? 'border-error focus:border-error focus:ring-error'
                      : 'border-[#E7DED4] focus:border-[#FF6835] focus:ring-[#FF6835]'
                  }`}
                />
              </div>
              {endDate && date && endDate < date && (
                <span className="text-xs text-error font-medium">End date cannot be earlier than start date</span>
              )}
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-0.5" htmlFor="startTime">
                <span>Start Time</span>
                <span className="text-[#FF6835] text-xs">*</span>
              </label>
              <div className="relative flex items-center">
                <Clock className="absolute left-2.5 sm:left-3 size-4 text-[#8E7168] pointer-events-none" />
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-11 sm:h-12 bg-surface-container-lowest border border-[#E7DED4] rounded-xl pl-8 sm:pl-9 pr-1.5 sm:pr-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-[#FF6835] focus:ring-1 focus:ring-[#FF6835] shadow-[0_2px_6px_-1px_rgba(41,37,36,0.03)] transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-0.5" htmlFor="endTime">
                <span>End Time</span>
                <span className="text-[#FF6835] text-xs">*</span>
              </label>
              <div className="relative flex items-center">
                <Clock className="absolute left-2.5 sm:left-3 size-4 text-[#8E7168] pointer-events-none" />
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-11 sm:h-12 bg-surface-container-lowest border border-[#E7DED4] rounded-xl pl-8 sm:pl-9 pr-1.5 sm:pr-2 text-xs sm:text-sm text-on-surface focus:outline-none focus:border-[#FF6835] focus:ring-1 focus:ring-[#FF6835] shadow-[0_2px_6px_-1px_rgba(41,37,36,0.03)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Expected Attendees */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface flex items-center gap-0.5" htmlFor="expectedAttendees">
              <span>Expected Attendees</span>
              <span className="text-[#FF6835] text-xs">*</span>
            </label>
            <div className="relative flex items-center">
              <Users className="absolute left-3.5 size-4.5 text-[#8E7168] pointer-events-none" />
              <input
                id="expectedAttendees"
                name="expectedAttendees"
                type="number"
                min="1"
                max={selectedVenue ? selectedVenue.capacity : 2000}
                required
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="Number of participants"
                className="w-full h-11 sm:h-12 bg-surface-container-lowest border border-[#E7DED4] rounded-xl pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-[#FF6835] focus:ring-1 focus:ring-[#FF6835] shadow-[0_2px_6px_-1px_rgba(41,37,36,0.03)] transition-colors"
              />
            </div>
          </div>

          {/* Required Facilities Checkboxes */}
          <fieldset className="flex flex-col gap-2 pt-0.5">
            <legend className="text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">Required Facilities</legend>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest border border-[#E7DED4] cursor-pointer hover:bg-surface-container-low transition-colors">
                <input
                  defaultChecked
                  className="w-4 h-4 rounded text-[#FF6835] focus:ring-0 cursor-pointer accent-[#FF6835]"
                  name="facilities"
                  type="checkbox"
                  value="Projector"
                />
                <span className="text-xs sm:text-sm text-on-surface">Projector</span>
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest border border-[#E7DED4] cursor-pointer hover:bg-surface-container-low transition-colors">
                <input
                  defaultChecked
                  className="w-4 h-4 rounded text-[#FF6835] focus:ring-0 cursor-pointer accent-[#FF6835]"
                  name="facilities"
                  type="checkbox"
                  value="Microphone"
                />
                <span className="text-xs sm:text-sm text-on-surface">Microphone</span>
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest border border-[#E7DED4] cursor-pointer hover:bg-surface-container-low transition-colors">
                <input
                  className="w-4 h-4 rounded text-[#FF6835] focus:ring-0 cursor-pointer accent-[#FF6835]"
                  name="facilities"
                  type="checkbox"
                  value="Air Conditioning"
                />
                <span className="text-xs sm:text-sm text-on-surface">AC</span>
              </label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest border border-[#E7DED4] cursor-pointer hover:bg-surface-container-low transition-colors">
                <input
                  className="w-4 h-4 rounded text-[#FF6835] focus:ring-0 cursor-pointer accent-[#FF6835]"
                  name="facilities"
                  type="checkbox"
                  value="Wi-Fi"
                />
                <span className="text-xs sm:text-sm text-on-surface">Wi-Fi</span>
              </label>
            </div>
          </fieldset>

          {/* Additional Requirements */}
          <div className="flex flex-col gap-1.5 pt-0.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface" htmlFor="additionalRequirements">
              Additional Requirements
            </label>
            <textarea
              id="additionalRequirements"
              name="additionalRequirements"
              rows={3}
              placeholder="Any special equipment, stage setup, or audio/video requirements?"
              className="w-full bg-surface-container-lowest border border-[#E7DED4] rounded-xl p-3.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-[#FF6835] focus:ring-1 focus:ring-[#FF6835] shadow-[0_2px_6px_-1px_rgba(41,37,36,0.03)] resize-none transition-colors"
            />
          </div>

          {(clientError || state?.error) && (
            <div className="rounded-xl bg-error-container/60 p-3 text-sm text-on-error-container border border-error/20 flex items-start gap-2.5">
              <AlertCircle className="size-4.5 text-error mt-0.5 shrink-0" />
              <div>{clientError || state?.error}</div>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="reset"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0]
                setDate(today)
                setEndDate(today)
                setStartTime('09:00')
                setEndTime('11:00')
                setClientError(null)
              }}
              className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-surface-container-lowest border border-[#E7DED4] text-xs sm:text-sm font-semibold text-outline hover:bg-[#FFF0E8] hover:text-[#292524] transition-all duration-150 active:scale-95 shadow-sm cursor-pointer"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 h-11 sm:h-12 rounded-xl bg-[#FF6835] hover:bg-[#c94b24] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_4px_16px_-2px_rgba(255,104,53,0.35)] transition-all duration-150 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>
                {selectedVenue
                  ? isPending
                    ? 'Submitting...'
                    : 'Submit Request'
                  : 'Check Availability'}
              </span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
