import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWatchlist } from '@/hooks/useWatchlist';
import { formatAddress } from '@/lib/web3/wallet';
import { 
  Heart, 
  Trash2, 
  ExternalLink, 
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react';

const WatchlistItemCard = memo(({ 
  item, 
  onRemove 
}: { 
  item: any; 
  onRemove: (nftId: string) => void;
}) => {
  const navigate = useNavigate();

  if (!item.nft) return null;

  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-4">
          {/* Image */}
          <div 
            className="w-24 h-24 flex-shrink-0 cursor-pointer"
            onClick={() => navigate(`/nft/${item.nft.token_id}`)}
          >
            <img 
              src={item.nft.image_url} 
              alt={item.nft.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 py-4 min-w-0">
            <h3 
              className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/nft/${item.nft.token_id}`)}
            >
              {item.nft.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Token #{item.nft.token_id}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Owner: {formatAddress(item.nft.owner_address)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pr-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate(`/nft/${item.nft.token_id}`)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
            <Button 
              size="icon" 
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(item.nft_id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

WatchlistItemCard.displayName = 'WatchlistItemCard';

const Watchlist = memo(() => {
  const navigate = useNavigate();
  const { 
    items, 
    isLoading, 
    account, 
    removeFromWatchlist, 
    refresh 
  } = useWatchlist();

  if (!account) {
    return (
      <div className="min-h-screen bg-background">
        <SakuraFalling />
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to view your watchlist
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-primary fill-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">
                My <span className="gradient-text">Watchlist</span>
              </h1>
              {items.length > 0 && (
                <Badge variant="secondary">{items.length}</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Track your favorite NFTs and get notified of changes
            </p>
          </div>
          <Button onClick={refresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-24 h-24" />
                    <div className="flex-1 py-4 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Heart className="w-20 h-20 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your Watchlist is Empty</h3>
              <p className="text-muted-foreground mb-6">
                Start adding NFTs to your watchlist by clicking the heart icon
              </p>
              <Button onClick={() => navigate('/marketplace')} className="btn-hero">
                <ExternalLink className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <WatchlistItemCard 
                key={item.id} 
                item={item} 
                onRemove={removeFromWatchlist}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

Watchlist.displayName = 'Watchlist';

export default Watchlist;