import { useState, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PoolInfo } from '@/lib/web3/dex';
import { TrendingUp, TrendingDown, Droplets, Star, Info } from 'lucide-react';
import { isFavoritePool, addFavoritePool, removeFavoritePool } from './PoolFavorites';
import { BackgroundGradient } from '@/components/ui/background-gradient';

interface PoolCardProps {
  pool: PoolInfo;
  compact?: boolean;
}

const PoolCardEnhanced = memo(({ pool, compact = false }: PoolCardProps) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(isFavoritePool(pool.pairAddress));
  }, [pool.pairAddress]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pool.pairAddress.startsWith('0x000000')) return;
    if (isFavorite) {
      removeFavoritePool(pool.pairAddress);
    } else {
      addFavoritePool(pool.pairAddress);
    }
    setIsFavorite(!isFavorite);
  };
  
  // Calculate mock price change
  const priceChange = ((pool.apr / 10) - 2 + Math.random() * 4);
  const isPositive = priceChange >= 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatReserve = (reserve: string) => {
    const num = parseFloat(reserve);
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(4);
  };

  // Mock 24h fees (0.3% of volume)
  const fees24h = pool.volume24h * 0.003;

  const cardContent = (
    <CardContent className="p-4">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Token Pair Icons */}
          <div className="flex -space-x-2">
            {pool.token0.logoURI ? (
              <img 
                src={pool.token0.logoURI} 
                alt={pool.token0.symbol}
                className="w-10 h-10 rounded-full ring-2 ring-background z-10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm z-10 ring-2 ring-background">
                {pool.token0.symbol.charAt(0)}
              </div>
            )}
            {pool.token1.logoURI ? (
              <img 
                src={pool.token1.logoURI} 
                alt={pool.token1.symbol}
                className="w-10 h-10 rounded-full ring-2 ring-background"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-background">
                {pool.token1.symbol.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base">{pool.token0.symbol}/{pool.token1.symbol}</h3>
              {/* Favorite Button */}
              {!pool.pairAddress.startsWith('0x000000') && (
                <button onClick={toggleFavorite} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/30">
                Fee: 0.3%
              </Badge>
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-500/20 text-green-400 border-0">
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* APR Badge */}
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase">APY</div>
          <div className="text-lg font-bold text-green-400">{pool.apr.toFixed(2)}%</div>
        </div>
      </div>

      {/* TVL with Change */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
        <div>
          <div className="text-xs text-muted-foreground">TVL</div>
          <div className="text-xl font-bold">{formatNumber(pool.tvl)}</div>
        </div>
        <Badge 
          variant="secondary"
          className={`text-xs ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
        >
          {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
        </Badge>
      </div>

      {/* Token Balances */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2">
            {pool.token0.logoURI ? (
              <img src={pool.token0.logoURI} className="w-5 h-5 rounded-full" alt="" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
            )}
            <span className="text-muted-foreground">{pool.token0.symbol}</span>
          </div>
          <span className="font-mono font-medium">{formatReserve(pool.reserve0)}</span>
        </div>
        <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/20">
          <div className="flex items-center gap-2">
            {pool.token1.logoURI ? (
              <img src={pool.token1.logoURI} className="w-5 h-5 rounded-full" alt="" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500" />
            )}
            <span className="text-muted-foreground">{pool.token1.symbol}</span>
          </div>
          <span className="font-mono font-medium">{formatReserve(pool.reserve1)}</span>
        </div>
      </div>

      {/* Volume and Fees Row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/20">
          <div className="text-[10px] text-muted-foreground uppercase">24h Volume</div>
          <div className="font-bold text-sm">{formatNumber(pool.volume24h)}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/20">
          <div className="text-[10px] text-muted-foreground uppercase">24h Fees</div>
          <div className="font-bold text-sm text-green-400">{formatNumber(fees24h)}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/dex/pool/${pool.pairAddress}`)}
          className="flex-1 h-9 rounded-lg text-xs border-border/50 hover:bg-muted/50"
        >
          <Info className="w-3.5 h-3.5 mr-1.5" />
          Details
        </Button>
        <Button
          size="sm"
          onClick={() => navigate('/dex/liquidity')}
          className="flex-1 h-9 rounded-lg text-xs bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-600/90"
        >
          <Droplets className="w-3.5 h-3.5 mr-1.5" />
          Add Liquidity
        </Button>
      </div>
    </CardContent>
  );

  // Use BackgroundGradient for premium effect
  return (
    <BackgroundGradient 
      className="rounded-2xl p-0 group"
      containerClassName="rounded-2xl"
      animate={false}
    >
      <Card className="border-0 bg-card/95 backdrop-blur-sm rounded-[calc(1rem-2px)] overflow-hidden">
        {cardContent}
      </Card>
    </BackgroundGradient>
  );
});

PoolCardEnhanced.displayName = 'PoolCardEnhanced';

export default PoolCardEnhanced;
