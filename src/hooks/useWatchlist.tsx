import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { useToast } from '@/hooks/use-toast';

export interface WatchlistItem {
  id: string;
  nft_id: string;
  wallet_address: string;
  created_at: string;
  nft?: {
    id: string;
    name: string;
    image_url: string;
    token_id: number;
    owner_address: string;
  };
}

export const useWatchlist = () => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [nftIds, setNftIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = useCallback(async () => {
    const currentAccount = await getCurrentAccount();
    setAccount(currentAccount);

    if (!currentAccount) {
      setItems([]);
      setNftIds(new Set());
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select(`
          id,
          nft_id,
          wallet_address,
          created_at,
          nfts (
            id,
            name,
            image_url,
            token_id,
            owner_address
          )
        `)
        .eq('wallet_address', currentAccount.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const watchlistItems = (data || []).map(item => ({
        ...item,
        nft: item.nfts as any,
      }));

      setItems(watchlistItems);
      setNftIds(new Set(watchlistItems.map(item => item.nft_id)));
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const isInWatchlist = useCallback((nftId: string): boolean => {
    return nftIds.has(nftId);
  }, [nftIds]);

  const addToWatchlist = useCallback(async (nftId: string): Promise<boolean> => {
    if (!account) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to use watchlist',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('watchlist')
        .insert({ 
          wallet_address: account.toLowerCase(), 
          nft_id: nftId 
        });

      if (error) throw error;

      setNftIds(prev => new Set([...prev, nftId]));
      toast({
        title: 'Added to Watchlist',
        description: "You'll be notified of price changes",
      });
      loadWatchlist();
      return true;
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Already in Watchlist',
          description: 'This NFT is already in your watchlist',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to add to watchlist',
          variant: 'destructive',
        });
      }
      return false;
    }
  }, [account, toast, loadWatchlist]);

  const removeFromWatchlist = useCallback(async (nftId: string): Promise<boolean> => {
    if (!account) return false;

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('wallet_address', account.toLowerCase())
        .eq('nft_id', nftId);

      if (error) throw error;

      setNftIds(prev => {
        const next = new Set(prev);
        next.delete(nftId);
        return next;
      });
      setItems(prev => prev.filter(item => item.nft_id !== nftId));
      
      toast({
        title: 'Removed from Watchlist',
        description: 'NFT removed from your watchlist',
      });
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove from watchlist',
        variant: 'destructive',
      });
      return false;
    }
  }, [account, toast]);

  const toggleWatchlist = useCallback(async (nftId: string): Promise<boolean> => {
    if (isInWatchlist(nftId)) {
      return removeFromWatchlist(nftId);
    } else {
      return addToWatchlist(nftId);
    }
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist]);

  return {
    items,
    nftIds,
    isLoading,
    account,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    refresh: loadWatchlist,
  };
};