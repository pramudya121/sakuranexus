import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import DEXNavigation from '@/components/dex/DEXNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Copy, CheckCircle, ExternalLink, TrendingUp, TrendingDown, 
  BarChart3, Users, Wallet, ArrowRightLeft, Droplets, Clock 
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { getAllPairs, getPoolInfo } from '@/lib/web3/dex';
import { useToast } from '@/hooks/use-toast';

// Generate mock price history
const generatePriceHistory = (days: number, basePrice: number, volatility: number = 0.05) => {
  const data = [];
  let price = basePrice * (0.7 + Math.random() * 0.3);
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.5) * 2 * volatility;
    price = price * (1 + change);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: price,
      volume: Math.random() * 100000 + 10000,
    });
  }
  return data;
};

// Generate mock holders data
const generateHolders = (tokenSymbol: string) => {
  const holders = [];
  const totalSupply = 1000000000;
  let remaining = totalSupply;
  
  const names = ['Whale 1', 'DEX Pool', 'Whale 2', 'Team Wallet', 'Treasury', 'Staking Contract'];
  
  for (let i = 0; i < 6; i++) {
    const percentage = i === 0 ? 15 + Math.random() * 10 : Math.random() * 8 + 2;
    const amount = (totalSupply * percentage) / 100;
    remaining -= amount;
    
    holders.push({
      rank: i + 1,
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      name: names[i],
      balance: amount,
      percentage: percentage,
    });
  }
  
  return holders.sort((a, b) => b.percentage - a.percentage);
};

// Generate mock transactions
const generateTransactions = (tokenSymbol: string) => {
  const types = ['Swap', 'Add Liquidity', 'Remove Liquidity', 'Transfer'];
  const transactions = [];
  
  for (let i = 0; i < 20; i++) {
    const date = new Date();
    date.setMinutes(date.getMinutes() - i * 15);
    
    transactions.push({
      hash: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      type: types[Math.floor(Math.random() * types.length)],
      amount: (Math.random() * 10000).toFixed(2),
      value: (Math.random() * 5000).toFixed(2),
      time: date,
    });
  }
  
  return transactions;
};

const TokenAnalytics = () => {
  const { tokenAddress } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [token, setToken] = useState<Token | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [pools, setPools] = useState<any[]>([]);

  const daysMap = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };

  useEffect(() => {
    loadTokenData();
  }, [tokenAddress]);

  const loadTokenData = async () => {
    setIsLoading(true);
    
    // Find token from DEFAULT_TOKENS
    const foundToken = DEFAULT_TOKENS.find(
      t => t.address.toLowerCase() === tokenAddress?.toLowerCase()
    );
    
    if (foundToken) {
      setToken(foundToken);
      
      // Load pools containing this token
      try {
        const allPairs = await getAllPairs();
        const tokenPools = [];
        
        for (const pairAddress of allPairs) {
          const poolInfo = await getPoolInfo(pairAddress);
          // Only process valid pool info with token0 and token1
          if (
            poolInfo && 
            poolInfo.token0 && 
            poolInfo.token1 &&
            (poolInfo.token0.address.toLowerCase() === tokenAddress?.toLowerCase() ||
             poolInfo.token1.address.toLowerCase() === tokenAddress?.toLowerCase())
          ) {
            tokenPools.push(poolInfo);
          }
        }
        setPools(tokenPools);
      } catch {
        // Silent fail - pools will remain empty
        setPools([]);
      }
    }
    
    setIsLoading(false);
  };

  const copyAddress = () => {
    if (tokenAddress) {
      navigator.clipboard.writeText(tokenAddress);
      setCopied(true);
      toast({ title: 'Address copied!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Mock data
  const basePrice = token?.symbol === 'WNEX' ? 0.15 : token?.symbol === 'NXSA' ? 0.05 : 0.01;
  const priceHistory = generatePriceHistory(daysMap[timeRange], basePrice);
  const holders = generateHolders(token?.symbol || '');
  const transactions = generateTransactions(token?.symbol || '');

  // Stats
  const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0;
  const startPrice = priceHistory[0]?.price || 0;
  const priceChange = ((currentPrice - startPrice) / startPrice) * 100;
  const isPositive = priceChange >= 0;
  const totalVolume = priceHistory.reduce((sum, d) => sum + d.volume, 0);
  const marketCap = currentPrice * 1000000000; // Mock supply
  const totalLiquidity = pools.reduce((sum, p) => sum + p.tvl, 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SakuraFalling />
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <SakuraFalling />
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Token Not Found</h2>
            <Button onClick={() => navigate('/dex/swap')}>Back to DEX</Button>
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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            {token.logoURI ? (
              <img src={token.logoURI} alt={token.symbol} className="w-12 h-12 rounded-full" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-lg">
                {token.symbol.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{token.name}</h1>
                <Badge variant="secondary">{token.symbol}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={copyAddress} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  {tokenAddress?.slice(0, 10)}...{tokenAddress?.slice(-6)}
                </button>
                <a 
                  href={`https://nexus.testnet.blockscout.com/token/${tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-3xl font-bold">${currentPrice.toFixed(6)}</span>
            <Badge className={`${isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Market Cap</span>
            </div>
            <p className="text-xl font-bold">{formatNumber(marketCap)}</p>
          </Card>
          <Card className="glass border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">{timeRange} Volume</span>
            </div>
            <p className="text-xl font-bold">{formatNumber(totalVolume)}</p>
          </Card>
          <Card className="glass border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Liquidity</span>
            </div>
            <p className="text-xl font-bold">{formatNumber(totalLiquidity)}</p>
          </Card>
          <Card className="glass border-border/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Holders</span>
            </div>
            <p className="text-xl font-bold">{(Math.random() * 5000 + 1000).toFixed(0)}</p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <Button onClick={() => navigate('/dex/swap')} className="bg-gradient-sakura">
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Swap
          </Button>
          <Button variant="outline" onClick={() => navigate('/dex/liquidity')}>
            <Droplets className="w-4 h-4 mr-2" />
            Add Liquidity
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Price Chart */}
          <Card className="glass border-border/50 lg:col-span-2">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-bold">Price Chart</h3>
              <div className="flex gap-1">
                {(['24h', '7d', '30d', '90d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
            <div className="p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `$${v.toFixed(4)}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(6)}`, 'Price']}
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
          </Card>

          {/* Token Info */}
          <Card className="glass border-border/50">
            <div className="p-4 border-b border-border/50">
              <h3 className="font-bold">Token Info</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{token.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Symbol</span>
                <span className="font-medium">{token.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Decimals</span>
                <span className="font-medium">{token.decimals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Supply</span>
                <span className="font-medium">1,000,000,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pools</span>
                <span className="font-medium">{pools.length}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs for Holders and Transactions */}
        <Card className="glass border-border/50 mt-6">
          <Tabs defaultValue="holders">
            <div className="p-4 border-b border-border/50">
              <TabsList>
                <TabsTrigger value="holders">
                  <Users className="w-4 h-4 mr-2" />
                  Top Holders
                </TabsTrigger>
                <TabsTrigger value="transactions">
                  <Clock className="w-4 h-4 mr-2" />
                  Recent Transactions
                </TabsTrigger>
                <TabsTrigger value="pools">
                  <Droplets className="w-4 h-4 mr-2" />
                  Pools ({pools.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="holders" className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border/50">
                      <th className="pb-3">Rank</th>
                      <th className="pb-3">Address</th>
                      <th className="pb-3 text-right">Balance</th>
                      <th className="pb-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holders.map((holder, i) => (
                      <tr key={i} className="border-b border-border/30 hover:bg-secondary/20">
                        <td className="py-3">{holder.rank}</td>
                        <td className="py-3">
                          <div>
                            <span className="font-mono text-sm">{holder.address}</span>
                            {holder.name && (
                              <Badge variant="secondary" className="ml-2 text-xs">{holder.name}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono">
                          {holder.balance.toLocaleString()} {token.symbol}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-sakura" 
                                style={{ width: `${holder.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm">{holder.percentage.toFixed(2)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="p-4">
              <div className="space-y-2">
                {transactions.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={tx.type === 'Swap' ? 'default' : 'secondary'}>
                        {tx.type}
                      </Badge>
                      <div>
                        <p className="font-mono text-sm">{tx.hash}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.time.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{tx.amount} {token.symbol}</p>
                      <p className="text-sm text-muted-foreground">${tx.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pools" className="p-4">
              {pools.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pools found for this token
                </div>
              ) : (
                <div className="space-y-2">
                  {pools.map((pool, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg cursor-pointer hover:bg-secondary/30"
                      onClick={() => navigate(`/dex/pool/${pool.pairAddress}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {pool.token0.logoURI ? (
                            <img src={pool.token0.logoURI} alt={pool.token0.symbol} className="w-8 h-8 rounded-full border-2 border-background z-10" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-xs border-2 border-background z-10">
                              {pool.token0.symbol.charAt(0)}
                            </div>
                          )}
                          {pool.token1.logoURI ? (
                            <img src={pool.token1.logoURI} alt={pool.token1.symbol} className="w-8 h-8 rounded-full border-2 border-background" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-xs border-2 border-background">
                              {pool.token1.symbol.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{pool.token0.symbol}/{pool.token1.symbol}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(pool.tvl)}</p>
                        <p className="text-sm text-green-500">{pool.apr.toFixed(1)}% APR</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default TokenAnalytics;
