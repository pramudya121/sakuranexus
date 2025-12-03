import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import LiquidityForm from '@/components/dex/LiquidityForm';
import { Droplets, Percent, Gift, PiggyBank } from 'lucide-react';

const Liquidity = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Droplets className="w-4 h-4" />
            <span className="text-sm font-medium">Liquidity Provider</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Add Liquidity</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Provide liquidity to earn trading fees. Add tokens to liquidity pools 
            and earn rewards from every trade.
          </p>
        </div>

        {/* Liquidity Form */}
        <div className="max-w-md mx-auto mb-16">
          <LiquidityForm />
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <Percent className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">Earn Fees</h3>
            <p className="text-sm text-muted-foreground">
              Earn 0.3% from every trade proportional to your share of the pool
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">LP Tokens</h3>
            <p className="text-sm text-muted-foreground">
              Receive LP tokens representing your share of the liquidity pool
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">Passive Income</h3>
            <p className="text-sm text-muted-foreground">
              Your liquidity works for you 24/7 generating trading fees
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Select Tokens</h4>
                <p className="text-sm text-muted-foreground">
                  Choose two tokens you want to provide liquidity for
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Add Liquidity</h4>
                <p className="text-sm text-muted-foreground">
                  Deposit equal value of both tokens into the pool
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Earn Rewards</h4>
                <p className="text-sm text-muted-foreground">
                  Collect trading fees automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Liquidity;
