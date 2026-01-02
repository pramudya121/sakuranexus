import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowDown, Settings, Loader2, ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { Token, DEFAULT_TOKENS, DEX_CONTRACTS } from '@/lib/web3/dex-config';
import { getAmountOut, swapTokens, getTokenBalance, calculatePriceImpact, getPairAddress, getReserves, isNativeToken } from '@/lib/web3/dex';
import { findAllRoutes, executeMultiHopSwap, Route } from '@/lib/web3/swap-router';
import { getCurrentAccount } from '@/lib/web3/wallet';
import TokenSelector from './TokenSelector';
import SlippageSettings from './SlippageSettings';
import PriceImpactWarning from './PriceImpactWarning';
import SwapConfirmModal from './SwapConfirmModal';
import SwapRouteDisplay from './SwapRouteDisplay';
import GasEstimator from './GasEstimator';
import { saveTransaction } from './TransactionHistory';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

const REFRESH_INTERVAL = 30000;

// Instant quote calculation without RPC call
const calculateInstantQuote = (
  amountIn: string,
  reserveIn: bigint,
  reserveOut: bigint,
  decimalsIn: number,
  decimalsOut: number
): string => {
  if (!amountIn || parseFloat(amountIn) === 0 || reserveIn === 0n) return '0';
  try {
    const amountInWei = ethers.parseUnits(amountIn, decimalsIn);
    // Uniswap formula: amountOut = (amountIn * 997 * reserveOut) / (reserveIn * 1000 + amountIn * 997)
    const amountInWithFee = amountInWei * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    const amountOutWei = numerator / denominator;
    return ethers.formatUnits(amountOutWei, decimalsOut);
  } catch {
    return '0';
  }
};

const SwapBox = () => {
  const { toast } = useToast();
  const [tokenIn, setTokenIn] = useState<Token>(DEFAULT_TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(DEFAULT_TOKENS[2]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [balanceIn, setBalanceIn] = useState('0');
  const [balanceOut, setBalanceOut] = useState('0');
  const [priceImpact, setPriceImpact] = useState(0);
  const [slippage, setSlippage] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [showTokenSelectorIn, setShowTokenSelectorIn] = useState(false);
  const [showTokenSelectorOut, setShowTokenSelectorOut] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [useSmartRouting, setUseSmartRouting] = useState(true);
  const [bestRoute, setBestRoute] = useState<Route | null>(null);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  
  // Cache reserves for instant calculation
  const [reserves, setReserves] = useState<{ reserve0: bigint; reserve1: bigint; token0: string; token1: string } | null>(null);
  const mountedRef = useRef(true);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    loadAccount();
    return () => { 
      mountedRef.current = false;
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (account) {
      loadBalances();
      loadReserves();
    }
  }, [account, tokenIn, tokenOut]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!account) return;

    const interval = setInterval(() => {
      loadBalances(true);
      loadReserves();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [account, tokenIn, tokenOut]);

  // INSTANT calculation using cached reserves
  const { reserveIn, reserveOut } = useMemo(() => {
    if (!reserves) return { reserveIn: 0n, reserveOut: 0n };
    
    const addressIn = isNativeToken(tokenIn.address) ? DEX_CONTRACTS.WETH9 : tokenIn.address;
    const isTokenInToken0 = reserves.token0.toLowerCase() === addressIn.toLowerCase();
    
    return {
      reserveIn: isTokenInToken0 ? reserves.reserve0 : reserves.reserve1,
      reserveOut: isTokenInToken0 ? reserves.reserve1 : reserves.reserve0,
    };
  }, [reserves, tokenIn.address, tokenOut.address]);

  // Instant quote update when amountIn changes
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut('');
      setPriceImpact(0);
      return;
    }
    
    // INSTANT calculation using local reserves (no RPC)
    if (reserves && reserveIn > 0n && reserveOut > 0n && !useSmartRouting) {
      const instantQuote = calculateInstantQuote(
        amountIn, reserveIn, reserveOut, tokenIn.decimals, tokenOut.decimals
      );
      setAmountOut(parseFloat(instantQuote).toFixed(6));
      
      // Calculate price impact locally
      const impact = calculatePriceImpact(
        amountIn, instantQuote, reserveIn.toString(), reserveOut.toString()
      );
      setPriceImpact(impact);
    }
    
    // Debounced RPC call for accurate calculation / smart routing
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    calculationTimeoutRef.current = setTimeout(() => {
      calculateAmountOut();
    }, 300); // 300ms debounce for RPC calls
  }, [amountIn, tokenIn, tokenOut, reserves, useSmartRouting]);

  const loadReserves = async () => {
    try {
      const pairAddress = await getPairAddress(tokenIn.address, tokenOut.address);
      if (pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000') {
        const reservesData = await getReserves(pairAddress);
        if (mountedRef.current && reservesData) {
          setReserves(reservesData);
        }
      } else {
        setReserves(null);
      }
    } catch {
      // Silent fail
    }
  };

  const loadAccount = async () => {
    try {
      const acc = await getCurrentAccount();
      setAccount(acc);
    } catch (error) {
      console.error('Error loading account:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to wallet. Please refresh and try again.',
        variant: 'destructive',
      });
    }
  };

  const loadBalances = useCallback(async (forceRefresh = false) => {
    if (!account) return;
    if (forceRefresh) setIsRefreshing(true);
    
    try {
      // Fetch balances with error handling
      const [balIn, balOut] = await Promise.allSettled([
        getTokenBalance(tokenIn.address, account, forceRefresh),
        getTokenBalance(tokenOut.address, account, forceRefresh)
      ]);
      
      setBalanceIn(balIn.status === 'fulfilled' ? balIn.value : '0');
      setBalanceOut(balOut.status === 'fulfilled' ? balOut.value : '0');
      setLastRefresh(new Date());
      
      if (balIn.status === 'rejected' || balOut.status === 'rejected') {
        console.warn('Some balances failed to load');
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    }
    
    if (forceRefresh) setIsRefreshing(false);
  }, [account, tokenIn, tokenOut]);

  const handleManualRefresh = () => {
    loadBalances(true);
    loadReserves();
  };

  const calculateAmountOut = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut('');
      setPriceImpact(0);
      return;
    }
    
    setIsCalculating(true);
    setBestRoute(null);
    setAllRoutes([]);
    
    try {
      if (useSmartRouting) {
        // Use smart routing to find best path
        const routeResult = await findAllRoutes(tokenIn, tokenOut, amountIn, 3);
        
        if (routeResult.bestRoute) {
          setBestRoute(routeResult.bestRoute);
          setAllRoutes(routeResult.allRoutes);
          setAmountOut(routeResult.bestRoute.amounts[routeResult.bestRoute.amounts.length - 1] || '0');
          setPriceImpact(routeResult.bestRoute.priceImpact);
        } else {
          // Fallback to direct swap calculation
          await calculateDirectSwap();
        }
      } else {
        // Direct swap only
        await calculateDirectSwap();
      }
    } catch (error: any) {
      console.error('Error calculating output:', error);
      // Try direct swap as last fallback
      try {
        await calculateDirectSwap();
      } catch (fallbackError) {
        console.error('Fallback calculation also failed:', fallbackError);
        setAmountOut('0');
        setPriceImpact(0);
        toast({
          title: 'Calculation Error',
          description: 'Unable to calculate swap amount. The pair may not have liquidity.',
          variant: 'destructive',
        });
      }
    }
    setIsCalculating(false);
  };
  
  const calculateDirectSwap = async () => {
    const output = await getAmountOut(amountIn, tokenIn, tokenOut);
    setAmountOut(output);
    
    const pairAddress = await getPairAddress(tokenIn.address, tokenOut.address);
    if (pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000') {
      const reserves = await getReserves(pairAddress);
      if (reserves && reserves.reserve0 > 0n && reserves.reserve1 > 0n) {
        const impact = calculatePriceImpact(
          amountIn,
          output,
          reserves.reserve0.toString(),
          reserves.reserve1.toString()
        );
        setPriceImpact(impact);
      }
    }
  };

  const handleSwitch = () => {
    const tempToken = tokenIn;
    const tempAmount = amountIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn(amountOut);
    setAmountOut(tempAmount);
    setBestRoute(null);
    setAllRoutes([]);
  };

  const handleSwapClick = () => {
    if (!account || !amountIn || !amountOut) return;
    setShowConfirmModal(true);
  };

  const handleSwap = async () => {
    if (!account || !amountIn || !amountOut) return;

    // Validate balance before swap
    if (parseFloat(amountIn) > parseFloat(balanceIn)) {
      toast({
        title: 'Insufficient Balance',
        description: `You don't have enough ${tokenIn.symbol}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      let result;
      
      // Use multi-hop swap if route has more than 2 tokens
      if (bestRoute && bestRoute.path.length > 2) {
        result = await executeMultiHopSwap(
          bestRoute,
          amountIn,
          amountOut,
          account,
          slippage
        );
      } else {
        result = await swapTokens(amountIn, amountOut, tokenIn, tokenOut, account, slippage);
      }
      
      if (result.success) {
        const routePath = bestRoute ? bestRoute.path.map(t => t.symbol).join(' → ') : `${tokenIn.symbol} → ${tokenOut.symbol}`;
        
        saveTransaction({
          hash: result.hash || '',
          type: 'swap',
          tokenIn: tokenIn.symbol,
          tokenOut: tokenOut.symbol,
          amountIn: amountIn,
          amountOut: amountOut,
          timestamp: Date.now(),
          status: 'success',
        });

        toast({
          title: 'Swap Successful!',
          description: `Swapped ${amountIn} ${tokenIn.symbol} for ${parseFloat(amountOut).toFixed(6)} ${tokenOut.symbol}`,
        });
        setAmountIn('');
        setAmountOut('');
        setBestRoute(null);
        setAllRoutes([]);
        setShowConfirmModal(false);
        // Refresh balances after successful swap
        setTimeout(() => loadBalances(true), 2000);
      } else {
        // Parse error message for better UX
        const errorMessage = parseSwapError(result.error || 'Unknown error');
        toast({
          title: 'Swap Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      const errorMessage = parseSwapError(error.message || 'Transaction failed');
      toast({
        title: 'Swap Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };
  
  // Parse common error messages for better UX
  const parseSwapError = (error: string): string => {
    if (error.includes('insufficient') || error.includes('INSUFFICIENT')) {
      return 'Insufficient balance or liquidity for this trade';
    }
    if (error.includes('slippage') || error.includes('EXPIRED') || error.includes('deadline')) {
      return 'Transaction expired. Please try again with higher slippage.';
    }
    if (error.includes('rejected') || error.includes('denied')) {
      return 'Transaction was rejected by user';
    }
    if (error.includes('gas') || error.includes('fee')) {
      return 'Not enough gas for transaction';
    }
    if (error.includes('pair') || error.includes('liquidity') || error.includes('K')) {
      return 'Insufficient liquidity in the pool';
    }
    return error.length > 100 ? error.substring(0, 100) + '...' : error;
  };

  const minReceived = amountOut ? (parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6) : '0';
  const rate = amountIn && amountOut ? `1 ${tokenIn.symbol} = ${(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} ${tokenOut.symbol}` : '';

  return (
    <>
      <Card className="w-full max-w-md mx-auto glass border-border/50 overflow-hidden shadow-xl backdrop-blur-xl">
        {/* Header */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Swap</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 hover:bg-primary/10"
              title={`Last refresh: ${lastRefresh.toLocaleTimeString()}`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} className="h-8 w-8 hover:bg-primary/10">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {/* Token In */}
          <div className="bg-secondary/40 rounded-xl p-4 border border-border/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You Pay</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Balance: <span className="text-foreground font-medium">{parseFloat(balanceIn).toFixed(4)}</span>
                </span>
                <Button
                  variant="ghost"
                  className="text-xs text-primary p-0 h-auto hover:bg-transparent hover:text-primary/80 font-semibold"
                  onClick={() => setAmountIn(balanceIn)}
                >
                  MAX
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="border-0 bg-transparent text-2xl font-bold focus-visible:ring-0 p-0 h-auto"
              />
              <Button
                variant="outline"
                onClick={() => setShowTokenSelectorIn(true)}
                className="flex items-center gap-2 min-w-[130px] h-10 rounded-full bg-background/60 border-border/50 hover:bg-background/80 hover:border-primary/30"
              >
                {tokenIn.logoURI ? (
                  <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-6 h-6 rounded-full object-cover ring-2 ring-background" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold ring-2 ring-background">
                    {tokenIn.symbol.charAt(0)}
                  </div>
                )}
                <span className="font-semibold">{tokenIn.symbol}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-1 relative z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwitch}
              className="rounded-full bg-background border-2 border-border/50 hover:bg-primary/10 hover:border-primary/50 hover:rotate-180 transition-all duration-300 shadow-lg"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Token Out */}
          <div className="bg-secondary/40 rounded-xl p-4 border border-border/30 hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You Receive</span>
              <span className="text-xs text-muted-foreground">
                Balance: <span className="text-foreground font-medium">{parseFloat(balanceOut).toFixed(4)}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-bold min-h-[32px] flex items-center">
                {isCalculating ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Calculating...</span>
                  </div>
                ) : amountOut ? (
                  <span className={parseFloat(amountOut) > 0 ? 'text-green-500' : ''}>
                    {parseFloat(amountOut).toFixed(6)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">0.0</span>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowTokenSelectorOut(true)}
                className="flex items-center gap-2 min-w-[130px] h-10 rounded-full bg-background/60 border-border/50 hover:bg-background/80 hover:border-primary/30"
              >
                {tokenOut.logoURI ? (
                  <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-6 h-6 rounded-full object-cover ring-2 ring-background" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold ring-2 ring-background">
                    {tokenOut.symbol.charAt(0)}
                  </div>
                )}
                <span className="font-semibold">{tokenOut.symbol}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Smart Routing Toggle */}
          <div className="flex items-center justify-between text-sm px-2 py-1">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${useSmartRouting ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-muted-foreground text-xs">Smart Routing</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseSmartRouting(!useSmartRouting)}
              className={`h-6 px-3 text-xs rounded-full ${useSmartRouting ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'text-muted-foreground hover:bg-secondary'}`}
            >
              {useSmartRouting ? 'On' : 'Off'}
            </Button>
          </div>

          {/* Route Display */}
          {amountIn && amountOut && useSmartRouting && (
            <SwapRouteDisplay 
              route={bestRoute} 
              allRoutes={allRoutes} 
              isLoading={isCalculating} 
            />
          )}

          {/* Price Impact Warning */}
          {amountIn && amountOut && priceImpact >= 2 && (
            <PriceImpactWarning priceImpact={priceImpact} />
          )}

          {/* Swap Info */}
          {amountIn && amountOut && (
            <div className="bg-secondary/20 rounded-xl p-3 space-y-2 text-sm border border-border/20">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Rate</span>
                <span className="font-medium text-xs">
                  1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Price Impact</span>
                <span className={`font-medium text-xs ${priceImpact > 5 ? 'text-destructive' : priceImpact > 2 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Min. Received</span>
                <span className="font-medium text-xs">{minReceived} {tokenOut.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Slippage</span>
                <span className="font-medium text-xs bg-primary/10 px-2 py-0.5 rounded-full">{slippage}%</span>
              </div>
              <GasEstimator compact />
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwapClick}
            disabled={!account || !amountIn || !amountOut || isLoading || parseFloat(amountIn) > parseFloat(balanceIn)}
            className={`w-full h-14 text-lg font-bold rounded-xl transition-all duration-300 ${
              !account 
                ? 'bg-secondary text-muted-foreground' 
                : parseFloat(amountIn) > parseFloat(balanceIn) 
                  ? 'bg-destructive/20 text-destructive border border-destructive/30' 
                  : 'bg-gradient-sakura hover:shadow-sakura hover:scale-[1.02]'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Swapping...</span>
              </div>
            ) : !account ? (
              'Connect Wallet'
            ) : !amountIn ? (
              'Enter Amount'
            ) : parseFloat(amountIn) > parseFloat(balanceIn) ? (
              <span className="flex items-center gap-2">
                <span>⚠️</span>
                Insufficient {tokenIn.symbol}
              </span>
            ) : (
              'Swap'
            )}
          </Button>
        </div>
      </Card>

      {/* Swap Confirm Modal */}
      <SwapConfirmModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSwap}
        isLoading={isLoading}
        tokenIn={tokenIn}
        tokenOut={tokenOut}
        amountIn={amountIn}
        amountOut={amountOut}
        priceImpact={priceImpact}
        minReceived={minReceived}
        slippage={slippage}
        rate={rate}
      />

      {/* Token Selectors */}
      <TokenSelector
        open={showTokenSelectorIn}
        onClose={() => setShowTokenSelectorIn(false)}
        onSelect={setTokenIn}
        selectedToken={tokenIn}
        disabledToken={tokenOut}
      />
      <TokenSelector
        open={showTokenSelectorOut}
        onClose={() => setShowTokenSelectorOut(false)}
        onSelect={setTokenOut}
        selectedToken={tokenOut}
        disabledToken={tokenIn}
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

export default SwapBox;
