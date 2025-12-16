import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WatchlistButtonProps {
  nftId: string;
  walletAddress: string | null;
}

const WatchlistButton = ({ nftId, walletAddress }: WatchlistButtonProps) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!walletAddress) return;

      const { data } = await supabase
        .from('watchlist')
        .select('id')
        .eq('wallet_address', walletAddress)
        .eq('nft_id', nftId)
        .maybeSingle();

      setIsInWatchlist(!!data);
    };

    checkWatchlist();

    // Subscribe to watchlist changes
    const channel = supabase
      .channel('watchlist-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'watchlist',
          filter: `nft_id=eq.${nftId}`,
        },
        () => {
          checkWatchlist();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nftId, walletAddress]);

  const toggleWatchlist = async () => {
    if (!walletAddress) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to use watchlist',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    if (isInWatchlist) {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('wallet_address', walletAddress)
        .eq('nft_id', nftId);

      if (!error) {
        setIsInWatchlist(false);
        toast({
          title: 'Removed from Watchlist',
          description: 'NFT removed from your watchlist',
        });
      }
    } else {
      const { error } = await supabase
        .from('watchlist')
        .insert({ wallet_address: walletAddress, nft_id: nftId });

      if (!error) {
        setIsInWatchlist(true);
        toast({
          title: 'Added to Watchlist',
          description: "You'll be notified when the price drops",
        });
      }
    }

    setLoading(false);
  };

  return (
    <Button
      variant={isInWatchlist ? 'default' : 'outline'}
      size="icon"
      onClick={toggleWatchlist}
      disabled={loading}
    >
      <Heart className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
    </Button>
  );
};

export default WatchlistButton;
