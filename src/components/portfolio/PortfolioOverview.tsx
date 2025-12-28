import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wallet, Droplets, Coins, PieChart } from 'lucide-react';

interface PortfolioOverviewProps {
  tokenValue: number;
  lpValue: number;
  stakingValue: number;
}

const PortfolioOverview = ({ tokenValue, lpValue, stakingValue }: PortfolioOverviewProps) => {
  const total = tokenValue + lpValue + stakingValue;
  
  const tokenPercent = total > 0 ? (tokenValue / total) * 100 : 0;
  const lpPercent = total > 0 ? (lpValue / total) * 100 : 0;
  const stakingPercent = total > 0 ? (stakingValue / total) * 100 : 0;

  const items = [
    {
      label: 'Tokens',
      value: tokenValue,
      percent: tokenPercent,
      icon: Wallet,
      color: 'bg-primary',
      textColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Liquidity',
      value: lpValue,
      percent: lpPercent,
      icon: Droplets,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Staking',
      value: stakingValue,
      percent: stakingPercent,
      icon: Coins,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <Card className="glass border-border/50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Portfolio Allocation</h3>
        </div>

        {/* Progress bar showing allocation */}
        <div className="h-3 rounded-full bg-secondary/50 overflow-hidden flex mb-4">
          {items.map((item, index) => (
            item.percent > 0 && (
              <div
                key={index}
                className={`${item.color} h-full transition-all duration-500`}
                style={{ width: `${item.percent}%` }}
              />
            )
          ))}
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          {items.map((item, index) => (
            <div key={index} className={`rounded-lg p-3 ${item.bgColor}`}>
              <div className="flex items-center gap-2 mb-2">
                <item.icon className={`w-4 h-4 ${item.textColor}`} />
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              </div>
              <p className="font-bold">
                ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-xs ${item.textColor}`}>{item.percent.toFixed(1)}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioOverview;
