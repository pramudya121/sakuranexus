import { useState, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, TrendingUp, TrendingDown, Trash2, AlertCircle } from 'lucide-react';

export interface PriceAlert {
  id: string;
  nftId: string;
  nftName: string;
  nftImage: string;
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice?: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}

const PRICE_ALERTS_KEY = 'nex_price_alerts';

export const getPriceAlerts = (): PriceAlert[] => {
  try {
    const stored = localStorage.getItem(PRICE_ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const savePriceAlerts = (alerts: PriceAlert[]) => {
  localStorage.setItem(PRICE_ALERTS_KEY, JSON.stringify(alerts));
};

export const addPriceAlert = (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'isActive'>) => {
  const alerts = getPriceAlerts();
  const newAlert: PriceAlert = {
    ...alert,
    id: `alert_${Date.now()}`,
    createdAt: Date.now(),
    isActive: true,
  };
  savePriceAlerts([...alerts, newAlert]);
  return newAlert;
};

export const removePriceAlert = (alertId: string) => {
  const alerts = getPriceAlerts();
  savePriceAlerts(alerts.filter(a => a.id !== alertId));
};

interface PriceAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft?: {
    id: string;
    name: string;
    image_url: string;
    currentPrice?: number;
  };
}

const PriceAlertModal = memo(({ open, onOpenChange, nft }: PriceAlertModalProps) => {
  const { toast } = useToast();
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('below');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);

  // Load alerts when modal opens
  const loadAlerts = () => {
    const allAlerts = getPriceAlerts();
    if (nft) {
      setAlerts(allAlerts.filter(a => a.nftId === nft.id));
    } else {
      setAlerts(allAlerts);
    }
  };

  const handleCreateAlert = () => {
    if (!nft || !targetPrice) return;

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid price',
        variant: 'destructive',
      });
      return;
    }

    addPriceAlert({
      nftId: nft.id,
      nftName: nft.name,
      nftImage: nft.image_url,
      targetPrice: price,
      condition,
      currentPrice: nft.currentPrice,
    });

    toast({
      title: 'Price Alert Created',
      description: `You'll be notified when ${nft.name} goes ${condition} ${price} NEX`,
    });

    setTargetPrice('');
    loadAlerts();
  };

  const handleRemoveAlert = (alertId: string) => {
    removePriceAlert(alertId);
    toast({
      title: 'Alert Removed',
      description: 'Price alert has been removed',
    });
    loadAlerts();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (isOpen) loadAlerts();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Price Alerts
          </DialogTitle>
          <DialogDescription>
            Get notified when NFT prices reach your target
          </DialogDescription>
        </DialogHeader>

        {nft && (
          <div className="space-y-4">
            {/* NFT Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <img 
                src={nft.image_url} 
                alt={nft.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{nft.name}</h4>
                {nft.currentPrice && (
                  <p className="text-sm text-muted-foreground">
                    Current: {nft.currentPrice} NEX
                  </p>
                )}
              </div>
            </div>

            {/* Create Alert Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={condition} onValueChange={(v) => setCondition(v as 'above' | 'below')}>
                    <SelectTrigger id="condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="below">
                        <span className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-green-500" />
                          Below
                        </span>
                      </SelectItem>
                      <SelectItem value="above">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          Above
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="price">Target Price (NEX)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleCreateAlert} className="w-full btn-hero">
                <Bell className="w-4 h-4 mr-2" />
                Create Alert
              </Button>
            </div>

            {/* Existing Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Active Alerts</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.condition === 'below' ? 'default' : 'secondary'}>
                          {alert.condition === 'below' ? (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          )}
                          {alert.targetPrice} NEX
                        </Badge>
                        {alert.triggeredAt && (
                          <Badge variant="outline" className="text-green-500">
                            Triggered
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveAlert(alert.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!nft && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Select an NFT to set price alerts
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

PriceAlertModal.displayName = 'PriceAlertModal';

export default PriceAlertModal;
