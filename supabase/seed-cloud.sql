-- Seed Data for Workout Lists (CLOUD VERSION)
--
-- IMPORTANT: Before running this, create two test users via Supabase Auth Dashboard:
--   1. sarah@test.com with password: password123
--   2. mike@test.com with password: password123
--
-- After creating the users, update the UUIDs below with the actual user IDs from
-- the auth.users table (visible in the Authentication > Users tab)
--
-- Or run this query to find them:
--   SELECT id, email FROM auth.users WHERE email IN ('sarah@test.com', 'mike@test.com');

-- ============================================
-- SET USER IDS (update these after creating users)
-- ============================================
-- Replace these placeholder UUIDs with actual user IDs from your Supabase Auth

DO $$
DECLARE
  sarah_id UUID;
  mike_id UUID;
BEGIN
  -- Look up the user IDs by email
  SELECT id INTO sarah_id FROM auth.users WHERE email = 'sarah@test.com';
  SELECT id INTO mike_id FROM auth.users WHERE email = 'mike@test.com';

  -- Validate that both users exist
  IF sarah_id IS NULL THEN
    RAISE EXCEPTION 'User sarah@test.com not found. Please create this user in Auth dashboard first.';
  END IF;
  IF mike_id IS NULL THEN
    RAISE EXCEPTION 'User mike@test.com not found. Please create this user in Auth dashboard first.';
  END IF;

  -- ============================================
  -- ENSURE PROFILES EXIST
  -- ============================================
  INSERT INTO public.profiles (id, email, name)
  VALUES
    (sarah_id, 'sarah@test.com', 'Sarah Johnson'),
    (mike_id, 'mike@test.com', 'Mike Trainer')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- ============================================
  -- CREATE WORKOUT LISTS
  -- ============================================

  -- Sarah's Morning Routine
  INSERT INTO public.lists (id, owner_user_id, title, description, created_at, updated_at)
  VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    sarah_id,
    'Morning Routine',
    'Full body morning workout - 3x per week',
    NOW() - INTERVAL '14 days',
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Sarah's Evening Cardio
  INSERT INTO public.lists (id, owner_user_id, title, description, created_at, updated_at)
  VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    sarah_id,
    'Evening Cardio',
    '30 min cardio sessions',
    NOW() - INTERVAL '7 days',
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Mike's Client Template
  INSERT INTO public.lists (id, owner_user_id, title, description, created_at, updated_at)
  VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    mike_id,
    'Beginner Full Body',
    'Template for new clients',
    NOW() - INTERVAL '30 days',
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- CREATE LIST ITEMS (exercises)
  -- ============================================

  -- Morning Routine exercises
  INSERT INTO public.list_items (id, list_id, sort_order, name, description, targets)
  VALUES
    ('11110001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 'Bench Press', 'Flat bench, controlled tempo', '[{"value": 135, "unit": "lbs"}, {"value": 10, "unit": "reps"}]'),
    ('11110001-0001-0001-0001-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'Squats', 'Below parallel', '[{"value": 185, "unit": "lbs"}, {"value": 8, "unit": "reps"}]'),
    ('11110001-0001-0001-0001-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'Deadlifts', 'Conventional stance', '[{"value": 225, "unit": "lbs"}, {"value": 5, "unit": "reps"}]'),
    ('11110001-0001-0001-0001-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'Pull-ups', 'Full range of motion', '[{"value": 10, "unit": "reps"}]'),
    ('11110001-0001-0001-0001-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Plank', 'Hold for time', '[{"value": 60, "unit": "freetext"}]')
  ON CONFLICT (id) DO NOTHING;

  -- Evening Cardio exercises
  INSERT INTO public.list_items (id, list_id, sort_order, name, description, targets)
  VALUES
    ('22220002-0002-0002-0002-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 'Treadmill Run', '30 minutes moderate pace', '[{"value": 30, "unit": "freetext"}]'),
    ('22220002-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'Cool Down Walk', '5 minutes', '[{"value": 5, "unit": "freetext"}]')
  ON CONFLICT (id) DO NOTHING;

  -- Beginner Full Body exercises
  INSERT INTO public.list_items (id, list_id, sort_order, name, description, targets)
  VALUES
    ('33330003-0003-0003-0003-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 'Goblet Squat', 'Keep chest up', '[{"value": 25, "unit": "lbs"}, {"value": 12, "unit": "reps"}]'),
    ('33330003-0003-0003-0003-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 'Push-ups', 'Modify on knees if needed', '[{"value": 10, "unit": "reps"}]'),
    ('33330003-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 'Dumbbell Rows', 'One arm at a time', '[{"value": 20, "unit": "lbs"}, {"value": 10, "unit": "reps"}]')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- CREATE COMPLETIONS (workout logs)
  -- ============================================

  -- LAST WEEK completions for Sarah (Morning Routine) - 2 workouts
  INSERT INTO public.list_completions (id, list_id, user_id, completed_at, week_start, notes)
  VALUES
    ('c0000001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', sarah_id,
     NOW() - INTERVAL '9 days', (DATE_TRUNC('week', NOW() - INTERVAL '7 days'))::date, 'Felt a bit tired today'),
    ('c0000001-0001-0001-0001-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', sarah_id,
     NOW() - INTERVAL '7 days', (DATE_TRUNC('week', NOW() - INTERVAL '7 days'))::date, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- THIS WEEK completions for Sarah (Morning Routine) - 3 workouts with progress!
  INSERT INTO public.list_completions (id, list_id, user_id, completed_at, week_start, notes)
  VALUES
    ('c0000001-0001-0001-0001-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', sarah_id,
     NOW() - INTERVAL '4 days', (DATE_TRUNC('week', NOW()))::date, NULL),
    ('c0000001-0001-0001-0001-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', sarah_id,
     NOW() - INTERVAL '2 days', (DATE_TRUNC('week', NOW()))::date, 'Felt strong on bench today!'),
    ('c0000001-0001-0001-0001-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', sarah_id,
     NOW() - INTERVAL '1 day', (DATE_TRUNC('week', NOW()))::date, 'PRd on deadlifts!')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- CREATE ITEM RESULTS (exercise results per completion)
  -- ============================================

  -- Last week workout 1 results
  INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
  VALUES
    ('c0000001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000001', true, '135', 'lbs'),
    ('c0000001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000002', true, '185', 'lbs'),
    ('c0000001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000003', true, '225', 'lbs'),
    ('c0000001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000004', true, '8', 'reps'),
    ('c0000001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000005', true, '45 seconds', 'freetext')
  ON CONFLICT DO NOTHING;

  -- Last week workout 2 results
  INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
  VALUES
    ('c0000001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000001', true, '140', 'lbs'),
    ('c0000001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000002', true, '185', 'lbs'),
    ('c0000001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000003', true, '225', 'lbs'),
    ('c0000001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000004', true, '9', 'reps'),
    ('c0000001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000005', true, '50 seconds', 'freetext')
  ON CONFLICT DO NOTHING;

  -- This week workout 1 results
  INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
  VALUES
    ('c0000001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000001', true, '140', 'lbs'),
    ('c0000001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000002', true, '190', 'lbs'),
    ('c0000001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000003', true, '225', 'lbs'),
    ('c0000001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000004', true, '10', 'reps'),
    ('c0000001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000005', true, '55 seconds', 'freetext')
  ON CONFLICT DO NOTHING;

  -- This week workout 2 results (progress on bench!)
  INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
  VALUES
    ('c0000001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000001', true, '145', 'lbs'),
    ('c0000001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000002', true, '190', 'lbs'),
    ('c0000001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000003', true, '230', 'lbs'),
    ('c0000001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000004', true, '10', 'reps'),
    ('c0000001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000005', true, '60 seconds', 'freetext')
  ON CONFLICT DO NOTHING;

  -- This week workout 3 results (PR on deadlifts!)
  INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
  VALUES
    ('c0000001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000001', true, '145', 'lbs'),
    ('c0000001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000002', true, '195', 'lbs'),
    ('c0000001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000003', true, '245', 'lbs'),
    ('c0000001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000004', true, '11', 'reps'),
    ('c0000001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000005', true, '60 seconds', 'freetext')
  ON CONFLICT DO NOTHING;

  -- ============================================
  -- CREATE SHARE LINKS
  -- ============================================

  -- Share link for Sarah's Morning Routine list (anyone can complete)
  INSERT INTO public.share_links (id, token, resource_type, resource_id, permission, scope, created_by_user_id)
  VALUES (
    'sha00001-0001-0001-0001-000000000001',
    'share-list-morning-routine',
    'list',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'complete',
    NULL,
    sarah_id
  ) ON CONFLICT (id) DO NOTHING;

  -- Share link for Sarah's Morning Routine LOG (Mike can follow this)
  INSERT INTO public.share_links (id, token, resource_type, resource_id, permission, scope, created_by_user_id)
  VALUES (
    'sha00002-0002-0002-0002-000000000001',
    'share-log-sarah-morning',
    'log',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'log_view',
    jsonb_build_object('owner_user_id', sarah_id::text),
    sarah_id
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- CREATE LOG SUBSCRIPTION (Mike follows Sarah)
  -- ============================================

  INSERT INTO public.log_subscriptions (id, user_id, share_link_id, nickname, email_digest)
  VALUES (
    'sub00001-0001-0001-0001-000000000001',
    mike_id,
    'sha00002-0002-0002-0002-000000000001',
    'Sarah - Morning Routine',
    false
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Sarah ID: %', sarah_id;
  RAISE NOTICE 'Mike ID: %', mike_id;

END $$;

-- ============================================
-- SUMMARY
-- ============================================
--
-- Test accounts:
--   sarah@test.com / password123 (has workout data)
--   mike@test.com / password123 (trainer, follows Sarah)
--
-- Share URLs to test:
--   /s/share-list-morning-routine  (complete Sarah's workout)
--   /l/share-log-sarah-morning     (view Sarah's log)
--
-- Sarah has:
--   - 2 workouts last week
--   - 3 workouts this week (with progress!)
--   - Progress: Bench 140→145, Squats 185→195, Deadlifts 225→245
--
-- Mike follows Sarah's log and will see the weekly summary
