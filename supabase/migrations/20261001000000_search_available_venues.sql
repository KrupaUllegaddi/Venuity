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
