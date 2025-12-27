import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Plus, 
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/web3/staking-config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Pool {
  pid: number;
  token: string;
  apr: number;
  lockPeriod: number;
  minStake: string;
  totalStaked: string;
  active: boolean;
}

const StakingAdminPanel = () => {
  const [isOwner, setIsOwner] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState<Pool[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Add Pool Form State
  const [newPoolToken, setNewPoolToken] = useState('');
  const [newPoolApr, setNewPoolApr] = useState('');
  const [newPoolLockPeriod, setNewPoolLockPeriod] = useState('');
  const [newPoolMinStake, setNewPoolMinStake] = useState('');
  const [addingPool, setAddingPool] = useState(false);

  // Pool Status Update State
  const [updatingPool, setUpdatingPool] = useState<number | null>(null);

  useEffect(() => {
    checkOwnership();
  }, []);

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
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        provider
      );

      const owner = await stakingContract.owner();
      setOwnerAddress(owner.toLowerCase());
      setIsOwner(userAddress === owner.toLowerCase());

      if (userAddress === owner.toLowerCase()) {
        await loadPools(provider);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPools = async (provider: ethers.BrowserProvider) => {
    try {
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        provider
      );

      const loadedPools: Pool[] = [];
      for (let i = 0; i < 20; i++) {
        try {
          const pool = await stakingContract.pools(i);
          // Check if pool exists (token address should not be zero)
          if (!pool || pool.token === ethers.ZeroAddress) break;
          
          loadedPools.push({
            pid: i,
            token: pool.token,
            apr: Number(pool.apr),
            lockPeriod: Number(pool.lockPeriod),
            minStake: ethers.formatEther(pool.minStake),
            totalStaked: ethers.formatEther(pool.totalStaked),
            active: pool.active,
          });
        } catch (error: any) {
          // Check if it's "missing revert data" - means no pool at this index
          if (error.message?.includes('missing revert data') || error.message?.includes('could not coalesce')) {
            break;
          }
          console.warn(`Could not load pool ${i}:`, error.message);
          break;
        }
      }
      setPools(loadedPools);
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  };

  const handleAddPool = async () => {
    if (!newPoolToken || !newPoolApr || !newPoolLockPeriod || !newPoolMinStake) {
      toast.error('Please fill all fields');
      return;
    }

    if (!ethers.isAddress(newPoolToken)) {
      toast.error('Invalid token address');
      return;
    }

    setAddingPool(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        signer
      );

      const tx = await stakingContract.addPool(
        newPoolToken,
        parseInt(newPoolApr),
        parseInt(newPoolLockPeriod),
        ethers.parseEther(newPoolMinStake)
      );

      toast.info('Adding pool...');
      await tx.wait();
      
      toast.success('Pool added successfully!');
      setNewPoolToken('');
      setNewPoolApr('');
      setNewPoolLockPeriod('');
      setNewPoolMinStake('');
      
      await loadPools(provider);
    } catch (error: any) {
      console.error('Add pool error:', error);
      const errorMsg = error.reason || error.message || 'Failed to add pool';
      toast.error(errorMsg.includes('could not coalesce') ? 'Transaction failed - check your inputs' : errorMsg);
    } finally {
      setAddingPool(false);
    }
  };

  const handleSetPoolStatus = async (pid: number, status: boolean) => {
    setUpdatingPool(pid);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        signer
      );

      const tx = await stakingContract.setPoolStatus(pid, status);
      toast.info(`${status ? 'Activating' : 'Deactivating'} pool...`);
      await tx.wait();
      
      toast.success(`Pool ${status ? 'activated' : 'deactivated'} successfully!`);
      await loadPools(provider);
    } catch (error: any) {
      console.error('Set pool status error:', error);
      toast.error(error.reason || 'Failed to update pool status');
    } finally {
      setUpdatingPool(null);
    }
  };

  const formatLockPeriod = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days} days`;
    return `${hours} hours`;
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Shield className="w-4 h-4" />
            Admin
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
          Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Staking Admin Panel
          </DialogTitle>
          <DialogDescription>
            Manage staking pools and settings
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
                <p>Your address: <code className="text-primary">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</code></p>
                {ownerAddress && (
                  <p>Owner address: <code className="text-muted-foreground">{ownerAddress.slice(0, 8)}...{ownerAddress.slice(-6)}</code></p>
                )}
              </div>
            )}
            {!walletAddress && (
              <p className="text-sm text-muted-foreground">Please connect your wallet</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add New Pool */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add New Pool
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Token Address</Label>
                    <Input
                      placeholder="0x..."
                      value={newPoolToken}
                      onChange={(e) => setNewPoolToken(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>APR (%)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 50"
                      value={newPoolApr}
                      onChange={(e) => setNewPoolApr(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Lock Period (seconds)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 604800 for 7 days"
                      value={newPoolLockPeriod}
                      onChange={(e) => setNewPoolLockPeriod(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Minimum Stake (in tokens)</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 100"
                      value={newPoolMinStake}
                      onChange={(e) => setNewPoolMinStake(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAddPool} 
                  disabled={addingPool}
                  className="w-full"
                >
                  {addingPool ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding Pool...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pool
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* Existing Pools */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Manage Existing Pools ({pools.length})
              </h3>
              
              {pools.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pools created yet
                </p>
              ) : (
                <div className="space-y-3">
                  {pools.map((pool) => (
                    <div 
                      key={pool.pid}
                      className="p-4 rounded-lg border border-border/50 bg-background/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Pool #{pool.pid}</span>
                            <Badge variant={pool.active ? 'default' : 'secondary'}>
                              {pool.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-1">
                            {pool.token.slice(0, 10)}...{pool.token.slice(-8)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={pool.active}
                              onCheckedChange={(checked) => handleSetPoolStatus(pool.pid, checked)}
                              disabled={updatingPool === pool.pid}
                            />
                            {updatingPool === pool.pid && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">APR</p>
                          <p className="font-medium text-green-500">{pool.apr}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Lock</p>
                          <p className="font-medium">{formatLockPeriod(pool.lockPeriod)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Min Stake</p>
                          <p className="font-medium">{pool.minStake}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Total Staked</p>
                          <p className="font-medium">{parseFloat(pool.totalStaked).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contract Info */}
            <div className="p-3 rounded-lg bg-muted/30 text-xs">
              <p className="text-muted-foreground mb-1">Contract Address:</p>
              <code className="text-primary break-all">{STAKING_CONTRACT.address}</code>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StakingAdminPanel;
