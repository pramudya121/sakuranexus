
-- Fix 1: Restrict watchlist SELECT to only the owner
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.watchlist;
CREATE POLICY "Users can view their own watchlist"
ON public.watchlist
FOR SELECT
USING (lower(wallet_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)));

-- Fix 2: Restrict user_profiles SELECT - users can see all profiles (needed for marketplace) 
-- but we create a view that hides sensitive social links from non-owners
-- Actually, profiles are meant to be public (marketplace profiles), so we keep SELECT true
-- but the security concern is about linking wallet to social media.
-- Best approach: keep profiles public (needed for NFT marketplace) but mark the finding as acceptable
-- since profile data is voluntarily provided by users and meant to be displayed publicly.
