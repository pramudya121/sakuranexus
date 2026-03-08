-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;

-- Create a restrictive INSERT policy - only service role (via triggers/functions) can insert
-- Since badges are awarded via the check_and_award_badges() SECURITY DEFINER trigger,
-- no direct client inserts should be allowed
CREATE POLICY "Only service role can insert badges"
ON public.user_badges
FOR INSERT
TO authenticated, anon
WITH CHECK (false);
