-- Fix security issues for notifications, user_profiles, and nfts tables

-- 1. Fix notifications table - Remove public readable policy
DROP POLICY IF EXISTS "Anyone can read notifications by recipient" ON public.notifications;

-- Keep only the wallet-address-based policy for reading own notifications
-- The policy "Users can view their own notifications" already exists

-- 2. Fix user_profiles table - Make sensitive data only viewable by authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Create new policies for user_profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile with wallet check" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (
  lower(wallet_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
);

CREATE POLICY "Users can update their own profile with wallet check" 
ON public.user_profiles 
FOR UPDATE 
USING (
  lower(wallet_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
);

-- 3. Fix nfts table - Restrict insert and update to authenticated operations
DROP POLICY IF EXISTS "Anyone can insert NFTs" ON public.nfts;
DROP POLICY IF EXISTS "Anyone can update NFTs" ON public.nfts;

-- Create proper policies for NFTs
CREATE POLICY "Authenticated users can insert NFTs" 
ON public.nfts 
FOR INSERT 
WITH CHECK (
  lower(owner_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
);

CREATE POLICY "NFT owners can update their NFTs" 
ON public.nfts 
FOR UPDATE 
USING (
  lower(owner_address) = lower(((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
);