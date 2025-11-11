import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { ShoppingCart, Tag, Heart } from 'lucide-react';
import { useState } from 'react';
import { formatAddress } from '@/lib/web3/wallet';

interface NFTCardProps {
  tokenId: number;
  name: string;
  imageUrl: string;
  price?: string;
  owner: string;
  isListed?: boolean;
  onBuy?: () => void;
  onList?: () => void;
  onMakeOffer?: () => void;
}

const NFTCard = ({ 
  tokenId, 
  name, 
  imageUrl, 
  price, 
  owner, 
  isListed = false,
  onBuy,
  onList,
  onMakeOffer 
}: NFTCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="card-hover overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-gradient-sakura-soft">
        {!imageError ? (
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            🌸
          </div>
        )}
        
        {/* Like Button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-3 right-3 p-2 rounded-full glass hover:scale-110 transition-transform"
        >
          <Heart 
            className={`w-5 h-5 ${isLiked ? 'fill-primary text-primary' : 'text-foreground'}`}
          />
        </button>

        {/* Token ID Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full glass text-xs font-semibold">
          #{tokenId}
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-bold mb-2 truncate">{name}</h3>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Owner</span>
          <span className="font-medium text-foreground">{formatAddress(owner)}</span>
        </div>
        {price && (
          <div className="mt-3 p-3 rounded-lg bg-gradient-sakura-soft">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Price</span>
              <div className="flex items-center">
                <span className="text-xl font-bold gradient-text">{price}</span>
                <span className="ml-1 text-sm font-medium">NEX</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        {isListed && onBuy && (
          <>
            <Button 
              onClick={onBuy}
              className="flex-1 bg-gradient-sakura hover:shadow-sakura font-semibold"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Buy Now
            </Button>
            <Button 
              onClick={onMakeOffer}
              variant="outline"
              className="flex-1"
            >
              <Tag className="w-4 h-4 mr-2" />
              Make Offer
            </Button>
          </>
        )}
        {!isListed && onList && (
          <Button 
            onClick={onList}
            className="w-full bg-gradient-sakura hover:shadow-sakura font-semibold"
          >
            <Tag className="w-4 h-4 mr-2" />
            List for Sale
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default NFTCard;
