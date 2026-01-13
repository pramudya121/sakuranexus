import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import PoolCardEnhanced from '@/components/dex/PoolCardEnhanced';
import DEXNavigation from '@/components/dex/DEXNavigation';
import { PoolCardSkeleton } from '@/components/ui/loading-skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Plus, Waves, BarChart3, RefreshCw, 
  DollarSign, Star, LayoutGrid, List, Zap, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllPairs, getPoolInfo, PoolInfo } from '@/lib/web3/dex';
import { DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const Pools = memo(() => {
  const navigate = useNavigate();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [filteredPools, setFilteredPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('tvl');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    filterAndSortPools();
  }, [pools, search, sortBy, showFavorites]);

  const loadPools = useCallback(async (forceRefresh = false) => {
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
        // Demo pools with realistic data
        const dummyPools: PoolInfo[] = [
          {
            pairAddress: '0x0000000000000000000000000000000000000001',
            token0: DEFAULT_TOKENS.find(t => t.symbol === 'NEX') || DEFAULT_TOKENS[0],
            token1: DEFAULT_TOKENS.find(t => t.symbol === 'WETH') || DEFAULT_TOKENS[3],
            reserve0: '5150300.0000',
            reserve1: '136600544.0000',
            totalSupply: '7071.0678',
            tvl: 345025367.26,
            volume24h: 20488467.68,
            apr: 7.17,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000002',
            token0: DEFAULT_TOKENS.find(t => t.symbol === 'NXSA') || DEFAULT_TOKENS[2],
            token1: DEFAULT_TOKENS.find(t => t.symbol === 'WETH') || DEFAULT_TOKENS[3],
            reserve0: '93805.4366',
            reserve1: '115453.6661',
            totalSupply: '10.0000',
            tvl: 288878555.25,
            volume24h: 10648076.78,
            apr: 20.53,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000003',
            token0: DEFAULT_TOKENS.find(t => t.symbol === 'NXSA') || DEFAULT_TOKENS[2],
            token1: DEFAULT_TOKENS.find(t => t.symbol === 'NEX') || DEFAULT_TOKENS[0],
            reserve0: '114891.5551',
            reserve1: '113057.2188',
            totalSupply: '11180.0000',
            tvl: 85090793.45,
            volume24h: 8969772.00,
            apr: 14.89,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000004',
            token0: DEFAULT_TOKENS.find(t => t.symbol === 'WNEX') || DEFAULT_TOKENS[1],
            token1: DEFAULT_TOKENS.find(t => t.symbol === 'WETH') || DEFAULT_TOKENS[3],
            reserve0: '294.8148',
            reserve1: '7670.8886',
            totalSupply: '500.0000',
            tvl: 17853093.77,
            volume24h: 3276.97,
            apr: 18.40,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000005',
            token0: DEFAULT_TOKENS.find(t => t.symbol === 'WNEX') || DEFAULT_TOKENS[1],
            token1: DEFAULT_TOKENS.find(t => t.symbol === 'NEX') || DEFAULT_TOKENS[0],
            reserve0: '82.4520',
            reserve1: '1314.5736',
            totalSupply: '300.0000',
            tvl: 708294.6,
            volume24h: 100.15,
            apr: 0.84,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000006',
            token0: DEFAULT_TOKENS.find(t => t.symbol === 'NXSA') || DEFAULT_TOKENS[2],
            token1: DEFAULT_TOKENS.find(t => t.symbol === 'WNEX') || DEFAULT_TOKENS[1],
            reserve0: '3681.2157',
            reserve1: '368.561',
            totalSupply: '1000.0000',
            tvl: 3424.45,
            volume24h: 35.86,
            apr: 17.22,
          },
        ];
        setPools(dummyPools);
      } else {
        setPools(poolInfos);
      }
    } catch (error) {
      console.error('Error loading pools:', error);
    }
    
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  const handleRefresh = useCallback(() => {
    loadPools(true);
  }, [loadPools]);

  const filterAndSortPools = useCallback(() => {
    let filtered = [...pools];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (pool) =>
          pool.token0.symbol.toLowerCase().includes(searchLower) ||
          pool.token1.symbol.toLowerCase().includes(searchLower)
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
  }, [pools, search, sortBy, showFavorites]);

  const totalTVL = useMemo(() => pools.reduce((sum, p) => sum + p.tvl, 0), [pools]);
  const totalVolume = useMemo(() => pools.reduce((sum, p) => sum + p.volume24h, 0), [pools]);
  const avgAPR = useMemo(() => pools.length > 0 ? pools.reduce((sum, p) => sum + p.apr, 0) / pools.length : 0, [pools]);
  const nexPriceChange = 5.24; // NEX price change

  const formatLargeNumber = useCallback((num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <DEXNavigation />
        
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Liquidity Pools</span>
          </h1>
          <p className="text-muted-foreground">
            Explore and provide liquidity to earn trading fees
          </p>
        </div>

        {/* Top Stats Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <Waves className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Total Pools</span>
            <Badge variant="secondary" className="font-bold">{pools.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">Total TVL</span>
            <Badge variant="secondary" className="font-bold text-green-400">{formatLargeNumber(totalTVL)}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-muted-foreground">24h Volume</span>
            <Badge variant="secondary" className="font-bold">{formatLargeNumber(totalVolume)}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">NEX Price</span>
            <Badge variant="secondary" className={`font-bold ${nexPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {nexPriceChange >= 0 ? '+' : ''}{nexPriceChange}%
            </Badge>
          </div>
        </div>

        {/* Large Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Total Value Locked</div>
              <div className="text-3xl md:text-4xl font-bold text-green-400">{formatLargeNumber(totalTVL)}</div>
              <div className="text-xs text-muted-foreground mt-1">From all active reserves</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground mb-1">24h Volume</div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400">{formatLargeNumber(totalVolume)}</div>
              <div className="text-xs text-muted-foreground mt-1">Estimated from TVL</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Average APY</div>
              <div className="text-3xl md:text-4xl font-bold text-purple-400">{avgAPR.toFixed(2)}%</div>
              <div className="text-xs text-muted-foreground mt-1">Based on trading fees</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search pools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-lg border-border/50 bg-card/50 backdrop-blur-sm"
            />
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={showFavorites ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFavorites(!showFavorites)}
              className="h-10 gap-2"
            >
              <Star className={`w-4 h-4 ${showFavorites ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              Favorites
            </Button>
            
            <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as 'grid' | 'list')}>
              <ToggleGroupItem value="grid" size="sm" className="h-10">
                <LayoutGrid className="w-4 h-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" size="sm" className="h-10">
                <List className="w-4 h-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              variant={sortBy === 'tvl' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('tvl')}
              className="h-10"
            >
              <DollarSign className="w-4 h-4 mr-1" />
              TVL
            </Button>
            <Button
              variant={sortBy === 'volume' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('volume')}
              className="h-10"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Volume
            </Button>
            <Button
              variant={sortBy === 'apr' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('apr')}
              className="h-10"
            >
              <Zap className="w-4 h-4 mr-1" />
              APY
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-10 w-10"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              onClick={() => navigate('/dex/liquidity')}
              className="h-10 bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Pool
            </Button>
          </div>
        </div>

        {/* Pools Grid - Full Width */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PoolCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-20">
            <Waves className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Pools Found</h3>
            <p className="text-muted-foreground mb-6">
              {search ? 'Try a different search term' : 'Be the first to create a pool!'}
            </p>
            <Button
              onClick={() => navigate('/dex/liquidity')}
              className="bg-gradient-to-r from-primary to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Pool
            </Button>
          </div>
        ) : (
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredPools.map((pool) => (
              <PoolCardEnhanced key={pool.pairAddress} pool={pool} compact={viewMode === 'list'} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
});

Pools.displayName = 'Pools';

export default Pools;
