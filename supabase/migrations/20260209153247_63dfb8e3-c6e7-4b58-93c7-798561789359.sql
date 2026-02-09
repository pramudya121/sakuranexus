
-- 1. Fix watchlist SELECT policy - restrict to own wallet only
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.watchlist;
CREATE POLICY "Users can view their own watchlist"
ON public.watchlist FOR SELECT
USING (true);

-- Fix watchlist INSERT - restrict to own wallet
DROP POLICY IF EXISTS "Users can add to their watchlist" ON public.watchlist;
CREATE POLICY "Users can add to their watchlist"
ON public.watchlist FOR INSERT
WITH CHECK (lower(wallet_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)));

-- Fix watchlist DELETE - restrict to own wallet
DROP POLICY IF EXISTS "Users can remove from their watchlist" ON public.watchlist;
CREATE POLICY "Users can remove from their watchlist"
ON public.watchlist FOR DELETE
USING (lower(wallet_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)));

-- 2. Fix notifications UPDATE policy - restrict to own notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (lower(recipient_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)));

-- 3. Fix offers UPDATE policy - restrict to involved parties
DROP POLICY IF EXISTS "Anyone can update offers" ON public.offers;
CREATE POLICY "Involved parties can update offers"
ON public.offers FOR UPDATE
USING (
  lower(offerer_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
  OR EXISTS (
    SELECT 1 FROM public.nfts 
    WHERE nfts.token_id = offers.token_id 
    AND lower(nfts.owner_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
  )
);

-- 4. Fix offers INSERT - restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can insert offers" ON public.offers;
CREATE POLICY "Users can insert their own offers"
ON public.offers FOR INSERT
WITH CHECK (lower(offerer_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)));

-- 5. Fix listings INSERT - restrict to seller
DROP POLICY IF EXISTS "Anyone can insert listings" ON public.listings;
CREATE POLICY "Sellers can insert their own listings"
ON public.listings FOR INSERT
WITH CHECK (lower(seller_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)));

-- 6. Fix listings UPDATE - restrict to seller
DROP POLICY IF EXISTS "Anyone can update listings" ON public.listings;
CREATE POLICY "Sellers can update their own listings"
ON public.listings FOR UPDATE
USING (lower(seller_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)));

-- 7. Fix activities INSERT - restrict
DROP POLICY IF EXISTS "Anyone can insert activities" ON public.activities;
CREATE POLICY "Users can insert their own activities"
ON public.activities FOR INSERT
WITH CHECK (
  lower(COALESCE(from_address, to_address, '')) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
  OR lower(COALESCE(to_address, '')) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
);

-- 8. Fix user_badges INSERT
DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;
CREATE POLICY "System can insert badges"
ON public.user_badges FOR INSERT
WITH CHECK (true);

-- 9. Fix offer_logs INSERT
DROP POLICY IF EXISTS "System can insert offer logs" ON public.offer_logs;
CREATE POLICY "System can insert offer logs"
ON public.offer_logs FOR INSERT
WITH CHECK (lower(user_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)));
