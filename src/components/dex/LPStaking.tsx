import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Coins, 
  Clock, 
  TrendingUp, 
  Lock,
  ChevronDown,
  ChevronUp,
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
  tokenDecimals: number;
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

interface TokenBalance {
  balance: string;
  formatted: string;
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
  const [tokenBalances, setTokenBalances] = useState<Record<number, TokenBalance>>({});
  const [loading, setLoading] = useState(true);
  const [stakeAmounts, setStakeAmounts] = useState<Record<number, string>>({});
  const [stakingPid, setStakingPid] = useState<number | null>(null);
  const [unstakingPid, setUnstakingPid] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [expandedPools, setExpandedPools] = useState<Record<number, boolean>>({});

  useEffect(() => {
    checkWallet();
    loadPools();
  }, []);

  useEffect(() => {
    if (walletAddress && pools.length > 0) {
      loadUserStakes();
      loadTokenBalances();
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

      const loadedPools: StakingPool[] = [];
      for (let i = 0; i < 10; i++) {
        try {
          const pool = await stakingContract.pools(i);
          if (!pool || pool.token === ethers.ZeroAddress) break;
          
          const tokenInfo = getTokenInfo(pool.token);
          let tokenSymbol = tokenInfo?.symbol || 'TOKEN';
          let tokenName = tokenInfo?.name || 'Unknown Token';
          let tokenLogo = tokenInfo?.logoURI;
          let tokenDecimals = tokenInfo?.decimals || 18;

          if (!tokenInfo) {
            try {
              const tokenContract = new ethers.Contract(pool.token, ERC20_ABI, provider);
              tokenSymbol = await tokenContract.symbol();
              tokenName = await tokenContract.name();
              tokenDecimals = await tokenContract.decimals();
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
            tokenDecimals,
            apr: Number(pool.apr),
            lockPeriod: Number(pool.lockPeriod),
            minStake: ethers.formatEther(pool.minStake),
            totalStaked: ethers.formatEther(pool.totalStaked),
            active: pool.active,
          });
        } catch (error: any) {
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

  const loadTokenBalances = async () => {
    if (!walletAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const balances: Record<number, TokenBalance> = {};

      for (const pool of pools) {
        try {
          const tokenContract = new ethers.Contract(pool.token, ERC20_ABI, provider);
          const balance = await tokenContract.balanceOf(walletAddress);
          const formatted = ethers.formatUnits(balance, pool.tokenDecimals);
          balances[pool.pid] = {
            balance: balance.toString(),
            formatted,
          };
        } catch (error) {
          balances[pool.pid] = { balance: '0', formatted: '0' };
        }
      }

      setTokenBalances(balances);
    } catch (error) {
      console.error('Error loading token balances:', error);
    }
  };

  const handleSetMax = (pid: number) => {
    const balance = tokenBalances[pid]?.formatted || '0';
    setStakeAmounts({ ...stakeAmounts, [pid]: balance });
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
      
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const amountWei = ethers.parseEther(amount);
      
      toast.info('Approving tokens...');
      const approveTx = await tokenContract.approve(STAKING_CONTRACT.address, amountWei);
      await approveTx.wait();

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
      loadTokenBalances();
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
      loadTokenBalances();
    } catch (error: any) {
      console.error('Unstake error:', error);
      toast.error(error.reason || 'Failed to unstake');
    } finally {
      setUnstakingPid(null);
    }
  };

  const formatLockPeriod = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    if (days > 0) return `${days}d`;
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  };

  const formatTimeRemaining = (unlockTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = unlockTime - now;
    if (remaining <= 0) return 'Unlocked';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const calculateTVL = (totalStaked: string): string => {
    const staked = parseFloat(totalStaked);
    if (staked >= 1000000) return `${(staked / 1000000).toFixed(2)}M`;
    if (staked >= 1000) return `${(staked / 1000).toFixed(2)}K`;
    return staked.toFixed(3);
  };

  const toggleExpand = (pid: number) => {
    setExpandedPools(prev => ({ ...prev, [pid]: !prev[pid] }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-80 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-semibold mb-2">No Staking Pools Available</h3>
        <p className="text-muted-foreground">Check back later for staking opportunities</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {pools.filter(p => p.active).map((pool) => {
        const stake = userStakes[pool.pid];
        const hasStake = stake && parseFloat(stake.amount) > 0;
        const balance = tokenBalances[pool.pid];
        const isExpanded = expandedPools[pool.pid] ?? false;

        return (
          <div
            key={pool.pid}
            className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border/30">
              <div className="flex items-start justify-between mb-3">
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
                    <h4 className="font-bold text-lg">{pool.tokenSymbol}</h4>
                    <p className="text-xs text-muted-foreground">{pool.tokenName}</p>
                  </div>
                </div>
                <Badge className="bg-primary/20 text-primary border-primary/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Staking
                </Badge>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">APR</span>
                  <span className="font-bold text-primary">{pool.apr}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Lock</span>
                  <span className="font-medium">{formatLockPeriod(pool.lockPeriod)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">TVL</span>
                  <span className="font-medium">{calculateTVL(pool.totalStaked)}</span>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="p-4 space-y-2 bg-muted/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Staked</span>
                <span className="font-semibold">
                  {hasStake ? `${parseFloat(stake.amount).toFixed(4)} ${pool.tokenSymbol}` : `0.0000 ${pool.tokenSymbol}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Earned</span>
                <span className="font-semibold text-primary">
                  {stake ? `${parseFloat(stake.pendingReward).toFixed(4)} ${pool.tokenSymbol}` : `0.0000 ${pool.tokenSymbol}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Lock Status
                </span>
                <span className={`font-medium ${stake?.canUnstake ? 'text-green-500' : 'text-yellow-500'}`}>
                  {hasStake ? formatTimeRemaining(stake.unlockTime) : '-'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/30">
                Min. Stake: {pool.minStake} {pool.tokenSymbol}
              </div>
            </div>

            {/* Expandable Section */}
            <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(pool.pid)}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full rounded-none border-t border-border/30 flex items-center justify-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      <span>Hide</span>
                      <ChevronUp className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>Show</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 space-y-4 border-t border-border/30">
                  {/* Stake/Unstake Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      disabled={stakingPid === pool.pid || hasStake}
                      onClick={() => {
                        if (!hasStake && stakeAmounts[pool.pid]) {
                          handleStake(pool.pid, pool.token);
                        }
                      }}
                    >
                      {stakingPid === pool.pid ? 'Staking...' : 'Stake'}
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      disabled={unstakingPid === pool.pid || !hasStake || !stake?.canUnstake}
                      onClick={() => handleUnstake(pool.pid)}
                    >
                      {unstakingPid === pool.pid ? 'Unstaking...' : 'Unstake'}
                    </Button>
                  </div>

                  {/* Already Staking Warning */}
                  {hasStake && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <p className="text-sm font-medium text-yellow-500">Already staking in this pool</p>
                      <p className="text-xs text-muted-foreground">Unstake first to stake a different amount.</p>
                    </div>
                  )}

                  {/* Input Section */}
                  {!hasStake && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-medium">
                          {balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'} {pool.tokenSymbol}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={stakeAmounts[pool.pid] || ''}
                          onChange={(e) => setStakeAmounts({ ...stakeAmounts, [pool.pid]: e.target.value })}
                          className="flex-1"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSetMax(pool.pid)}
                        >
                          MAX
                        </Button>
                      </div>

                      <Button 
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={stakingPid === pool.pid || !walletAddress || !stakeAmounts[pool.pid]}
                        onClick={() => handleStake(pool.pid, pool.token)}
                      >
                        {stakingPid === pool.pid ? 'Staking...' : `Stake ${pool.tokenSymbol}`}
                      </Button>
                    </>
                  )}

                  {!walletAddress && (
                    <p className="text-xs text-center text-muted-foreground">
                      Connect wallet to stake
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}
    </div>
  );
};

export default LPStaking;
