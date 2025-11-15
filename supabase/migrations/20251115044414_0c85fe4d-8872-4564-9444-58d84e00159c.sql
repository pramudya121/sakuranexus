-- Fix remaining security warnings for existing functions

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix notify_new_offer function
CREATE OR REPLACE FUNCTION public.notify_new_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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