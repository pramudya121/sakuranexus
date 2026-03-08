import { memo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import LiquidityForm from '@/components/dex/LiquidityForm';
import DEXNavigation from '@/components/dex/DEXNavigation';
import { Card } from '@/components/ui/card';
import { Droplets, Percent, Gift, PiggyBank, ArrowRight, Shield } from 'lucide-react';

const Liquidity = memo(() => {
  const benefits = [
    {
      icon: Percent,
      title: 'Earn Trading Fees',
      description: 'Earn 0.3% from every trade proportional to your share of the pool',
    },
    {
      icon: Gift,
      title: 'LP Tokens',
      description: 'Receive LP tokens representing your share of the liquidity pool',
    },
    {
      icon: PiggyBank,
      title: 'Passive Income',
      description: 'Your liquidity works for you 24/7 generating trading fees',
    },
  ];

  const steps = [
    { num: 1, title: 'Select Tokens', desc: 'Choose two tokens you want to provide liquidity for' },
    { num: 2, title: 'Approve Tokens', desc: 'Authorize the smart contract to use your tokens' },
    { num: 3, title: 'Add Liquidity', desc: 'Deposit equal value of both tokens into the pool' },
    { num: 4, title: 'Earn Rewards', desc: 'Start collecting trading fees automatically' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <DEXNavigation />
        
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Droplets className="w-4 h-4" />
            LIQUIDITY PROVIDER
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Add Liquidity</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Provide liquidity to earn trading fees. Add tokens to pools and earn rewards from every trade.
          </p>
        </div>

        {/* Liquidity Form - Centered */}
        <div className="max-w-lg mx-auto mb-16">
          <LiquidityForm />
        </div>

        {/* Benefits */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Provide <span className="gradient-text">Liquidity?</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={index}
                  className="group p-6 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-elegant"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            How It <span className="gradient-text">Works</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="p-6 text-center border-border/50 hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-xl shadow-sakura">
                    {step.num}
                  </div>
                  <h4 className="font-bold mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </Card>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="max-w-3xl mx-auto">
          <Card className="border-primary/20 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Secure & Audited</h3>
                <p className="text-muted-foreground text-sm">
                  Our smart contracts are built on battle-tested Uniswap V2 code. Your funds remain in your control at all times through non-custodial liquidity pools.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
});

Liquidity.displayName = 'Liquidity';

export default Liquidity;
