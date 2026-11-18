-- Migration: 20261104233000_cleanup_venues_and_correct_gallery.sql
-- Description: 
-- 1. Correct Gallery location to 'Admin Block' with capacity 230 and AC confirmed.
-- 2. Deactivate obsolete venues (Conference Room 1, Conference Room 2, Large Classroom, Seminar Hall B)
--    by setting active = false, safely preserving all historical booking and request relations.

-- 1. Update Gallery location and details
UPDATE public.venues
SET 
    building = 'Admin Block',
    capacity = 230,
    updated_at = NOW()
WHERE id = '30000000-0000-0000-0000-000000000006' OR slug = 'gallery';

-- 2. Deactivate the obsolete venues so only Auditorium, CSE Seminar Hall, and Gallery remain active
UPDATE public.venues
SET 
    active = false,
    updated_at = NOW()
WHERE slug IN ('conference-room-1', 'conference-room-2', 'large-classroom', 'seminar-hall-b')
   OR id IN (
       '30000000-0000-0000-0000-000000000003', -- Seminar Hall B
       '30000000-0000-0000-0000-000000000004', -- Conference Room 1
       '30000000-0000-0000-0000-000000000005', -- Conference Room 2
       '30000000-0000-0000-0000-000000000007'  -- Large Classroom
   );

-- 3. Ensure the three active venues are explicitly active
UPDATE public.venues
SET active = true
WHERE slug IN ('auditorium', 'cse-seminar-hall', 'gallery')
   OR id IN (
       '30000000-0000-0000-0000-000000000001',
       '30000000-0000-0000-0000-000000000002',
       '30000000-0000-0000-0000-000000000006'
   );

