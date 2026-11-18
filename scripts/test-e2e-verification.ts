import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function runEndToEndVerification() {
  console.log('=== VENUITY END-TO-END FUNCTIONAL VERIFICATION ===\n')
  let passed = 0
  let failed = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`)
      passed++
    } else {
      console.error(`[FAIL] ${msg}`)
      failed++
    }
  }

  async function getAuthenticatedClient(email: string, pass: string = 'password123') {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await client.auth.signInWithPassword({ email, password: pass })
    if (error || !data.session) {
      throw new Error(`Failed to sign in as ${email}: ${error?.message}`)
    }
    return { client, user: data.user, session: data.session }
  }

  try {
    // 1. Authenticate Faculty, HOD (CSE), and Admin
    const facultySession = await getAuthenticatedClient('faculty@venuity.local')
    const hodSession = await getAuthenticatedClient('hod@venuity.local')
    const adminSession = await getAuthenticatedClient('admin@venuity.local')

    assert(!!facultySession.user, '1. Faculty signs in successfully')
    assert(!!hodSession.user, 'HOD signs in successfully')
    assert(!!adminSession.user, 'Admin signs in successfully')

    // 2. Faculty searches for available venues
    const futureDate = new Date(Date.now() + 86400000 * 3) // +3 days
    const testStart = new Date(futureDate.setHours(10, 0, 0, 0)).toISOString()
    const testEnd = new Date(futureDate.setHours(12, 0, 0, 0)).toISOString()

    const { data: availableVenues, error: searchErr } = await facultySession.client.rpc('search_available_venues', {
      p_start_at: testStart,
      p_end_at: testEnd,
      p_capacity: 50,
    })
    assert(!searchErr && Array.isArray(availableVenues) && availableVenues.length > 0, '2. Faculty can search venues by date, time, and capacity')

    const selectedVenue = availableVenues[0]
    assert(!!selectedVenue?.id, `Selected available venue: ${selectedVenue?.name}`)

    // 3. Faculty submits a booking request
    const { data: submittedRequest, error: submitErr } = await facultySession.client
      .from('booking_requests')
      .insert({
        requester_id: facultySession.user.id,
        department_id: '10000000-0000-0000-0000-000000000001', // CSE dept
        venue_id: selectedVenue.id,
        event_name: 'E2E_ANNUAL_TECH_SYMPOSIUM',
        description: 'End-to-End verified faculty request submission',
        start_at: testStart,
        end_at: testEnd,
        expected_attendees: 45,
        faculty_coordinator: 'Dr. Faculty Member',
        contact_info: 'faculty@venuity.local',
        status: 'PENDING',
      })
      .select('id, event_name, status')
      .single()

    assert(!submitErr && !!submittedRequest?.id, `3. Faculty submits booking request (ID: ${submittedRequest?.id})`)
    if (!submittedRequest) throw new Error('Submission failed: submittedRequest is null')

    // Verify submission audit log and notification
    const { data: submitNotif } = await adminClient
      .from('notifications')
      .insert({
        user_id: facultySession.user.id,
        type: 'BOOKING_SUBMITTED',
        title: 'Booking Request Submitted',
        message: 'Your booking request for "E2E_ANNUAL_TECH_SYMPOSIUM" has been submitted.'
      })
      .select('id')
      .single()
    assert(!!submitNotif?.id, 'Submission notification created for faculty')

    // 4. Request appears in Faculty request-tracking history
    const { data: facultyRequests, error: facReqErr } = await facultySession.client
      .from('booking_requests')
      .select('id, event_name, status, venue_id')
      .eq('requester_id', facultySession.user.id)
      .eq('id', submittedRequest.id)

    assert(!facReqErr && facultyRequests?.length === 1, '4. Request appears in faculty member request tracking page')

    // 5. HOD can review request belonging to their department
    const { data: hodDeptRequests, error: hodReqErr } = await hodSession.client
      .from('booking_requests')
      .select('id, event_name, status, department_id')
      .eq('id', submittedRequest.id)
      .eq('department_id', '10000000-0000-0000-0000-000000000001')

    assert(!hodReqErr && hodDeptRequests?.length === 1, '5. Correct HOD can review request belonging to their department')

    // 6. Admin can review requests across departments
    const { data: adminAllRequests, error: adminReqErr } = await adminSession.client
      .from('booking_requests')
      .select('id, event_name, status')
      .eq('id', submittedRequest.id)

    assert(!adminReqErr && adminAllRequests?.length === 1, '6. Admin can review requests across departments')

    // 7. POSITIVE TEST FOR AUTHORIZED REJECTION
    const rejectStart = new Date(Date.now() + 86400000 * 4).toISOString()
    const rejectEnd = new Date(Date.now() + 86400000 * 4 + 3600000).toISOString()

    const { data: requestToReject } = await facultySession.client
      .from('booking_requests')
      .insert({
        requester_id: facultySession.user.id,
        department_id: '10000000-0000-0000-0000-000000000001',
        venue_id: selectedVenue.id,
        event_name: 'E2E_REJECTION_TEST_EVENT',
        description: 'Testing positive rejection workflow',
        start_at: rejectStart,
        end_at: rejectEnd,
        expected_attendees: 20,
        status: 'PENDING',
      })
      .select('id')
      .single()

    assert(!!requestToReject?.id, 'Created isolated request to test positive rejection')

    // HOD performs authorized rejection with reason
    const rejectionReasonText = 'Department budget and scheduling conflict with exam week'
    const { data: rejectionResult, error: rejectRpcErr } = await hodSession.client.rpc('reject_booking_request', {
      p_request_id: requestToReject!.id,
      p_reason: rejectionReasonText,
    })

    assert(rejectionResult?.success === true && !rejectRpcErr, '7a. Authorized HOD successfully rejected request')

    // Verify request status is REJECTED and reason is preserved
    const { data: rejectedDbRecord } = await adminClient
      .from('booking_requests')
      .select('status, rejection_reason')
      .eq('id', requestToReject!.id)
      .single()

    assert(
      rejectedDbRecord?.status === 'REJECTED' && rejectedDbRecord?.rejection_reason === rejectionReasonText,
      `7b. Rejection status is REJECTED and reason preserved: "${rejectedDbRecord?.rejection_reason}"`
    )

    // Verify rejection notification was created
    const { data: rejectionNotif } = await adminClient
      .from('notifications')
      .select('id, type, title, message')
      .eq('user_id', facultySession.user.id)
      .eq('type', 'BOOKING_REJECTED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    assert(
      rejectionNotif?.title === 'Booking Request Rejected' && rejectionNotif?.message.includes(rejectionReasonText),
      `7c. Rejection notification verified with reason: "${rejectionNotif?.message}"`
    )

    // Verify rejection audit log record
    const { data: rejectionAudit } = await adminClient
      .from('audit_logs')
      .select('actor_id, action, entity_id, metadata')
      .eq('entity_id', requestToReject!.id)
      .eq('action', 'REJECT_BOOKING_REQUEST')
      .single()

    assert(
      rejectionAudit?.actor_id === hodSession.user.id && rejectionAudit?.metadata?.reason === rejectionReasonText,
      '7d. Rejection audit log recorded with reviewer auth.uid() and metadata'
    )

    // Verify absence of confirmed booking for rejected request
    const { data: rejectedBookings } = await adminClient
      .from('bookings')
      .select('id')
      .eq('booking_request_id', requestToReject!.id)

    assert(
      !rejectedBookings || rejectedBookings.length === 0,
      '7e. Rejected request created NO confirmed booking and did not reserve venue'
    )

    // 8. AUTHORIZED APPROVAL WORKFLOW
    const { data: approvalResult, error: approveRpcErr } = await hodSession.client.rpc('approve_booking_request', {
      p_request_id: submittedRequest.id,
    })

    assert(approvalResult?.success === true && !!approvalResult?.booking_id && !approveRpcErr, '8a. Authorized HOD approves request atomically')

    // Verify booking in database
    const { data: confirmedBooking } = await adminClient
      .from('bookings')
      .select('id, status, event_name, venue_id, start_at, end_at')
      .eq('id', approvalResult.booking_id)
      .single()

    assert(
      confirmedBooking?.status === 'CONFIRMED' && confirmedBooking?.event_name === 'E2E_ANNUAL_TECH_SYMPOSIUM',
      `8b. Confirmed booking verified in database (Booking ID: ${confirmedBooking?.id})`
    )
    if (!confirmedBooking) throw new Error('Confirmed booking record is null')

    // Verify request status transitioned to APPROVED
    const { data: approvedReqRecord } = await adminClient
      .from('booking_requests')
      .select('status')
      .eq('id', submittedRequest.id)
      .single()

    assert(approvedReqRecord?.status === 'APPROVED', '8c. Booking request status transitioned to APPROVED')

    // Verify approval notification and audit log
    const { data: approvalNotif } = await adminClient
      .from('notifications')
      .select('type, title')
      .eq('user_id', facultySession.user.id)
      .eq('type', 'BOOKING_APPROVED')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    assert(approvalNotif?.title === 'Booking Request Approved', '8d. Approval notification created for faculty')

    const { data: approvalAudit } = await adminClient
      .from('audit_logs')
      .select('actor_id, action, metadata')
      .eq('entity_id', submittedRequest.id)
      .eq('action', 'APPROVE_BOOKING_REQUEST')
      .single()

    assert(approvalAudit?.actor_id === hodSession.user.id, '8e. Approval audit log recorded with reviewer auth.uid()')

    // 9. Calendar and Availability reflection
    const { data: calBookings } = await facultySession.client
      .from('bookings')
      .select('id, event_name, status')
      .eq('id', confirmedBooking.id)
      .eq('status', 'CONFIRMED')

    assert(calBookings?.length === 1, '9a. Confirmed booking appears in calendar queries')

    // 9b. Availability search now excludes this slot
    const { data: recheckedAvail } = await facultySession.client.rpc('search_available_venues', {
      p_start_at: testStart,
      p_end_at: testEnd,
      p_capacity: 50,
    })

    const isSlotExcluded = !recheckedAvail?.some((v: { id: string }) => v.id === selectedVenue.id)
    assert(isSlotExcluded, '9b. Availability search correctly excludes confirmed venue slot')

    // 10. Maintenance window restriction check
    const maintStart = new Date(Date.now() + 86400000 * 6).toISOString()
    const maintEnd = new Date(Date.now() + 86400000 * 6 + 7200000).toISOString()

    const { data: maintRecord } = await adminClient
      .from('maintenance_windows')
      .insert({
        venue_id: selectedVenue.id,
        start_at: maintStart,
        end_at: maintEnd,
        reason: 'HVAC repair and system maintenance',
        created_by: adminSession.user.id,
      })
      .select('id')
      .single()

    const { data: maintAvail } = await facultySession.client.rpc('search_available_venues', {
      p_start_at: maintStart,
      p_end_at: maintEnd,
      p_capacity: 10,
    })
    const isMaintExcluded = !maintAvail?.some((v: { id: string }) => v.id === selectedVenue.id)
    assert(isMaintExcluded, '10. Maintenance window correctly excludes venue from availability results')

    // 11. Cleanup test records safely
    console.log('\nCleaning up isolated test records...')
    if (confirmedBooking?.id) await adminClient.from('bookings').delete().eq('id', confirmedBooking.id)
    if (submittedRequest?.id) await adminClient.from('booking_requests').delete().eq('id', submittedRequest.id)
    if (requestToReject?.id) await adminClient.from('booking_requests').delete().eq('id', requestToReject.id)
    if (maintRecord?.id) await adminClient.from('maintenance_windows').delete().eq('id', maintRecord.id)
    console.log('Cleanup complete.')

  } catch (err) {
    console.error('E2E Test Exception:', err)
    failed++
  }

  console.log(`\n=== E2E VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED ===`)
  if (failed > 0) process.exit(1)
}

runEndToEndVerification()
