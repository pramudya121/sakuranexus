
CREATE OR REPLACE FUNCTION public.deactivate_listing(
  p_listing_id integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listings
  SET active = false,
      updated_at = now()
  WHERE listing_id = p_listing_id
    AND active = true;
  
  RETURN FOUND;
END;
$$;
