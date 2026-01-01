import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart, Tag, Eye, Gift, Heart, Sparkles, ExternalLink } from 'lucide-react';
import { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatAddress } from '@/lib/web3/wallet';
import WatchlistButton from './WatchlistButton';

interface NFTCardProps {
  tokenId: number;
  name: string;
  imageUrl: string;
  price?: string;
  owner: string;
  isListed?: boolean;
  showListButton?: boolean;
  showTransferButton?: boolean;
  isOwner?: boolean;
  nftId?: string;
  walletAddress?: string | null;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  views?: number;
  likes?: number;
  onBuy?: () => void;
  onList?: () => void;
  onTransfer?: () => void;
  onMakeOffer?: () => void;
}

const rarityConfig = {
  common: { 
    gradient: 'from-slate-400 to-slate-500', 
    glow: '',
    bg: 'bg-slate-500/10'
  },
  uncommon: { 
    gradient: 'from-emerald-400 to-green-500', 
    glow: 'hover:shadow-[0_0_30px_rgba(52,211,153,0.3)]',
    bg: 'bg-emerald-500/10'
  },
  rare: { 
    gradient: 'from-blue-400 to-indigo-500', 
    glow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]',
    bg: 'bg-blue-500/10'
  },
  epic: { 
    gradient: 'from-violet-400 to-purple-500', 
    glow: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]',
    bg: 'bg-purple-500/10'
  },
  legendary: { 
    gradient: 'from-amber-400 via-orange-500 to-rose-500', 
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)]',
    bg: 'bg-amber-500/10'
  },
};

const NFTCard = memo(({ 
  tokenId, 
  name, 
  imageUrl, 
  price, 
  owner, 
  isListed = false,
  showListButton = false,
  showTransferButton = false,
  isOwner = false,
  nftId,
  walletAddress,
  rarity = 'common',
  views = 0,
  likes = 0,
  onBuy,
  onList,
  onTransfer,
  onMakeOffer 
}: NFTCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const config = rarityConfig[rarity];

  // Generate consistent mock stats based on tokenId
  const mockViews = views || (tokenId * 17) % 500 + 50;
  const mockLikes = likes || (tokenId * 7) % 100 + 10;

  return (
    <Card 
      className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-500 hover:-translate-y-2 ${config.glow}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rarity Top Border */}
      {rarity !== 'common' && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient} z-20`} />
      )}
      
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {/* Loading Skeleton */}
        {imageLoading && !imageError && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        
        {!imageError ? (
          <img 
            src={imageUrl} 
            alt={name}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-sakura-soft">
            🌸
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Quick Action Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={() => navigate(`/nft/${tokenId}`)}
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Quick View
            </Button>
          </div>
          
          {/* Stats at Bottom */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-white/90">
              <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Eye className="w-4 h-4" />
                {mockViews}
              </span>
              <span className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-lg">
                <Heart className="w-4 h-4" />
                {mockLikes}
              </span>
            </div>
          </div>
        </div>
        
        {/* Watchlist Button */}
        {nftId && (
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <WatchlistButton nftId={nftId} walletAddress={walletAddress} />
          </div>
        )}

        {/* Token ID Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge 
            variant="secondary" 
            className="glass font-mono text-xs px-2.5 py-1 backdrop-blur-md"
          >
            #{tokenId}
          </Badge>
        </div>

        {/* Rarity Badge */}
        {rarity !== 'common' && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge 
              className={`bg-gradient-to-r ${config.gradient} text-white border-0 capitalize flex items-center gap-1.5 shadow-lg`}
            >
              <Sparkles className="w-3 h-3" />
              {rarity}
            </Badge>
          </div>
        )}

        {/* Listed Badge */}
        {isListed && (
          <div className="absolute bottom-3 right-3 z-10">
            <Badge className="bg-green-500 text-white border-0 shadow-lg animate-pulse">
              For Sale
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="text-lg font-bold mb-2 truncate group-hover:text-primary transition-colors duration-300">
          {name}
        </h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Owner</span>
          <span className="font-medium text-foreground font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">
            {formatAddress(owner)}
          </span>
        </div>
        
        {/* Price Display */}
        {price && (
          <div className={`mt-3 p-3 rounded-xl ${config.bg} border border-border/30 transition-all duration-300 group-hover:border-primary/30`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Price</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold gradient-text">{price}</span>
                <span className="text-xs font-medium text-muted-foreground">NEX</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer Actions */}
      <CardFooter className="p-4 pt-0 gap-2">
        {isOwner ? (
          <>
            {isListed ? (
              <Button 
                onClick={() => navigate(`/nft/${tokenId}`)}
                className="flex-1 btn-hero font-semibold h-11"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            ) : (
              <>
                {showListButton && onList && (
                  <Button 
                    onClick={onList}
                    className="flex-1 btn-hero font-semibold h-11"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    List for Sale
                  </Button>
                )}
                
                {showTransferButton && onTransfer && (
                  <Button 
                    onClick={onTransfer}
                    variant="outline"
                    className="flex-1 h-11 hover:bg-secondary"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Transfer
                  </Button>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {isListed && onBuy ? (
              <>
                <Button 
                  onClick={onBuy}
                  className="flex-1 btn-hero font-semibold h-11 group/btn"
                >
                  <ShoppingCart className="w-4 h-4 mr-2 group-hover/btn:scale-110 group-hover/btn:-rotate-12 transition-transform" />
                  Buy Now
                </Button>
                <Button 
                  onClick={() => navigate(`/nft/${tokenId}`)}
                  variant="outline"
                  className="h-11 px-4 hover:bg-secondary"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate(`/nft/${tokenId}`)}
                className="flex-1 btn-hero font-semibold h-11"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
});

NFTCard.displayName = 'NFTCard';

export default NFTCard;
