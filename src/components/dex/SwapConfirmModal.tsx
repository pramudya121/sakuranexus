import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowDown, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Token } from '@/lib/web3/dex-config';

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
}: SwapConfirmModalProps) => {
  const isHighImpact = priceImpact >= 5;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Swap</DialogTitle>
          <DialogDescription>
            Review your swap details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From Token */}
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">You Pay</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{amountIn}</span>
              <div className="flex items-center gap-2">
                {tokenIn.logoURI ? (
                  <img src={tokenIn.logoURI} alt={tokenIn.symbol} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white font-bold">
                    {tokenIn.symbol.charAt(0)}
                  </div>
                )}
                <span className="font-bold">{tokenIn.symbol}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ArrowDown className="w-5 h-5" />
            </div>
          </div>

          {/* To Token */}
          <div className="bg-secondary/30 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-1">You Receive</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{amountOut}</span>
              <div className="flex items-center gap-2">
                {tokenOut.logoURI ? (
                  <img src={tokenOut.logoURI} alt={tokenOut.symbol} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center text-white font-bold">
                    {tokenOut.symbol.charAt(0)}
                  </div>
                )}
                <span className="font-bold">{tokenOut.symbol}</span>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>{rate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Price Impact</span>
              <span className={isHighImpact ? 'text-destructive font-bold' : priceImpact > 2 ? 'text-yellow-500' : 'text-green-500'}>
                {priceImpact.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Minimum Received</span>
              <span>{minReceived} {tokenOut.symbol}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span>{slippage}%</span>
            </div>
          </div>

          {/* High Impact Warning */}
          {isHighImpact && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">High Price Impact Warning</p>
                <p className="text-sm text-destructive/80">
                  This swap has a significant price impact. You may receive much less than expected.
                </p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              Output is estimated. You will receive at least {minReceived} {tokenOut.symbol} or the transaction will revert.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className={isHighImpact ? 'bg-destructive hover:bg-destructive/90' : 'bg-gradient-sakura hover:shadow-sakura'}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : isHighImpact ? (
              'Swap Anyway'
            ) : (
              'Confirm Swap'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SwapConfirmModal;
