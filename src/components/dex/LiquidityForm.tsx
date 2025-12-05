import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Loader2, ChevronDown, Settings, RefreshCw, Coins } from 'lucide-react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { addLiquidity, removeLiquidity, getTokenBalance, getPairAddress, getLPBalance, getReserves } from '@/lib/web3/dex';
import { getCurrentAccount } from '@/lib/web3/wallet';
import TokenSelector from './TokenSelector';
import SlippageSettings from './SlippageSettings';
import { useToast } from '@/hooks/use-toast';

const REFRESH_INTERVAL = 30000; // 30 seconds

const LiquidityForm = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState('add');
  const [tokenA, setTokenA] = useState<Token>(DEFAULT_TOKENS[0]);
  const [tokenB, setTokenB] = useState<Token>(DEFAULT_TOKENS[2]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [lpAmount, setLpAmount] = useState('');
  const [balanceA, setBalanceA] = useState('0');
  const [balanceB, setBalanceB] = useState('0');
  const [lpBalance, setLpBalance] = useState('0');
  const [slippage, setSlippage] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [showTokenSelectorA, setShowTokenSelectorA] = useState(false);
  const [showTokenSelectorB, setShowTokenSelectorB] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [poolShare, setPoolShare] = useState(0);
  const [pairAddress, setPairAddress] = useState<string | null>(null);
  const [reserves, setReserves] = useState<{ reserve0: bigint; reserve1: bigint; token0: string; token1: string } | null>(null);
  const [poolRatio, setPoolRatio] = useState<string | null>(null);
  const [isNewPool, setIsNewPool] = useState(false);
  const [estimatedLPTokens, setEstimatedLPTokens] = useState<string>('0');
  const [totalSupply, setTotalSupply] = useState<string>('0');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    if (account) {
      loadBalances();
      loadPairInfo();
    }
  }, [account, tokenA, tokenB]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!account) return;

    const interval = setInterval(() => {
      loadBalances(true);
      loadPairInfo();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [account, tokenA, tokenB]);

  // Auto-calculate Token B when Token A changes
  useEffect(() => {
    if (amountA && parseFloat(amountA) > 0 && reserves && !isNewPool) {
      calculateAmountB(amountA);
    } else if (!amountA || parseFloat(amountA) === 0) {
      setAmountB('');
      setEstimatedLPTokens('0');
    }
  }, [amountA, reserves, isNewPool]);

  // Calculate estimated LP tokens
  useEffect(() => {
    calculateEstimatedLP();
  }, [amountA, amountB, reserves, totalSupply, isNewPool]);

  const loadAccount = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
  };

  const loadBalances = useCallback(async (silent = false) => {
    if (!account) return;
    if (!silent) setIsRefreshing(true);
    
    try {
      const [balA, balB] = await Promise.all([
        getTokenBalance(tokenA.address, account, true),
        getTokenBalance(tokenB.address, account, true),
      ]);
      setBalanceA(balA);
      setBalanceB(balB);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading balances:', error);
    }
    
    if (!silent) setIsRefreshing(false);
  }, [account, tokenA, tokenB]);

  const handleManualRefresh = () => {
    loadBalances();
    loadPairInfo();
  };

  const loadPairInfo = async () => {
    if (!account) return;
    const pair = await getPairAddress(tokenA.address, tokenB.address);
    setPairAddress(pair);
    
    if (pair && pair !== '0x0000000000000000000000000000000000000000') {
      const lpBal = await getLPBalance(pair, account);
      setLpBalance(lpBal);
      
      // Load reserves for ratio calculation
      const reservesData = await getReserves(pair);
      if (reservesData && reservesData.reserve0 > 0n && reservesData.reserve1 > 0n) {
        setReserves(reservesData);
        setIsNewPool(false);
        
        // Get total supply for LP calculation
        try {
          const { ethers } = await import('ethers');
          const { getProvider } = await import('@/lib/web3/wallet');
          const { UNISWAP_V2_PAIR_ABI } = await import('@/lib/web3/dex-config');
          const provider = getProvider();
          if (provider) {
            const pairContract = new ethers.Contract(pair, UNISWAP_V2_PAIR_ABI, provider);
            const supply = await pairContract.totalSupply();
            setTotalSupply(ethers.formatEther(supply));
          }
        } catch (error) {
          console.error('Error getting total supply:', error);
        }
        
        // Calculate pool ratio (Token B per Token A)
        const ratio = Number(reservesData.reserve1) / Number(reservesData.reserve0);
        setPoolRatio(ratio.toFixed(6));
      } else {
        setReserves(null);
        setIsNewPool(true);
        setPoolRatio(null);
        setTotalSupply('0');
      }
    } else {
      setLpBalance('0');
      setReserves(null);
      setIsNewPool(true);
      setPoolRatio(null);
      setTotalSupply('0');
    }
  };

  const calculateAmountB = (inputA: string) => {
    if (!reserves || !inputA || parseFloat(inputA) === 0) {
      setAmountB('');
      return;
    }

    try {
      // Sort tokens to match reserve order
      const tokenALower = tokenA.address.toLowerCase();
      const tokenBLower = tokenB.address.toLowerCase();
      const isTokenAFirst = tokenALower < tokenBLower;

      const reserveA = isTokenAFirst ? reserves.reserve0 : reserves.reserve1;
      const reserveB = isTokenAFirst ? reserves.reserve1 : reserves.reserve0;

      // Calculate: amountB = (amountA * reserveB) / reserveA
      const amountAWei = BigInt(Math.floor(parseFloat(inputA) * 1e18));
      const amountBWei = (amountAWei * reserveB) / reserveA;
      const calculatedB = Number(amountBWei) / 1e18;
      
      setAmountB(calculatedB.toFixed(6));
    } catch (error) {
      console.error('Error calculating amount B:', error);
    }
  };

  const calculateEstimatedLP = () => {
    if (!amountA || !amountB || parseFloat(amountA) === 0 || parseFloat(amountB) === 0) {
      setEstimatedLPTokens('0');
      setPoolShare(0);
      return;
    }

    try {
      const amountANum = parseFloat(amountA);
      const amountBNum = parseFloat(amountB);

      if (isNewPool) {
        // For new pool: LP = sqrt(amountA * amountB) - MINIMUM_LIQUIDITY
        const MINIMUM_LIQUIDITY = 1000 / 1e18; // 1000 wei
        const lpTokens = Math.sqrt(amountANum * amountBNum) - MINIMUM_LIQUIDITY;
        setEstimatedLPTokens(lpTokens > 0 ? lpTokens.toFixed(6) : '0');
        setPoolShare(100); // 100% for new pool
      } else if (reserves && totalSupply && parseFloat(totalSupply) > 0) {
        // For existing pool: LP = min(amountA * totalSupply / reserveA, amountB * totalSupply / reserveB)
        const tokenALower = tokenA.address.toLowerCase();
        const tokenBLower = tokenB.address.toLowerCase();
        const isTokenAFirst = tokenALower < tokenBLower;

        const reserveA = Number(isTokenAFirst ? reserves.reserve0 : reserves.reserve1) / 1e18;
        const reserveB = Number(isTokenAFirst ? reserves.reserve1 : reserves.reserve0) / 1e18;
        const supply = parseFloat(totalSupply);

        const lpFromA = (amountANum * supply) / reserveA;
        const lpFromB = (amountBNum * supply) / reserveB;
        const lpTokens = Math.min(lpFromA, lpFromB);

        setEstimatedLPTokens(lpTokens.toFixed(6));
        
        // Calculate pool share
        const newTotalSupply = supply + lpTokens;
        const share = (lpTokens / newTotalSupply) * 100;
        setPoolShare(share);
      }
    } catch (error) {
      console.error('Error calculating LP tokens:', error);
      setEstimatedLPTokens('0');
    }
  };

  const handleAmountAChange = (value: string) => {
    setAmountA(value);
  };

  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    // Reverse calculate Token A when user manually inputs Token B
    if (reserves && !isNewPool && value && parseFloat(value) > 0) {
      try {
        const tokenALower = tokenA.address.toLowerCase();
        const tokenBLower = tokenB.address.toLowerCase();
        const isTokenAFirst = tokenALower < tokenBLower;

        const reserveA = isTokenAFirst ? reserves.reserve0 : reserves.reserve1;
        const reserveB = isTokenAFirst ? reserves.reserve1 : reserves.reserve0;

        const amountBWei = BigInt(Math.floor(parseFloat(value) * 1e18));
        const amountAWei = (amountBWei * reserveA) / reserveB;
        const calculatedA = Number(amountAWei) / 1e18;
        
        setAmountA(calculatedA.toFixed(6));
      } catch (error) {
        console.error('Error calculating amount A:', error);
      }
    }
  };

  const handleAddLiquidity = async () => {
    if (!account || !amountA || !amountB) return;

    setIsLoading(true);
    try {
      const result = await addLiquidity(tokenA, tokenB, amountA, amountB, account, slippage);
      
      if (result.success) {
        toast({
          title: 'Liquidity Added!',
          description: `Added ${amountA} ${tokenA.symbol} + ${amountB} ${tokenB.symbol}`,
        });
        setAmountA('');
        setAmountB('');
        loadBalances();
        loadPairInfo();
      } else {
        toast({
          title: 'Failed to Add Liquidity',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleRemoveLiquidity = async () => {
    if (!account || !lpAmount) return;

    setIsLoading(true);
    try {
      const result = await removeLiquidity(tokenA, tokenB, lpAmount, account, slippage);
      
      if (result.success) {
        toast({
          title: 'Liquidity Removed!',
          description: `Removed ${lpAmount} LP tokens`,
        });
        setLpAmount('');
        loadBalances();
        loadPairInfo();
      } else {
        toast({
          title: 'Failed to Remove Liquidity',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-bold">Liquidity</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title={`Last refresh: ${lastRefresh.toLocaleTimeString()}`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-secondary/30 m-4 mb-0" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger value="add" className="data-[state=active]:bg-gradient-sakura">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </TabsTrigger>
            <TabsTrigger value="remove" className="data-[state=active]:bg-gradient-sakura">
              <Minus className="w-4 h-4 mr-2" />
              Remove
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="p-4 space-y-3">
            {/* Token A */}
            <div className="bg-secondary/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Token A</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Balance: {parseFloat(balanceA).toFixed(4)}
                  </span>
                  <Button
                    variant="link"
                    className="text-xs text-primary p-0 h-auto"
                    onClick={() => handleAmountAChange(balanceA)}
                  >
                    MAX
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amountA}
                  onChange={(e) => handleAmountAChange(e.target.value)}
                  className="border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowTokenSelectorA(true)}
                  className="flex items-center gap-2 min-w-[120px]"
                >
                  {tokenA.logoURI ? (
                    <img src={tokenA.logoURI} alt={tokenA.symbol} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                      {tokenA.symbol.charAt(0)}
                    </div>
                  )}
                  {tokenA.symbol}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
            </div>

            {/* Token B */}
            <div className="bg-secondary/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Token B</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Balance: {parseFloat(balanceB).toFixed(4)}
                  </span>
                  <Button
                    variant="link"
                    className="text-xs text-primary p-0 h-auto"
                    onClick={() => handleAmountBChange(balanceB)}
                  >
                    MAX
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amountB}
                  onChange={(e) => handleAmountBChange(e.target.value)}
                  className="border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowTokenSelectorB(true)}
                  className="flex items-center gap-2 min-w-[120px]"
                >
                  {tokenB.logoURI ? (
                    <img src={tokenB.logoURI} alt={tokenB.symbol} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                      {tokenB.symbol.charAt(0)}
                    </div>
                  )}
                  {tokenB.symbol}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* LP Token Estimate */}
            {(amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0) && (
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Estimated LP Tokens</span>
                </div>
                <p className="text-2xl font-bold">{estimatedLPTokens}</p>
                <p className="text-sm text-muted-foreground">
                  {tokenA.symbol}/{tokenB.symbol} LP Tokens
                </p>
              </div>
            )}

            {/* Pool Info */}
            <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm">
              {isNewPool ? (
                <div className="flex items-center justify-center text-primary">
                  <span>🆕 Creating New Pool</span>
                </div>
              ) : poolRatio && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pool Ratio</span>
                  <span>1 {tokenA.symbol} = {poolRatio} {tokenB.symbol}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pool Share</span>
                <span>{poolShare.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your LP Tokens</span>
                <span>{parseFloat(lpBalance).toFixed(6)}</span>
              </div>
            </div>

            <Button
              onClick={handleAddLiquidity}
              disabled={!account || !amountA || !amountB || isLoading}
              className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Adding Liquidity...
                </>
              ) : !account ? (
                'Connect Wallet'
              ) : !amountA || !amountB ? (
                'Enter Amounts'
              ) : (
                'Add Liquidity'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="remove" className="p-4 space-y-3">
            <div className="bg-secondary/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">LP Tokens to Remove</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Balance: {parseFloat(lpBalance).toFixed(6)}
                  </span>
                  <Button
                    variant="link"
                    className="text-xs text-primary p-0 h-auto"
                    onClick={() => setLpAmount(lpBalance)}
                  >
                    MAX
                  </Button>
                </div>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={lpAmount}
                onChange={(e) => setLpAmount(e.target.value)}
                className="border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0"
              />
              <div className="flex gap-2 mt-3">
                {[25, 50, 75, 100].map((percent) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => setLpAmount((parseFloat(lpBalance) * percent / 100).toString())}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm">
              <p className="text-muted-foreground text-center">
                Removing liquidity for {tokenA.symbol} / {tokenB.symbol}
              </p>
            </div>

            <Button
              onClick={handleRemoveLiquidity}
              disabled={!account || !lpAmount || isLoading || parseFloat(lpAmount) > parseFloat(lpBalance)}
              className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Removing Liquidity...
                </>
              ) : !account ? (
                'Connect Wallet'
              ) : !lpAmount ? (
                'Enter Amount'
              ) : parseFloat(lpAmount) > parseFloat(lpBalance) ? (
                'Insufficient LP Balance'
              ) : (
                'Remove Liquidity'
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Token Selectors */}
      <TokenSelector
        open={showTokenSelectorA}
        onClose={() => setShowTokenSelectorA(false)}
        onSelect={setTokenA}
        selectedToken={tokenA}
        disabledToken={tokenB}
      />
      <TokenSelector
        open={showTokenSelectorB}
        onClose={() => setShowTokenSelectorB(false)}
        onSelect={setTokenB}
        selectedToken={tokenB}
        disabledToken={tokenA}
      />

      {/* Slippage Settings */}
      <SlippageSettings
        open={showSettings}
        onClose={() => setShowSettings(false)}
        slippage={slippage}
        onSlippageChange={setSlippage}
      />
    </>
  );
};

export default LiquidityForm;
