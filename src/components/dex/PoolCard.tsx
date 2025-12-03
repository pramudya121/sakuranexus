import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { PoolInfo } from '@/lib/web3/dex';
import { TrendingUp, Droplets, BarChart3 } from 'lucide-react';

interface PoolCardProps {
  pool: PoolInfo;
}

const PoolCard = ({ pool }: PoolCardProps) => {
  const navigate = useNavigate();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <Card className="glass border-border/50 p-4 hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold z-10 border-2 border-background">
              {pool.token0.symbol.charAt(0)}
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold border-2 border-background">
              {pool.token1.symbol.charAt(0)}
            </div>
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

      <Button
        onClick={() => navigate('/dex/liquidity')}
        className="w-full bg-gradient-sakura hover:shadow-sakura"
      >
        Add Liquidity
      </Button>
    </Card>
  );
};

export default PoolCard;
