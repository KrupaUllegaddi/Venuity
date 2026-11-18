-- Migration: 20261104235000_provision_faculty_hod_admin_accounts.sql
-- Description: Provisions 45 Faculty, 1 HOD, and 2 Admin accounts with proper auth & profiles

-- 1. Reconcile existing accounts to preserve booking history and IDs

-- Reconcile Rajanna R C (ADMIN)
UPDATE auth.users
SET 
  email = 'rajanna.r.c@venuity.local',
  encrypted_password = crypt('Venuity#Rajanna2026', gen_salt('bf', 6)),
  raw_user_meta_data = jsonb_build_object('full_name', 'Rajanna R C', 'department_id', NULL),
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  reauthentication_token = '',
  email_change_token_current = '',
  phone_change = '',
  phone_change_token = '',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE public.profiles
SET 
  full_name = 'Rajanna R C',
  email = 'rajanna.r.c@venuity.local',
  role = 'ADMIN',
  department_id = NULL,
  active = true,
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Reconcile Dr. Krishna A N (HOD)
UPDATE auth.users
SET 
  email = 'krishna.a.n@venuity.local',
  encrypted_password = crypt('Venuity#Krishna2026', gen_salt('bf', 6)),
  raw_user_meta_data = jsonb_build_object('full_name', 'Dr. Krishna A N', 'department_id', '10000000-0000-0000-0000-000000000001'),
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  reauthentication_token = '',
  email_change_token_current = '',
  phone_change = '',
  phone_change_token = '',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE public.profiles
SET 
  full_name = 'Dr. Krishna A N',
  email = 'krishna.a.n@venuity.local',
  role = 'HOD',
  department_id = '10000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Reconcile Dr. Naveena C (FACULTY)
UPDATE auth.users
SET 
  email = 'naveena.c@venuity.local',
  encrypted_password = crypt('Venuity#Naveena2026', gen_salt('bf', 6)),
  raw_user_meta_data = jsonb_build_object('full_name', 'Dr. Naveena C', 'department_id', '10000000-0000-0000-0000-000000000001'),
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '',
  reauthentication_token = '',
  email_change_token_current = '',
  phone_change = '',
  phone_change_token = '',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE public.profiles
SET 
  full_name = 'Dr. Naveena C',
  email = 'naveena.c@venuity.local',
  role = 'FACULTY',
  department_id = '10000000-0000-0000-0000-000000000001',
  active = true,
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000003';

-- 2. Create new accounts for remaining faculty and Admin 2
DO $$
DECLARE
  new_user_id uuid;
BEGIN

  -- Provision Placement Admin (ADMIN)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('Placement@sjbit.edu.in')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'Placement@sjbit.edu.in',
      crypt('Venuity#Placement2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Placement Admin', 'department_id', NULL),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'Placement@sjbit.edu.in', 'Placement Admin', 'ADMIN', NULL, true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Placement Admin', role = 'ADMIN', department_id = NULL, active = true, updated_at = NOW()
    WHERE lower(email) = lower('Placement@sjbit.edu.in');
  END IF;

  -- Provision Dr. Bindiya M K (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('bindiya.m.k@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'bindiya.m.k@venuity.local',
      crypt('Venuity#Bindiya2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Dr. Bindiya M K', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'bindiya.m.k@venuity.local', 'Dr. Bindiya M K', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Dr. Bindiya M K', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('bindiya.m.k@venuity.local');
  END IF;

  -- Provision Dr. Ajay B N (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('ajay.b.n@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'ajay.b.n@venuity.local',
      crypt('Venuity#Ajay2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Dr. Ajay B N', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'ajay.b.n@venuity.local', 'Dr. Ajay B N', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Dr. Ajay B N', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('ajay.b.n@venuity.local');
  END IF;

  -- Provision Dr. Prasad A Y (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('prasad.a.y@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'prasad.a.y@venuity.local',
      crypt('Venuity#Prasad2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Dr. Prasad A Y', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'prasad.a.y@venuity.local', 'Dr. Prasad A Y', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Dr. Prasad A Y', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('prasad.a.y@venuity.local');
  END IF;

  -- Provision Dr. Shantha Kumar H C (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('shantha.kumar.h.c@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'shantha.kumar.h.c@venuity.local',
      crypt('Venuity#Shantha2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Dr. Shantha Kumar H C', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'shantha.kumar.h.c@venuity.local', 'Dr. Shantha Kumar H C', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Dr. Shantha Kumar H C', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('shantha.kumar.h.c@venuity.local');
  END IF;

  -- Provision Dr. Veena H N (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('veena.h.n@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'veena.h.n@venuity.local',
      crypt('Venuity#Veena2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Dr. Veena H N', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'veena.h.n@venuity.local', 'Dr. Veena H N', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Dr. Veena H N', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('veena.h.n@venuity.local');
  END IF;

  -- Provision Dr. Roopa M J (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('roopa.m.j@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'roopa.m.j@venuity.local',
      crypt('Venuity#Roopa2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Dr. Roopa M J', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'roopa.m.j@venuity.local', 'Dr. Roopa M J', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Dr. Roopa M J', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('roopa.m.j@venuity.local');
  END IF;

  -- Provision Dr. Prakruthi M K (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('prakruthi.m.k@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'prakruthi.m.k@venuity.local',
      crypt('Venuity#Prakruthi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Dr. Prakruthi M K', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'prakruthi.m.k@venuity.local', 'Dr. Prakruthi M K', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Dr. Prakruthi M K', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('prakruthi.m.k@venuity.local');
  END IF;

  -- Provision Dr. Arun Kumar D R (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('arun.kumar.d.r@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'arun.kumar.d.r@venuity.local',
      crypt('Venuity#Arun2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Dr. Arun Kumar D R', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'arun.kumar.d.r@venuity.local', 'Dr. Arun Kumar D R', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Dr. Arun Kumar D R', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('arun.kumar.d.r@venuity.local');
  END IF;

  -- Provision Mr. Dhananjaya M (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('dhananjaya.m@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'dhananjaya.m@venuity.local',
      crypt('Venuity#Dhananjaya2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mr. Dhananjaya M', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'dhananjaya.m@venuity.local', 'Mr. Dhananjaya M', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mr. Dhananjaya M', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('dhananjaya.m@venuity.local');
  END IF;

  -- Provision Mrs. Shubha T V (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('shubha.t.v@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'shubha.t.v@venuity.local',
      crypt('Venuity#Shubha2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Shubha T V', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'shubha.t.v@venuity.local', 'Mrs. Shubha T V', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Shubha T V', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('shubha.t.v@venuity.local');
  END IF;

  -- Provision Mr. Lochan Gowda M (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('lochan.gowda.m@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'lochan.gowda.m@venuity.local',
      crypt('Venuity#Lochan2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mr. Lochan Gowda M', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'lochan.gowda.m@venuity.local', 'Mr. Lochan Gowda M', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mr. Lochan Gowda M', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('lochan.gowda.m@venuity.local');
  END IF;

  -- Provision Mrs. Srinidhi K S (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('srinidhi.k.s@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'srinidhi.k.s@venuity.local',
      crypt('Venuity#Srinidhi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Srinidhi K S', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'srinidhi.k.s@venuity.local', 'Mrs. Srinidhi K S', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Srinidhi K S', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('srinidhi.k.s@venuity.local');
  END IF;

  -- Provision Mrs. Anusha M (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('anusha.m@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'anusha.m@venuity.local',
      crypt('Venuity#Anusha2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Anusha M', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'anusha.m@venuity.local', 'Mrs. Anusha M', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Anusha M', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('anusha.m@venuity.local');
  END IF;

  -- Provision Mrs. Rajeshwari G L (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('rajeshwari.g.l@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'rajeshwari.g.l@venuity.local',
      crypt('Venuity#Rajeshwari2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Rajeshwari G L', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'rajeshwari.g.l@venuity.local', 'Mrs. Rajeshwari G L', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Rajeshwari G L', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('rajeshwari.g.l@venuity.local');
  END IF;

  -- Provision Mrs. Laxmi Shabadi (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('laxmi.shabadi@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'laxmi.shabadi@venuity.local',
      crypt('Venuity#Laxmi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Laxmi Shabadi', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'laxmi.shabadi@venuity.local', 'Mrs. Laxmi Shabadi', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Laxmi Shabadi', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('laxmi.shabadi@venuity.local');
  END IF;

  -- Provision Mrs. Jyothi P.K (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('jyothi.p.k@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'jyothi.p.k@venuity.local',
      crypt('Venuity#Jyothi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Jyothi P.K', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'jyothi.p.k@venuity.local', 'Mrs. Jyothi P.K', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Jyothi P.K', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('jyothi.p.k@venuity.local');
  END IF;

  -- Provision Mrs. Kavya G (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('kavya.g@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'kavya.g@venuity.local',
      crypt('Venuity#Kavya2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Kavya G', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'kavya.g@venuity.local', 'Mrs. Kavya G', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Kavya G', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('kavya.g@venuity.local');
  END IF;

  -- Provision Mrs. Vijayalakshmi B (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('vijayalakshmi.b@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'vijayalakshmi.b@venuity.local',
      crypt('Venuity#Vijayalakshmi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Vijayalakshmi B', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'vijayalakshmi.b@venuity.local', 'Mrs. Vijayalakshmi B', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Vijayalakshmi B', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('vijayalakshmi.b@venuity.local');
  END IF;

  -- Provision Mrs. Rajani (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('rajani@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'rajani@venuity.local',
      crypt('Venuity#Rajani2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Rajani', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'rajani@venuity.local', 'Mrs. Rajani', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Rajani', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('rajani@venuity.local');
  END IF;

  -- Provision Mrs. Chetana K N (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('chetana.k.n@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'chetana.k.n@venuity.local',
      crypt('Venuity#Chetana2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Chetana K N', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'chetana.k.n@venuity.local', 'Mrs. Chetana K N', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Chetana K N', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('chetana.k.n@venuity.local');
  END IF;

  -- Provision Mrs. Shilpashree S (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('shilpashree.s@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'shilpashree.s@venuity.local',
      crypt('Venuity#Shilpashree2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Shilpashree S', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'shilpashree.s@venuity.local', 'Mrs. Shilpashree S', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Shilpashree S', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('shilpashree.s@venuity.local');
  END IF;

  -- Provision Mrs. Vinutha K (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('vinutha.k@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'vinutha.k@venuity.local',
      crypt('Venuity#Vinutha2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Vinutha K', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'vinutha.k@venuity.local', 'Mrs. Vinutha K', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Vinutha K', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('vinutha.k@venuity.local');
  END IF;

  -- Provision Mrs. Vijayalaxmi Joshi (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('vijayalaxmi.joshi@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'vijayalaxmi.joshi@venuity.local',
      crypt('Venuity#Vijayalaxmi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Vijayalaxmi Joshi', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'vijayalaxmi.joshi@venuity.local', 'Mrs. Vijayalaxmi Joshi', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Vijayalaxmi Joshi', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('vijayalaxmi.joshi@venuity.local');
  END IF;

  -- Provision Mr. Santhosh K (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('santhosh.k@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'santhosh.k@venuity.local',
      crypt('Venuity#Santhosh2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mr. Santhosh K', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'santhosh.k@venuity.local', 'Mr. Santhosh K', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mr. Santhosh K', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('santhosh.k@venuity.local');
  END IF;

  -- Provision Mrs. Shreenagamanjula Rani (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('shreenagamanjula.rani@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'shreenagamanjula.rani@venuity.local',
      crypt('Venuity#Shreenagamanjula2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Shreenagamanjula Rani', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'shreenagamanjula.rani@venuity.local', 'Mrs. Shreenagamanjula Rani', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Shreenagamanjula Rani', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('shreenagamanjula.rani@venuity.local');
  END IF;

  -- Provision Mrs. Bhanumathi H R (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('bhanumathi.h.r@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'bhanumathi.h.r@venuity.local',
      crypt('Venuity#Bhanumathi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Bhanumathi H R', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'bhanumathi.h.r@venuity.local', 'Mrs. Bhanumathi H R', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Bhanumathi H R', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('bhanumathi.h.r@venuity.local');
  END IF;

  -- Provision Ms. Archana V (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('archana.v@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'archana.v@venuity.local',
      crypt('Venuity#Archana2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Ms. Archana V', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'archana.v@venuity.local', 'Ms. Archana V', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Ms. Archana V', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('archana.v@venuity.local');
  END IF;

  -- Provision Mrs. Ganga B M (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('ganga.b.m@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'ganga.b.m@venuity.local',
      crypt('Venuity#Ganga2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Ganga B M', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'ganga.b.m@venuity.local', 'Mrs. Ganga B M', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Ganga B M', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('ganga.b.m@venuity.local');
  END IF;

  -- Provision Mrs. Madhushree V (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('madhushree.v@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'madhushree.v@venuity.local',
      crypt('Venuity#Madhushree2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Madhushree V', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'madhushree.v@venuity.local', 'Mrs. Madhushree V', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Madhushree V', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('madhushree.v@venuity.local');
  END IF;

  -- Provision Mrs. Meghana N R (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('meghana.n.r@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'meghana.n.r@venuity.local',
      crypt('Venuity#Meghana2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Meghana N R', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'meghana.n.r@venuity.local', 'Mrs. Meghana N R', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Meghana N R', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('meghana.n.r@venuity.local');
  END IF;

  -- Provision Mrs. Manjula H S (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('manjula.h.s@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'manjula.h.s@venuity.local',
      crypt('Venuity#Manjula2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Manjula H S', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'manjula.h.s@venuity.local', 'Mrs. Manjula H S', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Manjula H S', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('manjula.h.s@venuity.local');
  END IF;

  -- Provision Mrs. Suma B N (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('suma.b.n@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'suma.b.n@venuity.local',
      crypt('Venuity#Suma2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Suma B N', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'suma.b.n@venuity.local', 'Mrs. Suma B N', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Suma B N', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('suma.b.n@venuity.local');
  END IF;

  -- Provision Mrs. Prakruthi G R (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('prakruthi.g.r@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'prakruthi.g.r@venuity.local',
      crypt('Venuity#Prakruthi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Mrs. Prakruthi G R', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'prakruthi.g.r@venuity.local', 'Mrs. Prakruthi G R', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Mrs. Prakruthi G R', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('prakruthi.g.r@venuity.local');
  END IF;

  -- Provision Lokesh K (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('lokesh.k@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'lokesh.k@venuity.local',
      crypt('Venuity#Lokesh2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Lokesh K', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'lokesh.k@venuity.local', 'Lokesh K', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Lokesh K', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('lokesh.k@venuity.local');
  END IF;

  -- Provision Hemanth Kumar (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('hemanth.kumar@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'hemanth.kumar@venuity.local',
      crypt('Venuity#Hemanth2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Hemanth Kumar', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'hemanth.kumar@venuity.local', 'Hemanth Kumar', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Hemanth Kumar', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('hemanth.kumar@venuity.local');
  END IF;

  -- Provision Yeshwanth Kumar K B (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('yeshwanth.kumar.k.b@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'yeshwanth.kumar.k.b@venuity.local',
      crypt('Venuity#Yeshwanth2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Yeshwanth Kumar K B', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'yeshwanth.kumar.k.b@venuity.local', 'Yeshwanth Kumar K B', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Yeshwanth Kumar K B', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('yeshwanth.kumar.k.b@venuity.local');
  END IF;

  -- Provision Muniswamy D (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('muniswamy.d@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'muniswamy.d@venuity.local',
      crypt('Venuity#Muniswamy2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Muniswamy D', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'muniswamy.d@venuity.local', 'Muniswamy D', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Muniswamy D', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('muniswamy.d@venuity.local');
  END IF;

  -- Provision Yankappa (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('yankappa@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'yankappa@venuity.local',
      crypt('Venuity#Yankappa2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Yankappa', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'yankappa@venuity.local', 'Yankappa', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Yankappa', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('yankappa@venuity.local');
  END IF;

  -- Provision ManjeGowda G R (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('manjegowda.g.r@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'manjegowda.g.r@venuity.local',
      crypt('Venuity#Manjegowda2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'ManjeGowda G R', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'manjegowda.g.r@venuity.local', 'ManjeGowda G R', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'ManjeGowda G R', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('manjegowda.g.r@venuity.local');
  END IF;

  -- Provision Thejaswini B S (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('thejaswini.b.s@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'thejaswini.b.s@venuity.local',
      crypt('Venuity#Thejaswini2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Thejaswini B S', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'thejaswini.b.s@venuity.local', 'Thejaswini B S', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Thejaswini B S', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('thejaswini.b.s@venuity.local');
  END IF;

  -- Provision Pushpa R (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('pushpa.r@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'pushpa.r@venuity.local',
      crypt('Venuity#Pushpa2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Pushpa R', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'pushpa.r@venuity.local', 'Pushpa R', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Pushpa R', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('pushpa.r@venuity.local');
  END IF;

  -- Provision Vaishnavi M (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('vaishnavi.m@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'vaishnavi.m@venuity.local',
      crypt('Venuity#Vaishnavi2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Vaishnavi M', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'vaishnavi.m@venuity.local', 'Vaishnavi M', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Vaishnavi M', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('vaishnavi.m@venuity.local');
  END IF;

  -- Provision Prathap Kumar C K (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('prathap.kumar.c.k@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'prathap.kumar.c.k@venuity.local',
      crypt('Venuity#Prathap2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Prathap Kumar C K', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'prathap.kumar.c.k@venuity.local', 'Prathap Kumar C K', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Prathap Kumar C K', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('prathap.kumar.c.k@venuity.local');
  END IF;

  -- Provision Manoj Kumar B (FACULTY)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower('manoj.kumar.b@venuity.local')) THEN
    new_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      reauthentication_token, email_change_token_current, phone_change, phone_change_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'manoj.kumar.b@venuity.local',
      crypt('Venuity#Manoj2026', gen_salt('bf', 6)),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', 'Manoj Kumar B', 'department_id', '10000000-0000-0000-0000-000000000001'),
      NOW(),
      NOW(),
      '', '', '', '', '', '', '', ''
    );

    -- Ensure profile has exact role, name, department_id
    INSERT INTO public.profiles (id, email, full_name, role, department_id, active, created_at, updated_at)
    VALUES (new_user_id, 'manoj.kumar.b@venuity.local', 'Manoj Kumar B', 'FACULTY', '10000000-0000-0000-0000-000000000001', true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      role = EXCLUDED.role,
      department_id = EXCLUDED.department_id,
      active = true,
      updated_at = NOW();
  ELSE
    -- If already exists, reconcile profile
    UPDATE public.profiles
    SET full_name = 'Manoj Kumar B', role = 'FACULTY', department_id = '10000000-0000-0000-0000-000000000001', active = true, updated_at = NOW()
    WHERE lower(email) = lower('manoj.kumar.b@venuity.local');
  END IF;
END $$;
