import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import DEXNavigation from '@/components/dex/DEXNavigation';
import LPStaking from '@/components/dex/LPStaking';
import StakingAdminPanel from '@/components/dex/StakingAdminPanel';
import StakingStats from '@/components/dex/StakingStats';
import { Coins, TrendingUp, Shield, Lock } from 'lucide-react';

const Staking = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <SakuraFalling />
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* DEX Navigation */}
        <DEXNavigation />
        
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-medium">TOKEN STAKING</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Stake & Earn</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Stake your individual tokens to earn additional rewards. 
            Lock your assets and earn high APR on your holdings.
          </p>
        </div>

        {/* Statistics Dashboard */}
        <StakingStats />

        {/* Admin Button */}
        <div className="flex justify-center mb-6">
          <StakingAdminPanel />
        </div>

        {/* Main Content - Full Width Grid */}
        <div className="mb-16">
          <LPStaking />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">High APR</h3>
            <p className="text-sm text-muted-foreground">
              Earn competitive returns on your staked assets
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">Flexible Lock</h3>
            <p className="text-sm text-muted-foreground">
              Choose from various lock periods to maximize rewards
            </p>
          </div>
          <div className="glass rounded-xl p-6 text-center border border-border/50">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-sakura flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold mb-2">Secure</h3>
            <p className="text-sm text-muted-foreground">
              Smart contract audited for your safety
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Staking;
