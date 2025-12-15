import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Wallet, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { getTokenBalance } from '@/lib/web3/dex';
import { ethers } from 'ethers';

interface TokenBalance {
  token: Token;
  balance: string;
  balanceFormatted: string;
  usdValue: number;
}

interface PortfolioTabProps {
  walletAddress: string;
}

// Mock USD prices for tokens (in a real app, fetch from price oracle)
const TOKEN_PRICES: Record<string, number> = {
  'NEX': 1.25,
  'WNEX': 1.25,
  'NXSA': 0.05,
  'WETH': 2500,
  'BNB': 650,
  'USDC': 1.0,
};

const PortfolioTab = ({ walletAddress }: PortfolioTabProps) => {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadBalances = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    
    try {
      const tokenBalances: TokenBalance[] = [];
      
      // Fetch balances for all tokens
      for (const token of DEFAULT_TOKENS) {
        try {
          const balance = await getTokenBalance(token.address, walletAddress, forceRefresh);
          const balanceNum = parseFloat(balance);
          const price = TOKEN_PRICES[token.symbol] || 0;
          const usdValue = balanceNum * price;
          
          tokenBalances.push({
            token,
            balance,
            balanceFormatted: balanceNum.toFixed(4),
            usdValue,
          });
          
          // Small delay to avoid RPC rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
          tokenBalances.push({
            token,
            balance: '0',
            balanceFormatted: '0.0000',
            usdValue: 0,
          });
        }
      }
      
      // Sort by USD value (highest first)
      tokenBalances.sort((a, b) => b.usdValue - a.usdValue);
      
      setBalances(tokenBalances);
      setTotalValue(tokenBalances.reduce((sum, t) => sum + t.usdValue, 0));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading portfolio:', error);
    }
    
    setIsLoading(false);
    setIsRefreshing(false);
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      loadBalances();
    }
  }, [walletAddress, loadBalances]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadBalances(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadBalances]);

  const handleRefresh = () => {
    loadBalances(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Card className="glass border-border/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Total Balance</h3>
            <p className="text-3xl font-bold text-primary number-transition">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title={`Last refresh: ${lastRefresh.toLocaleTimeString()}`}
          className="transition-transform duration-300 hover:scale-110"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Token List */}
      <Card className="glass border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {balances.map((item, index) => {
              const hasBalance = parseFloat(item.balance) > 0;
              
              return (
                <div 
                  key={item.token.address}
                  className={`flex items-center justify-between p-4 transition-all duration-300 hover:bg-secondary/30 ${
                    hasBalance ? '' : 'opacity-50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {item.token.logoURI ? (
                      <img 
                        src={item.token.logoURI} 
                        alt={item.token.symbol}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold">
                        {item.token.symbol.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{item.token.symbol}</p>
                      <p className="text-sm text-muted-foreground">{item.token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold number-transition">{item.balanceFormatted}</p>
                    <p className="text-sm text-muted-foreground">
                      ${item.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tokens Held</p>
              <p className="font-bold">{balances.filter(b => parseFloat(b.balance) > 0).length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Largest Position</p>
              <p className="font-bold">{balances[0]?.token.symbol || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DEX Ready</p>
              <p className="font-bold text-green-500">Active</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioTab;
