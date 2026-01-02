import { useState, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TokenLogo } from '@/components/ui/token-logo';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { TokenRowSkeleton } from '@/components/ui/stable-skeleton';
import { useTokenFavorites } from '@/hooks/useTokenFavorites';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { 
  Wallet, 
  Search, 
  Star, 
  TrendingUp, 
  TrendingDown,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  value: number;
  price: number;
  logoURI?: string;
  change24h?: number;
}

interface TokenListProps {
  balances: TokenBalance[];
  isLoading: boolean;
  walletAddress?: string;
}

export const TokenList = memo(function TokenList({ 
  balances, 
  isLoading, 
  walletAddress 
}: TokenListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggleFavorite, isFavorite } = useTokenFavorites();

  // Merge all DEFAULT_TOKENS with balances
  const allTokens = useMemo(() => {
    const balanceMap = new Map(balances.map(b => [b.address.toLowerCase(), b]));
    
    return DEFAULT_TOKENS.map(token => {
      const balance = balanceMap.get(token.address.toLowerCase());
      return {
        symbol: token.symbol,
        name: token.name,
        address: token.address,
        balance: balance?.balance || '0',
        value: balance?.value || 0,
        price: balance?.price || 0,
        logoURI: token.logoURI,
        change24h: balance?.change24h,
      };
    });
  }, [balances]);

  // Filter and sort tokens
  const filteredTokens = useMemo(() => {
    let tokens = allTokens;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tokens = tokens.filter(t => 
        t.symbol.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.address.toLowerCase().includes(query)
      );
    }

    // Favorites filter
    if (showFavoritesOnly) {
      tokens = tokens.filter(t => isFavorite(t.address));
    }

    // Sort: favorites first, then by value
    return tokens.sort((a, b) => {
      const aFav = isFavorite(a.address) ? 1 : 0;
      const bFav = isFavorite(b.address) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return b.value - a.value;
    });
  }, [allTokens, searchQuery, showFavoritesOnly, isFavorite]);

  if (isLoading) {
    return (
      <Card className="glass border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            Token Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <TokenRowSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="w-5 h-5 text-primary" />
            Token Balances
            <Badge variant="secondary" className="ml-2 text-xs">
              {filteredTokens.length} tokens
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="gap-1.5"
            >
              <Star className={cn(
                'w-4 h-4',
                showFavoritesOnly && 'fill-current'
              )} />
              Favorites
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, symbol, or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/30"
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="p-4 pt-0 space-y-2">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No tokens found</p>
              </div>
            ) : (
              filteredTokens.map((token, index) => (
                <TokenRow
                  key={token.address}
                  token={token}
                  isFavorite={isFavorite(token.address)}
                  onToggleFavorite={() => toggleFavorite(token.address)}
                  index={index}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});

interface TokenRowProps {
  token: TokenBalance;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  index: number;
}

const TokenRow = memo(function TokenRow({ 
  token, 
  isFavorite, 
  onToggleFavorite,
  index 
}: TokenRowProps) {
  const hasBalance = parseFloat(token.balance) > 0;
  const change = token.change24h || 0;

  return (
    <div 
      className={cn(
        'group flex items-center justify-between p-4 rounded-xl transition-all duration-300',
        'bg-secondary/30 hover:bg-secondary/50 hover:shadow-sm',
        'animate-fade-in-up'
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 -ml-1"
        >
          <Star className={cn(
            'w-4 h-4 transition-colors',
            isFavorite 
              ? 'fill-yellow-400 text-yellow-400' 
              : 'text-muted-foreground hover:text-yellow-400'
          )} />
        </button>
        
        {/* Token Logo */}
        <TokenLogo 
          src={token.logoURI} 
          symbol={token.symbol} 
          size="lg"
          className="group-hover:scale-110 transition-transform duration-300"
        />
        
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{token.symbol}</p>
            {isFavorite && (
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{token.name}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          {hasBalance ? (
            <>
              <p className="font-bold tabular-nums">
                {parseFloat(token.balance).toLocaleString(undefined, { 
                  maximumFractionDigits: 4 
                })}
              </p>
              <div className="flex items-center justify-end gap-2 text-xs">
                <AnimatedNumber 
                  value={token.value} 
                  prefix="$" 
                  decimals={2}
                  className="text-muted-foreground"
                />
                {change !== 0 && (
                  <span className={cn(
                    'flex items-center gap-0.5',
                    change > 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(change).toFixed(2)}%
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No balance</p>
          )}
        </div>
        
        {/* Navigate to token detail */}
        <Link to={`/token/${token.address}`}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
});

export default TokenList;
