import { useState, useEffect, useCallback, useRef } from 'react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdate: number;
}

interface WebSocketState {
  isConnected: boolean;
  prices: Map<string, PriceData>;
  error: string | null;
}

// Simulated price feed for demo (replace with real WebSocket in production)
class PriceSimulator {
  private prices: Map<string, PriceData> = new Map();
  private subscribers: Set<(prices: Map<string, PriceData>) => void> = new Set();
  private interval: NodeJS.Timeout | null = null;
  private basePrices: Record<string, number> = {
    NEX: 1.25,
    WNEX: 1.25,
    NXSA: 0.85,
    WETH: 2450.00,
    BNB: 320.50,
    USDC: 1.00,
    USDT: 1.00,
    LINK: 15.75,
    UNI: 8.45,
    AAVE: 95.20,
  };

  constructor() {
    // Initialize prices
    Object.entries(this.basePrices).forEach(([symbol, basePrice]) => {
      this.prices.set(symbol, {
        symbol,
        price: basePrice,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000,
        high24h: basePrice * (1 + Math.random() * 0.05),
        low24h: basePrice * (1 - Math.random() * 0.05),
        lastUpdate: Date.now(),
      });
    });
  }

  start() {
    if (this.interval) return;
    
    this.interval = setInterval(() => {
      // Simulate price movements
      this.prices.forEach((data, symbol) => {
        const volatility = symbol === 'USDC' || symbol === 'USDT' ? 0.0001 : 0.002;
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = data.price * (1 + change);
        
        this.prices.set(symbol, {
          ...data,
          price: newPrice,
          high24h: Math.max(data.high24h, newPrice),
          low24h: Math.min(data.low24h, newPrice),
          change24h: data.change24h + change * 100,
          volume24h: data.volume24h + Math.random() * 1000,
          lastUpdate: Date.now(),
        });
      });

      // Notify subscribers
      this.subscribers.forEach((callback) => callback(new Map(this.prices)));
    }, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  subscribe(callback: (prices: Map<string, PriceData>) => void) {
    this.subscribers.add(callback);
    // Send initial prices immediately
    callback(new Map(this.prices));
    return () => this.subscribers.delete(callback);
  }

  getPrice(symbol: string): PriceData | undefined {
    return this.prices.get(symbol);
  }
}

// Singleton instance
let priceSimulator: PriceSimulator | null = null;

const getPriceSimulator = () => {
  if (!priceSimulator) {
    priceSimulator = new PriceSimulator();
  }
  return priceSimulator;
};

export const usePriceWebSocket = (symbols?: string[]) => {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    prices: new Map(),
    error: null,
  });

  useEffect(() => {
    const simulator = getPriceSimulator();
    simulator.start();

    const unsubscribe = simulator.subscribe((prices) => {
      setState({
        isConnected: true,
        prices: symbols 
          ? new Map([...prices].filter(([key]) => symbols.includes(key)))
          : prices,
        error: null,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [symbols?.join(',')]);

  const getPrice = useCallback((symbol: string) => {
    return state.prices.get(symbol);
  }, [state.prices]);

  return {
    ...state,
    getPrice,
  };
};

// Hook for single token price
export const useTokenPrice = (token: Token | null) => {
  const { prices, isConnected } = usePriceWebSocket(token ? [token.symbol] : []);
  
  const price = token ? prices.get(token.symbol) : undefined;
  
  return {
    price: price?.price ?? 0,
    change24h: price?.change24h ?? 0,
    volume24h: price?.volume24h ?? 0,
    high24h: price?.high24h ?? 0,
    low24h: price?.low24h ?? 0,
    isConnected,
    lastUpdate: price?.lastUpdate ?? 0,
  };
};

// Hook for multiple token prices
export const useMultipleTokenPrices = () => {
  const symbols = DEFAULT_TOKENS.map(t => t.symbol);
  const { prices, isConnected, getPrice } = usePriceWebSocket(symbols);
  
  return {
    prices,
    isConnected,
    getPrice,
  };
};

export type { PriceData };
