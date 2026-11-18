import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, ArrowLeft } from 'lucide-react'
import { RequestsAdminClient, type AdminBookingRequest } from './requests-admin-client'

export default async function AdminRequestsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  // Fetch all booking requests across all departments for Admin review & management
  const { data: requestsData, error } = await supabase
    .from('booking_requests')
    .select(`
      id,
      event_name,
      description,
      start_at,
      end_at,
      expected_attendees,
      faculty_coordinator,
      contact_info,
      additional_requirements,
      status,
      rejection_reason,
      created_at,
      updated_at,
      venue_id,
      venues (
        id,
        name,
        building,
        floor,
        capacity,
        type
      ),
      department_id,
      departments (
        id,
        name,
        code
      ),
      requester_id,
      profiles:requester_id (
        id,
        full_name,
        email,
        role
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch booking requests for admin:', error)
  }

  const requests: AdminBookingRequest[] = (requestsData || []).map((r: {
    id: string
    event_name: string
    description?: string | null
    start_at: string
    end_at: string
    expected_attendees: number
    faculty_coordinator?: string | null
    contact_info?: string | null
    additional_requirements?: string | null
    status: string
    rejection_reason?: string | null
    created_at: string
    updated_at: string
    venue_id: string
    venues?: { id?: string; name?: string; building?: string; floor?: string; capacity?: number; type?: string } | { id?: string; name?: string; building?: string; floor?: string; capacity?: number; type?: string }[] | null
    department_id?: string | null
    departments?: { id?: string; name?: string; code?: string } | { id?: string; name?: string; code?: string }[] | null
    requester_id: string
    profiles?: { id?: string; full_name?: string; email?: string; role?: string } | { id?: string; full_name?: string; email?: string; role?: string }[] | null
  }) => {
    const vObj = Array.isArray(r.venues) ? r.venues[0] : r.venues
    const dObj = Array.isArray(r.departments) ? r.departments[0] : r.departments
    const pObj = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles

    return {
      id: r.id,
      eventName: r.event_name,
      description: r.description || null,
      startAt: r.start_at,
      endAt: r.end_at,
      expectedAttendees: r.expected_attendees,
      facultyCoordinator: r.faculty_coordinator || null,
      contactInfo: r.contact_info || null,
      additionalRequirements: r.additional_requirements || null,
      status: r.status,
      rejectionReason: r.rejection_reason || null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      venueId: r.venue_id,
      venueName: vObj?.name || 'Venue',
      venueBuilding: vObj?.building || 'Campus',
      venueFloor: vObj?.floor || 'Ground',
      venueCapacity: vObj?.capacity || 0,
      venueType: vObj?.type || 'OTHER',
      departmentId: r.department_id || null,
      departmentName: dObj?.name || 'Campus Wide',
      departmentCode: dObj?.code || '',
      requesterId: r.requester_id,
      requesterName: pObj?.full_name || 'Requester',
      requesterEmail: pObj?.email || '',
      requesterRole: pObj?.role || 'FACULTY',
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-outline hover:text-on-surface mb-2 font-medium"
          >
            <ArrowLeft className="size-4" />
            Back to Admin Panel
          </Link>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
              Booking Requests Administration
            </h1>
          </div>
          <p className="mt-1 text-sm text-outline">
            Review, approve, reject, and inspect campus-wide venue reservation requests.
          </p>
        </div>
      </div>

      {/* Requests Management Table & Filter Component */}
      <RequestsAdminClient initialRequests={requests} />
    </div>
  )
}
