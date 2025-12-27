import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';

interface Trade {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  time: Date;
}

interface RecentTradesProps {
  tokenIn: Token;
  tokenOut: Token;
}

// Generate mock trades for demonstration
const generateMockTrades = (tokenIn: Token, tokenOut: Token): Trade[] => {
  const trades: Trade[] = [];
  const basePrice = 0.85 + Math.random() * 0.3;
  const now = Date.now();
  
  for (let i = 0; i < 20; i++) {
    const type = Math.random() > 0.5 ? 'buy' : 'sell';
    const priceVariation = (Math.random() - 0.5) * 0.02;
    const price = basePrice * (1 + priceVariation);
    const amount = 10 + Math.random() * 1000;
    
    trades.push({
      id: `trade-${i}`,
      type,
      price: Number(price.toFixed(6)),
      amount: Number(amount.toFixed(4)),
      total: Number((price * amount).toFixed(4)),
      time: new Date(now - i * 30000 - Math.random() * 30000), // Random time in last 10 minutes
    });
  }
  
  return trades.sort((a, b) => b.time.getTime() - a.time.getTime());
};

const RecentTrades = ({ tokenIn, tokenOut }: RecentTradesProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    // Generate initial trades
    setTrades(generateMockTrades(tokenIn, tokenOut));
    
    // Simulate new trades coming in
    const interval = setInterval(() => {
      setTrades(prev => {
        const basePrice = prev[0]?.price || 0.85;
        const priceVariation = (Math.random() - 0.5) * 0.01;
        const newTrade: Trade = {
          id: `trade-${Date.now()}`,
          type: Math.random() > 0.5 ? 'buy' : 'sell',
          price: Number((basePrice * (1 + priceVariation)).toFixed(6)),
          amount: Number((10 + Math.random() * 500).toFixed(4)),
          total: 0,
          time: new Date(),
        };
        newTrade.total = Number((newTrade.price * newTrade.amount).toFixed(4));
        
        return [newTrade, ...prev.slice(0, 19)];
      });
    }, 5000 + Math.random() * 10000); // Random interval 5-15 seconds
    
    return () => clearInterval(interval);
  }, [tokenIn, tokenOut]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Recent Trades
        </h3>
      </div>
      
      {/* Header */}
      <div className="grid grid-cols-4 gap-2 px-4 py-2 text-xs text-muted-foreground border-b border-border/50">
        <span>Price ({tokenOut.symbol})</span>
        <span className="text-right">Amount ({tokenIn.symbol})</span>
        <span className="text-right">Total ({tokenOut.symbol})</span>
        <span className="text-right">Time</span>
      </div>
      
      <ScrollArea className="h-[300px]">
        <div className="divide-y divide-border/30">
          {trades.map((trade) => (
            <div 
              key={trade.id}
              className="grid grid-cols-4 gap-2 px-4 py-2 text-sm hover:bg-secondary/20 transition-colors"
            >
              <div className={`flex items-center gap-1 ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                {trade.type === 'buy' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {trade.price.toFixed(6)}
              </div>
              <span className="text-right font-mono">{trade.amount.toLocaleString()}</span>
              <span className="text-right font-mono text-muted-foreground">{trade.total.toLocaleString()}</span>
              <span className="text-right text-muted-foreground">{formatTime(trade.time)}</span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default RecentTrades;
