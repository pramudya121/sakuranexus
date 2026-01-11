import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PoolMiniChartProps {
  pairName: string;
  currentPrice: number;
  priceChange: number;
}

// Generate mock price data
const generatePriceData = (basePrice: number, seed: number) => {
  const data = [];
  let price = basePrice * 0.85;
  
  for (let i = 0; i < 40; i++) {
    const random = Math.sin(seed + i * 0.5) * 0.3 + Math.cos(seed * 2 + i) * 0.2;
    price = price * (1 + random * 0.015);
    data.push({
      time: i,
      price: price,
    });
  }
  // Ensure last price matches current price
  data[data.length - 1].price = basePrice;
  return data;
};

const PoolMiniChart = memo(({ pairName, currentPrice, priceChange }: PoolMiniChartProps) => {
  const isPositive = priceChange >= 0;
  const seed = pairName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  
  const priceData = useMemo(() => generatePriceData(currentPrice, seed), [currentPrice, seed]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border/50 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-sm font-medium">${payload[0].value.toFixed(6)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold">{pairName}</CardTitle>
          <Badge 
            variant="secondary"
            className={`text-xs ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
          </Badge>
        </div>
        <div className="text-2xl font-bold text-green-400 mt-1">
          {currentPrice.toFixed(6)}
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.4}/>
                  <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? '#22c55e' : '#ef4444'} 
                strokeWidth={2}
                fill="url(#chartGradient)"
                dot={false}
                activeDot={{ r: 4, stroke: isPositive ? '#22c55e' : '#ef4444', strokeWidth: 2, fill: 'var(--background)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
});

PoolMiniChart.displayName = 'PoolMiniChart';

export default PoolMiniChart;
