import { useState, useEffect, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, DollarSign, 
  Activity, Crown, Eye, Clock, RefreshCw, ChevronUp, ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';

// Mock data generators
const generateVolumeData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = subDays(now, i);
    data.push({
      date: format(date, 'MMM dd'),
      volume: Math.random() * 100 + 10,
      sales: Math.floor(Math.random() * 50) + 5,
    });
  }
  return data;
};

const generateFloorPriceData = (days: number) => {
  const data = [];
  const now = new Date();
  let price = 0.5;
  for (let i = days; i >= 0; i--) {
    const date = subDays(now, i);
    price += (Math.random() - 0.5) * 0.1;
    price = Math.max(0.1, price);
    data.push({
      date: format(date, 'MMM dd'),
      floor: parseFloat(price.toFixed(4)),
      avg: parseFloat((price * 1.5).toFixed(4)),
    });
  }
  return data;
};

const generateTopSellers = () => {
  const sellers = [];
  for (let i = 1; i <= 10; i++) {
    sellers.push({
      rank: i,
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      sales: Math.floor(Math.random() * 100) + 10,
      volume: parseFloat((Math.random() * 50 + 5).toFixed(2)),
      avgPrice: parseFloat((Math.random() * 2 + 0.1).toFixed(4)),
    });
  }
  return sellers.sort((a, b) => b.volume - a.volume);
};

const generateTopBuyers = () => {
  const buyers = [];
  for (let i = 1; i <= 10; i++) {
    buyers.push({
      rank: i,
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
      purchases: Math.floor(Math.random() * 80) + 5,
      volume: parseFloat((Math.random() * 40 + 3).toFixed(2)),
      avgPrice: parseFloat((Math.random() * 2 + 0.1).toFixed(4)),
    });
  }
  return buyers.sort((a, b) => b.volume - a.volume);
};

const generateCollectionStats = () => {
  return [
    { name: 'NEXUSAKURA', floor: 0.45, volume24h: 125.5, change: 12.5, items: 1000, owners: 450 },
    { name: 'SakuraSpirits', floor: 0.32, volume24h: 85.2, change: -5.3, items: 500, owners: 280 },
    { name: 'NexusPunks', floor: 0.89, volume24h: 210.8, change: 28.7, items: 10000, owners: 3200 },
    { name: 'CryptoBlossoms', floor: 0.15, volume24h: 45.3, change: 3.2, items: 2000, owners: 890 },
    { name: 'DigitalPetals', floor: 0.28, volume24h: 62.1, change: -2.1, items: 750, owners: 320 },
  ];
};

const NFTAnalytics = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalSales: 0,
    avgPrice: 0,
    uniqueTraders: 0,
    floorPrice: 0,
    volumeChange: 0,
  });

  const days = useMemo(() => {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 365;
    }
  }, [timeRange]);

  const volumeData = useMemo(() => generateVolumeData(days), [days, isRefreshing]);
  const floorPriceData = useMemo(() => generateFloorPriceData(days), [days, isRefreshing]);
  const topSellers = useMemo(() => generateTopSellers(), [isRefreshing]);
  const topBuyers = useMemo(() => generateTopBuyers(), [isRefreshing]);
  const collectionStats = useMemo(() => generateCollectionStats(), [isRefreshing]);

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from Supabase
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      const sales = activities?.filter(a => a.activity_type === 'sale') || [];
      const totalVolume = sales.reduce((sum, s) => sum + parseFloat(s.price || '0'), 0);
      const avgPrice = sales.length > 0 ? totalVolume / sales.length : 0;
      const uniqueTraders = new Set([
        ...sales.map(s => s.from_address),
        ...sales.map(s => s.to_address)
      ].filter(Boolean)).size;

      setStats({
        totalVolume: parseFloat(totalVolume.toFixed(2)) || 1250.5,
        totalSales: sales.length || 856,
        avgPrice: parseFloat(avgPrice.toFixed(4)) || 0.45,
        uniqueTraders: uniqueTraders || 324,
        floorPrice: 0.35,
        volumeChange: 15.5,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use mock data on error
      setStats({
        totalVolume: 1250.5,
        totalSales: 856,
        avgPrice: 0.45,
        uniqueTraders: 324,
        floorPrice: 0.35,
        volumeChange: 15.5,
      });
    }
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStats().then(() => setIsRefreshing(false));
  };

  const StatCard = ({ 
    title, value, icon: Icon, change, suffix = '' 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    change?: number;
    suffix?: string;
  }) => (
    <Card className="glass border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {value}{suffix}
              </p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
        {change !== undefined && !isLoading && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
            <span className="text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">NFT Analytics</span>
            </div>
            <h1 className="text-4xl font-bold">
              <span className="gradient-text">Market Analytics</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Track NFT market trends, volume, and top traders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="flex bg-secondary/50 rounded-lg p-1">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                  className="text-xs"
                >
                  {range === 'all' ? 'All Time' : range.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard 
            title="Total Volume" 
            value={stats.totalVolume} 
            icon={DollarSign} 
            suffix=" NEX"
            change={stats.volumeChange} 
          />
          <StatCard 
            title="Total Sales" 
            value={stats.totalSales} 
            icon={Activity} 
            change={8.2}
          />
          <StatCard 
            title="Floor Price" 
            value={stats.floorPrice} 
            icon={TrendingDown} 
            suffix=" NEX"
            change={-2.3}
          />
          <StatCard 
            title="Avg. Price" 
            value={stats.avgPrice} 
            icon={BarChart3} 
            suffix=" NEX"
            change={5.7}
          />
          <StatCard 
            title="Unique Traders" 
            value={stats.uniqueTraders} 
            icon={Users} 
            change={12.1}
          />
          <StatCard 
            title="24h Volume" 
            value="125.5" 
            icon={Clock} 
            suffix=" NEX"
            change={22.3}
          />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Volume Chart */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Trading Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="volume" 
                      name="Volume (NEX)"
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Floor Price Chart */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Floor Price History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={floorPriceData}>
                    <defs>
                      <linearGradient id="floorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="floor" 
                      name="Floor Price"
                      stroke="hsl(var(--primary))" 
                      fill="url(#floorGradient)"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg" 
                      name="Avg Price"
                      stroke="hsl(var(--chart-2))" 
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboards */}
        <Tabs defaultValue="sellers" className="mb-8">
          <TabsList className="glass">
            <TabsTrigger value="sellers" className="gap-2">
              <Crown className="w-4 h-4" />
              Top Sellers
            </TabsTrigger>
            <TabsTrigger value="buyers" className="gap-2">
              <Users className="w-4 h-4" />
              Top Buyers
            </TabsTrigger>
            <TabsTrigger value="collections" className="gap-2">
              <Eye className="w-4 h-4" />
              Top Collections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers">
            <Card className="glass border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 text-muted-foreground font-medium">Rank</th>
                        <th className="text-left p-4 text-muted-foreground font-medium">Seller</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Sales</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Volume</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topSellers.map((seller, idx) => (
                        <tr 
                          key={seller.address} 
                          className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="p-4">
                            {idx < 3 ? (
                              <Badge variant={idx === 0 ? 'default' : 'secondary'} className={
                                idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-600'
                              }>
                                #{idx + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-sm">{seller.address}</td>
                          <td className="p-4 text-right">{seller.sales}</td>
                          <td className="p-4 text-right font-semibold">{seller.volume} NEX</td>
                          <td className="p-4 text-right text-muted-foreground">{seller.avgPrice} NEX</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buyers">
            <Card className="glass border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 text-muted-foreground font-medium">Rank</th>
                        <th className="text-left p-4 text-muted-foreground font-medium">Buyer</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Purchases</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Volume</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topBuyers.map((buyer, idx) => (
                        <tr 
                          key={buyer.address} 
                          className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="p-4">
                            {idx < 3 ? (
                              <Badge variant={idx === 0 ? 'default' : 'secondary'} className={
                                idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-600'
                              }>
                                #{idx + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="p-4 font-mono text-sm">{buyer.address}</td>
                          <td className="p-4 text-right">{buyer.purchases}</td>
                          <td className="p-4 text-right font-semibold">{buyer.volume} NEX</td>
                          <td className="p-4 text-right text-muted-foreground">{buyer.avgPrice} NEX</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collections">
            <Card className="glass border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-4 text-muted-foreground font-medium">Collection</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Floor</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">24h Volume</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Change</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Items</th>
                        <th className="text-right p-4 text-muted-foreground font-medium">Owners</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collectionStats.map((collection) => (
                        <tr 
                          key={collection.name} 
                          className="border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer"
                        >
                          <td className="p-4 font-semibold">{collection.name}</td>
                          <td className="p-4 text-right">{collection.floor} NEX</td>
                          <td className="p-4 text-right font-semibold">{collection.volume24h} NEX</td>
                          <td className="p-4 text-right">
                            <span className={collection.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {collection.change >= 0 ? '+' : ''}{collection.change}%
                            </span>
                          </td>
                          <td className="p-4 text-right text-muted-foreground">{collection.items.toLocaleString()}</td>
                          <td className="p-4 text-right text-muted-foreground">{collection.owners.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default NFTAnalytics;
