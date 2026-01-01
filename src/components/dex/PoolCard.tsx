import { useState, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PoolInfo } from '@/lib/web3/dex';
import { TrendingUp, TrendingDown, Droplets, BarChart3, Star, ExternalLink, Zap } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { isFavoritePool, addFavoritePool, removeFavoritePool } from './PoolFavorites';

interface PoolCardProps {
  pool: PoolInfo;
}

// Generate mock price history data for chart
const generateMockPriceHistory = (basePrice: number, seed: number) => {
  const data = [];
  let price = basePrice;
  for (let i = 0; i < 24; i++) {
    // Use seed for consistent randomness
    const random = Math.sin(seed + i) * 0.5 + 0.5;
    price = price * (0.97 + random * 0.06);
    data.push({
      time: i,
      price: price,
    });
  }
  return data;
};

const PoolCard = memo(({ pool }: PoolCardProps) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
  
  // Generate consistent mock price history
  const basePrice = pool.reserve1 && pool.reserve0 ? 
    parseFloat(pool.reserve1) / parseFloat(pool.reserve0) : 1;
  const seed = pool.pairAddress.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const priceHistory = generateMockPriceHistory(basePrice, seed);
  
  const priceChange = ((priceHistory[23].price - priceHistory[0].price) / priceHistory[0].price) * 100;
  const isPositive = priceChange >= 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <Card 
      className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:-translate-y-2 hover:shadow-elegant ${isHovered ? 'border-primary/40' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative p-5">
        {/* Favorite Button */}
        {!pool.pairAddress.startsWith('0x000000') && (
          <button 
            onClick={toggleFavorite}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50 transition-all z-10 group/fav"
          >
            <Star className={`w-5 h-5 transition-all ${isFavorite ? 'text-yellow-500 fill-yellow-500 scale-110' : 'text-muted-foreground group-hover/fav:text-yellow-500'}`} />
          </button>
        )}

        {/* Token Pair Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex -space-x-3">
            {pool.token0.logoURI ? (
              <img 
                src={pool.token0.logoURI} 
                alt={pool.token0.symbol}
                className="w-12 h-12 rounded-full object-cover z-10 border-3 border-background shadow-lg group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-lg z-10 border-3 border-background shadow-lg">
                {pool.token0.symbol.charAt(0)}
              </div>
            )}
            {pool.token1.logoURI ? (
              <img 
                src={pool.token1.logoURI} 
                alt={pool.token1.symbol}
                className="w-12 h-12 rounded-full object-cover border-3 border-background shadow-lg group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-lg border-3 border-background shadow-lg">
                {pool.token1.symbol.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xl truncate group-hover:text-primary transition-colors">
              {pool.token0.symbol}/{pool.token1.symbol}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                0.3% Fee
              </Badge>
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${isPositive ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Mini Price Chart */}
        <div className="h-20 mb-5 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id={`gradient-${pool.pairAddress.slice(-6)}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? '#22c55e' : '#ef4444'} 
                strokeWidth={2}
                fill={`url(#gradient-${pool.pairAddress.slice(-6)})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <Droplets className="w-5 h-5 mx-auto mb-1.5 text-primary" />
            <p className="text-xs text-muted-foreground mb-0.5">TVL</p>
            <p className="font-bold text-sm">{formatNumber(pool.tvl)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <BarChart3 className="w-5 h-5 mx-auto mb-1.5 text-primary" />
            <p className="text-xs text-muted-foreground mb-0.5">24h Vol</p>
            <p className="font-bold text-sm">{formatNumber(pool.volume24h)}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors">
            <Zap className="w-5 h-5 mx-auto mb-1.5 text-green-500" />
            <p className="text-xs text-muted-foreground mb-0.5">APR</p>
            <p className="font-bold text-sm text-green-500">{pool.apr.toFixed(1)}%</p>
          </div>
        </div>

        {/* Reserves - Collapsible on hover */}
        <div className={`space-y-2 text-sm mb-5 overflow-hidden transition-all duration-300 ${isHovered ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
            <span className="text-muted-foreground flex items-center gap-2">
              {pool.token0.logoURI && <img src={pool.token0.logoURI} className="w-4 h-4 rounded-full" />}
              {pool.token0.symbol}
            </span>
            <span className="font-mono">{parseFloat(pool.reserve0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
            <span className="text-muted-foreground flex items-center gap-2">
              {pool.token1.logoURI && <img src={pool.token1.logoURI} className="w-4 h-4 rounded-full" />}
              {pool.token1.symbol}
            </span>
            <span className="font-mono">{parseFloat(pool.reserve1).toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/dex/pool/${pool.pairAddress}`)}
            className="flex-1 h-11 rounded-xl hover:bg-muted/50 group/btn"
          >
            <ExternalLink className="w-4 h-4 mr-2 group-hover/btn:rotate-12 transition-transform" />
            Details
          </Button>
          <Button
            onClick={() => navigate('/dex/liquidity')}
            className="flex-1 h-11 rounded-xl btn-hero"
          >
            <Droplets className="w-4 h-4 mr-2" />
            Add Liquidity
          </Button>
        </div>
      </div>
    </Card>
  );
});

PoolCard.displayName = 'PoolCard';

export default PoolCard;
