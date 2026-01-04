import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Gift, 
  Coins, 
  TrendingUp, 
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/web3/staking-config';
import { DEFAULT_TOKENS, ERC20_ABI } from '@/lib/web3/dex-config';

interface PendingReward {
  pid: number;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  stakedAmount: string;
  pendingReward: string;
  apr: number;
  canClaim: boolean;
}

interface RewardsClaimPanelProps {
  refreshTrigger?: number;
  onClaimed?: () => void;
}

const getTokenInfo = (address: string) => {
  const normalizedAddress = address.toLowerCase();
  const token = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === normalizedAddress);
  return token || null;
};

const RewardsClaimPanel = ({ refreshTrigger, onClaimed }: RewardsClaimPanelProps) => {
  const [rewards, setRewards] = useState<PendingReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    loadRewards();
  }, [refreshTrigger]);

  const loadRewards = async () => {
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

      const userAddress = accounts[0];
      setWalletAddress(userAddress);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        provider
      );

      const pendingRewards: PendingReward[] = [];
      let total = 0;

      for (let i = 0; i < 10; i++) {
        try {
          const pool = await stakingContract.pools(i);
          if (!pool || pool.token === ethers.ZeroAddress) break;

          const userStake = await stakingContract.userStakes(i, userAddress);
          const pendingReward = await stakingContract.pendingReward(i, userAddress);
          
          const stakedAmount = parseFloat(ethers.formatEther(userStake.amount));
          const pending = parseFloat(ethers.formatEther(pendingReward));
          
          if (stakedAmount > 0) {
            const tokenInfo = getTokenInfo(pool.token);
            const now = Math.floor(Date.now() / 1000);
            const unlockTime = Number(userStake.startTime) + Number(pool.lockPeriod);
            const canClaim = now >= unlockTime;

            pendingRewards.push({
              pid: i,
              tokenSymbol: tokenInfo?.symbol || 'TOKEN',
              tokenName: tokenInfo?.name || 'Unknown Token',
              tokenLogo: tokenInfo?.logoURI,
              stakedAmount: stakedAmount.toFixed(4),
              pendingReward: pending.toFixed(6),
              apr: Number(pool.apr),
              canClaim,
            });

            total += pending;
          }
        } catch (error: any) {
          if (error.message?.includes('missing revert data')) break;
        }
      }

      setRewards(pendingRewards);
      setTotalPending(total);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async (pid: number) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    setClaiming(pid);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        signer
      );

      // Note: This contract claims rewards by unstaking
      // The rewards are paid out when you unstake
      toast.info('Claiming rewards (unstaking)...');
      const tx = await stakingContract.unstake(pid);
      await tx.wait();

      toast.success('Rewards claimed successfully!');
      loadRewards();
      onClaimed?.();
    } catch (error: any) {
      console.error('Claim error:', error);
      if (error.reason) {
        toast.error(error.reason);
      } else if (error.message?.includes('user rejected')) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error('Failed to claim rewards');
      }
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-primary" />
            Pending Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!walletAddress) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-primary" />
            Pending Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">Connect wallet to view rewards</p>
        </CardContent>
      </Card>
    );
  }

  if (rewards.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-primary" />
            Pending Rewards
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Coins className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No active stakes</p>
          <p className="text-xs text-muted-foreground mt-1">Stake tokens to earn rewards</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-primary" />
            Pending Rewards
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadRewards}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Total Pending Rewards
              </p>
              <p className="text-3xl font-bold text-primary mt-1">
                {totalPending.toFixed(4)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {rewards.length} active stake{rewards.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Earning
              </Badge>
            </div>
          </div>
        </div>

        {/* Individual Rewards */}
        <div className="space-y-3">
          {rewards.map((reward) => (
            <div 
              key={reward.pid}
              className="p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {reward.tokenLogo ? (
                    <img 
                      src={reward.tokenLogo} 
                      alt={reward.tokenSymbol}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Coins className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{reward.tokenSymbol}</p>
                    <p className="text-xs text-muted-foreground">
                      Staked: {reward.stakedAmount}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">+{reward.pendingReward}</p>
                  <p className="text-xs text-muted-foreground">{reward.apr}% APR</p>
                </div>
              </div>
              
              {parseFloat(reward.pendingReward) > 0 && (
                <Button
                  size="sm"
                  className="w-full mt-3"
                  disabled={!reward.canClaim || claiming === reward.pid}
                  onClick={() => handleClaimRewards(reward.pid)}
                >
                  {claiming === reward.pid ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : !reward.canClaim ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Still Locked
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Claim Rewards (Unstake)
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Note: Claiming rewards will unstake your tokens
        </p>
      </CardContent>
    </Card>
  );
};

export default RewardsClaimPanel;
