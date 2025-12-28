import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Coins, Clock, Gift, TrendingUp, ArrowUpRight, Sparkles } from 'lucide-react';
import { ethers } from 'ethers';
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/web3/staking-config';
import { DEFAULT_TOKENS } from '@/lib/web3/dex-config';

interface StakedPosition {
  poolId: number;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo?: string;
  amount: string;
  startTime: number;
  apr: number;
  pendingReward: string;
  lockPeriod: number;
  isLocked: boolean;
  unlockTime: number;
  estimatedValue: number;
}

interface MyStakingProps {
  walletAddress: string;
  refreshTrigger: number;
  onStakingLoaded?: (positions: StakedPosition[]) => void;
}

// Mock token prices
const TOKEN_PRICES: Record<string, number> = {
  'NEX': 1.25,
  'WNEX': 1.25,
  'NXSA': 0.05,
  'WETH': 2500,
  'BNB': 650,
  'USDC': 1.0,
};

const getTokenInfo = (address: string) => {
  const normalizedAddress = address.toLowerCase();
  return DEFAULT_TOKENS.find(t => t.address.toLowerCase() === normalizedAddress) || null;
};

const MyStaking = ({ walletAddress, refreshTrigger, onStakingLoaded }: MyStakingProps) => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<StakedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStakedValue, setTotalStakedValue] = useState(0);
  const [totalPendingRewards, setTotalPendingRewards] = useState(0);

  useEffect(() => {
    if (walletAddress) {
      loadStaking();
    }
  }, [walletAddress, refreshTrigger]);

  const loadStaking = async () => {
    setIsLoading(true);

    try {
      if (typeof window.ethereum === 'undefined') {
        setIsLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        provider
      );

      const stakedPositions: StakedPosition[] = [];
      const currentTime = Math.floor(Date.now() / 1000);

      // Check up to 20 pools
      for (let pid = 0; pid < 20; pid++) {
        try {
          const pool = await stakingContract.pools(pid);
          if (!pool || pool.token === ethers.ZeroAddress) break;
          
          const userStake = await stakingContract.userStakes(pid, walletAddress);
          const stakedAmount = userStake.amount;
          
          if (stakedAmount > 0n) {
            const tokenInfo = getTokenInfo(pool.token);
            const decimals = tokenInfo?.decimals || 18;
            const amount = ethers.formatUnits(stakedAmount, decimals);
            
            let pendingReward = '0';
            try {
              const reward = await stakingContract.pendingReward(pid, walletAddress);
              pendingReward = ethers.formatUnits(reward, decimals);
            } catch (e) {
              console.error('Error fetching pending reward:', e);
            }

            const lockPeriod = Number(pool.lockPeriod);
            const startTime = Number(userStake.startTime);
            const unlockTime = startTime + lockPeriod;
            const isLocked = currentTime < unlockTime;

            const price = TOKEN_PRICES[tokenInfo?.symbol || ''] || 0;
            const estimatedValue = parseFloat(amount) * price;

            stakedPositions.push({
              poolId: pid,
              tokenAddress: pool.token,
              tokenSymbol: tokenInfo?.symbol || 'Unknown',
              tokenName: tokenInfo?.name || 'Unknown Token',
              tokenLogo: tokenInfo?.logoURI,
              amount,
              startTime,
              apr: Number(pool.apr),
              pendingReward,
              lockPeriod,
              isLocked,
              unlockTime,
              estimatedValue,
            });
          }
        } catch (error: any) {
          if (error.message?.includes('missing revert data') || error.message?.includes('could not coalesce')) {
            break;
          }
          break;
        }
      }

      stakedPositions.sort((a, b) => b.estimatedValue - a.estimatedValue);
      setPositions(stakedPositions);
      
      const totalValue = stakedPositions.reduce((sum, p) => sum + p.estimatedValue, 0);
      const totalRewards = stakedPositions.reduce((sum, p) => sum + parseFloat(p.pendingReward), 0);
      
      setTotalStakedValue(totalValue);
      setTotalPendingRewards(totalRewards);
      onStakingLoaded?.(stakedPositions);
    } catch (error) {
      console.error('Error loading staking:', error);
    }
    
    setIsLoading(false);
  };

  const formatTimeRemaining = (unlockTime: number) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = unlockTime - now;
    
    if (remaining <= 0) return 'Unlocked';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Staking Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass border-border/50 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-500 mb-1">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-medium">Staked Value</span>
            </div>
            <p className="text-xl font-bold">
              ${totalStakedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <Gift className="w-4 h-4" />
              <span className="text-xs font-medium">Pending Rewards</span>
            </div>
            <p className="text-xl font-bold">{totalPendingRewards.toFixed(4)}</p>
          </CardContent>
        </Card>
        
        <Card className="glass border-border/50 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Active Stakes</span>
            </div>
            <p className="text-2xl font-bold">{positions.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Staking Positions */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold">Staking Positions</h3>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate('/dex/staking')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            <ArrowUpRight className="w-4 h-4 mr-1" />
            Stake More
          </Button>
        </div>

        {positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Coins className="w-12 h-12 mb-4 opacity-50" />
            <p className="mb-4">No staking positions found</p>
            <Button onClick={() => navigate('/dex/staking')} className="bg-gradient-to-r from-purple-500 to-pink-500">
              Start Staking
            </Button>
          </div>
        ) : (
          <CardContent className="p-0">
            <div className="divide-y divide-border/30">
              {positions.map((position, i) => (
                <div 
                  key={i} 
                  className="p-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                  onClick={() => navigate('/dex/staking')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {position.tokenLogo ? (
                        <img 
                          src={position.tokenLogo} 
                          alt={position.tokenSymbol}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {position.tokenSymbol.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold">{position.tokenSymbol}</p>
                        <p className="text-xs text-muted-foreground">{position.tokenName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {position.apr}% APR
                      </Badge>
                      {position.isLocked ? (
                        <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/10">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeRemaining(position.unlockTime)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10">
                          Unlocked
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-purple-500/10 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">Staked Amount</p>
                      <p className="font-mono font-medium">{parseFloat(position.amount).toFixed(4)}</p>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">Pending Reward</p>
                      <p className="font-mono font-medium text-green-500">{parseFloat(position.pendingReward).toFixed(6)}</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">Value</p>
                      <p className="font-mono font-medium">
                        ${position.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default MyStaking;
