import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Clock, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useMultipleTokenPrices } from '@/hooks/usePriceWebSocket';

interface TokenHolding {
  symbol: string;
  name: string;
  balance: number;
  entryPrice: number;
  currentPrice: number;
  logoURI?: string;
}

interface PortfolioPerformanceProps {
  holdings?: TokenHolding[];
}

// Mock historical data generator
const generateHistoricalData = (days: number, startValue: number) => {
  const data = [];
  let value = startValue;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = days; i >= 0; i--) {
    const change = (Math.random() - 0.45) * 0.05 * value;
    value = Math.max(0, value + change);
    data.push({
      date: new Date(now - i * dayMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: now - i * dayMs,
      value: parseFloat(value.toFixed(2)),
    });
  }
  return data;
};

const PortfolioPerformance = ({ holdings: propHoldings }: PortfolioPerformanceProps) => {
  const { prices, isConnected } = useMultipleTokenPrices();
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d' | 'all'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock holdings with entry prices if not provided
  const holdings = useMemo(() => {
    if (propHoldings) return propHoldings;
    
    return [
      { symbol: 'NEX', name: 'Nexus', balance: 1250.5, entryPrice: 1.15, currentPrice: prices.get('NEX')?.price || 1.25 },
      { symbol: 'NXSA', name: 'NEXUSAKURA', balance: 5000, entryPrice: 0.75, currentPrice: prices.get('NXSA')?.price || 0.85 },
      { symbol: 'WETH', name: 'Wrapped ETH', balance: 0.5, entryPrice: 2200, currentPrice: prices.get('WETH')?.price || 2450 },
      { symbol: 'BNB', name: 'Binance Coin', balance: 2.5, entryPrice: 290, currentPrice: prices.get('BNB')?.price || 320.50 },
    ];
  }, [propHoldings, prices]);

  // Calculate portfolio metrics
  const metrics = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let totalPnL = 0;

    holdings.forEach((h) => {
      const currentValue = h.balance * h.currentPrice;
      const costBasis = h.balance * h.entryPrice;
      totalValue += currentValue;
      totalCost += costBasis;
      totalPnL += currentValue - costBasis;
    });

    const pnlPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalPnL,
      pnlPercent,
      isProfit: totalPnL >= 0,
    };
  }, [holdings]);

  // Historical data for chart
  const historicalData = useMemo(() => {
    const days = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 365,
    }[timeframe];
    return generateHistoricalData(days, metrics.totalValue * 0.85);
  }, [timeframe, metrics.totalValue]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  };

  // Individual token P&L
  const tokenPnL = useMemo(() => {
    return holdings.map((h) => {
      const currentValue = h.balance * h.currentPrice;
      const costBasis = h.balance * h.entryPrice;
      const pnl = currentValue - costBasis;
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      return {
        ...h,
        currentValue,
        costBasis,
        pnl,
        pnlPercent,
        isProfit: pnl >= 0,
      };
    }).sort((a, b) => b.currentValue - a.currentValue);
  }, [holdings]);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Portfolio Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className={isRefreshing ? 'animate-spin' : ''}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Value & P&L Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
            <p className="text-2xl font-bold">
              ${metrics.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cost Basis</span>
            </div>
            <p className="text-2xl font-bold">
              ${metrics.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`rounded-xl p-4 ${metrics.isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <div className="flex items-center gap-2 mb-2">
              {metrics.isProfit ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">Total P&L</span>
            </div>
            <p className={`text-2xl font-bold ${metrics.isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.isProfit ? '+' : ''}${metrics.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className={`rounded-xl p-4 ${metrics.isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Return %</span>
            </div>
            <p className={`text-2xl font-bold ${metrics.isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {metrics.isProfit ? '+' : ''}{metrics.pnlPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Portfolio History</span>
            <div className="flex gap-1">
              {(['24h', '7d', '30d', '90d', 'all'] as const).map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className="h-7 px-2 text-xs"
                >
                  {tf === 'all' ? 'All' : tf.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#portfolioGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Holdings Performance</h4>
          <div className="space-y-2">
            {tokenPnL.map((token) => (
              <div
                key={token.symbol}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {token.balance.toLocaleString()} @ ${token.entryPrice.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium">
                    ${token.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center gap-1 text-sm ${token.isProfit ? 'text-green-500' : 'text-red-500'}`}>
                    {token.isProfit ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    <span>
                      {token.isProfit ? '+' : ''}{token.pnlPercent.toFixed(2)}%
                    </span>
                    <span className="text-muted-foreground">
                      (${Math.abs(token.pnl).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioPerformance;
