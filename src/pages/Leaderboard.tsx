import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, TrendingUp, Gem } from 'lucide-react';
import UserBadges from '@/components/UserBadges';

interface LeaderboardEntry {
  wallet_address: string;
  count: number;
  total_value?: string;
  avatar_url?: string;
  username?: string;
}

const Leaderboard = () => {
  const [topCollectors, setTopCollectors] = useState<LeaderboardEntry[]>([]);
  const [topSellers, setTopSellers] = useState<LeaderboardEntry[]>([]);
  const [valuableNFTs, setValuableNFTs] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    // Top Collectors (most NFTs owned)
    const { data: collectors } = await supabase
      .from('nfts')
      .select('owner_address, user_profiles(avatar_url, username)')
      .limit(1000);

    if (collectors) {
      const collectorCounts = collectors.reduce((acc: any, nft: any) => {
        const addr = nft.owner_address;
        if (!acc[addr]) {
          acc[addr] = {
            wallet_address: addr,
            count: 0,
            avatar_url: nft.user_profiles?.avatar_url,
            username: nft.user_profiles?.username,
          };
        }
        acc[addr].count++;
        return acc;
      }, {});

      const sorted = Object.values(collectorCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);
      setTopCollectors(sorted as LeaderboardEntry[]);
    }

    // Top Sellers (most sales)
    const { data: sellers } = await supabase
      .from('activities')
      .select('from_address, user_profiles(avatar_url, username)')
      .eq('activity_type', 'sale')
      .limit(1000);

    if (sellers) {
      const sellerCounts = sellers.reduce((acc: any, activity: any) => {
        const addr = activity.from_address;
        if (!addr) return acc;
        if (!acc[addr]) {
          acc[addr] = {
            wallet_address: addr,
            count: 0,
            avatar_url: activity.user_profiles?.avatar_url,
            username: activity.user_profiles?.username,
          };
        }
        acc[addr].count++;
        return acc;
      }, {});

      const sorted = Object.values(sellerCounts)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);
      setTopSellers(sorted as LeaderboardEntry[]);
    }

    // Most Valuable NFTs (highest listing price)
    const { data: valuable } = await supabase
      .from('listings')
      .select('*, nfts(name, image_url, owner_address)')
      .eq('active', true)
      .order('price', { ascending: false })
      .limit(10);

    if (valuable) {
      setValuableNFTs(valuable);
    }
  };

  const renderLeaderboardCard = (entry: LeaderboardEntry, index: number, type: 'collector' | 'seller') => {
    const medals = ['🥇', '🥈', '🥉'];
    const medal = index < 3 ? medals[index] : `#${index + 1}`;

    return (
      <Card key={entry.wallet_address} className="p-4 glass hover:shadow-sakura transition-all">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold w-12">{medal}</div>
          <Avatar className="w-12 h-12">
            <AvatarImage src={entry.avatar_url} />
            <AvatarFallback>{entry.username?.[0] || '?'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold text-foreground">
              {entry.username || `${entry.wallet_address.slice(0, 6)}...${entry.wallet_address.slice(-4)}`}
            </div>
            <div className="text-sm text-muted-foreground">
              {type === 'collector' ? `${entry.count} NFTs owned` : `${entry.count} sales completed`}
            </div>
            <UserBadges walletAddress={entry.wallet_address} />
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">🏆 Leaderboard</h1>
          <p className="text-muted-foreground">Top performers in the SakuraNFT community</p>
        </div>

        <Tabs defaultValue="collectors" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="collectors">
              <Trophy className="w-4 h-4 mr-2" />
              Top Collectors
            </TabsTrigger>
            <TabsTrigger value="sellers">
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Sellers
            </TabsTrigger>
            <TabsTrigger value="valuable">
              <Gem className="w-4 h-4 mr-2" />
              Most Valuable
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collectors" className="space-y-4">
            {topCollectors.map((entry, index) => renderLeaderboardCard(entry, index, 'collector'))}
          </TabsContent>

          <TabsContent value="sellers" className="space-y-4">
            {topSellers.map((entry, index) => renderLeaderboardCard(entry, index, 'seller'))}
          </TabsContent>

          <TabsContent value="valuable" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {valuableNFTs.map((listing, index) => (
              <Card key={listing.id} className="overflow-hidden glass hover:shadow-sakura transition-all">
                <div className="relative">
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                    #{index + 1}
                  </div>
                  <img
                    src={listing.nfts?.image_url}
                    alt={listing.nfts?.name}
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{listing.nfts?.name}</h3>
                  <div className="text-2xl font-bold text-primary">{listing.price} NEX</div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Leaderboard;
