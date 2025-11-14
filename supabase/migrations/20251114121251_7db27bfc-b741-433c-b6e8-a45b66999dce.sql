-- Create user_profiles table for customizable user profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  username TEXT,
  bio TEXT,
  avatar_url TEXT,
  twitter_handle TEXT,
  instagram_handle TEXT,
  discord_handle TEXT,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.user_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (true);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_address TEXT NOT NULL,
  sender_address TEXT,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  nft_id UUID REFERENCES public.nfts(id),
  offer_id UUID REFERENCES public.offers(id),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (true);

-- Trigger for updated_at on user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notification when new offer is made
CREATE OR REPLACE FUNCTION public.notify_new_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  nft_owner_address TEXT;
  nft_name TEXT;
BEGIN
  -- Get NFT owner and name
  SELECT owner_address, name INTO nft_owner_address, nft_name
  FROM public.nfts
  WHERE token_id = NEW.token_id AND contract_address = NEW.contract_address
  LIMIT 1;

  -- Create notification for NFT owner
  IF nft_owner_address IS NOT NULL AND nft_owner_address != NEW.offerer_address THEN
    INSERT INTO public.notifications (
      recipient_address,
      sender_address,
      notification_type,
      title,
      message,
      nft_id,
      offer_id
    )
    VALUES (
      nft_owner_address,
      NEW.offerer_address,
      'new_offer',
      'New Offer Received!',
      'You received a new offer of ' || NEW.offer_price || ' NEX for ' || nft_name,
      NEW.nft_id,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to create notification when new offer is made
CREATE TRIGGER on_new_offer_created
  AFTER INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_offer();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;