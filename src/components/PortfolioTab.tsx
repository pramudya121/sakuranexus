import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Droplets, Coins } from 'lucide-react';
import PortfolioHeader from './portfolio/PortfolioHeader';
import PortfolioOverview from './portfolio/PortfolioOverview';
import TokenBalances from './portfolio/TokenBalances';
import MyLPPositions from './portfolio/MyLPPositions';
import MyStaking from './portfolio/MyStaking';

interface PortfolioTabProps {
  walletAddress: string;
}

const PortfolioTab = ({ walletAddress }: PortfolioTabProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Value tracking
  const [tokenValue, setTokenValue] = useState(0);
  const [lpValue, setLpValue] = useState(0);
  const [stakingValue, setStakingValue] = useState(0);

  const totalValue = tokenValue + lpValue + stakingValue;
  const change24h = 2.5; // Mock 24h change

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setLastRefresh(new Date());
    setTimeout(() => setIsRefreshing(false), 2000);
  }, []);

  const handleTokenValueChange = useCallback((value: number) => {
    setTokenValue(value);
  }, []);

  const handlePositionsLoaded = useCallback((positions: any[]) => {
    const total = positions.reduce((sum: number, p: any) => sum + (p.estimatedValue || 0), 0);
    setLpValue(total);
  }, []);

  const handleStakingLoaded = useCallback((positions: any[]) => {
    const total = positions.reduce((sum: number, p: any) => sum + (p.estimatedValue || 0), 0);
    setStakingValue(total);
  }, []);

  return (
    <div className="animate-fade-in-up">
      {/* Header with total value */}
      <PortfolioHeader
        totalValue={totalValue}
        change24h={change24h}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        lastRefresh={lastRefresh}
      />

      {/* Portfolio Overview */}
      <PortfolioOverview
        tokenValue={tokenValue}
        lpValue={lpValue}
        stakingValue={stakingValue}
      />

      {/* Tabs for different sections */}
      <Tabs defaultValue="tokens" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4 bg-secondary/50">
          <TabsTrigger value="tokens" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Wallet className="w-4 h-4" />
            <span className="hidden sm:inline">Tokens</span>
          </TabsTrigger>
          <TabsTrigger value="liquidity" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            <Droplets className="w-4 h-4" />
            <span className="hidden sm:inline">Liquidity</span>
          </TabsTrigger>
          <TabsTrigger value="staking" className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            <Coins className="w-4 h-4" />
            <span className="hidden sm:inline">Staking</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="mt-0">
          <TokenBalances
            walletAddress={walletAddress}
            onTotalValueChange={handleTokenValueChange}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="liquidity" className="mt-0">
          <MyLPPositions
            walletAddress={walletAddress}
            refreshTrigger={refreshTrigger}
            onPositionsLoaded={handlePositionsLoaded}
          />
        </TabsContent>

        <TabsContent value="staking" className="mt-0">
          <MyStaking
            walletAddress={walletAddress}
            refreshTrigger={refreshTrigger}
            onStakingLoaded={handleStakingLoaded}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioTab;
