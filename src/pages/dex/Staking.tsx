import { useState, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import DEXNavigation from '@/components/dex/DEXNavigation';
import LPStaking from '@/components/dex/LPStaking';
import StakingAdminPanel from '@/components/dex/StakingAdminPanel';
import StakingStats from '@/components/dex/StakingStats';
import RewardsClaimPanel from '@/components/dex/RewardsClaimPanel';
import { Coins, TrendingUp, Shield, Lock, Wallet, Clock, Percent } from 'lucide-react';

const Staking = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: 'High APR',
      description: 'Earn competitive returns on your staked assets',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Lock,
      title: 'Flexible Lock',
      description: 'Choose from various lock periods to maximize rewards',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Smart contract audited for your safety',
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  const howItWorks = [
    { icon: Wallet, step: '1', title: 'Connect Wallet', desc: 'Connect your wallet to access staking' },
    { icon: Coins, step: '2', title: 'Choose Token', desc: 'Select which token you want to stake' },
    { icon: Clock, step: '3', title: 'Lock Period', desc: 'Choose your preferred lock duration' },
    { icon: Percent, step: '4', title: 'Earn Rewards', desc: 'Start earning rewards immediately' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* DEX Navigation */}
        <DEXNavigation />
        
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Coins className="w-4 h-4" />
            TOKEN STAKING
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Stake & Earn</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Stake your tokens to earn additional rewards. 
            Lock your assets and earn high APR on your holdings.
          </p>
        </div>

        {/* Statistics Dashboard */}
        <div className="mb-8">
          <StakingStats refreshTrigger={refreshTrigger} />
        </div>

        {/* Admin Button */}
        <div className="flex justify-center mb-8">
          <StakingAdminPanel />
        </div>

        {/* Rewards Claim Panel - Prominent Display */}
        <div className="max-w-xl mx-auto mb-8">
          <RewardsClaimPanel refreshTrigger={refreshTrigger} onClaimed={handleRefresh} />
        </div>

        {/* Main Content - Staking Pools */}
        <div className="mb-16">
          <LPStaking onRefresh={handleRefresh} />
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">How It Works</h2>
            <p className="text-muted-foreground">Get started with staking in 4 simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative text-center p-6 rounded-xl bg-card border border-border/50">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                  
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-elegant transition-all duration-300"
                >
                  <div className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
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

export default Staking;
