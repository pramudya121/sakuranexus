import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Activity, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';

interface AnalyticsData {
  date: string;
  sales: number;
  volume: number;
  mints: number;
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [activityBreakdown, setActivityBreakdown] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalVolume: '0',
    totalMints: 0,
    avgPrice: '0',
    totalOwners: 0,
    totalItems: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activities } = await supabase
      .from('activities')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    const { data: nfts } = await supabase.from('nfts').select('owner_address');

    if (activities) {
      const grouped = activities.reduce((acc: any, activity) => {
        const date = new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, sales: 0, volume: 0, mints: 0 };
        }
        if (activity.activity_type === 'sale') {
          acc[date].sales++;
          acc[date].volume += parseFloat(activity.price || '0');
        } else if (activity.activity_type === 'mint') {
          acc[date].mints++;
        }
        return acc;
      }, {});

      setAnalyticsData(Object.values(grouped));

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

      setStats({
        totalSales,
        totalVolume: totalVolume.toFixed(2),
        totalMints,
        avgPrice,
        totalOwners: uniqueOwners,
        totalItems: nfts?.length || 0,
      });
    }
  };

  const COLORS = ['hsl(328 85% 55%)', 'hsl(320 90% 60%)', 'hsl(340 100% 97%)', 'hsl(328 85% 70%)'];

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold gradient-text mb-4">Analytics Dashboard</h1>
          <p className="text-muted-foreground text-lg">Performance metrics and insights</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVolume}</div>
              <p className="text-xs text-muted-foreground">NEX</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Mints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMints}</div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                Avg Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgPrice}</div>
              <p className="text-xs text-muted-foreground">NEX</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOwners}</div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Sales Volume (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="volume" stroke="hsl(328 85% 55%)" strokeWidth={3} name="Volume (NEX)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Sales & Mints Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="sales" fill="hsl(328 85% 55%)" name="Sales" />
                  <Bar dataKey="mints" fill="hsl(320 90% 60%)" name="Mints" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {activityBreakdown.length > 0 && (
          <Card className="card-hover">
            <CardHeader>
              <CardTitle>Activity Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={activityBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(328 85% 55%)"
                    dataKey="value"
                  >
                    {activityBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Analytics;
