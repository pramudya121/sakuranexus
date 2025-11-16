import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface OfferNotificationListenerProps {
  walletAddress: string | null;
}

export const OfferNotificationListener = ({ walletAddress }: OfferNotificationListenerProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!walletAddress) return;

    // Listen for new notifications
    const channel = supabase
      .channel('offer-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_address=eq.${walletAddress.toLowerCase()}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          const notification = payload.new;
          
          // Show toast notification for new offers
          if (notification.notification_type === 'new_offer') {
            toast({
              title: notification.title,
              description: notification.message,
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress, toast]);

  return null;
};
