import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import NFTCard from '@/components/NFTCard';
import UserBadges from '@/components/UserBadges';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount, formatAddress } from '@/lib/web3/wallet';
import { acceptOffer, cancelOffer, listNFT, transferNFT } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, CheckCircle2, Package, Tag, Gift, TrendingUp, DollarSign, Activity as ActivityIcon, Eye, Edit, Twitter, Instagram, Globe, MessageCircle, Calendar } from 'lucide-react';

interface NFT {
  id: string;
  token_id: number;
  name: string;
  image_url: string;
  owner_address: string;
  description: string | null;
  created_at: string;
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
  offer_id: number;
  offerer_address: string;
  offer_price: string;
  status: string;
  created_at: string;
  nfts?: {
    name: string;
    image_url: string;
  };
}

interface UserProfile {
  username: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  twitter_handle: string;
  instagram_handle: string;
  discord_handle: string;
  website_url: string;
  created_at: string;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  from_address: string | null;
  to_address: string | null;
  price: string | null;
  created_at: string;
  nfts?: {
    name: string;
    image_url: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const [account, setAccount] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [nfts, setNfts] = useState<NFTWithListing[]>([]);
  const [createdNfts, setCreatedNfts] = useState<NFT[]>([]);
  const [watchlist, setWatchlist] = useState<NFT[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Dialog states
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTWithListing | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalOwned: 0,
    totalCreated: 0,
    totalVolume: '0',
    floorPrice: '0',
  });
  
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
        fetchCreatedNFTs(currentAccount),
        fetchWatchlist(currentAccount),
        fetchActivities(currentAccount),
        fetchOffers(currentAccount),
        fetchStats(currentAccount),
        fetchUserProfile(currentAccount),
      ]);
    }
    
    setIsLoading(false);
  };

  const fetchUserProfile = async (address: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .single();

    if (data) {
      setUserProfile(data);
    }
  };

  const fetchNFTs = async (ownerAddress: string) => {
    const { data: nftData } = await supabase
      .from('nfts')
      .select('*')
      .eq('owner_address', ownerAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (nftData) {
      const nftIds = nftData.map(nft => nft.token_id);
      const { data: listingData } = await supabase
        .from('listings')
        .select('*')
        .in('token_id', nftIds)
        .eq('active', true);

      const nftsWithListings = nftData.map(nft => ({
        ...nft,
        listing: listingData?.find(l => l.token_id === nft.token_id),
      }));

      setNfts(nftsWithListings);
    }
  };

  const fetchCreatedNFTs = async (address: string) => {
    const { data: mintActivities } = await supabase
      .from('activities')
      .select('token_id')
      .eq('to_address', address.toLowerCase())
      .eq('activity_type', 'mint');

    if (mintActivities) {
      const tokenIds = mintActivities.map(a => a.token_id);
      const { data: nftData } = await supabase
        .from('nfts')
        .select('*')
        .in('token_id', tokenIds)
        .order('created_at', { ascending: false });

      setCreatedNfts(nftData || []);
    }
  };

  const fetchWatchlist = async (address: string) => {
    const { data } = await supabase
      .from('watchlist')
      .select(`
        nft_id,
        nfts (*)
      `)
      .eq('wallet_address', address.toLowerCase());

    if (data) {
      const watchedNfts = data.map(w => w.nfts).filter(Boolean);
      setWatchlist(watchedNfts as NFT[]);
    }
  };

  const fetchActivities = async (address: string) => {
    const { data } = await supabase
      .from('activities')
      .select(`
        *,
        nfts (name, image_url)
      `)
      .or(`from_address.eq.${address.toLowerCase()},to_address.eq.${address.toLowerCase()}`)
      .order('created_at', { ascending: false })
      .limit(20);

    setActivities(data || []);
  };

  const fetchOffers = async (address: string) => {
    const { data: nftData } = await supabase
      .from('nfts')
      .select('token_id')
      .eq('owner_address', address.toLowerCase());

    if (nftData) {
      const tokenIds = nftData.map(nft => nft.token_id);
      
      const { data: received } = await supabase
        .from('offers')
        .select(`
          *,
          nfts (name, image_url)
        `)
        .in('token_id', tokenIds)
        .eq('status', 'pending')
        .not('offer_id', 'is', null);

      setReceivedOffers(received || []);
    }

    const { data: sent } = await supabase
      .from('offers')
      .select(`
        *,
        nfts (name, image_url)
      `)
      .eq('offerer_address', address.toLowerCase())
      .eq('status', 'pending')
      .not('offer_id', 'is', null);

    setSentOffers(sent || []);
  };

  const fetchStats = async (address: string) => {
    const { data: nftData } = await supabase
      .from('nfts')
      .select('token_id')
      .eq('owner_address', address.toLowerCase());

    const totalOwned = nftData?.length || 0;

    const { data: mintData } = await supabase
      .from('activities')
      .select('token_id')
      .eq('to_address', address.toLowerCase())
      .eq('activity_type', 'mint');

    const totalCreated = mintData?.length || 0;

    const { data: salesData } = await supabase
      .from('activities')
      .select('price')
      .eq('from_address', address.toLowerCase())
      .eq('activity_type', 'sale');

    const totalVolume = salesData?.reduce((sum, s) => sum + parseFloat(s.price || '0'), 0) || 0;

    const { data: floorData } = await supabase
      .from('listings')
      .select('price')
      .eq('active', true)
      .order('price', { ascending: true })
      .limit(1);

    const floorPrice = floorData?.[0]?.price || '0';

    setStats({
      totalOwned,
      totalCreated,
      totalVolume: totalVolume.toFixed(2),
      floorPrice,
    });
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
        description: 'Invalid offer',
        variant: 'destructive',
      });
      return;
    }

    const result = await acceptOffer(offer.token_id, offer.offerer_address);
    
    if (result.success) {
      toast({
        title: 'Success!',
        description: 'Offer accepted successfully',
      });
      checkAndFetchData();
    } else {
      toast({
        title: 'Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleCancelOffer = async (offer: Offer) => {
    if (!account) {
      toast({
        title: 'Error',
        description: 'Please connect wallet',
        variant: 'destructive',
      });
      return;
    }

    const result = await cancelOffer(offer.token_id);
    
    if (result.success) {
      toast({
        title: 'Success!',
        description: 'Offer cancelled',
      });
      checkAndFetchData();
    } else {
      toast({
        title: 'Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleListNFT = (nft: NFTWithListing) => {
    setSelectedNFT(nft);
    setListDialogOpen(true);
  };

  const handleTransferNFT = (nft: NFTWithListing) => {
    setSelectedNFT(nft);
    setTransferDialogOpen(true);
  };

  const confirmListNFT = async () => {
    if (!selectedNFT || !account || !listPrice) return;

    setIsProcessing(true);
    const result = await listNFT(selectedNFT.token_id, listPrice, account);
    
    if (result.success) {
      toast({
        title: 'Success!',
        description: 'NFT listed successfully',
      });
      setListDialogOpen(false);
      setListPrice('');
      checkAndFetchData();
    } else {
      toast({
        title: 'Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsProcessing(false);
  };

  const confirmTransferNFT = async () => {
    if (!selectedNFT || !account || !transferAddress) return;

    setIsProcessing(true);
    const result = await transferNFT(selectedNFT.token_id, account, transferAddress);
    
    if (result.success) {
      toast({
        title: 'Success!',
        description: 'NFT transferred successfully',
      });
      setTransferDialogOpen(false);
      setTransferAddress('');
      checkAndFetchData();
    } else {
      toast({
        title: 'Failed',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsProcessing(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-sakura-soft">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      {/* Banner Section */}
      <div className="relative h-64 bg-gradient-hero overflow-hidden">
        {userProfile?.banner_url ? (
          <img 
            src={userProfile.banner_url} 
            alt="Profile Banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Profile Header with Avatar */}
        <div className="relative -mt-20 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Avatar */}
            <Avatar className="w-32 h-32 border-4 border-background shadow-sakura-strong">
              <AvatarImage src={userProfile?.avatar_url} />
              <AvatarFallback className="bg-gradient-sakura text-white text-4xl">
                {userProfile?.username?.[0]?.toUpperCase() || '🌸'}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1 md:mb-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {userProfile?.username || 'Unnamed User'}
                </h1>
                <UserBadges walletAddress={account} />
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <span className="font-mono text-sm">{formatAddress(account)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {userProfile?.bio && (
                <p className="text-foreground mb-3 max-w-2xl">{userProfile.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {userProfile?.twitter_handle && (
                  <a 
                    href={`https://twitter.com/${userProfile.twitter_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {userProfile?.instagram_handle && (
                  <a 
                    href={`https://instagram.com/${userProfile.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {userProfile?.discord_handle && (
                  <span className="text-muted-foreground flex items-center gap-1 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    {userProfile.discord_handle}
                  </span>
                )}
                {userProfile?.website_url && (
                  <a 
                    href={userProfile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {userProfile?.created_at && (
                  <span className="text-muted-foreground flex items-center gap-1 text-sm ml-auto">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(userProfile.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <Button
              onClick={() => navigate('/profile/edit')}
              variant="outline"
              className="md:mb-4"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Owned</p>
                  <p className="text-2xl font-bold">{stats.totalOwned}</p>
                </div>
                <Package className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p className="text-2xl font-bold">{stats.totalCreated}</p>
                </div>
                <Eye className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Volume</p>
                  <p className="text-2xl font-bold">{stats.totalVolume}</p>
                  <p className="text-xs text-muted-foreground">NEX</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Floor</p>
                  <p className="text-2xl font-bold">{stats.floorPrice}</p>
                  <p className="text-xs text-muted-foreground">NEX</p>
                </div>
                <DollarSign className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="collected" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 md:grid-cols-5">
            <TabsTrigger value="collected" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Collected</span>
              <span className="sm:hidden">Items</span>
            </TabsTrigger>
            <TabsTrigger value="created" className="gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Created</span>
            </TabsTrigger>
            <TabsTrigger value="favorited" className="gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Favorited</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <ActivityIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="offers" className="gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Offers</span>
            </TabsTrigger>
          </TabsList>

          {/* Collected NFTs */}
          <TabsContent value="collected">
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
                    price={nft.listing?.price}
                    isListed={!!nft.listing?.active}
                    showListButton={!nft.listing?.active}
                    showTransferButton={!nft.listing?.active}
                    isOwner={true}
                    nftId={nft.id}
                    walletAddress={account}
                    onList={() => handleListNFT(nft)}
                    onTransfer={() => handleTransferNFT(nft)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Created NFTs */}
          <TabsContent value="created">
            {createdNfts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-2xl font-bold mb-2">No Creations Yet</h3>
                <p className="text-muted-foreground">Start minting your NFTs!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {createdNfts.map((nft) => (
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

          {/* Favorited NFTs */}
          <TabsContent value="favorited">
            {watchlist.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⭐</div>
                <h3 className="text-2xl font-bold mb-2">No Favorites Yet</h3>
                <p className="text-muted-foreground">Add NFTs to your watchlist!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {watchlist.map((nft) => (
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

          {/* Activity */}
          <TabsContent value="activity">
            {activities.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold mb-2">No Activity Yet</h3>
                <p className="text-muted-foreground">Your activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <Card key={activity.id} className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {activity.nfts && (
                          <img 
                            src={activity.nfts.image_url} 
                            alt={activity.nfts.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{activity.nfts?.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {activity.activity_type.replace('_', ' ')}
                            {activity.price && ` - ${activity.price} NEX`}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(activity.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Offers */}
          <TabsContent value="offers">
            <div className="space-y-6">
              {/* Received Offers */}
              <div>
                <h3 className="text-xl font-bold mb-4">Received Offers ({receivedOffers.length})</h3>
                {receivedOffers.length === 0 ? (
                  <div className="text-center py-10 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">No offers received</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedOffers.map((offer) => (
                      <Card key={offer.id} className="card-hover">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {offer.nfts && (
                              <img 
                                src={offer.nfts.image_url} 
                                alt={offer.nfts.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{offer.nfts?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                by {formatAddress(offer.offerer_address)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold gradient-text">{offer.offer_price} NEX</p>
                              <p className="text-xs text-muted-foreground">{formatTime(offer.created_at)}</p>
                            </div>
                            <Button 
                              onClick={() => handleAcceptOffer(offer)}
                              className="btn-hero"
                            >
                              Accept
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Offers */}
              <div>
                <h3 className="text-xl font-bold mb-4">Sent Offers ({sentOffers.length})</h3>
                {sentOffers.length === 0 ? (
                  <div className="text-center py-10 bg-muted/20 rounded-lg">
                    <p className="text-muted-foreground">No offers sent</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentOffers.map((offer) => (
                      <Card key={offer.id} className="card-hover">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {offer.nfts && (
                              <img 
                                src={offer.nfts.image_url} 
                                alt={offer.nfts.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{offer.nfts?.name}</p>
                              <p className="text-sm text-muted-foreground">Pending acceptance</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold gradient-text">{offer.offer_price} NEX</p>
                              <p className="text-xs text-muted-foreground">{formatTime(offer.created_at)}</p>
                            </div>
                            <Button 
                              onClick={() => handleCancelOffer(offer)}
                              variant="outline"
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* List NFT Dialog */}
      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Price (NEX)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="Enter price"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setListDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmListNFT}
              disabled={!listPrice || isProcessing}
              className="bg-gradient-sakura hover:shadow-sakura"
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              List NFT
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer NFT Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer NFT</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Recipient Address</Label>
              <Input
                id="address"
                placeholder="0x..."
                value={transferAddress}
                onChange={(e) => setTransferAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTransferDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmTransferNFT}
              disabled={!transferAddress || isProcessing}
              className="bg-gradient-sakura hover:shadow-sakura"
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
