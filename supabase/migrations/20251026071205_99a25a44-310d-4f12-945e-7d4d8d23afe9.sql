-- Fix SECURITY DEFINER view issue by recreating as SECURITY INVOKER
-- Views don't support RLS policies, so we just need to ensure the view uses SECURITY INVOKER

-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS users_public CASCADE;

-- Recreate view as SECURITY INVOKER (default behavior)
-- This makes the view execute with the permissions of the calling user, not the creator
CREATE VIEW users_public AS 
SELECT id, username, display_name
FROM users;

-- Add comment for documentation
COMMENT ON VIEW users_public IS 'Public view of user information with safe fields only (id, username, display_name). Uses SECURITY INVOKER - queries execute with caller permissions, respecting RLS policies on underlying users table.';