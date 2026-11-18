-- Migration: Secure Booking Lifecycle Functions
-- Hardens approve_booking_request and reject_booking_request:
-- 1. Reviewer identity is STRICTLY derived from auth.uid(). No caller-supplied reviewer ID is accepted.
-- 2. Hardened SECURITY DEFINER search path: SET search_path = '' with explicit schema qualification for all tables and functions.
-- 3. Restricts EXECUTE permissions: REVOKED from PUBLIC and anon. GRANTED to authenticated and service_role only.
-- 4. Anonymous execution explicitly denied if auth.uid() is null.
-- 5. Validates user status, user role, and departmental authority (HOD can only review own department).
-- 6. Atomic row-lock, maintenance window overlap check, confirmed booking overlap check, and exclusion constraint.
-- 7. Notifications and audit logs record auth.uid() as actor.

-- Drop old 2-argument signature if exists
DROP FUNCTION IF EXISTS public.approve_booking_request(UUID, UUID);
DROP FUNCTION IF EXISTS public.reject_booking_request(UUID, UUID, TEXT);

-- New 1-argument signature: approve_booking_request(p_request_id UUID)
CREATE OR REPLACE FUNCTION public.approve_booking_request(
    p_request_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_req RECORD;
    v_reviewer_role public.user_role;
    v_reviewer_dept UUID;
    v_booking_id UUID;
    v_conflict_count INTEGER;
BEGIN
    -- 1. Derive reviewer identity strictly from auth.uid()
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Authentication required: caller has no active session');
    END IF;

    -- 2. Check Reviewer Profile, Role & Active Status
    SELECT role, department_id INTO v_reviewer_role, v_reviewer_dept
    FROM public.profiles
    WHERE id = v_caller_id AND active = true;

    IF v_reviewer_role IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Unauthorized or inactive profile');
    END IF;

    IF v_reviewer_role NOT IN ('ADMIN', 'HOD') THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Only HOD or Admin can approve booking requests');
    END IF;

    -- 3. Fetch Booking Request with row lock for atomic update
    SELECT * INTO v_req
    FROM public.booking_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_req.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Booking request not found');
    END IF;

    IF v_req.status != 'PENDING' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Booking request is already ' || v_req.status);
    END IF;

    -- 4. If reviewer is HOD, verify department match strictly
    IF v_reviewer_role = 'HOD' AND (v_reviewer_dept IS NULL OR v_req.department_id IS NULL OR v_req.department_id != v_reviewer_dept) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'HOD can only approve requests from their own department');
    END IF;

    -- 5. Verify Venue Active & Available against Maintenance Windows
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.maintenance_windows
    WHERE venue_id = v_req.venue_id
      AND pg_catalog.tstzrange(start_at, end_at, '[)') && pg_catalog.tstzrange(v_req.start_at, v_req.end_at, '[)');

    IF v_conflict_count > 0 THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Venue is scheduled for maintenance during this time range');
    END IF;

    -- 6. Verify against existing confirmed/completed bookings
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.bookings
    WHERE venue_id = v_req.venue_id
      AND status IN ('CONFIRMED', 'COMPLETED')
      AND pg_catalog.tstzrange(start_at, end_at, '[)') && pg_catalog.tstzrange(v_req.start_at, v_req.end_at, '[)');

    IF v_conflict_count > 0 THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Venue already has an overlapping confirmed booking');
    END IF;

    -- 7. Insert Confirmed Booking (Exclusion constraint prevent_double_booking also enforces this atomically)
    INSERT INTO public.bookings (
        booking_request_id,
        requester_id,
        department_id,
        venue_id,
        event_name,
        start_at,
        end_at,
        status
    ) VALUES (
        v_req.id,
        v_req.requester_id,
        v_req.department_id,
        v_req.venue_id,
        v_req.event_name,
        v_req.start_at,
        v_req.end_at,
        'CONFIRMED'
    ) RETURNING id INTO v_booking_id;

    -- 8. Update booking request status
    UPDATE public.booking_requests
    SET status = 'APPROVED',
        updated_at = pg_catalog.now()
    WHERE id = v_req.id;

    -- 9. Create notification for requester
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message
    ) VALUES (
        v_req.requester_id,
        'BOOKING_APPROVED',
        'Booking Request Approved',
        'Your booking request for "' || v_req.event_name || '" has been approved.'
    );

    -- 10. Create audit log entry with caller's verified identity
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_caller_id,
        'APPROVE_BOOKING_REQUEST',
        'booking_requests',
        v_req.id,
        pg_catalog.jsonb_build_object(
            'booking_id', v_booking_id,
            'venue_id', v_req.venue_id,
            'event_name', v_req.event_name,
            'start_at', v_req.start_at,
            'end_at', v_req.end_at,
            'reviewer_role', v_reviewer_role
        )
    );

    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'request_id', v_req.id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- New 2-argument signature: reject_booking_request(p_request_id UUID, p_reason TEXT)
CREATE OR REPLACE FUNCTION public.reject_booking_request(
    p_request_id UUID,
    p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_req RECORD;
    v_reviewer_role public.user_role;
    v_reviewer_dept UUID;
    v_clean_reason TEXT;
BEGIN
    -- 1. Derive reviewer identity strictly from auth.uid()
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Authentication required: caller has no active session');
    END IF;

    -- 2. Check Reviewer Profile, Role & Active Status
    SELECT role, department_id INTO v_reviewer_role, v_reviewer_dept
    FROM public.profiles
    WHERE id = v_caller_id AND active = true;

    IF v_reviewer_role IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Unauthorized or inactive profile');
    END IF;

    IF v_reviewer_role NOT IN ('ADMIN', 'HOD') THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Only HOD or Admin can reject booking requests');
    END IF;

    -- Validate rejection reason
    v_clean_reason := pg_catalog.btrim(COALESCE(p_reason, ''));
    IF pg_catalog.length(v_clean_reason) < 3 THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Rejection reason must be at least 3 characters long');
    END IF;

    -- 3. Fetch Booking Request with row lock
    SELECT * INTO v_req
    FROM public.booking_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_req.id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Booking request not found');
    END IF;

    IF v_req.status != 'PENDING' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'Booking request is already ' || v_req.status);
    END IF;

    -- 4. If reviewer is HOD, verify department match strictly
    IF v_reviewer_role = 'HOD' AND (v_reviewer_dept IS NULL OR v_req.department_id IS NULL OR v_req.department_id != v_reviewer_dept) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'error', 'HOD can only reject requests from their own department');
    END IF;

    -- 5. Update booking request status
    UPDATE public.booking_requests
    SET status = 'REJECTED',
        rejection_reason = v_clean_reason,
        updated_at = pg_catalog.now()
    WHERE id = v_req.id;

    -- 6. Create notification for requester
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message
    ) VALUES (
        v_req.requester_id,
        'BOOKING_REJECTED',
        'Booking Request Rejected',
        'Your booking request for "' || v_req.event_name || '" was rejected. Reason: ' || v_clean_reason
    );

    -- 7. Create audit log entry
    INSERT INTO public.audit_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_caller_id,
        'REJECT_BOOKING_REQUEST',
        'booking_requests',
        v_req.id,
        pg_catalog.jsonb_build_object(
            'reason', v_clean_reason,
            'venue_id', v_req.venue_id,
            'event_name', v_req.event_name,
            'reviewer_role', v_reviewer_role
        )
    );

    RETURN pg_catalog.jsonb_build_object('success', true, 'request_id', v_req.id);
EXCEPTION WHEN OTHERS THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Revoke and Grant Permissions (Principle of Least Privilege)
REVOKE ALL ON FUNCTION public.approve_booking_request(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_booking_request(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_booking_request(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_booking_request(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.reject_booking_request(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_booking_request(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_booking_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_booking_request(UUID, TEXT) TO service_role;
