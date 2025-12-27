import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { Token } from '@/lib/web3/dex-config';

interface OrderBookOrder {
  price: number;
  amount: number;
  total: number;
  percentage: number;
}

interface OrderBookProps {
  tokenIn: Token;
  tokenOut: Token;
  onPriceClick?: (price: number) => void;
}

// Generate mock order book data
const generateOrderBook = (basePrice: number) => {
  const bids: OrderBookOrder[] = [];
  const asks: OrderBookOrder[] = [];
  
  let maxBidTotal = 0;
  let maxAskTotal = 0;
  
  // Generate bids (buy orders) - prices below current
  for (let i = 0; i < 15; i++) {
    const priceOffset = (i + 1) * 0.001 * (1 + Math.random() * 0.5);
    const price = basePrice * (1 - priceOffset);
    const amount = 100 + Math.random() * 5000;
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
    const priceOffset = (i + 1) * 0.001 * (1 + Math.random() * 0.5);
    const price = basePrice * (1 + priceOffset);
    const amount = 100 + Math.random() * 5000;
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

  useEffect(() => {
    const basePrice = 0.85 + Math.random() * 0.3;
    const book = generateOrderBook(basePrice);
    setOrderBook(book);
    
    // Calculate spread
    if (book.asks.length > 0 && book.bids.length > 0) {
      const lowestAsk = book.asks[0].price;
      const highestBid = book.bids[0].price;
      const spreadValue = lowestAsk - highestBid;
      const spreadPercentage = (spreadValue / lowestAsk) * 100;
      setSpread({ value: spreadValue, percentage: spreadPercentage });
    }
    
    // Update order book periodically
    const interval = setInterval(() => {
      const newBook = generateOrderBook(basePrice * (0.99 + Math.random() * 0.02));
      setOrderBook(newBook);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [tokenIn, tokenOut]);

  const handlePriceClick = (price: number) => {
    onPriceClick?.(price);
  };

  const OrderRow = ({ order, type }: { order: OrderBookOrder; type: 'bid' | 'ask' }) => (
    <div 
      className="grid grid-cols-3 gap-2 px-3 py-1.5 text-sm relative cursor-pointer hover:bg-secondary/30 transition-colors"
      onClick={() => handlePriceClick(order.price)}
    >
      {/* Depth visualization */}
      <div 
        className={`absolute inset-y-0 ${type === 'bid' ? 'right-0 bg-green-500/10' : 'left-0 bg-red-500/10'}`}
        style={{ 
          width: `${order.percentage}%`,
          [type === 'bid' ? 'right' : 'left']: 0 
        }}
      />
      
      <span className={`relative z-10 ${type === 'bid' ? 'text-green-500' : 'text-red-500'} font-mono`}>
        {order.price.toFixed(6)}
      </span>
      <span className="relative z-10 text-right font-mono">{order.amount.toLocaleString()}</span>
      <span className="relative z-10 text-right font-mono text-muted-foreground">{order.total.toLocaleString()}</span>
    </div>
  );

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Order Book
        </h3>
        <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1">
          <Button
            size="sm"
            variant={displayMode === 'both' ? 'secondary' : 'ghost'}
            onClick={() => setDisplayMode('both')}
            className="h-6 px-2"
          >
            Both
          </Button>
          <Button
            size="sm"
            variant={displayMode === 'bids' ? 'secondary' : 'ghost'}
            onClick={() => setDisplayMode('bids')}
            className="h-6 px-2 text-green-500"
          >
            <ArrowUp className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={displayMode === 'asks' ? 'secondary' : 'ghost'}
            onClick={() => setDisplayMode('asks')}
            className="h-6 px-2 text-red-500"
          >
            <ArrowDown className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Header */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs text-muted-foreground border-b border-border/50">
        <span>Price ({tokenOut.symbol})</span>
        <span className="text-right">Amount ({tokenIn.symbol})</span>
        <span className="text-right">Total</span>
      </div>
      
      <ScrollArea className="h-[400px]">
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
          <div className="px-3 py-2 bg-secondary/20 border-y border-border/50 flex items-center justify-between">
            <span className="text-sm font-medium">Spread</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-primary">{spread.value.toFixed(6)}</span>
              <span className="text-muted-foreground">({spread.percentage.toFixed(2)}%)</span>
            </div>
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
