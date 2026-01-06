import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import AuctionCard from '@/components/auction/AuctionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { Gavel, Search, Plus, Timer, TrendingUp, Users, Flame, Clock, Trophy } from 'lucide-react';

interface AuctionNFT {
  id: string;
  name: string;
  image_url: string;
  token_id: number;
  owner_address: string;
}

interface Auction {
  id: string;
  nft: AuctionNFT;
  startPrice: number;
  currentBid: number;
  endTime: number;
  highestBidder: string;
  totalBids: number;
  minIncrement: number;
  seller: string;
  status: 'active' | 'ended' | 'cancelled';
}

// Generate mock auctions from real NFTs
const generateAuctionsFromNFTs = (nfts: any[]): Auction[] => {
  return nfts.slice(0, 12).map((nft, index) => {
    const startPrice = 0.5 + Math.random() * 2;
    const bidCount = Math.floor(Math.random() * 15);
    const currentBid = startPrice + bidCount * 0.1 + Math.random() * 0.5;
    const hoursLeft = Math.floor(Math.random() * 72) + 1;
    
    return {
      id: `auction-${nft.id}`,
      nft: {
        id: nft.id,
        name: nft.name,
        image_url: nft.image_url,
        token_id: nft.token_id,
        owner_address: nft.owner_address,
      },
      startPrice,
      currentBid,
      endTime: Date.now() + hoursLeft * 60 * 60 * 1000,
      highestBidder: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      totalBids: bidCount,
      minIncrement: 0.05,
      seller: nft.owner_address,
      status: 'active' as const,
    };
  });
};

const Auctions = () => {
  const { toast } = useToast();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('ending-soon');
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    loadAccount();
    loadAuctions();
  }, []);

  const loadAccount = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
  };

  const loadAuctions = async () => {
    setIsLoading(true);
    try {
      // Fetch real NFTs from database
      const { data: nfts, error } = await supabase
        .from('nfts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (nfts && nfts.length > 0) {
        const generatedAuctions = generateAuctionsFromNFTs(nfts);
        setAuctions(generatedAuctions);
      } else {
        // Use placeholder auctions if no NFTs
        setAuctions([]);
      }
    } catch (error) {
      console.error('Error loading auctions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load auctions',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleBid = async (auctionId: string, amount: number) => {
    if (!account) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to place a bid',
        variant: 'destructive',
      });
      return;
    }

    // Simulate placing a bid
    setAuctions(prev => prev.map(auction => {
      if (auction.id === auctionId) {
        return {
          ...auction,
          currentBid: amount,
          highestBidder: `${account.slice(0, 6)}...${account.slice(-4)}`,
          totalBids: auction.totalBids + 1,
        };
      }
      return auction;
    }));

    toast({
      title: 'Bid Placed!',
      description: `Your bid of ${amount.toFixed(4)} NEX has been placed`,
    });
  };

  const filteredAuctions = useMemo(() => {
    let result = [...auctions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => a.nft.name.toLowerCase().includes(query));
    }

    // Apply status filter
    if (filter !== 'all') {
      const now = Date.now();
      if (filter === 'ending-soon') {
        result = result.filter(a => a.endTime - now < 3600000); // Less than 1 hour
      } else if (filter === 'hot') {
        result = result.filter(a => a.totalBids >= 5);
      } else if (filter === 'new') {
        result = result.filter(a => a.endTime - now > 48 * 3600000); // More than 48 hours
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'ending-soon':
        result.sort((a, b) => a.endTime - b.endTime);
        break;
      case 'highest-bid':
        result.sort((a, b) => b.currentBid - a.currentBid);
        break;
      case 'most-bids':
        result.sort((a, b) => b.totalBids - a.totalBids);
        break;
      case 'newest':
        result.sort((a, b) => b.endTime - a.endTime);
        break;
    }

    return result;
  }, [auctions, searchQuery, sortBy, filter]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = Date.now();
    return {
      totalAuctions: auctions.length,
      endingSoon: auctions.filter(a => a.endTime - now < 3600000).length,
      totalVolume: auctions.reduce((sum, a) => sum + a.currentBid, 0),
      totalBids: auctions.reduce((sum, a) => sum + a.totalBids, 0),
    };
  }, [auctions]);

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />

      {/* Hero Section */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-gradient-sakura text-white border-0">
              <Gavel className="w-3 h-3 mr-1" />
              Live Auctions
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              NFT <span className="text-gradient-sakura">Auctions</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Bid on exclusive NFTs and win rare digital collectibles. Place your bids before time runs out!
            </p>
            {account && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-sakura hover:shadow-sakura"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Auction
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Gavel className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stats.totalAuctions}</p>
              <p className="text-sm text-muted-foreground">Active Auctions</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                <Timer className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-2xl font-bold">{stats.endingSoon}</p>
              <p className="text-sm text-muted-foreground">Ending Soon</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-green-500 mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stats.totalVolume.toFixed(2)} NEX</p>
              <p className="text-sm text-muted-foreground">Total Volume</p>
            </CardContent>
          </Card>
          <Card className="glass border-border/50">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-500 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stats.totalBids}</p>
              <p className="text-sm text-muted-foreground">Total Bids</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Auctions</SelectItem>
                <SelectItem value="ending-soon">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Ending Soon
                  </span>
                </SelectItem>
                <SelectItem value="hot">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Hot
                  </span>
                </SelectItem>
                <SelectItem value="new">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> New
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="highest-bid">Highest Bid</SelectItem>
                <SelectItem value="most-bids">Most Bids</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Auction Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-16">
            <Gavel className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Auctions Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Be the first to create an auction!'}
            </p>
            {account && (
              <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-sakura">
                <Plus className="w-4 h-4 mr-2" />
                Create Auction
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAuctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                nft={auction.nft}
                auction={{
                  id: auction.id,
                  startPrice: auction.startPrice,
                  currentBid: auction.currentBid,
                  endTime: auction.endTime,
                  highestBidder: auction.highestBidder,
                  totalBids: auction.totalBids,
                  minIncrement: auction.minIncrement,
                }}
                onBid={handleBid}
              />
            ))}
          </div>
        )}

        {/* How Auctions Work */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">How Auctions Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: 1, title: 'Browse', desc: 'Find NFTs you love in our live auction listings', icon: Search },
              { step: 2, title: 'Place Bid', desc: 'Enter your bid amount above the minimum increment', icon: Gavel },
              { step: 3, title: 'Outbid Others', desc: 'Keep track of your bids and outbid competitors', icon: TrendingUp },
              { step: 4, title: 'Win!', desc: 'Highest bidder when timer ends wins the NFT', icon: Trophy },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.step} className="relative text-center p-6 glass border-border/50 hover:border-primary/30 transition-all">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <Icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Auctions;
