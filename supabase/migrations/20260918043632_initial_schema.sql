-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'HOD', 'FACULTY');
CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE venue_type AS ENUM ('AUDITORIUM', 'SEMINAR_HALL', 'GALLERY', 'CONFERENCE_ROOM', 'CLASSROOM', 'OTHER');

-- DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROFILES (References auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'FACULTY',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VENUES
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type venue_type NOT NULL,
    building TEXT NOT NULL,
    floor TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FACILITIES
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VENUE_FACILITIES
CREATE TABLE venue_facilities (
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    PRIMARY KEY (venue_id, facility_id)
);

-- BOOKING REQUESTS
CREATE TABLE booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    expected_attendees INTEGER NOT NULL CHECK (expected_attendees > 0),
    faculty_coordinator TEXT,
    contact_info TEXT,
    additional_requirements TEXT,
    status request_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT start_before_end CHECK (start_at < end_at)
);

-- BOOKINGS
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status booking_status NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT start_before_end CHECK (start_at < end_at),
    -- CRITICAL EXCLUSION CONSTRAINT
    CONSTRAINT prevent_double_booking EXCLUDE USING gist (
        venue_id WITH =,
        tstzrange(start_at, end_at, '[)') WITH &&
    ) WHERE (status = 'CONFIRMED' OR status = 'COMPLETED')
);

-- MAINTENANCE WINDOWS
CREATE TABLE maintenance_windows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT start_before_end CHECK (start_at < end_at)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_booking_requests_updated_at BEFORE UPDATE ON booking_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_maintenance_windows_updated_at BEFORE UPDATE ON maintenance_windows FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- INDEXES
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_booking_req_venue ON booking_requests(venue_id);
CREATE INDEX idx_booking_req_requester ON booking_requests(requester_id);
CREATE INDEX idx_booking_req_dept ON booking_requests(department_id);
CREATE INDEX idx_booking_req_status ON booking_requests(status);
CREATE INDEX idx_bookings_venue ON bookings(venue_id);
CREATE INDEX idx_bookings_requester ON bookings(requester_id);
CREATE INDEX idx_bookings_dept ON bookings(department_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_at ON bookings(start_at);
CREATE INDEX idx_bookings_end_at ON bookings(end_at);
CREATE INDEX idx_maint_venue ON maintenance_windows(venue_id);
CREATE INDEX idx_maint_start_at ON maintenance_windows(start_at);
CREATE INDEX idx_maint_end_at ON maintenance_windows(end_at);

-- ROW LEVEL SECURITY (RLS)

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.auth_user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.auth_user_dept() RETURNS UUID AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- DEPARTMENTS
CREATE POLICY "Departments are viewable by all authenticated users" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Departments are insertable by ADMIN" ON departments FOR INSERT TO authenticated WITH CHECK (auth_user_role() = 'ADMIN');
CREATE POLICY "Departments are updatable by ADMIN" ON departments FOR UPDATE TO authenticated USING (auth_user_role() = 'ADMIN');

-- PROFILES
CREATE POLICY "Profiles are viewable by self or ADMIN" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id OR auth_user_role() = 'ADMIN');
CREATE POLICY "Profiles can be updated by self" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- VENUES, FACILITIES, VENUE_FACILITIES
CREATE POLICY "Venues are viewable by public" ON venues FOR SELECT USING (active = true);
CREATE POLICY "All Venues viewable by authenticated" ON venues FOR SELECT TO authenticated USING (true);
CREATE POLICY "Venues insertable by ADMIN" ON venues FOR INSERT TO authenticated WITH CHECK (auth_user_role() = 'ADMIN');
CREATE POLICY "Venues updatable by ADMIN" ON venues FOR UPDATE TO authenticated USING (auth_user_role() = 'ADMIN');

CREATE POLICY "Facilities are viewable by public" ON facilities FOR SELECT USING (true);
CREATE POLICY "Facilities insertable by ADMIN" ON facilities FOR INSERT TO authenticated WITH CHECK (auth_user_role() = 'ADMIN');
CREATE POLICY "Facilities updatable by ADMIN" ON facilities FOR UPDATE TO authenticated USING (auth_user_role() = 'ADMIN');

CREATE POLICY "Venue_Facilities are viewable by public" ON venue_facilities FOR SELECT USING (true);
CREATE POLICY "Venue_Facilities insertable by ADMIN" ON venue_facilities FOR INSERT TO authenticated WITH CHECK (auth_user_role() = 'ADMIN');
CREATE POLICY "Venue_Facilities updatable by ADMIN" ON venue_facilities FOR DELETE TO authenticated USING (auth_user_role() = 'ADMIN');

-- BOOKING REQUESTS
CREATE POLICY "Requests viewable by own/dept/admin" ON booking_requests FOR SELECT TO authenticated USING (
    requester_id = auth.uid() OR
    (auth_user_role() = 'HOD' AND department_id = auth_user_dept()) OR
    auth_user_role() = 'ADMIN'
);
CREATE POLICY "Requests insertable by self" ON booking_requests FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Requests updatable by self/admin/hod" ON booking_requests FOR UPDATE TO authenticated USING (
    requester_id = auth.uid() OR
    (auth_user_role() = 'HOD' AND department_id = auth_user_dept()) OR
    auth_user_role() = 'ADMIN'
);

-- BOOKINGS
CREATE POLICY "Bookings viewable by public" ON bookings FOR SELECT USING (status = 'CONFIRMED' OR status = 'COMPLETED');
CREATE POLICY "All bookings viewable by authenticated" ON bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Bookings insertable by ADMIN" ON bookings FOR INSERT TO authenticated WITH CHECK (auth_user_role() = 'ADMIN');
CREATE POLICY "Bookings updatable by self/ADMIN" ON bookings FOR UPDATE TO authenticated USING (
    requester_id = auth.uid() OR auth_user_role() = 'ADMIN'
);

-- MAINTENANCE WINDOWS
CREATE POLICY "Maintenance viewable by public" ON maintenance_windows FOR SELECT USING (true);
CREATE POLICY "Maintenance insertable by ADMIN" ON maintenance_windows FOR INSERT TO authenticated WITH CHECK (auth_user_role() = 'ADMIN');
CREATE POLICY "Maintenance updatable by ADMIN" ON maintenance_windows FOR UPDATE TO authenticated USING (auth_user_role() = 'ADMIN');
CREATE POLICY "Maintenance deletable by ADMIN" ON maintenance_windows FOR DELETE TO authenticated USING (auth_user_role() = 'ADMIN');

-- NOTIFICATIONS
CREATE POLICY "Notifications viewable by self" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Notifications updatable by self" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- AUDIT LOGS
CREATE POLICY "Audit logs viewable by ADMIN" ON audit_logs FOR SELECT TO authenticated USING (auth_user_role() = 'ADMIN');
CREATE POLICY "Audit logs insertable by all" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
