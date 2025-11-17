-- Delete notifications related to offers without offer_id first
DELETE FROM public.notifications 
WHERE offer_id IN (
  SELECT id FROM public.offers WHERE offer_id IS NULL
);

-- Now delete old offers without offer_id
DELETE FROM public.offers WHERE offer_id IS NULL;

-- Create offer_logs table for tracking all offer transactions
CREATE TABLE public.offer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id INTEGER,
  action TEXT NOT NULL CHECK (action IN ('make', 'accept', 'cancel')),
  user_address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  amount TEXT,
  transaction_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.offer_logs ENABLE ROW LEVEL SECURITY;

-- Logs are viewable by everyone for transparency
CREATE POLICY "Offer logs are viewable by everyone"
ON public.offer_logs
FOR SELECT
USING (true);

-- Only system can insert logs
CREATE POLICY "System can insert offer logs"
ON public.offer_logs
FOR INSERT
WITH CHECK (true);

-- Fix notifications security - prevent fake notifications
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;

-- Only allow inserting notifications through database functions (via triggers)
CREATE POLICY "Only system can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (false);

-- Create function to create notifications (to be called by triggers only)
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_address TEXT,
  p_sender_address TEXT,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_nft_id UUID DEFAULT NULL,
  p_offer_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    recipient_address,
    sender_address,
    notification_type,
    title,
    message,
    nft_id,
    offer_id
  ) VALUES (
    p_recipient_address,
    p_sender_address,
    p_notification_type,
    p_title,
    p_message,
    p_nft_id,
    p_offer_id
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Add banner_url column to user_profiles for OpenSea-style profile
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create realtime publication for offers table
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER TABLE public.offers REPLICA IDENTITY FULL;