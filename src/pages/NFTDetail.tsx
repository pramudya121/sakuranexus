import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { buyNFT, makeOffer, acceptOffer, cancelOffer } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Tag, ShoppingCart, Clock, CheckCircle2, X, Activity, TrendingUp, Share2, Brain, Sparkles, User, Hash, Image } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SocialShareMenu from '@/components/SocialShareMenu';
import LivePriceIndicator from '@/components/nft/LivePriceIndicator';
import { AIRarityScore, AIFakeDetection, AIPricePrediction, AISentimentAnalysis, AIDynamicPricing } from '@/components/ai';

interface NFT {
  id: string;
  token_id: number;
  name: string;
  description: string | null;
  image_url: string;
  owner_address: string;
}

interface Listing {
  listing_id: number;
  price: string;
  active: boolean;
}

interface Offer {
  id: string;
  offer_id: number;
  offerer_address: string;
  offer_price: string;
  status: string;
  created_at: string;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  from_address: string | null;
  to_address: string | null;
  price: string | null;
  created_at: string;
  transaction_hash: string | null;
}

interface PricePoint {
  date: string;
  price: number;
}

const NFTDetail = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState<NFT | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [account, setAccount] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    checkAndFetchData();
  }, [tokenId]);

  const checkAndFetchData = async () => {
    const currentAccount = await getCurrentAccount();
    setAccount(currentAccount);
    
    if (tokenId) {
      await Promise.all([
        fetchNFTDetails(parseInt(tokenId)),
        fetchListing(parseInt(tokenId)),
        fetchOffers(parseInt(tokenId)),
        fetchActivities(parseInt(tokenId)),
      ]);
    }
    
    setIsLoading(false);
  };

  const fetchNFTDetails = async (token_id: number) => {
    const { data } = await supabase
      .from('nfts')
      .select('*')
      .eq('token_id', token_id)
      .maybeSingle();
    setNft(data);
  };

  const fetchListing = async (token_id: number) => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('token_id', token_id)
      .eq('active', true)
      .maybeSingle();
    setListing(data);
  };

  const fetchOffers = async (token_id: number) => {
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('token_id', token_id)
      .eq('status', 'pending')
      .order('offer_price', { ascending: false });
    setOffers(data || []);
  };

  const fetchActivities = async (token_id: number) => {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('token_id', token_id)
      .order('created_at', { ascending: false })
      .limit(20);
    setActivities(data || []);

    const salesData = (data || [])
      .filter((activity) => 
        (activity.activity_type === 'sale' || activity.activity_type === 'offer_accepted') 
        && activity.price
      )
      .map((activity) => ({
        date: new Date(activity.created_at).toLocaleDateString(),
        price: parseFloat(activity.price || '0'),
      }));
    setPriceHistory(salesData);
  };

  const handleBuy = async () => {
    if (!listing || !account || !nft) return;
    setIsProcessing(true);
    try {
      const result = await buyNFT(listing.listing_id, listing.price, account, nft.token_id);
      if (result.success) {
        toast({ title: 'Purchase Successful!', description: 'NFT transferred to your wallet' });
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        toast({ title: 'Failed', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to purchase NFT', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!offerPrice || !account || !nft) return;
    setIsProcessing(true);
    try {
      const result = await makeOffer(nft.token_id, offerPrice, account);
      if (result.success) {
        toast({ title: 'Offer Submitted!', description: 'Your offer has been sent to the owner' });
        setOfferPrice('');
        checkAndFetchData();
      } else {
        toast({ title: 'Failed', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to make offer', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!account || !nft) {
      toast({ title: 'Error', description: 'Please connect wallet and try again.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await acceptOffer(nft.token_id, offer.offerer_address);
      if (result.success) {
        toast({ title: 'Offer Accepted!', description: 'NFT transferred successfully' });
        checkAndFetchData();
      } else {
        toast({ title: 'Failed', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to accept offer', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOffer = async () => {
    if (!account || !nft) {
      toast({ title: 'Error', description: 'Please connect wallet and try again.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await cancelOffer(nft.token_id);
      if (result.success) {
        toast({ title: 'Offer Cancelled', description: 'Your offer has been withdrawn' });
        checkAndFetchData();
      } else {
        toast({ title: 'Failed', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel offer', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const isOwner = account && nft && account.toLowerCase() === nft.owner_address.toLowerCase();
  const userOffer = offers.find(o => o.offerer_address.toLowerCase() === account?.toLowerCase());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-background">
        <SakuraFalling />
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <div className="max-w-md mx-auto">
            <Image className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-bold mb-2">NFT Not Found</h2>
            <p className="text-muted-foreground mb-6">The NFT you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/marketplace')} className="btn-hero">
              Back to Marketplace
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <div className="grid lg:grid-cols-5 gap-4 sm:gap-8">
          {/* Image Section - 3 cols */}
          <div className="lg:col-span-3 space-y-3 sm:space-y-4">
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-0">
                <div className="aspect-square bg-muted/30 relative">
                  <img 
                    src={nft.image_url} 
                    alt={nft.name}
                    className="w-full h-full object-cover"
                  />
                  {listing && (
                    <Badge className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-primary text-primary-foreground border-0 shadow-lg text-xs sm:text-sm px-2 sm:px-3 py-1">
                      For Sale
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Card className="border-border/50">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <Hash className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-primary mb-1" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Token ID</p>
                  <p className="font-bold text-sm sm:text-lg">#{nft.token_id}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-primary mb-1" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Offers</p>
                  <p className="font-bold text-sm sm:text-lg">{offers.length}</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-2.5 sm:p-4 text-center">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 mx-auto text-primary mb-1" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Trades</p>
                  <p className="font-bold text-sm sm:text-lg">{activities.length}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Details Section - 2 cols */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Main Info Card */}
            <Card className="border-border/50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-1 truncate">{nft.name}</h1>
                    <p className="text-sm text-muted-foreground font-mono">Token #{nft.token_id}</p>
                  </div>
                  <SocialShareMenu
                    title={nft.name}
                    description={nft.description || undefined}
                    image={nft.image_url}
                    type="nft"
                    price={listing?.price}
                  />
                </div>

                {nft.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{nft.description}</p>
                )}

                {/* Owner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Owner</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/profile/${nft.owner_address}`)}
                    className="font-medium font-mono text-sm hover:text-primary transition-colors cursor-pointer"
                  >
                    {formatAddress(nft.owner_address)}
                  </button>
                </div>

                {/* Price */}
                {listing && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                    <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                    <LivePriceIndicator
                      nftId={nft.id}
                      initialPrice={parseFloat(listing.price)}
                      showChange={true}
                      size="lg"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  {listing && !isOwner && (
                    <Button 
                      onClick={handleBuy}
                      disabled={isProcessing}
                      className="w-full btn-hero py-6 text-lg"
                    >
                      {isProcessing ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                      ) : (
                        <><ShoppingCart className="mr-2 h-5 w-5" />Buy Now - {listing.price} NEX</>
                      )}
                    </Button>
                  )}

                  {!isOwner && !userOffer && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="Enter offer (NEX)"
                        value={offerPrice}
                        onChange={(e) => setOfferPrice(e.target.value)}
                        className="h-11"
                      />
                      <Button 
                        onClick={handleMakeOffer}
                        disabled={!offerPrice || isProcessing}
                        variant="outline"
                        className="whitespace-nowrap h-11"
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        Offer
                      </Button>
                    </div>
                  )}

                  {userOffer && (
                    <Button 
                      onClick={handleCancelOffer}
                      disabled={isProcessing}
                      variant="destructive"
                      className="w-full h-11"
                    >
                      {isProcessing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                      ) : (
                        <><X className="mr-2 h-4 w-4" />Cancel My Offer ({userOffer.offer_price} NEX)</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Offers */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Offers {offers.length > 0 && <Badge variant="secondary" className="text-xs">{offers.length}</Badge>}
                </h3>
                
                {offers.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No active offers</p>
                    {!isOwner && (
                      <p className="text-xs text-muted-foreground mt-1">Be the first to make an offer!</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {offers.map((offer, index) => {
                      const isMyOffer = account && offer.offerer_address.toLowerCase() === account.toLowerCase();
                      const isHighest = index === 0;
                      return (
                        <div 
                          key={offer.id} 
                          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                            isHighest 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'bg-muted/50 hover:bg-muted/80'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{offer.offer_price} NEX</span>
                              {isHighest && (
                                <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary">
                                  Highest
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              by {formatAddress(offer.offerer_address)}
                              {isMyOffer && <span className="ml-1 text-primary font-semibold">(You)</span>}
                            </div>
                          </div>
                          <div className="flex gap-1.5 ml-3 shrink-0">
                            {isOwner && (
                              <Button 
                                onClick={() => handleAcceptOffer(offer)}
                                disabled={isProcessing}
                                size="sm"
                                className="btn-hero h-8 text-xs"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                  <><CheckCircle2 className="w-3 h-3 mr-1" />Accept</>
                                )}
                              </Button>
                            )}
                            {isMyOffer && (
                              <Button 
                                onClick={handleCancelOffer}
                                disabled={isProcessing}
                                size="sm"
                                variant="destructive"
                                className="h-8 text-xs"
                              >
                                {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                                  <><X className="w-3 h-3 mr-1" />Cancel</>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-4 sm:mb-6 h-auto">
              <TabsTrigger value="activity" className="gap-1.5">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Price</span>
              </TabsTrigger>
              <TabsTrigger value="ai-analysis" className="gap-1.5">
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">AI Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="ai-tools" className="gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Tools</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground">No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Activity className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium capitalize text-sm">
                              {activity.activity_type.replace('_', ' ')}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {activity.from_address && <span>From: {formatAddress(activity.from_address)}</span>}
                              {activity.to_address && (
                                <>{activity.from_address && ' → '}To: {formatAddress(activity.to_address)}</>
                              )}
                            </div>
                            {activity.price && (
                              <div className="text-sm font-semibold mt-1 text-primary">
                                {activity.price} NEX
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Price History & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {priceHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground">No sales data yet</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-[220px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={priceHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tick={{ fontSize: 10 }} />
                            <YAxis 
                              stroke="hsl(var(--muted-foreground))" 
                              fontSize={10}
                              width={45}
                              label={{ value: 'NEX', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.75rem'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="price" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ fill: 'hsl(var(--primary))' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <div className="p-4 rounded-xl bg-muted/50 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Total Sales</div>
                          <div className="text-2xl font-bold">{priceHistory.length}</div>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Avg Price</div>
                          <div className="text-2xl font-bold">
                            {(priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">NEX</div>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50 text-center">
                          <div className="text-xs text-muted-foreground mb-1">Last Sale</div>
                          <div className="text-2xl font-bold">{priceHistory[0]?.price.toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">NEX</div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-analysis">
              <div className="grid md:grid-cols-2 gap-6">
                <AIRarityScore 
                  nft={{ name: nft.name, description: nft.description || undefined, image_url: nft.image_url, token_id: nft.token_id }} 
                />
                <AIFakeDetection 
                  nft={{ name: nft.name, image_url: nft.image_url, owner_address: nft.owner_address }} 
                />
              </div>
            </TabsContent>

            <TabsContent value="ai-tools">
              <div className="grid md:grid-cols-2 gap-6">
                <AIPricePrediction 
                  nft={{ name: nft.name, token_id: nft.token_id, price: listing?.price }}
                  salesHistory={priceHistory}
                />
                <AISentimentAnalysis nftOrCollection={{ name: nft.name }} />
                {isOwner && (
                  <AIDynamicPricing
                    nft={{ name: nft.name, token_id: nft.token_id, currentPrice: listing?.price }}
                    similarSales={priceHistory}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;
