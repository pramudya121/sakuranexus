import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { getTokenBalance } from '@/lib/web3/dex';
import { getCurrentAccount } from '@/lib/web3/wallet';
import { Search, Check, Loader2, Plus, X } from 'lucide-react';
import CustomTokenImport, { getCustomTokens, removeCustomToken } from './CustomTokenImport';

interface TokenSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  disabledToken?: Token;
}

const TokenSelector = ({ open, onClose, onSelect, selectedToken, disabledToken }: TokenSelectorProps) => {
  const [search, setSearch] = useState('');
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [customTokens, setCustomTokens] = useState<Token[]>([]);

  useEffect(() => {
    if (open) {
      loadAccountAndBalances();
      setCustomTokens(getCustomTokens());
    }
  }, [open]);

  const allTokens = [...DEFAULT_TOKENS, ...customTokens];

  const loadAccountAndBalances = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
    
    if (acc) {
      setLoadingBalances(true);
      const newBalances: Record<string, string> = {};
      const tokensToLoad = [...DEFAULT_TOKENS, ...getCustomTokens()];
      
      // Load balances sequentially with delay to avoid rate limiting
      for (const token of tokensToLoad) {
        try {
          const balance = await getTokenBalance(token.address, acc);
          newBalances[token.address] = balance;
        } catch (error) {
          console.error(`Error loading balance for ${token.symbol}:`, error);
          newBalances[token.address] = '0';
        }
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      setBalances(newBalances);
      setLoadingBalances(false);
    }
  };

  const handleRemoveCustomToken = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    removeCustomToken(address);
    setCustomTokens(getCustomTokens());
  };

  const handleTokenImported = (token: Token) => {
    setCustomTokens(getCustomTokens());
  };

  const filteredTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.address.toLowerCase().includes(search.toLowerCase())
  );

  const isCustomToken = (address: string) => {
    return customTokens.some(t => t.address.toLowerCase() === address.toLowerCase());
  };

  const handleSelect = (token: Token) => {
    if (disabledToken?.address === token.address) return;
    onSelect(token);
    onClose();
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(4);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md glass border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Select Token</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose a token from the list or import a custom one
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or address"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowImport(true)}
              title="Import Custom Token"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

        <ScrollArea className="h-[300px] mt-4">
          <div className="space-y-1">
            {filteredTokens.map((token) => {
              const isSelected = selectedToken?.address === token.address;
              const isDisabled = disabledToken?.address === token.address;
              const balance = balances[token.address] || '0';

              return (
                <button
                  key={token.address}
                  onClick={() => handleSelect(token)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary/20 border border-primary/50'
                      : 'hover:bg-secondary/50'
                  }`}
                >
                  {token.logoURI ? (
                    <img 
                      src={token.logoURI} 
                      alt={token.symbol} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold">
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    {loadingBalances ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <p className="text-sm font-medium">{formatBalance(balance)}</p>
                    )}
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                    {isCustomToken(token.address) && (
                      <button
                        onClick={(e) => handleRemoveCustomToken(e, token.address)}
                        className="p-1 hover:bg-destructive/20 rounded-full transition-colors"
                        title="Remove custom token"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
        </DialogContent>
      </Dialog>

      <CustomTokenImport 
        open={showImport}
        onClose={() => setShowImport(false)}
        onTokenImported={handleTokenImported}
      />
    </>
  );
};

export default TokenSelector;
