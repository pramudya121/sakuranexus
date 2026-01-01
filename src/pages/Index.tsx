import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, Shield, Wallet, BarChart3, Users, Zap, ArrowLeftRight, Coins } from 'lucide-react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [stats, setStats] = useState({
    totalNFTs: 0,
    totalVolume: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    document.title = 'NEXUSAKURA - Premium NFT Marketplace & DEX on Nexus Testnet';
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [nftsResult, activitiesResult] = await Promise.all([
        supabase.from('nfts').select('id', { count: 'exact', head: true }),
        supabase.from('activities').select('price, from_address').eq('activity_type', 'sale'),
      ]);

      const totalNFTs = nftsResult.count || 0;
      const totalVolume = activitiesResult.data?.reduce((sum, a) => sum + parseFloat(a.price || '0'), 0) || 0;
      const uniqueUsers = new Set(activitiesResult.data?.map(a => a.from_address).filter(Boolean)).size;

      setStats({
        totalNFTs,
        totalVolume,
        activeUsers: uniqueUsers || 100,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const features = [
    {
      icon: Sparkles,
      title: 'Mint NFTs',
      description: 'Create unique digital collectibles from your artwork with one click',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: ArrowLeftRight,
      title: 'DEX Trading',
      description: 'Swap tokens instantly with low fees and optimal rates',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Coins,
      title: 'Liquidity & Staking',
      description: 'Earn rewards by providing liquidity or staking your tokens',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Shield,
      title: 'Secure & Fast',
      description: 'Built on Nexus Testnet with audited smart contracts',
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  const dexFeatures = [
    { icon: Zap, title: 'Instant Swaps', desc: 'Trade tokens in seconds' },
    { icon: TrendingUp, title: 'Best Rates', desc: 'Optimal pricing always' },
    { icon: BarChart3, title: 'Analytics', desc: 'Track your portfolio' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
        </div>
        
        <div className="relative container mx-auto px-4 text-center z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary">
                Live on Nexus Testnet
              </span>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight animate-fade-in-up stagger-1">
              Trade, Collect & Earn
              <br />
              <span className="gradient-text">with NEXUSAKURA</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-2">
              The premier NFT marketplace and decentralized exchange. 
              Mint, trade, and stake your digital assets with the elegance of Sakura.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in-up stagger-3">
              <Link to="/marketplace">
                <Button size="lg" className="btn-hero text-base px-8 py-6 h-auto rounded-xl">
                  Explore Marketplace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/dex/swap">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 h-auto rounded-xl border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                  Launch DEX
                  <ArrowLeftRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 pt-12 max-w-2xl mx-auto animate-fade-in-up stagger-4">
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold gradient-text">
                  {stats.totalNFTs > 0 ? stats.totalNFTs.toLocaleString() : '10K+'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">NFTs Created</div>
              </div>
              <div className="text-center p-4 border-x border-border/50">
                <div className="text-3xl md:text-4xl font-bold gradient-text">
                  {stats.totalVolume > 0 ? `${(stats.totalVolume / 1000).toFixed(0)}K` : '500K+'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Volume Traded</div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl md:text-4xl font-bold gradient-text">
                  {stats.activeUsers > 0 ? stats.activeUsers.toLocaleString() : '5K+'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Active Users</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-sakura-soft opacity-50" />
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete ecosystem for digital assets on Nexus blockchain
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-elegant animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEX Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                  Decentralized Exchange
                </span>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Trade with
                  <span className="gradient-text"> Zero Limits</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Swap any token instantly. Provide liquidity and earn fees. 
                  Stake your assets for additional rewards. All in one platform.
                </p>
                
                <div className="space-y-4 mb-8">
                  {dexFeatures.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <Link to="/dex/swap">
                  <Button className="btn-hero px-8 py-6 h-auto rounded-xl">
                    Start Trading
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              
              {/* DEX Preview Card */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
                <div className="relative glass rounded-2xl p-6 border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-semibold">Swap</span>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-2">From</div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">1,000</span>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background">
                          <div className="w-6 h-6 rounded-full bg-gradient-sakura" />
                          <span className="font-medium">NEX</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center -my-1">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
                        <ArrowLeftRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-2">To</div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">2,450</span>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
                          <span className="font-medium">NXSA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-6 btn-hero h-12 rounded-xl">
                    Connect Wallet
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              Join thousands of creators and traders on the NEXUSAKURA platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/mint">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-base px-8 py-6 h-auto rounded-xl font-semibold shadow-xl">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Create NFT
                </Button>
              </Link>
              <Link to="/dex/liquidity">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-base px-8 py-6 h-auto rounded-xl font-semibold">
                  <Wallet className="mr-2 w-5 h-5" />
                  Add Liquidity
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-sakura flex items-center justify-center shadow-sakura">
                <span className="text-white text-lg">🌸</span>
              </div>
              <span className="text-xl font-bold gradient-text">NEXUSAKURA</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 NEXUSAKURA. Built on Nexus Testnet
            </p>
            <div className="flex items-center gap-6">
              <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Marketplace
              </Link>
              <Link to="/dex/swap" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                DEX
              </Link>
              <Link to="/analytics" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
