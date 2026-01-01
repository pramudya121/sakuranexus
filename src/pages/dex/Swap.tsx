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
import { ArrowLeftRight, TrendingUp, Shield, Zap, ChevronDown, ChevronUp, LayoutGrid, Maximize2, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Swap = () => {
  const [showChart, setShowChart] = useState(true);
  const [chartTokenIn, setChartTokenIn] = useState<Token>(DEFAULT_TOKENS[0]);
  const [chartTokenOut, setChartTokenOut] = useState<Token>(DEFAULT_TOKENS[2]);
  const [layout, setLayout] = useState<'standard' | 'pro'>('standard');

  const handleTokenChange = useCallback((tokenIn: Token, tokenOut: Token) => {
    setChartTokenIn(tokenIn);
    setChartTokenOut(tokenOut);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      {/* Price Ticker */}
      <div className="fixed top-16 left-0 right-0 z-40">
        <RealTimePriceBar />
      </div>
      
      <main className="container mx-auto px-4 pt-28 pb-12">
        {/* DEX Navigation */}
        <DEXNavigation />
        
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <ArrowLeftRight className="w-4 h-4" />
            NEXUSAKURA DEX
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Swap Tokens</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Trade tokens instantly with low fees. Powered by automated market maker technology.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChart(!showChart)}
            className="gap-2 rounded-lg"
          >
            <LineChart className="w-4 h-4" />
            {showChart ? 'Hide Chart' : 'Show Chart'}
            {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={layout === 'standard' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setLayout('standard')}
              className="gap-2 rounded-md"
            >
              <LayoutGrid className="w-4 h-4" />
              Standard
            </Button>
            <Button
              variant={layout === 'pro' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setLayout('pro')}
              className="gap-2 rounded-md"
            >
              <Maximize2 className="w-4 h-4" />
              Pro
            </Button>
          </div>
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
          <div className="max-w-4xl mx-auto mb-16">
            <div className="grid lg:grid-cols-5 gap-6">
              {/* Swap Box - Takes more space */}
              <div className="lg:col-span-3">
                <SwapBox />
              </div>
              {/* Transaction History */}
              <div className="lg:col-span-2">
                <TransactionHistory />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto mb-16">
            <div className="grid lg:grid-cols-12 gap-4">
              {/* Left Column - Order Book */}
              <div className="lg:col-span-3 space-y-4">
                <OrderBook tokenIn={chartTokenIn} tokenOut={chartTokenOut} />
              </div>
              
              {/* Center Column - Swap & Limit Orders */}
              <div className="lg:col-span-5 space-y-4">
                <Tabs defaultValue="swap" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="swap">Market</TabsTrigger>
                    <TabsTrigger value="limit">Limit</TabsTrigger>
                  </TabsList>
                  <TabsContent value="swap">
                    <SwapBox />
                  </TabsContent>
                  <TabsContent value="limit">
                    <LimitOrderPanel />
                  </TabsContent>
                </Tabs>
                
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
          </div>
        )}

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Instant Swaps', desc: 'Trade tokens instantly with no order book required' },
              { icon: TrendingUp, title: 'Best Rates', desc: 'Get optimal exchange rates with minimal price impact' },
              { icon: Shield, title: 'Secure', desc: 'Non-custodial trading directly from your wallet' },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-elegant transition-all duration-300"
                >
                  <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-sakura flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Swap;
