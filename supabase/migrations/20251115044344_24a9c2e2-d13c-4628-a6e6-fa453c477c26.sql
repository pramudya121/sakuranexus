-- Fix security warnings: Set search_path for all functions

-- Fix check_and_award_badges function
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_nft_count integer;
  user_sales_count integer;
BEGIN
  -- Check for Early Adopter badge (first 100 minters)
  IF NEW.activity_type = 'mint' THEN
    INSERT INTO public.user_badges (wallet_address, badge_type)
    SELECT NEW.to_address, 'early_adopter'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_badges 
      WHERE wallet_address = NEW.to_address AND badge_type = 'early_adopter'
    )
    AND (SELECT COUNT(*) FROM public.nfts) <= 100;
  END IF;

  -- Check for Collector badge (owns 5+ NFTs)
  IF NEW.activity_type IN ('mint', 'sale', 'transfer') AND NEW.to_address IS NOT NULL THEN
    SELECT COUNT(*) INTO user_nft_count
    FROM public.nfts
    WHERE owner_address = NEW.to_address;

    IF user_nft_count >= 5 THEN
      INSERT INTO public.user_badges (wallet_address, badge_type)
      SELECT NEW.to_address, 'collector'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_badges 
        WHERE wallet_address = NEW.to_address AND badge_type = 'collector'
      );
    END IF;
  END IF;

  -- Check for Top Seller badge (completed 10+ sales)
  IF NEW.activity_type = 'sale' AND NEW.from_address IS NOT NULL THEN
    SELECT COUNT(*) INTO user_sales_count
    FROM public.activities
    WHERE activity_type = 'sale' AND from_address = NEW.from_address;

    IF user_sales_count >= 10 THEN
      INSERT INTO public.user_badges (wallet_address, badge_type)
      SELECT NEW.from_address, 'top_seller'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.user_badges 
        WHERE wallet_address = NEW.from_address AND badge_type = 'top_seller'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;