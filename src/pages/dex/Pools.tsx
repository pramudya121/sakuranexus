import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import PoolCard from '@/components/dex/PoolCard';
import DEXNavigation from '@/components/dex/DEXNavigation';
import MyPositions from '@/components/dex/MyPositions';
import PoolFavorites from '@/components/dex/PoolFavorites';
import { PoolCardSkeleton } from '@/components/ui/loading-skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Waves, TrendingUp, BarChart3, RefreshCw, Droplets, Zap, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllPairs, getPoolInfo, PoolInfo } from '@/lib/web3/dex';
import { DEFAULT_TOKENS } from '@/lib/web3/dex-config';

const Pools = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [filteredPools, setFilteredPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('tvl');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    filterAndSortPools();
  }, [pools, search, sortBy]);

  const loadPools = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    
    try {
      const pairAddresses = await getAllPairs();
      const poolInfos: PoolInfo[] = [];
      
      for (const address of pairAddresses) {
        const info = await getPoolInfo(address);
        if (info) {
          poolInfos.push(info);
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (poolInfos.length === 0) {
        const demoPool1Token0 = DEFAULT_TOKENS.find(t => t.symbol === 'WNEX') || DEFAULT_TOKENS[1];
        const demoPool1Token1 = DEFAULT_TOKENS.find(t => t.symbol === 'NXSA') || DEFAULT_TOKENS[2];
        const demoPool2Token0 = DEFAULT_TOKENS.find(t => t.symbol === 'WNEX') || DEFAULT_TOKENS[1];
        const demoPool2Token1 = DEFAULT_TOKENS.find(t => t.symbol === 'WETH') || DEFAULT_TOKENS[3];
        const demoPool3Token0 = DEFAULT_TOKENS.find(t => t.symbol === 'NEX') || DEFAULT_TOKENS[0];
        const demoPool3Token1 = DEFAULT_TOKENS.find(t => t.symbol === 'USDC') || DEFAULT_TOKENS[5];
        
        const dummyPools: PoolInfo[] = [
          {
            pairAddress: '0x0000000000000000000000000000000000000001',
            token0: demoPool1Token0,
            token1: demoPool1Token1,
            reserve0: '1000.0000',
            reserve1: '50000.0000',
            totalSupply: '7071.0678',
            tvl: 102500,
            volume24h: 25600,
            apr: 45.2,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000002',
            token0: demoPool2Token0,
            token1: demoPool2Token1,
            reserve0: '500.0000',
            reserve1: '0.2000',
            totalSupply: '10.0000',
            tvl: 500625,
            volume24h: 125000,
            apr: 32.5,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000003',
            token0: demoPool3Token0,
            token1: demoPool3Token1,
            reserve0: '10000.0000',
            reserve1: '12500.0000',
            totalSupply: '11180.0000',
            tvl: 25000,
            volume24h: 5200,
            apr: 18.7,
          },
        ];
        setPools(dummyPools);
      } else {
        setPools(poolInfos);
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading pools:', error);
    }
    
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const handleRefresh = useCallback(() => {
    loadPools(true);
  }, []);

  const filterAndSortPools = useCallback(() => {
    let filtered = [...pools];

    if (search) {
      filtered = filtered.filter(
        (pool) =>
          pool.token0.symbol.toLowerCase().includes(search.toLowerCase()) ||
          pool.token1.symbol.toLowerCase().includes(search.toLowerCase()) ||
          pool.token0.name.toLowerCase().includes(search.toLowerCase()) ||
          pool.token1.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'tvl': return b.tvl - a.tvl;
        case 'volume': return b.volume24h - a.volume24h;
        case 'apr': return b.apr - a.apr;
        default: return 0;
      }
    });

    setFilteredPools(filtered);
  }, [pools, search, sortBy]);

  const totalTVL = useMemo(() => pools.reduce((sum, p) => sum + p.tvl, 0), [pools]);
  const totalVolume = useMemo(() => pools.reduce((sum, p) => sum + p.volume24h, 0), [pools]);
  const avgAPR = useMemo(() => pools.length > 0 ? pools.reduce((sum, p) => sum + p.apr, 0) / pools.length : 0, [pools]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const stats = [
    { icon: Waves, label: 'Total Pools', value: pools.length.toString(), color: 'text-primary' },
    { icon: DollarSign, label: 'Total TVL', value: formatNumber(totalTVL), color: 'text-blue-500' },
    { icon: BarChart3, label: '24h Volume', value: formatNumber(totalVolume), color: 'text-purple-500' },
    { icon: Zap, label: 'Avg APR', value: `${avgAPR.toFixed(1)}%`, color: 'text-green-500' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <DEXNavigation />
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6 animate-fade-in-up">
            <Waves className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Liquidity Pools</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up stagger-1">
            <span className="gradient-text">All Pools</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up stagger-2">
            Explore liquidity pools and earn trading fees by providing liquidity
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-10 animate-fade-in-up stagger-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass border-border/50 p-5 text-center hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
                <Icon className={`w-7 h-7 mx-auto mb-3 ${stat.color}`} />
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </Card>
            );
          })}
        </div>

        {/* My Positions & Favorites */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto mb-10">
          <MyPositions />
          <PoolFavorites />
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-5xl mx-auto animate-fade-in-up stagger-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search pools by token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 border-border/50 focus:border-primary/50 bg-card/50 backdrop-blur-sm"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tvl">TVL (High to Low)</SelectItem>
              <SelectItem value="volume">Volume (High to Low)</SelectItem>
              <SelectItem value="apr">APR (High to Low)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title={`Last refresh: ${lastRefresh.toLocaleTimeString()}`}
            className="h-12 w-12 rounded-xl border-2 border-border/50 hover:border-primary/50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => navigate('/dex/liquidity')}
            className="btn-hero h-12 px-6 rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Liquidity
          </Button>
        </div>

        {/* Pools Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3].map((i) => (
              <PoolCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
              <Waves className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">No Pools Found</h3>
            <p className="text-muted-foreground mb-6">
              {search ? 'Try a different search term' : 'Be the first to create a liquidity pool!'}
            </p>
            <Button
              onClick={() => navigate('/dex/liquidity')}
              className="btn-hero px-8 py-6 h-auto rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Pool
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredPools.map((pool) => (
              <PoolCard key={pool.pairAddress} pool={pool} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Pools;
