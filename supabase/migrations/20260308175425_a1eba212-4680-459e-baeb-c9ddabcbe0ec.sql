
-- Trigger: auto-award badges when activities are inserted
CREATE TRIGGER on_activity_check_badges
  AFTER INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_badges();

-- Trigger: auto-notify NFT owner when a new offer is created
CREATE TRIGGER on_new_offer_notify
  AFTER INSERT ON public.offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_offer();
