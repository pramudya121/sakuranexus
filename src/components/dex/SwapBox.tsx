import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowDown, Settings, Loader2, ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { getAmountOut, swapTokens, getTokenBalance, calculatePriceImpact, getPairAddress, getReserves } from '@/lib/web3/dex';
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

const REFRESH_INTERVAL = 30000;

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

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    if (account) {
      loadBalances();
    }
  }, [account, tokenIn, tokenOut]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!account) return;

    const interval = setInterval(() => {
      loadBalances(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [account, tokenIn, tokenOut]);

  useEffect(() => {
    if (amountIn && parseFloat(amountIn) > 0) {
      calculateAmountOut();
    } else {
      setAmountOut('');
      setPriceImpact(0);
    }
  }, [amountIn, tokenIn, tokenOut]);

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
      <Card className="w-full max-w-md mx-auto glass border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-bold">Swap</h3>
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

        <div className="p-4 space-y-2">
          {/* Token In */}
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">You Pay</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Balance: {parseFloat(balanceIn).toFixed(4)}
                </span>
                <Button
                  variant="link"
                  className="text-xs text-primary p-0 h-auto"
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
                className="border-0 bg-transparent text-2xl font-semibold focus-visible:ring-0 p-0"
              />
              <Button
                variant="outline"
                onClick={() => setShowTokenSelectorIn(true)}
                className="flex items-center gap-2 min-w-[120px]"
              >
                {tokenIn.logoURI ? (
                  <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                    {tokenIn.symbol.charAt(0)}
                  </div>
                )}
                {tokenIn.symbol}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center -my-1 relative z-10">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSwitch}
              className="rounded-full bg-background border-border/50 hover:bg-secondary"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>

          {/* Token Out */}
          <div className="bg-secondary/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">You Receive</span>
              <span className="text-sm text-muted-foreground">
                Balance: {parseFloat(balanceOut).toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-2xl font-semibold">
                {isCalculating ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  amountOut || '0.0'
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowTokenSelectorOut(true)}
                className="flex items-center gap-2 min-w-[120px]"
              >
                {tokenOut.logoURI ? (
                  <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                    {tokenOut.symbol.charAt(0)}
                  </div>
                )}
                {tokenOut.symbol}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Smart Routing Toggle */}
          <div className="flex items-center justify-between text-sm px-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Smart Routing</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseSmartRouting(!useSmartRouting)}
              className={`h-6 px-2 ${useSmartRouting ? 'text-primary' : 'text-muted-foreground'}`}
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
            <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span>
                  1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={priceImpact > 5 ? 'text-destructive' : priceImpact > 2 ? 'text-yellow-500' : 'text-green-500'}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Min. Received</span>
                <span>{minReceived} {tokenOut.symbol}</span>
              </div>
              <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Slippage</span>
                <span>{slippage}%</span>
              </div>
              <GasEstimator compact />
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwapClick}
            disabled={!account || !amountIn || !amountOut || isLoading || parseFloat(amountIn) > parseFloat(balanceIn)}
            className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura"
          >
            {!account ? (
              'Connect Wallet'
            ) : !amountIn ? (
              'Enter Amount'
            ) : parseFloat(amountIn) > parseFloat(balanceIn) ? (
              'Insufficient Balance'
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
