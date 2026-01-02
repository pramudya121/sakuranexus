import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TokenLogo } from '@/components/ui/token-logo';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { StableSkeleton, ChartSkeleton } from '@/components/ui/stable-skeleton';
import { useTokenFavorites } from '@/hooks/useTokenFavorites';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { getTokenBalance } from '@/lib/web3/dex';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  ArrowRightLeft,
  Clock,
  DollarSign,
  Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenActivity {
  id: string;
  type: string;
  amount: string;
  time: Date;
  txHash?: string;
  from?: string;
  to?: string;
}

const TokenDetail = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useTokenFavorites();
  
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [balance, setBalance] = useState('0');
  const [activities, setActivities] = useState<TokenActivity[]>([]);
  
  // Find token in DEFAULT_TOKENS
  const token = useMemo(() => 
    DEFAULT_TOKENS.find(t => t.address.toLowerCase() === address?.toLowerCase()),
    [address]
  );

  // Mock price data (would come from API in production)
  const priceData = useMemo(() => {
    const mockPrices: Record<string, { price: number; change: number; volume: string; marketCap: string }> = {
      NEX: { price: 1.25, change: 3.5, volume: '$2.5M', marketCap: '$125M' },
      WNEX: { price: 1.25, change: 3.5, volume: '$1.2M', marketCap: '$125M' },
      NXSA: { price: 0.85, change: -1.2, volume: '$1.8M', marketCap: '$85M' },
      WETH: { price: 2450, change: 2.8, volume: '$4.2M', marketCap: '$295B' },
      BNB: { price: 320.5, change: -0.5, volume: '$3.1M', marketCap: '$49B' },
      USDC: { price: 1.0, change: 0.01, volume: '$5.8M', marketCap: '$32B' },
      USDT: { price: 1.0, change: -0.02, volume: '$4.5M', marketCap: '$83B' },
      LINK: { price: 14.5, change: 5.2, volume: '$890K', marketCap: '$8.5B' },
      UNI: { price: 7.8, change: -2.1, volume: '$450K', marketCap: '$5.8B' },
      AAVE: { price: 95.2, change: 1.8, volume: '$320K', marketCap: '$1.4B' },
    };
    return token ? mockPrices[token.symbol] : null;
  }, [token]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!priceData) return [];
    const basePrice = priceData.price;
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Deterministic variation based on day
      const variation = Math.sin(i * 0.5) * 0.05 + Math.cos(i * 0.3) * 0.03;
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: basePrice * (1 + variation),
        volume: Math.floor(50000 + Math.sin(i) * 30000 + 20000),
      });
    }
    return data;
  }, [priceData]);

  useEffect(() => {
    if (token) {
      document.title = `${token.symbol} - Token Detail | NEXUSAKURA`;
    }
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Get wallet
      const account = await getCurrentAccount();
      setWalletAddress(account || undefined);
      
      // Get balance
      if (account && address) {
        try {
          const bal = await getTokenBalance(address, account);
          setBalance(bal);
        } catch {
          setBalance('0');
        }
      }
      
      // Fetch activities related to this token (mock for now)
      // In production, filter by token address
      const { data } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data) {
        setActivities(data.map(a => ({
          id: a.id,
          type: a.activity_type,
          amount: a.price || '0',
          time: new Date(a.created_at),
          txHash: a.transaction_hash || undefined,
          from: a.from_address || undefined,
          to: a.to_address || undefined,
        })));
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [address]);

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Token Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The token you're looking for doesn't exist in our registry.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              <TokenLogo 
                src={token.logoURI} 
                symbol={token.symbol} 
                size="xl"
                className="shadow-lg"
              />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{token.name}</h1>
                  <Badge variant="secondary">{token.symbol}</Badge>
                  <button onClick={() => toggleFavorite(token.address)}>
                    <Star className={cn(
                      'w-5 h-5 transition-colors',
                      isFavorite(token.address) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-muted-foreground hover:text-yellow-400'
                    )} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </code>
                  <button 
                    onClick={copyAddress}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link to={`/dex/swap?token=${token.address}`}>
              <Button className="gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Trade
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Price</span>
              </div>
              {isLoading ? (
                <StableSkeleton height={32} width={100} />
              ) : (
                <div className="flex items-center gap-2">
                  <AnimatedNumber 
                    value={priceData?.price || 0}
                    prefix="$"
                    decimals={priceData?.price && priceData.price < 1 ? 4 : 2}
                    className="text-2xl font-bold"
                  />
                  <span className={cn(
                    'text-sm flex items-center gap-0.5',
                    (priceData?.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {(priceData?.change || 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(priceData?.change || 0).toFixed(2)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">24h Volume</span>
              </div>
              {isLoading ? (
                <StableSkeleton height={32} width={80} />
              ) : (
                <p className="text-2xl font-bold">{priceData?.volume}</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Percent className="w-4 h-4" />
                <span className="text-sm">Market Cap</span>
              </div>
              {isLoading ? (
                <StableSkeleton height={32} width={80} />
              ) : (
                <p className="text-2xl font-bold">{priceData?.marketCap}</p>
              )}
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Your Balance</span>
              </div>
              {isLoading ? (
                <StableSkeleton height={32} width={100} />
              ) : walletAddress ? (
                <p className="text-2xl font-bold tabular-nums">
                  {parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Connect wallet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chart & Activity Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Price Chart */}
          <div className="lg:col-span-2">
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Price Chart (30D)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ChartSkeleton height={300} />
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11}
                          tickLine={false}
                          domain={['auto', 'auto']}
                          tickFormatter={(v) => `$${v.toLocaleString()}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
                        />
                        <Area 
                          type="monotone"
                          dataKey="price" 
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#priceGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[340px]">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <StableSkeleton width={32} height={32} className="rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <StableSkeleton width={80} height={14} />
                          <StableSkeleton width={60} height={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {activities.map((activity) => (
                      <div 
                        key={activity.id}
                        className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <ArrowRightLeft className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm capitalize">{activity.type}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(activity.time)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{activity.amount} NEX</p>
                          {activity.txHash && (
                            <a 
                              href={`https://explorer.nexus.xyz/tx/${activity.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-0.5 justify-end"
                            >
                              View <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TokenDetail;
