-- Create NFTs table to store all minted NFTs metadata
CREATE TABLE public.nfts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  metadata_uri TEXT,
  minted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contract_address, token_id)
);

-- Create listings table for NFTs listed for sale
CREATE TABLE public.listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id INTEGER NOT NULL UNIQUE,
  nft_id UUID REFERENCES public.nfts(id) ON DELETE CASCADE,
  seller_address TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  price TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offers table for price offers on NFTs
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES public.nfts(id) ON DELETE CASCADE,
  offerer_address TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  offer_price TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table for transaction history
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_id UUID REFERENCES public.nfts(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  from_address TEXT,
  to_address TEXT,
  price TEXT,
  transaction_hash TEXT,
  contract_address TEXT NOT NULL,
  token_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (marketplace is public)
CREATE POLICY "NFTs are viewable by everyone" 
ON public.nfts FOR SELECT USING (true);

CREATE POLICY "Anyone can insert NFTs" 
ON public.nfts FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update NFTs" 
ON public.nfts FOR UPDATE USING (true);

CREATE POLICY "Listings are viewable by everyone" 
ON public.listings FOR SELECT USING (true);

CREATE POLICY "Anyone can insert listings" 
ON public.listings FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update listings" 
ON public.listings FOR UPDATE USING (true);

CREATE POLICY "Offers are viewable by everyone" 
ON public.offers FOR SELECT USING (true);

CREATE POLICY "Anyone can insert offers" 
ON public.offers FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update offers" 
ON public.offers FOR UPDATE USING (true);

CREATE POLICY "Activities are viewable by everyone" 
ON public.activities FOR SELECT USING (true);

CREATE POLICY "Anyone can insert activities" 
ON public.activities FOR INSERT WITH CHECK (true);

-- Create storage bucket for NFT images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('nft-images', 'nft-images', true);

-- Create storage policies
CREATE POLICY "NFT images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'nft-images');

CREATE POLICY "Anyone can upload NFT images" 
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'nft-images');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_nfts_updated_at
BEFORE UPDATE ON public.nfts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offers_updated_at
BEFORE UPDATE ON public.offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_nfts_owner ON public.nfts(owner_address);
CREATE INDEX idx_nfts_contract_token ON public.nfts(contract_address, token_id);
CREATE INDEX idx_listings_active ON public.listings(active);
CREATE INDEX idx_listings_seller ON public.listings(seller_address);
CREATE INDEX idx_offers_status ON public.offers(status);
CREATE INDEX idx_activities_type ON public.activities(activity_type);
CREATE INDEX idx_activities_created ON public.activities(created_at DESC);