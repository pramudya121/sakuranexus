import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Token } from '@/lib/web3/dex-config';
import { Loader2, ArrowRight, Droplets, AlertTriangle, Check, X } from 'lucide-react';

interface LiquidityConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  mode: 'add' | 'remove';
  tokenA: Token;
  tokenB: Token;
  amountA: string;
  amountB: string;
  lpAmount?: string;
  estimatedLP?: string;
  poolShare?: number;
  slippage: number;
}

const LiquidityConfirmModal = ({
  open,
  onClose,
  onConfirm,
  isLoading,
  mode,
  tokenA,
  tokenB,
  amountA,
  amountB,
  lpAmount,
  estimatedLP,
  poolShare,
  slippage,
}: LiquidityConfirmModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isLoading && onClose()}>
      <DialogContent className="glass border-border/50 max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            {mode === 'add' ? 'Confirm Add Liquidity' : 'Confirm Remove Liquidity'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {mode === 'add' 
              ? 'Review your liquidity addition details before confirming'
              : 'Review your liquidity removal details before confirming'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* LP Tokens being burned (for remove mode) */}
          {mode === 'remove' && lpAmount && (
            <div className="bg-destructive/10 rounded-xl p-4 animate-fade-in-up border border-destructive/20">
              <p className="text-sm text-muted-foreground text-center mb-2">LP Tokens to Burn</p>
              <p className="text-2xl font-bold text-center text-destructive number-transition">
                {parseFloat(lpAmount).toFixed(6)} LP
              </p>
            </div>
          )}

          {/* Token Summary */}
          <div className="bg-secondary/30 rounded-xl p-4 space-y-3 animate-fade-in-up">
            <p className="text-sm text-muted-foreground text-center">
              {mode === 'add' ? 'You will deposit' : 'You will receive (estimated)'}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tokenA.logoURI ? (
                  <img src={tokenA.logoURI} alt={tokenA.symbol} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-sm font-bold">
                    {tokenA.symbol.charAt(0)}
                  </div>
                )}
                <span className="font-medium">{tokenA.symbol}</span>
              </div>
              <span className={`text-lg font-bold number-transition ${mode === 'remove' ? 'text-green-500' : ''}`}>
                {mode === 'remove' ? '+' : ''}{parseFloat(amountA).toFixed(6)}
              </span>
            </div>
            
            <div className="flex justify-center">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                {mode === 'add' ? <span className="text-primary font-bold">+</span> : <span className="text-green-500 font-bold">+</span>}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {tokenB.logoURI ? (
                  <img src={tokenB.logoURI} alt={tokenB.symbol} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-sakura flex items-center justify-center text-white text-sm font-bold">
                    {tokenB.symbol.charAt(0)}
                  </div>
                )}
                <span className="font-medium">{tokenB.symbol}</span>
              </div>
              <span className={`text-lg font-bold number-transition ${mode === 'remove' ? 'text-green-500' : ''}`}>
                {mode === 'remove' ? '+' : ''}{parseFloat(amountB).toFixed(6)}
              </span>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-secondary/20 rounded-lg p-3 space-y-2 text-sm animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            {mode === 'add' && estimatedLP && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">LP Tokens to Receive</span>
                <span className="font-medium text-primary">{parseFloat(estimatedLP).toFixed(6)}</span>
              </div>
            )}
            {mode === 'remove' && lpAmount && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">LP Tokens to Burn</span>
                <span className="font-medium text-destructive">{parseFloat(lpAmount).toFixed(6)}</span>
              </div>
            )}
            {poolShare !== undefined && mode === 'add' && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pool Share</span>
                <span className="font-medium">{poolShare.toFixed(2)}%</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Slippage Tolerance</span>
              <span className="font-medium">{slippage}%</span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-500/80">
              {mode === 'add' 
                ? 'Output is estimated. If the price changes by more than your slippage tolerance, your transaction will revert.'
                : 'You will receive tokens at the current exchange rate. Transaction may revert if price changes significantly.'
              }
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 transition-all duration-300 hover:scale-[1.02]"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-gradient-sakura hover:shadow-sakura transition-all duration-300 hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'add' ? 'Adding...' : 'Removing...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm {mode === 'add' ? 'Add' : 'Remove'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LiquidityConfirmModal;
