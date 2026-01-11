import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRightLeft, 
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_TOKENS, Token } from '@/lib/web3/dex-config';

const WrapUnwrapPanel = memo(() => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState({ pc: 0.000000, wpc: 0 });

  // Simulated balances
  useEffect(() => {
    setBalance({
      pc: 0.000000,
      wpc: 0,
    });
  }, []);

  const handleWrap = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Wrap Successful',
      description: `Wrapped ${amount} PC to WPC`,
    });
    
    setAmount('');
    setIsProcessing(false);
  };

  const handleUnwrap = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Unwrap Successful',
      description: `Unwrapped ${amount} WPC to PC`,
    });
    
    setAmount('');
    setIsProcessing(false);
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          Wrap / Unwrap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wrap" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4 h-9">
            <TabsTrigger value="wrap" className="text-xs">Wrap PC</TabsTrigger>
            <TabsTrigger value="unwrap" className="text-xs">Unwrap WPC</TabsTrigger>
          </TabsList>

          <TabsContent value="wrap" className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">PC Balance:</span>
                <span className="font-mono">{balance.pc.toFixed(6)} PC</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16 h-10 bg-muted/30"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-primary"
                  onClick={() => setAmount(balance.pc.toString())}
                >
                  MAX
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <div className="text-xs text-muted-foreground mb-1">You will receive</div>
              <div className="font-bold">{amount || '0'} WPC</div>
            </div>

            <Button
              onClick={handleWrap}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0}
              className="w-full bg-gradient-to-r from-primary to-pink-600"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Wrap PC to WPC
            </Button>
          </TabsContent>

          <TabsContent value="unwrap" className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">WPC Balance:</span>
                <span className="font-mono">{balance.wpc} WPC</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pr-16 h-10 bg-muted/30"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-primary"
                  onClick={() => setAmount(balance.wpc.toString())}
                >
                  MAX
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 text-center">
              <div className="text-xs text-muted-foreground mb-1">You will receive</div>
              <div className="font-bold">{amount || '0'} PC</div>
            </div>

            <Button
              onClick={handleUnwrap}
              disabled={isProcessing || !amount || parseFloat(amount) <= 0}
              className="w-full bg-gradient-to-r from-primary to-pink-600"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Unwrap WPC to PC
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});

WrapUnwrapPanel.displayName = 'WrapUnwrapPanel';

export default WrapUnwrapPanel;
