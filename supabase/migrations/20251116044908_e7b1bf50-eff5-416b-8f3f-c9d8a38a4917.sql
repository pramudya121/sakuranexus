-- Add offer_id column to offers table
ALTER TABLE public.offers
ADD COLUMN offer_id INTEGER;

-- Add index for better query performance
CREATE INDEX idx_offers_offer_id ON public.offers(offer_id);

-- Add comment for clarity
COMMENT ON COLUMN public.offers.offer_id IS 'The offerId from the blockchain smart contract';