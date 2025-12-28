import { RefreshCw, Wallet, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PortfolioHeaderProps {
  totalValue: number;
  change24h: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  lastRefresh: Date;
}

const PortfolioHeader = ({ 
  totalValue, 
  change24h, 
  isRefreshing, 
  onRefresh, 
  lastRefresh 
}: PortfolioHeaderProps) => {
  const isPositive = change24h >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/20 p-6 mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-accent/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-sakura flex items-center justify-center shadow-sakura">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground font-medium">Total Portfolio Value</p>
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}{change24h.toFixed(2)}% (24h)
              </span>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          title={`Last refresh: ${lastRefresh.toLocaleTimeString()}`}
          className="h-12 w-12 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 hover:scale-110"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default PortfolioHeader;
