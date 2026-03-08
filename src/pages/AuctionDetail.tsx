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
  AuctionData, BidHistory, getBidHistory, placeBid, endAuction, cancelAuction, calculateTimeRemaining, formatBidAmount 
} from '@/lib/web3/auction';
import { ArrowLeft, Clock, Gavel, User, TrendingUp, AlertCircle, History, Trophy, Loader2, Timer, Flame } from 'lucide-react';
import SocialShareMenu from '@/components/SocialShareMenu';

const AUCTIONS_STORAGE_KEY = 'nex_auctions_data';

const getStoredAuctions = (): AuctionData[] => {
  try {
    const stored = localStorage.getItem(AUCTIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const BidHistoryItem = memo(({ bid, index }: { bid: BidHistory; index: number }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
    index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30 hover:bg-muted/50'
  }`}>
    <div className="flex items-center gap-2.5">
      {index === 0 && <Trophy className="w-4 h-4 text-primary flex-shrink-0" />}
      <div className="min-w-0">
        <div className="font-medium flex items-center gap-1.5 text-sm">
          {formatAddress(bid.bidder)}
          {index === 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Highest</Badge>}
        </div>
        <div className="text-[11px] text-muted-foreground">{new Date(bid.timestamp).toLocaleString()}</div>
      </div>
    </div>
    <div className="text-right flex-shrink-0 ml-2">
      <div className="font-bold text-sm gradient-text">{formatBidAmount(bid.amount)} NEX</div>
      {bid.transactionHash && (
        <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">{bid.transactionHash.slice(0, 10)}...</div>
      )}
    </div>
  </div>
));
BidHistoryItem.displayName = 'BidHistoryItem';

const CountdownTimer = memo(({ endTime }: { endTime: number }) => {
  const [time, setTime] = useState(calculateTimeRemaining(endTime));

  useEffect(() => {
    const timer = setInterval(() => setTime(calculateTimeRemaining(endTime)), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  if (time.isEnded) {
    return (
      <div className="text-center p-4 bg-destructive/10 rounded-xl border border-destructive/20">
        <div className="text-lg font-bold text-destructive">Auction Ended</div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${time.isEndingSoon ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/30 border-border/50'}`}>
      <div className="flex items-center justify-center gap-2 mb-3">
        {time.isEndingSoon ? (
          <Flame className="w-4 h-4 text-destructive animate-bounce" />
        ) : (
          <Timer className="w-4 h-4 text-muted-foreground" />
        )}
        <span className={`text-sm font-medium ${time.isEndingSoon ? 'text-destructive' : 'text-muted-foreground'}`}>
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
          <div key={item.label} className="bg-background rounded-lg p-2 border border-border/30">
            <div className="text-xl sm:text-2xl font-bold tabular-nums">{item.value.toString().padStart(2, '0')}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-medium">{item.label}</div>
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
        const found = auctions.find(a => a.id === auctionId);
        if (found) {
          setAuction({ ...found, status: found.endTime <= Date.now() ? 'ended' : found.status });
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
      toast({ title: 'Invalid Bid', description: 'Please enter a valid bid amount', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await placeBid(auction.id, amount, account);
      if (result.success) {
        toast({ title: 'Bid Placed!', description: `Your bid of ${amount} NEX has been placed` });
        const auctions = getStoredAuctions();
        const updated = auctions.find(a => a.id === auction.id);
        if (updated) setAuction(updated);
        setBidHistory(getBidHistory(auction.id));
        setBidAmount('');
      } else {
        toast({ title: 'Bid Failed', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to place bid', variant: 'destructive' });
    } finally { setIsProcessing(false); }
  }, [auction, account, bidAmount, toast]);

  const handleEndAuction = useCallback(async () => {
    if (!auction || !account) return;
    setIsProcessing(true);
    try {
      const result = await endAuction(auction.id, account);
      if (result.success) {
        toast({ title: 'Auction Ended', description: result.winner ? `Winner: ${result.winner} with ${result.amount} NEX` : 'No bids were placed' });
        setAuction(prev => prev ? { ...prev, status: 'ended' } : null);
      } else {
        toast({ title: 'Failed', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to end auction', variant: 'destructive' });
    } finally { setIsProcessing(false); }
  }, [auction, account, toast]);

  const handleCancelAuction = useCallback(async () => {
    if (!auction || !account) return;
    setIsProcessing(true);
    try {
      const result = await cancelAuction(auction.id, account);
      if (result.success) {
        toast({ title: 'Auction Cancelled', description: 'Your auction has been cancelled' });
        navigate('/auctions');
      } else {
        toast({ title: 'Failed', description: result.error, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to cancel auction', variant: 'destructive' });
    } finally { setIsProcessing(false); }
  }, [auction, account, toast, navigate]);

  const minBid = auction ? auction.currentBid + auction.minIncrement : 0;
  const isSeller = account && auction && account.toLowerCase() === auction.seller.toLowerCase();
  const isEnded = auction?.status === 'ended' || (auction && auction.endTime <= Date.now());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-background">
        <SakuraFalling />
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
            <AlertCircle className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Auction Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">This auction may have ended or been removed</p>
          <Button onClick={() => navigate('/auctions')} className="btn-hero">Back to Auctions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-12">
        <Button variant="ghost" onClick={() => navigate('/auctions')} className="mb-4 sm:mb-6 -ml-2 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Auctions
        </Button>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - NFT Image & Details */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="premium-card overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-muted relative">
                  <img src={auction.nft.image_url} alt={auction.nft.name} className="w-full h-full object-cover" />
                  {isEnded && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm sm:text-lg px-4 py-2 shadow-lg">Auction Ended</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* NFT Details Card */}
            <Card className="premium-card">
              <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  NFT Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 px-4 sm:px-6 pb-4 sm:pb-6">
                {[
                  { label: 'Token ID', value: `#${auction.nft.token_id}` },
                  { label: 'Owner', value: formatAddress(auction.nft.owner_address) },
                  { label: 'Seller', value: formatAddress(auction.seller) },
                  { label: 'Start Price', value: `${formatBidAmount(auction.startPrice)} NEX` },
                  { label: 'Min Increment', value: `${formatBidAmount(auction.minIncrement)} NEX` },
                ].map((item, i, arr) => (
                  <div key={item.label}>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                    {i < arr.length - 1 && <Separator />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Auction Info & Bidding */}
          <div className="space-y-4 sm:space-y-6">
            {/* Auction Header */}
            <Card className="premium-card">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold">{auction.nft.name}</h1>
                  <SocialShareMenu title={auction.nft.name} type="auction" price={formatBidAmount(auction.currentBid)} image={auction.nft.image_url} />
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground mb-5">
                  <Gavel className="w-3.5 h-3.5" />
                  <span className="text-xs sm:text-sm">ID: {auction.id}</span>
                </div>

                {/* Countdown */}
                <CountdownTimer endTime={auction.endTime} />

                {/* Current Bid */}
                <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Current Bid</div>
                  <div className="text-2xl sm:text-4xl font-bold gradient-text">
                    {formatBidAmount(auction.currentBid)} NEX
                  </div>
                  {auction.highestBidder && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs sm:text-sm text-muted-foreground">
                      <User className="w-3.5 h-3.5" />
                      <span>Highest: {auction.highestBidder}</span>
                    </div>
                  )}
                </div>

                {/* Bidding Section */}
                {!isEnded && !isSeller && (
                  <div className="mt-5 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min={minBid}
                        placeholder={`Min bid: ${minBid.toFixed(4)} NEX`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        disabled={isProcessing}
                        className="h-11"
                      />
                      <Button onClick={handlePlaceBid} disabled={isProcessing || !bidAmount} className="btn-hero h-11 whitespace-nowrap px-5">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Gavel className="w-4 h-4 mr-1.5" />Place Bid</>}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Minimum: {minBid.toFixed(4)} NEX (current + {auction.minIncrement} increment)
                    </p>
                  </div>
                )}

                {/* Seller Actions */}
                {isSeller && (
                  <div className="mt-5 space-y-2.5">
                    {isEnded ? (
                      <Button onClick={handleEndAuction} disabled={isProcessing} className="w-full btn-hero h-11">
                        {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                        Finalize Auction
                      </Button>
                    ) : auction.totalBids === 0 ? (
                      <Button onClick={handleCancelAuction} disabled={isProcessing} variant="destructive" className="w-full h-11">
                        {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Cancel Auction
                      </Button>
                    ) : (
                      <p className="text-center text-muted-foreground text-sm py-2">Cannot cancel auction with existing bids</p>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/30 text-center border border-border/30">
                    <div className="text-xl sm:text-2xl font-bold">{auction.totalBids}</div>
                    <div className="text-[11px] text-muted-foreground font-medium">Total Bids</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 text-center border border-border/30">
                    <div className="text-xl sm:text-2xl font-bold">
                      {((auction.currentBid - auction.startPrice) / auction.startPrice * 100).toFixed(0)}%
                    </div>
                    <div className="text-[11px] text-muted-foreground font-medium">Price Increase</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bid History */}
            <Card className="premium-card">
              <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Bid History ({bidHistory.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {bidHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-flex p-3 rounded-full bg-muted/50 mb-3">
                      <Clock className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">No bids yet. Be the first!</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[280px] sm:h-[300px] pr-3">
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
