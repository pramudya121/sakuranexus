import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PriceAlert {
  id: string;
  pair: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: number;
}

const PoolPriceAlerts = memo(() => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [newAlertPair, setNewAlertPair] = useState('PSDK/BNB');
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertCondition, setNewAlertCondition] = useState<'above' | 'below'>('above');

  useEffect(() => {
    const stored = localStorage.getItem('pool_price_alerts');
    if (stored) {
      setAlerts(JSON.parse(stored));
    }
  }, []);

  const saveAlerts = (newAlerts: PriceAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem('pool_price_alerts', JSON.stringify(newAlerts));
  };

  const addAlert = () => {
    if (!newAlertPrice || parseFloat(newAlertPrice) <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid target price',
        variant: 'destructive',
      });
      return;
    }

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      pair: newAlertPair,
      targetPrice: parseFloat(newAlertPrice),
      condition: newAlertCondition,
      createdAt: Date.now(),
    };

    saveAlerts([...alerts, newAlert]);
    setNewAlertPrice('');
    
    toast({
      title: 'Alert Created',
      description: `Alert set for ${newAlertPair} ${newAlertCondition} $${newAlertPrice}`,
    });
  };

  const removeAlert = (id: string) => {
    saveAlerts(alerts.filter(a => a.id !== id));
    toast({
      title: 'Alert Removed',
    });
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="w-4 h-4 text-amber-500" />
          Alert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Alert Form */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={newAlertCondition === 'above' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setNewAlertCondition('above')}
              className="flex-1 h-8 text-xs"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Above
            </Button>
            <Button
              variant={newAlertCondition === 'below' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setNewAlertCondition('below')}
              className="flex-1 h-8 text-xs"
            >
              <TrendingDown className="w-3 h-3 mr-1" />
              Below
            </Button>
          </div>
          <Input
            type="number"
            placeholder="Target price..."
            value={newAlertPrice}
            onChange={(e) => setNewAlertPrice(e.target.value)}
            className="h-9 bg-muted/30 text-sm"
          />
          <Button 
            onClick={addAlert}
            size="sm"
            className="w-full h-8 text-xs bg-gradient-to-r from-amber-500 to-orange-500"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create Alert
          </Button>
        </div>

        {/* Existing Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground">Active Alerts</div>
            {alerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs"
              >
                <div>
                  <span className="font-medium">{alert.pair}</span>
                  <span className="text-muted-foreground mx-1">
                    {alert.condition === 'above' ? '>' : '<'}
                  </span>
                  <span className="text-primary">${alert.targetPrice}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeAlert(alert.id)}
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {alerts.length === 0 && (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No active alerts
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PoolPriceAlerts.displayName = 'PoolPriceAlerts';

export default PoolPriceAlerts;
