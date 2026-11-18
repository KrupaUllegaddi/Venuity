-- Development Login Credentials (provisioned via migration 20261104235000):
-- Admin 1: rajanna.r.c@venuity.local     / Venuity#Rajanna2026
-- Admin 2: Placement@sjbit.edu.in        / Venuity#Placement2026
-- HOD:     krishna.a.n@venuity.local     / Venuity#Krishna2026
-- Faculty: naveena.c@venuity.local       / Venuity#Naveena2026
-- (All 48 accounts provisioned in the migration; only the 3 reconciled demo accounts are seeded here)
-- NOTE: Accounts with @venuity.local domain use type="text" login field (not type="email") to bypass RFC domain validation.

-- 1. DEPARTMENTS
INSERT INTO public.departments (id, name, code, active) VALUES
('10000000-0000-0000-0000-000000000001', 'Computer Science', 'CSE', true),
('10000000-0000-0000-0000-000000000002', 'Master of Computer Applications', 'MCA', true),
('10000000-0000-0000-0000-000000000003', 'Master of Business Administration', 'MBA', true),
('10000000-0000-0000-0000-000000000004', 'Electronics and Communication', 'ECE', true),
('10000000-0000-0000-0000-000000000005', 'Electrical and Electronics', 'EEE', true),
('10000000-0000-0000-0000-000000000006', 'Mechanical Engineering', 'MECH', true),
('10000000-0000-0000-0000-000000000007', 'Civil Engineering', 'CIVIL', true),
('10000000-0000-0000-0000-000000000008', 'Architecture', 'ARCH', true),
('10000000-0000-0000-0000-000000000009', 'Dental', 'DENT', true),
('10000000-0000-0000-0000-000000000010', 'Nursing', 'NURS', true),
('10000000-0000-0000-0000-000000000011', 'Data Science', 'DS', true),
('10000000-0000-0000-0000-000000000012', 'Artificial Intelligence and Machine Learning', 'AIML', true);

-- 5. DEVELOPMENT USERS (Auth)
-- The 3 reconciled accounts below match the IDs used throughout seed booking/request data.
-- All 48 real accounts (45 Faculty + 1 HOD + 2 Admin) are provisioned by migration
-- 20261104235000_provision_faculty_hod_admin_accounts.sql which runs before this seed.
-- This seed only ensures the 3 canonical IDs exist for FK integrity in the sample data below.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
  email_change, phone, phone_change, phone_change_token, reauthentication_token
) VALUES
-- Admin 1: Rajanna R C (reconciled ID preserving booking history)
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'rajanna.r.c@venuity.local', crypt('Venuity#Rajanna2026', gen_salt('bf')), now(),
 '{"provider":"email","providers":["email"]}', '{"full_name":"Rajanna R C"}',
 now(), now(), '', '', '', '', '', NULL, '', '', ''),
-- HOD: Dr. Krishna A N (reconciled ID)
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'krishna.a.n@venuity.local', crypt('Venuity#Krishna2026', gen_salt('bf')), now(),
 '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Krishna A N"}',
 now(), now(), '', '', '', '', '', NULL, '', '', ''),
-- Faculty: Dr. Naveena C (reconciled ID)
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
 'naveena.c@venuity.local', crypt('Venuity#Naveena2026', gen_salt('bf')), now(),
 '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Naveena C"}',
 now(), now(), '', '', '', '', '', NULL, '', '', '')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- 6. PROFILES
-- Profiles are created by the auth.users trigger; UPDATE to set correct role/department.
INSERT INTO public.profiles (id, full_name, email, role, department_id, active)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Rajanna R C',      'rajanna.r.c@venuity.local',  'ADMIN',   NULL,                                           true),
  ('00000000-0000-0000-0000-000000000002', 'Dr. Krishna A N',  'krishna.a.n@venuity.local',  'HOD',     '10000000-0000-0000-0000-000000000001',          true),
  ('00000000-0000-0000-0000-000000000003', 'Dr. Naveena C',    'naveena.c@venuity.local',    'FACULTY', '10000000-0000-0000-0000-000000000001',          true)
ON CONFLICT (id) DO UPDATE SET
  full_name     = EXCLUDED.full_name,
  email         = EXCLUDED.email,
  role          = EXCLUDED.role,
  department_id = EXCLUDED.department_id,
  active        = EXCLUDED.active,
  updated_at    = now();

-- 2. FACILITIES
INSERT INTO public.facilities (id, name) VALUES
('20000000-0000-0000-0000-000000000001', 'Projector'),
('20000000-0000-0000-0000-000000000002', 'Air Conditioning'),
('20000000-0000-0000-0000-000000000003', 'Whiteboard'),
('20000000-0000-0000-0000-000000000004', 'Sound System'),
('20000000-0000-0000-0000-000000000005', 'Microphone'),
('20000000-0000-0000-0000-000000000006', 'Wi-Fi'),
('20000000-0000-0000-0000-000000000007', 'Video Conferencing');

-- 3. VENUES (Illustrative Demo / Development Data)
-- NOTE: The venues below are sample demo data used for testing workflows (browsing, availability search, booking requests, approvals, calendar).
-- They are NOT verified real-life campus facilities and should be replaced or updated via Admin Venue Management when verified details and photographs are available.
INSERT INTO public.venues (id, name, slug, type, building, floor, capacity, description, active) VALUES
('30000000-0000-0000-0000-000000000001', 'Auditorium', 'auditorium', 'AUDITORIUM', 'Main Block', 'Ground', 1500, 'Premier campus auditorium equipped with acoustic sound arrays, high-definition stage lighting, 24x9 LED video wall, dual green rooms, and extensive seating for convocations, cultural festivals, and major conferences.', true),
('30000000-0000-0000-0000-000000000002', 'CSE Seminar Hall', 'cse-seminar-hall', 'SEMINAR_HALL', 'CS Block', 'First', 190, 'Specialized academic seminar hall for Computer Science & Engineering, equipped with interactive projection, acoustic speakers, high-speed Wi-Fi, and CCTV monitoring for seminars and workshops.', true),
('30000000-0000-0000-0000-000000000003', 'Seminar Hall B', 'seminar-hall-b', 'SEMINAR_HALL', 'Mechanical Block', 'Second', 100, 'Smaller seminar hall.', false),
('30000000-0000-0000-0000-000000000004', 'Conference Room 1', 'conference-room-1', 'CONFERENCE_ROOM', 'Admin Block', 'Ground', 20, 'Executive conference room.', false),
('30000000-0000-0000-0000-000000000005', 'Conference Room 2', 'conference-room-2', 'CONFERENCE_ROOM', 'CS Block', 'Third', 15, 'Meeting room for staff.', false),
('30000000-0000-0000-0000-000000000006', 'Gallery', 'gallery', 'GALLERY', 'Admin Block', 'Ground', 230, 'Multi-purpose exhibition and presentation gallery equipped with dual entrances/exits, dedicated sound console, computer workstation, interactive projection, and premium surround audio.', true),
('30000000-0000-0000-0000-000000000007', 'Large Classroom', 'large-classroom', 'CLASSROOM', 'Science Block', 'First', 80, 'Classroom suitable for combined lectures.', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  type = EXCLUDED.type,
  building = EXCLUDED.building,
  floor = EXCLUDED.floor,
  capacity = EXCLUDED.capacity,
  description = EXCLUDED.description,
  active = EXCLUDED.active;

-- 4. VENUE FACILITIES
INSERT INTO public.venue_facilities (venue_id, facility_id) VALUES
-- Main Auditorium gets almost everything
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'), -- Projector
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'), -- AC
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004'), -- Sound System
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005'), -- Mic
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006'), -- Wi-Fi
-- Seminar Hall A
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001'), -- Projector
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'), -- AC
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003'), -- Whiteboard
-- Conference Room 1
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001'), -- Projector
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002'), -- AC
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000007') -- Video Conf
ON CONFLICT (venue_id, facility_id) DO NOTHING;

-- 7. BOOKING REQUESTS
-- 40000000... series for requests
INSERT INTO public.booking_requests (id, requester_id, department_id, venue_id, event_name, description, start_at, end_at, expected_attendees, faculty_coordinator, contact_info, additional_requirements, status, rejection_reason) VALUES
-- Pending Request (Future) — Dr. Naveena C
('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Tech Talk 2026', 'Guest lecture on AI', '2026-10-15 10:00:00+00', '2026-10-15 12:00:00+00', 100, 'Dr. Naveena C', 'ext 1234', 'Need extra mics', 'PENDING', NULL),
-- Approved Request (Future) — Dr. Krishna A N
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Annual CSE Symposium', 'Major event', '2026-11-01 09:00:00+00', '2026-11-01 17:00:00+00', 500, 'Dr. Krishna A N', 'krishna.a.n@venuity.local', 'Full stage setup', 'APPROVED', NULL),
-- Rejected Request — Dr. Naveena C
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Quick Meeting', 'Just a catchup', '2026-10-16 10:00:00+00', '2026-10-16 11:00:00+00', 5, 'Dr. Naveena C', 'naveena.c@venuity.local', 'None', 'REJECTED', 'Venue too large for 5 people, please use small meeting room.'),
-- Cancelled Request — Dr. Naveena C
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Cancelled Workshop', 'Old idea', '2026-10-20 14:00:00+00', '2026-10-20 16:00:00+00', 50, 'Dr. Naveena C', 'naveena.c@venuity.local', 'None', 'CANCELLED', NULL)
ON CONFLICT (id) DO NOTHING;

-- 8. BOOKINGS
-- 50000000... series for bookings
INSERT INTO public.bookings (id, booking_request_id, requester_id, department_id, venue_id, event_name, start_at, end_at, status) VALUES
-- Today's back-to-back bookings to test [) intervals (Using Conference Room 1 — now inactive but kept for FK integrity)
('50000000-0000-0000-0000-000000000001', NULL, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Morning Strategy Sync', current_date + time '10:00:00', current_date + time '12:00:00', 'CONFIRMED'),
('50000000-0000-0000-0000-000000000002', NULL, '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'Faculty Lunch Meeting', current_date + time '12:00:00', current_date + time '14:00:00', 'CONFIRMED'),

-- Booking linked to the Approved Request
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Annual CSE Symposium', '2026-11-01 09:00:00+00', '2026-11-01 17:00:00+00', 'CONFIRMED'),

-- A completed past booking
('50000000-0000-0000-0000-000000000004', NULL, '00000000-0000-0000-0000-000000000001', NULL, '30000000-0000-0000-0000-000000000001', 'Orientation 2026', '2026-08-15 09:00:00+00', '2026-08-15 13:00:00+00', 'COMPLETED')
ON CONFLICT (id) DO NOTHING;

-- 9. MAINTENANCE
-- 60000000... series for maintenance
INSERT INTO public.maintenance_windows (id, venue_id, start_at, end_at, reason, created_by) VALUES
-- Auditorium Maintenance this weekend
('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', current_date + interval '2 days' + time '08:00:00', current_date + interval '4 days' + time '18:00:00', 'AC Servicing and Deep Cleaning', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 10. NOTIFICATIONS
INSERT INTO public.notifications (id, user_id, type, title, message, read_at) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'INFO',     'Welcome to Venuity',         'Your account has been set up.', now()),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'REJECTED', 'Booking Request Rejected',   'Your request for Quick Meeting was rejected.', NULL)
ON CONFLICT (id) DO NOTHING;

-- 11. AUDIT LOGS
INSERT INTO public.audit_logs (id, actor_id, action, entity_type, entity_id, metadata) VALUES
('80000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'CREATE', 'VENUE',   '30000000-0000-0000-0000-000000000001', '{"venue_name": "Auditorium"}'),
('80000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'UPDATE', 'REQUEST', '40000000-0000-0000-0000-000000000002', '{"status": "APPROVED"}')
ON CONFLICT (id) DO NOTHING;
