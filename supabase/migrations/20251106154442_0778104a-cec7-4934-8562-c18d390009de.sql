-- Fix guest_sessions RLS policies to prevent unauthorized access
-- Drop the overly permissive policy that allows anyone to do anything
DROP POLICY IF EXISTS "Guests can manage own session" ON public.guest_sessions;

-- Disable ALL direct client access to guest_sessions table
-- All operations must go through the track_guest_usage RPC function
CREATE POLICY "Block all direct access to guest_sessions"
ON public.guest_sessions
FOR ALL
USING (false)
WITH CHECK (false);

-- Ensure the track_guest_usage function is properly secured
-- (It's already SECURITY DEFINER, which is correct)