import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import PortfolioOverview from '@/components/portfolio/PortfolioOverview';
import PortfolioPerformance from '@/components/portfolio/PortfolioPerformance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Wallet,
  BarChart3,
  Activity,
  Flame,
  Eye,
  ExternalLink,
  RefreshCw,
  Zap,
  DollarSign,
  Percent,
  ArrowRightLeft,
  Image
} from 'lucide-react';
import { useMultipleTokenPrices } from '@/hooks/usePriceWebSocket';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock data for recent trades
const generateRecentTrades = () => {
  const types = ['swap', 'add_liquidity', 'remove_liquidity', 'stake', 'unstake'] as const;
  const tokens = ['NEX', 'NXSA', 'WETH', 'BNB', 'USDC'];
  const trades = [];
  
  for (let i = 0; i < 15; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const tokenA = tokens[Math.floor(Math.random() * tokens.length)];
    let tokenB = tokens[Math.floor(Math.random() * tokens.length)];
    while (tokenB === tokenA) {
      tokenB = tokens[Math.floor(Math.random() * tokens.length)];
    }
    
    trades.push({
      id: `trade-${i}`,
      type,
      tokenA,
      tokenB,
      amountA: (Math.random() * 1000).toFixed(2),
      amountB: (Math.random() * 500).toFixed(2),
      value: (Math.random() * 2000).toFixed(2),
      time: new Date(Date.now() - i * 3600000 * Math.random() * 24),
      status: Math.random() > 0.1 ? 'completed' : 'pending',
    });
  }
  
  return trades.sort((a, b) => b.time.getTime() - a.time.getTime());
};

// Mock market data
const generateMarketData = () => {
  return [
    { name: 'NEX', price: 1.25, change: 5.2, volume: '2.5M', marketCap: '125M', trending: true },
    { name: 'NXSA', price: 0.85, change: -2.1, volume: '1.8M', marketCap: '85M', trending: true },
    { name: 'WETH', price: 2450, change: 3.8, volume: '15M', marketCap: '295B', trending: false },
    { name: 'BNB', price: 320.5, change: 1.2, volume: '8M', marketCap: '48B', trending: true },
    { name: 'USDC', price: 1.00, change: 0.01, volume: '50M', marketCap: '25B', trending: false },
  ];
};

// Mock volume data for chart
const generateVolumeData = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short' }),
      volume: Math.floor(Math.random() * 500000) + 100000,
      trades: Math.floor(Math.random() * 500) + 100,
    });
  }
  return data;
};

const Dashboard = () => {
  const { prices, isConnected } = useMultipleTokenPrices();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentTrades] = useState(generateRecentTrades);
  const [marketData] = useState(generateMarketData);
  const [volumeData] = useState(generateVolumeData);

  useEffect(() => {
    document.title = 'Dashboard - NEXUSAKURA';
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  };

  // Calculate total stats
  const totalStats = useMemo(() => {
    const totalVolume = volumeData.reduce((sum, d) => sum + d.volume, 0);
    const totalTrades = volumeData.reduce((sum, d) => sum + d.trades, 0);
    const avgVolume = totalVolume / volumeData.length;
    
    return { totalVolume, totalTrades, avgVolume };
  }, [volumeData]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getTradeIcon = (type: string) => {
    switch (type) {
      case 'swap': return <ArrowRightLeft className="w-4 h-4" />;
      case 'add_liquidity': return <TrendingUp className="w-4 h-4" />;
      case 'remove_liquidity': return <TrendingDown className="w-4 h-4" />;
      case 'stake': return <Zap className="w-4 h-4" />;
      case 'unstake': return <Wallet className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTradeLabel = (type: string) => {
    switch (type) {
      case 'swap': return 'Swap';
      case 'add_liquidity': return 'Add Liquidity';
      case 'remove_liquidity': return 'Remove Liquidity';
      case 'stake': return 'Stake';
      case 'unstake': return 'Unstake';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <LayoutDashboard className="w-8 h-8 text-primary" />
              </div>
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Overview lengkap portfolio, trades, dan market insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1.5 px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'}`} />
              {isConnected ? 'Live Data' : 'Offline'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                  +12.5%
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-3">
                ${(totalStats.totalVolume / 1000000).toFixed(2)}M
              </p>
              <p className="text-sm text-muted-foreground">7D Volume</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10">
                  Active
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-3">
                {totalStats.totalTrades.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Trades</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Percent className="w-5 h-5 text-purple-500" />
                </div>
                <Badge variant="outline" className="text-purple-500 border-purple-500/30 bg-purple-500/10">
                  APR
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-3">24.5%</p>
              <p className="text-sm text-muted-foreground">Avg Staking APR</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Image className="w-5 h-5 text-orange-500" />
                </div>
                <Badge variant="outline" className="text-orange-500 border-orange-500/30 bg-orange-500/10">
                  NFTs
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-3">156</p>
              <p className="text-sm text-muted-foreground">NFTs Owned</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Portfolio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Overview */}
            <PortfolioOverview 
              tokenValue={4850.50} 
              lpValue={2340.25} 
              stakingValue={1560.75} 
            />

            {/* Portfolio Performance Chart */}
            <PortfolioPerformance />

            {/* Volume Chart */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Trading Volume (7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeData}>
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
                        tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
                      />
                      <Bar 
                        dataKey="volume" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        opacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Trades & Market */}
          <div className="space-y-6">
            {/* Recent Trades */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Trades
                  </CardTitle>
                  <Link to="/dex/history">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      View All
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[320px]">
                  <div className="divide-y divide-border/50">
                    {recentTrades.slice(0, 8).map((trade) => (
                      <div 
                        key={trade.id}
                        className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            trade.type === 'swap' ? 'bg-primary/10 text-primary' :
                            trade.type.includes('liquidity') ? 'bg-blue-500/10 text-blue-500' :
                            'bg-purple-500/10 text-purple-500'
                          }`}>
                            {getTradeIcon(trade.type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{getTradeLabel(trade.type)}</p>
                            <p className="text-xs text-muted-foreground">
                              {trade.amountA} {trade.tokenA}
                              {trade.type === 'swap' && ` → ${trade.amountB} ${trade.tokenB}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">${trade.value}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(trade.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Market Insights */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Market Insights
                  </CardTitle>
                  <Link to="/dex/swap">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Trade
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {marketData.map((token) => (
                    <div 
                      key={token.name}
                      className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-sm">
                          {token.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{token.name}</p>
                            {token.trending && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-orange-500/10 border-orange-500/30 text-orange-500">
                                🔥 Hot
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Vol: ${token.volume}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${token.price.toLocaleString()}
                        </p>
                        <div className={`flex items-center justify-end gap-1 text-sm ${
                          token.change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {token.change >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span>{Math.abs(token.change)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Link to="/dex/swap">
                  <Button variant="outline" className="w-full gap-2 h-12">
                    <ArrowRightLeft className="w-4 h-4" />
                    Swap
                  </Button>
                </Link>
                <Link to="/dex/liquidity">
                  <Button variant="outline" className="w-full gap-2 h-12">
                    <TrendingUp className="w-4 h-4" />
                    Add LP
                  </Button>
                </Link>
                <Link to="/dex/staking">
                  <Button variant="outline" className="w-full gap-2 h-12">
                    <Zap className="w-4 h-4" />
                    Stake
                  </Button>
                </Link>
                <Link to="/mint">
                  <Button variant="outline" className="w-full gap-2 h-12">
                    <Image className="w-4 h-4" />
                    Mint NFT
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
