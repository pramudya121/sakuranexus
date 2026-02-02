import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, Activity, DollarSign, Package, Users, ShoppingCart, 
  ArrowUp, ArrowDown, RefreshCw, BarChart3, PieChartIcon, LineChartIcon,
  Layers, Wallet, Clock
} from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';
import { GlowingStarsBackgroundCard, GlowingStarsTitle, GlowingStarsDescription } from '@/components/ui/glowing-stars';

interface AnalyticsData {
  date: string;
  sales: number;
  volume: number;
  mints: number;
  listings: number;
  avgPrice: number;
}

interface DEXData {
  date: string;
  swapVolume: number;
  liquidityAdded: number;
  trades: number;
  tvl: number;
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [dexData, setDexData] = useState<DEXData[]>([]);
  const [activityBreakdown, setActivityBreakdown] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalVolume: '0',
    totalMints: 0,
    avgPrice: '0',
    totalOwners: 0,
    totalItems: 0,
    volumeChange: 0,
    salesChange: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const getDaysFromRange = () => {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      default: return 30;
    }
  };

  const fetchAnalytics = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    const days = getDaysFromRange();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    const { data: nfts } = await supabase.from('nfts').select('owner_address');

    if (activities) {
      const grouped = activities.reduce((acc: any, activity) => {
        const date = new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, sales: 0, volume: 0, mints: 0, listings: 0, avgPrice: 0, priceSum: 0 };
        }
        if (activity.activity_type === 'sale') {
          acc[date].sales++;
          acc[date].volume += parseFloat(activity.price || '0');
          acc[date].priceSum += parseFloat(activity.price || '0');
        } else if (activity.activity_type === 'mint') {
          acc[date].mints++;
        } else if (activity.activity_type === 'listing') {
          acc[date].listings++;
        }
        return acc;
      }, {});

      const processedData = Object.values(grouped).map((d: any) => ({
        ...d,
        avgPrice: d.sales > 0 ? d.priceSum / d.sales : 0,
      }));
      
      setAnalyticsData(processedData as AnalyticsData[]);

      const breakdown = activities.reduce((acc: any, activity) => {
        const type = activity.activity_type;
        if (!acc[type]) acc[type] = 0;
        acc[type]++;
        return acc;
      }, {});

      setActivityBreakdown(Object.entries(breakdown).map(([name, value]) => ({ name, value })));

      const totalSales = activities.filter((a) => a.activity_type === 'sale').length;
      const totalVolume = activities.filter((a) => a.activity_type === 'sale').reduce((sum, a) => sum + parseFloat(a.price || '0'), 0);
      const totalMints = activities.filter((a) => a.activity_type === 'mint').length;
      const avgPrice = totalSales > 0 ? (totalVolume / totalSales).toFixed(2) : '0';
      const uniqueOwners = new Set(nfts?.map(n => n.owner_address.toLowerCase())).size;

      // Calculate changes (mock for now)
      const volumeChange = Math.random() * 40 - 20;
      const salesChange = Math.random() * 30 - 15;

      setStats({
        totalSales,
        totalVolume: totalVolume.toFixed(2),
        totalMints,
        avgPrice,
        totalOwners: uniqueOwners,
        totalItems: nfts?.length || 0,
        volumeChange,
        salesChange,
      });
    }

    // Generate DEX mock data
    generateDEXData(days);

    setIsLoading(false);
    setIsRefreshing(false);
  };

  const generateDEXData = (days: number) => {
    const data: DEXData[] = [];
    let tvl = 50000;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      tvl += (Math.random() - 0.4) * 5000;
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        swapVolume: Math.floor(Math.random() * 10000) + 1000,
        liquidityAdded: Math.floor(Math.random() * 5000) + 500,
        trades: Math.floor(Math.random() * 50) + 10,
        tvl: Math.max(30000, tvl),
      });
    }
    setDexData(data);
  };

  const COLORS = [
    'hsl(328, 85%, 55%)', 
    'hsl(260, 70%, 60%)', 
    'hsl(200, 80%, 55%)', 
    'hsl(140, 60%, 50%)',
    'hsl(40, 90%, 55%)'
  ];

  // Enhanced StatCard with BorderBeam effect
  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    suffix = '',
    showBeam = false
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    change?: number;
    suffix?: string;
    showBeam?: boolean;
  }) => (
    <Card className="relative overflow-hidden group hover:shadow-elegant transition-all duration-300 border-border/50">
      {showBeam && <BorderBeam size={100} duration={12} delay={0} />}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-2xl font-bold">
              {typeof value === 'number' ? (
                <NumberTicker value={value} duration={1500} />
              ) : (
                value
              )}
              {suffix}
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section with Glowing Stars */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <BarChart3 className="w-4 h-4" />
            ANALYTICS
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Platform Analytics</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Comprehensive insights for NFT marketplace and DEX performance
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="rounded-md"
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid with BorderBeam */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={ShoppingCart} title="Sales" value={stats.totalSales} change={stats.salesChange} showBeam />
          <StatCard icon={TrendingUp} title="Volume" value={stats.totalVolume} suffix=" NEX" change={stats.volumeChange} showBeam />
          <StatCard icon={Package} title="Mints" value={stats.totalMints} showBeam />
          <StatCard icon={DollarSign} title="Avg Price" value={stats.avgPrice} suffix=" NEX" />
          <StatCard icon={Users} title="Owners" value={stats.totalOwners} />
          <StatCard icon={Activity} title="Items" value={stats.totalItems} />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="nft" className="space-y-6">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2">
            <TabsTrigger value="nft" className="gap-2">
              <Layers className="w-4 h-4" />
              NFT Marketplace
            </TabsTrigger>
            <TabsTrigger value="dex" className="gap-2">
              <Wallet className="w-4 h-4" />
              DEX
            </TabsTrigger>
          </TabsList>

          {/* NFT Tab */}
          <TabsContent value="nft" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Volume Area Chart */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="w-5 h-5 text-primary" />
                    Sales Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData}>
                      <defs>
                        <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(328, 85%, 55%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(328, 85%, 55%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="hsl(328, 85%, 55%)" 
                        strokeWidth={2}
                        fill="url(#volumeGradient)" 
                        name="Volume (NEX)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sales & Mints Composed Chart */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Sales & Mints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="sales" fill="hsl(328, 85%, 55%)" name="Sales" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="mints" fill="hsl(260, 70%, 60%)" name="Mints" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="avgPrice" stroke="hsl(140, 60%, 50%)" strokeWidth={2} name="Avg Price" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Activity Breakdown */}
            {activityBreakdown.length > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Activity Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={activityBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {activityBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {activityBreakdown.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium capitalize">{entry.name}</span>
                          </div>
                          <span className="text-lg font-bold">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DEX Tab */}
          <TabsContent value="dex" className="space-y-6">
            {/* DEX Stats with GlowingStars */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <GlowingStarsBackgroundCard className="p-4">
                <div className="relative z-20">
                  <div className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Swap Volume
                  </div>
                  <div className="text-2xl font-bold">
                    <NumberTicker value={dexData.reduce((sum, d) => sum + d.swapVolume, 0)} duration={2000} />
                    <span className="text-sm text-muted-foreground ml-1">NEX</span>
                  </div>
                </div>
              </GlowingStarsBackgroundCard>
              
              <GlowingStarsBackgroundCard className="p-4">
                <div className="relative z-20">
                  <div className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Total Trades
                  </div>
                  <div className="text-2xl font-bold">
                    <NumberTicker value={dexData.reduce((sum, d) => sum + d.trades, 0)} duration={2000} />
                  </div>
                </div>
              </GlowingStarsBackgroundCard>
              
              <GlowingStarsBackgroundCard className="p-4">
                <div className="relative z-20">
                  <div className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Liquidity Added
                  </div>
                  <div className="text-2xl font-bold">
                    <NumberTicker value={dexData.reduce((sum, d) => sum + d.liquidityAdded, 0)} duration={2000} />
                    <span className="text-sm text-muted-foreground ml-1">NEX</span>
                  </div>
                </div>
              </GlowingStarsBackgroundCard>
              
              <GlowingStarsBackgroundCard className="p-4">
                <div className="relative z-20">
                  <div className="text-xs text-muted-foreground uppercase mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Current TVL
                  </div>
                  <div className="text-2xl font-bold">
                    <NumberTicker value={dexData[dexData.length - 1]?.tvl || 0} duration={2000} />
                    <span className="text-sm text-muted-foreground ml-1">NEX</span>
                  </div>
                </div>
              </GlowingStarsBackgroundCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TVL Chart */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Total Value Locked (TVL)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dexData}>
                      <defs>
                        <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(160, 70%, 45%)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="tvl" 
                        stroke="hsl(160, 70%, 45%)" 
                        strokeWidth={2}
                        fill="url(#tvlGradient)" 
                        name="TVL (NEX)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Volume Chart */}
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Swap Volume & Trades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={dexData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="swapVolume" fill="hsl(328, 85%, 55%)" name="Volume" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="trades" stroke="hsl(200, 80%, 55%)" strokeWidth={2} name="Trades" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
