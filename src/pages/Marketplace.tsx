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
import { Loader2, Search, SlidersHorizontal, Package, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
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
    let filtered = [...listings];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((nft) =>
        nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.token_id.toString().includes(searchQuery)
      );
    }

    // Apply price range filter
    if (priceMin) {
      filtered = filtered.filter((nft) => parseFloat(nft.price) >= parseFloat(priceMin));
    }
    if (priceMax) {
      filtered = filtered.filter((nft) => parseFloat(nft.price) <= parseFloat(priceMax));
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'oldest':
        filtered.sort((a, b) => a.token_id - b.token_id);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.token_id - a.token_id);
        break;
    }

    setFilteredListings(filtered);
  }, [searchQuery, listings, sortBy, priceMin, priceMax]);

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
    <div className="min-h-screen relative">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(328 85% 55% / 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(320 90% 60% / 0.15) 0%, transparent 50%)',
        }}
      />
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Header with enhanced styling */}
        <div className="text-center mb-12">
          <div className="inline-block px-6 py-2 rounded-full bg-gradient-sakura text-white font-medium shadow-elegant mb-4">
            <Package className="inline-block mr-2 h-4 w-4" />
            NFT Marketplace
          </div>
          <h1 className="text-6xl font-bold mb-4">
            <span className="gradient-text">Explore Collections</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover and collect extraordinary NFTs on NEXUSLABS Testnet
          </p>
        </div>

        {/* Search and Filters with enhanced design */}
        <div className="max-w-4xl mx-auto mb-12 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or token ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg border-2 focus:border-primary shadow-card"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-12 shadow-card">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant={showFilters ? "default" : "outline"} 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2 h-12 px-6 shadow-card hover:shadow-elegant transition-all"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="glass p-6 rounded-xl shadow-card border-2 border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Advanced Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setPriceMin('');
                    setPriceMax('');
                  }}
                >
                  Clear All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-min">Min Price (NEX)</Label>
                  <Input
                    id="price-min"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="border-2 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price-max">Max Price (NEX)</Label>
                  <Input
                    id="price-max"
                    type="number"
                    step="0.01"
                    placeholder="Any"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="border-2 focus:border-primary"
                  />
                </div>
              </div>
              {(priceMin || priceMax) && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {priceMin && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-sm">
                      Min: {priceMin} NEX
                      <button onClick={() => setPriceMin('')}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {priceMax && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full text-sm">
                      Max: {priceMax} NEX
                      <button onClick={() => setPriceMax('')}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
