import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Gavel, Info } from 'lucide-react';
import { format, addDays, addHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface NFT {
  id: string;
  name: string;
  image_url: string;
  token_id: number;
}

interface CreateAuctionModalProps {
  open: boolean;
  onClose: () => void;
  nft: NFT | null;
  onCreateAuction: (data: {
    nftId: string;
    startPrice: number;
    reservePrice: number;
    duration: number;
    minIncrement: number;
  }) => Promise<void>;
}

const CreateAuctionModal = ({ open, onClose, nft, onCreateAuction }: CreateAuctionModalProps) => {
  const { toast } = useToast();
  const [startPrice, setStartPrice] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [duration, setDuration] = useState(24); // hours
  const [minIncrement, setMinIncrement] = useState('0.01');
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 1));
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!nft) return;

    const start = parseFloat(startPrice);
    const reserve = parseFloat(reservePrice);
    const increment = parseFloat(minIncrement);

    if (isNaN(start) || start <= 0) {
      toast({
        title: 'Invalid Start Price',
        description: 'Please enter a valid start price',
        variant: 'destructive',
      });
      return;
    }

    if (reserve && reserve < start) {
      toast({
        title: 'Invalid Reserve Price',
        description: 'Reserve price must be higher than start price',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await onCreateAuction({
        nftId: nft.id,
        startPrice: start,
        reservePrice: reserve || start,
        duration: duration,
        minIncrement: increment || 0.01,
      });
      toast({
        title: 'Auction Created!',
        description: `${nft.name} is now up for auction`,
      });
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Failed to Create Auction',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
    setIsCreating(false);
  };

  const resetForm = () => {
    setStartPrice('');
    setReservePrice('');
    setDuration(24);
    setMinIncrement('0.01');
    setEndDate(addDays(new Date(), 1));
  };

  const durationPresets = [
    { label: '1 Hour', hours: 1 },
    { label: '6 Hours', hours: 6 },
    { label: '12 Hours', hours: 12 },
    { label: '1 Day', hours: 24 },
    { label: '3 Days', hours: 72 },
    { label: '7 Days', hours: 168 },
  ];

  if (!nft) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] glass">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary" />
            Create Auction
          </DialogTitle>
          <DialogDescription>
            Set up an auction for your NFT with custom parameters
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* NFT Preview */}
          <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
            <img
              src={nft.image_url}
              alt={nft.name}
              className="w-20 h-20 rounded-lg object-cover"
            />
            <div>
              <h4 className="font-bold">{nft.name}</h4>
              <p className="text-sm text-muted-foreground">Token #{nft.token_id}</p>
            </div>
          </div>

          {/* Start Price */}
          <div className="space-y-2">
            <Label htmlFor="startPrice">Starting Price (NEX)</Label>
            <Input
              id="startPrice"
              type="number"
              placeholder="0.1"
              value={startPrice}
              onChange={(e) => setStartPrice(e.target.value)}
              step="0.001"
              min="0"
            />
          </div>

          {/* Reserve Price */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="reservePrice">Reserve Price (NEX)</Label>
              <span className="text-xs text-muted-foreground">(Optional)</span>
            </div>
            <Input
              id="reservePrice"
              type="number"
              placeholder="Minimum price to sell"
              value={reservePrice}
              onChange={(e) => setReservePrice(e.target.value)}
              step="0.001"
              min="0"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Auction won't sell below this price
            </p>
          </div>

          {/* Min Bid Increment */}
          <div className="space-y-2">
            <Label htmlFor="minIncrement">Minimum Bid Increment (NEX)</Label>
            <Input
              id="minIncrement"
              type="number"
              placeholder="0.01"
              value={minIncrement}
              onChange={(e) => setMinIncrement(e.target.value)}
              step="0.001"
              min="0.001"
            />
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label>Auction Duration</Label>
            <div className="flex flex-wrap gap-2">
              {durationPresets.map((preset) => (
                <Button
                  key={preset.hours}
                  type="button"
                  variant={duration === preset.hours ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDuration(preset.hours);
                    setEndDate(addHours(new Date(), preset.hours));
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Ends:</span>
              <span className="font-medium text-foreground">
                {format(addHours(new Date(), duration), 'PPP p')}
              </span>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-primary/5 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Starting Price</span>
              <span className="font-semibold">{startPrice || '0'} NEX</span>
            </div>
            {reservePrice && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reserve Price</span>
                <span className="font-semibold">{reservePrice} NEX</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-semibold">{duration} hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee</span>
              <span className="font-semibold">2.5%</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !startPrice}
            className="bg-gradient-sakura hover:shadow-sakura"
          >
            {isCreating ? 'Creating...' : 'Create Auction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAuctionModal;
