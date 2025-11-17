import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatAddress } from '@/lib/web3/wallet';
import { Loader2, ArrowRight, Tag, ShoppingCart, Palette, Gift, Search, Filter, ArrowUpDown } from 'lucide-react';
import { NEXUS_TESTNET } from '@/lib/web3/config';

interface Activity {
  id: string;
  activity_type: string;
  from_address: string | null;
  to_address: string | null;
  price: string | null;
  transaction_hash: string | null;
  token_id: number;
  created_at: string;
  nfts?: {
    name: string;
    image_url: string;
  };
}

const Activity = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchActivities();

    // Real-time subscription
    const channel = supabase
      .channel('activities-real-time')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [activities, searchQuery, filterType, sortBy]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          id,
          activity_type,
          from_address,
          to_address,
          price,
          transaction_hash,
          token_id,
          created_at,
          nfts (
            name,
            image_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...activities];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.nfts?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.from_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.to_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.token_id.toString().includes(searchQuery)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter((activity) => activity.activity_type === filterType);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat(b.price || '0') - parseFloat(a.price || '0'));
        break;
      case 'price-low':
        filtered.sort((a, b) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));
        break;
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return <Palette className="w-5 h-5" />;
      case 'list':
        return <Tag className="w-5 h-5" />;
      case 'sale':
        return <ShoppingCart className="w-5 h-5" />;
      case 'offer':
      case 'offer_accepted':
        return <Gift className="w-5 h-5" />;
      default:
        return <ArrowRight className="w-5 h-5" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const nftName = activity.nfts?.name || `#${activity.token_id}`;
    
    switch (activity.activity_type) {
      case 'mint':
        return {
          title: 'Minted',
          description: `${nftName} minted by ${formatAddress(activity.to_address || '')}`,
        };
      case 'list':
        return {
          title: 'Listed',
          description: `${nftName} listed for ${activity.price} NEX`,
        };
      case 'sale':
        return {
          title: 'Sale',
          description: `${nftName} sold for ${activity.price} NEX`,
        };
      case 'offer':
        return {
          title: 'Offer Made',
          description: `Offer of ${activity.price} NEX for ${nftName}`,
        };
      case 'offer_accepted':
        return {
          title: 'Offer Accepted',
          description: `${nftName} sold for ${activity.price} NEX`,
        };
      case 'transfer':
        return {
          title: 'Transfer',
          description: `${nftName} transferred`,
        };
      default:
        return {
          title: 'Activity',
          description: nftName,
        };
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'mint':
        return 'bg-gradient-sakura text-white';
      case 'list':
        return 'bg-accent text-accent-foreground';
      case 'sale':
        return 'bg-primary text-primary-foreground';
      case 'offer':
      case 'offer_accepted':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

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

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold gradient-text mb-4">Activity Feed</h1>
          <p className="text-muted-foreground text-lg">
            Real-time activity across the marketplace
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, address, or token ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter by Type */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="mint">Mints</SelectItem>
                  <SelectItem value="list">Listings</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="offer">Offers</SelectItem>
                  <SelectItem value="offer_accepted">Offers Accepted</SelectItem>
                  <SelectItem value="transfer">Transfers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Activity List */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold mb-2">No Activities Found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Activities will appear here as they happen'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((activity) => {
              const activityText = getActivityText(activity);
              
              return (
                <Card key={activity.id} className="card-hover overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getActivityColor(activity.activity_type)}`}>
                      {getActivityIcon(activity.activity_type)}
                    </div>

                    {/* NFT Image */}
                    {activity.nfts && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-sakura-soft">
                        <img
                          src={activity.nfts.image_url}
                          alt={activity.nfts.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg">{activityText.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activityText.description}
                      </p>
                      {activity.from_address && activity.to_address && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{formatAddress(activity.from_address)}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span>{formatAddress(activity.to_address)}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Time */}
                    <div className="text-right">
                      {activity.price && (
                        <p className="font-bold gradient-text text-lg mb-1">
                          {activity.price} NEX
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatTime(activity.created_at)}
                      </p>
                      {activity.transaction_hash && (
                        <a
                          href={`${NEXUS_TESTNET.blockExplorer}/tx/${activity.transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          View TX
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Load More Button (placeholder) */}
        {filteredActivities.length >= 100 && (
          <div className="text-center mt-8">
            <Button variant="outline" size="lg">
              Load More Activities
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
