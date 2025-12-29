import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { getTokenBalance } from '@/lib/web3/dex';
import { useNavigate } from 'react-router-dom';

interface TokenBalance {
  token: Token;
  balance: string;
  balanceFormatted: string;
  usdValue: number;
  change24h: number;
}

interface TokenBalancesProps {
  walletAddress: string;
  onTotalValueChange: (value: number) => void;
  refreshTrigger: number;
}

// Mock USD prices and 24h changes (in a real app, fetch from price oracle)
const TOKEN_DATA: Record<string, { price: number; change: number }> = {
  'NEX': { price: 1.25, change: 2.5 },
  'WNEX': { price: 1.25, change: 2.5 },
  'NXSA': { price: 0.05, change: -1.2 },
  'WETH': { price: 2500, change: 3.8 },
  'BNB': { price: 650, change: 1.5 },
  'USDC': { price: 1.0, change: 0.01 },
};

const TokenBalances = ({ walletAddress, onTotalValueChange, refreshTrigger }: TokenBalancesProps) => {
  const navigate = useNavigate();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBalances = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const tokenBalances: TokenBalance[] = [];
      
      for (const token of DEFAULT_TOKENS) {
        try {
          const balance = await getTokenBalance(token.address, walletAddress, true);
          const balanceNum = parseFloat(balance) || 0;
          const tokenData = TOKEN_DATA[token.symbol] || { price: 0, change: 0 };
          const usdValue = balanceNum * tokenData.price;
          
          tokenBalances.push({
            token,
            balance: balance || '0',
            balanceFormatted: balanceNum > 0 ? (balanceNum > 1000 ? balanceNum.toFixed(2) : balanceNum.toFixed(4)) : '0',
            usdValue,
            change24h: tokenData.change,
          });
          
          // Reduced delay between calls
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch {
          // Silently handle - add zero balance entry
          const tokenData = TOKEN_DATA[token.symbol] || { price: 0, change: 0 };
          tokenBalances.push({
            token,
            balance: '0',
            balanceFormatted: '0',
            usdValue: 0,
            change24h: tokenData.change,
          });
        }
      }
      
      tokenBalances.sort((a, b) => b.usdValue - a.usdValue);
      setBalances(tokenBalances);
      onTotalValueChange(tokenBalances.reduce((sum, t) => sum + t.usdValue, 0));
    } catch {
      // Silently handle overall error
      setBalances([]);
      onTotalValueChange(0);
    }
    
    setIsLoading(false);
  }, [walletAddress, onTotalValueChange]);

  useEffect(() => {
    if (walletAddress) {
      loadBalances();
    }
  }, [walletAddress, refreshTrigger, loadBalances]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const tokensWithBalance = balances.filter(b => parseFloat(b.balance) > 0);
  const tokensWithoutBalance = balances.filter(b => parseFloat(b.balance) === 0);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass border-border/50 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-medium">Active Tokens</span>
            </div>
            <p className="text-2xl font-bold">{tokensWithBalance.length}</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Top Holding</span>
            </div>
            <p className="text-lg font-bold truncate">{tokensWithBalance[0]?.token.symbol || '-'}</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50 bg-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-accent mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs font-medium">Available</span>
            </div>
            <p className="text-2xl font-bold">{DEFAULT_TOKENS.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Token List */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Token Balances</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {tokensWithBalance.length} active
          </Badge>
        </div>
        
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {tokensWithBalance.map((item, index) => (
              <div 
                key={item.token.address}
                className="flex items-center justify-between p-4 hover:bg-secondary/20 transition-all duration-300 cursor-pointer group"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate('/dex/swap')}
              >
                <div className="flex items-center gap-3">
                  {item.token.logoURI ? (
                    <img 
                      src={item.token.logoURI} 
                      alt={item.token.symbol}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-border/50 group-hover:ring-primary/50 transition-all"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold ring-2 ring-border/50">
                      {item.token.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{item.token.symbol}</p>
                      <span className={`text-xs flex items-center gap-0.5 ${item.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {item.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(item.change24h).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold font-mono">{item.balanceFormatted}</p>
                  <p className="text-sm text-muted-foreground">
                    ${item.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
            
            {tokensWithoutBalance.length > 0 && (
              <div className="p-3 bg-secondary/10">
                <p className="text-xs text-muted-foreground text-center">
                  {tokensWithoutBalance.length} more tokens available with zero balance
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenBalances;
