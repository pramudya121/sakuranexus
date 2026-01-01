import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowRightLeft, 
  Target, 
  Shield, 
  Clock, 
  Trash2, 
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ChevronDown
} from 'lucide-react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { useTokenPrice } from '@/hooks/usePriceWebSocket';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  type: 'limit' | 'stop-loss' | 'take-profit';
  tokenIn: Token;
  tokenOut: Token;
  amount: string;
  triggerPrice: string;
  currentPrice: number;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: number;
  expiresAt?: number;
}

const LimitOrderPanel = () => {
  const [orderType, setOrderType] = useState<'limit' | 'stop-loss' | 'take-profit'>('limit');
  const [tokenIn, setTokenIn] = useState<Token>(DEFAULT_TOKENS[0]); // NEX
  const [tokenOut, setTokenOut] = useState<Token>(DEFAULT_TOKENS[2]); // NXSA
  const [amount, setAmount] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [expiration, setExpiration] = useState<'1h' | '24h' | '7d' | 'never'>('24h');
  const [enableTrailingStop, setEnableTrailingStop] = useState(false);
  const [trailingPercent, setTrailingPercent] = useState('5');
  const [orders, setOrders] = useState<Order[]>([]);

  const { price: currentPrice, isConnected } = useTokenPrice(tokenIn);

  // Load mock orders
  useEffect(() => {
    setOrders([
      {
        id: '1',
        type: 'limit',
        tokenIn: DEFAULT_TOKENS[0],
        tokenOut: DEFAULT_TOKENS[2],
        amount: '100',
        triggerPrice: '1.30',
        currentPrice: 1.25,
        status: 'pending',
        createdAt: Date.now() - 3600000,
      },
      {
        id: '2',
        type: 'stop-loss',
        tokenIn: DEFAULT_TOKENS[2],
        tokenOut: DEFAULT_TOKENS[5],
        amount: '500',
        triggerPrice: '0.70',
        currentPrice: 0.85,
        status: 'pending',
        createdAt: Date.now() - 7200000,
      },
    ]);
  }, []);

  const handleCreateOrder = () => {
    if (!amount || !triggerPrice) {
      toast.error('Please fill all fields');
      return;
    }

    const expirationMs = {
      '1h': 3600000,
      '24h': 86400000,
      '7d': 604800000,
      'never': 0,
    }[expiration];

    const newOrder: Order = {
      id: Date.now().toString(),
      type: orderType,
      tokenIn,
      tokenOut,
      amount,
      triggerPrice,
      currentPrice,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: expirationMs > 0 ? Date.now() + expirationMs : undefined,
    };

    setOrders((prev) => [newOrder, ...prev]);
    setAmount('');
    setTriggerPrice('');

    toast.success(`${orderType === 'limit' ? 'Limit Order' : orderType === 'stop-loss' ? 'Stop-Loss' : 'Take-Profit'} created`, {
      description: `${amount} ${tokenIn.symbol} at ${triggerPrice} ${tokenOut.symbol}`,
    });
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o))
    );
    toast.info('Order cancelled');
  };

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const historyOrders = orders.filter((o) => o.status !== 'pending');

  const getOrderTypeIcon = (type: Order['type']) => {
    switch (type) {
      case 'limit':
        return <Target className="w-4 h-4" />;
      case 'stop-loss':
        return <Shield className="w-4 h-4 text-red-500" />;
      case 'take-profit':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
  };

  const getOrderTypeColor = (type: Order['type']) => {
    switch (type) {
      case 'limit':
        return 'bg-primary/10 text-primary';
      case 'stop-loss':
        return 'bg-red-500/10 text-red-500';
      case 'take-profit':
        return 'bg-green-500/10 text-green-500';
    }
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Advanced Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="create" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="create">Create</TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pendingOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            {/* Order Type Selection */}
            <div className="grid grid-cols-3 gap-2">
              {(['limit', 'stop-loss', 'take-profit'] as const).map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className="gap-1.5"
                >
                  {getOrderTypeIcon(type)}
                  <span className="text-xs">
                    {type === 'limit' ? 'Limit' : type === 'stop-loss' ? 'Stop Loss' : 'Take Profit'}
                  </span>
                </Button>
              ))}
            </div>

            {/* Token Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Sell</Label>
                <Select 
                  value={tokenIn.symbol}
                  onValueChange={(v) => setTokenIn(DEFAULT_TOKENS.find(t => t.symbol === v) || DEFAULT_TOKENS[0])}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <span className="flex items-center gap-2">
                          {token.logoURI && (
                            <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                          )}
                          {token.symbol}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Buy</Label>
                <Select 
                  value={tokenOut.symbol}
                  onValueChange={(v) => setTokenOut(DEFAULT_TOKENS.find(t => t.symbol === v) || DEFAULT_TOKENS[2])}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_TOKENS.map((token) => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <span className="flex items-center gap-2">
                          {token.logoURI && (
                            <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
                          )}
                          {token.symbol}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount & Trigger Price */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Amount ({tokenIn.symbol})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    {orderType === 'limit' ? 'Limit Price' : orderType === 'stop-loss' ? 'Stop Price' : 'Target Price'}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Current: ${currentPrice.toFixed(4)}
                  </span>
                </div>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Trailing Stop (for stop-loss) */}
            {orderType === 'stop-loss' && (
              <div className="p-3 rounded-lg bg-secondary/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Trailing Stop</span>
                  </div>
                  <Switch
                    checked={enableTrailingStop}
                    onCheckedChange={setEnableTrailingStop}
                  />
                </div>
                {enableTrailingStop && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Trail %</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={trailingPercent}
                      onChange={(e) => setTrailingPercent(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Expiration */}
            <div>
              <Label className="text-xs text-muted-foreground">Expires In</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {(['1h', '24h', '7d', 'never'] as const).map((exp) => (
                  <Button
                    key={exp}
                    variant={expiration === exp ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExpiration(exp)}
                  >
                    {exp === 'never' ? '∞' : exp}
                  </Button>
                ))}
              </div>
            </div>

            {/* Warning for Stop-Loss */}
            {orderType === 'stop-loss' && parseFloat(triggerPrice) > currentPrice && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <span className="text-xs">
                  Stop price is above current price. Order will trigger immediately when placed.
                </span>
              </div>
            )}

            {/* Create Button */}
            <Button 
              className="w-full gap-2"
              onClick={handleCreateOrder}
              disabled={!amount || !triggerPrice}
            >
              <Plus className="w-4 h-4" />
              Create {orderType === 'limit' ? 'Limit Order' : orderType === 'stop-loss' ? 'Stop-Loss' : 'Take-Profit'}
            </Button>
          </TabsContent>

          <TabsContent value="pending" className="space-y-2">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending orders</p>
              </div>
            ) : (
              pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-lg bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getOrderTypeColor(order.type)}>
                        {getOrderTypeIcon(order.type)}
                        <span className="ml-1 capitalize">{order.type}</span>
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{order.amount} {order.tokenIn.symbol}</span>
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>{order.tokenOut.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>@ ${order.triggerPrice}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2">
            {historyOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No order history</p>
              </div>
            ) : (
              historyOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-lg bg-secondary/20 opacity-60"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="capitalize">
                      {order.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span>{order.amount} {order.tokenIn.symbol}</span>
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>{order.tokenOut.symbol}</span>
                    <span className="text-muted-foreground">@ ${order.triggerPrice}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LimitOrderPanel;
