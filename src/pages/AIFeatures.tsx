import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AIVisualSearch, 
  AIRecommendations, 
  AIWhaleTracker, 
  AISentimentAnalysis 
} from '@/components/ai';
import { useState, useEffect } from 'react';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, 
  Eye, 
  Lightbulb, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Sparkles,
  Shield,
  DollarSign,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const AIFeatures = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userNFTs, setUserNFTs] = useState<any[]>([]);
  const [availableNFTs, setAvailableNFTs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const account = await getCurrentAccount();
    setWalletAddress(account);

    // Fetch user's NFTs
    if (account) {
      const { data: nfts } = await supabase
        .from('nfts')
        .select('*')
        .eq('owner_address', account.toLowerCase());
      setUserNFTs(nfts || []);
    }

    // Fetch available marketplace NFTs
    const { data: listings } = await supabase
      .from('listings')
      .select(`
        *,
        nfts (*)
      `)
      .eq('active', true)
      .limit(20);

    setAvailableNFTs(listings?.map((l: any) => ({
      token_id: l.token_id,
      name: l.nfts?.name || `NFT #${l.token_id}`,
      price: l.price,
      image_url: l.nfts?.image_url
    })) || []);
  };

  const features = [
    { 
      icon: <Sparkles className="w-6 h-6" />, 
      title: 'AI Art Generator', 
      desc: 'Create unique NFT artwork from text prompts',
      color: 'text-purple-500'
    },
    { 
      icon: <TrendingUp className="w-6 h-6" />, 
      title: 'Rarity Score', 
      desc: 'AI-powered rarity analysis for any NFT',
      color: 'text-blue-500'
    },
    { 
      icon: <Shield className="w-6 h-6" />, 
      title: 'Fake Detection', 
      desc: 'Detect stolen or counterfeit artwork',
      color: 'text-red-500'
    },
    { 
      icon: <DollarSign className="w-6 h-6" />, 
      title: 'Price Prediction', 
      desc: 'ML-based price forecasting',
      color: 'text-green-500'
    },
    { 
      icon: <Activity className="w-6 h-6" />, 
      title: 'Wash Trading', 
      desc: 'Detect market manipulation patterns',
      color: 'text-orange-500'
    },
    { 
      icon: <Brain className="w-6 h-6" />, 
      title: 'Smart Bidding', 
      desc: 'AI-optimized auction strategies',
      color: 'text-pink-500'
    },
  ];

  return (
    <div className="min-h-screen relative">
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(328 85% 55% / 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(320 90% 60% / 0.15) 0%, transparent 50%)',
        }}
      />
      <SakuraFalling />
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6 animate-fade-in-up">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">AI Features Hub</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Leverage cutting-edge AI to analyze, predict, and discover NFTs
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {features.map((feature, i) => (
            <Card key={i} className="card-hover text-center p-4">
              <div className={`${feature.color} mb-2 flex justify-center`}>
                {feature.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="visual-search" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="visual-search" className="gap-2">
              <Eye className="w-4 h-4" />
              Visual Search
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="whale-tracker" className="gap-2">
              <Users className="w-4 h-4" />
              Whale Tracker
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Sentiment
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual-search">
            <div className="grid md:grid-cols-2 gap-6">
              <AIVisualSearch />
              <Card>
                <CardHeader>
                  <CardTitle>How Visual Search Works</CardTitle>
                  <CardDescription>
                    Upload an image to find similar NFTs in the marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Upload Image</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload or paste a URL of the artwork you want to find
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">AI Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Our AI extracts visual features, colors, and style
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Find Matches</h4>
                      <p className="text-sm text-muted-foreground">
                        Discover similar NFTs and get relevant search keywords
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            {walletAddress ? (
              <AIRecommendations
                userAddress={walletAddress}
                userHoldings={userNFTs.map(n => ({ token_id: n.token_id, name: n.name }))}
                availableNFTs={availableNFTs}
              />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Brain className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                  <p className="text-muted-foreground">
                    Connect your wallet to get personalized NFT recommendations
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="whale-tracker">
            <div className="grid md:grid-cols-2 gap-6">
              <AIWhaleTracker collectionName="NEXUSAKURA Collection" />
              <Card>
                <CardHeader>
                  <CardTitle>Understanding Whale Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Whales</strong> are large holders who can significantly impact market prices.
                  </p>
                  <p>
                    <strong className="text-foreground">Accumulation</strong> signals that whales are buying, which may indicate bullish sentiment.
                  </p>
                  <p>
                    <strong className="text-foreground">Distribution</strong> means whales are selling, potentially signaling a market top.
                  </p>
                  <p>
                    <strong className="text-foreground">Concentration Risk</strong> - If top 10 holders control &gt;50%, price manipulation risk is higher.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sentiment">
            <div className="grid md:grid-cols-2 gap-6">
              <AISentimentAnalysis nftOrCollection={{ name: 'NEXUSAKURA NFT Market' }} />
              <Card>
                <CardHeader>
                  <CardTitle>Market Sentiment Explained</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Very Bullish (75-100)</strong> - Strong buying pressure, positive news, high social activity
                  </p>
                  <p>
                    <strong className="text-foreground">Bullish (50-75)</strong> - Generally positive outlook with moderate enthusiasm
                  </p>
                  <p>
                    <strong className="text-foreground">Neutral (25-50)</strong> - Mixed signals, market in consolidation
                  </p>
                  <p>
                    <strong className="text-foreground">Bearish (-25 to 25)</strong> - Negative sentiment, declining interest
                  </p>
                  <p>
                    <strong className="text-foreground">Very Bearish (-100 to -25)</strong> - Strong selling pressure, negative news
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIFeatures;
