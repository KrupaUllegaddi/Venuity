DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'booking_requests') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE booking_requests;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bookings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'venues') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE venues;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'maintenance_windows') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_windows;
    END IF;
END $$;
