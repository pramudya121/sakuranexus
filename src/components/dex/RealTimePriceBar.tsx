import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Radio } from 'lucide-react';
import { useMultipleTokenPrices, PriceData } from '@/hooks/usePriceWebSocket';
import { cn } from '@/lib/utils';

const RealTimePriceBar = () => {
  const { prices, isConnected } = useMultipleTokenPrices();
  const [flashingPrices, setFlashingPrices] = useState<Record<string, 'up' | 'down' | null>>({});

  // Track price changes for flash effect
  useEffect(() => {
    const newFlashing: Record<string, 'up' | 'down' | null> = {};
    
    prices.forEach((data, symbol) => {
      if (data.change24h > 0.01) {
        newFlashing[symbol] = 'up';
      } else if (data.change24h < -0.01) {
        newFlashing[symbol] = 'down';
      }
    });

    setFlashingPrices(newFlashing);

    const timeout = setTimeout(() => {
      setFlashingPrices({});
    }, 500);

    return () => clearTimeout(timeout);
  }, [prices]);

  const priceArray = Array.from(prices.entries()).slice(0, 6);

  return (
    <div className="w-full bg-secondary/30 backdrop-blur-sm border-b border-border/50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-10 gap-6 overflow-x-auto scrollbar-hide">
          {/* Connection Status */}
          <div className="flex items-center gap-2 shrink-0">
            <Radio className={cn(
              "w-3 h-3 transition-colors",
              isConnected ? "text-green-500 animate-pulse" : "text-muted-foreground"
            )} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Price Ticker */}
          <div className="flex items-center gap-6 animate-marquee">
            {priceArray.map(([symbol, data]) => (
              <PriceTickerItem
                key={symbol}
                symbol={symbol}
                data={data}
                isFlashing={flashingPrices[symbol]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface PriceTickerItemProps {
  symbol: string;
  data: PriceData;
  isFlashing?: 'up' | 'down' | null;
}

const PriceTickerItem = ({ symbol, data, isFlashing }: PriceTickerItemProps) => {
  const isPositive = data.change24h >= 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 shrink-0 transition-all duration-200",
        isFlashing === 'up' && "bg-green-500/20 rounded px-2 -mx-2",
        isFlashing === 'down' && "bg-red-500/20 rounded px-2 -mx-2"
      )}
    >
      <span className="font-medium text-sm">{symbol}</span>
      <span className={cn(
        "font-mono text-sm transition-colors",
        isFlashing === 'up' && "text-green-500",
        isFlashing === 'down' && "text-red-500"
      )}>
        ${data.price.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: data.price < 1 ? 4 : 2 
        })}
      </span>
      <div className={cn(
        "flex items-center gap-0.5 text-xs",
        isPositive ? "text-green-500" : "text-red-500"
      )}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{isPositive ? '+' : ''}{data.change24h.toFixed(2)}%</span>
      </div>
    </div>
  );
};

export default RealTimePriceBar;
