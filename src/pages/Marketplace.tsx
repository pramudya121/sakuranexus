import { useState, useEffect, useMemo, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import NFTCard from '@/components/NFTCard';
import MarketplaceStats from '@/components/marketplace/MarketplaceStats';
import TrendingNFTs from '@/components/marketplace/TrendingNFTs';
import RecentActivity from '@/components/marketplace/RecentActivity';
import NFTGridSkeleton from '@/components/marketplace/NFTGridSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { buyNFT, makeOffer } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Search, SlidersHorizontal, Package, X, Grid3X3, LayoutGrid, RefreshCw, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<NFTListing | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<'normal' | 'compact'>('normal');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const loadWallet = async () => {
      const account = await getCurrentAccount();
      setWalletAddress(account);
    };
    loadWallet();
  }, []);

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

    // Check if trying to buy own NFT
    if (account.toLowerCase() === nft.owner_address.toLowerCase()) {
      toast({
        title: 'Cannot Buy',
        description: 'You cannot buy your own NFT',
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
          description: `You now own ${nft.name}!`,
        });
        // Delay refresh to allow blockchain and database to update
        setTimeout(() => fetchListings(), 2000);
      } else {
        const errorMessage = parseNFTError(result.error || 'Failed to buy NFT');
        toast({
          title: 'Purchase Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = parseNFTError(error.message || 'An error occurred during purchase');
      toast({
        title: 'Error',
        description: errorMessage,
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

    // Validate offer price
    const offerPriceNum = parseFloat(offerPrice);
    if (isNaN(offerPriceNum) || offerPriceNum <= 0) {
      toast({
        title: 'Invalid Offer',
        description: 'Please enter a valid offer amount',
        variant: 'destructive',
      });
      return;
    }

    // Check if making offer on own NFT
    if (account.toLowerCase() === selectedNFT.owner_address.toLowerCase()) {
      toast({
        title: 'Cannot Make Offer',
        description: 'You cannot make an offer on your own NFT',
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
          description: `Your offer of ${offerPrice} NEX has been sent to the owner`,
        });
        setShowOfferDialog(false);
        setOfferPrice('');
        setSelectedNFT(null);
      } else {
        const errorMessage = parseNFTError(result.error || 'Failed to make offer');
        toast({
          title: 'Offer Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = parseNFTError(error.message || 'An error occurred while making offer');
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse common NFT error messages for better UX
  const parseNFTError = (error: string): string => {
    if (error.includes('insufficient') || error.includes('INSUFFICIENT')) {
      return 'Insufficient balance for this transaction';
    }
    if (error.includes('rejected') || error.includes('denied')) {
      return 'Transaction was rejected by user';
    }
    if (error.includes('gas') || error.includes('fee')) {
      return 'Not enough gas for transaction';
    }
    if (error.includes('not listed') || error.includes('invalid listing')) {
      return 'This NFT is no longer listed for sale';
    }
    if (error.includes('already')) {
      return 'You already have a pending offer on this NFT';
    }
    return error.length > 100 ? error.substring(0, 100) + '...' : error;
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchListings();
    setIsRefreshing(false);
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (priceMin) count++;
    if (priceMax) count++;
    return count;
  }, [priceMin, priceMax]);

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
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-sakura text-white font-medium shadow-elegant mb-4">
            <Sparkles className="h-4 w-4" />
            NFT Marketplace
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">Explore Collections</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover and collect extraordinary NFTs on NEXUSLABS Testnet
          </p>
        </div>

        {/* Market Stats */}
        <div className="mb-8">
          <MarketplaceStats />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Trending & Activity */}
          <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
            <TrendingNFTs />
            <RecentActivity />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 order-1 lg:order-2">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or token ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-11 border-2 focus:border-primary shadow-card"
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-11 shadow-card">
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
                  className="gap-2 h-11 shadow-card hover:shadow-elegant transition-all relative"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button 
                    variant={gridSize === 'normal' ? 'secondary' : 'ghost'}
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => setGridSize('normal')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={gridSize === 'compact' ? 'secondary' : 'ghost'}
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => setGridSize('compact')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-11 w-11"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Advanced Filters Panel */}
              {showFilters && (
                <div className="glass p-6 rounded-xl shadow-card border-2 border-primary/20 animate-fade-in-up">
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
                        <Badge variant="secondary" className="gap-2 px-3 py-1">
                          Min: {priceMin} NEX
                          <button onClick={() => setPriceMin('')}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                      {priceMax && (
                        <Badge variant="secondary" className="gap-2 px-3 py-1">
                          Max: {priceMax} NEX
                          <button onClick={() => setPriceMax('')}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredListings.length}</span> items
              </p>
            </div>

            {/* Listings Grid */}
            {isLoading ? (
              <NFTGridSkeleton count={gridSize === 'compact' ? 12 : 8} />
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-20 glass rounded-2xl">
                <div className="text-6xl mb-4">🌸</div>
                <h3 className="text-2xl font-bold mb-2">No NFTs Listed</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? 'No NFTs match your search' : 'Be the first to list an NFT!'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setPriceMin('');
                    setPriceMax('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                gridSize === 'compact' 
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {filteredListings.map((nft) => (
                  <NFTCard
                    key={nft.id}
                    tokenId={nft.token_id}
                    name={nft.name}
                    imageUrl={nft.image_url}
                    price={nft.price}
                    owner={nft.owner_address}
                    isListed={true}
                    nftId={nft.id}
                    walletAddress={walletAddress}
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
        </div>
      </div>

      {/* Make Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Make an Offer</DialogTitle>
            <DialogDescription>
              Submit your offer for <span className="font-semibold text-foreground">{selectedNFT?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedNFT && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  {selectedNFT.image_url ? (
                    <img src={selectedNFT.image_url} alt={selectedNFT.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-sakura text-white text-2xl">
                      🌸
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{selectedNFT.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Listed Price: <span className="font-bold gradient-text">{selectedNFT.price} NEX</span>
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Your Offer (NEX)</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="Enter your offer amount"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOfferDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMakeOffer}
              disabled={!offerPrice || isProcessing}
              className="btn-hero"
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
