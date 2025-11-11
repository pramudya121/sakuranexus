import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatAddress } from '@/lib/web3/wallet';
import { Loader2, ArrowRight, Tag, ShoppingCart, Palette, Gift } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activities-changes')
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
        .limit(50);

      if (error) throw error;

      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setIsLoading(false);
    }
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
    switch (activity.activity_type) {
      case 'mint':
        return `Minted by ${formatAddress(activity.to_address || '')}`;
      case 'list':
        return `Listed for ${activity.price} NEX by ${formatAddress(activity.from_address || '')}`;
      case 'sale':
        return `Sold for ${activity.price} NEX to ${formatAddress(activity.to_address || '')}`;
      case 'offer':
        return `Offer of ${activity.price} NEX by ${formatAddress(activity.from_address || '')}`;
      case 'offer_accepted':
        return `Offer accepted for ${activity.price} NEX`;
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'mint':
        return 'bg-gradient-sakura';
      case 'list':
        return 'bg-accent';
      case 'sale':
        return 'bg-primary';
      case 'offer':
      case 'offer_accepted':
        return 'bg-secondary';
      default:
        return 'bg-muted';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">Activity Feed</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Track all marketplace activities in real-time
          </p>
        </div>

        {/* Activity List */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-2xl font-bold mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground">
              Be the first to create activity on the marketplace!
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="card-hover p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-full ${getActivityColor(activity.activity_type)} text-white flex-shrink-0`}>
                    {getActivityIcon(activity.activity_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-bold text-lg mb-1">
                          {activity.nfts?.name || `NFT #${activity.token_id}`}
                        </h3>
                        <p className="text-muted-foreground">
                          {getActivityText(activity)}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatTime(activity.created_at)}
                      </span>
                    </div>

                    {/* Transaction Link */}
                    {activity.transaction_hash && (
                      <a
                        href={`${NEXUS_TESTNET.blockExplorer}/tx/${activity.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        View transaction
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* NFT Image */}
                  {activity.nfts?.image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={activity.nfts.image_url}
                        alt={activity.nfts.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
