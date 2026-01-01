import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Gift, 
  Clock, 
  TrendingUp, 
  Coins,
  Calendar,
  ArrowUpRight,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { ethers } from 'ethers';
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/web3/staking-config';
import { DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { getCurrentAccount } from '@/lib/web3/wallet';

interface StakePosition {
  poolId: number;
  tokenSymbol: string;
  tokenLogo?: string;
  stakedAmount: string;
  pendingRewards: string;
  apr: number;
  startTime: Date;
  lockEnd: Date;
  isLocked: boolean;
  progress: number;
}

interface RewardsTrackerProps {
  refreshTrigger?: number;
}

const RewardsTracker = ({ refreshTrigger }: RewardsTrackerProps) => {
  const [positions, setPositions] = useState<StakePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalStaked, setTotalStaked] = useState(0);

  useEffect(() => {
    loadPositions();
  }, [refreshTrigger]);

  const getTokenInfo = (address: string) => {
    const normalizedAddress = address.toLowerCase();
    return DEFAULT_TOKENS.find(t => t.address.toLowerCase() === normalizedAddress) || null;
  };

  const loadPositions = async () => {
    setLoading(true);
    try {
      const account = await getCurrentAccount();
      if (!account || typeof window.ethereum === 'undefined') {
        setPositions([]);
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        provider
      );

      const userPositions: StakePosition[] = [];
      let pendingSum = 0;
      let stakedSum = 0;

      for (let i = 0; i < 10; i++) {
        try {
          const pool = await stakingContract.pools(i);
          if (!pool || pool.token === ethers.ZeroAddress) break;

          const userStake = await stakingContract.userStakes(i, account);
          const stakedAmount = userStake.amount;
          
          if (stakedAmount > 0n) {
            const tokenInfo = getTokenInfo(pool.token);
            const decimals = tokenInfo?.decimals || 18;
            const stakedFormatted = parseFloat(ethers.formatUnits(stakedAmount, decimals));
            
            // Calculate pending rewards
            let pending = 0;
            try {
              const pendingRewards = await stakingContract.pendingRewards(i, account);
              pending = parseFloat(ethers.formatUnits(pendingRewards, decimals));
            } catch {}

            const startTime = new Date(Number(userStake.startTime) * 1000);
            const lockSeconds = Number(pool.lockPeriod);
            const lockEnd = new Date(startTime.getTime() + lockSeconds * 1000);
            const now = new Date();
            const isLocked = now < lockEnd;
            
            const elapsed = now.getTime() - startTime.getTime();
            const total = lockEnd.getTime() - startTime.getTime();
            const progress = Math.min(100, (elapsed / total) * 100);

            userPositions.push({
              poolId: i,
              tokenSymbol: tokenInfo?.symbol || 'UNKNOWN',
              tokenLogo: tokenInfo?.logoURI,
              stakedAmount: stakedFormatted.toFixed(4),
              pendingRewards: pending.toFixed(6),
              apr: Number(pool.apr),
              startTime,
              lockEnd,
              isLocked,
              progress,
            });

            pendingSum += pending;
            stakedSum += stakedFormatted;
          }
        } catch (error: any) {
          if (error.message?.includes('missing revert data')) break;
        }
      }

      setPositions(userPositions);
      setTotalPending(pendingSum);
      setTotalStaked(stakedSum);
    } catch (error) {
      console.error('Error loading positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDailyRewards = useMemo(() => {
    return positions.reduce((sum, pos) => {
      const staked = parseFloat(pos.stakedAmount);
      const daily = staked * (pos.apr / 100 / 365);
      return sum + daily;
    }, 0);
  }, [positions]);

  if (loading) {
    return (
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary animate-pulse" />
            Loading Rewards...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-green-500/5 to-transparent">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Gift className="w-5 h-5 text-green-500" />
            </div>
            Rewards Tracker
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={loadPositions} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
            <Wallet className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">Total Staked</p>
            <p className="text-lg font-bold">{totalStaked.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
            <Gift className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-green-500">{totalPending.toFixed(4)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Daily Est.</p>
            <p className="text-lg font-bold text-primary">{totalDailyRewards.toFixed(4)}</p>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="py-8 text-center">
            <Coins className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No active staking positions</p>
            <p className="text-sm text-muted-foreground/70">Stake tokens to start earning rewards</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={position.poolId}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/30 transition-all"
                >
                  {/* Token Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {position.tokenLogo ? (
                        <img 
                          src={position.tokenLogo} 
                          alt={position.tokenSymbol}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold">
                          {position.tokenSymbol.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold">{position.tokenSymbol}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Pool #{position.poolId}
                          </Badge>
                          <Badge 
                            className={`text-[10px] px-1.5 py-0 ${
                              position.isLocked 
                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/30' 
                                : 'bg-green-500/10 text-green-500 border-green-500/30'
                            }`}
                          >
                            {position.isLocked ? 'Locked' : 'Unlocked'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">APR</p>
                      <p className="text-lg font-bold text-green-500">{position.apr}%</p>
                    </div>
                  </div>

                  {/* Staked & Rewards */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase">Staked</p>
                      <p className="font-semibold">{position.stakedAmount}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                      <p className="text-[10px] text-muted-foreground uppercase">Pending Rewards</p>
                      <p className="font-semibold text-green-500 flex items-center gap-1">
                        {position.pendingRewards}
                        <ArrowUpRight className="w-3 h-3" />
                      </p>
                    </div>
                  </div>

                  {/* Lock Progress */}
                  {position.isLocked && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Lock Progress
                        </span>
                        <span>{position.progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={position.progress} className="h-2" />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {position.startTime.toLocaleDateString()}
                        </span>
                        <span>
                          Unlocks: {position.lockEnd.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RewardsTracker;