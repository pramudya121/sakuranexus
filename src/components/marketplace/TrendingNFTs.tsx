import { useState, useEffect, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, TrendingUp, Eye, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatAddress } from '@/lib/web3/wallet';
import { useNavigate } from 'react-router-dom';

interface TrendingNFT {
  id: string;
  token_id: number;
  name: string;
  image_url: string;
  price: string;
  views?: number;
  offers?: number;
}

const TrendingNFTs = memo(() => {
  const [trending, setTrending] = useState<TrendingNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Fetch recently listed NFTs with offers as "trending"
        const { data: listings } = await supabase
          .from('listings')
          .select(`
            id,
            token_id,
            price,
            nfts (
              id,
              name,
              image_url
            )
          `)
          .eq('active', true)
          .order('created_at', { ascending: false })
          .limit(5);

        if (listings) {
          const formattedTrending = listings.map((item: any, index: number) => ({
            id: item.nfts?.id || item.id,
            token_id: item.token_id,
            name: item.nfts?.name || `NFT #${item.token_id}`,
            image_url: item.nfts?.image_url || '',
            price: item.price,
            views: Math.floor(Math.random() * 1000) + 100, // Mock views
            offers: Math.floor(Math.random() * 20) + 1, // Mock offers
          }));
          setTrending(formattedTrending);
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrending();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6 glass border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-lg">Trending Now</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-muted" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-24 mb-1" />
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 glass border-border/50 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-red-500/10 blur-3xl" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-lg">Trending Now</h3>
        </div>
        <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
          Hot 🔥
        </Badge>
      </div>

      <div className="space-y-3 relative z-10">
        {trending.map((nft, index) => (
          <div 
            key={nft.id}
            onClick={() => navigate(`/nft/${nft.token_id}`)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-all group"
          >
            <div className="relative">
              <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold z-10">
                {index + 1}
              </div>
              <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-border group-hover:ring-primary/50 transition-all">
                {nft.image_url ? (
                  <img src={nft.image_url} alt={nft.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-sakura text-white">
                    🌸
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {nft.name}
              </h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {nft.views}
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {nft.offers} offers
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-sm gradient-text">{parseFloat(nft.price).toFixed(4)}</div>
              <div className="text-xs text-muted-foreground">NEX</div>
            </div>
          </div>
        ))}
      </div>

      <Button 
        variant="ghost" 
        className="w-full mt-4 text-sm group"
        onClick={() => navigate('/marketplace')}
      >
        View All Trending
        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Button>
    </Card>
  );
});

TrendingNFTs.displayName = 'TrendingNFTs';

export default TrendingNFTs;
