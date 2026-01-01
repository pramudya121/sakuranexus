import { useState, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import SwapBox from '@/components/dex/SwapBox';
import DEXNavigation from '@/components/dex/DEXNavigation';
import TransactionHistory from '@/components/dex/TransactionHistory';
import TradingChart from '@/components/dex/TradingChart';
import RecentTrades from '@/components/dex/RecentTrades';
import TokenStats from '@/components/dex/TokenStats';
import OrderBook from '@/components/dex/OrderBook';
import PriceAlerts from '@/components/dex/PriceAlerts';
import LimitOrderPanel from '@/components/dex/LimitOrderPanel';
import RealTimePriceBar from '@/components/dex/RealTimePriceBar';
import { ArrowLeftRight, TrendingUp, Shield, Zap, ChevronDown, ChevronUp, LayoutGrid, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';

const Swap = () => {
  const [showChart, setShowChart] = useState(true);
  const [chartTokenIn, setChartTokenIn] = useState<Token>(DEFAULT_TOKENS[0]); // NEX
  const [chartTokenOut, setChartTokenOut] = useState<Token>(DEFAULT_TOKENS[2]); // NXSA
  const [layout, setLayout] = useState<'standard' | 'pro'>('standard');

  const handleTokenChange = useCallback((tokenIn: Token, tokenOut: Token) => {
    setChartTokenIn(tokenIn);
    setChartTokenOut(tokenOut);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <SakuraFalling />
      <Navigation />
      
      {/* Real-time Price Bar */}
      <div className="fixed top-16 left-0 right-0 z-40">
        <RealTimePriceBar />
      </div>
      
      <main className="container mx-auto px-4 pt-28 pb-12">
        {/* DEX Navigation */}
        <DEXNavigation />
        
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <ArrowLeftRight className="w-4 h-4" />
            <span className="text-sm font-medium">NEXUSAKURA DEX</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Swap Tokens</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Trade tokens instantly with low fees on Nexus Testnet. 
            Powered by automated market maker technology.
          </p>
        </div>

        {/* Layout Toggle & Chart Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChart(!showChart)}
            className="gap-2"
          >
            {showChart ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </Button>
          <Button
            variant={layout === 'pro' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLayout(layout === 'standard' ? 'pro' : 'standard')}
            className="gap-2"
          >
            {layout === 'pro' ? <Maximize2 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
            {layout === 'pro' ? 'Pro View' : 'Standard View'}
          </Button>
        </div>

        {/* Token Stats */}
        <div className="max-w-5xl mx-auto mb-6">
          <TokenStats token={chartTokenIn} />
        </div>

        {/* Trading Chart */}
        {showChart && (
          <div className="max-w-5xl mx-auto mb-8 animate-fade-in">
            <TradingChart tokenIn={chartTokenIn} tokenOut={chartTokenOut} />
          </div>
        )}

        {/* Main Content */}
        {layout === 'standard' ? (
          /* Standard Layout */
          <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
            <SwapBox />
            <TransactionHistory />
          </div>
        ) : (
          /* Pro Layout with Order Book and Recent Trades */
          <div className="grid lg:grid-cols-12 gap-4 max-w-[1600px] mx-auto mb-16">
            {/* Left Column - Order Book */}
            <div className="lg:col-span-3">
              <OrderBook tokenIn={chartTokenIn} tokenOut={chartTokenOut} />
            </div>
            
            {/* Center Column - Swap Box & History */}
            <div className="lg:col-span-5 space-y-4">
              <SwapBox />
              <LimitOrderPanel />
              <div className="grid md:grid-cols-2 gap-4">
                <TransactionHistory />
                <PriceAlerts />
              </div>
            </div>
            
            {/* Right Column - Recent Trades */}
            <div className="lg:col-span-4">
              <RecentTrades tokenIn={chartTokenIn} tokenOut={chartTokenOut} />
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">Instant Swaps</h3>
            <p className="text-sm text-muted-foreground">
              Trade tokens instantly with no order book required
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">Best Rates</h3>
            <p className="text-sm text-muted-foreground">
              Get the best exchange rates with minimal price impact
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">Secure</h3>
            <p className="text-sm text-muted-foreground">
              Non-custodial trading directly from your wallet
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Swap;
