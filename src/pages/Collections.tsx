import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2, Users, TrendingUp, Search, ArrowUpDown } from 'lucide-react';

interface Collection {
  contract_address: string;
  name: string;
  total_nfts: number;
  total_volume: string;
  floor_price: string;
  owners: number;
  image_url: string;
}

const Collections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('volume');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [collections, searchQuery, sortBy]);

  const applyFiltersAndSort = () => {
    let filtered = [...collections];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((col) =>
        col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        col.contract_address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
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
    }

    setFilteredCollections(filtered);
  };

  const fetchCollections = async () => {
    try {
      // Aggregate NFT data by contract
      const { data: nfts } = await supabase
        .from('nfts')
        .select('contract_address, image_url, owner_address');

      if (!nfts) {
        setIsLoading(false);
        return;
      }

      // Get sales data
      const { data: activities } = await supabase
        .from('activities')
        .select('contract_address, price')
        .eq('activity_type', 'sale');

      const { data: listings } = await supabase
        .from('listings')
        .select('contract_address, price')
        .eq('active', true);

      // Group by contract
      const collectionMap = new Map<string, any>();

      nfts.forEach((nft) => {
        if (!collectionMap.has(nft.contract_address)) {
          collectionMap.set(nft.contract_address, {
            contract_address: nft.contract_address,
            name: 'Sakura NFT Collection',
            total_nfts: 0,
            owners: new Set<string>(),
            total_volume: 0,
            floor_price: null,
            image_url: nft.image_url,
          });
        }

        const collection = collectionMap.get(nft.contract_address);
        collection.total_nfts++;
        collection.owners.add(nft.owner_address.toLowerCase());
      });

      // Calculate volume
      activities?.forEach((activity) => {
        if (activity.price && collectionMap.has(activity.contract_address)) {
          const collection = collectionMap.get(activity.contract_address);
          collection.total_volume += parseFloat(activity.price);
        }
      });

      // Calculate floor price
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

      setCollections(collectionsArray);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-sakura-soft">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sakura-soft">
      <SakuraFalling />
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold gradient-text mb-4">Collections</h1>
          <p className="text-muted-foreground text-lg">
            Explore NFT collections on Sakura Marketplace
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Volume: High to Low</SelectItem>
                  <SelectItem value="floor-high">Floor: High to Low</SelectItem>
                  <SelectItem value="floor-low">Floor: Low to High</SelectItem>
                  <SelectItem value="items">Items: Most to Least</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold mb-2">No Collections Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Collections will appear here once NFTs are minted'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection) => (
              <Card
                key={collection.contract_address}
                className="card-hover cursor-pointer overflow-hidden group"
                onClick={() => navigate('/marketplace')}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={collection.image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-4 gradient-text">
                    {collection.name}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Floor Price</p>
                      <p className="text-xl font-bold">{collection.floor_price} NEX</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Volume</p>
                      <p className="text-xl font-bold flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {collection.total_volume}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{collection.owners} owners</span>
                    </div>
                    <span>{collection.total_nfts} items</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;
