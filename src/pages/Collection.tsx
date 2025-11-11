import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import NFTCard from '@/components/NFTCard';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { listNFT } from '@/lib/web3/nft';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Package } from 'lucide-react';

interface NFT {
  id: string;
  token_id: number;
  name: string;
  image_url: string;
  owner_address: string;
  description: string | null;
}

const Collection = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showListDialog, setShowListDialog] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAndFetchNFTs();
  }, []);

  const checkAndFetchNFTs = async () => {
    const currentAccount = await getCurrentAccount();
    setAccount(currentAccount);
    
    if (currentAccount) {
      fetchMyNFTs(currentAccount);
    } else {
      setIsLoading(false);
    }
  };

  const fetchMyNFTs = async (ownerAddress: string) => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .select('*')
        .eq('owner_address', ownerAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNfts(data || []);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your collection',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleListForSale = async () => {
    if (!selectedNFT || !listPrice || !account) return;

    setIsProcessing(true);
    try {
      const result = await listNFT(selectedNFT.token_id, listPrice, account);
      
      if (result.success) {
        toast({
          title: 'Listed Successfully!',
          description: 'Your NFT is now available in the marketplace',
        });
        setShowListDialog(false);
        setListPrice('');
        setSelectedNFT(null);
      } else {
        toast({
          title: 'Listing Failed',
          description: result.error || 'Failed to list NFT',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while listing',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-sakura-soft">
        <SakuraFalling />
        <Navigation />
        
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Please connect your wallet to view your NFT collection
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="gradient-text">My Collection</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Your unique NFTs on NEXUSLABS Testnet
          </p>
        </div>

        {/* Collection Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-2xl font-bold mb-2">No NFTs Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your collection by minting or buying NFTs
            </p>
            <Button 
              onClick={() => window.location.href = '/mint'}
              className="btn-hero"
            >
              <Package className="mr-2 w-4 h-4" />
              Mint Your First NFT
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div className="text-muted-foreground">
                {nfts.length} {nfts.length === 1 ? 'item' : 'items'}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  tokenId={nft.token_id}
                  name={nft.name}
                  imageUrl={nft.image_url}
                  owner={nft.owner_address}
                  isListed={false}
                  onList={() => {
                    setSelectedNFT(nft);
                    setShowListDialog(true);
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* List for Sale Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>List NFT for Sale</DialogTitle>
            <DialogDescription>
              Set a price for {selectedNFT?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Price (NEX)
              </label>
              <Input
                type="number"
                step="0.001"
                placeholder="Enter price in NEX"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                A 2.5% platform fee will be deducted from the sale
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleListForSale}
              disabled={!listPrice || isProcessing}
              className="btn-hero w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Listing...
                </>
              ) : (
                'List for Sale'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Collection;
