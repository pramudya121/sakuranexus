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
import { Skeleton } from '@/components/ui/skeleton';
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
  ExternalLink,
  RefreshCw,
  Zap,
  DollarSign,
  Percent,
  ArrowRightLeft,
  Image,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardData } from '@/hooks/useDashboardData';
import { getCurrentAccount } from '@/lib/web3/wallet';

const Dashboard = () => {
  const [walletAddress, setWalletAddress] = useState<string | undefined>();
  
  // Get wallet address on mount
  useEffect(() => {
    const fetchWallet = async () => {
      const account = await getCurrentAccount();
      setWalletAddress(account || undefined);
    };
    fetchWallet();

    // Listen for wallet changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setWalletAddress(accounts[0] || undefined);
      });
    }
  }, []);

  const {
    isLoading,
    isRefreshing,
    isConnected,
    portfolio,
    activities,
    stats,
    volumeChartData,
    marketData,
    refresh,
  } = useDashboardData(walletAddress);

  useEffect(() => {
    document.title = 'Dashboard - NEXUSAKURA';
  }, []);

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
      case 'mint': return <Zap className="w-4 h-4" />;
      case 'transfer': return <ArrowUpRight className="w-4 h-4" />;
      case 'offer': return <DollarSign className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getTradeLabel = (type: string) => {
    switch (type) {
      case 'swap': return 'Sale';
      case 'mint': return 'Mint';
      case 'transfer': return 'Transfer';
      case 'offer': return 'Offer';
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
              {walletAddress 
                ? `Portfolio & insights untuk ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'Hubungkan wallet untuk melihat portfolio Anda'
              }
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
              onClick={refresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* No Wallet Warning */}
        {!walletAddress && (
          <Card className="mb-6 border-orange-500/30 bg-orange-500/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Hubungkan wallet Anda untuk melihat data portfolio real-time
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">
                  7D
                </Badge>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-24 mt-3" />
              ) : (
                <p className="text-2xl font-bold mt-3">
                  {stats.totalVolume7d > 0 
                    ? `${stats.totalVolume7d.toFixed(2)} NEX`
                    : '$0.00'
                  }
                </p>
              )}
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
                  Total
                </Badge>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-3" />
              ) : (
                <p className="text-2xl font-bold mt-3">
                  {stats.totalTrades.toLocaleString()}
                </p>
              )}
              <p className="text-sm text-muted-foreground">Total Activities</p>
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
              <p className="text-2xl font-bold mt-3">{stats.stakingAPR}%</p>
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
              {isLoading ? (
                <Skeleton className="h-8 w-12 mt-3" />
              ) : (
                <p className="text-2xl font-bold mt-3">{stats.nftsOwned}</p>
              )}
              <p className="text-sm text-muted-foreground">NFTs Owned</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Portfolio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Overview */}
            {isLoading ? (
              <Card className="glass border-border/50 p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-3 w-full mb-4" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              </Card>
            ) : (
              <PortfolioOverview 
                tokenValue={portfolio.tokenValue} 
                lpValue={portfolio.lpValue} 
                stakingValue={portfolio.stakingValue} 
              />
            )}

            {/* Token Balances */}
            {walletAddress && portfolio.balances.length > 0 && (
              <Card className="glass border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="w-5 h-5 text-primary" />
                    Token Balances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolio.balances.map((token) => (
                      <div 
                        key={token.symbol}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-sm">
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium">{token.symbol}</p>
                            <p className="text-xs text-muted-foreground">{token.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {parseFloat(token.balance).toLocaleString(undefined, { 
                              maximumFractionDigits: 4 
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ≈ ${token.value.toLocaleString(undefined, { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Portfolio Performance Chart */}
            <PortfolioPerformance />

            {/* Volume Chart */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Trading Activity (7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeChartData}>
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
                        tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [
                          name === 'volume' ? `${value.toLocaleString()} NEX` : value,
                          name === 'volume' ? 'Volume' : 'Trades'
                        ]}
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
            {/* Recent Activities */}
            <Card className="glass border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                  <Link to="/activity">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      View All
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[320px]">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10 rounded-lg" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No recent activities</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {activities.slice(0, 8).map((activity) => (
                        <div 
                          key={activity.id}
                          className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              activity.type === 'swap' ? 'bg-primary/10 text-primary' :
                              activity.type === 'mint' ? 'bg-green-500/10 text-green-500' :
                              activity.type === 'offer' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-purple-500/10 text-purple-500'
                            }`}>
                              {getTradeIcon(activity.type)}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{getTradeLabel(activity.type)}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.price ? `${activity.price} NEX` : 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {activity.value > 0 ? `${activity.value.toFixed(2)} NEX` : '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatTime(activity.time)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                          ${token.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <div className={`flex items-center justify-end gap-1 text-sm ${
                          token.change >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {token.change >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span>{Math.abs(token.change).toFixed(1)}%</span>
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
