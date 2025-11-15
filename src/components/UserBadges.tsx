import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp, Star, Sparkles } from 'lucide-react';

interface UserBadgesProps {
  walletAddress: string;
}

interface BadgeData {
  id: string;
  badge_type: string;
  earned_at: string;
}

const badgeConfig = {
  early_adopter: {
    label: 'Early Adopter',
    icon: Sparkles,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  collector: {
    label: 'Collector',
    icon: Star,
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  },
  top_seller: {
    label: 'Top Seller',
    icon: TrendingUp,
    color: 'bg-gradient-to-r from-orange-500 to-red-500',
  },
};

const UserBadges = ({ walletAddress }: UserBadgesProps) => {
  const [badges, setBadges] = useState<BadgeData[]>([]);

  useEffect(() => {
    const fetchBadges = async () => {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('wallet_address', walletAddress);

      if (!error && data) {
        setBadges(data);
      }
    };

    if (walletAddress) {
      fetchBadges();
    }
  }, [walletAddress]);

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const config = badgeConfig[badge.badge_type as keyof typeof badgeConfig];
        if (!config) return null;

        const Icon = config.icon;
        return (
          <Badge key={badge.id} className={`${config.color} text-white border-0 px-3 py-1`}>
            <Icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
};

export default UserBadges;
