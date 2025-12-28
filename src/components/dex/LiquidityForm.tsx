import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Loader2, ChevronDown, Settings, RefreshCw, Coins, Check, Infinity } from 'lucide-react';
import { Token, DEFAULT_TOKENS, DEX_CONTRACTS } from '@/lib/web3/dex-config';
import { addLiquidity, removeLiquidity, getTokenBalance, getPairAddress, getLPBalance, getReserves, checkAllowance, approveToken, isNativeToken, calculateRemoveLiquidityAmounts } from '@/lib/web3/dex';
import { getCurrentAccount } from '@/lib/web3/wallet';
import TokenSelector from './TokenSelector';
import SlippageSettings from './SlippageSettings';
import LiquidityConfirmModal from './LiquidityConfirmModal';
import LiquiditySkeleton from './LiquiditySkeleton';
import { useToast } from '@/hooks/use-toast';
import { saveTransaction } from './TransactionHistory';
import { Checkbox } from '@/components/ui/checkbox';
import { ethers } from 'ethers';

const MAX_UINT256 = ethers.MaxUint256;

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
  const [isApproving, setIsApproving] = useState<'A' | 'B' | 'LP' | null>(null);
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
  const [allowanceA, setAllowanceA] = useState<bigint>(BigInt(0));
  const [allowanceB, setAllowanceB] = useState<bigint>(BigInt(0));
  const [allowanceLP, setAllowanceLP] = useState<bigint>(BigInt(0));
  const [useInfiniteApproval, setUseInfiniteApproval] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'add' | 'remove'>('add');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [estimatedRemoveA, setEstimatedRemoveA] = useState('0');
  const [estimatedRemoveB, setEstimatedRemoveB] = useState('0');

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
    // Allow a brief moment for initial data fetch
    setTimeout(() => setIsInitialLoading(false), 1000);
  };

  const loadBalances = useCallback(async (forceRefresh = false) => {
    if (!account) return;
    if (forceRefresh) setIsRefreshing(true);
    
    try {
      // Fetch sequentially to reduce RPC load
      const balA = await getTokenBalance(tokenA.address, account, forceRefresh);
      setBalanceA(balA);
      
      // Small delay between calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const balB = await getTokenBalance(tokenB.address, account, forceRefresh);
      setBalanceB(balB);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading balances:', error);
    }
    
    if (forceRefresh) setIsRefreshing(false);
  }, [account, tokenA, tokenB]);

  // Check allowances when amounts or tokens change
  const checkAllowances = useCallback(async () => {
    if (!account || !amountA || !amountB) return;
    
    try {
      const amountAWei = ethers.parseUnits(amountA || '0', tokenA.decimals);
      const amountBWei = ethers.parseUnits(amountB || '0', tokenB.decimals);
      
      if (!isNativeToken(tokenA.address)) {
        const allowA = await checkAllowance(tokenA.address, account, DEX_CONTRACTS.UniswapV2Router02);
        setAllowanceA(allowA);
      } else {
        setAllowanceA(amountAWei); // Native tokens don't need approval
      }
      
      if (!isNativeToken(tokenB.address)) {
        const allowB = await checkAllowance(tokenB.address, account, DEX_CONTRACTS.UniswapV2Router02);
        setAllowanceB(allowB);
      } else {
        setAllowanceB(amountBWei); // Native tokens don't need approval
      }
    } catch (error) {
      console.error('Error checking allowances:', error);
    }
  }, [account, amountA, amountB, tokenA, tokenB]);

  useEffect(() => {
    if (account) {
      loadBalances();
      loadPairInfo();
    }
  }, [account, tokenA, tokenB, loadBalances]);

  // Check allowances when amounts change
  useEffect(() => {
    if (account && amountA && amountB) {
      checkAllowances();
    }
  }, [account, amountA, amountB, tokenA, tokenB, checkAllowances]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!account) return;

    const interval = setInterval(() => {
      loadBalances(true);
      loadPairInfo();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [account, tokenA, tokenB, loadBalances]);

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

  // Calculate estimated output when removing liquidity
  useEffect(() => {
    const calculateRemoveAmounts = async () => {
      if (!lpAmount || parseFloat(lpAmount) <= 0 || !pairAddress) {
        setEstimatedRemoveA('0');
        setEstimatedRemoveB('0');
        return;
      }
      
      const amounts = await calculateRemoveLiquidityAmounts(tokenA, tokenB, lpAmount);
      if (amounts) {
        setEstimatedRemoveA(amounts.amountA);
        setEstimatedRemoveB(amounts.amountB);
      }
    };
    
    calculateRemoveAmounts();
  }, [lpAmount, tokenA, tokenB, pairAddress]);

  // Check LP token allowance for remove liquidity
  useEffect(() => {
    const checkLPAllowance = async () => {
      if (!account || !pairAddress || !lpAmount || parseFloat(lpAmount) <= 0) {
        setAllowanceLP(BigInt(0));
        return;
      }
      
      try {
        const allowance = await checkAllowance(pairAddress, account, DEX_CONTRACTS.UniswapV2Router02);
        setAllowanceLP(allowance);
      } catch (error) {
        console.error('Error checking LP allowance:', error);
      }
    };
    
    checkLPAllowance();
  }, [account, pairAddress, lpAmount]);

  const handleManualRefresh = () => {
    loadBalances(true);
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
      // Get the actual token addresses used in the pair (WETH9 for native)
      const addressA = isNativeToken(tokenA.address) ? DEX_CONTRACTS.WETH9 : tokenA.address;
      const addressB = isNativeToken(tokenB.address) ? DEX_CONTRACTS.WETH9 : tokenB.address;
      
      // Match with reserves.token0 and reserves.token1 from the pair contract
      const isTokenAToken0 = reserves.token0.toLowerCase() === addressA.toLowerCase();
      
      const reserveA = isTokenAToken0 ? reserves.reserve0 : reserves.reserve1;
      const reserveB = isTokenAToken0 ? reserves.reserve1 : reserves.reserve0;

      // Use proper decimals for calculation
      const amountAWei = ethers.parseUnits(inputA, tokenA.decimals);
      const amountBWei = (amountAWei * reserveB) / reserveA;
      const calculatedB = ethers.formatUnits(amountBWei, tokenB.decimals);
      
      // Limit decimal places based on token decimals
      const decimalPlaces = Math.min(6, tokenB.decimals);
      setAmountB(parseFloat(calculatedB).toFixed(decimalPlaces));
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
        const addressA = isNativeToken(tokenA.address) ? DEX_CONTRACTS.WETH9 : tokenA.address;
        const isTokenAToken0 = reserves.token0.toLowerCase() === addressA.toLowerCase();

        const reserveA = Number(ethers.formatUnits(isTokenAToken0 ? reserves.reserve0 : reserves.reserve1, tokenA.decimals));
        const reserveB = Number(ethers.formatUnits(isTokenAToken0 ? reserves.reserve1 : reserves.reserve0, tokenB.decimals));
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
        // Get the actual token addresses used in the pair (WETH9 for native)
        const addressA = isNativeToken(tokenA.address) ? DEX_CONTRACTS.WETH9 : tokenA.address;
        const addressB = isNativeToken(tokenB.address) ? DEX_CONTRACTS.WETH9 : tokenB.address;
        
        // Match with reserves.token0 and reserves.token1 from the pair contract
        const isTokenAToken0 = reserves.token0.toLowerCase() === addressA.toLowerCase();
        
        const reserveA = isTokenAToken0 ? reserves.reserve0 : reserves.reserve1;
        const reserveB = isTokenAToken0 ? reserves.reserve1 : reserves.reserve0;

        const amountBWei = ethers.parseUnits(value, tokenB.decimals);
        const amountAWei = (amountBWei * reserveA) / reserveB;
        const calculatedA = ethers.formatUnits(amountAWei, tokenA.decimals);
        
        const decimalPlaces = Math.min(6, tokenA.decimals);
        setAmountA(parseFloat(calculatedA).toFixed(decimalPlaces));
      } catch (error) {
        console.error('Error calculating amount A:', error);
      }
    }
  };

  const handleApproveTokenA = async () => {
    if (!account || !amountA) return;
    setIsApproving('A');
    try {
      // Use infinite approval or exact amount based on user preference
      const approvalAmount = useInfiniteApproval 
        ? MAX_UINT256 
        : ethers.parseUnits(amountA, tokenA.decimals);
      
      const success = await approveToken(tokenA.address, DEX_CONTRACTS.UniswapV2Router02, approvalAmount);
      if (success) {
        toast({
          title: 'Token Approved!',
          description: useInfiniteApproval 
            ? `${tokenA.symbol} approved with unlimited spending` 
            : `${tokenA.symbol} approved for trading`,
        });
        await checkAllowances();
      } else {
        toast({
          title: 'Approval Failed',
          description: `Failed to approve ${tokenA.symbol}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsApproving(null);
  };

  const handleApproveTokenB = async () => {
    if (!account || !amountB) return;
    setIsApproving('B');
    try {
      // Use infinite approval or exact amount based on user preference
      const approvalAmount = useInfiniteApproval 
        ? MAX_UINT256 
        : ethers.parseUnits(amountB, tokenB.decimals);
      
      const success = await approveToken(tokenB.address, DEX_CONTRACTS.UniswapV2Router02, approvalAmount);
      if (success) {
        toast({
          title: 'Token Approved!',
          description: useInfiniteApproval 
            ? `${tokenB.symbol} approved with unlimited spending` 
            : `${tokenB.symbol} approved for trading`,
        });
        await checkAllowances();
      } else {
        toast({
          title: 'Approval Failed',
          description: `Failed to approve ${tokenB.symbol}`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsApproving(null);
  };

  const handleApproveLPToken = async () => {
    if (!account || !lpAmount || !pairAddress) return;
    setIsApproving('LP');
    try {
      const approvalAmount = useInfiniteApproval 
        ? MAX_UINT256 
        : ethers.parseUnits(lpAmount, 18);
      
      const success = await approveToken(pairAddress, DEX_CONTRACTS.UniswapV2Router02, approvalAmount);
      if (success) {
        toast({
          title: 'LP Token Approved!',
          description: useInfiniteApproval 
            ? 'LP tokens approved with unlimited spending' 
            : 'LP tokens approved for removal',
        });
        // Recheck allowance
        const newAllowance = await checkAllowance(pairAddress, account, DEX_CONTRACTS.UniswapV2Router02);
        setAllowanceLP(newAllowance);
      } else {
        toast({
          title: 'Approval Failed',
          description: 'Failed to approve LP tokens',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsApproving(null);
  };

  const openAddConfirmModal = () => {
    setConfirmMode('add');
    setShowConfirmModal(true);
  };

  const openRemoveConfirmModal = () => {
    setConfirmMode('remove');
    setShowConfirmModal(true);
  };

  const handleAddLiquidity = async () => {
    if (!account || !amountA || !amountB) return;

    // Validate balances
    if (parseFloat(amountA) > parseFloat(balanceA)) {
      toast({
        title: 'Insufficient Balance',
        description: `You don't have enough ${tokenA.symbol}`,
        variant: 'destructive',
      });
      return;
    }
    if (parseFloat(amountB) > parseFloat(balanceB)) {
      toast({
        title: 'Insufficient Balance',
        description: `You don't have enough ${tokenB.symbol}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await addLiquidity(tokenA, tokenB, amountA, amountB, account, slippage);
      
      if (result.success) {
        saveTransaction({
          hash: result.hash || '',
          type: 'add_liquidity',
          tokenIn: tokenA.symbol,
          tokenOut: tokenB.symbol,
          amountIn: amountA,
          amountOut: amountB,
          timestamp: Date.now(),
          status: 'success',
        });

        toast({
          title: 'Liquidity Added!',
          description: `Added ${amountA} ${tokenA.symbol} + ${amountB} ${tokenB.symbol}`,
        });
        setAmountA('');
        setAmountB('');
        setAllowanceA(BigInt(0));
        setAllowanceB(BigInt(0));
        setShowConfirmModal(false);
        // Delay refresh to allow blockchain to update
        setTimeout(() => {
          loadBalances(true);
          loadPairInfo();
        }, 2000);
      } else {
        const errorMessage = parseLiquidityError(result.error || 'Unknown error');
        toast({
          title: 'Failed to Add Liquidity',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = parseLiquidityError(error.message || 'Transaction failed');
      toast({
        title: 'Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleRemoveLiquidity = async () => {
    if (!account || !lpAmount) return;

    // Validate LP balance
    if (parseFloat(lpAmount) > parseFloat(lpBalance)) {
      toast({
        title: 'Insufficient LP Tokens',
        description: `You don't have enough LP tokens`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await removeLiquidity(
        tokenA, 
        tokenB, 
        lpAmount, 
        account, 
        slippage,
        estimatedRemoveA,
        estimatedRemoveB
      );
      
      if (result.success) {
        saveTransaction({
          hash: result.hash || '',
          type: 'remove_liquidity',
          tokenIn: tokenA.symbol,
          tokenOut: tokenB.symbol,
          amountIn: lpAmount,
          amountOut: `${parseFloat(estimatedRemoveA).toFixed(6)} ${tokenA.symbol} + ${parseFloat(estimatedRemoveB).toFixed(6)} ${tokenB.symbol}`,
          timestamp: Date.now(),
          status: 'success',
        });

        toast({
          title: 'Liquidity Removed!',
          description: `Received ${parseFloat(estimatedRemoveA).toFixed(4)} ${tokenA.symbol} + ${parseFloat(estimatedRemoveB).toFixed(4)} ${tokenB.symbol}`,
        });
        setLpAmount('');
        setEstimatedRemoveA('0');
        setEstimatedRemoveB('0');
        setAllowanceLP(BigInt(0));
        setShowConfirmModal(false);
        // Delay refresh to allow blockchain to update
        setTimeout(() => {
          loadBalances(true);
          loadPairInfo();
        }, 2000);
      } else {
        const errorMessage = parseLiquidityError(result.error || 'Unknown error');
        toast({
          title: 'Failed to Remove Liquidity',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = parseLiquidityError(error.message || 'Transaction failed');
      toast({
        title: 'Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  // Parse common error messages for better UX
  const parseLiquidityError = (error: string): string => {
    if (error.includes('insufficient') || error.includes('INSUFFICIENT')) {
      return 'Insufficient balance or allowance';
    }
    if (error.includes('slippage') || error.includes('EXPIRED') || error.includes('deadline')) {
      return 'Transaction expired. Please try again.';
    }
    if (error.includes('rejected') || error.includes('denied')) {
      return 'Transaction was rejected by user';
    }
    if (error.includes('gas') || error.includes('fee')) {
      return 'Not enough gas for transaction';
    }
    if (error.includes('TRANSFER_FAILED')) {
      return 'Token transfer failed. Please check approval.';
    }
    return error.length > 100 ? error.substring(0, 100) + '...' : error;
  };

  // Show skeleton while initial loading
  if (isInitialLoading) {
    return <LiquiditySkeleton />;
  }

  return (
    <>
      <Card className="w-full max-w-md mx-auto glass border-border/50 overflow-hidden transition-all duration-500 hover:shadow-sakura">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-bold">Liquidity</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              title={`Last refresh: ${lastRefresh.toLocaleTimeString()}`}
              className="transition-transform duration-300 hover:scale-110"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'hover:rotate-180'}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowSettings(true)}
              className="transition-transform duration-300 hover:scale-110 hover:rotate-45"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-secondary/30 m-4 mb-0 transition-all duration-300" style={{ width: 'calc(100% - 2rem)' }}>
            <TabsTrigger 
              value="add" 
              className="data-[state=active]:bg-gradient-sakura transition-all duration-300 data-[state=active]:shadow-sakura"
            >
              <Plus className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:rotate-90" />
              Add
            </TabsTrigger>
            <TabsTrigger 
              value="remove" 
              className="data-[state=active]:bg-gradient-sakura transition-all duration-300 data-[state=active]:shadow-sakura"
            >
              <Minus className="w-4 h-4 mr-2" />
              Remove
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="p-4 space-y-3 animate-fade-in-up">
            {/* Token A */}
            <div className="token-box bg-secondary/30 rounded-xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Token A</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground number-transition">
                    Balance: {parseFloat(balanceA).toFixed(4)}
                  </span>
                  <Button
                    variant="link"
                    className="text-xs text-primary p-0 h-auto transition-all duration-200 hover:scale-110"
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
                  className="dex-input border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowTokenSelectorA(true)}
                  className="flex items-center gap-2 min-w-[120px] transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  {tokenA.logoURI ? (
                    <img src={tokenA.logoURI} alt={tokenA.symbol} className="w-6 h-6 rounded-full object-cover transition-transform duration-300 hover:scale-110" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                      {tokenA.symbol.charAt(0)}
                    </div>
                  )}
                  {tokenA.symbol}
                  <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center transition-all duration-300 hover:bg-primary/20 hover:scale-110 cursor-pointer plus-icon-animate">
                <Plus className="w-4 h-4" />
              </div>
            </div>

            {/* Token B */}
            <div className="token-box bg-secondary/30 rounded-xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Token B {!isNewPool && reserves && <span className="text-primary text-xs ml-1">(auto-calculated)</span>}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground number-transition">
                    Balance: {parseFloat(balanceB).toFixed(4)}
                  </span>
                  <Button
                    variant="link"
                    className="text-xs text-primary p-0 h-auto transition-all duration-200 hover:scale-110"
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
                  className={`dex-input border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0 ${!isNewPool && reserves && amountA ? 'text-primary' : ''}`}
                />
                <Button
                  variant="outline"
                  onClick={() => setShowTokenSelectorB(true)}
                  className="flex items-center gap-2 min-w-[120px] transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  {tokenB.logoURI ? (
                    <img src={tokenB.logoURI} alt={tokenB.symbol} className="w-6 h-6 rounded-full object-cover transition-transform duration-300 hover:scale-110" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                      {tokenB.symbol.charAt(0)}
                    </div>
                  )}
                  {tokenB.symbol}
                  <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
                </Button>
              </div>
            </div>

            {/* LP Token Estimate */}
            {(amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0) && (
              <div className="animate-scale-in bg-primary/10 rounded-xl p-4 border border-primary/30 lp-glow transition-all duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-primary animate-pulse" />
                  <span className="font-semibold text-primary">Estimated LP Tokens</span>
                </div>
                <p className="text-2xl font-bold number-transition">{estimatedLPTokens}</p>
                <p className="text-sm text-muted-foreground">
                  {tokenA.symbol}/{tokenB.symbol} LP Tokens
                </p>
              </div>
            )}

            {/* Pool Info */}
            <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm transition-all duration-300 hover:bg-secondary/30">
              {isNewPool ? (
                <div className="flex items-center justify-center text-primary animate-pulse">
                  <span>🆕 Creating New Pool</span>
                </div>
              ) : poolRatio && (
                <div className="flex items-center justify-between transition-all duration-300">
                  <span className="text-muted-foreground">Pool Ratio</span>
                  <span className="number-transition">1 {tokenA.symbol} = {poolRatio} {tokenB.symbol}</span>
                </div>
              )}
              <div className="flex items-center justify-between transition-all duration-300">
                <span className="text-muted-foreground">Pool Share</span>
                <span className="number-transition">{poolShare.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between transition-all duration-300">
                <span className="text-muted-foreground">Your LP Tokens</span>
                <span className="number-transition">{parseFloat(lpBalance).toFixed(6)}</span>
              </div>
            </div>

            {/* Approval Status Indicator */}
            {amountA && amountB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0 && (
              <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tokenA.symbol} Approval</span>
                  {isNativeToken(tokenA.address) ? (
                    <span className="text-green-500 flex items-center gap-1"><Check className="w-4 h-4" /> Native</span>
                  ) : allowanceA >= (amountA ? ethers.parseUnits(amountA, tokenA.decimals) : BigInt(0)) ? (
                    <span className="text-green-500 flex items-center gap-1"><Check className="w-4 h-4" /> Approved</span>
                  ) : (
                    <span className="text-yellow-500">Needs Approval</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{tokenB.symbol} Approval</span>
                  {isNativeToken(tokenB.address) ? (
                    <span className="text-green-500 flex items-center gap-1"><Check className="w-4 h-4" /> Native</span>
                  ) : allowanceB >= (amountB ? ethers.parseUnits(amountB, tokenB.decimals) : BigInt(0)) ? (
                    <span className="text-green-500 flex items-center gap-1"><Check className="w-4 h-4" /> Approved</span>
                  ) : (
                    <span className="text-yellow-500">Needs Approval</span>
                  )}
                </div>
                
                {/* Infinite Approval Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="infiniteApproval" 
                      checked={useInfiniteApproval}
                      onCheckedChange={(checked) => setUseInfiniteApproval(checked === true)}
                    />
                    <label 
                      htmlFor="infiniteApproval" 
                      className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
                    >
                      <Infinity className="w-3 h-3" />
                      Infinite Approval
                    </label>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {useInfiniteApproval ? 'No future approvals needed' : 'Approve exact amount'}
                  </span>
                </div>
              </div>
            )}

            {/* Approval/Add Liquidity Buttons */}
            {(() => {
              const amountAWei = amountA ? ethers.parseUnits(amountA, tokenA.decimals) : BigInt(0);
              const amountBWei = amountB ? ethers.parseUnits(amountB, tokenB.decimals) : BigInt(0);
              const needsApprovalA = !isNativeToken(tokenA.address) && allowanceA < amountAWei;
              const needsApprovalB = !isNativeToken(tokenB.address) && allowanceB < amountBWei;

              if (!account) {
                return (
                  <Button disabled className="w-full h-14 text-lg font-bold bg-gradient-sakura opacity-70">
                    Connect Wallet
                  </Button>
                );
              }

              if (!amountA || !amountB || parseFloat(amountA) === 0 || parseFloat(amountB) === 0) {
                return (
                  <Button disabled className="w-full h-14 text-lg font-bold bg-gradient-sakura opacity-70">
                    Enter Amounts
                  </Button>
                );
              }

              if (needsApprovalA) {
                return (
                  <Button
                    onClick={handleApproveTokenA}
                    disabled={isApproving === 'A'}
                    className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] btn-pulse"
                  >
                    {isApproving === 'A' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Approving {tokenA.symbol}...
                      </>
                    ) : (
                      <>Approve {tokenA.symbol}</>
                    )}
                  </Button>
                );
              }

              if (needsApprovalB) {
                return (
                  <Button
                    onClick={handleApproveTokenB}
                    disabled={isApproving === 'B'}
                    className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] btn-pulse"
                  >
                    {isApproving === 'B' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Approving {tokenB.symbol}...
                      </>
                    ) : (
                      <>Approve {tokenB.symbol}</>
                    )}
                  </Button>
                );
              }

              return (
                <Button
                  onClick={openAddConfirmModal}
                  className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] btn-pulse"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Add Liquidity
                </Button>
              );
            })()}
          </TabsContent>

          <TabsContent value="remove" className="p-4 space-y-3 animate-fade-in-up">
            <div className="token-box bg-secondary/30 rounded-xl p-4 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">LP Tokens to Remove</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground number-transition">
                    Balance: {parseFloat(lpBalance).toFixed(6)}
                  </span>
                  <Button
                    variant="link"
                    className="text-xs text-primary p-0 h-auto transition-all duration-200 hover:scale-110"
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
                className="dex-input border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0"
              />
              <div className="flex gap-2 mt-3">
                {[25, 50, 75, 100].map((percent, index) => (
                  <Button
                    key={percent}
                    variant="outline"
                    size="sm"
                    onClick={() => setLpAmount((parseFloat(lpBalance) * percent / 100).toString())}
                    className="transition-all duration-300 hover:scale-105 hover:bg-primary/20"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {percent}%
                  </Button>
                ))}
              </div>
            </div>

            {/* Estimated Output */}
            {lpAmount && parseFloat(lpAmount) > 0 && (
              <div className="bg-secondary/30 rounded-xl p-4 space-y-3 animate-fade-in-up">
                <p className="text-sm text-muted-foreground text-center mb-2">You will receive (estimated)</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tokenA.logoURI ? (
                      <img src={tokenA.logoURI} alt={tokenA.symbol} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                        {tokenA.symbol.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium">{tokenA.symbol}</span>
                  </div>
                  <span className="text-lg font-bold text-primary number-transition">
                    {parseFloat(estimatedRemoveA).toFixed(6)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tokenB.logoURI ? (
                      <img src={tokenB.logoURI} alt={tokenB.symbol} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                        {tokenB.symbol.charAt(0)}
                      </div>
                    )}
                    <span className="font-medium">{tokenB.symbol}</span>
                  </div>
                  <span className="text-lg font-bold text-primary number-transition">
                    {parseFloat(estimatedRemoveB).toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            {/* LP Approval Status */}
            {lpAmount && parseFloat(lpAmount) > 0 && (
              <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">LP Token Approval</span>
                  {allowanceLP >= ethers.parseUnits(lpAmount || '0', 18) ? (
                    <span className="text-green-500 flex items-center gap-1"><Check className="w-4 h-4" /> Approved</span>
                  ) : (
                    <span className="text-yellow-500">Needs Approval</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Slippage Tolerance</span>
                  <span className="font-medium">{slippage}%</span>
                </div>
              </div>
            )}

            {/* Approval/Remove Buttons */}
            {(() => {
              const lpAmountWei = lpAmount ? ethers.parseUnits(lpAmount, 18) : BigInt(0);
              const needsApprovalLP = lpAmountWei > 0n && allowanceLP < lpAmountWei;

              if (!account) {
                return (
                  <Button disabled className="w-full h-14 text-lg font-bold bg-gradient-sakura opacity-70">
                    Connect Wallet
                  </Button>
                );
              }

              if (!lpAmount || parseFloat(lpAmount) === 0) {
                return (
                  <Button disabled className="w-full h-14 text-lg font-bold bg-gradient-sakura opacity-70">
                    Enter Amount
                  </Button>
                );
              }

              if (parseFloat(lpAmount) > parseFloat(lpBalance)) {
                return (
                  <Button disabled className="w-full h-14 text-lg font-bold bg-gradient-sakura opacity-70">
                    Insufficient LP Balance
                  </Button>
                );
              }

              if (needsApprovalLP) {
                return (
                  <Button
                    onClick={handleApproveLPToken}
                    disabled={isApproving === 'LP'}
                    className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] btn-pulse"
                  >
                    {isApproving === 'LP' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Approving LP Tokens...
                      </>
                    ) : (
                      <>Approve LP Tokens</>
                    )}
                  </Button>
                );
              }

              return (
                <Button
                  onClick={openRemoveConfirmModal}
                  className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Minus className="w-5 h-5 mr-2" />
                  Remove Liquidity
                </Button>
              );
            })()}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Confirmation Modal */}
      <LiquidityConfirmModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmMode === 'add' ? handleAddLiquidity : handleRemoveLiquidity}
        isLoading={isLoading}
        mode={confirmMode}
        tokenA={tokenA}
        tokenB={tokenB}
        amountA={confirmMode === 'add' ? (amountA || '0') : estimatedRemoveA}
        amountB={confirmMode === 'add' ? (amountB || '0') : estimatedRemoveB}
        lpAmount={lpAmount}
        estimatedLP={estimatedLPTokens}
        poolShare={poolShare}
        slippage={slippage}
      />

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
