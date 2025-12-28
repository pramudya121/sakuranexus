import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Droplets, TrendingUp, ChevronRight, Plus, Wallet } from 'lucide-react';
import { getAllPairs, getPoolInfo, getLPBalance, PoolInfo } from '@/lib/web3/dex';

interface Position extends PoolInfo {
  lpBalance: string;
  share: number;
  valueToken0: string;
  valueToken1: string;
  estimatedValue: number;
}

interface MyLPPositionsProps {
  walletAddress: string;
  refreshTrigger: number;
  onPositionsLoaded?: (positions: Position[]) => void;
}

// Mock token prices for value calculation
const TOKEN_PRICES: Record<string, number> = {
  'NEX': 1.25,
  'WNEX': 1.25,
  'NXSA': 0.05,
  'WETH': 2500,
  'BNB': 650,
  'USDC': 1.0,
};

const MyLPPositions = ({ walletAddress, refreshTrigger, onPositionsLoaded }: MyLPPositionsProps) => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalLPValue, setTotalLPValue] = useState(0);

  useEffect(() => {
    if (walletAddress) {
      loadPositions();
    }
  }, [walletAddress, refreshTrigger]);

  const loadPositions = async () => {
    setIsLoading(true);

    try {
      const pairs = await getAllPairs();
      const positionsWithBalance: Position[] = [];

      for (const pairAddress of pairs) {
        const lpBalance = await getLPBalance(pairAddress, walletAddress);
        
        if (parseFloat(lpBalance) > 0) {
          const poolInfo = await getPoolInfo(pairAddress);
          if (!poolInfo) continue;
          
          const totalSupplyNum = parseFloat(poolInfo.totalSupply || '1');
          const lpBalanceNum = parseFloat(lpBalance);
          
          const share = totalSupplyNum > 0 
            ? (lpBalanceNum / totalSupplyNum) * 100
            : 0;

          const reserve0Num = parseFloat(poolInfo.reserve0);
          const reserve1Num = parseFloat(poolInfo.reserve1);
          
          const valueToken0 = totalSupplyNum > 0 
            ? ((reserve0Num * lpBalanceNum) / totalSupplyNum).toString()
            : '0';
          const valueToken1 = totalSupplyNum > 0 
            ? ((reserve1Num * lpBalanceNum) / totalSupplyNum).toString()
            : '0';

          // Calculate estimated USD value
          const price0 = TOKEN_PRICES[poolInfo.token0.symbol] || 0;
          const price1 = TOKEN_PRICES[poolInfo.token1.symbol] || 0;
          const estimatedValue = parseFloat(valueToken0) * price0 + parseFloat(valueToken1) * price1;

          positionsWithBalance.push({
            ...poolInfo,
            lpBalance,
            share,
            valueToken0,
            valueToken1,
            estimatedValue,
          });
        }
      }

      positionsWithBalance.sort((a, b) => b.estimatedValue - a.estimatedValue);
      setPositions(positionsWithBalance);
      setTotalLPValue(positionsWithBalance.reduce((sum, p) => sum + p.estimatedValue, 0));
      onPositionsLoaded?.(positionsWithBalance);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
    
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* LP Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass border-border/50 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Droplets className="w-4 h-4" />
              <span className="text-xs font-medium">Active Positions</span>
            </div>
            <p className="text-2xl font-bold">{positions.length}</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Total LP Value</span>
            </div>
            <p className="text-xl font-bold">
              ${totalLPValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Positions List */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold">Liquidity Positions</h3>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate('/dex/liquidity')}
            className="bg-gradient-sakura text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>

        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Droplets className="w-12 h-12 mb-4 opacity-50" />
            <p className="mb-4">No liquidity positions found</p>
            <Button onClick={() => navigate('/dex/liquidity')} className="bg-gradient-sakura">
              Add Liquidity
            </Button>
          </div>
        ) : (
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {positions.map((position, i) => (
                <div 
                  key={i} 
                  className="p-4 hover:bg-secondary/20 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/dex/pool/${position.pairAddress}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {position.token0.logoURI ? (
                          <img src={position.token0.logoURI} alt={position.token0.symbol} className="w-9 h-9 rounded-full object-cover z-10 border-2 border-background ring-2 ring-primary/20" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-xs z-10 border-2 border-background">
                            {position.token0.symbol.charAt(0)}
                          </div>
                        )}
                        {position.token1.logoURI ? (
                          <img src={position.token1.logoURI} alt={position.token1.symbol} className="w-9 h-9 rounded-full object-cover border-2 border-background" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-xs border-2 border-background">
                            {position.token1.symbol.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold">{position.token0.symbol}/{position.token1.symbol}</p>
                        <p className="text-xs text-muted-foreground">Share: {position.share.toFixed(4)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {position.apr.toFixed(1)}% APR
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-secondary/30 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">LP Tokens</p>
                      <p className="font-mono font-medium">{parseFloat(position.lpBalance).toFixed(6)}</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">{position.token0.symbol}</p>
                      <p className="font-mono font-medium">{parseFloat(position.valueToken0).toFixed(4)}</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">{position.token1.symbol}</p>
                      <p className="font-mono font-medium">{parseFloat(position.valueToken1).toFixed(4)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-right">
                    <span className="text-sm text-muted-foreground">Value: </span>
                    <span className="font-semibold text-primary">
                      ${position.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default MyLPPositions;
