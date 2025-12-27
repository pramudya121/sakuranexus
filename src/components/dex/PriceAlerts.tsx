import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, TrendingUp, TrendingDown, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { useToast } from '@/hooks/use-toast';

interface PriceAlert {
  id: string;
  token: Token;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: Date;
}

const STORAGE_KEY = 'dex_price_alerts';

const loadAlerts = (): PriceAlert[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const alerts = JSON.parse(stored);
    return alerts.map((a: any) => ({
      ...a,
      token: DEFAULT_TOKENS.find(t => t.address === a.token.address) || a.token,
      createdAt: new Date(a.createdAt),
    }));
  } catch {
    return [];
  }
};

const saveAlerts = (alerts: PriceAlert[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
};

const PriceAlerts = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token>(DEFAULT_TOKENS[0]);
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  const addAlert = () => {
    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid target price',
        variant: 'destructive',
      });
      return;
    }

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      token: selectedToken,
      targetPrice: parseFloat(targetPrice),
      condition,
      isActive: true,
      createdAt: new Date(),
    };

    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
    setShowDialog(false);
    setTargetPrice('');

    toast({
      title: 'Alert Created',
      description: `You'll be notified when ${selectedToken.symbol} goes ${condition} $${targetPrice}`,
    });
  };

  const deleteAlert = (id: string) => {
    const updatedAlerts = alerts.filter(a => a.id !== id);
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
    toast({
      title: 'Alert Deleted',
      description: 'Price alert has been removed',
    });
  };

  const toggleAlert = (id: string) => {
    const updatedAlerts = alerts.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    );
    setAlerts(updatedAlerts);
    saveAlerts(updatedAlerts);
  };

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Price Alerts
        </h3>
        <Button size="sm" onClick={() => setShowDialog(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          Add Alert
        </Button>
      </div>

      <div className="p-4">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No price alerts set</p>
            <p className="text-sm mt-1">Create an alert to be notified of price changes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`flex items-center justify-between p-3 rounded-lg ${alert.isActive ? 'bg-secondary/30' : 'bg-secondary/10 opacity-60'}`}
              >
                <div className="flex items-center gap-3">
                  {alert.token.logoURI ? (
                    <img src={alert.token.logoURI} alt={alert.token.symbol} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-sm font-bold">
                      {alert.token.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{alert.token.symbol}</span>
                      <Badge variant="outline" className={alert.condition === 'above' ? 'text-green-500 border-green-500/50' : 'text-red-500 border-red-500/50'}>
                        {alert.condition === 'above' ? (
                          <><TrendingUp className="w-3 h-3 mr-1" /> Above</>
                        ) : (
                          <><TrendingDown className="w-3 h-3 mr-1" /> Below</>
                        )}
                      </Badge>
                    </div>
                    <span className="text-lg font-bold">${alert.targetPrice.toFixed(4)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.isActive}
                    onCheckedChange={() => toggleAlert(alert.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlert(alert.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Alert Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create Price Alert</DialogTitle>
            <DialogDescription>
              Get notified when a token reaches your target price
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {/* Token Selection */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Token</Label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_TOKENS.slice(0, 4).map((token) => (
                  <Button
                    key={token.address}
                    variant={selectedToken.address === token.address ? 'default' : 'outline'}
                    className="flex flex-col items-center p-3 h-auto"
                    onClick={() => setSelectedToken(token)}
                  >
                    {token.logoURI ? (
                      <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded-full mb-1 object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold mb-1">
                        {token.symbol.charAt(0)}
                      </div>
                    )}
                    <span className="text-xs">{token.symbol}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Condition</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={condition === 'above' ? 'default' : 'outline'}
                  onClick={() => setCondition('above')}
                  className="gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Goes Above
                </Button>
                <Button
                  variant={condition === 'below' ? 'default' : 'outline'}
                  onClick={() => setCondition('below')}
                  className="gap-2"
                >
                  <TrendingDown className="w-4 h-4" />
                  Goes Below
                </Button>
              </div>
            </div>

            {/* Target Price */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Target Price (USD)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            {/* Info */}
            <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
              <span className="text-muted-foreground">
                Alerts are stored locally and checked when you visit the page. For real-time alerts, connect to a notification service.
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addAlert} className="flex-1 bg-gradient-sakura">
                Create Alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PriceAlerts;
