import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Route } from '@/lib/web3/swap-router';
import { ArrowRight, Zap, TrendingUp } from 'lucide-react';

interface SwapRouteDisplayProps {
  route: Route | null;
  allRoutes: Route[];
  isLoading: boolean;
}

const SwapRouteDisplay = ({ route, allRoutes, isLoading }: SwapRouteDisplayProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <Zap className="w-4 h-4" />
        Finding best route...
      </div>
    );
  }

  if (!route) return null;

  const isBestRoute = allRoutes.length > 1;
  const savings = allRoutes.length > 1 
    ? ((parseFloat(route.amounts[1]) - parseFloat(allRoutes[allRoutes.length - 1].amounts[1])) / parseFloat(allRoutes[allRoutes.length - 1].amounts[1]) * 100).toFixed(2)
    : '0';

  return (
    <div className="bg-secondary/20 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Route</span>
          {route.path.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              {route.path.length - 1} hops
            </Badge>
          )}
        </div>
        {isBestRoute && parseFloat(savings) > 0 && (
          <Badge className="bg-green-500/20 text-green-500 border-green-500/50 text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            +{savings}% better
          </Badge>
        )}
      </div>

      {/* Route Path Visualization */}
      <div className="flex items-center gap-1 flex-wrap">
        {route.path.map((token, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-background rounded-md">
              {token.logoURI ? (
                <img src={token.logoURI} alt={token.symbol} className="w-4 h-4 rounded-full" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-[8px] font-bold">
                  {token.symbol.charAt(0)}
                </div>
              )}
              <span className="text-xs font-medium">{token.symbol}</span>
            </div>
            {index < route.path.length - 1 && (
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Alternative routes info */}
      {allRoutes.length > 1 && (
        <div className="text-xs text-muted-foreground">
          {allRoutes.length} routes found • Best: {route.path.map(t => t.symbol).join(' → ')}
        </div>
      )}
    </div>
  );
};

export default SwapRouteDisplay;
