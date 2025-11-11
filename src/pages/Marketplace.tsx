import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import NFTCard from '@/components/NFTCard';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { buyNFT, makeOffer } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Search, SlidersHorizontal } from 'lucide-react';

interface NFTListing {
  id: string;
  token_id: number;
  name: string;
  image_url: string;
  price: string;
  owner_address: string;
  listing_id: number;
}

const Marketplace = () => {
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [filteredListings, setFilteredListings] = useState<NFTListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFTListing | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('marketplace-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings',
        },
        () => {
          fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = listings.filter((nft) =>
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.token_id.toString().includes(searchQuery)
      );
      setFilteredListings(filtered);
    } else {
      setFilteredListings(listings);
    }
  }, [searchQuery, listings]);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          listing_id,
          token_id,
          price,
          seller_address,
          nfts (
            name,
            image_url,
            owner_address
          )
        `)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedListings = data.map((item: any) => ({
        id: item.id,
        listing_id: item.listing_id,
        token_id: item.token_id,
        name: item.nfts?.name || `NFT #${item.token_id}`,
        image_url: item.nfts?.image_url || '',
        price: item.price,
        owner_address: item.seller_address,
      }));

      setListings(formattedListings);
      setFilteredListings(formattedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace listings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (nft: NFTListing) => {
    const account = await getCurrentAccount();
    if (!account) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to buy NFTs',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await buyNFT(nft.listing_id, nft.price, account, nft.token_id);
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: 'NFT purchased successfully!',
        });
        fetchListings();
      } else {
        toast({
          title: 'Purchase Failed',
          description: result.error || 'Failed to buy NFT',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during purchase',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!selectedNFT || !offerPrice) return;

    const account = await getCurrentAccount();
    if (!account) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to make offers',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await makeOffer(selectedNFT.token_id, offerPrice, account);
      
      if (result.success) {
        toast({
          title: 'Offer Submitted!',
          description: 'Your offer has been sent to the owner',
        });
        setShowOfferDialog(false);
        setOfferPrice('');
        setSelectedNFT(null);
      } else {
        toast({
          title: 'Offer Failed',
          description: result.error || 'Failed to make offer',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while making offer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">NFT Marketplace</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover and collect extraordinary NFTs on NEXUSLABS
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or token ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-2xl font-bold mb-2">No NFTs Listed</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'No NFTs match your search' : 'Be the first to list an NFT!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((nft) => (
              <NFTCard
                key={nft.id}
                tokenId={nft.token_id}
                name={nft.name}
                imageUrl={nft.image_url}
                price={nft.price}
                owner={nft.owner_address}
                isListed={true}
                onBuy={() => handleBuy(nft)}
                onMakeOffer={() => {
                  setSelectedNFT(nft);
                  setShowOfferDialog(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Make Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Submit your offer for {selectedNFT?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Current Price: {selectedNFT?.price} NEX
              </label>
              <Input
                type="number"
                step="0.001"
                placeholder="Enter your offer in NEX"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleMakeOffer}
              disabled={!offerPrice || isProcessing}
              className="btn-hero w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Offer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Marketplace;
