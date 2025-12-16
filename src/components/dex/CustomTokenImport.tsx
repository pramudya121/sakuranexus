import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { ethers } from 'ethers';
import { Token } from '@/lib/web3/dex-config';

const STORAGE_KEY = 'custom_tokens';

export const getCustomTokens = (): Token[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveCustomToken = (token: Token) => {
  const tokens = getCustomTokens();
  // Avoid duplicates
  if (!tokens.find(t => t.address.toLowerCase() === token.address.toLowerCase())) {
    tokens.push(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  }
};

export const removeCustomToken = (address: string) => {
  const tokens = getCustomTokens();
  const filtered = tokens.filter(t => t.address.toLowerCase() !== address.toLowerCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

interface CustomTokenImportProps {
  open: boolean;
  onClose: () => void;
  onTokenImported: (token: Token) => void;
}

const CustomTokenImport = ({ open, onClose, onTokenImported }: CustomTokenImportProps) => {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);

  const ERC20_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
  ];

  const handleAddressChange = async (value: string) => {
    setAddress(value);
    setError('');
    setTokenInfo(null);

    if (!value || value.length !== 42) return;

    if (!ethers.isAddress(value)) {
      setError('Invalid address format');
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(value, ERC20_ABI, provider);

      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      setTokenInfo({
        address: value,
        name,
        symbol,
        decimals: Number(decimals),
        logoURI: '',
      });
    } catch (err) {
      console.error('Error fetching token info:', err);
      setError('Could not fetch token info. Make sure this is a valid ERC20 token address.');
    }
    setIsLoading(false);
  };

  const handleImport = () => {
    if (!tokenInfo) return;

    saveCustomToken(tokenInfo);
    onTokenImported(tokenInfo);
    handleClose();
  };

  const handleClose = () => {
    setAddress('');
    setError('');
    setTokenInfo(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Import Custom Token
          </DialogTitle>
          <DialogDescription>
            Add a custom ERC20 token by entering its contract address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="token-address">Token Contract Address</Label>
            <Input
              id="token-address"
              placeholder="0x..."
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              className="font-mono"
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Fetching token info...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {tokenInfo && (
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold">
                  {tokenInfo.symbol.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{tokenInfo.symbol}</p>
                  <p className="text-sm text-muted-foreground">{tokenInfo.name}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Decimals:</span>
                  <span className="ml-2">{tokenInfo.decimals}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Address:</span>
                  <span className="ml-2 font-mono text-xs">
                    {tokenInfo.address.slice(0, 6)}...{tokenInfo.address.slice(-4)}
                  </span>
                </div>
              </div>

              <Alert className="bg-yellow-500/10 border-yellow-500/50">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-500 text-xs">
                  Anyone can create a token, including fake versions. Always verify the token address!
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!tokenInfo || isLoading}
            className="bg-gradient-sakura"
          >
            Import Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomTokenImport;
