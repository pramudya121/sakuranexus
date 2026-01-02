import { useEffect, useState, memo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Sparkles, TrendingUp, Shield, Wallet, BarChart3, Zap, ArrowLeftRight, Coins, Star, ChevronDown, Image, Users, Droplets } from 'lucide-react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { supabase } from '@/integrations/supabase/client';
import sakuraHeroBg from '@/assets/sakura-hero-bg.jpg';
import sakuraLogo from '@/assets/sakura-logo.png';

const Index = memo(function Index() {
  const [stats, setStats] = useState({
    totalNFTs: 0,
    totalVolume: 0,
    activeUsers: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    document.title = 'NEXUSAKURA - Premium NFT Marketplace & DEX on Nexus Testnet';
    fetchStats();
    setIsLoaded(true);
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
      icon: Image,
      title: 'NFT Marketplace',
      description: 'Mint, buy, sell, and trade unique digital collectibles with ease',
      link: '/marketplace',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: ArrowLeftRight,
      title: 'DEX Trading',
      description: 'Swap tokens instantly with the best rates and lowest fees',
      link: '/dex/swap',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: Droplets,
      title: 'Liquidity Pools',
      description: 'Provide liquidity and earn passive income from trading fees',
      link: '/dex/liquidity',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Coins,
      title: 'Staking Rewards',
      description: 'Stake your tokens and earn attractive APR rewards',
      link: '/dex/staking',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const quickStats = [
    { label: 'Total NFTs', value: stats.totalNFTs > 0 ? stats.totalNFTs.toLocaleString() : '10K+', icon: Image },
    { label: 'Volume Traded', value: stats.totalVolume > 0 ? `${(stats.totalVolume / 1000).toFixed(0)}K` : '500K+', icon: TrendingUp },
    { label: 'Active Users', value: stats.activeUsers > 0 ? stats.activeUsers.toLocaleString() : '5K+', icon: Users },
    { label: 'Total Pools', value: '50+', icon: Droplets },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SakuraFalling />
      <Navigation />
      
      {/* Hero Section with Sakura Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Sakura Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${sakuraHeroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-soft" />
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[150px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-400/10 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 text-center z-10 pt-20">
          <div className={`max-w-5xl mx-auto space-y-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Logo */}
            <div className="flex justify-center mb-6 animate-fade-in-up">
              <div className="relative">
                <img 
                  src={sakuraLogo} 
                  alt="NEXUSAKURA" 
                  className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl"
                />
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl -z-10" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/30 backdrop-blur-sm animate-fade-in-up stagger-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-primary">
                🌸 Live on Nexus Testnet
              </span>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight animate-fade-in-up stagger-2">
              <span className="text-foreground">Trade & Collect</span>
              <br />
              <span className="gradient-text">Digital Art</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up stagger-3">
              The premier NFT marketplace and decentralized exchange on Nexus blockchain. 
              Experience the beauty of <span className="text-primary font-medium">Sakura</span> while trading.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 animate-fade-in-up stagger-4">
              <Link to="/marketplace">
                <Button size="lg" className="btn-hero text-base px-10 py-7 h-auto rounded-2xl text-lg group">
                  <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Explore NFTs
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/dex/swap">
                <Button size="lg" variant="outline" className="text-base px-10 py-7 h-auto rounded-2xl text-lg border-2 hover:bg-primary/10 hover:border-primary transition-all group backdrop-blur-sm">
                  <ArrowLeftRight className="mr-2 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  Launch DEX
                </Button>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-16 max-w-4xl mx-auto animate-fade-in-up stagger-5">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div 
                    key={index}
                    className="glass rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300"
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl md:text-3xl font-bold gradient-text">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
          <ChevronDown className="w-8 h-8 text-muted-foreground/50" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-sakura-soft">
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              Platform Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything in <span className="gradient-text">One Place</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete ecosystem for digital assets - from NFTs to DeFi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link to={feature.link} key={index}>
                  <Card 
                    className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-elegant h-full cursor-pointer overflow-hidden"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Gradient Overlay on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                    
                    <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* DEX Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                  <Zap className="w-4 h-4" />
                  Decentralized Exchange
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Trade with
                  <span className="gradient-text"> Zero Limits</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  Swap any token instantly. Provide liquidity and earn fees. 
                  Stake your assets for additional rewards. All in one beautiful platform.
                </p>
                
                <div className="space-y-4 mb-8">
                  {[
                    { icon: Zap, title: 'Instant Swaps', desc: 'Trade tokens in seconds with optimal routing' },
                    { icon: TrendingUp, title: 'Best Rates', desc: 'Always get the best prices across pools' },
                    { icon: Shield, title: 'Fully Secure', desc: 'Audited contracts on Nexus blockchain' },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex gap-4">
                  <Link to="/dex/swap">
                    <Button className="btn-hero px-8 py-6 h-auto rounded-xl">
                      Start Trading
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/dex/pools">
                    <Button variant="outline" className="px-8 py-6 h-auto rounded-xl">
                      View Pools
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* DEX Preview Card */}
              <div className="relative order-1 lg:order-2">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-3xl -z-10" />
                <div className="glass rounded-3xl p-8 border border-border/50 shadow-elegant">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-xl font-bold">Swap</span>
                    <div className="flex gap-2">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors cursor-pointer">
                        <Zap className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="text-sm text-muted-foreground mb-2">From</div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold">1,000</span>
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-background border border-border/50">
                          <div className="w-8 h-8 rounded-full bg-gradient-sakura" />
                          <span className="font-semibold">NEX</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center -my-2 relative z-10">
                      <div className="w-12 h-12 rounded-xl bg-card border-4 border-background flex items-center justify-center shadow-lg hover:rotate-180 transition-transform duration-500 cursor-pointer">
                        <ArrowLeftRight className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="text-sm text-muted-foreground mb-2">To</div>
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-green-500">2,450</span>
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-background border border-border/50">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-purple-500" />
                          <span className="font-semibold">NXSA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-6 btn-hero h-14 rounded-xl text-lg">
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
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Begin? 🌸
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              Join thousands of creators and traders on the NEXUSAKURA platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/mint">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-base px-10 py-7 h-auto rounded-2xl font-semibold shadow-xl hover:scale-105 transition-transform">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Create NFT
                </Button>
              </Link>
              <Link to="/dex/liquidity">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-base px-10 py-7 h-auto rounded-2xl font-semibold">
                  <Wallet className="mr-2 w-5 h-5" />
                  Add Liquidity
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={sakuraLogo} alt="NEXUSAKURA" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold gradient-text">NEXUSAKURA</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 NEXUSAKURA. Built with 🌸 on Nexus Testnet
            </p>
            <div className="flex items-center gap-8">
              <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Marketplace
              </Link>
              <Link to="/dex/swap" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                DEX
              </Link>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default Index;
