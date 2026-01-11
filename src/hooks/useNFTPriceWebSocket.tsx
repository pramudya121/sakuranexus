import { useState, useEffect, useCallback, useRef } from 'react';

export interface NFTPriceData {
  nftId: string;
  tokenId: number;
  price: number;
  previousPrice: number;
  change24h: number;
  volume24h: number;
  lastSalePrice: number;
  floorPrice: number;
  lastUpdate: number;
}

interface NFTPriceState {
  isConnected: boolean;
  prices: Map<string, NFTPriceData>;
  error: string | null;
}

// Simulated NFT price feed for real-time updates
class NFTPriceSimulator {
  private prices: Map<string, NFTPriceData> = new Map();
  private subscribers: Set<(prices: Map<string, NFTPriceData>) => void> = new Set();
  private interval: NodeJS.Timeout | null = null;
  private initialized = false;

  initializeWithNFTs(nfts: { id: string; tokenId: number; price?: string }[]) {
    if (this.initialized && this.prices.size > 0) return;
    
    nfts.forEach(nft => {
      const basePrice = parseFloat(nft.price || '0') || (Math.random() * 10 + 0.5);
      this.prices.set(nft.id, {
        nftId: nft.id,
        tokenId: nft.tokenId,
        price: basePrice,
        previousPrice: basePrice,
        change24h: (Math.random() - 0.5) * 20,
        volume24h: Math.random() * 100,
        lastSalePrice: basePrice * (0.9 + Math.random() * 0.2),
        floorPrice: basePrice * 0.8,
        lastUpdate: Date.now(),
      });
    });
    this.initialized = true;
  }

  start() {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.prices.forEach((data, nftId) => {
        // Simulate price movements with varying volatility
        const volatility = 0.005; // 0.5% max change per tick
        const change = (Math.random() - 0.5) * volatility;
        const previousPrice = data.price;
        const newPrice = Math.max(0.01, data.price * (1 + change));

        this.prices.set(nftId, {
          ...data,
          previousPrice,
          price: newPrice,
          change24h: data.change24h + change * 100,
          volume24h: data.volume24h + Math.random() * 0.5,
          lastUpdate: Date.now(),
        });
      });

      // Notify subscribers
      this.subscribers.forEach((callback) => callback(new Map(this.prices)));
    }, 2000); // Update every 2 seconds
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  subscribe(callback: (prices: Map<string, NFTPriceData>) => void) {
    this.subscribers.add(callback);
    // Send initial prices immediately
    callback(new Map(this.prices));
    return () => this.subscribers.delete(callback);
  }

  getPrice(nftId: string): NFTPriceData | undefined {
    return this.prices.get(nftId);
  }

  updatePrice(nftId: string, newPrice: number) {
    const existing = this.prices.get(nftId);
    if (existing) {
      this.prices.set(nftId, {
        ...existing,
        previousPrice: existing.price,
        price: newPrice,
        lastUpdate: Date.now(),
      });
      this.subscribers.forEach((callback) => callback(new Map(this.prices)));
    }
  }
}

// Singleton instance
let nftPriceSimulator: NFTPriceSimulator | null = null;

export const getNFTPriceSimulator = () => {
  if (!nftPriceSimulator) {
    nftPriceSimulator = new NFTPriceSimulator();
  }
  return nftPriceSimulator;
};

export const useNFTPriceWebSocket = (nfts?: { id: string; tokenId: number; price?: string }[]) => {
  const [state, setState] = useState<NFTPriceState>({
    isConnected: false,
    prices: new Map(),
    error: null,
  });

  useEffect(() => {
    const simulator = getNFTPriceSimulator();
    
    if (nfts && nfts.length > 0) {
      simulator.initializeWithNFTs(nfts);
    }
    
    simulator.start();

    const unsubscribe = simulator.subscribe((prices) => {
      setState({
        isConnected: true,
        prices,
        error: null,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [nfts?.map(n => n.id).join(',')]);

  const getPrice = useCallback((nftId: string) => {
    return state.prices.get(nftId);
  }, [state.prices]);

  const updatePrice = useCallback((nftId: string, newPrice: number) => {
    const simulator = getNFTPriceSimulator();
    simulator.updatePrice(nftId, newPrice);
  }, []);

  return {
    ...state,
    getPrice,
    updatePrice,
  };
};

// Hook for single NFT price with real-time updates
export const useSingleNFTPrice = (nftId: string | null, initialPrice?: number) => {
  const [priceData, setPriceData] = useState<NFTPriceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!nftId) return;

    const simulator = getNFTPriceSimulator();
    
    // Initialize if not exists
    if (!simulator.getPrice(nftId) && initialPrice) {
      simulator.initializeWithNFTs([{ id: nftId, tokenId: 0, price: String(initialPrice) }]);
    }
    
    simulator.start();

    const unsubscribe = simulator.subscribe((prices) => {
      const data = prices.get(nftId);
      if (data) {
        setPriceData(data);
        setIsConnected(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [nftId, initialPrice]);

  const priceChange = priceData ? priceData.price - priceData.previousPrice : 0;
  const priceChangePercent = priceData && priceData.previousPrice > 0 
    ? ((priceData.price - priceData.previousPrice) / priceData.previousPrice) * 100 
    : 0;

  return {
    price: priceData?.price ?? initialPrice ?? 0,
    previousPrice: priceData?.previousPrice ?? initialPrice ?? 0,
    change24h: priceData?.change24h ?? 0,
    volume24h: priceData?.volume24h ?? 0,
    floorPrice: priceData?.floorPrice ?? 0,
    lastSalePrice: priceData?.lastSalePrice ?? 0,
    priceChange,
    priceChangePercent,
    isConnected,
    lastUpdate: priceData?.lastUpdate ?? 0,
    isUp: priceChange > 0,
    isDown: priceChange < 0,
  };
};

export type { NFTPriceState };
