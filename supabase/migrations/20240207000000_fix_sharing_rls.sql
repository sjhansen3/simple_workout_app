-- Fix RLS policies for shared activity viewing
-- When a user shares their activity, others need to be able to view their profile and completions

-- ============================================
-- PROFILES - Allow viewing shared user profiles
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new policy that allows:
-- 1. Users to view their own profile
-- 2. Anyone to view a profile if there's an active share link for that user
CREATE POLICY "Users can view profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.share_links sl
      WHERE sl.is_active = true
      AND (sl.expires_at IS NULL OR sl.expires_at > NOW())
      AND sl.resource_type IN ('user_activity', 'user_lists', 'log')
      AND (
        -- User-level shares reference the user in scope
        (sl.scope->>'owner_user_id')::uuid = profiles.id
        -- Or the resource_id is the user ID for user-level shares
        OR (sl.resource_type IN ('user_activity', 'user_lists') AND sl.resource_id = profiles.id)
      )
    )
  );

-- ============================================
-- LIST COMPLETIONS - Allow viewing shared completions
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own completions" ON public.list_completions;

-- Create new policy that allows:
-- 1. Users to view their own completions
-- 2. Anyone to view completions if there's an active share link for that user's activity
CREATE POLICY "Users can view completions"
  ON public.list_completions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.share_links sl
      WHERE sl.is_active = true
      AND (sl.expires_at IS NULL OR sl.expires_at > NOW())
      AND (
        -- User activity share - can view all completions for that user
        (sl.resource_type = 'user_activity' AND (sl.scope->>'owner_user_id')::uuid = list_completions.user_id)
        -- Log share for specific list - can view completions for that list by that user
        OR (sl.resource_type = 'log'
            AND sl.resource_id = list_completions.list_id
            AND (sl.scope->>'owner_user_id')::uuid = list_completions.user_id)
      )
    )
  );

-- ============================================
-- LIST ITEM RESULTS - Allow viewing shared results
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own item results" ON public.list_item_results;

-- Create new policy that allows:
-- 1. Users to view their own item results
-- 2. Anyone to view results if they can view the parent completion
CREATE POLICY "Users can view item results"
  ON public.list_item_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.list_completions lc
      WHERE lc.id = list_item_results.completion_id
      AND (
        lc.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.share_links sl
          WHERE sl.is_active = true
          AND (sl.expires_at IS NULL OR sl.expires_at > NOW())
          AND (
            (sl.resource_type = 'user_activity' AND (sl.scope->>'owner_user_id')::uuid = lc.user_id)
            OR (sl.resource_type = 'log'
                AND sl.resource_id = lc.list_id
                AND (sl.scope->>'owner_user_id')::uuid = lc.user_id)
          )
        )
      )
    )
  );

-- ============================================
-- Add reaction column to completions if not exists
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'list_completions'
    AND column_name = 'reaction'
  ) THEN
    ALTER TABLE public.list_completions ADD COLUMN reaction TEXT;
  END IF;
END $$;
