import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Coins,
  BarChart3
} from 'lucide-react';
import { ethers } from 'ethers';
import { STAKING_CONTRACT, STAKING_ABI } from '@/lib/web3/staking-config';
import { ERC20_ABI, DEFAULT_TOKENS } from '@/lib/web3/dex-config';

interface StakingStatsData {
  totalTVL: string;
  totalPools: number;
  activePools: number;
  totalStakers: number;
  highestAPR: number;
}

const getTokenInfo = (address: string) => {
  const normalizedAddress = address.toLowerCase();
  return DEFAULT_TOKENS.find(t => t.address.toLowerCase() === normalizedAddress) || null;
};

interface StakingStatsProps {
  refreshTrigger?: number;
}

const StakingStats = ({ refreshTrigger }: StakingStatsProps = {}) => {
  const [stats, setStats] = useState<StakingStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  const loadStats = async () => {
    setLoading(true);
    try {
      if (typeof window.ethereum === 'undefined') {
        setStats({
          totalTVL: '0',
          totalPools: 0,
          activePools: 0,
          totalStakers: 0,
          highestAPR: 0,
        });
        setLoading(false);
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(
        STAKING_CONTRACT.address,
        STAKING_ABI,
        provider
      );

      let totalPools = 0;
      let activePools = 0;
      let highestAPR = 0;
      let totalTVLValue = 0;

      // Load pools to calculate stats
      for (let i = 0; i < 20; i++) {
        try {
          const pool = await stakingContract.pools(i);
          if (!pool || pool.token === ethers.ZeroAddress) break;
          
          totalPools++;
          if (pool.active) {
            activePools++;
            const apr = Number(pool.apr);
            if (apr > highestAPR) highestAPR = apr;
            
            // Calculate TVL from totalStaked
            const tokenInfo = getTokenInfo(pool.token);
            const decimals = tokenInfo?.decimals || 18;
            const staked = parseFloat(ethers.formatUnits(pool.totalStaked, decimals));
            totalTVLValue += staked;
          }
        } catch (error: any) {
          if (error.message?.includes('missing revert data') || error.message?.includes('could not coalesce')) {
            break;
          }
          break;
        }
      }

      setStats({
        totalTVL: formatTVL(totalTVLValue),
        totalPools,
        activePools,
        totalStakers: 0, // Would need to track staker addresses in contract
        highestAPR,
      });
    } catch (error) {
      console.error('Error loading staking stats:', error);
      setStats({
        totalTVL: '0',
        totalPools: 0,
        activePools: 0,
        totalStakers: 0,
        highestAPR: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTVL = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      label: 'Total Value Locked',
      value: stats.totalTVL,
      icon: Wallet,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Pools',
      value: `${stats.activePools}/${stats.totalPools}`,
      icon: Coins,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Highest APR',
      value: `${stats.highestAPR}%`,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Total Tokens',
      value: DEFAULT_TOKENS.length.toString(),
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item, index) => (
        <Card key={index} className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StakingStats;
