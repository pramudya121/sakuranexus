import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import AuctionCard from '@/components/auction/AuctionCard';
import CreateAuctionModal from '@/components/auction/CreateAuctionModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { loadAuctions, AuctionData, placeBid, createAuction } from '@/lib/web3/auction';
import { useDebounce } from '@/hooks/usePerformanceOptimization';
import { Gavel, Search, Plus, Timer, TrendingUp, Users, Flame, Clock, Trophy, RefreshCw, Image as ImageIcon } from 'lucide-react';

const NFTSelectionDialog = memo(({ open, onClose, nfts, onSelect }: { 
  open: boolean; onClose: () => void; nfts: any[]; onSelect: (nft: any) => void;
}) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="sm:max-w-[600px] glass">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Select NFT for Auction
        </DialogTitle>
        <DialogDescription>Choose an NFT from your collection to put up for auction</DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[400px] pr-4">
        {nfts.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No NFTs in your collection</p>
            <p className="text-sm text-muted-foreground mt-1">Mint or buy NFTs to create auctions</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {nfts.map((nft) => (
              <Card key={nft.id} className="cursor-pointer card-hover premium-card overflow-hidden" onClick={() => onSelect(nft)}>
                <div className="aspect-square bg-muted">
                  <img src={nft.image_url} alt={nft.name} className="w-full h-full object-cover" />
                </div>
                <CardContent className="p-2.5">
                  <p className="font-medium truncate text-sm">{nft.name}</p>
                  <p className="text-xs text-muted-foreground">#{nft.token_id}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </DialogContent>
  </Dialog>
));
NFTSelectionDialog.displayName = 'NFTSelectionDialog';

const Auctions = memo(() => {
  const { toast } = useToast();
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('ending-soon');
  const [filter, setFilter] = useState('all');
  const [showNFTSelection, setShowNFTSelection] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => { loadAccount(); loadAuctionData(); }, []);

  const loadAccount = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
    if (acc) {
      const { data } = await supabase.from('nfts').select('*').eq('owner_address', acc.toLowerCase()).limit(50);
      setUserNFTs(data || []);
    }
  };

  const loadAuctionData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true); else setIsLoading(true);
    try {
      setAuctions(await loadAuctions());
    } catch {
      toast({ title: 'Error', description: 'Failed to load auctions', variant: 'destructive' });
    }
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const handleRefresh = useCallback(() => { loadAuctionData(true); }, []);

  const handleBid = useCallback(async (auctionId: string, amount: number) => {
    if (!account) {
      toast({ title: 'Connect Wallet', description: 'Please connect your wallet to place a bid', variant: 'destructive' });
      return;
    }
    setAuctions(prev => prev.map(a => a.id === auctionId ? {
      ...a, currentBid: amount, highestBidder: `${account.slice(0, 6)}...${account.slice(-4)}`, totalBids: a.totalBids + 1,
    } : a));
    const result = await placeBid(auctionId, amount, account);
    if (result.success) {
      toast({ title: 'Bid Placed!', description: `Your bid of ${amount.toFixed(4)} NEX has been placed` });
    } else {
      loadAuctionData(true);
      toast({ title: 'Bid Failed', description: result.error || 'Failed to place bid', variant: 'destructive' });
    }
  }, [account, toast]);

  const handleSelectNFT = useCallback((nft: any) => {
    setSelectedNFT(nft);
    setShowNFTSelection(false);
    setShowCreateModal(true);
  }, []);

  const handleCreateAuction = useCallback(async (data: any) => {
    if (!account || !selectedNFT) return;
    const result = await createAuction(selectedNFT.id, selectedNFT.token_id, data.startPrice, data.duration, account, { name: selectedNFT.name, image_url: selectedNFT.image_url });
    if (result.success) {
      toast({ title: 'Auction Created!', description: `${selectedNFT.name} is now up for auction` });
      setShowCreateModal(false);
      setSelectedNFT(null);
      loadAuctionData(true);
    } else {
      throw new Error(result.error);
    }
  }, [account, selectedNFT, toast]);

  const filteredAuctions = useMemo(() => {
    let result = [...auctions];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(a => a.nft.name.toLowerCase().includes(q));
    }
    if (filter !== 'all') {
      const now = Date.now();
      if (filter === 'ending-soon') result = result.filter(a => a.endTime - now < 3600000);
      else if (filter === 'hot') result = result.filter(a => a.totalBids >= 5);
      else if (filter === 'new') result = result.filter(a => a.endTime - now > 48 * 3600000);
    }
    switch (sortBy) {
      case 'ending-soon': result.sort((a, b) => a.endTime - b.endTime); break;
      case 'highest-bid': result.sort((a, b) => b.currentBid - a.currentBid); break;
      case 'most-bids': result.sort((a, b) => b.totalBids - a.totalBids); break;
      case 'newest': result.sort((a, b) => b.endTime - a.endTime); break;
    }
    return result;
  }, [auctions, debouncedSearch, sortBy, filter]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      totalAuctions: auctions.length,
      endingSoon: auctions.filter(a => a.endTime - now < 3600000).length,
      totalVolume: auctions.reduce((sum, a) => sum + a.currentBid, 0),
      totalBids: auctions.reduce((sum, a) => sum + a.totalBids, 0),
    };
  }, [auctions]);

  const statCards = [
    { icon: Gavel, value: stats.totalAuctions, label: 'Active Auctions', color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Timer, value: stats.endingSoon, label: 'Ending Soon', color: 'text-destructive', bg: 'bg-destructive/10' },
    { icon: TrendingUp, value: `${stats.totalVolume.toFixed(2)} NEX`, label: 'Total Volume', color: 'text-success', bg: 'bg-success/10' },
    { icon: Users, value: stats.totalBids, label: 'Total Bids', color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />

      {/* Hero Section */}
      <div className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-gradient-sakura text-primary-foreground border-0 shadow-sakura">
              <Gavel className="w-3 h-3 mr-1" />
              Live Auctions
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              NFT <span className="gradient-text">Auctions</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto">
              Bid on exclusive NFTs and win rare digital collectibles before time runs out!
            </p>
            <div className="flex items-center justify-center gap-3">
              {account && (
                <Button onClick={() => setShowNFTSelection(true)} className="btn-hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Auction
                </Button>
              )}
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card">
                <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                </div>
                <p className="text-lg sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-10">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Auctions</SelectItem>
                <SelectItem value="ending-soon"><span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Ending Soon</span></SelectItem>
                <SelectItem value="hot"><span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Hot</span></SelectItem>
                <SelectItem value="new"><span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> New</span></SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[150px] h-10">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="premium-card overflow-hidden">
                <Skeleton className="aspect-square" />
                <CardContent className="p-3 sm:p-4 space-y-2.5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
              <Gavel className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">No Auctions Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? 'Try a different search term' : 'Be the first to create an auction!'}
            </p>
            {account && (
              <Button onClick={() => setShowNFTSelection(true)} className="btn-hero">
                <Plus className="w-4 h-4 mr-2" />
                Create Auction
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
        <div className="mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">How Auctions Work</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { step: 1, title: 'Browse', desc: 'Find NFTs you love', icon: Search },
              { step: 2, title: 'Place Bid', desc: 'Enter your bid amount', icon: Gavel },
              { step: 3, title: 'Outbid', desc: 'Outbid competitors', icon: TrendingUp },
              { step: 4, title: 'Win!', desc: 'Highest bid wins', icon: Trophy },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="stat-card text-center relative">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {item.step}
                  </div>
                  <div className="inline-flex p-2.5 rounded-lg bg-primary/10 mb-3">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NFTSelectionDialog open={showNFTSelection} onClose={() => setShowNFTSelection(false)} nfts={userNFTs} onSelect={handleSelectNFT} />
      <CreateAuctionModal open={showCreateModal} onClose={() => { setShowCreateModal(false); setSelectedNFT(null); }} nft={selectedNFT} onCreateAuction={handleCreateAuction} />
    </div>
  );
});

Auctions.displayName = 'Auctions';
export default Auctions;
