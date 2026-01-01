import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart, Tag, Eye, Gift, Heart, Sparkles, TrendingUp } from 'lucide-react';
import { useState } from 'react';
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

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500',
};

const rarityGlow = {
  common: '',
  uncommon: 'ring-green-400/30',
  rare: 'ring-blue-400/30',
  epic: 'ring-purple-400/30',
  legendary: 'ring-yellow-400/50 animate-pulse',
};

const NFTCard = ({ 
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
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <Card 
      className={`card-hover overflow-hidden group relative ${rarityGlow[rarity] ? `ring-2 ${rarityGlow[rarity]}` : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Rarity indicator */}
      {rarity !== 'common' && (
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rarityColors[rarity]} z-20`} />
      )}
      
      <div className="relative aspect-square overflow-hidden bg-gradient-sakura-soft">
        {!imageError ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-sakura-soft">
            🌸
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {views || Math.floor(Math.random() * 500)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {likes || Math.floor(Math.random() * 100)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Watchlist Button */}
        {nftId && (
          <div className="absolute top-3 right-3 z-10">
            <WatchlistButton nftId={nftId} walletAddress={walletAddress} />
          </div>
        )}

        {/* Token ID Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge 
            variant="secondary" 
            className="glass font-mono text-xs px-2 py-1"
          >
            #{tokenId}
          </Badge>
        </div>

        {/* Rarity Badge */}
        {rarity !== 'common' && (
          <div className="absolute bottom-3 left-3 z-10">
            <Badge 
              className={`bg-gradient-to-r ${rarityColors[rarity]} text-white border-0 capitalize flex items-center gap-1`}
            >
              <Sparkles className="w-3 h-3" />
              {rarity}
            </Badge>
          </div>
        )}

        {/* Listed Badge */}
        {isListed && (
          <div className="absolute bottom-3 right-3 z-10">
            <Badge className="bg-green-500/90 text-white border-0">
              For Sale
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-bold mb-2 truncate group-hover:text-primary transition-colors">
          {name}
        </h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Owner</span>
          <span className="font-medium text-foreground font-mono">{formatAddress(owner)}</span>
        </div>
        {price && (
          <div className="mt-3 p-3 rounded-xl bg-gradient-sakura-soft border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold gradient-text">{price}</span>
                <span className="text-sm font-medium text-muted-foreground">NEX</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        {isOwner ? (
          <>
            {isListed ? (
              <Button 
                onClick={() => navigate(`/nft/${tokenId}`)}
                className="flex-1 bg-gradient-sakura hover:shadow-sakura font-semibold"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </Button>
            ) : (
              <>
                {showListButton && onList && (
                  <Button 
                    onClick={onList}
                    className="flex-1 bg-gradient-sakura hover:shadow-sakura font-semibold"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    List for Sale
                  </Button>
                )}
                
                {showTransferButton && onTransfer && (
                  <Button 
                    onClick={onTransfer}
                    variant="outline"
                    className="flex-1 hover:bg-secondary"
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
                  className="flex-1 bg-gradient-sakura hover:shadow-sakura font-semibold group/btn"
                >
                  <ShoppingCart className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                  Buy Now
                </Button>
                <Button 
                  onClick={() => navigate(`/nft/${tokenId}`)}
                  variant="outline"
                  className="flex-1 hover:bg-secondary"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => navigate(`/nft/${tokenId}`)}
                className="flex-1 bg-gradient-sakura hover:shadow-sakura font-semibold"
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
};

export default NFTCard;
