import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import NFTCard from '@/components/NFTCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { acceptOffer, cancelOffer, listNFT } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, CheckCircle2, Package, Tag, Gift, TrendingUp, DollarSign, Activity as ActivityIcon, Eye } from 'lucide-react';

interface NFT {
  id: string;
  token_id: number;
  name: string;
  image_url: string;
  owner_address: string;
  description: string | null;
}

interface NFTWithListing extends NFT {
  listing?: {
    listing_id: number;
    price: string;
    active: boolean;
  };
}

interface Offer {
  id: string;
  token_id: number;
  offerer_address: string;
  offer_price: string;
  status: string;
  nfts?: {
    name: string;
    image_url: string;
  };
}

const ProfileNew = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTWithListing[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Analytics
  const [totalVolume, setTotalVolume] = useState('0');
  const [totalSales, setTotalSales] = useState(0);
  const [floorPrice, setFloorPrice] = useState('0');
  
  const { toast } = useToast();

  useEffect(() => {
    checkAndFetchData();
  }, []);

  const checkAndFetchData = async () => {
    const currentAccount = await getCurrentAccount();
    setAccount(currentAccount);
    
    if (currentAccount) {
      await Promise.all([
        fetchNFTs(currentAccount),
        fetchOffers(currentAccount),
        fetchAnalytics(currentAccount),
      ]);
    }
    
    setIsLoading(false);
  };

  const fetchNFTs = async (ownerAddress: string) => {
    // Fetch NFTs with their listings
    const { data: nftData } = await supabase
      .from('nfts')
      .select('*')
      .eq('owner_address', ownerAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (nftData) {
      // Fetch listings for these NFTs
      const nftIds = nftData.map(nft => nft.token_id);
      const { data: listingData } = await supabase
        .from('listings')
        .select('*')
        .in('token_id', nftIds)
        .eq('active', true);

      // Merge NFTs with listings
      const nftsWithListings = nftData.map(nft => ({
        ...nft,
        listing: listingData?.find(l => l.token_id === nft.token_id),
      }));

      setNfts(nftsWithListings);
    }
  };

  const fetchOffers = async (address: string) => {
    // Received offers
    const { data: nftData } = await supabase
      .from('nfts')
      .select('token_id')
      .eq('owner_address', address.toLowerCase());

    if (nftData) {
      const tokenIds = nftData.map(n => n.token_id);
      const { data: received } = await supabase
        .from('offers')
        .select(`
          *,
          nfts (
            name,
            image_url
          )
        `)
        .in('token_id', tokenIds)
        .eq('status', 'pending');

      setReceivedOffers(received || []);
    }

    // Sent offers
    const { data: sent } = await supabase
      .from('offers')
      .select(`
        *,
        nfts (
          name,
          image_url
        )
      `)
      .eq('offerer_address', address.toLowerCase())
      .eq('status', 'pending');

    setSentOffers(sent || []);
  };

  const fetchAnalytics = async (address: string) => {
    // Get total sales volume
    const { data: salesData } = await supabase
      .from('activities')
      .select('price')
      .eq('from_address', address.toLowerCase())
      .eq('activity_type', 'sale');

    if (salesData) {
      const volume = salesData.reduce((sum, item) => sum + parseFloat(item.price || '0'), 0);
      setTotalVolume(volume.toFixed(2));
      setTotalSales(salesData.length);
    }

    // Get floor price from active listings
    const { data: listingsData } = await supabase
      .from('listings')
      .select('price')
      .eq('active', true)
      .order('price', { ascending: true })
      .limit(1);

    if (listingsData && listingsData.length > 0) {
      setFloorPrice(listingsData[0].price);
    }
  };

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleListForSale = async () => {
    if (!selectedNFT || !listPrice || !account) return;

    setIsProcessing(true);
    try {
      const result = await listNFT(selectedNFT.token_id, listPrice, account);
      
      if (result.success) {
        toast({
          title: 'Listed Successfully!',
          description: 'Your NFT is now available in the marketplace',
        });
        setShowListDialog(false);
        setListPrice('');
        setSelectedNFT(null);
        checkAndFetchData();
      } else {
        toast({
          title: 'Listing Failed',
          description: result.error || 'Failed to list NFT',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while listing',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!account) return;

    try {
      const result = await acceptOffer(offer.token_id, offer.offerer_address);
      
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
    }
  };

  const handleCancelOffer = async (offer: Offer) => {
    if (!account) return;

    try {
      const result = await cancelOffer(offer.token_id, account);
      
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
    }
  };

  if (!account) {
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
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to view your profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  const unlistedNFTs = nfts.filter(nft => !nft.listing);
  const listedNFTs = nfts.filter(nft => nft.listing);

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
        {/* Profile Header with enhanced design */}
        <Card className="card-hover mb-8 shadow-elegant overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-sakura" />
          <CardContent className="p-8 relative">
            <div className="flex items-center gap-6">
              <div className="w-28 h-28 rounded-2xl bg-white shadow-glow flex items-center justify-center text-5xl border-4 border-white">
                🌸
              </div>
              <div className="flex-1 mt-16">
                <h1 className="text-4xl font-bold mb-2 gradient-text">My Profile</h1>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg px-4 py-1 rounded-lg bg-gradient-sakura-soft">{formatAddress(account)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="hover:bg-primary/10"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-right mt-16">
                <div className="text-sm text-muted-foreground mb-1">Total Collection</div>
                <div className="text-4xl font-bold gradient-text">{nfts.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs with enhanced styling */}
        <Tabs defaultValue="owned" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 h-14 bg-gradient-card shadow-elegant">
            <TabsTrigger value="owned" className="gap-2 text-base data-[state=active]:bg-gradient-sakura data-[state=active]:text-white">
              <Package className="w-5 h-5" />
              Owned
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-2 text-base data-[state=active]:bg-gradient-sakura data-[state=active]:text-white">
              <Gift className="w-5 h-5" />
              Offers ({receivedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2 text-base data-[state=active]:bg-gradient-sakura data-[state=active]:text-white">
              <Tag className="w-5 h-5" />
              My Offers ({sentOffers.length})
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 text-base data-[state=active]:bg-gradient-sakura data-[state=active]:text-white">
              <TrendingUp className="w-5 h-5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Owned NFTs */}
          <TabsContent value="owned">
            {nfts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold mb-2">No NFTs Yet</h3>
                <p className="text-muted-foreground">Start collecting NFTs!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Unlisted NFTs */}
                {unlistedNFTs.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">Unlisted ({unlistedNFTs.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {unlistedNFTs.map((nft) => (
                        <NFTCard
                          key={nft.id}
                          tokenId={nft.token_id}
                          name={nft.name}
                          imageUrl={nft.image_url}
                          owner={nft.owner_address}
                          showListButton={true}
                          onList={() => {
                            setSelectedNFT(nft);
                            setShowListDialog(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Listed NFTs */}
                {listedNFTs.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold mb-4">Listed ({listedNFTs.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {listedNFTs.map((nft) => (
                        <NFTCard
                          key={nft.id}
                          tokenId={nft.token_id}
                          name={nft.name}
                          imageUrl={nft.image_url}
                          owner={nft.owner_address}
                          price={nft.listing?.price}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Received Offers */}
          <TabsContent value="received">
            {receivedOffers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💌</div>
                <h3 className="text-2xl font-bold mb-2">No Offers Received</h3>
                <p className="text-muted-foreground">Offers on your NFTs will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {receivedOffers.map((offer) => (
                  <Card key={offer.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-sakura-soft flex-shrink-0">
                          {offer.nfts?.image_url && (
                            <img src={offer.nfts.image_url} alt={offer.nfts.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{offer.nfts?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Offer by {formatAddress(offer.offerer_address)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold gradient-text">{offer.offer_price}</div>
                          <div className="text-sm text-muted-foreground">NEX</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            onClick={() => window.location.href = `/nft/${offer.token_id}`}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button onClick={() => handleAcceptOffer(offer)} className="btn-hero" size="sm">
                            Accept
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Offers */}
          <TabsContent value="sent">
            {sentOffers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-2xl font-bold mb-2">No Offers Made</h3>
                <p className="text-muted-foreground">Offers you make will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sentOffers.map((offer) => (
                  <Card key={offer.id} className="card-hover">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-sakura-soft flex-shrink-0">
                          {offer.nfts?.image_url && (
                            <img src={offer.nfts.image_url} alt={offer.nfts.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{offer.nfts?.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Pending acceptance
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold gradient-text">{offer.offer_price}</div>
                          <div className="text-sm text-muted-foreground">NEX</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            onClick={() => window.location.href = `/nft/${offer.token_id}`}
                            variant="outline"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button onClick={() => handleCancelOffer(offer)} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Volume</div>
                      <div className="text-2xl font-bold gradient-text">{totalVolume} NEX</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center">
                      <ActivityIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Total Sales</div>
                      <div className="text-2xl font-bold gradient-text">{totalSales}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-sakura flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Floor Price</div>
                      <div className="text-2xl font-bold gradient-text">{floorPrice} NEX</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="card-hover">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">Activity Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-sakura-soft">
                    <span className="text-muted-foreground">NFTs Owned</span>
                    <span className="font-bold">{nfts.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-sakura-soft">
                    <span className="text-muted-foreground">Listed NFTs</span>
                    <span className="font-bold">{listedNFTs.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-sakura-soft">
                    <span className="text-muted-foreground">Offers Received</span>
                    <span className="font-bold">{receivedOffers.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-sakura-soft">
                    <span className="text-muted-foreground">Offers Made</span>
                    <span className="font-bold">{sentOffers.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* List for Sale Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
            <DialogDescription>
              Set a price for {selectedNFT?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Price (NEX)
              </label>
              <Input
                type="number"
                step="0.001"
                placeholder="Enter price in NEX"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                A 2.5% platform fee will be deducted from the sale
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleListForSale}
              disabled={!listPrice || isProcessing}
              className="btn-hero w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Listing...
                </>
              ) : (
                'List for Sale'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileNew;