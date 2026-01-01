import { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ArrowUp, ArrowDown, Activity, Zap } from 'lucide-react';
import { Token } from '@/lib/web3/dex-config';

interface OrderBookOrder {
  price: number;
  amount: number;
  total: number;
  percentage: number;
  isNew?: boolean;
}

interface OrderBookProps {
  tokenIn: Token;
  tokenOut: Token;
  onPriceClick?: (price: number) => void;
}

// Generate stable order book data using seed
const generateOrderBook = (basePrice: number, seed: number) => {
  const bids: OrderBookOrder[] = [];
  const asks: OrderBookOrder[] = [];
  
  let maxBidTotal = 0;
  let maxAskTotal = 0;
  
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  // Generate bids (buy orders) - prices below current
  for (let i = 0; i < 15; i++) {
    const priceOffset = (i + 1) * 0.001 * (1 + seededRandom(seed + i) * 0.5);
    const price = basePrice * (1 - priceOffset);
    const amount = 100 + seededRandom(seed + i + 100) * 5000;
    const total = price * amount;
    maxBidTotal = Math.max(maxBidTotal, total);
    
    bids.push({
      price: Number(price.toFixed(6)),
      amount: Number(amount.toFixed(4)),
      total: Number(total.toFixed(4)),
      percentage: 0,
    });
  }
  
  // Generate asks (sell orders) - prices above current
  for (let i = 0; i < 15; i++) {
    const priceOffset = (i + 1) * 0.001 * (1 + seededRandom(seed + i + 50) * 0.5);
    const price = basePrice * (1 + priceOffset);
    const amount = 100 + seededRandom(seed + i + 150) * 5000;
    const total = price * amount;
    maxAskTotal = Math.max(maxAskTotal, total);
    
    asks.push({
      price: Number(price.toFixed(6)),
      amount: Number(amount.toFixed(4)),
      total: Number(total.toFixed(4)),
      percentage: 0,
    });
  }
  
  // Calculate percentages for depth visualization
  bids.forEach(bid => bid.percentage = (bid.total / maxBidTotal) * 100);
  asks.forEach(ask => ask.percentage = (ask.total / maxAskTotal) * 100);
  
  return {
    bids: bids.sort((a, b) => b.price - a.price),
    asks: asks.sort((a, b) => a.price - b.price),
  };
};

const OrderBook = ({ tokenIn, tokenOut, onPriceClick }: OrderBookProps) => {
  const [orderBook, setOrderBook] = useState<{ bids: OrderBookOrder[]; asks: OrderBookOrder[] }>({ bids: [], asks: [] });
  const [spread, setSpread] = useState({ value: 0, percentage: 0 });
  const [displayMode, setDisplayMode] = useState<'both' | 'bids' | 'asks'>('both');
  const [precision, setPrecision] = useState<number>(6);
  const seedRef = useRef(Date.now());
  const basePriceRef = useRef(0.95);

  useEffect(() => {
    const book = generateOrderBook(basePriceRef.current, seedRef.current);
    setOrderBook(book);
    
    // Calculate spread
    if (book.asks.length > 0 && book.bids.length > 0) {
      const lowestAsk = book.asks[0].price;
      const highestBid = book.bids[0].price;
      const spreadValue = lowestAsk - highestBid;
      const spreadPercentage = (spreadValue / lowestAsk) * 100;
      setSpread({ value: spreadValue, percentage: spreadPercentage });
    }
    
    // Update order book periodically with small changes
    const interval = setInterval(() => {
      seedRef.current = Date.now();
      basePriceRef.current = basePriceRef.current * (0.999 + Math.random() * 0.002);
      const newBook = generateOrderBook(basePriceRef.current, seedRef.current);
      setOrderBook(newBook);
      
      if (newBook.asks.length > 0 && newBook.bids.length > 0) {
        const lowestAsk = newBook.asks[0].price;
        const highestBid = newBook.bids[0].price;
        const spreadValue = lowestAsk - highestBid;
        const spreadPercentage = (spreadValue / lowestAsk) * 100;
        setSpread({ value: spreadValue, percentage: spreadPercentage });
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [tokenIn, tokenOut]);

  const handlePriceClick = (price: number) => {
    onPriceClick?.(price);
  };

  const totalBidVolume = useMemo(() => 
    orderBook.bids.reduce((sum, b) => sum + b.total, 0), [orderBook.bids]);
  const totalAskVolume = useMemo(() => 
    orderBook.asks.reduce((sum, a) => sum + a.total, 0), [orderBook.asks]);
  const imbalance = totalBidVolume > 0 || totalAskVolume > 0 
    ? ((totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume) * 100).toFixed(1)
    : '0';

  const OrderRow = ({ order, type }: { order: OrderBookOrder; type: 'bid' | 'ask' }) => (
    <div 
      className="grid grid-cols-3 gap-2 px-3 py-1.5 text-sm relative cursor-pointer hover:bg-secondary/50 transition-all duration-150 group"
      onClick={() => handlePriceClick(order.price)}
    >
      {/* Depth visualization */}
      <div 
        className={`absolute inset-y-0 ${type === 'bid' ? 'right-0' : 'left-0'} transition-all duration-300`}
        style={{ 
          width: `${order.percentage}%`,
          background: type === 'bid' 
            ? 'linear-gradient(90deg, transparent, hsl(142 76% 36% / 0.15))' 
            : 'linear-gradient(270deg, transparent, hsl(0 84% 60% / 0.15))'
        }}
      />
      
      <span className={`relative z-10 ${type === 'bid' ? 'text-green-500' : 'text-red-500'} font-mono text-xs group-hover:font-semibold transition-all`}>
        {order.price.toFixed(precision)}
      </span>
      <span className="relative z-10 text-right font-mono text-xs text-foreground/80">
        {order.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
      <span className="relative z-10 text-right font-mono text-xs text-muted-foreground">
        {order.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </span>
    </div>
  );

  return (
    <Card className="glass border-border/50 overflow-hidden h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Order Book
          </h3>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={displayMode === 'both' ? 'secondary' : 'ghost'}
              onClick={() => setDisplayMode('both')}
              className="h-6 w-6 p-0"
            >
              <Activity className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={displayMode === 'bids' ? 'secondary' : 'ghost'}
              onClick={() => setDisplayMode('bids')}
              className="h-6 w-6 p-0 text-green-500"
            >
              <ArrowUp className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant={displayMode === 'asks' ? 'secondary' : 'ghost'}
              onClick={() => setDisplayMode('asks')}
              className="h-6 w-6 p-0 text-red-500"
            >
              <ArrowDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {/* Precision selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Precision:</span>
          <div className="flex items-center gap-0.5">
            {[4, 5, 6].map((p) => (
              <Button
                key={p}
                size="sm"
                variant={precision === p ? 'secondary' : 'ghost'}
                onClick={() => setPrecision(p)}
                className="h-5 px-2 text-[10px]"
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="px-3 py-2 bg-secondary/30 flex items-center justify-between text-xs border-b border-border/30">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span className="text-muted-foreground">Imbalance:</span>
          <Badge 
            variant="outline" 
            className={`text-[10px] px-1.5 py-0 ${
              parseFloat(imbalance) > 0 
                ? 'text-green-500 border-green-500/30' 
                : 'text-red-500 border-red-500/30'
            }`}
          >
            {imbalance}%
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>Bids: <span className="text-green-500">${(totalBidVolume/1000).toFixed(0)}K</span></span>
          <span>Asks: <span className="text-red-500">${(totalAskVolume/1000).toFixed(0)}K</span></span>
        </div>
      </div>
      
      {/* Header */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-[10px] text-muted-foreground border-b border-border/50 uppercase tracking-wider">
        <span>Price ({tokenOut.symbol})</span>
        <span className="text-right">Size ({tokenIn.symbol})</span>
        <span className="text-right">Total</span>
      </div>
      
      <ScrollArea className="h-[340px]">
        {/* Asks (Sell Orders) - show in reverse order */}
        {(displayMode === 'both' || displayMode === 'asks') && (
          <div className="border-b border-border/30">
            {[...orderBook.asks].reverse().map((order, i) => (
              <OrderRow key={`ask-${i}`} order={order} type="ask" />
            ))}
          </div>
        )}
        
        {/* Spread */}
        {displayMode === 'both' && (
          <div className="px-3 py-2.5 bg-gradient-to-r from-green-500/5 via-secondary/30 to-red-500/5 border-y border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">Spread</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {spread.percentage.toFixed(3)}%
              </Badge>
            </div>
            <span className="text-sm font-bold text-primary">{spread.value.toFixed(precision)}</span>
          </div>
        )}
        
        {/* Bids (Buy Orders) */}
        {(displayMode === 'both' || displayMode === 'bids') && (
          <div>
            {orderBook.bids.map((order, i) => (
              <OrderRow key={`bid-${i}`} order={order} type="bid" />
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default OrderBook;