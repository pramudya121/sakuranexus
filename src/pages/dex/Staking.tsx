import { useState, useCallback, memo } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import DEXNavigation from '@/components/dex/DEXNavigation';
import LPStaking from '@/components/dex/LPStaking';
import StakingAdminPanel from '@/components/dex/StakingAdminPanel';
import StakingStats from '@/components/dex/StakingStats';
import RewardsClaimPanel from '@/components/dex/RewardsClaimPanel';
import StakingCalculator from '@/components/dex/StakingCalculator';
import RewardsTracker from '@/components/dex/RewardsTracker';
import { Card } from '@/components/ui/card';
import { Coins, TrendingUp, Shield, Lock, Wallet, Clock, Percent, Calculator, Gift, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Staking = memo(() => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const features = [
    {
      icon: TrendingUp,
      title: 'High APR',
      description: 'Earn competitive returns on your staked assets',
    },
    {
      icon: Lock,
      title: 'Flexible Lock',
      description: 'Choose from various lock periods to maximize rewards',
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Smart contract audited for your safety',
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
        <DEXNavigation />
        
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            TOKEN STAKING
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">Stake & Earn</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Stake your tokens to earn additional rewards. Lock your assets and earn high APR on your holdings.
          </p>
        </div>

        {/* Stats */}
        <StakingStats refreshTrigger={refreshTrigger} />

        {/* Admin Panel - only visible to contract owner */}
        <StakingAdminPanel />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto mb-16">
          <Tabs defaultValue="pools" className="w-full">
            <TabsList className="w-full max-w-lg mx-auto grid grid-cols-4 mb-8">
              <TabsTrigger value="pools" className="gap-2">
                <Coins className="w-4 h-4" />
                <span className="hidden sm:inline">Pools</span>
              </TabsTrigger>
              <TabsTrigger value="rewards" className="gap-2">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Rewards</span>
              </TabsTrigger>
              <TabsTrigger value="tracker" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Tracker</span>
              </TabsTrigger>
              <TabsTrigger value="calculator" className="gap-2">
                <Calculator className="w-4 h-4" />
                <span className="hidden sm:inline">Calc</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pools">
              <LPStaking onRefresh={handleRefresh} />
            </TabsContent>

            <TabsContent value="rewards">
              <div className="max-w-xl mx-auto">
                <RewardsClaimPanel refreshTrigger={refreshTrigger} onClaimed={handleRefresh} />
              </div>
            </TabsContent>

            <TabsContent value="tracker">
              <div className="max-w-2xl mx-auto">
                <RewardsTracker refreshTrigger={refreshTrigger} />
              </div>
            </TabsContent>

            <TabsContent value="calculator">
              <div className="max-w-md mx-auto">
                <StakingCalculator />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* How It Works */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            How It <span className="gradient-text">Works</span>
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {howItWorks.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative">
                  <Card className="text-center p-6 border-border/50 hover:border-primary/30 transition-all duration-300 h-full">
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
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why <span className="gradient-text">Stake?</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group p-6 border-border/50 hover:border-primary/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
});

Staking.displayName = 'Staking';

export default Staking;
