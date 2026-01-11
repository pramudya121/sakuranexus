import { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCurrentAccount } from '@/lib/web3/wallet';
import {
  Loader2,
  Users,
  TrendingUp,
  Search,
  ArrowUpDown,
  Plus,
  Grid3X3,
  Star,
  ExternalLink,
  RefreshCw,
  Sparkles,
  ImageIcon,
} from 'lucide-react';

interface Collection {
  contract_address: string;
  name: string;
  description?: string;
  total_nfts: number;
  total_volume: string;
  floor_price: string;
  owners: number;
  image_url: string;
  is_verified?: boolean;
  created_by?: string;
}

const CUSTOM_COLLECTIONS_KEY = 'nex_custom_collections';

const getCustomCollections = (): Collection[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_COLLECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCustomCollections = (collections: Collection[]) => {
  localStorage.setItem(CUSTOM_COLLECTIONS_KEY, JSON.stringify(collections));
};

const CollectionSkeleton = memo(() => (
  <Card className="overflow-hidden">
    <Skeleton className="h-40 sm:h-48 w-full" />
    <CardContent className="p-4 sm:p-6">
      <Skeleton className="h-6 w-2/3 mb-4" />
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
));

CollectionSkeleton.displayName = 'CollectionSkeleton';

const CollectionCard = memo(({ collection, onClick }: { collection: Collection; onClick: () => void }) => (
  <Card
    className="card-hover cursor-pointer overflow-hidden group"
    onClick={onClick}
  >
    <div className="relative h-36 sm:h-48 overflow-hidden">
      <img
        src={collection.image_url}
        alt={collection.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      {collection.is_verified && (
        <Badge className="absolute top-3 right-3 bg-blue-500">
          <Star className="w-3 h-3 mr-1 fill-current" />
          Verified
        </Badge>
      )}
    </div>
    <CardContent className="p-4 sm:p-6">
      <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 gradient-text truncate">
        {collection.name}
      </h3>
      {collection.description && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">
          {collection.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">Floor Price</p>
          <p className="text-base sm:text-xl font-bold">{collection.floor_price} NEX</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">Volume</p>
          <p className="text-base sm:text-xl font-bold flex items-center gap-1">
            <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-green-500" />
            {collection.total_volume}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="w-3 sm:w-4 h-3 sm:h-4" />
          <span>{collection.owners} owners</span>
        </div>
        <div className="flex items-center gap-1">
          <Grid3X3 className="w-3 sm:w-4 h-3 sm:h-4" />
          <span>{collection.total_nfts} items</span>
        </div>
      </div>
    </CardContent>
  </Card>
));

CollectionCard.displayName = 'CollectionCard';

const Collections = memo(() => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
  });

  useEffect(() => {
    loadAccount();
    fetchCollections();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [collections, searchQuery, sortBy]);

  const loadAccount = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...collections];

    if (searchQuery) {
      filtered = filtered.filter((col) =>
        col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.contract_address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'volume':
        filtered.sort((a, b) => parseFloat(b.total_volume) - parseFloat(a.total_volume));
        break;
      case 'floor-high':
        filtered.sort((a, b) => {
          const aFloor = a.floor_price === '—' ? 0 : parseFloat(a.floor_price);
          const bFloor = b.floor_price === '—' ? 0 : parseFloat(b.floor_price);
          return bFloor - aFloor;
        });
        break;
      case 'floor-low':
        filtered.sort((a, b) => {
          const aFloor = a.floor_price === '—' ? Infinity : parseFloat(a.floor_price);
          const bFloor = b.floor_price === '—' ? Infinity : parseFloat(b.floor_price);
          return aFloor - bFloor;
        });
        break;
      case 'items':
        filtered.sort((a, b) => b.total_nfts - a.total_nfts);
        break;
      case 'newest':
        filtered.sort((a, b) => (b.created_by ? 1 : 0) - (a.created_by ? 1 : 0));
        break;
    }

    setFilteredCollections(filtered);
  }, [collections, searchQuery, sortBy]);

  const fetchCollections = async () => {
    setIsLoading(true);
    try {
      const { data: nfts } = await supabase
        .from('nfts')
        .select('contract_address, image_url, owner_address');

      if (!nfts) {
        // Load custom collections only
        const customCollections = getCustomCollections();
        setCollections(customCollections);
        setIsLoading(false);
        return;
      }

      const { data: activities } = await supabase
        .from('activities')
        .select('contract_address, price')
        .eq('activity_type', 'sale');

      const { data: listings } = await supabase
        .from('listings')
        .select('contract_address, price')
        .eq('active', true);

      const collectionMap = new Map<string, any>();

      nfts.forEach((nft) => {
        if (!collectionMap.has(nft.contract_address)) {
          collectionMap.set(nft.contract_address, {
            contract_address: nft.contract_address,
            name: 'Sakura NFT Collection',
            description: 'A beautiful collection of Sakura-themed digital art',
            total_nfts: 0,
            owners: new Set<string>(),
            total_volume: 0,
            floor_price: null,
            image_url: nft.image_url,
            is_verified: true,
          });
        }

        const collection = collectionMap.get(nft.contract_address);
        collection.total_nfts++;
        collection.owners.add(nft.owner_address.toLowerCase());
      });

      activities?.forEach((activity) => {
        if (activity.price && collectionMap.has(activity.contract_address)) {
          const collection = collectionMap.get(activity.contract_address);
          collection.total_volume += parseFloat(activity.price);
        }
      });

      listings?.forEach((listing) => {
        if (listing.price && collectionMap.has(listing.contract_address)) {
          const collection = collectionMap.get(listing.contract_address);
          const price = parseFloat(listing.price);
          if (!collection.floor_price || price < collection.floor_price) {
            collection.floor_price = price;
          }
        }
      });

      const collectionsArray = Array.from(collectionMap.values()).map((col) => ({
        ...col,
        owners: col.owners.size,
        total_volume: col.total_volume.toFixed(2),
        floor_price: col.floor_price ? col.floor_price.toFixed(2) : '—',
      }));

      // Merge with custom collections
      const customCollections = getCustomCollections();
      setCollections([...collectionsArray, ...customCollections]);
    } catch (error) {
      console.error('Error fetching collections:', error);
      const customCollections = getCustomCollections();
      setCollections(customCollections);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!account) {
      toast({
        title: 'Connect Wallet',
        description: 'Please connect your wallet to create a collection',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a collection name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const newCollection: Collection = {
        contract_address: `custom_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400',
        total_nfts: 0,
        total_volume: '0.00',
        floor_price: '—',
        owners: 0,
        created_by: account,
      };

      const customCollections = getCustomCollections();
      saveCustomCollections([...customCollections, newCollection]);

      setCollections((prev) => [...prev, newCollection]);
      setCreateModalOpen(false);
      setFormData({ name: '', description: '', image_url: '' });

      toast({
        title: 'Collection Created!',
        description: `${newCollection.name} has been created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create collection',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SakuraFalling />
      <Navigation />

      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-12">
        {/* Header - Mobile Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-2">Collections</h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              Explore and create NFT collections
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button onClick={fetchCollections} variant="outline" className="flex-1 sm:flex-none">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={() => setCreateModalOpen(true)} className="btn-hero flex-1 sm:flex-none">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Collection</span>
              <span className="sm:hidden">Create</span>
            </Button>
          </div>
        </div>

        {/* Search and Filter - Mobile Responsive */}
        <Card className="p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Volume: High to Low</SelectItem>
                  <SelectItem value="floor-high">Floor: High to Low</SelectItem>
                  <SelectItem value="floor-low">Floor: Low to High</SelectItem>
                  <SelectItem value="items">Items: Most to Least</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Collections Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <CollectionSkeleton key={i} />
            ))}
          </div>
        ) : filteredCollections.length === 0 ? (
          <Card className="text-center py-12 sm:py-20">
            <CardContent>
              <Sparkles className="w-16 sm:w-20 h-16 sm:h-20 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">No Collections Found</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                {searchQuery ? 'Try adjusting your search' : 'Be the first to create a collection!'}
              </p>
              <Button onClick={() => setCreateModalOpen(true)} className="btn-hero">
                <Plus className="w-4 h-4 mr-2" />
                Create Collection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCollections.map((collection) => (
              <CollectionCard
                key={collection.contract_address}
                collection={collection}
                onClick={() => navigate('/marketplace')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create Collection
            </DialogTitle>
            <DialogDescription>
              Create a new NFT collection to showcase your artwork
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Collection"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your collection..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Cover Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  placeholder="https://..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
                <Button size="icon" variant="outline">
                  <ImageIcon className="w-4 h-4" />
                </Button>
              </div>
              {formData.image_url && (
                <div className="mt-2 rounded-lg overflow-hidden h-32">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=400';
                    }}
                  />
                </div>
              )}
            </div>

            <Button
              onClick={handleCreateCollection}
              className="w-full btn-hero"
              disabled={isCreating || !formData.name.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create Collection
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

Collections.displayName = 'Collections';

export default Collections;
