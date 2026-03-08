import { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Timer, Gavel, TrendingUp, Users, AlertCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateTimeRemaining } from '@/lib/web3/auction';

interface AuctionCardProps {
  nft: {
    id: string;
    name: string;
    image_url: string;
    token_id: number;
  };
  auction: {
    id: string;
    startPrice: number;
    currentBid: number;
    endTime: number;
    highestBidder: string;
    totalBids: number;
    minIncrement: number;
  };
  onBid?: (auctionId: string, amount: number) => Promise<void>;
}

const TimeUnit = memo(({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[36px] text-center shadow-sm">
      <span className="text-sm sm:text-base font-bold tabular-nums">{value.toString().padStart(2, '0')}</span>
    </div>
    <span className="text-[9px] text-muted-foreground/80 uppercase mt-0.5 font-medium">{label}</span>
  </div>
));
TimeUnit.displayName = 'TimeUnit';

const AuctionCard = memo(({ nft, auction, onBid }: AuctionCardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeRemaining(auction.endTime));
  const [isEnded, setIsEnded] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [showBidInput, setShowBidInput] = useState(false);

  const handleViewDetails = useCallback(() => {
    navigate(`/auction/${auction.id}`);
  }, [navigate, auction.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      const result = calculateTimeRemaining(auction.endTime);
      setTimeLeft(result);
      if (result.isEnded) {
        setIsEnded(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [auction.endTime]);

  const minBid = auction.currentBid + auction.minIncrement;

  const handleBid = useCallback(async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      toast({
        title: 'Invalid Bid',
        description: `Minimum bid is ${minBid.toFixed(4)} NEX`,
        variant: 'destructive',
      });
      return;
    }
    setIsBidding(true);
    try {
      if (onBid) await onBid(auction.id, amount);
      toast({ title: 'Bid Placed!', description: `You bid ${amount} NEX on ${nft.name}` });
      setBidAmount('');
      setShowBidInput(false);
    } catch {
      toast({ title: 'Bid Failed', description: 'Failed to place bid. Please try again.', variant: 'destructive' });
    }
    setIsBidding(false);
  }, [bidAmount, minBid, auction.id, nft.name, onBid, toast]);

  return (
    <Card className="premium-card group hover:border-primary/40 transition-all duration-300 card-hover overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={nft.image_url}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Auction Badge */}
        <div className="absolute top-2.5 left-2.5">
          <Badge className="bg-gradient-sakura text-primary-foreground border-0 gap-1 shadow-md text-xs">
            <Gavel className="w-3 h-3" />
            Auction
          </Badge>
        </div>

        {/* Status Badge */}
        {isEnded ? (
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="destructive" className="shadow-md">Ended</Badge>
          </div>
        ) : timeLeft.days === 0 && timeLeft.hours < 1 ? (
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="destructive" className="animate-pulse gap-1 shadow-md">
              <AlertCircle className="w-3 h-3" />
              Ending Soon
            </Badge>
          </div>
        ) : null}

        {/* Countdown Timer Overlay */}
        {!isEnded && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
            <div className="flex items-center justify-center gap-1">
              <Timer className="w-3.5 h-3.5 text-primary-foreground/80 mr-1" />
              <TimeUnit value={timeLeft.days} label="D" />
              <span className="text-primary-foreground/60 font-bold text-xs">:</span>
              <TimeUnit value={timeLeft.hours} label="H" />
              <span className="text-primary-foreground/60 font-bold text-xs">:</span>
              <TimeUnit value={timeLeft.minutes} label="M" />
              <span className="text-primary-foreground/60 font-bold text-xs">:</span>
              <TimeUnit value={timeLeft.seconds} label="S" />
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-3.5 sm:p-4">
        <h3 className="font-bold text-base sm:text-lg mb-2.5 truncate">{nft.name}</h3>
        
        <div className="space-y-2.5">
          {/* Current Bid */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
            <span className="text-xs text-muted-foreground font-medium">Current Bid</span>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-success" />
              <span className="font-bold text-sm sm:text-base gradient-text">{auction.currentBid.toFixed(4)} NEX</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{auction.totalBids} bids</span>
            </div>
            <div className="text-muted-foreground">
              Start: {auction.startPrice.toFixed(4)} NEX
            </div>
          </div>

          {/* Highest Bidder */}
          <div className="text-[11px] text-muted-foreground truncate">
            Highest: {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3.5 sm:p-4 pt-0 flex flex-col gap-2">
        {isEnded ? (
          <Button className="w-full" variant="outline" onClick={handleViewDetails} size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View Results
          </Button>
        ) : showBidInput ? (
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Min: ${minBid.toFixed(4)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="flex-1 h-9 text-sm"
                step="0.001"
                min={minBid}
              />
              <Button
                onClick={handleBid}
                disabled={isBidding}
                className="btn-hero h-9 text-sm px-3"
                size="sm"
              >
                {isBidding ? 'Bidding...' : 'Confirm'}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full h-8 text-xs" onClick={() => setShowBidInput(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="w-full flex gap-2">
            <Button
              className="flex-1 btn-hero h-9 text-sm"
              size="sm"
              onClick={() => setShowBidInput(true)}
            >
              <Gavel className="w-3.5 h-3.5 mr-1.5" />
              Place Bid
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewDetails} className="h-9 w-9 p-0">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
});

AuctionCard.displayName = 'AuctionCard';

export default AuctionCard;
