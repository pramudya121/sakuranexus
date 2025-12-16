import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Star, TrendingUp, RefreshCw, Trash2 } from 'lucide-react';
import { getPoolInfo, PoolInfo } from '@/lib/web3/dex';

const STORAGE_KEY = 'favorite_pools';

export const getFavoritePools = (): string[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addFavoritePool = (pairAddress: string) => {
  const favorites = getFavoritePools();
  if (!favorites.includes(pairAddress)) {
    favorites.push(pairAddress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }
};

export const removeFavoritePool = (pairAddress: string) => {
  const favorites = getFavoritePools();
  const filtered = favorites.filter(addr => addr !== pairAddress);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const isFavoritePool = (pairAddress: string): boolean => {
  return getFavoritePools().includes(pairAddress);
};

const PoolFavorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    const favoriteAddresses = getFavoritePools();
    const pools: PoolInfo[] = [];

    for (const address of favoriteAddresses) {
      try {
        const poolInfo = await getPoolInfo(address);
        pools.push(poolInfo);
      } catch (error) {
        console.error(`Error loading pool ${address}:`, error);
      }
    }

    setFavorites(pools);
    setIsLoading(false);
  };

  const handleRemove = (e: React.MouseEvent, pairAddress: string) => {
    e.stopPropagation();
    removeFavoritePool(pairAddress);
    setFavorites(favorites.filter(p => p.pairAddress !== pairAddress));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <Card className="glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            Favorite Pools
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          Favorite Pools
          <Badge variant="secondary">{favorites.length}</Badge>
        </h3>
        <Button variant="ghost" size="icon" onClick={loadFavorites}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Star className="w-12 h-12 mb-4 opacity-50" />
          <p className="mb-2">No favorite pools yet</p>
          <p className="text-sm">Star pools from the Pools page to add them here</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {favorites.map((pool, i) => (
            <div 
              key={i} 
              className="p-4 hover:bg-secondary/20 transition-colors cursor-pointer flex items-center justify-between"
              onClick={() => navigate(`/dex/pool/${pool.pairAddress}`)}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {pool.token0.logoURI ? (
                    <img src={pool.token0.logoURI} alt={pool.token0.symbol} className="w-8 h-8 rounded-full object-cover z-10 border-2 border-background" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-xs z-10 border-2 border-background">
                      {pool.token0.symbol.charAt(0)}
                    </div>
                  )}
                  {pool.token1.logoURI ? (
                    <img src={pool.token1.logoURI} alt={pool.token1.symbol} className="w-8 h-8 rounded-full object-cover border-2 border-background" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-xs border-2 border-background">
                      {pool.token1.symbol.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold">{pool.token0.symbol}/{pool.token1.symbol}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>TVL: {formatNumber(pool.tvl)}</span>
                    <span>•</span>
                    <span className="text-green-500">{pool.apr.toFixed(1)}% APR</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleRemove(e, pool.pairAddress)}
                className="hover:bg-destructive/20 hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default PoolFavorites;
