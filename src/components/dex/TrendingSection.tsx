import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Flame, Clock, Gift, Zap, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';

interface TrendingToken {
  token: Token;
  priceChange24h: number;
  volume24h: number;
  txCount: number;
}

interface FeaturedPool {
  tokenA: Token;
  tokenB: Token;
  apr: number;
  tvl: number;
  volume24h: number;
}

// Generate mock trending data
const generateTrendingTokens = (): TrendingToken[] => {
  return DEFAULT_TOKENS.slice(0, 4).map(token => ({
    token,
    priceChange24h: (Math.random() - 0.3) * 30, // Bias towards positive
    volume24h: 10000 + Math.random() * 200000,
    txCount: Math.floor(50 + Math.random() * 500),
  })).sort((a, b) => b.priceChange24h - a.priceChange24h);
};

// Generate mock featured pools
const generateFeaturedPools = (): FeaturedPool[] => {
  const pools: FeaturedPool[] = [
    {
      tokenA: DEFAULT_TOKENS[0],
      tokenB: DEFAULT_TOKENS[2],
      apr: 25 + Math.random() * 50,
      tvl: 50000 + Math.random() * 200000,
      volume24h: 10000 + Math.random() * 100000,
    },
    {
      tokenA: DEFAULT_TOKENS[0],
      tokenB: DEFAULT_TOKENS[1],
      apr: 15 + Math.random() * 30,
      tvl: 30000 + Math.random() * 150000,
      volume24h: 5000 + Math.random() * 50000,
    },
    {
      tokenA: DEFAULT_TOKENS[1],
      tokenB: DEFAULT_TOKENS[2],
      apr: 20 + Math.random() * 40,
      tvl: 20000 + Math.random() * 100000,
      volume24h: 3000 + Math.random() * 30000,
    },
  ];
  return pools.sort((a, b) => b.apr - a.apr);
};

const TrendingSection = () => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [featuredPools, setFeaturedPools] = useState<FeaturedPool[]>([]);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setTrendingTokens(generateTrendingTokens());
    setFeaturedPools(generateFeaturedPools());

    // Update countdown timer for next rewards distribution
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Trending Tokens */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Trending Tokens
          </h3>
          <Badge variant="outline" className="text-orange-500 border-orange-500/50">
            24h
          </Badge>
        </div>
        
        <div className="p-4 space-y-3">
          {trendingTokens.map((item, index) => (
            <div 
              key={item.token.address} 
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {index + 1}
                </span>
                {item.token.logoURI ? (
                  <img src={item.token.logoURI} alt={item.token.symbol} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-sm font-bold">
                    {item.token.symbol.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="font-medium">{item.token.symbol}</span>
                  <p className="text-xs text-muted-foreground">{item.txCount} txns</p>
                </div>
              </div>
              <div className="text-right">
                <Badge 
                  variant={item.priceChange24h >= 0 ? 'default' : 'destructive'}
                  className={item.priceChange24h >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}
                >
                  {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(2)}%
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">${(item.volume24h / 1000).toFixed(1)}K vol</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Featured Pools */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Top Pools
          </h3>
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">
            APR
          </Badge>
        </div>
        
        <div className="p-4 space-y-3">
          {featuredPools.map((pool, index) => (
            <div 
              key={`${pool.tokenA.address}-${pool.tokenB.address}`}
              className="p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {pool.tokenA.logoURI ? (
                      <img src={pool.tokenA.logoURI} alt={pool.tokenA.symbol} className="w-6 h-6 rounded-full border-2 border-background object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold border-2 border-background">
                        {pool.tokenA.symbol.charAt(0)}
                      </div>
                    )}
                    {pool.tokenB.logoURI ? (
                      <img src={pool.tokenB.logoURI} alt={pool.tokenB.symbol} className="w-6 h-6 rounded-full border-2 border-background object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold border-2 border-background">
                        {pool.tokenB.symbol.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className="font-medium">{pool.tokenA.symbol}/{pool.tokenB.symbol}</span>
                </div>
                <Badge className="bg-green-500/20 text-green-500 border-green-500/50">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {pool.apr.toFixed(1)}% APR
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>TVL: ${(pool.tvl / 1000).toFixed(1)}K</span>
                <span>24h Vol: ${(pool.volume24h / 1000).toFixed(1)}K</span>
              </div>
            </div>
          ))}
          
          <Button variant="outline" className="w-full mt-2 gap-2">
            View All Pools
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Rewards Countdown */}
      <Card className="glass border-border/50 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold">Daily Rewards</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Trade and provide liquidity to earn NXSA rewards
          </p>
          
          {/* Countdown Timer */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold text-primary">{String(countdown.hours).padStart(2, '0')}</p>
              <p className="text-xs text-muted-foreground">Hours</p>
            </div>
            <span className="text-2xl font-bold text-primary">:</span>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold text-primary">{String(countdown.minutes).padStart(2, '0')}</p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
            <span className="text-2xl font-bold text-primary">:</span>
            <div className="text-center p-3 rounded-lg bg-background/50">
              <p className="text-2xl font-bold text-primary">{String(countdown.seconds).padStart(2, '0')}</p>
              <p className="text-xs text-muted-foreground">Seconds</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Your Progress</span>
              <span className="text-primary font-medium">75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          
          <Button className="w-full mt-4 bg-gradient-sakura gap-2">
            <Zap className="w-4 h-4" />
            Claim Rewards
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TrendingSection;
