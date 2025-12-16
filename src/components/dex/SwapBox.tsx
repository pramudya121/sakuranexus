import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowDown, Settings, Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { getAmountOut, swapTokens, getTokenBalance, calculatePriceImpact, getPairAddress, getReserves } from '@/lib/web3/dex';
import { getCurrentAccount } from '@/lib/web3/wallet';
import TokenSelector from './TokenSelector';
import SlippageSettings from './SlippageSettings';
import PriceImpactWarning from './PriceImpactWarning';
import { saveTransaction } from './TransactionHistory';
import { useToast } from '@/hooks/use-toast';

const REFRESH_INTERVAL = 30000; // 30 seconds

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
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

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
    const acc = await getCurrentAccount();
    setAccount(acc);
  };

  const loadBalances = useCallback(async (forceRefresh = false) => {
    if (!account) return;
    if (forceRefresh) setIsRefreshing(true);
    
    try {
      // Fetch sequentially to reduce RPC load
      const balIn = await getTokenBalance(tokenIn.address, account, forceRefresh);
      setBalanceIn(balIn);
      
      // Small delay between calls to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const balOut = await getTokenBalance(tokenOut.address, account, forceRefresh);
      setBalanceOut(balOut);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading balances:', error);
    }
    
    if (forceRefresh) setIsRefreshing(false);
  }, [account, tokenIn, tokenOut]);

  const handleManualRefresh = () => {
    loadBalances(true);
  };

  const calculateAmountOut = async () => {
    setIsCalculating(true);
    try {
      const output = await getAmountOut(amountIn, tokenIn, tokenOut);
      setAmountOut(output);

      // Calculate price impact
      const pairAddress = await getPairAddress(tokenIn.address, tokenOut.address);
      if (pairAddress) {
        const reserves = await getReserves(pairAddress);
        if (reserves) {
          const impact = calculatePriceImpact(
            amountIn,
            output,
            reserves.reserve0.toString(),
            reserves.reserve1.toString()
          );
          setPriceImpact(impact);
        }
      }
    } catch (error) {
      console.error('Error calculating output:', error);
    }
    setIsCalculating(false);
  };

  const handleSwitch = () => {
    const tempToken = tokenIn;
    const tempAmount = amountIn;
    setTokenIn(tokenOut);
    setTokenOut(tempToken);
    setAmountIn(amountOut);
    setAmountOut(tempAmount);
  };

  const handleSwap = async () => {
    if (!account || !amountIn || !amountOut) return;

    setIsLoading(true);
    try {
      const result = await swapTokens(amountIn, amountOut, tokenIn, tokenOut, account, slippage);
      
      if (result.success) {
        // Save transaction to history
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
          description: `Swapped ${amountIn} ${tokenIn.symbol} for ${amountOut} ${tokenOut.symbol}`,
        });
        setAmountIn('');
        setAmountOut('');
        loadBalances();
      } else {
        toast({
          title: 'Swap Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Swap Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const minReceived = amountOut ? (parseFloat(amountOut) * (1 - slippage / 100)).toFixed(6) : '0';

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
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={!account || !amountIn || !amountOut || isLoading || parseFloat(amountIn) > parseFloat(balanceIn)}
            className="w-full h-14 text-lg font-bold bg-gradient-sakura hover:shadow-sakura"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Swapping...
              </>
            ) : !account ? (
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
