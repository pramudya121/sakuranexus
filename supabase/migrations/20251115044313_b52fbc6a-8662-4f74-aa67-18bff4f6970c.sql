-- Create user badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  badge_type text NOT NULL,
  earned_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  nft_id uuid REFERENCES public.nfts(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(wallet_address, nft_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_badges
CREATE POLICY "Badges are viewable by everyone"
  ON public.user_badges
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert badges"
  ON public.user_badges
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for watchlist
CREATE POLICY "Users can view their own watchlist"
  ON public.watchlist
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add to their watchlist"
  ON public.watchlist
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can remove from their watchlist"
  ON public.watchlist
  FOR DELETE
  USING (true);

-- Function to auto-award badges based on activity
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for badge awarding
DROP TRIGGER IF EXISTS award_badges_on_activity ON public.activities;
CREATE TRIGGER award_badges_on_activity
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_badges();

-- Enable realtime for watchlist
ALTER PUBLICATION supabase_realtime ADD TABLE public.watchlist;