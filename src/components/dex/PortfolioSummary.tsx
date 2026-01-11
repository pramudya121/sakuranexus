import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Coins,
  Percent
} from 'lucide-react';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { useMultipleTokenPrices } from '@/hooks/usePriceWebSocket';

interface TokenBalance {
  token: Token;
  balance: number;
  value: number;
  change24h: number;
  percentage: number;
}

const PortfolioSummary = memo(() => {
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const { prices, isConnected } = useMultipleTokenPrices();

  useEffect(() => {
    loadPortfolio();
  }, [prices]);

  const loadPortfolio = async () => {
    setLoading(true);
    const currentAccount = await getCurrentAccount();
    setAccount(currentAccount);

    if (currentAccount) {
      // Simulate token balances (replace with actual balance fetching)
      const mockBalances: TokenBalance[] = DEFAULT_TOKENS.slice(0, 5).map((token, i) => {
        const priceData = prices.get(token.symbol);
        const balance = Math.random() * 100 + 10;
        const price = priceData?.price || 1;
        const value = balance * price;
        const change24h = priceData?.change24h || 0;

        return {
          token,
          balance,
          value,
          change24h,
          percentage: 0, // Will calculate after
        };
      });

      const totalValue = mockBalances.reduce((sum, b) => sum + b.value, 0);
      mockBalances.forEach(b => {
        b.percentage = totalValue > 0 ? (b.value / totalValue) * 100 : 0;
      });

      // Sort by value
      mockBalances.sort((a, b) => b.value - a.value);
      setBalances(mockBalances);
    }
    setLoading(false);
  };

  const totalValue = balances.reduce((sum, b) => sum + b.value, 0);
  const totalChange = balances.reduce((sum, b) => sum + (b.value * b.change24h / 100), 0);
  const totalChangePercent = totalValue > 0 ? (totalChange / totalValue) * 100 : 0;

  const colorPalette = [
    'bg-primary',
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
  ];

  if (!account) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-6 text-center">
          <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">Connect wallet to view portfolio</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <PieChart className="w-5 h-5 text-primary" />
            </div>
            Portfolio
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadPortfolio} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Value */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Total Value</span>
            {isConnected && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
            )}
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold">${totalValue.toFixed(2)}</span>
            <Badge 
              variant="secondary"
              className={`flex items-center gap-1 ${totalChangePercent >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
            >
              {totalChangePercent >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(totalChangePercent).toFixed(2)}%
            </Badge>
          </div>
        </div>

        {/* Distribution Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Asset Distribution</span>
            <span className="text-muted-foreground">{balances.length} tokens</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-muted/30">
            {balances.map((b, i) => (
              <div
                key={b.token.symbol}
                className={`${colorPalette[i % colorPalette.length]} first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                style={{ width: `${b.percentage}%` }}
                title={`${b.token.symbol}: ${b.percentage.toFixed(1)}%`}
              />
            ))}
          </div>
        </div>

        {/* Token List */}
        <div className="space-y-2">
          {balances.map((b, i) => (
            <div
              key={b.token.symbol}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${colorPalette[i % colorPalette.length]}`} />
              {b.token.logoURI ? (
                <img src={b.token.logoURI} alt={b.token.symbol} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                  {b.token.symbol.slice(0, 2)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{b.token.symbol}</span>
                  <span className="font-semibold">${b.value.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{b.balance.toFixed(4)}</span>
                  <span className={b.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {b.change24h >= 0 ? '+' : ''}{b.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

PortfolioSummary.displayName = 'PortfolioSummary';

export default PortfolioSummary;
