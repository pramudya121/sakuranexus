import { useState, useEffect, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, ArrowUpRight, ArrowDownRight, Tag, Gift, Clock, Gavel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatAddress } from '@/lib/web3/wallet';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: string;
  tokenId: number;
  nftName: string;
  price?: string;
  from?: string;
  to?: string;
  timestamp: string;
}

const activityIcons: Record<string, any> = {
  sale: ArrowUpRight,
  list: Tag,
  transfer: Gift,
  offer: Gavel,
  mint: Activity,
};

const activityColors: Record<string, string> = {
  sale: 'text-green-500 bg-green-500/10',
  list: 'text-blue-500 bg-blue-500/10',
  transfer: 'text-purple-500 bg-purple-500/10',
  offer: 'text-orange-500 bg-orange-500/10',
  mint: 'text-pink-500 bg-pink-500/10',
};

const RecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select(`
            id,
            activity_type,
            token_id,
            price,
            from_address,
            to_address,
            created_at,
            nfts (
              name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        const formattedActivities = data.map((item: any) => ({
          id: item.id,
          type: item.activity_type,
          tokenId: item.token_id,
          nftName: item.nfts?.name || `NFT #${item.token_id}`,
          price: item.price,
          from: item.from_address,
          to: item.to_address,
          timestamp: item.created_at,
        }));

        setActivities(formattedActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-changes')
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

  if (isLoading) {
    return (
      <Card className="p-6 glass border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-32 mb-1" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 glass border-border/50 overflow-hidden relative">
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/20 to-accent/10 blur-3xl" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-sakura">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-lg">Recent Activity</h3>
        </div>
        <Badge variant="secondary">Live</Badge>
      </div>

      <ScrollArea className="h-[320px] relative z-10">
        <div className="space-y-2">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => {
              const Icon = activityIcons[activity.type] || Activity;
              const colorClass = activityColors[activity.type] || 'text-gray-500 bg-gray-500/10';
              
              return (
                <div 
                  key={activity.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-all"
                >
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">{activity.type}</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {activity.nftName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {activity.from && (
                        <span>From: {formatAddress(activity.from)}</span>
                      )}
                      {activity.to && (
                        <span>To: {formatAddress(activity.to)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {activity.price && (
                      <div className="font-bold text-sm gradient-text">
                        {parseFloat(activity.price).toFixed(4)} NEX
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default RecentActivity;
