-- Migration: 20261104220000_add_venue_details_and_specifications.sql
-- Description: Adds image_url, images, and specifications to venues, updates Auditorium, CSE Seminar Hall, and Gallery

-- 1. Add image_url, images array, and specifications jsonb to venues
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

-- 2. Add any missing facilities
INSERT INTO public.facilities (name) VALUES
    ('CCTV'),
    ('Stage'),
    ('Sound Console')
ON CONFLICT (name) DO NOTHING;

-- 3. Update 'Auditorium' / 'Main Auditorium'
UPDATE public.venues
SET 
    name = 'Auditorium',
    slug = 'auditorium',
    capacity = 1500,
    description = 'Premier campus auditorium equipped with acoustic sound arrays, high-definition stage lighting, 24x9 LED video wall, dual green rooms, and extensive seating for convocations, cultural festivals, and major conferences.',
    image_url = '/images/venues/auditorium/front-view.jpeg',
    images = ARRAY[
        '/images/venues/auditorium/front-view.jpeg',
        '/images/venues/auditorium/stage-view.jpeg',
        '/images/venues/auditorium/audience-view.jpeg'
    ],
    specifications = jsonb_build_object(
        'seating', jsonb_build_object(
            'total_capacity', '1,000–1,500 people',
            'available_chairs', 700,
            'fixed_chairs', 65,
            'balcony', true
        ),
        'audio', jsonb_build_object(
            'wireless_microphones', 4,
            'podium_microphones', 2,
            'headset_microphones', 1,
            'microphones_total', 7,
            'subwoofer_speakers', 6,
            'top_speakers', 12,
            'centre_field_speakers', 2,
            'monitor_speakers', 6,
            'speakers_total', 26,
            'sound_console', true
        ),
        'visual', jsonb_build_object(
            'led_screen', '24 × 9',
            'led_par_26', 1,
            'par_lights', 20,
            'warm_led_par_lights', 'Available',
            'projectors', null
        ),
        'stage', jsonb_build_object(
            'available', true,
            'size', '50 × 33'
        ),
        'facilities', jsonb_build_object(
            'ac', 'Available 24/7',
            'wifi', true,
            'wifi_routers', 4,
            'cctv', true,
            'cctv_cameras', null,
            'sound_console', true,
            'green_rooms', 2,
            'sofas', 6,
            'swamiji_sofas', 2,
            'large_tables', 9,
            'small_tables', 3,
            'pillars', '4 pillars (9/3 dimensions as recorded; retain this as an unverified specification until clarified)',
            'entrances', null,
            'exits', null
        )
    ),
    updated_at = NOW()
WHERE id = '30000000-0000-0000-0000-000000000001' OR slug IN ('main-auditorium', 'auditorium');

-- 4. Update 'CSE Seminar Hall' (previously Seminar Hall A)
UPDATE public.venues
SET 
    name = 'CSE Seminar Hall',
    slug = 'cse-seminar-hall',
    building = 'CS Block',
    floor = 'First',
    capacity = 190,
    description = 'Specialized academic seminar hall for Computer Science & Engineering, equipped with interactive projection, acoustic speakers, high-speed Wi-Fi, and CCTV monitoring for seminars and workshops.',
    image_url = '/images/venues/cse-seminar-hall/frontview.jpeg',
    images = ARRAY[
        '/images/venues/cse-seminar-hall/frontview.jpeg',
        '/images/venues/cse-seminar-hall/sideview.jpeg',
        '/images/venues/cse-seminar-hall/backview.jpeg'
    ],
    specifications = jsonb_build_object(
        'seating', jsonb_build_object(
            'total_capacity', '190 people',
            'available_chairs', null,
            'fixed_chairs', null,
            'balcony', false
        ),
        'audio', jsonb_build_object(
            'speakers_total', 4,
            'microphones_total', 6,
            'wireless_microphones', null,
            'podium_microphones', null,
            'headset_microphones', null,
            'sound_console', null
        ),
        'visual', jsonb_build_object(
            'projectors', 1,
            'led_screen', null
        ),
        'stage', jsonb_build_object(
            'available', null,
            'size', null
        ),
        'facilities', jsonb_build_object(
            'ac', 'Available',
            'wifi', true,
            'wifi_routers', 2,
            'cctv', true,
            'cctv_cameras', 2,
            'sound_console', null,
            'entrances', null,
            'exits', null
        )
    ),
    updated_at = NOW()
WHERE id = '30000000-0000-0000-0000-000000000002' OR slug IN ('seminar-hall-a', 'cse-seminar-hall');

-- 5. Update 'Gallery'
UPDATE public.venues
SET 
    name = 'Gallery',
    slug = 'gallery',
    building = 'Arts Block',
    floor = 'Ground',
    capacity = 230,
    description = 'Multi-purpose exhibition and presentation gallery equipped with dual entrances/exits, dedicated sound console, computer workstation, interactive projection, and premium surround audio.',
    image_url = '/images/venues/gallery/front-view.jpeg',
    images = ARRAY[
        '/images/venues/gallery/front-view.jpeg',
        '/images/venues/gallery/side-view.jpeg',
        '/images/venues/gallery/back-view.jpeg'
    ],
    specifications = jsonb_build_object(
        'seating', jsonb_build_object(
            'total_capacity', '230 people',
            'available_chairs', null,
            'fixed_chairs', null,
            'balcony', false
        ),
        'audio', jsonb_build_object(
            'speakers_total', 6,
            'microphones_total', 4,
            'podium_microphones', 1,
            'wireless_microphones', 2,
            'headset_microphones', 1,
            'sound_console', true
        ),
        'visual', jsonb_build_object(
            'projectors', 1,
            'computer_system', 1
        ),
        'stage', jsonb_build_object(
            'available', null,
            'size', null
        ),
        'facilities', jsonb_build_object(
            'ac', 'Available',
            'wifi', true,
            'wifi_routers', null,
            'cctv', null,
            'cctv_cameras', null,
            'sound_console', true,
            'computer_system', 1,
            'entrances', 2,
            'exits', 2
        )
    ),
    updated_at = NOW()
WHERE id = '30000000-0000-0000-0000-000000000006' OR slug = 'gallery';

-- 6. Link venue_facilities for the 3 venues
-- Auditorium facilities: AC, Wi-Fi, Sound System, Microphone, Projector, Stage, Sound Console, CCTV
INSERT INTO public.venue_facilities (venue_id, facility_id)
SELECT v.id, f.id
FROM public.venues v, public.facilities f
WHERE v.slug = 'auditorium'
  AND f.name IN ('Air Conditioning', 'Wi-Fi', 'Sound System', 'Microphone', 'Stage', 'Sound Console', 'CCTV')
ON CONFLICT DO NOTHING;

-- CSE Seminar Hall facilities: AC, Wi-Fi, Sound System, Microphone, Projector, CCTV
INSERT INTO public.venue_facilities (venue_id, facility_id)
SELECT v.id, f.id
FROM public.venues v, public.facilities f
WHERE v.slug = 'cse-seminar-hall'
  AND f.name IN ('Air Conditioning', 'Wi-Fi', 'Sound System', 'Microphone', 'Projector', 'CCTV')
ON CONFLICT DO NOTHING;

-- Gallery facilities: AC, Wi-Fi, Sound System, Microphone, Projector, Sound Console
INSERT INTO public.venue_facilities (venue_id, facility_id)
SELECT v.id, f.id
FROM public.venues v, public.facilities f
WHERE v.slug = 'gallery'
  AND f.name IN ('Air Conditioning', 'Wi-Fi', 'Sound System', 'Microphone', 'Projector', 'Sound Console')
ON CONFLICT DO NOTHING;

-- 7. Refresh search_available_venues RPC to match updated table columns
CREATE OR REPLACE FUNCTION search_available_venues(
    p_start_at TIMESTAMPTZ,
    p_end_at TIMESTAMPTZ,
    p_capacity INTEGER,
    p_venue_type venue_type DEFAULT NULL,
    p_facility_ids UUID[] DEFAULT NULL
) RETURNS SETOF venues AS $$
BEGIN
    RETURN QUERY
    SELECT v.*
    FROM venues v
    WHERE v.active = true
      AND v.capacity >= p_capacity
      AND (p_venue_type IS NULL OR v.type = p_venue_type)
      AND (
          p_facility_ids IS NULL OR 
          array_length(p_facility_ids, 1) IS NULL OR
          v.id IN (
              SELECT vf.venue_id
              FROM venue_facilities vf
              WHERE vf.facility_id = ANY(p_facility_ids)
              GROUP BY vf.venue_id
              HAVING COUNT(vf.facility_id) = array_length(p_facility_ids, 1)
          )
      )
      AND NOT EXISTS (
          SELECT 1
          FROM maintenance_windows mw
          WHERE mw.venue_id = v.id
            AND tstzrange(mw.start_at, mw.end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
      )
      AND NOT EXISTS (
          SELECT 1
          FROM bookings b
          WHERE b.venue_id = v.id
            AND b.status IN ('CONFIRMED', 'COMPLETED')
            AND tstzrange(b.start_at, b.end_at, '[)') && tstzrange(p_start_at, p_end_at, '[)')
      );
END;
$$ LANGUAGE plpgsql STABLE;

