import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, DollarSign, Coins, BarChart3 } from 'lucide-react';
import { Token } from '@/lib/web3/dex-config';

interface TokenStatsProps {
  token: Token;
}

interface TokenStatData {
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  txCount24h: number;
  holders: number;
}

// Generate mock stats for demonstration
const generateMockStats = (token: Token): TokenStatData => {
  const basePrice = token.symbol === 'NEX' ? 1 : 
                   token.symbol === 'NXSA' ? 0.85 : 
                   token.symbol === 'WETH' ? 2500 : 1;
  
  return {
    price: basePrice * (0.95 + Math.random() * 0.1),
    priceChange24h: (Math.random() - 0.5) * 20, // -10% to +10%
    volume24h: 50000 + Math.random() * 200000,
    liquidity: 100000 + Math.random() * 500000,
    txCount24h: Math.floor(100 + Math.random() * 500),
    holders: Math.floor(500 + Math.random() * 2000),
  };
};

const TokenStats = ({ token }: TokenStatsProps) => {
  const [stats, setStats] = useState<TokenStatData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    const timer = setTimeout(() => {
      setStats(generateMockStats(token));
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [token]);

  if (isLoading || !stats) {
    return (
      <Card className="glass border-border/50 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-secondary/50 rounded w-1/2"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-secondary/30 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const isPositive = stats.priceChange24h >= 0;

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {token.logoURI ? (
              <img src={token.logoURI} alt={token.symbol} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold">
                {token.symbol.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg">{token.symbol}</h3>
              <p className="text-sm text-muted-foreground">{token.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${stats.price.toFixed(4)}</p>
            <Badge 
              variant={isPositive ? 'default' : 'destructive'}
              className={`${isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {isPositive ? '+' : ''}{stats.priceChange24h.toFixed(2)}%
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 rounded-lg bg-secondary/20">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-xs">24h Volume</span>
          </div>
          <p className="font-bold">${(stats.volume24h / 1000).toFixed(1)}K</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-secondary/20">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Liquidity</span>
          </div>
          <p className="font-bold">${(stats.liquidity / 1000).toFixed(1)}K</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-secondary/20">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs">24h Txns</span>
          </div>
          <p className="font-bold">{stats.txCount24h}</p>
        </div>
        
        <div className="text-center p-3 rounded-lg bg-secondary/20">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Coins className="w-4 h-4" />
            <span className="text-xs">Holders</span>
          </div>
          <p className="font-bold">{stats.holders.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
};

export default TokenStats;
