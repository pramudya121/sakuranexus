import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3, 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Percent,
  Target,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import PortfolioPerformance from './PortfolioPerformance';
import TaxReportExport from './TaxReportExport';

interface PortfolioAnalyticsProps {
  walletAddress: string;
}

// Generate deterministic mock data
const generateHistoricalPnL = (days: number) => {
  const data = [];
  let cumulative = 0;
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  
  for (let i = days; i >= 0; i--) {
    const dailyPnL = (Math.random() - 0.45) * 200;
    cumulative += dailyPnL;
    
    data.push({
      date: new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      daily: parseFloat(dailyPnL.toFixed(2)),
      cumulative: parseFloat(cumulative.toFixed(2)),
    });
  }
  
  return data;
};

const PortfolioAnalytics = ({ walletAddress }: PortfolioAnalyticsProps) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  const pnlData = useMemo(() => {
    const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }[timeframe];
    return generateHistoricalPnL(days);
  }, [timeframe]);
  
  // Portfolio allocation mock data
  const allocationData = [
    { name: 'NEX', value: 35, color: 'hsl(var(--primary))' },
    { name: 'NXSA', value: 25, color: 'hsl(320, 70%, 60%)' },
    { name: 'WETH', value: 20, color: 'hsl(210, 70%, 60%)' },
    { name: 'LP Positions', value: 12, color: 'hsl(150, 60%, 50%)' },
    { name: 'Staking', value: 8, color: 'hsl(45, 80%, 55%)' },
  ];
  
  // Monthly returns mock data
  const monthlyReturns = [
    { month: 'Jul', return: 5.2 },
    { month: 'Aug', return: -2.1 },
    { month: 'Sep', return: 8.5 },
    { month: 'Oct', return: 3.2 },
    { month: 'Nov', return: -1.5 },
    { month: 'Dec', return: 12.3 },
    { month: 'Jan', return: 4.8 },
  ];
  
  // Summary metrics
  const metrics = {
    totalValue: 15420.50,
    totalPnL: 2340.75,
    pnlPercent: 17.9,
    bestPerformer: { symbol: 'NXSA', gain: 45.2 },
    worstPerformer: { symbol: 'BNB', loss: -8.5 },
    avgDailyPnL: 28.5,
    winRate: 62,
    maxDrawdown: -15.2,
    sharpeRatio: 1.45,
  };

  const lastPnL = pnlData[pnlData.length - 1]?.cumulative || 0;
  const isProfit = lastPnL >= 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total P&L</span>
            </div>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? '+' : ''}${metrics.totalPnL.toLocaleString()}
            </p>
            <div className={`flex items-center gap-1 text-sm ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
              {isProfit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{metrics.pnlPercent}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Win Rate</span>
            </div>
            <p className="text-2xl font-bold">{metrics.winRate}%</p>
            <p className="text-sm text-muted-foreground">Profitable trades</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
            </div>
            <p className="text-2xl font-bold">{metrics.sharpeRatio}</p>
            <p className="text-sm text-muted-foreground">Risk-adjusted return</p>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{metrics.maxDrawdown}%</p>
            <p className="text-sm text-muted-foreground">Peak to trough</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="pnl" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">P&L</span>
          </TabsTrigger>
          <TabsTrigger value="allocation" className="gap-2">
            <PieChart className="w-4 h-4" />
            <span className="hidden sm:inline">Allocation</span>
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-2">
            <Percent className="w-4 h-4" />
            <span className="hidden sm:inline">Tax Report</span>
          </TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <PortfolioPerformance />
        </TabsContent>

        {/* P&L Tab */}
        <TabsContent value="pnl" className="space-y-4">
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Profit & Loss History
                </CardTitle>
                <div className="flex gap-1">
                  {(['7d', '30d', '90d', '1y'] as const).map((tf) => (
                    <Button
                      key={tf}
                      variant={timeframe === tf ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTimeframe(tf)}
                      className="h-7 px-2 text-xs"
                    >
                      {tf.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pnlData}>
                    <defs>
                      <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isProfit ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isProfit ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cumulative P&L']}
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulative"
                      stroke={isProfit ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'}
                      strokeWidth={2}
                      fill="url(#pnlGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Monthly Returns */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Monthly Returns</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyReturns}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Return']}
                      />
                      <Bar 
                        dataKey="return" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best/Worst Performers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass border-border/50 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Best Performer</p>
                    <p className="text-2xl font-bold">{metrics.bestPerformer.symbol}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +{metrics.bestPerformer.gain}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border/50 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Worst Performer</p>
                    <p className="text-2xl font-bold">{metrics.worstPerformer.symbol}</p>
                  </div>
                  <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                    <ArrowDownRight className="w-3 h-3 mr-1" />
                    {metrics.worstPerformer.loss}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation">
          <Card className="glass border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Portfolio Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Pie Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Allocation']}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-3">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diversification Score */}
              <div className="mt-6 p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Diversification Score</span>
                  <Badge variant="outline">Good</Badge>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                    style={{ width: '72%' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your portfolio is well-diversified across different asset types.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Report Tab */}
        <TabsContent value="tax">
          <TaxReportExport walletAddress={walletAddress} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioAnalytics;
