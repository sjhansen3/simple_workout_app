-- Fix permission constraint for new share link types
ALTER TABLE public.share_links
DROP CONSTRAINT IF EXISTS share_links_permission_check;

ALTER TABLE public.share_links
ADD CONSTRAINT share_links_permission_check
CHECK (permission IN ('complete', 'log_view', 'view_lists', 'view_activity'));
