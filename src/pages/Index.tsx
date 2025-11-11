import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, Shield } from 'lucide-react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import sakuraBg from '@/assets/sakura-bg.jpg';

const Index = () => {
  useEffect(() => {
    document.title = 'SakuraNFT - Premium NFT Marketplace on Nexus Testnet';
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: 'Mint Your Art',
      description: 'Create unique NFTs from your digital artwork instantly',
    },
    {
      icon: TrendingUp,
      title: 'Trade & Earn',
      description: 'Buy, sell, and make offers on exclusive NFT collections',
    },
    {
      icon: Shield,
      title: 'Secure & Fast',
      description: 'Built on Nexus Testnet with 2.5% platform fee',
    },
  ];

  return (
    <div className="min-h-screen">
      <SakuraFalling />
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{
          backgroundImage: `url(${sakuraBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90" />
        
        <div className="relative container mx-auto px-4 text-center z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-block px-6 py-2 rounded-full glass mb-4">
              <span className="text-sm font-semibold gradient-text">
                🌸 Welcome to the Future of Digital Art
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Discover, Collect & Sell
              <br />
              <span className="gradient-text">Extraordinary NFTs</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              The premier NFT marketplace on NEXUSLABS Testnet. 
              Create, trade, and own unique digital assets with the beauty of Sakura.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
              <Link to="/marketplace">
                <Button size="lg" className="btn-hero text-lg px-8 py-6">
                  Explore Marketplace
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/mint">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 glass">
                  Create NFT
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="glass rounded-2xl p-6">
                <div className="text-3xl font-bold gradient-text">10K+</div>
                <div className="text-sm text-muted-foreground mt-2">NFTs Minted</div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="text-3xl font-bold gradient-text">5K+</div>
                <div className="text-sm text-muted-foreground mt-2">Active Users</div>
              </div>
              <div className="glass rounded-2xl p-6">
                <div className="text-3xl font-bold gradient-text">2.5%</div>
                <div className="text-sm text-muted-foreground mt-2">Platform Fee</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-sakura-soft">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Choose <span className="gradient-text">SakuraNFT</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the perfect blend of art, technology, and community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="card-hover p-8 rounded-2xl bg-card text-center"
                >
                  <div className="inline-flex p-4 rounded-full bg-gradient-sakura mb-6">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Your NFT Journey Today
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join thousands of creators and collectors on NEXUSLABS Testnet
          </p>
          <Link to="/mint">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 font-bold">
              <Sparkles className="mr-2 w-5 h-5" />
              Mint Your First NFT
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center">
              <span className="text-white text-sm">🌸</span>
            </div>
            <span className="text-lg font-bold gradient-text">SakuraNFT</span>
          </div>
          <p className="text-muted-foreground">
            © 2025 SakuraNFT. Built on NEXUSLABS Testnet with 💖
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
