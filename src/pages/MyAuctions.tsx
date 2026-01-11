import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { 
  AuctionData, 
  getBidHistory,
  calculateTimeRemaining,
  formatBidAmount,
  endAuction,
  cancelAuction
} from '@/lib/web3/auction';
import { 
  Gavel, 
  Clock, 
  Trophy, 
  ArrowRight, 
  TrendingUp,
  Timer,
  Flame,
  User,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

const AUCTIONS_STORAGE_KEY = 'nex_auctions_data';
const BIDS_STORAGE_KEY = 'nex_bids_data';

interface MyBid {
  auctionId: string;
  auction: AuctionData;
  amount: number;
  timestamp: number;
  isWinning: boolean;
}

const getStoredAuctions = (): AuctionData[] => {
  try {
    const stored = localStorage.getItem(AUCTIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AuctionData[];
    }
  } catch {
    // Ignore
  }
  return [];
};

const getStoredBids = (): Record<string, any[]> => {
  try {
    const stored = localStorage.getItem(BIDS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  return {};
};

const CountdownBadge = memo(({ endTime }: { endTime: number }) => {
  const [time, setTime] = useState(calculateTimeRemaining(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (time.isEnded) {
    return <Badge variant="destructive">Ended</Badge>;
  }

  if (time.isEndingSoon) {
    return (
      <Badge className="bg-red-500 animate-pulse">
        <Flame className="w-3 h-3 mr-1" />
        {time.hours}h {time.minutes}m
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Timer className="w-3 h-3 mr-1" />
      {time.days}d {time.hours}h
    </Badge>
  );
});

CountdownBadge.displayName = 'CountdownBadge';

const AuctionRow = memo(({ 
  auction, 
  type,
  myBid,
  onAction,
  isProcessing
}: { 
  auction: AuctionData; 
  type: 'created' | 'bidding' | 'won';
  myBid?: number;
  onAction?: (action: string, auctionId: string) => void;
  isProcessing?: boolean;
}) => {
  const navigate = useNavigate();
  const isEnded = auction.status === 'ended' || auction.endTime <= Date.now();
  const isWinning = myBid !== undefined && auction.currentBid === myBid;

  return (
    <Card className="card-hover cursor-pointer" onClick={() => navigate(`/auction/${auction.id}`)}>
      <CardContent className="p-3 sm:p-4">
        {/* Mobile Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          {/* NFT Image */}
          <div className="flex items-center gap-3 sm:block">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={auction.nft.image_url} 
                alt={auction.nft.name}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Mobile Title */}
            <div className="sm:hidden flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate text-sm">{auction.nft.name}</h3>
              </div>
              <CountdownBadge endTime={auction.endTime} />
            </div>
          </div>

          {/* Info - Desktop */}
          <div className="hidden sm:flex flex-1 min-w-0 flex-col">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{auction.nft.name}</h3>
              <CountdownBadge endTime={auction.endTime} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {formatBidAmount(auction.currentBid)} NEX
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {auction.totalBids} bids
              </span>
              {type === 'bidding' && myBid && (
                <span className={`flex items-center gap-1 ${isWinning ? 'text-green-500' : 'text-orange-500'}`}>
                  {isWinning ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  Your bid: {formatBidAmount(myBid)} NEX
                </span>
              )}
            </div>
          </div>

          {/* Mobile Info Row */}
          <div className="sm:hidden flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {formatBidAmount(auction.currentBid)} NEX
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {auction.totalBids} bids
            </span>
            {type === 'bidding' && myBid && (
              <span className={`flex items-center gap-1 ${isWinning ? 'text-green-500' : 'text-orange-500'}`}>
                {isWinning ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {formatBidAmount(myBid)} NEX
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
            {type === 'created' && isEnded && auction.totalBids > 0 && (
              <Button 
                size="sm" 
                className="btn-hero flex-1 sm:flex-none"
                onClick={() => onAction?.('finalize', auction.id)}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4 sm:mr-1" />}
                <span className="hidden sm:inline">Finalize</span>
              </Button>
            )}
            {type === 'created' && !isEnded && auction.totalBids === 0 && (
              <Button 
                size="sm" 
                variant="destructive"
                className="flex-1 sm:flex-none"
                onClick={() => onAction?.('cancel', auction.id)}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 sm:mr-1" />}
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            )}
            {type === 'bidding' && !isEnded && !isWinning && (
              <Button size="sm" className="btn-hero flex-1 sm:flex-none">
                <Gavel className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Bid Higher</span>
              </Button>
            )}
            {type === 'won' && (
              <Badge className="bg-green-500">
                <Trophy className="w-3 h-3 mr-1" />
                Won!
              </Badge>
            )}
            <Button size="icon" variant="ghost" className="hidden sm:flex">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AuctionRow.displayName = 'AuctionRow';

const MyAuctions = memo(() => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [account, setAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('created');
  const [allAuctions, setAllAuctions] = useState<AuctionData[]>([]);
  const [myBids, setMyBids] = useState<MyBid[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const currentAccount = await getCurrentAccount();
    setAccount(currentAccount);

    if (currentAccount) {
      // Load all auctions
      const auctions = getStoredAuctions();
      setAllAuctions(auctions);

      // Load my bids across all auctions
      const bidsData = getStoredBids();
      const myBidsList: MyBid[] = [];

      Object.entries(bidsData).forEach(([auctionId, bids]) => {
        const auction = auctions.find(a => a.id === auctionId);
        if (auction) {
          const myBid = bids.find((b: any) => 
            b.bidder.toLowerCase() === currentAccount.toLowerCase()
          );
          if (myBid) {
            myBidsList.push({
              auctionId,
              auction,
              amount: myBid.amount,
              timestamp: myBid.timestamp,
              isWinning: auction.currentBid === myBid.amount,
            });
          }
        }
      });

      setMyBids(myBidsList);
    }
    setIsLoading(false);
  };

  const handleAction = useCallback(async (action: string, auctionId: string) => {
    if (!account) return;

    setIsProcessing(true);
    try {
      if (action === 'finalize') {
        const result = await endAuction(auctionId, account);
        if (result.success) {
          toast({
            title: 'Auction Finalized',
            description: result.winner 
              ? `Winner: ${result.winner} with ${result.amount} NEX`
              : 'No bids were placed',
          });
          loadData();
        } else {
          toast({
            title: 'Failed',
            description: result.error,
            variant: 'destructive',
          });
        }
      } else if (action === 'cancel') {
        const result = await cancelAuction(auctionId, account);
        if (result.success) {
          toast({
            title: 'Auction Cancelled',
            description: 'Your auction has been cancelled',
          });
          loadData();
        } else {
          toast({
            title: 'Failed',
            description: result.error,
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Action failed',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [account, toast]);

  // Filter auctions based on account
  const myCreatedAuctions = useMemo(() => {
    if (!account) return [];
    return allAuctions.filter(a => 
      a.seller.toLowerCase() === account.toLowerCase()
    );
  }, [allAuctions, account]);

  const myActiveCreated = useMemo(() => 
    myCreatedAuctions.filter(a => a.status === 'active' && a.endTime > Date.now()),
    [myCreatedAuctions]
  );

  const myEndedCreated = useMemo(() => 
    myCreatedAuctions.filter(a => a.status !== 'active' || a.endTime <= Date.now()),
    [myCreatedAuctions]
  );

  const myActiveBids = useMemo(() => 
    myBids.filter(b => b.auction.status === 'active' && b.auction.endTime > Date.now()),
    [myBids]
  );

  const myWonAuctions = useMemo(() => {
    if (!account) return [];
    return allAuctions.filter(a => {
      const isEnded = a.status === 'ended' || a.endTime <= Date.now();
      const myBid = myBids.find(b => b.auctionId === a.id);
      return isEnded && myBid && a.currentBid === myBid.amount;
    });
  }, [allAuctions, myBids, account]);

  if (!account) {
    return (
      <div className="min-h-screen bg-background">
        <SakuraFalling />
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to view your auctions and bids
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">
              My <span className="gradient-text">Auctions</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your auctions and track your bids
            </p>
          </div>
          <Button onClick={loadData} variant="outline" disabled={isLoading} className="w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards - Mobile Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="glass">
            <CardContent className="p-3 sm:p-4 text-center">
              <Gavel className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-1 sm:mb-2 text-primary" />
              <p className="text-xl sm:text-2xl font-bold">{myCreatedAuctions.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Created</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-3 sm:p-4 text-center">
              <History className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-1 sm:mb-2 text-blue-500" />
              <p className="text-xl sm:text-2xl font-bold">{myBids.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">My Bids</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-3 sm:p-4 text-center">
              <Trophy className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-1 sm:mb-2 text-amber-500" />
              <p className="text-xl sm:text-2xl font-bold">{myWonAuctions.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Won</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-3 sm:p-4 text-center">
              <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 mx-auto mb-1 sm:mb-2 text-green-500" />
              <p className="text-xl sm:text-2xl font-bold">
                {myActiveBids.filter(b => b.isWinning).length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Winning</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Mobile Responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="created" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Gavel className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden sm:inline">My Auctions</span>
              <span className="sm:hidden">Auctions</span>
              {myActiveCreated.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5">{myActiveCreated.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bidding" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <History className="w-3 sm:w-4 h-3 sm:h-4" />
              <span className="hidden sm:inline">My Bids</span>
              <span className="sm:hidden">Bids</span>
              {myActiveBids.length > 0 && (
                <Badge variant="secondary" className="text-xs h-5">{myActiveBids.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="won" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Trophy className="w-3 sm:w-4 h-3 sm:h-4" />
              Won
              {myWonAuctions.length > 0 && (
                <Badge className="bg-amber-500 text-xs h-5">{myWonAuctions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Created Auctions Tab */}
          <TabsContent value="created">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myCreatedAuctions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Gavel className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Auctions Created</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first auction to start selling NFTs
                  </p>
                  <Button onClick={() => navigate('/auctions')} className="btn-hero">
                    Create Auction
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myActiveCreated.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      Active ({myActiveCreated.length})
                    </h3>
                    <div className="space-y-3">
                      {myActiveCreated.map(auction => (
                        <AuctionRow 
                          key={auction.id} 
                          auction={auction} 
                          type="created"
                          onAction={handleAction}
                          isProcessing={isProcessing}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {myEndedCreated.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4" />
                      Ended ({myEndedCreated.length})
                    </h3>
                    <div className="space-y-3 opacity-75">
                      {myEndedCreated.map(auction => (
                        <AuctionRow 
                          key={auction.id} 
                          auction={auction} 
                          type="created"
                          onAction={handleAction}
                          isProcessing={isProcessing}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* My Bids Tab */}
          <TabsContent value="bidding">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myBids.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <History className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Bids Placed</h3>
                  <p className="text-muted-foreground mb-4">
                    Start bidding on auctions to track them here
                  </p>
                  <Button onClick={() => navigate('/auctions')} className="btn-hero">
                    Browse Auctions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myActiveBids.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-500" />
                      Active Bids ({myActiveBids.length})
                    </h3>
                    <div className="space-y-3">
                      {myActiveBids.map(bid => (
                        <AuctionRow 
                          key={bid.auctionId} 
                          auction={bid.auction} 
                          type="bidding"
                          myBid={bid.amount}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Won Tab */}
          <TabsContent value="won">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <Skeleton className="w-16 h-16 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : myWonAuctions.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Wins Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Keep bidding to win your first auction!
                  </p>
                  <Button onClick={() => navigate('/auctions')} className="btn-hero">
                    Find Auctions
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myWonAuctions.map(auction => {
                  const myBid = myBids.find(b => b.auctionId === auction.id);
                  return (
                    <AuctionRow 
                      key={auction.id} 
                      auction={auction} 
                      type="won"
                      myBid={myBid?.amount}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});

MyAuctions.displayName = 'MyAuctions';

export default MyAuctions;