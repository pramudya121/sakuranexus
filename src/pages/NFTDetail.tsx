import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { buyNFT, makeOffer, acceptOffer, cancelOffer } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Tag, ShoppingCart, Clock, CheckCircle2, X, Activity, TrendingUp, Share2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SocialShareMenu from '@/components/SocialShareMenu';
import LivePriceIndicator from '@/components/nft/LivePriceIndicator';

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
      .single();

    setNft(data);
  };

  const fetchListing = async (token_id: number) => {
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('token_id', token_id)
      .eq('active', true)
      .single();

    setListing(data);
  };

  const fetchOffers = async (token_id: number) => {
    // Fetch all pending offers for this token, regardless of offer_id
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

    // Generate price history from sales and offers
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
        toast({
          title: 'Purchase Successful!',
          description: 'NFT transferred to your wallet',
        });
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        toast({
          title: 'Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to purchase NFT',
        variant: 'destructive',
      });
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
        toast({
          title: 'Offer Submitted!',
          description: 'Your offer has been sent to the owner',
        });
        setOfferPrice('');
        checkAndFetchData();
      } else {
        toast({
          title: 'Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to make offer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!account || !nft || !offer.offer_id) {
      toast({
        title: 'Error',
        description: 'Invalid offer. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await acceptOffer(nft.token_id, offer.offerer_address);
      
      if (result.success) {
        toast({
          title: 'Offer Accepted!',
          description: 'NFT transferred successfully',
        });
        checkAndFetchData();
      } else {
        toast({
          title: 'Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept offer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOffer = async () => {
    if (!account || !nft) {
      toast({
        title: 'Error',
        description: 'Please connect wallet and try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // cancelOffer expects tokenId, not offer_id
      const result = await cancelOffer(nft.token_id);
      
      if (result.success) {
        toast({
          title: 'Offer Cancelled',
          description: 'Your offer has been withdrawn',
        });
        checkAndFetchData();
      } else {
        toast({
          title: 'Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel offer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isOwner = account && nft && account.toLowerCase() === nft.owner_address.toLowerCase();
  const userOffer = offers.find(o => o.offerer_address.toLowerCase() === account?.toLowerCase());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-sakura-soft flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-gradient-sakura-soft">
        <SakuraFalling />
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <h2 className="text-2xl font-bold">NFT Not Found</h2>
          <Button onClick={() => navigate('/marketplace')} className="mt-4">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <Card className="card-hover overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square bg-gradient-sakura-soft">
                <img 
                  src={nft.image_url} 
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </CardContent>
          </Card>

          {/* Details Section */}
          <div className="space-y-6">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{nft.name}</h1>
                    <p className="text-sm text-muted-foreground">Token ID: #{nft.token_id}</p>
                  </div>
                  {/* Social Share Button */}
                  <SocialShareMenu
                    title={nft.name}
                    description={nft.description || undefined}
                    image={nft.image_url}
                    type="nft"
                    price={listing?.price}
                  />
                </div>

                {nft.description && (
                  <p className="text-muted-foreground mb-6">{nft.description}</p>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Owner</span>
                    <span className="font-medium">{formatAddress(nft.owner_address)}</span>
                  </div>

                  {listing && (
                    <>
                      <Separator />
                      <div className="p-4 rounded-lg bg-gradient-sakura-soft">
                        <div className="text-sm text-muted-foreground mb-1">Current Price</div>
                        <LivePriceIndicator
                          nftId={nft.id}
                          initialPrice={parseFloat(listing.price)}
                          showChange={true}
                          size="lg"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {listing && !isOwner && (
                    <Button 
                      onClick={handleBuy}
                      disabled={isProcessing}
                      className="w-full btn-hero py-6 text-lg"
                    >
                      {isProcessing ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                      ) : (
                        <><ShoppingCart className="mr-2 h-5 w-5" />Buy Now</>
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
                      />
                      <Button 
                        onClick={handleMakeOffer}
                        disabled={!offerPrice || isProcessing}
                        variant="outline"
                        className="whitespace-nowrap"
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        Make Offer
                      </Button>
                    </div>
                  )}

                  {userOffer && (
                    <Button 
                      onClick={handleCancelOffer}
                      disabled={isProcessing}
                      variant="destructive"
                      className="w-full"
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

            {/* Offers Section - Always show for owners or when offers exist */}
            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Offers {offers.length > 0 && `(${offers.length})`}
                </h3>
                
                {offers.length === 0 ? (
                  <div className="text-center py-6">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No active offers yet</p>
                    {!isOwner && (
                      <p className="text-sm text-muted-foreground mt-1">Be the first to make an offer!</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {offers.map((offer, index) => {
                      const isMyOffer = account && offer.offerer_address.toLowerCase() === account.toLowerCase();
                      const isHighest = index === 0;
                      return (
                        <div 
                          key={offer.id} 
                          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                            isHighest 
                              ? 'bg-primary/10 border border-primary/30' 
                              : 'bg-gradient-sakura-soft hover:bg-gradient-sakura-soft/80'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{offer.offer_price} NEX</span>
                              {isHighest && (
                                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                  Highest
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              by {formatAddress(offer.offerer_address)}
                              {isMyOffer && <span className="ml-2 text-primary font-semibold">(Your Offer)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(offer.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {isOwner && (
                              <Button 
                                onClick={() => handleAcceptOffer(offer)}
                                disabled={isProcessing}
                                size="sm"
                                className="btn-hero"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Accept
                                  </>
                                )}
                              </Button>
                            )}
                            {isMyOffer && (
                              <Button 
                                onClick={handleCancelOffer}
                                disabled={isProcessing}
                                size="sm"
                                variant="destructive"
                              >
                                {isProcessing ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                  </>
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

        {/* Tabs for History and Analytics */}
        <div className="mt-8">
          <Tabs defaultValue="activity" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="activity">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Price History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No activity yet</p>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-gradient-sakura-soft">
                          <div className="flex-1">
                            <div className="font-medium capitalize">
                              {activity.activity_type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {activity.from_address && (
                                <span>From: {formatAddress(activity.from_address)}</span>
                              )}
                              {activity.to_address && (
                                <>
                                  {activity.from_address && ' → '}
                                  <span>To: {formatAddress(activity.to_address)}</span>
                                </>
                              )}
                            </div>
                            {activity.price && (
                              <div className="text-sm font-semibold mt-1">
                                Price: {activity.price} NEX
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Price History & Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  {priceHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No sales data yet</p>
                  ) : (
                    <>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={priceHistory}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis 
                              dataKey="date" 
                              className="text-xs"
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis 
                              className="text-xs"
                              stroke="hsl(var(--muted-foreground))"
                              label={{ value: 'Price (NEX)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '0.5rem'
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
                        <div className="p-4 rounded-lg bg-gradient-sakura-soft text-center">
                          <div className="text-sm text-muted-foreground">Total Sales</div>
                          <div className="text-2xl font-bold mt-1">{priceHistory.length}</div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-sakura-soft text-center">
                          <div className="text-sm text-muted-foreground">Avg Price</div>
                          <div className="text-2xl font-bold mt-1">
                            {(priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length).toFixed(2)} NEX
                          </div>
                        </div>
                        <div className="p-4 rounded-lg bg-gradient-sakura-soft text-center">
                          <div className="text-sm text-muted-foreground">Last Sale</div>
                          <div className="text-2xl font-bold mt-1">
                            {priceHistory[0]?.price.toFixed(2)} NEX
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;