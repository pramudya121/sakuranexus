import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getTokenBalance } from '@/lib/web3/dex';
import { DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { useMultipleTokenPrices } from '@/hooks/usePriceWebSocket';

interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  value: number;
  price: number;
}

interface RecentActivity {
  id: string;
  type: string;
  tokenA?: string;
  tokenB?: string;
  amount?: string;
  price?: string;
  value: number;
  time: Date;
  txHash?: string;
  from?: string;
  to?: string;
}

interface DashboardStats {
  totalVolume7d: number;
  totalTrades: number;
  nftsOwned: number;
  stakingAPR: number;
}

interface PortfolioData {
  tokenValue: number;
  lpValue: number;
  stakingValue: number;
  balances: TokenBalance[];
}

export const useDashboardData = (walletAddress?: string) => {
  const { prices, isConnected } = useMultipleTokenPrices();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioData>({
    tokenValue: 0,
    lpValue: 0,
    stakingValue: 0,
    balances: [],
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalVolume7d: 0,
    totalTrades: 0,
    nftsOwned: 0,
    stakingAPR: 24.5,
  });

  // Fetch token balances from blockchain
  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;

    const tokens = [
      { ...DEFAULT_TOKENS[0], symbol: 'NEX', name: 'Nexus' }, // Native
      { ...DEFAULT_TOKENS[1], symbol: 'WNEX', name: 'Wrapped Nexus' },
      { ...DEFAULT_TOKENS[2], symbol: 'NXSA', name: 'NEXUSAKURA' },
      { ...DEFAULT_TOKENS[3], symbol: 'WETH', name: 'Wrapped ETH' },
    ];

    const balancePromises = tokens.map(async (token) => {
      try {
        const balance = await getTokenBalance(token.address, walletAddress);
        const priceData = prices.get(token.symbol);
        const price = priceData?.price || getMockPrice(token.symbol);
        const value = parseFloat(balance) * price;

        return {
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          balance,
          value,
          price,
        };
      } catch {
        return {
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          balance: '0',
          value: 0,
          price: 0,
        };
      }
    });

    const balances = await Promise.all(balancePromises);
    const tokenValue = balances.reduce((sum, b) => sum + b.value, 0);

    // Mock LP and staking values for now (would come from contract calls)
    const lpValue = tokenValue * 0.3; // Simulated 30% in LP
    const stakingValue = tokenValue * 0.2; // Simulated 20% in staking

    setPortfolio({
      tokenValue,
      lpValue,
      stakingValue,
      balances,
    });
  }, [walletAddress, prices]);

  // Fetch activities from Supabase
  const fetchActivities = useCallback(async () => {
    if (!walletAddress) {
      // Fetch general activities if no wallet
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        const mapped = data.map((activity) => ({
          id: activity.id,
          type: mapActivityType(activity.activity_type),
          amount: activity.price,
          price: activity.price,
          value: parseFloat(activity.price || '0'),
          time: new Date(activity.created_at),
          txHash: activity.transaction_hash || undefined,
          from: activity.from_address || undefined,
          to: activity.to_address || undefined,
        }));
        setActivities(mapped);
      }
      return;
    }

    // Fetch user-specific activities
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .or(`from_address.ilike.${walletAddress},to_address.ilike.${walletAddress}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      const mapped = data.map((activity) => ({
        id: activity.id,
        type: mapActivityType(activity.activity_type),
        amount: activity.price,
        price: activity.price,
        value: parseFloat(activity.price || '0'),
        time: new Date(activity.created_at),
        txHash: activity.transaction_hash || undefined,
        from: activity.from_address || undefined,
        to: activity.to_address || undefined,
      }));
      setActivities(mapped);
    }
  }, [walletAddress]);

  // Fetch stats from Supabase
  const fetchStats = useCallback(async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get 7-day volume from activities
    const { data: volumeData, error: volumeError } = await supabase
      .from('activities')
      .select('price')
      .gte('created_at', sevenDaysAgo.toISOString())
      .in('activity_type', ['sale', 'mint']);

    const totalVolume7d = volumeData?.reduce((sum, a) => {
      return sum + parseFloat(a.price || '0');
    }, 0) || 0;

    // Get total trades count
    const { count: tradesCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true });

    // Get user's NFT count if wallet connected
    let nftsOwned = 0;
    if (walletAddress) {
      const { count: nftCount } = await supabase
        .from('nfts')
        .select('*', { count: 'exact', head: true })
        .ilike('owner_address', walletAddress);
      nftsOwned = nftCount || 0;
    }

    setStats({
      totalVolume7d,
      totalTrades: tradesCount || 0,
      nftsOwned,
      stakingAPR: 24.5, // Mock APR
    });
  }, [walletAddress]);

  // Calculate volume data for chart from real activities
  const volumeChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Filter activities for this day
      const dayActivities = activities.filter((a) => {
        const activityDate = new Date(a.time);
        return activityDate >= date && activityDate < nextDate;
      });

      const volume = dayActivities.reduce((sum, a) => sum + a.value, 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        volume: volume || Math.floor(Math.random() * 50000) + 10000, // Fallback to mock if no data
        trades: dayActivities.length || Math.floor(Math.random() * 50) + 10,
      });
    }
    return data;
  }, [activities]);

  // Market data from real-time prices
  const marketData = useMemo(() => {
    const tokens = ['NEX', 'NXSA', 'WETH', 'BNB', 'USDC'];
    return tokens.map((symbol) => {
      const priceData = prices.get(symbol);
      return {
        name: symbol,
        price: priceData?.price || getMockPrice(symbol),
        change: priceData?.change24h || (Math.random() - 0.5) * 10,
        volume: formatVolume(Math.random() * 5000000),
        trending: Math.random() > 0.5,
      };
    });
  }, [prices]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchBalances(),
        fetchActivities(),
        fetchStats(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchBalances, fetchActivities, fetchStats]);

  // Real-time subscription to activities
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        (payload) => {
          const newActivity = payload.new as any;
          setActivities((prev) => [{
            id: newActivity.id,
            type: mapActivityType(newActivity.activity_type),
            amount: newActivity.price,
            price: newActivity.price,
            value: parseFloat(newActivity.price || '0'),
            time: new Date(newActivity.created_at),
            txHash: newActivity.transaction_hash || undefined,
            from: newActivity.from_address || undefined,
            to: newActivity.to_address || undefined,
          }, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Refresh function
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchBalances(),
      fetchActivities(),
      fetchStats(),
    ]);
    setIsRefreshing(false);
  }, [fetchBalances, fetchActivities, fetchStats]);

  return {
    isLoading,
    isRefreshing,
    isConnected,
    portfolio,
    activities,
    stats,
    volumeChartData,
    marketData,
    refresh,
  };
};

// Helper functions
function mapActivityType(type: string): string {
  switch (type?.toLowerCase()) {
    case 'sale':
      return 'swap';
    case 'mint':
      return 'mint';
    case 'transfer':
      return 'transfer';
    case 'offer':
      return 'offer';
    default:
      return type || 'unknown';
  }
}

function getMockPrice(symbol: string): number {
  const mockPrices: Record<string, number> = {
    NEX: 1.25,
    WNEX: 1.25,
    NXSA: 0.85,
    WETH: 2450,
    BNB: 320.5,
    USDC: 1.0,
  };
  return mockPrices[symbol] || 1;
}

function formatVolume(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}
