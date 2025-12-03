import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Loader2, ChevronDown, Settings } from 'lucide-react';
import { Token, DEFAULT_TOKENS } from '@/lib/web3/dex-config';
import { addLiquidity, removeLiquidity, getTokenBalance, getPairAddress, getLPBalance, getReserves } from '@/lib/web3/dex';
import { getCurrentAccount } from '@/lib/web3/wallet';
import TokenSelector from './TokenSelector';
import SlippageSettings from './SlippageSettings';
import { useToast } from '@/hooks/use-toast';

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
  const [account, setAccount] = useState<string | null>(null);
  const [showTokenSelectorA, setShowTokenSelectorA] = useState(false);
  const [showTokenSelectorB, setShowTokenSelectorB] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [poolShare, setPoolShare] = useState(0);
  const [pairAddress, setPairAddress] = useState<string | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  useEffect(() => {
    if (account) {
      loadBalances();
      loadPairInfo();
    }
  }, [account, tokenA, tokenB]);

  const loadAccount = async () => {
    const acc = await getCurrentAccount();
    setAccount(acc);
  };

  const loadBalances = async () => {
    if (!account) return;
    const [balA, balB] = await Promise.all([
      getTokenBalance(tokenA.address, account),
      getTokenBalance(tokenB.address, account),
    ]);
    setBalanceA(balA);
    setBalanceB(balB);
  };

  const loadPairInfo = async () => {
    if (!account) return;
    const pair = await getPairAddress(tokenA.address, tokenB.address);
    setPairAddress(pair);
    
    if (pair) {
      const lpBal = await getLPBalance(pair, account);
      setLpBalance(lpBal);
    } else {
      setLpBalance('0');
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
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="w-5 h-5" />
          </Button>
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
                <span className="text-sm text-muted-foreground">
                  Balance: {parseFloat(balanceA).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                  className="border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowTokenSelectorA(true)}
                  className="flex items-center gap-2 min-w-[120px]"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                    {tokenA.symbol.charAt(0)}
                  </div>
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
                <span className="text-sm text-muted-foreground">
                  Balance: {parseFloat(balanceB).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                  className="border-0 bg-transparent text-xl font-semibold focus-visible:ring-0 p-0"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowTokenSelectorB(true)}
                  className="flex items-center gap-2 min-w-[120px]"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-xs font-bold">
                    {tokenB.symbol.charAt(0)}
                  </div>
                  {tokenB.symbol}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Pool Info */}
            <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm">
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
                <span className="text-sm text-muted-foreground">
                  Balance: {parseFloat(lpBalance).toFixed(6)}
                </span>
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
