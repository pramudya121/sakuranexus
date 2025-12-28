import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, Droplets, RefreshCw, ChevronRight } from 'lucide-react';
import { getAllPairs, getPoolInfo, getLPBalance, PoolInfo } from '@/lib/web3/dex';
import { getCurrentAccount } from '@/lib/web3/wallet';

interface Position extends PoolInfo {
  lpBalance: string;
  share: number;
  valueToken0: string;
  valueToken1: string;
}

const MyPositions = () => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    if (account) {
      loadPositions();
    }
  }, [account]);

  const loadAccount = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
    if (!acc) setIsLoading(false);
  };

  const loadPositions = async () => {
    if (!account) return;
    setIsLoading(true);

    try {
      const pairs = await getAllPairs();
      const positionsWithBalance: Position[] = [];

      for (const pairAddress of pairs) {
        const lpBalance = await getLPBalance(pairAddress, account);
        
        if (parseFloat(lpBalance) > 0) {
          const poolInfo = await getPoolInfo(pairAddress);
          if (!poolInfo) continue;
          
          // Calculate share and value - totalSupply is already formatted as a decimal string
          // So we need to parse it properly, not directly to BigInt
          const totalSupplyNum = parseFloat(poolInfo.totalSupply || '1');
          const lpBalanceNum = parseFloat(lpBalance);
          
          // Calculate share as percentage
          const share = totalSupplyNum > 0 
            ? (lpBalanceNum / totalSupplyNum) * 100
            : 0;

          const reserve0Num = parseFloat(poolInfo.reserve0);
          const reserve1Num = parseFloat(poolInfo.reserve1);
          
          // Calculate user's share of each token
          const valueToken0 = totalSupplyNum > 0 
            ? ((reserve0Num * lpBalanceNum) / totalSupplyNum).toString()
            : '0';
          const valueToken1 = totalSupplyNum > 0 
            ? ((reserve1Num * lpBalanceNum) / totalSupplyNum).toString()
            : '0';

          positionsWithBalance.push({
            ...poolInfo,
            lpBalance,
            share,
            valueToken0,
            valueToken1,
          });
        }
      }

      setPositions(positionsWithBalance);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
    
    setIsLoading(false);
  };

  if (!account) {
    return (
      <Card className="glass border-border/50 p-6">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Wallet className="w-12 h-12 mb-4 opacity-50" />
          <p>Connect wallet to view your positions</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-lg font-bold">My Liquidity Positions</h3>
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">My Liquidity Positions</h3>
          <Badge variant="secondary">{positions.length}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={loadPositions}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
        <div className="divide-y divide-border/50">
          {positions.map((position, i) => (
            <div 
              key={i} 
              className="p-4 hover:bg-secondary/20 transition-colors cursor-pointer"
              onClick={() => navigate(`/dex/pool/${position.pairAddress}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {position.token0.logoURI ? (
                      <img src={position.token0.logoURI} alt={position.token0.symbol} className="w-8 h-8 rounded-full object-cover z-10 border-2 border-background" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-xs z-10 border-2 border-background">
                        {position.token0.symbol.charAt(0)}
                      </div>
                    )}
                    {position.token1.logoURI ? (
                      <img src={position.token1.logoURI} alt={position.token1.symbol} className="w-8 h-8 rounded-full object-cover border-2 border-background" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-xs border-2 border-background">
                        {position.token1.symbol.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{position.token0.symbol}/{position.token1.symbol}</p>
                    <p className="text-xs text-muted-foreground">Pool Share: {position.share.toFixed(4)}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-green-500 border-green-500/50">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {position.apr.toFixed(1)}% APR
                  </Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-secondary/30 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">LP Tokens</p>
                  <p className="font-mono font-medium">{parseFloat(position.lpBalance).toFixed(6)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{position.token0.symbol}</p>
                  <p className="font-mono font-medium">{parseFloat(position.valueToken0).toFixed(4)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2">
                  <p className="text-xs text-muted-foreground">{position.token1.symbol}</p>
                  <p className="font-mono font-medium">{parseFloat(position.valueToken1).toFixed(4)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default MyPositions;
