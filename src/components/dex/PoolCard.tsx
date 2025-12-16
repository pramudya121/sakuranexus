import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PoolInfo } from '@/lib/web3/dex';
import { TrendingUp, Droplets, BarChart3, Star } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { isFavoritePool, addFavoritePool, removeFavoritePool } from './PoolFavorites';

interface PoolCardProps {
  pool: PoolInfo;
}

// Generate mock price history data for chart
const generateMockPriceHistory = (basePrice: number) => {
  const data = [];
  let price = basePrice;
  for (let i = 0; i < 24; i++) {
    price = price * (0.98 + Math.random() * 0.04);
    data.push({
      time: i,
      price: price,
    });
  }
  return data;
};

const PoolCard = ({ pool }: PoolCardProps) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(isFavoritePool(pool.pairAddress));
  }, [pool.pairAddress]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      removeFavoritePool(pool.pairAddress);
    } else {
      addFavoritePool(pool.pairAddress);
    }
    setIsFavorite(!isFavorite);
  };
  
  // Generate mock price history based on pool ratio
  const basePrice = pool.reserve1 && pool.reserve0 ? 
    parseFloat(pool.reserve1) / parseFloat(pool.reserve0) : 1;
  const priceHistory = generateMockPriceHistory(basePrice);
  
  // Calculate 24h price change (mock)
  const priceChange = ((priceHistory[23].price - priceHistory[0].price) / priceHistory[0].price) * 100;
  const isPositive = priceChange >= 0;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <Card className="glass border-border/50 p-4 hover:border-primary/50 transition-all duration-300 relative">
      {/* Favorite Button */}
      <button 
        onClick={toggleFavorite}
        className="absolute top-3 right-3 p-1 hover:scale-110 transition-transform"
      >
        <Star className={`w-5 h-5 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
      </button>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {pool.token0.logoURI ? (
              <img 
                src={pool.token0.logoURI} 
                alt={pool.token0.symbol}
                className="w-10 h-10 rounded-full object-cover z-10 border-2 border-background"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold z-10 border-2 border-background">
                {pool.token0.symbol.charAt(0)}
              </div>
            )}
            {pool.token1.logoURI ? (
              <img 
                src={pool.token1.logoURI} 
                alt={pool.token1.symbol}
                className="w-10 h-10 rounded-full object-cover border-2 border-background"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold border-2 border-background">
                {pool.token1.symbol.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {pool.token0.symbol} / {pool.token1.symbol}
            </h3>
            <Badge variant="secondary" className="text-xs">
              0.3% Fee
            </Badge>
          </div>
        </div>
        <Badge variant="outline" className="text-green-500 border-green-500/50">
          <TrendingUp className="w-3 h-3 mr-1" />
          {pool.apr.toFixed(1)}% APR
        </Badge>
      </div>

      {/* Mini Price Chart */}
      <div className="h-16 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceHistory}>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={isPositive ? '#22c55e' : '#ef4444'} 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Price Change */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="text-muted-foreground">24h Change</span>
        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <Droplets className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-xs text-muted-foreground">TVL</p>
          <p className="font-semibold">{formatNumber(pool.tvl)}</p>
        </div>
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <BarChart3 className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-xs text-muted-foreground">Volume 24h</p>
          <p className="font-semibold">{formatNumber(pool.volume24h)}</p>
        </div>
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
          <p className="text-xs text-muted-foreground">APR</p>
          <p className="font-semibold text-green-500">{pool.apr.toFixed(1)}%</p>
        </div>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Reserve {pool.token0.symbol}</span>
          <span>{parseFloat(pool.reserve0).toFixed(4)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Reserve {pool.token1.symbol}</span>
          <span>{parseFloat(pool.reserve1).toFixed(4)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/dex/pool/${pool.pairAddress}`)}
          className="flex-1"
        >
          View Details
        </Button>
        <Button
          onClick={() => navigate('/dex/liquidity')}
          className="flex-1 bg-gradient-sakura hover:shadow-sakura"
        >
          Add Liquidity
        </Button>
      </div>
    </Card>
  );
};

export default PoolCard;
