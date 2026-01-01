import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Gavel, Search, Clock, TrendingUp, Filter, SlidersHorizontal } from 'lucide-react';
import AuctionCard from './AuctionCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock auction data
const generateMockAuctions = () => {
  const auctions = [];
  for (let i = 1; i <= 12; i++) {
    const hoursRemaining = Math.floor(Math.random() * 72) + 1;
    const startPrice = parseFloat((Math.random() * 1 + 0.1).toFixed(4));
    const bidCount = Math.floor(Math.random() * 20);
    const currentBid = startPrice + (bidCount * 0.05);
    
    auctions.push({
      nft: {
        id: `nft-${i}`,
        name: `Sakura Spirit #${1000 + i}`,
        image_url: `https://picsum.photos/seed/auction${i}/400/400`,
        token_id: 1000 + i,
      },
      auction: {
        id: `auction-${i}`,
        startPrice,
        currentBid: parseFloat(currentBid.toFixed(4)),
        endTime: Date.now() + (hoursRemaining * 60 * 60 * 1000),
        highestBidder: `0x${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
        totalBids: bidCount,
        minIncrement: 0.01,
      },
    });
  }
  return auctions.sort((a, b) => a.auction.endTime - b.auction.endTime);
};

const AuctionList = () => {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('ending-soon');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setAuctions(generateMockAuctions());
    setIsLoading(false);
  };

  const handleBid = async (auctionId: string, amount: number) => {
    // Mock bid - in real app, this would call the smart contract
    console.log(`Placing bid of ${amount} on auction ${auctionId}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Update local state
    setAuctions((prev) =>
      prev.map((a) =>
        a.auction.id === auctionId
          ? {
              ...a,
              auction: {
                ...a.auction,
                currentBid: amount,
                totalBids: a.auction.totalBids + 1,
              },
            }
          : a
      )
    );
  };

  const filteredAuctions = auctions
    .filter((a) => {
      if (filter === 'ending-soon') {
        return a.auction.endTime - Date.now() < 6 * 60 * 60 * 1000; // Less than 6 hours
      }
      if (filter === 'new') {
        return a.auction.totalBids < 3;
      }
      return true;
    })
    .filter((a) =>
      a.nft.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'ending-soon':
          return a.auction.endTime - b.auction.endTime;
        case 'highest-bid':
          return b.auction.currentBid - a.auction.currentBid;
        case 'most-bids':
          return b.auction.totalBids - a.auction.totalBids;
        case 'lowest-bid':
          return a.auction.currentBid - b.auction.currentBid;
        default:
          return 0;
      }
    });

  const stats = {
    active: auctions.length,
    endingSoon: auctions.filter(
      (a) => a.auction.endTime - Date.now() < 6 * 60 * 60 * 1000
    ).length,
    totalVolume: auctions.reduce((sum, a) => sum + a.auction.currentBid, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Gavel className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Auctions</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Clock className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ending Soon</p>
              <p className="text-2xl font-bold">{stats.endingSoon}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold">{stats.totalVolume.toFixed(2)} NEX</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search auctions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Auctions</SelectItem>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="new">Low Bids</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="highest-bid">Highest Bid</SelectItem>
              <SelectItem value="lowest-bid">Lowest Bid</SelectItem>
              <SelectItem value="most-bids">Most Bids</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Auction Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="glass border-border/50">
              <Skeleton className="aspect-square" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAuctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAuctions.map((item) => (
            <AuctionCard
              key={item.auction.id}
              nft={item.nft}
              auction={item.auction}
              onBid={handleBid}
            />
          ))}
        </div>
      ) : (
        <Card className="glass border-border/50">
          <CardContent className="p-12 text-center">
            <Gavel className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Auctions Found</h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'No auctions match your search criteria'
                : 'There are no active auctions at the moment'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuctionList;
