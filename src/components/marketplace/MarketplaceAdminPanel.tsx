import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Settings, 
  AlertTriangle,
  Loader2,
  Percent,
  Wallet,
  DollarSign,
  Save
} from 'lucide-react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { CONTRACTS, MARKETPLACE_ABI } from '@/lib/web3/config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MarketplaceAdminPanel = () => {
  const [isOwner, setIsOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Current settings
  const [currentFee, setCurrentFee] = useState<number>(0);
  const [currentFeeRecipient, setCurrentFeeRecipient] = useState<string>('');

  // Form State
  const [newFee, setNewFee] = useState('');
  const [newFeeRecipient, setNewFeeRecipient] = useState('');
  const [updatingFee, setUpdatingFee] = useState(false);
  const [updatingRecipient, setUpdatingRecipient] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkOwnership();
    }
  }, [isOpen]);

  const checkOwnership = async () => {
    setLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        setLoading(false);
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        setLoading(false);
        return;
      }

      const userAddress = accounts[0].toLowerCase();
      setWalletAddress(userAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if marketplace contract exists
      const code = await provider.getCode(CONTRACTS.Marketplace);
      if (code === '0x' || code === '0x0') {
        setLoading(false);
        return;
      }

      const marketplaceContract = new ethers.Contract(
        CONTRACTS.Marketplace,
        MARKETPLACE_ABI,
        provider
      );

      try {
        const owner = await marketplaceContract.owner();
        setOwnerAddress(owner.toLowerCase());
        setIsOwner(userAddress === owner.toLowerCase());

        if (userAddress === owner.toLowerCase()) {
          // Load current settings
          await loadCurrentSettings(provider);
        }
      } catch (e) {
        console.error('Error checking ownership:', e);
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSettings = async (provider: ethers.BrowserProvider) => {
    try {
      const marketplaceContract = new ethers.Contract(
        CONTRACTS.Marketplace,
        MARKETPLACE_ABI,
        provider
      );

      const fee = await marketplaceContract.marketplaceFee();
      const recipient = await marketplaceContract.feeRecipient();

      setCurrentFee(Number(fee));
      setCurrentFeeRecipient(recipient);
      setNewFee(fee.toString());
      setNewFeeRecipient(recipient);
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  };

  const handleSetFee = async () => {
    if (!newFee || parseInt(newFee) < 0 || parseInt(newFee) > 1000) {
      toast.error('Fee must be between 0 and 1000 (0% - 10%)');
      return;
    }

    setUpdatingFee(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      const marketplaceContract = new ethers.Contract(
        CONTRACTS.Marketplace,
        MARKETPLACE_ABI,
        signer
      );

      toast.info('Setting new fee...');
      const tx = await marketplaceContract.setFee(parseInt(newFee));
      await tx.wait();
      
      toast.success('Fee updated successfully!');
      setCurrentFee(parseInt(newFee));
    } catch (error: any) {
      console.error('Set fee error:', error);
      toast.error(error.reason || 'Failed to update fee');
    } finally {
      setUpdatingFee(false);
    }
  };

  const handleSetFeeRecipient = async () => {
    if (!newFeeRecipient || !ethers.isAddress(newFeeRecipient)) {
      toast.error('Please enter a valid address');
      return;
    }

    setUpdatingRecipient(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      const marketplaceContract = new ethers.Contract(
        CONTRACTS.Marketplace,
        MARKETPLACE_ABI,
        signer
      );

      toast.info('Setting new fee recipient...');
      const tx = await marketplaceContract.setFeeRecipient(newFeeRecipient);
      await tx.wait();
      
      toast.success('Fee recipient updated successfully!');
      setCurrentFeeRecipient(newFeeRecipient);
    } catch (error: any) {
      console.error('Set fee recipient error:', error);
      toast.error(error.reason || 'Failed to update fee recipient');
    } finally {
      setUpdatingRecipient(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const calculateFeePercent = (fee: number) => {
    return (fee / 100).toFixed(2);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Shield className="w-4 h-4" />
            Marketplace Admin
          </Button>
        </DialogTrigger>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="w-4 h-4" />
          Marketplace Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Marketplace Admin Panel
          </DialogTitle>
          <DialogDescription>
            Manage marketplace fees and settings
          </DialogDescription>
        </DialogHeader>

        {!isOwner ? (
          <div className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Only the contract owner can access the admin panel.
            </p>
            {walletAddress && (
              <div className="text-xs space-y-1">
                <p>Your address: <code className="text-primary">{formatAddress(walletAddress)}</code></p>
                {ownerAddress && (
                  <p>Owner address: <code className="text-muted-foreground">{formatAddress(ownerAddress)}</code></p>
                )}
              </div>
            )}
            {!walletAddress && (
              <p className="text-sm text-muted-foreground">Please connect your wallet</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Settings Display */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Current Fee</span>
                  </div>
                  <p className="text-2xl font-bold">{calculateFeePercent(currentFee)}%</p>
                  <p className="text-xs text-muted-foreground">({currentFee}/10000)</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">Fee Recipient</span>
                  </div>
                  <p className="text-sm font-mono font-medium truncate">
                    {currentFeeRecipient ? formatAddress(currentFeeRecipient) : 'Not set'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Update Fee */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Update Marketplace Fee
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Fee (basis points: 100 = 1%)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 250 for 2.5%"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    min={0}
                    max={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter value between 0-1000 (0% - 10%). Current: {calculateFeePercent(currentFee)}%
                  </p>
                </div>
                <Button 
                  onClick={handleSetFee} 
                  disabled={updatingFee || !newFee}
                  className="w-full"
                >
                  {updatingFee ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Fee
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Update Fee Recipient */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Update Fee Recipient
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipient Address</Label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={newFeeRecipient}
                    onChange={(e) => setNewFeeRecipient(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The address that will receive marketplace fees
                  </p>
                </div>
                <Button 
                  onClick={handleSetFeeRecipient} 
                  disabled={updatingRecipient || !newFeeRecipient}
                  variant="secondary"
                  className="w-full"
                >
                  {updatingRecipient ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Recipient
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Contract Info */}
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <p className="font-medium mb-1">Contract Address</p>
              <p className="font-mono break-all">{CONTRACTS.Marketplace}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MarketplaceAdminPanel;
