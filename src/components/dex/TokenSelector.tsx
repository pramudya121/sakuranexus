import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { Search, Check } from 'lucide-react';

interface TokenSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken?: Token;
  disabledToken?: Token;
}

const TokenSelector = ({ open, onClose, onSelect, selectedToken, disabledToken }: TokenSelectorProps) => {
  const [search, setSearch] = useState('');

  const filteredTokens = DEFAULT_TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (token: Token) => {
    if (disabledToken?.address === token.address) return;
    onSelect(token);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Select Token</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>

        <ScrollArea className="h-[300px] mt-4">
          <div className="space-y-1">
            {filteredTokens.map((token) => {
              const isSelected = selectedToken?.address === token.address;
              const isDisabled = disabledToken?.address === token.address;

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
                  <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold">
                    {token.symbol.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelector;
