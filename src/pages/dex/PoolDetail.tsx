import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import DEXNavigation from '@/components/dex/DEXNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, TrendingUp, Droplets, BarChart3, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getPoolInfo, PoolInfo } from '@/lib/web3/dex';
import { useToast } from '@/hooks/use-toast';

// Generate mock historical data
const generateHistoricalData = (days: number, basePrice: number) => {
  const data = [];
  let price = basePrice * 0.8;
  let volume = Math.random() * 50000;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    price = price * (0.97 + Math.random() * 0.06);
    volume = volume * (0.8 + Math.random() * 0.4);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: price,
      volume: volume,
      tvl: price * 100000 * (0.95 + Math.random() * 0.1),
    });
  }
  return data;
};

const PoolDetail = () => {
  const { pairAddress } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pool, setPool] = useState<PoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const daysMap = { '7d': 7, '30d': 30, '90d': 90 };

  useEffect(() => {
    if (pairAddress) {
      loadPoolData();
    }
  }, [pairAddress]);

  const loadPoolData = async () => {
    if (!pairAddress) return;
    setIsLoading(true);
    try {
      const poolData = await getPoolInfo(pairAddress);
      setPool(poolData);
    } catch (error) {
      console.error('Error loading pool:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pool data',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const copyAddress = () => {
    if (pairAddress) {
      navigator.clipboard.writeText(pairAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Generate chart data based on pool
  const basePrice = pool ? parseFloat(pool.reserve1) / parseFloat(pool.reserve0) : 1;
  const chartData = generateHistoricalData(daysMap[timeRange], basePrice);

  // Calculate stats
  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const startPrice = chartData[0]?.price || 0;
  const priceChange = ((currentPrice - startPrice) / startPrice) * 100;
  const isPositive = priceChange >= 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SakuraFalling />
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-96 w-full mb-6" />
          <div className="grid md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen bg-background">
        <SakuraFalling />
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Pool Not Found</h2>
            <Button onClick={() => navigate('/dex/pools')}>Back to Pools</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <DEXNavigation />

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dex/pools')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {pool.token0.logoURI ? (
                <img src={pool.token0.logoURI} alt={pool.token0.symbol} className="w-10 h-10 rounded-full object-cover z-10 border-2 border-background" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold z-10 border-2 border-background">
                  {pool.token0.symbol.charAt(0)}
                </div>
              )}
              {pool.token1.logoURI ? (
                <img src={pool.token1.logoURI} alt={pool.token1.symbol} className="w-10 h-10 rounded-full object-cover border-2 border-background" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold border-2 border-background">
                  {pool.token1.symbol.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{pool.token0.symbol} / {pool.token1.symbol}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">0.3% Fee</Badge>
                <button 
                  onClick={copyAddress}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {pairAddress?.slice(0, 6)}...{pairAddress?.slice(-4)}
                </button>
                <a 
                  href={`https://nexus.testnet.blockscout.com/address/${pairAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">TVL</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(pool.tvl)}</p>
          </Card>
          <Card className="glass border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Volume 24h</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(pool.volume24h)}</p>
          </Card>
          <Card className="glass border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">APR</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{pool.apr.toFixed(2)}%</p>
          </Card>
          <Card className="glass border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm text-muted-foreground">{timeRange} Change</span>
            </div>
            <p className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </p>
          </Card>
        </div>

        {/* Charts */}
        <Card className="glass border-border/50 mb-6">
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <h3 className="font-bold">Pool Analytics</h3>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="price" className="w-full">
            <TabsList className="m-4 mb-0">
              <TabsTrigger value="price">Price</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
              <TabsTrigger value="tvl">TVL</TabsTrigger>
            </TabsList>

            <div className="p-4">
              <TabsContent value="price" className="mt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={isPositive ? '#22c55e' : '#ef4444'} 
                        fill="url(#priceGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="volume" className="mt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [formatNumber(value), 'Volume']}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              <TabsContent value="tvl" className="mt-0">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [formatNumber(value), 'TVL']}
                      />
                      <Line type="monotone" dataKey="tvl" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>

        {/* Pool Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass border-border/50 p-6">
            <h3 className="font-bold mb-4">Pool Reserves</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {pool.token0.logoURI ? (
                    <img src={pool.token0.logoURI} alt={pool.token0.symbol} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-sm">
                      {pool.token0.symbol.charAt(0)}
                    </div>
                  )}
                  <span>{pool.token0.symbol}</span>
                </div>
                <span className="font-mono">{parseFloat(pool.reserve0).toFixed(6)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2">
                  {pool.token1.logoURI ? (
                    <img src={pool.token1.logoURI} alt={pool.token1.symbol} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-sm">
                      {pool.token1.symbol.charAt(0)}
                    </div>
                  )}
                  <span>{pool.token1.symbol}</span>
                </div>
                <span className="font-mono">{parseFloat(pool.reserve1).toFixed(6)}</span>
              </div>
            </div>
          </Card>

          <Card className="glass border-border/50 p-6">
            <h3 className="font-bold mb-4">Pool Actions</h3>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/dex/liquidity')}
                className="w-full bg-gradient-sakura hover:shadow-sakura"
              >
                Add Liquidity
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/dex/swap')}
                className="w-full"
              >
                Swap Tokens
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PoolDetail;
