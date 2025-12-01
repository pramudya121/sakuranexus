import { Card, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { ShoppingCart, Tag, Eye, Gift } from 'lucide-react';
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
  nftId?: string;
  walletAddress?: string | null;
  onBuy?: () => void;
  onList?: () => void;
  onTransfer?: () => void;
  onMakeOffer?: () => void;
}

const NFTCard = ({ 
  tokenId, 
  name, 
  imageUrl, 
  price, 
  owner, 
  isListed = false,
  showListButton = false,
  showTransferButton = false,
  nftId,
  walletAddress,
  onBuy,
  onList,
  onTransfer,
  onMakeOffer 
}: NFTCardProps) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

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
        
        {/* Watchlist Button */}
        {nftId && (
          <div className="absolute top-3 right-3">
            <WatchlistButton nftId={nftId} walletAddress={walletAddress} />
          </div>
        )}

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
        {!isListed && !showListButton && !showTransferButton ? (
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
                className="flex-1"
              >
                <Gift className="w-4 h-4 mr-2" />
                Transfer
              </Button>
            )}
            
            {isListed && onBuy && (
              <Button 
                onClick={onBuy}
                className="flex-1 bg-gradient-sakura hover:shadow-sakura font-semibold"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default NFTCard;
