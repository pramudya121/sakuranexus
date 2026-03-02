
-- Create a security definer function to transfer NFT ownership
-- This bypasses RLS so the buyer can update the owner_address after purchase
CREATE OR REPLACE FUNCTION public.transfer_nft_ownership(
  p_token_id integer,
  p_contract_address text,
  p_new_owner text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.nfts
  SET owner_address = lower(p_new_owner),
      updated_at = now()
  WHERE token_id = p_token_id
    AND contract_address = p_contract_address;
  
  RETURN FOUND;
END;
$$;
