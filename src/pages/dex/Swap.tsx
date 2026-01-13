import { useState, memo, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import SwapBox from '@/components/dex/SwapBox';
import DEXNavigation from '@/components/dex/DEXNavigation';
import TransactionHistory from '@/components/dex/TransactionHistory';
import TradingChart from '@/components/dex/TradingChart';
import TokenStats from '@/components/dex/TokenStats';
import RealTimePriceBar from '@/components/dex/RealTimePriceBar';
import GasEstimator from '@/components/dex/GasEstimator';
import { 
  ArrowLeftRight, TrendingUp, Shield, Zap, ChevronDown, ChevronUp, 
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';

const Swap = memo(() => {
  const [showChart, setShowChart] = useState(true);
  const chartTokenIn = useMemo<Token>(() => DEFAULT_TOKENS[0], []);
  const chartTokenOut = useMemo<Token>(() => DEFAULT_TOKENS[2], []);

  // Mock market stats
  const marketStats = {
    price: '1.523',
    change24h: 5.67,
    high24h: '1.589',
    low24h: '1.421',
    volume24h: '125,432',
  };

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

        {/* Market Overview Strip */}
        <div className="max-w-5xl mx-auto mb-6">
          <Card className="border-border/50 bg-gradient-to-r from-secondary/30 to-transparent">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    {chartTokenIn.logoURI && (
                      <img src={chartTokenIn.logoURI} alt={chartTokenIn.symbol} className="w-10 h-10 rounded-full ring-2 ring-background" />
                    )}
                    <div>
                      <div className="text-lg font-bold">{chartTokenIn.symbol}/{chartTokenOut.symbol}</div>
                      <div className="text-xs text-muted-foreground">Trading Pair</div>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-border hidden md:block" />
                  <div className="hidden md:flex items-center gap-6">
                    <div>
                      <div className="text-xl font-bold">${marketStats.price}</div>
                      <div className={`text-xs flex items-center gap-1 ${marketStats.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {marketStats.change24h >= 0 ? '+' : ''}{marketStats.change24h}%
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">24h High</div>
                      <div className="font-medium">${marketStats.high24h}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">24h Low</div>
                      <div className="font-medium">${marketStats.low24h}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground">24h Volume</div>
                      <div className="font-medium">${marketStats.volume24h}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GasEstimator compact />
                </div>
              </div>
            </CardContent>
          </Card>
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

        {/* Main Content - Clean Layout */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left - Transaction History */}
            <div className="order-2 lg:order-1">
              <TransactionHistory />
            </div>
            
            {/* Center - Main Swap Box */}
            <div className="order-1 lg:order-2">
              <SwapBox />
            </div>
            
            {/* Right - Empty for clean look or additional info */}
            <div className="order-3 hidden lg:block">
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Fast & Secure</h3>
                  <p className="text-sm text-muted-foreground">
                    Swap tokens instantly with minimal fees and maximum security.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Instant Swaps', desc: 'Trade tokens instantly with no order book required', color: 'from-yellow-500/20 to-orange-500/20' },
              { icon: TrendingUp, title: 'Best Rates', desc: 'Get optimal exchange rates with minimal price impact', color: 'from-green-500/20 to-emerald-500/20' },
              { icon: Shield, title: 'Secure', desc: 'Non-custodial trading directly from your wallet', color: 'from-blue-500/20 to-cyan-500/20' },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group relative p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-elegant transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative">
                    <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-sakura flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
});

Swap.displayName = 'Swap';

export default Swap;
