import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { buyNFT, makeOffer, acceptOffer, cancelOffer } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Tag, ShoppingCart, Clock, CheckCircle2, X } from 'lucide-react';

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

const NFTDetail = () => {
  const { tokenId } = useParams();
  const navigate = useNavigate();
  const [nft, setNft] = useState<NFT | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
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
    const { data } = await supabase
      .from('offers')
      .select('*')
      .eq('token_id', token_id)
      .eq('status', 'pending')
      .order('offer_price', { ascending: false });

    setOffers(data || []);
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
    if (!account || !nft || !offer.offer_id) return;

    setIsProcessing(true);
    try {
      const result = await acceptOffer(offer.offer_id, nft.token_id, offer.offerer_address);
      
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

  const handleCancelOffer = async (offer: Offer) => {
    if (!account || !nft || !offer.offer_id) return;

    setIsProcessing(true);
    try {
      const result = await cancelOffer(offer.offer_id);
      
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
                        <div className="text-3xl font-bold gradient-text">{listing.price} NEX</div>
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
                      onClick={() => handleCancelOffer(userOffer)}
                      disabled={isProcessing}
                      variant="outline"
                      className="w-full"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel My Offer ({userOffer.offer_price} NEX)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Offers Section */}
            {offers.length > 0 && (
              <Card className="card-hover">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Offers ({offers.length})
                  </h3>
                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <div key={offer.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-sakura-soft">
                        <div>
                          <div className="font-medium">{offer.offer_price} NEX</div>
                          <div className="text-sm text-muted-foreground">
                            by {formatAddress(offer.offerer_address)}
                          </div>
                        </div>
                        {isOwner && (
                          <Button 
                            onClick={() => handleAcceptOffer(offer)}
                            disabled={isProcessing}
                            size="sm"
                            className="btn-hero"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Accept
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTDetail;