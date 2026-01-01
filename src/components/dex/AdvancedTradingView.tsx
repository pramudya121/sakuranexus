import { useState, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Settings
} from 'lucide-react';
import TradingChart from './TradingChart';
import OrderBook from './OrderBook';
import RecentTrades from './RecentTrades';
import SwapBox from './SwapBox';
import TokenStats from './TokenStats';
import PriceAlerts from './PriceAlerts';
import TransactionHistory from './TransactionHistory';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';

interface AdvancedTradingViewProps {
  tokenIn?: Token;
  tokenOut?: Token;
  onTokenChange?: (tokenIn: Token, tokenOut: Token) => void;
}

const AdvancedTradingView = ({ 
  tokenIn: initialTokenIn = DEFAULT_TOKENS[0],
  tokenOut: initialTokenOut = DEFAULT_TOKENS[2],
  onTokenChange 
}: AdvancedTradingViewProps) => {
  const [tokenIn, setTokenIn] = useState<Token>(initialTokenIn);
  const [tokenOut, setTokenOut] = useState<Token>(initialTokenOut);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTokenChange = useCallback((newTokenIn: Token, newTokenOut: Token) => {
    setTokenIn(newTokenIn);
    setTokenOut(newTokenOut);
    onTokenChange?.(newTokenIn, newTokenOut);
  }, [onTokenChange]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const priceChange = useMemo(() => {
    // Mock price change data
    return {
      value: 2.45,
      isPositive: true,
    };
  }, []);

  return (
    <div className={`grid gap-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : 'lg:grid-cols-12'}`}>
      {/* Left Panel - Order Book */}
      <div className={`${isFullscreen ? 'hidden' : 'lg:col-span-3'} space-y-4`}>
        <OrderBook tokenIn={tokenIn} tokenOut={tokenOut} />
      </div>

      {/* Center Panel - Chart & Trading */}
      <div className={`${isFullscreen ? 'col-span-full' : 'lg:col-span-6'} space-y-4`}>
        {/* Token Info Header */}
        <Card className="p-4 glass border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-sm ring-2 ring-background">
                  {tokenIn.logoURI ? (
                    <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    tokenIn.symbol.charAt(0)
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-sm -ml-3 ring-2 ring-background">
                  {tokenOut.logoURI ? (
                    <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    tokenOut.symbol.charAt(0)
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold">{tokenIn.symbol}/{tokenOut.symbol}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold gradient-text">1.2345</span>
                  <Badge 
                    variant="secondary" 
                    className={priceChange.isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}
                  >
                    {priceChange.isPositive ? '+' : '-'}{priceChange.value}%
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                className="hover:bg-primary/10"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hover:bg-primary/10"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* Token Stats */}
        <TokenStats token={tokenIn} />

        {/* Chart Tabs */}
        <Card className="glass border-border/50 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
              <TabsList className="bg-transparent">
                <TabsTrigger value="chart" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Chart
                </TabsTrigger>
                <TabsTrigger value="depth" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Depth
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="chart" className="m-0">
              <div className="p-4">
                <TradingChart tokenIn={tokenIn} tokenOut={tokenOut} />
              </div>
            </TabsContent>
            
            <TabsContent value="depth" className="m-0">
              <div className="p-4">
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Depth chart visualization coming soon</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="activity" className="m-0">
              <div className="p-4">
                <TransactionHistory />
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Swap Box */}
        {!isFullscreen && <SwapBox />}
      </div>

      {/* Right Panel - Recent Trades & Alerts */}
      <div className={`${isFullscreen ? 'hidden' : 'lg:col-span-3'} space-y-4`}>
        <RecentTrades tokenIn={tokenIn} tokenOut={tokenOut} />
        <PriceAlerts />
      </div>
    </div>
  );
};

export default AdvancedTradingView;
