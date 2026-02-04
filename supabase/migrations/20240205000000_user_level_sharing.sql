-- Add new resource types for user-level sharing
-- user_lists: share all workout templates
-- user_activity: share all workout activity/logs

-- Drop existing constraint
ALTER TABLE public.share_links
DROP CONSTRAINT IF EXISTS share_links_resource_type_check;

-- Add updated constraint with new types
ALTER TABLE public.share_links
ADD CONSTRAINT share_links_resource_type_check
CHECK (resource_type IN ('list', 'log', 'user_lists', 'user_activity'));

-- Also update permission constraint for new types
ALTER TABLE public.share_links
DROP CONSTRAINT IF EXISTS share_links_permission_check;

ALTER TABLE public.share_links
ADD CONSTRAINT share_links_permission_check
CHECK (permission IN ('complete', 'log_view', 'view_lists', 'view_activity'));
