import { memo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowRightLeft, 
  Zap,
  Loader2,
  TrendingUp,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';
import { useTokenPrice } from '@/hooks/usePriceWebSocket';

interface QuickSwapProps {
  onSwapComplete?: () => void;
}

interface QuickPair {
  from: Token;
  to: Token;
  popular: boolean;
}

const QuickSwap = memo(({ onSwapComplete }: QuickSwapProps) => {
  const { toast } = useToast();
  const [selectedPair, setSelectedPair] = useState<QuickPair | null>(null);
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  // Popular trading pairs
  const quickPairs: QuickPair[] = [
    { from: DEFAULT_TOKENS[0], to: DEFAULT_TOKENS[2], popular: true }, // NEX -> USDC
    { from: DEFAULT_TOKENS[2], to: DEFAULT_TOKENS[0], popular: true }, // USDC -> NEX
    { from: DEFAULT_TOKENS[0], to: DEFAULT_TOKENS[3], popular: false }, // NEX -> WETH
    { from: DEFAULT_TOKENS[3], to: DEFAULT_TOKENS[0], popular: false }, // WETH -> NEX
  ];

  const { price: fromPrice } = useTokenPrice(selectedPair?.from || null);
  const { price: toPrice } = useTokenPrice(selectedPair?.to || null);

  const exchangeRate = fromPrice && toPrice ? fromPrice / toPrice : 0;
  const estimatedOutput = amount ? parseFloat(amount) * exchangeRate : 0;

  const handleQuickSwap = useCallback(async () => {
    if (!selectedPair || !amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please select a pair and enter an amount',
        variant: 'destructive',
      });
      return;
    }

    setIsSwapping(true);
    
    // Simulate swap
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Swap Successful! 🎉',
      description: `Swapped ${amount} ${selectedPair.from.symbol} for ~${estimatedOutput.toFixed(4)} ${selectedPair.to.symbol}`,
    });

    setAmount('');
    setSelectedPair(null);
    setIsSwapping(false);
    onSwapComplete?.();
  }, [selectedPair, amount, estimatedOutput, toast, onSwapComplete]);

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          Quick Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Pairs */}
        <div className="grid grid-cols-2 gap-2">
          {quickPairs.map((pair, i) => (
            <Button
              key={i}
              variant={selectedPair === pair ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPair(pair)}
              className="relative justify-start gap-2 h-auto py-2"
            >
              <div className="flex items-center gap-1">
                {pair.from.logoURI && (
                  <img src={pair.from.logoURI} alt={pair.from.symbol} className="w-5 h-5 rounded-full" />
                )}
                <span className="text-xs font-medium">{pair.from.symbol}</span>
              </div>
              <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
              <div className="flex items-center gap-1">
                {pair.to.logoURI && (
                  <img src={pair.to.logoURI} alt={pair.to.symbol} className="w-5 h-5 rounded-full" />
                )}
                <span className="text-xs font-medium">{pair.to.symbol}</span>
              </div>
              {pair.popular && (
                <Badge className="absolute -top-1 -right-1 text-[8px] px-1 py-0 bg-amber-500">
                  HOT
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Amount Input */}
        {selectedPair && (
          <div className="space-y-3 animate-fade-in">
            <div className="relative">
              <Input
                type="number"
                placeholder={`Amount in ${selectedPair.from.symbol}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pr-16"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                onClick={() => setAmount('100')}
              >
                MAX
              </Button>
            </div>

            {/* Exchange Rate */}
            {exchangeRate > 0 && (
              <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium flex items-center gap-1">
                  1 {selectedPair.from.symbol} = {exchangeRate.toFixed(4)} {selectedPair.to.symbol}
                  <TrendingUp className="w-3 h-3 text-green-500" />
                </span>
              </div>
            )}

            {/* Estimated Output */}
            {estimatedOutput > 0 && (
              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">You'll receive</span>
                  <span className="font-bold text-green-500">
                    ~{estimatedOutput.toFixed(4)} {selectedPair.to.symbol}
                  </span>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <Button
              onClick={handleQuickSwap}
              disabled={isSwapping || !amount || parseFloat(amount) <= 0}
              className="w-full btn-hero"
            >
              {isSwapping ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Swapping...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Swap
                </>
              )}
            </Button>
          </div>
        )}

        {!selectedPair && (
          <p className="text-center text-sm text-muted-foreground py-2">
            Select a trading pair above to start
          </p>
        )}
      </CardContent>
    </Card>
  );
});

QuickSwap.displayName = 'QuickSwap';

export default QuickSwap;
