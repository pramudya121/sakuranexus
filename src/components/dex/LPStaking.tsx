import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Coins, 
  Clock, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  Lock,
  Gift,
  AlertCircle
} from 'lucide-react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/web3/staking-config';
import { ERC20_ABI, DEFAULT_TOKENS } from '@/lib/web3/dex-config';

interface StakingPool {
  pid: number;
  token: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  apr: number;
  lockPeriod: number;
  minStake: string;
  totalStaked: string;
  active: boolean;
}

interface UserStake {
  amount: string;
  startTime: number;
  rewardClaimed: string;
  pendingReward: string;
  canUnstake: boolean;
  unlockTime: number;
}

// Helper function to get token info from DEFAULT_TOKENS
const getTokenInfo = (address: string) => {
  const normalizedAddress = address.toLowerCase();
  const token = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === normalizedAddress);
  return token || null;
};

const LPStaking = () => {
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [userStakes, setUserStakes] = useState<Record<number, UserStake>>({});
  const [loading, setLoading] = useState(true);
  const [stakeAmounts, setStakeAmounts] = useState<Record<number, string>>({});
  const [stakingPid, setStakingPid] = useState<number | null>(null);
  const [unstakingPid, setUnstakingPid] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    checkWallet();
    loadPools();
  }, []);

  useEffect(() => {
    if (walletAddress && pools.length > 0) {
      loadUserStakes();
    }
  }, [walletAddress, pools]);

  const checkWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
      }
    }
  };

  const loadPools = async () => {
    setLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        // No wallet - show empty state
        setPools([]);
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        provider
      );

      // Try to load pools - we'll try up to 10 pools
      const loadedPools: StakingPool[] = [];
      for (let i = 0; i < 10; i++) {
        try {
          const pool = await stakingContract.pools(i);
          // Check if pool exists (token address should not be zero)
          if (!pool || pool.token === ethers.ZeroAddress) break;
          
          // Get token info from our token list first
          const tokenInfo = getTokenInfo(pool.token);
          let tokenSymbol = tokenInfo?.symbol || 'TOKEN';
          let tokenName = tokenInfo?.name || 'Unknown Token';
          let tokenLogo = tokenInfo?.logoURI;

          // If not in our list, try to get from contract
          if (!tokenInfo) {
            try {
              const tokenContract = new ethers.Contract(pool.token, ERC20_ABI, provider);
              tokenSymbol = await tokenContract.symbol();
              tokenName = await tokenContract.name();
            } catch (e) {
              console.warn('Could not get token info:', e);
            }
          }

          loadedPools.push({
            pid: i,
            token: pool.token,
            tokenSymbol,
            tokenName,
            tokenLogo,
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
          // Log other errors but continue
          console.warn(`Could not load pool ${i}:`, error.message);
          break;
        }
      }

      setPools(loadedPools);
    } catch (error) {
      console.error('Error loading pools:', error);
      toast.error('Failed to load staking pools');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStakes = async () => {
    if (!walletAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        provider
      );

      const stakes: Record<number, UserStake> = {};
      const now = Math.floor(Date.now() / 1000);

      for (const pool of pools) {
        try {
          const userStake = await stakingContract.userStakes(pool.pid, walletAddress);
          const pendingReward = await stakingContract.pendingReward(pool.pid, walletAddress);
          const unlockTime = Number(userStake.startTime) + pool.lockPeriod;

          stakes[pool.pid] = {
            amount: ethers.formatEther(userStake.amount),
            startTime: Number(userStake.startTime),
            rewardClaimed: ethers.formatEther(userStake.rewardClaimed),
            pendingReward: ethers.formatEther(pendingReward),
            canUnstake: now >= unlockTime || userStake.amount === 0n,
            unlockTime,
          };
        } catch (error) {
          stakes[pool.pid] = {
            amount: '0',
            startTime: 0,
            rewardClaimed: '0',
            pendingReward: '0',
            canUnstake: true,
            unlockTime: 0,
          };
        }
      }

      setUserStakes(stakes);
    } catch (error) {
      console.error('Error loading user stakes:', error);
    }
  };

  const handleStake = async (pid: number, tokenAddress: string) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    const amount = stakeAmounts[pid];
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setStakingPid(pid);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      // First approve tokens
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const amountWei = ethers.parseEther(amount);
      
      toast.info('Approving tokens...');
      const approveTx = await tokenContract.approve(STAKING_CONTRACT.address, amountWei);
      await approveTx.wait();

      // Then stake
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        signer
      );
      
      toast.info('Staking tokens...');
      const stakeTx = await stakingContract.stake(pid, amountWei);
      await stakeTx.wait();

      toast.success('Successfully staked!');
      setStakeAmounts({ ...stakeAmounts, [pid]: '' });
      loadPools();
      loadUserStakes();
    } catch (error: any) {
      console.error('Stake error:', error);
      toast.error(error.reason || 'Failed to stake');
    } finally {
      setStakingPid(null);
    }
  };

  const handleUnstake = async (pid: number) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    setUnstakingPid(pid);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        signer
      );
      
      toast.info('Unstaking tokens...');
      const tx = await stakingContract.unstake(pid);
      await tx.wait();

      toast.success('Successfully unstaked!');
      loadPools();
      loadUserStakes();
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error(error.reason || 'Failed to unstake');
    } finally {
      setUnstakingPid(null);
    }
  };

  const formatLockPeriod = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days} days`;
    return `${hours} hours`;
  };

  const formatTimeRemaining = (unlockTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = unlockTime - now;
    if (remaining <= 0) return 'Unlocked';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <Card className="glass border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Token Staking
            </CardTitle>
            <CardDescription>Stake individual tokens to earn rewards</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Gift className="w-3 h-3" />
            Earn Rewards
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pools.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No staking pools available</p>
          </div>
        ) : (
          pools.map((pool) => {
            const stake = userStakes[pool.pid];
            const hasStake = stake && parseFloat(stake.amount) > 0;

            return (
              <div
                key={pool.pid}
                className="p-4 rounded-xl border border-border/50 bg-background/50 space-y-4"
              >
                {/* Pool Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {pool.tokenLogo ? (
                      <img 
                        src={pool.tokenLogo} 
                        alt={pool.tokenSymbol}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center">
                        <Coins className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold">{pool.tokenSymbol}</h4>
                      <p className="text-xs text-muted-foreground">
                        {pool.tokenName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold">{pool.apr}% APR</span>
                    </div>
                    <Badge variant={pool.active ? 'default' : 'secondary'} className="mt-1">
                      {pool.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Pool Stats */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Lock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Lock Period</p>
                    <p className="font-medium">{formatLockPeriod(pool.lockPeriod)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Wallet className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Min Stake</p>
                    <p className="font-medium">{pool.minStake}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30">
                    <Coins className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Total Staked</p>
                    <p className="font-medium">{parseFloat(pool.totalStaked).toLocaleString()}</p>
                  </div>
                </div>

                {/* User Stake Info */}
                {hasStake && stake && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Your Stake</span>
                      <span className="font-semibold">{parseFloat(stake.amount).toFixed(4)} {pool.tokenSymbol}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Pending Rewards</span>
                      <span className="font-semibold text-green-500">
                        +{parseFloat(stake.pendingReward).toFixed(6)} {pool.tokenSymbol}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Lock Status
                      </span>
                      <span className={`text-sm ${stake.canUnstake ? 'text-green-500' : 'text-yellow-500'}`}>
                        {formatTimeRemaining(stake.unlockTime)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stake/Unstake Actions */}
                {pool.active && (
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2">
                      <Input
                        type="number"
                        placeholder={`Min: ${pool.minStake}`}
                        value={stakeAmounts[pool.pid] || ''}
                        onChange={(e) => setStakeAmounts({ ...stakeAmounts, [pool.pid]: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleStake(pool.pid, pool.token)}
                        disabled={stakingPid === pool.pid || !walletAddress}
                        className="gap-1"
                      >
                        {stakingPid === pool.pid ? (
                          'Staking...'
                        ) : (
                          <>
                            <ArrowUpRight className="w-4 h-4" />
                            Stake
                          </>
                        )}
                      </Button>
                    </div>
                    {hasStake && (
                      <Button
                        variant="outline"
                        onClick={() => handleUnstake(pool.pid)}
                        disabled={unstakingPid === pool.pid || !stake?.canUnstake}
                        className="gap-1"
                      >
                        {unstakingPid === pool.pid ? 'Unstaking...' : 'Unstake'}
                      </Button>
                    )}
                  </div>
                )}

                {!walletAddress && (
                  <p className="text-xs text-center text-muted-foreground">
                    Connect wallet to stake
                  </p>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

export default LPStaking;
