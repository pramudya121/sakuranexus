import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowDown, AlertTriangle, Info, Loader2, Zap, Shield, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Token } from '@/lib/web3/dex-config';
import { useState } from 'react';

interface SwapConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  minReceived: string;
  slippage: number;
  rate: string;
  route?: string[];
}

const SwapConfirmModal = ({
  open,
  onClose,
  onConfirm,
  isLoading,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  priceImpact,
  minReceived,
  slippage,
  rate,
  route,
}: SwapConfirmModalProps) => {
  const isHighImpact = priceImpact >= 5;
  const isMediumImpact = priceImpact >= 2 && priceImpact < 5;
  const [step, setStep] = useState<'preview' | 'pending' | 'success'>('preview');

  const handleConfirm = async () => {
    setStep('pending');
    await onConfirm();
  };

  const handleClose = () => {
    setStep('preview');
    onClose();
  };

  // Calculate USD values (mock)
  const tokenInUSD = (parseFloat(amountIn) * 1.5).toFixed(2);
  const tokenOutUSD = (parseFloat(amountOut) * 1.5).toFixed(2);
  const networkFee = '~0.001 NEX';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              Confirm Swap
            </DialogTitle>
            <DialogDescription>
              Review your transaction details before confirming
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Token Exchange Visual */}
          <div className="relative">
            {/* From Token */}
            <div className="bg-secondary/40 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You Pay</span>
                <span className="text-xs text-muted-foreground">≈ ${tokenInUSD}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{parseFloat(amountIn).toFixed(6)}</span>
                <div className="flex items-center gap-2 bg-background/60 rounded-full px-3 py-1.5">
                  {tokenIn.logoURI ? (
                    <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-7 h-7 rounded-full ring-2 ring-background" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold text-sm ring-2 ring-background">
                      {tokenIn.symbol.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold">{tokenIn.symbol}</span>
                </div>
              </div>
            </div>

            {/* Arrow Indicator */}
            <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" style={{ top: 'calc(50% + 8px)' }}>
              <div className="w-10 h-10 rounded-full bg-background border-4 border-secondary flex items-center justify-center shadow-lg">
                <ArrowDown className="w-5 h-5 text-primary" />
              </div>
            </div>

            {/* Spacer */}
            <div className="h-2" />

            {/* To Token */}
            <div className="bg-gradient-to-br from-primary/10 to-transparent rounded-xl p-4 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">You Receive</span>
                <span className="text-xs text-muted-foreground">≈ ${tokenOutUSD}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-green-500">{parseFloat(amountOut).toFixed(6)}</span>
                <div className="flex items-center gap-2 bg-background/60 rounded-full px-3 py-1.5">
                  {tokenOut.logoURI ? (
                    <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-7 h-7 rounded-full ring-2 ring-background" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold text-sm ring-2 ring-background">
                      {tokenOut.symbol.charAt(0)}
                    </div>
                  )}
                  <span className="font-semibold">{tokenOut.symbol}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Display */}
          {route && route.length > 2 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/30 rounded-lg text-xs">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Route:</span>
              <span className="font-medium">{route.join(' → ')}</span>
            </div>
          )}

          {/* Transaction Details */}
          <div className="bg-secondary/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Rate
              </span>
              <span className="font-medium">{rate}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Price Impact
              </span>
              <span className={`font-semibold px-2 py-0.5 rounded-full text-xs ${
                isHighImpact 
                  ? 'bg-destructive/20 text-destructive' 
                  : isMediumImpact 
                    ? 'bg-yellow-500/20 text-yellow-600' 
                    : 'bg-green-500/20 text-green-600'
              }`}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Minimum Received
              </span>
              <span className="font-medium">{minReceived} {tokenOut.symbol}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Slippage Tolerance
              </span>
              <span className="font-medium bg-primary/10 px-2 py-0.5 rounded-full text-xs">{slippage}%</span>
            </div>

            <div className="border-t border-border/50 pt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="font-medium text-muted-foreground">{networkFee}</span>
            </div>
          </div>

          {/* High Impact Warning */}
          {isHighImpact && (
            <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl animate-pulse">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">High Price Impact</p>
                <p className="text-sm text-destructive/80">
                  This swap has a {priceImpact.toFixed(2)}% price impact. You may receive significantly less than expected.
                </p>
              </div>
            </div>
          )}

          {/* Medium Impact Warning */}
          {isMediumImpact && !isHighImpact && (
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-700 dark:text-yellow-500">Moderate Price Impact</p>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-500/80">
                  Consider reducing your trade size for better rates.
                </p>
              </div>
            </div>
          )}

          {/* Security Note */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Transaction is secure and will be processed on the blockchain</span>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0 gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className={`flex-1 ${isHighImpact ? 'bg-destructive hover:bg-destructive/90' : 'bg-gradient-sakura hover:shadow-sakura'}`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : isHighImpact ? (
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Swap Anyway
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Confirm Swap
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwapConfirmModal;
