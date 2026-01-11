import { memo, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff } from 'lucide-react';
import { useSingleNFTPrice } from '@/hooks/useNFTPriceWebSocket';
import { cn } from '@/lib/utils';

interface LivePriceIndicatorProps {
  nftId: string;
  initialPrice?: number;
  showChange?: boolean;
  showConnectionStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LivePriceIndicator = memo(({
  nftId,
  initialPrice,
  showChange = true,
  showConnectionStatus = false,
  size = 'md',
  className,
}: LivePriceIndicatorProps) => {
  const { price, priceChangePercent, isConnected, isUp, isDown } = useSingleNFTPrice(nftId, initialPrice);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [prevPrice, setPrevPrice] = useState(price);

  useEffect(() => {
    if (price !== prevPrice) {
      if (price > prevPrice) {
        setFlash('up');
      } else if (price < prevPrice) {
        setFlash('down');
      }
      setPrevPrice(price);
      
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
  }, [price, prevPrice]);

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const badgeSizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Connection Status */}
      {showConnectionStatus && (
        <span className={cn(
          'flex items-center gap-1 text-xs',
          isConnected ? 'text-green-500' : 'text-muted-foreground'
        )}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        </span>
      )}

      {/* Price */}
      <span className={cn(
        'font-bold transition-colors duration-300',
        sizeClasses[size],
        flash === 'up' && 'text-green-500',
        flash === 'down' && 'text-red-500',
        !flash && 'gradient-text',
      )}>
        {price.toFixed(4)} NEX
      </span>

      {/* Change Badge */}
      {showChange && (
        <Badge 
          variant="secondary"
          className={cn(
            'flex items-center gap-0.5 transition-colors',
            badgeSizeClasses[size],
            isUp && 'bg-green-500/10 text-green-500 border-green-500/20',
            isDown && 'bg-red-500/10 text-red-500 border-red-500/20',
            !isUp && !isDown && 'bg-muted text-muted-foreground',
          )}
        >
          {isUp && <TrendingUp className="w-3 h-3" />}
          {isDown && <TrendingDown className="w-3 h-3" />}
          {!isUp && !isDown && <Minus className="w-3 h-3" />}
          <span>{Math.abs(priceChangePercent).toFixed(2)}%</span>
        </Badge>
      )}

      {/* Live Indicator */}
      {isConnected && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      )}
    </div>
  );
});

LivePriceIndicator.displayName = 'LivePriceIndicator';

export default LivePriceIndicator;
