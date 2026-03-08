import { useState, memo, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import SwapBox from '@/components/dex/SwapBox';
import DEXNavigation from '@/components/dex/DEXNavigation';
import TradingChart from '@/components/dex/TradingChart';
import RealTimePriceBar from '@/components/dex/RealTimePriceBar';
import GasEstimator from '@/components/dex/GasEstimator';
import { useTokenPrice } from '@/hooks/usePriceWebSocket';
import { 
  ArrowLeftRight, TrendingUp, TrendingDown, ChevronDown, ChevronUp, 
  LineChart, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';

const Swap = memo(() => {
  const [showChart, setShowChart] = useState(false);
  const chartTokenIn = useMemo<Token>(() => DEFAULT_TOKENS[0], []);
  const chartTokenOut = useMemo<Token>(() => DEFAULT_TOKENS[2], []);
  
  const tokenInPrice = useTokenPrice(chartTokenIn);
  const tokenOutPrice = useTokenPrice(chartTokenOut);
  
  const exchangeRate = tokenInPrice.price > 0 && tokenOutPrice.price > 0 
    ? (tokenInPrice.price / tokenOutPrice.price).toFixed(4)
    : '0.00';

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      {/* Price Ticker - sticky below nav */}
      <div className="sticky top-16 z-40">
        <RealTimePriceBar />
      </div>
      
      <main className="container mx-auto px-4 pt-6 pb-12">
        <DEXNavigation />
        
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <ArrowLeftRight className="w-4 h-4" />
            NEXUSAKURA DEX
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Swap Tokens</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Trade tokens instantly with low fees on Nexus Testnet
          </p>
        </div>

        {/* Market Overview - Compact */}
        <div className="max-w-lg mx-auto mb-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {chartTokenIn.logoURI && (
                    <img src={chartTokenIn.logoURI} alt={chartTokenIn.symbol} className="w-8 h-8 rounded-full ring-2 ring-background" />
                  )}
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      {chartTokenIn.symbol}/{chartTokenOut.symbol}
                      {tokenInPrice.isConnected && (
                        <span className="text-[10px] text-green-500 flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                          <Radio className="w-2.5 h-2.5" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">${tokenInPrice.price.toFixed(4)}</span>
                      <span className={tokenInPrice.change24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {tokenInPrice.change24h >= 0 ? '+' : ''}{tokenInPrice.change24h.toFixed(2)}%
                      </span>
                      <span>Rate: 1 {chartTokenIn.symbol} = {exchangeRate} {chartTokenOut.symbol}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <GasEstimator compact />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChart(!showChart)}
                    className="gap-1 h-8 text-xs"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    {showChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart (collapsible) */}
        {showChart && (
          <div className="max-w-5xl mx-auto mb-8 animate-fade-in">
            <TradingChart tokenIn={chartTokenIn} tokenOut={chartTokenOut} />
          </div>
        )}

        {/* Swap Box - Primary Focus */}
        <div className="max-w-lg mx-auto mb-16">
          <SwapBox />
        </div>
      </main>
    </div>
  );
});

Swap.displayName = 'Swap';

export default Swap;
