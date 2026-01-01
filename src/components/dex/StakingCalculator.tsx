import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  Coins,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface StakingCalculatorProps {
  defaultAPR?: number;
}

const StakingCalculator = ({ defaultAPR = 24.5 }: StakingCalculatorProps) => {
  const [amount, setAmount] = useState<string>('1000');
  const [apr, setApr] = useState<number>(defaultAPR);
  const [lockDays, setLockDays] = useState<number>(30);

  const calculations = useMemo(() => {
    const principal = parseFloat(amount) || 0;
    const dailyRate = apr / 100 / 365;
    
    // Simple interest for lock period
    const lockPeriodRewards = principal * (apr / 100) * (lockDays / 365);
    
    // Projections
    const daily = principal * dailyRate;
    const weekly = daily * 7;
    const monthly = daily * 30;
    const yearly = principal * (apr / 100);
    
    // Compound interest (if auto-compound)
    const compoundedYearly = principal * Math.pow(1 + dailyRate, 365) - principal;
    
    return {
      lockPeriodRewards,
      daily,
      weekly,
      monthly,
      yearly,
      compoundedYearly,
      totalAfterLock: principal + lockPeriodRewards,
    };
  }, [amount, apr, lockDays]);

  const lockPeriods = [
    { days: 7, label: '7D', bonus: 0 },
    { days: 30, label: '30D', bonus: 10 },
    { days: 90, label: '90D', bonus: 25 },
    { days: 180, label: '180D', bonus: 50 },
    { days: 365, label: '1Y', bonus: 100 },
  ];

  const effectiveAPR = apr + (lockPeriods.find(p => p.days === lockDays)?.bonus || 0) * (apr / 100);

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          Staking Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Stake Amount</Label>
          <div className="relative">
            <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="pl-10 text-lg font-semibold h-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              NEX
            </span>
          </div>
          <div className="flex gap-2">
            {['100', '1000', '5000', '10000'].map((val) => (
              <Button
                key={val}
                variant="outline"
                size="sm"
                onClick={() => setAmount(val)}
                className="flex-1 text-xs"
              >
                {parseInt(val).toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        {/* Lock Period */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lock Period
            </Label>
            <Badge variant="outline" className="text-primary border-primary/30">
              {lockDays} Days
            </Badge>
          </div>
          <div className="flex gap-2">
            {lockPeriods.map((period) => (
              <Button
                key={period.days}
                variant={lockDays === period.days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLockDays(period.days)}
                className="flex-1 flex-col h-auto py-2"
              >
                <span className="text-xs font-bold">{period.label}</span>
                {period.bonus > 0 && (
                  <span className="text-[10px] text-green-500">+{period.bonus}%</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* APR Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Base APR
            </Label>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                {apr.toFixed(1)}%
              </Badge>
              {effectiveAPR > apr && (
                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {effectiveAPR.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
          <Slider
            value={[apr]}
            onValueChange={([value]) => setApr(value)}
            min={5}
            max={100}
            step={0.5}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-sm text-muted-foreground">
              Estimated Rewards
            </span>
          </div>
        </div>

        {/* Rewards Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily</p>
            <p className="text-lg font-bold text-primary">
              {calculations.daily.toFixed(4)}
            </p>
            <p className="text-[10px] text-muted-foreground">NEX</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Weekly</p>
            <p className="text-lg font-bold text-primary">
              {calculations.weekly.toFixed(4)}
            </p>
            <p className="text-[10px] text-muted-foreground">NEX</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Monthly</p>
            <p className="text-lg font-bold text-primary">
              {calculations.monthly.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">NEX</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Yearly</p>
            <p className="text-lg font-bold text-primary">
              {calculations.yearly.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground">NEX</p>
          </div>
        </div>

        {/* Lock Period Result */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">After {lockDays} days</span>
            <Badge className="bg-primary/20 text-primary">Lock Period</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Principal</p>
              <p className="text-lg font-bold">{parseFloat(amount || '0').toLocaleString()}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
            <div className="text-center flex-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-green-500">
                {calculations.totalAfterLock.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-sm text-green-500 font-medium">
              +{calculations.lockPeriodRewards.toLocaleString(undefined, { maximumFractionDigits: 2 })} NEX rewards
            </span>
          </div>
        </div>

        {/* Compound Info */}
        <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Auto-Compound Boost
            </p>
            <p className="text-xs text-muted-foreground">
              With daily compounding, earn up to{' '}
              <span className="text-green-500 font-medium">
                {calculations.compoundedYearly.toLocaleString(undefined, { maximumFractionDigits: 2 })} NEX
              </span>{' '}
              yearly ({((calculations.compoundedYearly / (parseFloat(amount) || 1)) * 100).toFixed(1)}% APY)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StakingCalculator;