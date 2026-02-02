import { memo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import LiquidityForm from '@/components/dex/LiquidityForm';
import DEXNavigation from '@/components/dex/DEXNavigation';
import MyPositions from '@/components/dex/MyPositions';
import PoolFavorites from '@/components/dex/PoolFavorites';
import { Card } from '@/components/ui/card';
import { Droplets, Percent, Gift, PiggyBank, ArrowRight, Shield } from 'lucide-react';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import { SpotlightCard, Spotlight } from '@/components/ui/spotlight';

const Liquidity = memo(() => {
  const benefits = [
    {
      icon: Percent,
      title: 'Earn Trading Fees',
      description: 'Earn 0.3% from every trade proportional to your share of the pool',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: Gift,
      title: 'LP Tokens',
      description: 'Receive LP tokens representing your share of the liquidity pool',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      icon: PiggyBank,
      title: 'Passive Income',
      description: 'Your liquidity works for you 24/7 generating trading fees',
      gradient: 'from-amber-500 to-orange-500'
    },
  ];

  const steps = [
    { num: 1, title: 'Select Tokens', desc: 'Choose two tokens you want to provide liquidity for' },
    { num: 2, title: 'Approve Tokens', desc: 'Authorize the smart contract to use your tokens' },
    { num: 3, title: 'Add Liquidity', desc: 'Deposit equal value of both tokens into the pool' },
    { num: 4, title: 'Earn Rewards', desc: 'Start collecting trading fees automatically' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Spotlight Effect */}
      <Spotlight
        className="-top-40 right-0 md:right-60 md:-top-20"
        fill="hsl(335 80% 55%)"
      />

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        <DEXNavigation />
        
        {/* Hero Section with Text Generate Effect */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6 animate-fade-in-up">
            <Droplets className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Liquidity Provider</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up stagger-1">
            <span className="gradient-text">Add Liquidity</span>
          </h1>
          <div className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up stagger-2">
            <TextGenerateEffect
              words="Provide liquidity to earn trading fees. Add tokens to pools and earn rewards from every trade."
              className="font-normal text-lg md:text-xl"
              duration={0.3}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          {/* Left Column - Liquidity Form */}
          <div className="space-y-6 animate-fade-in-up stagger-3">
            <LiquidityForm />
          </div>
          
          {/* Right Column - Positions & Favorites */}
          <div className="space-y-6 animate-fade-in-up stagger-4">
            <MyPositions />
            <PoolFavorites />
          </div>
        </div>

        {/* Benefits Section with Spotlight Cards */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Provide <span className="gradient-text">Liquidity?</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <SpotlightCard 
                  key={index}
                  className="group p-6"
                >
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${benefit.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            How It <span className="gradient-text">Works</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="glass rounded-2xl p-6 text-center border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-elegant h-full">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-xl shadow-sakura">
                    {step.num}
                  </div>
                  <h4 className="font-bold mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="max-w-3xl mx-auto mt-12">
          <Card className="glass border-primary/20 p-6 rounded-2xl">
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
