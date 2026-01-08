import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { 
  AuctionData, 
  BidHistory,
  getBidHistory, 
  placeBid, 
  endAuction, 
  cancelAuction,
  calculateTimeRemaining,
  formatBidAmount 
} from '@/lib/web3/auction';
import { 
  ArrowLeft, 
  Clock, 
  Gavel, 
  User, 
  TrendingUp, 
  AlertCircle,
  History,
  Trophy,
  Loader2,
  Timer,
  Flame
} from 'lucide-react';

const AUCTIONS_STORAGE_KEY = 'nex_auctions_data';

const getStoredAuctions = (): AuctionData[] => {
  try {
    const stored = localStorage.getItem(AUCTIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AuctionData[];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
};

const BidHistoryItem = memo(({ bid, index }: { bid: BidHistory; index: number }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${
    index === 0 ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
  }`}>
    <div className="flex items-center gap-3">
      {index === 0 && <Trophy className="w-4 h-4 text-primary" />}
      <div>
        <div className="font-medium flex items-center gap-2">
          {formatAddress(bid.bidder)}
          {index === 0 && (
            <Badge variant="secondary" className="text-xs">Highest</Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(bid.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className="font-bold">{formatBidAmount(bid.amount)} NEX</div>
      {bid.transactionHash && (
        <div className="text-xs text-muted-foreground truncate max-w-[100px]">
          {bid.transactionHash.slice(0, 10)}...
        </div>
      )}
    </div>
  </div>
));

BidHistoryItem.displayName = 'BidHistoryItem';

const CountdownTimer = memo(({ endTime }: { endTime: number }) => {
  const [time, setTime] = useState(calculateTimeRemaining(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(calculateTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (time.isEnded) {
    return (
      <div className="text-center p-4 bg-destructive/10 rounded-lg">
        <div className="text-lg font-bold text-destructive">Auction Ended</div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${time.isEndingSoon ? 'bg-destructive/10 animate-pulse' : 'bg-muted/50'}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        {time.isEndingSoon ? (
          <Flame className="w-5 h-5 text-destructive animate-bounce" />
        ) : (
          <Timer className="w-5 h-5 text-muted-foreground" />
        )}
        <span className={`font-medium ${time.isEndingSoon ? 'text-destructive' : 'text-muted-foreground'}`}>
          {time.isEndingSoon ? 'Ending Soon!' : 'Time Remaining'}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { value: time.days, label: 'Days' },
          { value: time.hours, label: 'Hours' },
          { value: time.minutes, label: 'Min' },
          { value: time.seconds, label: 'Sec' },
        ].map((item) => (
          <div key={item.label} className="bg-background rounded-lg p-2">
            <div className="text-2xl font-bold">{item.value.toString().padStart(2, '0')}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

const AuctionDetail = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [bidHistory, setBidHistory] = useState<BidHistory[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const currentAccount = await getCurrentAccount();
      setAccount(currentAccount);

      if (auctionId) {
        const auctions = getStoredAuctions();
        const foundAuction = auctions.find(a => a.id === auctionId);
        
        if (foundAuction) {
          setAuction({
            ...foundAuction,
            status: foundAuction.endTime <= Date.now() ? 'ended' : foundAuction.status,
          });
          setBidHistory(getBidHistory(auctionId));
        }
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [auctionId]);

  const handlePlaceBid = useCallback(async () => {
    if (!auction || !account || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Bid',
        description: 'Please enter a valid bid amount',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await placeBid(auction.id, amount, account);
      
      if (result.success) {
        toast({
          title: 'Bid Placed!',
          description: `Your bid of ${amount} NEX has been placed`,
        });
        
        // Refresh auction data
        const auctions = getStoredAuctions();
        const updatedAuction = auctions.find(a => a.id === auction.id);
        if (updatedAuction) {
          setAuction(updatedAuction);
        }
        setBidHistory(getBidHistory(auction.id));
        setBidAmount('');
      } else {
        toast({
          title: 'Bid Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place bid',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [auction, account, bidAmount, toast]);

  const handleEndAuction = useCallback(async () => {
    if (!auction || !account) return;

    setIsProcessing(true);
    try {
      const result = await endAuction(auction.id, account);
      
      if (result.success) {
        toast({
          title: 'Auction Ended',
          description: result.winner 
            ? `Winner: ${result.winner} with ${result.amount} NEX`
            : 'No bids were placed',
        });
        setAuction(prev => prev ? { ...prev, status: 'ended' } : null);
      } else {
        toast({
          title: 'Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to end auction',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [auction, account, toast]);

  const handleCancelAuction = useCallback(async () => {
    if (!auction || !account) return;

    setIsProcessing(true);
    try {
      const result = await cancelAuction(auction.id, account);
      
      if (result.success) {
        toast({
          title: 'Auction Cancelled',
          description: 'Your auction has been cancelled',
        });
        navigate('/auctions');
      } else {
        toast({
          title: 'Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel auction',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [auction, account, toast, navigate]);

  const minBid = auction ? auction.currentBid + auction.minIncrement : 0;
  const isSeller = account && auction && account.toLowerCase() === auction.seller.toLowerCase();
  const isEnded = auction?.status === 'ended' || (auction && auction.endTime <= Date.now());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-sakura-soft flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-sakura-soft">
        <SakuraFalling />
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Auction Not Found</h2>
          <p className="text-muted-foreground mb-4">This auction may have ended or been removed</p>
          <Button onClick={() => navigate('/auctions')}>
            Back to Auctions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button variant="ghost" onClick={() => navigate('/auctions')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Auctions
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - NFT Image & Info */}
          <div className="space-y-6">
            <Card className="card-hover overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-sakura-soft relative">
                  <img 
                    src={auction.nft.image_url} 
                    alt={auction.nft.name}
                    className="w-full h-full object-cover"
                  />
                  {isEnded && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-lg px-4 py-2">
                        Auction Ended
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* NFT Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  NFT Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token ID</span>
                  <span className="font-medium">#{auction.nft.token_id}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium">{formatAddress(auction.nft.owner_address)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller</span>
                  <span className="font-medium">{formatAddress(auction.seller)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Price</span>
                  <span className="font-medium">{formatBidAmount(auction.startPrice)} NEX</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Increment</span>
                  <span className="font-medium">{formatBidAmount(auction.minIncrement)} NEX</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Auction Info & Bidding */}
          <div className="space-y-6">
            {/* Auction Header */}
            <Card>
              <CardContent className="p-6">
                <h1 className="text-3xl font-bold mb-2">{auction.nft.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <Gavel className="w-4 h-4" />
                  <span>Auction ID: {auction.id}</span>
                </div>

                {/* Countdown Timer */}
                <CountdownTimer endTime={auction.endTime} />

                {/* Current Bid */}
                <div className="mt-6 p-4 rounded-lg bg-gradient-sakura-soft">
                  <div className="text-sm text-muted-foreground mb-1">Current Bid</div>
                  <div className="text-4xl font-bold gradient-text">
                    {formatBidAmount(auction.currentBid)} NEX
                  </div>
                  {auction.highestBidder && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>Highest Bidder: {auction.highestBidder}</span>
                    </div>
                  )}
                </div>

                {/* Bidding Section */}
                {!isEnded && !isSeller && (
                  <div className="mt-6 space-y-4">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={minBid}
                        placeholder={`Min bid: ${minBid.toFixed(4)} NEX`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        disabled={isProcessing}
                      />
                      <Button 
                        onClick={handlePlaceBid}
                        disabled={isProcessing || !bidAmount}
                        className="btn-hero whitespace-nowrap"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Gavel className="w-4 h-4 mr-2" />
                            Place Bid
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Minimum bid: {minBid.toFixed(4)} NEX (current + {auction.minIncrement} increment)
                    </p>
                  </div>
                )}

                {/* Seller Actions */}
                {isSeller && (
                  <div className="mt-6 space-y-3">
                    {isEnded ? (
                      <Button 
                        onClick={handleEndAuction}
                        disabled={isProcessing}
                        className="w-full btn-hero"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trophy className="w-4 h-4 mr-2" />
                        )}
                        Finalize Auction
                      </Button>
                    ) : auction.totalBids === 0 ? (
                      <Button 
                        onClick={handleCancelAuction}
                        disabled={isProcessing}
                        variant="destructive"
                        className="w-full"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Cancel Auction
                      </Button>
                    ) : (
                      <p className="text-center text-muted-foreground text-sm">
                        Cannot cancel auction with existing bids
                      </p>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold">{auction.totalBids}</div>
                    <div className="text-xs text-muted-foreground">Total Bids</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold">
                      {((auction.currentBid - auction.startPrice) / auction.startPrice * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Price Increase</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bid History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Bid History ({bidHistory.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bidHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No bids yet. Be the first to bid!</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {bidHistory.map((bid, index) => (
                        <BidHistoryItem key={bid.timestamp} bid={bid} index={index} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
