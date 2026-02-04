-- Workout Lists Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension (should already be enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lists (workout templates)
CREATE TABLE public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- List Items (exercises within a list)
CREATE TABLE public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  targets JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- List Completions (user's instance of executing a list)
CREATE TABLE public.list_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  anon_session_id TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  week_start DATE NOT NULL,
  notes TEXT,
  CONSTRAINT user_or_anon CHECK (
    (user_id IS NOT NULL AND anon_session_id IS NULL) OR
    (user_id IS NULL AND anon_session_id IS NOT NULL)
  )
);

-- List Item Results (individual exercise results within a completion)
CREATE TABLE public.list_item_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  completion_id UUID NOT NULL REFERENCES public.list_completions(id) ON DELETE CASCADE,
  list_item_id UUID NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
  is_checked BOOLEAN DEFAULT FALSE,
  result_value TEXT,
  result_unit TEXT CHECK (result_unit IN ('lbs', 'reps', 'freetext')),
  notes TEXT
);

-- Saved Lists (user bookmarks)
CREATE TABLE public.saved_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  anon_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_or_anon_saved CHECK (
    (user_id IS NOT NULL AND anon_session_id IS NULL) OR
    (user_id IS NULL AND anon_session_id IS NOT NULL)
  )
);

-- Unique constraints for saved_lists (only one of user_id or anon_session_id will be set)
CREATE UNIQUE INDEX saved_lists_user_list ON public.saved_lists(list_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX saved_lists_anon_list ON public.saved_lists(list_id, anon_session_id) WHERE anon_session_id IS NOT NULL;

-- Share Links (capability-based access)
CREATE TABLE public.share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('list', 'log')),
  resource_id UUID NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('complete', 'log_view')),
  scope JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log Subscriptions (follow shared logs)
CREATE TABLE public.log_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
  nickname TEXT,
  email_digest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, share_link_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_lists_owner ON public.lists(owner_user_id);
CREATE INDEX idx_list_items_list ON public.list_items(list_id);
CREATE INDEX idx_list_items_sort ON public.list_items(list_id, sort_order);
CREATE INDEX idx_completions_list ON public.list_completions(list_id);
CREATE INDEX idx_completions_user ON public.list_completions(user_id);
CREATE INDEX idx_completions_anon ON public.list_completions(anon_session_id);
CREATE INDEX idx_completions_week ON public.list_completions(week_start);
CREATE INDEX idx_item_results_completion ON public.list_item_results(completion_id);
CREATE INDEX idx_share_links_token ON public.share_links(token);
CREATE INDEX idx_share_links_resource ON public.share_links(resource_type, resource_id);
CREATE INDEX idx_log_subscriptions_user ON public.log_subscriptions(user_id);
CREATE INDEX idx_log_subscriptions_share_link ON public.log_subscriptions(share_link_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to convert anonymous data to user on signup
CREATE OR REPLACE FUNCTION convert_anon_to_user(p_anon_session_id TEXT, p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Update completions
  UPDATE public.list_completions
  SET user_id = p_user_id, anon_session_id = NULL
  WHERE anon_session_id = p_anon_session_id;

  -- Update saved lists (handle potential duplicates)
  UPDATE public.saved_lists
  SET user_id = p_user_id, anon_session_id = NULL
  WHERE anon_session_id = p_anon_session_id
  AND list_id NOT IN (
    SELECT list_id FROM public.saved_lists WHERE user_id = p_user_id
  );

  -- Delete any remaining anonymous saved lists (duplicates)
  DELETE FROM public.saved_lists WHERE anon_session_id = p_anon_session_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_item_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Lists policies
CREATE POLICY "Lists are viewable by everyone"
  ON public.lists FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own lists"
  ON public.lists FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own lists"
  ON public.lists FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Users can delete own lists"
  ON public.lists FOR DELETE
  USING (auth.uid() = owner_user_id);

-- List items policies
CREATE POLICY "List items are viewable by everyone"
  ON public.list_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert items to own lists"
  ON public.list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE id = list_id AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in own lists"
  ON public.list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE id = list_id AND owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from own lists"
  ON public.list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE id = list_id AND owner_user_id = auth.uid()
    )
  );

-- Completions policies
CREATE POLICY "Users can view own completions"
  ON public.list_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert completions"
  ON public.list_completions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own completions"
  ON public.list_completions FOR UPDATE
  USING (auth.uid() = user_id);

-- Item results policies
CREATE POLICY "Users can view own item results"
  ON public.list_item_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.list_completions
      WHERE id = completion_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert item results"
  ON public.list_item_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own item results"
  ON public.list_item_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.list_completions
      WHERE id = completion_id AND user_id = auth.uid()
    )
  );

-- Saved lists policies
CREATE POLICY "Users can view own saved lists"
  ON public.saved_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert saved lists"
  ON public.saved_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete own saved lists"
  ON public.saved_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Share links policies
CREATE POLICY "Share links are viewable by everyone"
  ON public.share_links FOR SELECT
  USING (true);

CREATE POLICY "Users can create share links"
  ON public.share_links FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id OR created_by_user_id IS NULL);

CREATE POLICY "Users can update own share links"
  ON public.share_links FOR UPDATE
  USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete own share links"
  ON public.share_links FOR DELETE
  USING (auth.uid() = created_by_user_id);

-- Log subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON public.log_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.log_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.log_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON public.log_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER FOR PROFILE CREATION ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
