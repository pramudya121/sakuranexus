import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_TOKENS } from '@/lib/web3/dex-config';

interface PriceAlert {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  targetPrice: number;
  condition: 'above' | 'below';
  currentPrice: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}

// Mock current prices
const MOCK_PRICES: Record<string, number> = {
  'WETH': 2350.50,
  'NEX': 0.85,
  'USDC': 1.00,
  'USDT': 1.00,
  'SAKURA': 0.025,
  'NXSA': 1.25,
};

const STORAGE_KEY = 'sakura_price_alerts';

const PriceAlertsManager = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load alerts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlerts(parsed);
      } catch (e) {
        console.error('Error loading alerts:', e);
      }
    }
  }, []);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  }, [alerts]);

  // Check alerts periodically
  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkAlerts = () => {
      setAlerts(prevAlerts => {
        let hasTriggered = false;
        const updated = prevAlerts.map(alert => {
          if (!alert.isActive || alert.triggeredAt) return alert;

          const currentPrice = MOCK_PRICES[alert.tokenSymbol] || alert.currentPrice;
          const isTriggered = 
            (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
            (alert.condition === 'below' && currentPrice <= alert.targetPrice);

          if (isTriggered) {
            hasTriggered = true;
            toast.success(`🔔 Price Alert: ${alert.tokenSymbol} is now ${alert.condition} $${alert.targetPrice}!`, {
              duration: 10000,
            });
            return { ...alert, triggeredAt: Date.now(), isActive: false };
          }

          return { ...alert, currentPrice };
        });

        return hasTriggered ? updated : prevAlerts;
      });
    };

    const interval = setInterval(checkAlerts, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const handleCreateAlert = () => {
    if (!selectedToken || !targetPrice) {
      toast.error('Please fill in all fields');
      return;
    }

    const token = DEFAULT_TOKENS.find(t => t.symbol === selectedToken);
    if (!token) return;

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      tokenSymbol: token.symbol,
      tokenAddress: token.address,
      targetPrice: parseFloat(targetPrice),
      condition,
      currentPrice: MOCK_PRICES[token.symbol] || 0,
      isActive: true,
      createdAt: Date.now(),
    };

    setAlerts(prev => [...prev, newAlert]);
    setIsDialogOpen(false);
    setSelectedToken('');
    setTargetPrice('');
    toast.success('Price alert created!');
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
    toast.success('Alert deleted');
  };

  const activeAlerts = alerts.filter(a => a.isActive && !a.triggeredAt);
  const triggeredAlerts = alerts.filter(a => a.triggeredAt);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle>Price Alerts</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                id="notifications"
              />
              <Label htmlFor="notifications" className="text-sm cursor-pointer">
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Alert
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Price Alert</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_TOKENS.map(token => (
                          <SelectItem key={token.symbol} value={token.symbol}>
                            <div className="flex items-center gap-2">
                              <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded-full" />
                              <span>{token.symbol}</span>
                              <span className="text-muted-foreground">
                                ${MOCK_PRICES[token.symbol]?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Select value={condition} onValueChange={(v) => setCondition(v as 'above' | 'below')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span>Price goes above</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="below">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            <span>Price goes below</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                    />
                    {selectedToken && MOCK_PRICES[selectedToken] && (
                      <p className="text-xs text-muted-foreground">
                        Current price: ${MOCK_PRICES[selectedToken].toFixed(4)}
                      </p>
                    )}
                  </div>

                  <Button onClick={handleCreateAlert} className="w-full">
                    Create Alert
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">No price alerts set</p>
            <p className="text-sm text-muted-foreground">Create an alert to get notified when prices change</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Active Alerts</h4>
                <div className="space-y-2">
                  {activeAlerts.map(alert => {
                    const token = DEFAULT_TOKENS.find(t => t.symbol === alert.tokenSymbol);
                    const currentPrice = MOCK_PRICES[alert.tokenSymbol] || alert.currentPrice;
                    const percentDiff = ((alert.targetPrice - currentPrice) / currentPrice * 100).toFixed(1);
                    
                    return (
                      <div 
                        key={alert.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                      >
                        <div className="flex items-center gap-3">
                          {token && (
                            <img src={token.logoURI} alt={alert.tokenSymbol} className="w-8 h-8 rounded-full" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{alert.tokenSymbol}</span>
                              <Badge 
                                variant="outline"
                                className={alert.condition === 'above' ? 'text-green-500 border-green-500/50' : 'text-red-500 border-red-500/50'}
                              >
                                {alert.condition === 'above' ? (
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <TrendingDown className="w-3 h-3 mr-1" />
                                )}
                                ${alert.targetPrice}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Current: ${currentPrice.toFixed(4)} ({percentDiff}% away)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={alert.isActive}
                            onCheckedChange={() => handleToggleAlert(alert.id)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Triggered Alerts</h4>
                <div className="space-y-2">
                  {triggeredAlerts.map(alert => {
                    const token = DEFAULT_TOKENS.find(t => t.symbol === alert.tokenSymbol);
                    
                    return (
                      <div 
                        key={alert.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                      >
                        <div className="flex items-center gap-3">
                          {token && (
                            <img src={token.logoURI} alt={alert.tokenSymbol} className="w-8 h-8 rounded-full" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{alert.tokenSymbol}</span>
                              <Badge className="bg-green-500/20 text-green-400">
                                Triggered
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Target: ${alert.targetPrice} • Triggered {new Date(alert.triggeredAt!).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceAlertsManager;
