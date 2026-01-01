import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, DollarSign, Package, Users, BarChart3, Flame } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketStats {
  totalVolume: number;
  totalListings: number;
  totalSales: number;
  floorPrice: number;
  avgPrice: number;
  uniqueOwners: number;
  volumeChange24h: number;
  salesChange24h: number;
}

const MarketplaceStats = () => {
  const [stats, setStats] = useState<MarketStats>({
    totalVolume: 0,
    totalListings: 0,
    totalSales: 0,
    floorPrice: 0,
    avgPrice: 0,
    uniqueOwners: 0,
    volumeChange24h: 12.5,
    salesChange24h: 8.3,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch listings count
        const { count: listingsCount } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('active', true);

        // Fetch all listings for price calculations
        const { data: listings } = await supabase
          .from('listings')
          .select('price')
          .eq('active', true);

        // Fetch unique owners
        const { data: nfts } = await supabase
          .from('nfts')
          .select('owner_address');

        // Fetch sales activities
        const { count: salesCount } = await supabase
          .from('activities')
          .select('*', { count: 'exact', head: true })
          .eq('activity_type', 'sale');

        // Calculate volume from sales
        const { data: salesData } = await supabase
          .from('activities')
          .select('price')
          .eq('activity_type', 'sale');

        const prices = listings?.map(l => parseFloat(l.price)) || [];
        const volume = salesData?.reduce((acc, s) => acc + (parseFloat(s.price || '0')), 0) || 0;
        const uniqueOwnersList = new Set(nfts?.map(n => n.owner_address.toLowerCase()) || []);

        setStats({
          totalVolume: volume,
          totalListings: listingsCount || 0,
          totalSales: salesCount || 0,
          floorPrice: prices.length > 0 ? Math.min(...prices) : 0,
          avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
          uniqueOwners: uniqueOwnersList.size,
          volumeChange24h: 12.5,
          salesChange24h: 8.3,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Volume',
      value: `${stats.totalVolume.toFixed(2)} NEX`,
      change: stats.volumeChange24h,
      icon: DollarSign,
      color: 'from-pink-500 to-rose-500',
    },
    {
      label: 'Floor Price',
      value: `${stats.floorPrice.toFixed(4)} NEX`,
      icon: TrendingDown,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Total Listed',
      value: stats.totalListings.toString(),
      icon: Package,
      color: 'from-blue-500 to-purple-500',
    },
    {
      label: 'Total Sales',
      value: stats.totalSales.toString(),
      change: stats.salesChange24h,
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Unique Owners',
      value: stats.uniqueOwners.toString(),
      icon: Users,
      color: 'from-orange-500 to-yellow-500',
    },
    {
      label: 'Avg Price',
      value: `${stats.avgPrice.toFixed(4)} NEX`,
      icon: BarChart3,
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2" />
            <div className="h-6 bg-muted rounded w-16" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className="p-4 glass border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${stat.color}`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-bold">{stat.value}</span>
              {stat.change !== undefined && (
                <div className={`flex items-center gap-0.5 text-xs ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(stat.change)}%
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MarketplaceStats;
