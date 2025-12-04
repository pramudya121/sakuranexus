import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import SwapBox from '@/components/dex/SwapBox';
import DEXNavigation from '@/components/dex/DEXNavigation';
import { ArrowLeftRight, TrendingUp, Shield, Zap } from 'lucide-react';

const Swap = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* DEX Navigation */}
        <DEXNavigation />
        
        {/* Hero Section */}
        <div className="text-center mb-12">
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

        {/* Swap Interface */}
        <div className="max-w-md mx-auto mb-16">
          <SwapBox />
        </div>

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
