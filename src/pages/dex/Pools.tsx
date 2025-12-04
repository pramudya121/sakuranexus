import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import PoolCard from '@/components/dex/PoolCard';
import DEXNavigation from '@/components/dex/DEXNavigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Loader2, Waves, TrendingUp, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllPairs, getPoolInfo, PoolInfo } from '@/lib/web3/dex';
import { DEFAULT_TOKENS } from '@/lib/web3/dex-config';

const Pools = () => {
  const navigate = useNavigate();
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [filteredPools, setFilteredPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('tvl');

  useEffect(() => {
    loadPools();
  }, []);

  useEffect(() => {
    filterAndSortPools();
  }, [pools, search, sortBy]);

  const loadPools = async () => {
    setIsLoading(true);
    try {
      const pairAddresses = await getAllPairs();
      const poolInfos: PoolInfo[] = [];
      
      for (const address of pairAddresses) {
        const info = await getPoolInfo(address);
        if (info) {
          poolInfos.push(info);
        }
      }

      // If no pools from blockchain, show dummy pools for demo
      if (poolInfos.length === 0) {
        // Create dummy pools for display
        const dummyPools: PoolInfo[] = [
          {
            pairAddress: '0x0000000000000000000000000000000000000001',
            token0: DEFAULT_TOKENS[0],
            token1: DEFAULT_TOKENS[2],
            reserve0: '1000',
            reserve1: '50000',
            totalSupply: '7071',
            tvl: 100000,
            volume24h: 25000,
            apr: 45.2,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000002',
            token0: DEFAULT_TOKENS[1],
            token1: DEFAULT_TOKENS[2],
            reserve0: '500',
            reserve1: '25000',
            totalSupply: '3535',
            tvl: 50000,
            volume24h: 12500,
            apr: 32.5,
          },
          {
            pairAddress: '0x0000000000000000000000000000000000000003',
            token0: DEFAULT_TOKENS[0],
            token1: DEFAULT_TOKENS[3],
            reserve0: '200',
            reserve1: '200',
            totalSupply: '200',
            tvl: 20000,
            volume24h: 5000,
            apr: 18.7,
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
  };

  const filterAndSortPools = () => {
    let filtered = [...pools];

    // Filter by search
    if (search) {
      filtered = filtered.filter(
        (pool) =>
          pool.token0.symbol.toLowerCase().includes(search.toLowerCase()) ||
          pool.token1.symbol.toLowerCase().includes(search.toLowerCase()) ||
          pool.token0.name.toLowerCase().includes(search.toLowerCase()) ||
          pool.token1.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'tvl':
          return b.tvl - a.tvl;
        case 'volume':
          return b.volume24h - a.volume24h;
        case 'apr':
          return b.apr - a.apr;
        default:
          return 0;
      }
    });

    setFilteredPools(filtered);
  };

  // Stats summary
  const totalTVL = pools.reduce((sum, p) => sum + p.tvl, 0);
  const totalVolume = pools.reduce((sum, p) => sum + p.volume24h, 0);
  const avgAPR = pools.length > 0 ? pools.reduce((sum, p) => sum + p.apr, 0) / pools.length : 0;

  return (
    <div className="min-h-screen bg-background relative">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* DEX Navigation */}
        <DEXNavigation />
        
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Waves className="w-4 h-4" />
            <span className="text-sm font-medium">Liquidity Pools</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">All Pools</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explore all available liquidity pools. Add liquidity to earn trading fees.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <Waves className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Total TVL</p>
            <p className="text-2xl font-bold">${totalTVL.toLocaleString()}</p>
          </div>
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">24h Volume</p>
            <p className="text-2xl font-bold">${totalVolume.toLocaleString()}</p>
          </div>
          <div className="glass rounded-xl p-4 text-center border border-border/50">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Average APR</p>
            <p className="text-2xl font-bold text-green-500">{avgAPR.toFixed(1)}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search pools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/50 border-border/50"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[180px] bg-secondary/50 border-border/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tvl">TVL (High to Low)</SelectItem>
              <SelectItem value="volume">Volume (High to Low)</SelectItem>
              <SelectItem value="apr">APR (High to Low)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => navigate('/dex/liquidity')}
            className="bg-gradient-sakura hover:shadow-sakura"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Liquidity
          </Button>
        </div>

        {/* Pools Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="text-center py-20">
            <Waves className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Pools Found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try a different search term' : 'Be the first to create a liquidity pool!'}
            </p>
            <Button
              onClick={() => navigate('/dex/liquidity')}
              className="bg-gradient-sakura hover:shadow-sakura"
            >
              <Plus className="w-4 h-4 mr-2" />
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
