import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Timer, Gavel, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Bid {
  bidder: string;
  amount: number;
  timestamp: number;
}

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

const AuctionCard = ({ nft, auction, onBid }: AuctionCardProps) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isEnded, setIsEnded] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [showBidInput, setShowBidInput] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const difference = auction.endTime - now;

      if (difference <= 0) {
        setIsEnded(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [auction.endTime]);

  const minBid = auction.currentBid + auction.minIncrement;

  const handleBid = async () => {
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
      if (onBid) {
        await onBid(auction.id, amount);
      }
      toast({
        title: 'Bid Placed!',
        description: `You bid ${amount} NEX on ${nft.name}`,
      });
      setBidAmount('');
      setShowBidInput(false);
    } catch (error) {
      toast({
        title: 'Bid Failed',
        description: 'Failed to place bid. Please try again.',
        variant: 'destructive',
      });
    }
    setIsBidding(false);
  };

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-background/80 rounded-lg px-2 py-1 min-w-[40px] text-center">
        <span className="text-lg font-bold">{value.toString().padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] text-muted-foreground uppercase mt-1">{label}</span>
    </div>
  );

  return (
    <Card className="glass border-border/50 overflow-hidden group hover:border-primary/50 transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={nft.image_url}
          alt={nft.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Auction Badge */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-gradient-sakura text-white border-0 gap-1">
            <Gavel className="w-3 h-3" />
            Auction
          </Badge>
        </div>

        {/* Status Badge */}
        {isEnded ? (
          <div className="absolute top-3 right-3">
            <Badge variant="destructive">Ended</Badge>
          </div>
        ) : timeLeft.days === 0 && timeLeft.hours < 1 ? (
          <div className="absolute top-3 right-3">
            <Badge variant="destructive" className="animate-pulse gap-1">
              <AlertCircle className="w-3 h-3" />
              Ending Soon
            </Badge>
          </div>
        ) : null}

        {/* Countdown Timer Overlay */}
        {!isEnded && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-center gap-1">
              <Timer className="w-4 h-4 text-white mr-2" />
              <TimeUnit value={timeLeft.days} label="Days" />
              <span className="text-white font-bold">:</span>
              <TimeUnit value={timeLeft.hours} label="Hrs" />
              <span className="text-white font-bold">:</span>
              <TimeUnit value={timeLeft.minutes} label="Min" />
              <span className="text-white font-bold">:</span>
              <TimeUnit value={timeLeft.seconds} label="Sec" />
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2 truncate">{nft.name}</h3>
        
        <div className="space-y-3">
          {/* Current Bid */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Bid</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="font-bold text-lg">{auction.currentBid.toFixed(4)} NEX</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{auction.totalBids} bids</span>
            </div>
            <div className="text-muted-foreground">
              Start: {auction.startPrice.toFixed(4)} NEX
            </div>
          </div>

          {/* Highest Bidder */}
          <div className="text-xs text-muted-foreground">
            Highest: {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isEnded ? (
          <Button className="w-full" disabled>
            Auction Ended
          </Button>
        ) : showBidInput ? (
          <div className="w-full space-y-2">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Min: ${minBid.toFixed(4)}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="flex-1"
                step="0.001"
                min={minBid}
              />
              <Button
                onClick={handleBid}
                disabled={isBidding}
                className="bg-gradient-sakura hover:shadow-sakura"
              >
                {isBidding ? 'Bidding...' : 'Confirm'}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowBidInput(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            className="w-full bg-gradient-sakura hover:shadow-sakura"
            onClick={() => setShowBidInput(true)}
          >
            <Gavel className="w-4 h-4 mr-2" />
            Place Bid
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AuctionCard;
