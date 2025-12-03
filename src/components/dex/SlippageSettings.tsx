import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SlippageSettingsProps {
  open: boolean;
  onClose: () => void;
  slippage: number;
  onSlippageChange: (value: number) => void;
}

const SLIPPAGE_OPTIONS = [0.1, 0.5, 1.0];

const SlippageSettings = ({ open, onClose, slippage, onSlippageChange }: SlippageSettingsProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm glass border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Transaction Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Slippage Tolerance</Label>
            <div className="flex items-center gap-2 mt-2">
              {SLIPPAGE_OPTIONS.map((option) => (
                <Button
                  key={option}
                  variant={slippage === option ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onSlippageChange(option)}
                  className={slippage === option ? 'bg-gradient-sakura' : ''}
                >
                  {option}%
                </Button>
              ))}
              <div className="flex items-center gap-1 flex-1">
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => onSlippageChange(parseFloat(e.target.value) || 0)}
                  className="text-right"
                  step={0.1}
                  min={0}
                  max={50}
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
            {slippage > 5 && (
              <p className="text-xs text-yellow-500 mt-2">
                High slippage increases risk of front-running
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Slippage tolerance is the maximum price change you're willing to accept between when you
              submit a transaction and when it gets confirmed.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SlippageSettings;
