import { useEffect, useState, memo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, Shield, Zap, ArrowLeftRight, Coins, Star, Image, Users, Droplets, Brain, BarChart3, Wallet, Github, Twitter, ExternalLink } from 'lucide-react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import HeroSection from '@/components/HeroSection';
import { SpotlightCard } from '@/components/ui/spotlight';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { Marquee } from '@/components/ui/marquee';
import { supabase } from '@/integrations/supabase/client';

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
    },
    {
      icon: ArrowLeftRight,
      title: 'DEX Trading',
      description: 'Swap tokens instantly with the best rates and lowest fees',
      link: '/dex/swap',
    },
    {
      icon: Droplets,
      title: 'Liquidity Pools',
      description: 'Provide liquidity and earn passive income from trading fees',
      link: '/dex/liquidity',
    },
    {
      icon: Coins,
      title: 'Staking Rewards',
      description: 'Stake your tokens and earn attractive APR rewards',
      link: '/dex/staking',
    },
    {
      icon: Brain,
      title: 'AI Features Hub',
      description: 'AI-powered art generation, price prediction, and analytics',
      link: '/ai-features',
    },
    {
      icon: BarChart3,
      title: 'Portfolio Analytics',
      description: 'Track your holdings, performance, and tax reports in real-time',
      link: '/dashboard',
    },
  ];

  const quickStats = [
    { label: 'Total NFTs', value: stats.totalNFTs > 0 ? stats.totalNFTs : 28, suffix: '+' },
    { label: 'Volume Traded', value: stats.totalVolume > 0 ? Math.round(stats.totalVolume) : 35, suffix: ' NEX' },
    { label: 'Active Users', value: stats.activeUsers > 0 ? stats.activeUsers : 15, suffix: '+' },
    { label: 'Total Pools', value: 6, suffix: '+' },
  ];

  const testimonials = [
    { name: 'CryptoSakura', role: 'NFT Collector', text: 'The best NFT platform on Nexus. Smooth experience and beautiful design!' },
    { name: 'DeFiMaster', role: 'Liquidity Provider', text: 'Earning great yields on my LP positions. The staking rewards are amazing.' },
    { name: 'ArtCreator', role: 'Digital Artist', text: 'AI Art Generator is a game-changer. Minting NFTs has never been easier.' },
    { name: 'TraderX', role: 'DEX Trader', text: 'Fast swaps, low fees, and the trading charts are incredibly useful.' },
    { name: 'BlockchainDev', role: 'Developer', text: 'Clean smart contracts and great UX. This is how Web3 should be built.' },
    { name: 'WhaleWatcher', role: 'Investor', text: 'Portfolio analytics help me track everything in one place. Love it!' },
  ];

  const footerLinks = {
    Platform: [
      { label: 'Marketplace', path: '/marketplace' },
      { label: 'Collections', path: '/collections' },
      { label: 'Auctions', path: '/auctions' },
      { label: 'Mint NFT', path: '/mint' },
    ],
    DeFi: [
      { label: 'Swap', path: '/dex/swap' },
      { label: 'Liquidity', path: '/dex/liquidity' },
      { label: 'Pools', path: '/dex/pools' },
      { label: 'Staking', path: '/dex/staking' },
    ],
    Resources: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Analytics', path: '/analytics' },
      { label: 'AI Hub', path: '/ai-features' },
      { label: 'Guide', path: '/guide' },
    ],
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SakuraFalling />
      <Navigation />
      
      {/* Hero Section */}
      <HeroSection stats={quickStats} isLoaded={isLoaded} />

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Everything in <span className="gradient-text">One Place</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete ecosystem for digital assets — from NFTs to DeFi to AI
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link to={feature.link} key={index}>
                  <SpotlightCard className="h-full cursor-pointer group">
                    <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                    
                    <div className="flex items-center gap-1 mt-4 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Get Started <ArrowRight className="w-4 h-4" />
                    </div>
                  </SpotlightCard>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative overflow-hidden bg-gradient-sakura-soft">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Wallet className="w-4 h-4" />
              Getting Started
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              { step: '01', title: 'Connect Wallet', desc: 'Connect your MetaMask or any Web3 wallet to the Nexus Testnet', icon: Wallet },
              { step: '02', title: 'Explore & Trade', desc: 'Browse NFTs, swap tokens, provide liquidity, or stake for rewards', icon: ArrowLeftRight },
              { step: '03', title: 'Earn & Grow', desc: 'Collect rare NFTs, earn trading fees, and grow your portfolio', icon: TrendingUp },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative group">
                  <div className="glass rounded-2xl p-8 text-center hover:border-primary/30 border border-transparent transition-all duration-300 hover:shadow-elegant">
                    <div className="text-6xl font-bold gradient-text opacity-20 mb-4">{item.step}</div>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-8 h-8 text-primary/30" />
                    </div>
                  )}
                </div>
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
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
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
                <BackgroundGradient className="rounded-3xl p-8">
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
                        <span className="text-3xl font-bold text-primary">2,450</span>
                        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-background border border-border/50">
                          <div className="w-8 h-8 rounded-full bg-primary/20" />
                          <span className="font-semibold">NXSA</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-6 btn-hero h-14 rounded-xl text-lg">
                    Connect Wallet
                  </Button>
                </BackgroundGradient>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials / Community Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              Community
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by <span className="gradient-text">Traders</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users who trust NEXUSAKURA for their digital assets
            </p>
          </div>

          <Marquee className="[--duration:40s]" pauseOnHover>
            {testimonials.map((t, i) => (
              <div key={i} className="mx-4 w-80">
                <div className="glass rounded-2xl p-6 border border-primary/10 hover:border-primary/30 transition-colors h-full">
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary-foreground/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Ready to Begin? 🌸
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-10 leading-relaxed">
              Join thousands of creators and traders on the NEXUSAKURA platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/mint">
                <Button size="lg" className="bg-background text-primary hover:bg-background/90 px-10 py-7 h-auto rounded-2xl text-lg font-semibold">
                  <Sparkles className="mr-2 w-5 h-5" />
                  Create NFT
                </Button>
              </Link>
              <Link to="/dex/liquidity">
                <Button size="lg" variant="outline" className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-10 py-7 h-auto rounded-2xl text-lg">
                  <Droplets className="mr-2 w-5 h-5" />
                  Add Liquidity
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold gradient-text">NEXUSAKURA</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                The premier NFT marketplace and DEX on Nexus blockchain. Trade, stake, and earn with Sakura.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors">
                  <Github className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h4 className="font-semibold text-sm mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.path}>
                      <Link 
                        to={link.path} 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} NEXUSAKURA. All rights reserved.
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live on Nexus Testnet
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
});

export default Index;
