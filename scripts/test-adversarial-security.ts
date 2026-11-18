import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function runAdversarialSecurityTests() {
  console.log('=== VENUITY ADVERSARIAL RPC SECURITY AUDIT SUITE ===\n')
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

  // Helper to sign in with specific test user and get an authenticated client session
  async function getAuthenticatedClient(email: string, pass: string = 'password123') {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await client.auth.signInWithPassword({ email, password: pass })
    if (error || !data.session) {
      throw new Error(`Failed to sign in as ${email}: ${error?.message}`)
    }
    return { client, user: data.user, session: data.session }
  }

  try {
    // 1. Setup authenticated clients using real user credentials
    const facultySession = await getAuthenticatedClient('faculty@venuity.local')
    const hodSession = await getAuthenticatedClient('hod@venuity.local')
    const adminSession = await getAuthenticatedClient('admin@venuity.local')

    assert(!!facultySession.user, 'Authenticated session established for FACULTY user')
    assert(!!hodSession.user, 'Authenticated session established for HOD user')
    assert(!!adminSession.user, 'Authenticated session established for ADMIN user')

    // Fetch an active venue and department info
    const { data: venues } = await adminClient.from('venues').select('id, name').eq('active', true).limit(1)
    const testVenue = venues?.[0]
    assert(!!testVenue, `Test venue selected: ${testVenue?.name}`)

    const { data: departments } = await adminClient.from('departments').select('id, code, name')
    const cseDept = departments?.find((d) => d.code === 'CSE')
    const eceDept = departments?.find((d) => d.code === 'ECE')
    assert(!!cseDept && !!eceDept, 'Found distinct departments (CSE and ECE)')

    // 2. Create isolated test booking request for CSE department
    const testStart = new Date(Date.now() + 172800000).toISOString() // +48h
    const testEnd = new Date(Date.now() + 172800000 + 7200000).toISOString() // +50h

    const { data: cseReq, error: cseReqErr } = await adminClient
      .from('booking_requests')
      .insert({
        requester_id: facultySession.user.id,
        department_id: cseDept!.id,
        venue_id: testVenue!.id,
        event_name: 'SECURITY_AUDIT_CSE_EVENT',
        description: 'Adversarial security test for department and role isolation',
        start_at: testStart,
        end_at: testEnd,
        expected_attendees: 30,
        status: 'PENDING',
      })
      .select('id')
      .single()

    assert(!cseReqErr && !!cseReq?.id, `CSE booking request created: ${cseReq?.id}`)

    // --- TEST A: ANONYMOUS RPC CALL MUST BE DENIED ---
    const { data: anonData, error: anonError } = await anonClient.rpc('approve_booking_request', {
      p_request_id: cseReq!.id,
    })
    // Either PostgREST rejects the call due to REVOKE EXECUTE or the function returns authentication required
    const anonBlocked = !!anonError || (anonData?.success === false && anonData?.error?.includes('Authentication required'))
    assert(anonBlocked, `Anonymous RPC call to approve_booking_request is strictly denied (Error: ${anonError?.message || anonData?.error})`)

    // --- TEST B: FACULTY CANNOT APPROVE (Role authorization enforcement) ---
    const { data: facultyApprove, error: facultyApproveErr } = await facultySession.client.rpc('approve_booking_request', {
      p_request_id: cseReq!.id,
    })
    assert(
      facultyApprove?.success === false && facultyApprove?.error?.includes('Only HOD or Admin can approve'),
      `Faculty user is denied approval permission: "${facultyApprove?.error || facultyApproveErr?.message}"`
    )

    // --- TEST C: FACULTY CANNOT REJECT (Role authorization enforcement) ---
    const { data: facultyReject, error: facultyRejectErr } = await facultySession.client.rpc('reject_booking_request', {
      p_request_id: cseReq!.id,
      p_reason: 'I am a faculty trying to reject',
    })
    assert(
      facultyReject?.success === false && facultyReject?.error?.includes('Only HOD or Admin can reject'),
      `Faculty user is denied rejection permission: "${facultyReject?.error || facultyRejectErr?.message}"`
    )

    // --- TEST D: REVIEWER IDENTITY CANNOT BE SPOOFED ---
    // Note: The function signature is strictly p_request_id (UUID). It DOES NOT accept a reviewer ID parameter!
    // Verify that the function definition enforces auth.uid() by checking DB definition
    const { data: sigCheck } = await adminClient.rpc('approve_booking_request', {
      p_request_id: cseReq!.id,
    })
    // When called from service_role without auth.uid(), auth.uid() is null, so it must return Authentication required
    assert(
      sigCheck?.success === false && sigCheck?.error?.includes('Authentication required'),
      `RPC strictly derives reviewer identity from auth.uid() and rejects unauthenticated/spoofed execution`
    )

    // --- TEST E: HOD CANNOT ACT OUTSIDE THEIR AUTHORIZED DEPARTMENT ---
    // Create an ECE request (the HOD is in CSE)
    const { data: eceReq, error: eceReqErr } = await adminClient
      .from('booking_requests')
      .insert({
        requester_id: facultySession.user.id,
        department_id: eceDept!.id,
        venue_id: testVenue!.id,
        event_name: 'SECURITY_AUDIT_ECE_EVENT',
        description: 'Testing cross-department HOD boundary',
        start_at: new Date(Date.now() + 259200000).toISOString(),
        end_at: new Date(Date.now() + 259200000 + 7200000).toISOString(),
        expected_attendees: 20,
        status: 'PENDING',
      })
      .select('id')
      .single()

    assert(!eceReqErr && !!eceReq?.id, `ECE booking request created: ${eceReq?.id}`)

    const { data: crossDeptApprove } = await hodSession.client.rpc('approve_booking_request', {
      p_request_id: eceReq!.id,
    })
    assert(
      crossDeptApprove?.success === false && crossDeptApprove?.error?.includes('HOD can only approve requests from their own department'),
      `Cross-department approval blocked for HOD: "${crossDeptApprove?.error}"`
    )

    const { data: crossDeptReject } = await hodSession.client.rpc('reject_booking_request', {
      p_request_id: eceReq!.id,
      p_reason: 'Cross-dept rejection attempt',
    })
    assert(
      crossDeptReject?.success === false && crossDeptReject?.error?.includes('HOD can only reject requests from their own department'),
      `Cross-department rejection blocked for HOD: "${crossDeptReject?.error}"`
    )

    // --- TEST F: HOD CAN APPROVE REQUESTS IN THEIR OWN DEPARTMENT ---
    const { data: hodApprovedCse } = await hodSession.client.rpc('approve_booking_request', {
      p_request_id: cseReq!.id,
    })
    assert(
      hodApprovedCse?.success === true && !!hodApprovedCse?.booking_id,
      `HOD approved departmental request successfully (Booking ID: ${hodApprovedCse?.booking_id})`
    )

    // Verify audit log has actor_id equal to HOD's auth.uid()
    const { data: auditLogEntry } = await adminClient
      .from('audit_logs')
      .select('actor_id, action')
      .eq('entity_id', cseReq!.id)
      .single()
    assert(
      auditLogEntry?.actor_id === hodSession.user.id && auditLogEntry?.action === 'APPROVE_BOOKING_REQUEST',
      `Audit log accurately records authenticated reviewer auth.uid() (${auditLogEntry?.actor_id})`
    )

    // --- TEST G: ADMIN CAN REVIEW CAMPUS-WIDE REQUESTS ---
    const { data: adminApprovedEce } = await adminSession.client.rpc('approve_booking_request', {
      p_request_id: eceReq!.id,
    })
    assert(
      adminApprovedEce?.success === true && !!adminApprovedEce?.booking_id,
      `ADMIN campus-wide approval succeeded for cross-dept request (Booking ID: ${adminApprovedEce?.booking_id})`
    )

    // --- TEST H: CONCURRENT / OVERLAPPING APPROVAL REJECTION ---
    // Create an overlapping request with cseReq
    const { data: overlapReq } = await adminClient
      .from('booking_requests')
      .insert({
        requester_id: facultySession.user.id,
        department_id: cseDept!.id,
        venue_id: testVenue!.id,
        event_name: 'SECURITY_AUDIT_OVERLAP_EVENT',
        description: 'Should conflict with confirmed booking',
        start_at: testStart,
        end_at: testEnd,
        expected_attendees: 15,
        status: 'PENDING',
      })
      .select('id')
      .single()

    const { data: overlapApprove } = await adminSession.client.rpc('approve_booking_request', {
      p_request_id: overlapReq!.id,
    })
    assert(
      overlapApprove?.success === false && overlapApprove?.error?.includes('overlapping confirmed booking'),
      `Overlapping approval safely rejected: "${overlapApprove?.error}"`
    )

    // Verify failed approval left no partial booking or request status alteration
    const { data: unapprovedReq } = await adminClient
      .from('booking_requests')
      .select('status')
      .eq('id', overlapReq!.id)
      .single()
    assert(unapprovedReq?.status === 'PENDING', 'Failed approval left request intact in PENDING state (atomic rollback)')

    // Cleanup test data
    console.log('\nCleaning up isolated test records...')
    if (hodApprovedCse?.booking_id) {
      await adminClient.from('bookings').delete().eq('id', hodApprovedCse.booking_id)
    }
    if (adminApprovedEce?.booking_id) {
      await adminClient.from('bookings').delete().eq('id', adminApprovedEce.booking_id)
    }
    if (cseReq?.id) await adminClient.from('booking_requests').delete().eq('id', cseReq.id)
    if (eceReq?.id) await adminClient.from('booking_requests').delete().eq('id', eceReq.id)
    if (overlapReq?.id) await adminClient.from('booking_requests').delete().eq('id', overlapReq.id)
    console.log('Test records safely cleaned up.')

  } catch (err) {
    console.error('Adversarial test error:', err)
    failed++
  }

  console.log(`\n=== ADVERSARIAL AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED ===`)
  if (failed > 0) process.exit(1)
}

runAdversarialSecurityTests()
