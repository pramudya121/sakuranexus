import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import NFTCard from '@/components/NFTCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { acceptOffer, cancelOffer } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, CheckCircle2, Package, Tag, Gift } from 'lucide-react';

interface NFT {
  id: string;
  token_id: number;
  name: string;
  image_url: string;
  owner_address: string;
}

interface Offer {
  id: string;
  token_id: number;
  offer_id: number;
  offerer_address: string;
  offer_price: string;
  status: string;
  nfts?: {
    name: string;
    image_url: string;
  };
}

const Profile = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
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
      ]);
    }
    
    setIsLoading(false);
  };

  const fetchNFTs = async (ownerAddress: string) => {
    const { data } = await supabase
      .from('nfts')
      .select('*')
      .eq('owner_address', ownerAddress.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(10);

    setNfts(data || []);
  };

  const fetchOffers = async (address: string) => {
    // Received offers (on my NFTs)
    const { data: received } = await supabase
      .from('offers')
      .select(`
        *,
        nfts (
          name,
          image_url,
          owner_address
        )
      `)
      .eq('nfts.owner_address', address.toLowerCase())
      .eq('status', 'pending')
      .not('offer_id', 'is', null);

    // Sent offers (offers I made)
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
      .eq('status', 'pending')
      .not('offer_id', 'is', null);

    setReceivedOffers(received || []);
    setSentOffers(sent || []);
  };

  const handleCopyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAcceptOffer = async (offer: Offer) => {
    if (!account || !offer.offer_id) {
      toast({
        title: 'Error',
        description: 'Invalid offer. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

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
    if (!account || !offer.offer_id) {
      toast({
        title: 'Error',
        description: 'Invalid offer. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

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
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-sakura-soft">
        <SakuraFalling />
        <Navigation />
        
        <div className="container mx-auto px-4 pt-24 pb-12">
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

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Profile Header */}
        <Card className="card-hover mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-4xl">
                🌸
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-mono">{formatAddress(account)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Total NFTs</div>
                <div className="text-3xl font-bold gradient-text">{nfts.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="owned" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="owned" className="gap-2">
              <Package className="w-4 h-4" />
              Owned
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-2">
              <Gift className="w-4 h-4" />
              Offers ({receivedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Tag className="w-4 h-4" />
              My Offers ({sentOffers.length})
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {nfts.map((nft) => (
                  <NFTCard
                    key={nft.id}
                    tokenId={nft.token_id}
                    name={nft.name}
                    imageUrl={nft.image_url}
                    owner={nft.owner_address}
                  />
                ))}
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
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-sakura-soft">
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
                        <div className="text-right">
                          <div className="text-2xl font-bold gradient-text">{offer.offer_price}</div>
                          <div className="text-sm text-muted-foreground">NEX</div>
                        </div>
                        <Button onClick={() => handleAcceptOffer(offer)} className="btn-hero">
                          Accept
                        </Button>
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
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-sakura-soft">
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
                        <div className="text-right">
                          <div className="text-2xl font-bold gradient-text">{offer.offer_price}</div>
                          <div className="text-sm text-muted-foreground">NEX</div>
                        </div>
                        <Button onClick={() => handleCancelOffer(offer)} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
