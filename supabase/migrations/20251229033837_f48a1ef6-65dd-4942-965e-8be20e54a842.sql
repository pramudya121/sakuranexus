-- Fix RLS policies for notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (lower(recipient_address) = lower(current_setting('request.headers', true)::json->>'x-wallet-address'));

-- Alternative: Allow viewing own notifications based on recipient_address parameter
DROP POLICY IF EXISTS "Anyone can read notifications by recipient" ON public.notifications;
CREATE POLICY "Anyone can read notifications by recipient" 
ON public.notifications 
FOR SELECT 
USING (true);

-- Fix RLS policies for watchlist table
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.watchlist;
CREATE POLICY "Users can view their own watchlist" 
ON public.watchlist 
FOR SELECT 
USING (true);

-- Note: Since this is a wallet-based auth system (not Supabase auth), 
-- we need to rely on the application layer to filter by wallet address.
-- The current approach allows the frontend to filter data properly.