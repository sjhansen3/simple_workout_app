-- Seed Data for Workout Lists
-- Creates test users, lists, completions, and share links

-- ============================================
-- CREATE TEST USERS (via auth.users)
-- ============================================

-- Create Sarah (client with workout data)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'sarah@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name": "Sarah Johnson"}',
  'authenticated',
  'authenticated'
);

-- Create Mike (trainer who follows Sarah)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'mike@test.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"name": "Mike Trainer"}',
  'authenticated',
  'authenticated'
);

-- Profiles are auto-created by trigger, but let's make sure they exist
-- (The trigger should fire, but just in case)
INSERT INTO public.profiles (id, email, name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'sarah@test.com', 'Sarah Johnson'),
  ('22222222-2222-2222-2222-222222222222', 'mike@test.com', 'Mike Trainer')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ============================================
-- CREATE WORKOUT LISTS
-- ============================================

-- Sarah's Morning Routine
INSERT INTO public.lists (id, owner_user_id, title, description, created_at, updated_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Morning Routine',
  'Full body morning workout - 3x per week',
  NOW() - INTERVAL '14 days',
  NOW()
);

-- Sarah's Evening Cardio
INSERT INTO public.lists (id, owner_user_id, title, description, created_at, updated_at)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'Evening Cardio',
  '30 min cardio sessions',
  NOW() - INTERVAL '7 days',
  NOW()
);

-- Mike's Client Template (so he has his own list too)
INSERT INTO public.lists (id, owner_user_id, title, description, created_at, updated_at)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '22222222-2222-2222-2222-222222222222',
  'Beginner Full Body',
  'Template for new clients',
  NOW() - INTERVAL '30 days',
  NOW()
);

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
  ('11110001-0001-0001-0001-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'Plank', 'Hold for time', '[{"value": 60, "unit": "freetext"}]');

-- Evening Cardio exercises
INSERT INTO public.list_items (id, list_id, sort_order, name, description, targets)
VALUES
  ('22220002-0002-0002-0002-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 0, 'Treadmill Run', '30 minutes moderate pace', '[{"value": 30, "unit": "freetext"}]'),
  ('22220002-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'Cool Down Walk', '5 minutes', '[{"value": 5, "unit": "freetext"}]');

-- Beginner Full Body exercises
INSERT INTO public.list_items (id, list_id, sort_order, name, description, targets)
VALUES
  ('33330003-0003-0003-0003-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 'Goblet Squat', 'Keep chest up', '[{"value": 25, "unit": "lbs"}, {"value": 12, "unit": "reps"}]'),
  ('33330003-0003-0003-0003-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, 'Push-ups', 'Modify on knees if needed', '[{"value": 10, "unit": "reps"}]'),
  ('33330003-0003-0003-0003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2, 'Dumbbell Rows', 'One arm at a time', '[{"value": 20, "unit": "lbs"}, {"value": 10, "unit": "reps"}]');

-- ============================================
-- CREATE COMPLETIONS (workout logs)
-- ============================================

-- LAST WEEK completions for Sarah (Morning Routine) - 2 workouts
INSERT INTO public.list_completions (id, list_id, user_id, completed_at, week_start, notes)
VALUES
  ('c0mp0001-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '9 days', (DATE_TRUNC('week', NOW() - INTERVAL '7 days'))::date, 'Felt a bit tired today'),
  ('c0mp0001-0001-0001-0001-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '7 days', (DATE_TRUNC('week', NOW() - INTERVAL '7 days'))::date, NULL);

-- THIS WEEK completions for Sarah (Morning Routine) - 3 workouts with progress!
INSERT INTO public.list_completions (id, list_id, user_id, completed_at, week_start, notes)
VALUES
  ('c0mp0001-0001-0001-0001-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '4 days', (DATE_TRUNC('week', NOW()))::date, NULL),
  ('c0mp0001-0001-0001-0001-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '2 days', (DATE_TRUNC('week', NOW()))::date, 'Felt strong on bench today!'),
  ('c0mp0001-0001-0001-0001-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '1 day', (DATE_TRUNC('week', NOW()))::date, 'PRd on deadlifts!');

-- ============================================
-- CREATE ITEM RESULTS (exercise results per completion)
-- ============================================

-- Last week workout 1 results
INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
VALUES
  ('c0mp0001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000001', true, '135', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000002', true, '185', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000003', true, '225', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000004', true, '8', 'reps'),
  ('c0mp0001-0001-0001-0001-000000000001', '11110001-0001-0001-0001-000000000005', true, '45 seconds', 'freetext');

-- Last week workout 2 results
INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
VALUES
  ('c0mp0001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000001', true, '140', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000002', true, '185', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000003', true, '225', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000004', true, '9', 'reps'),
  ('c0mp0001-0001-0001-0001-000000000002', '11110001-0001-0001-0001-000000000005', true, '50 seconds', 'freetext');

-- This week workout 1 results
INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
VALUES
  ('c0mp0001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000001', true, '140', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000002', true, '190', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000003', true, '225', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000004', true, '10', 'reps'),
  ('c0mp0001-0001-0001-0001-000000000003', '11110001-0001-0001-0001-000000000005', true, '55 seconds', 'freetext');

-- This week workout 2 results (progress on bench!)
INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
VALUES
  ('c0mp0001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000001', true, '145', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000002', true, '190', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000003', true, '230', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000004', true, '10', 'reps'),
  ('c0mp0001-0001-0001-0001-000000000004', '11110001-0001-0001-0001-000000000005', true, '60 seconds', 'freetext');

-- This week workout 3 results (PR on deadlifts!)
INSERT INTO public.list_item_results (completion_id, list_item_id, is_checked, result_value, result_unit)
VALUES
  ('c0mp0001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000001', true, '145', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000002', true, '195', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000003', true, '245', 'lbs'),
  ('c0mp0001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000004', true, '11', 'reps'),
  ('c0mp0001-0001-0001-0001-000000000005', '11110001-0001-0001-0001-000000000005', true, '60 seconds', 'freetext');

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
  '11111111-1111-1111-1111-111111111111'
);

-- Share link for Sarah's Morning Routine LOG (Mike can follow this)
INSERT INTO public.share_links (id, token, resource_type, resource_id, permission, scope, created_by_user_id)
VALUES (
  'sha00002-0002-0002-0002-000000000001',
  'share-log-sarah-morning',
  'log',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'log_view',
  '{"owner_user_id": "11111111-1111-1111-1111-111111111111"}',
  '11111111-1111-1111-1111-111111111111'
);

-- ============================================
-- CREATE LOG SUBSCRIPTION (Mike follows Sarah)
-- ============================================

INSERT INTO public.log_subscriptions (id, user_id, share_link_id, nickname, email_digest)
VALUES (
  'sub00001-0001-0001-0001-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'sha00002-0002-0002-0002-000000000001',
  'Sarah - Morning Routine',
  false
);

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
