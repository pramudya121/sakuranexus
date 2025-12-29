import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioChartProps {
  totalValue: number;
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y';

const generateMockData = (range: TimeRange, currentValue: number) => {
  const points: { date: string; value: number }[] = [];
  let numPoints: number;
  let dateFormat: (d: Date) => string;
  
  switch (range) {
    case '24h':
      numPoints = 24;
      dateFormat = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      break;
    case '7d':
      numPoints = 7;
      dateFormat = (d) => d.toLocaleDateString([], { weekday: 'short' });
      break;
    case '30d':
      numPoints = 30;
      dateFormat = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      break;
    case '90d':
      numPoints = 12;
      dateFormat = (d) => d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      break;
    case '1y':
      numPoints = 12;
      dateFormat = (d) => d.toLocaleDateString([], { month: 'short' });
      break;
  }

  const volatility = range === '24h' ? 0.02 : range === '7d' ? 0.05 : 0.1;
  let value = currentValue * (1 - volatility * numPoints * 0.3);

  for (let i = 0; i < numPoints; i++) {
    const date = new Date();
    
    switch (range) {
      case '24h':
        date.setHours(date.getHours() - (numPoints - i - 1));
        break;
      case '7d':
        date.setDate(date.getDate() - (numPoints - i - 1));
        break;
      case '30d':
        date.setDate(date.getDate() - (numPoints - i - 1));
        break;
      case '90d':
        date.setDate(date.getDate() - (numPoints - i - 1) * 7.5);
        break;
      case '1y':
        date.setMonth(date.getMonth() - (numPoints - i - 1));
        break;
    }

    // Add some randomness with overall upward trend
    const change = (Math.random() - 0.4) * volatility * currentValue;
    value = Math.max(0, value + change);
    
    // Ensure last point is current value
    if (i === numPoints - 1) {
      value = currentValue;
    }

    points.push({
      date: dateFormat(date),
      value: Math.round(value * 100) / 100
    });
  }

  return points;
};

const PortfolioChart = ({ totalValue }: PortfolioChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  
  const chartData = useMemo(() => generateMockData(timeRange, totalValue), [timeRange, totalValue]);
  
  const startValue = chartData[0]?.value || 0;
  const endValue = chartData[chartData.length - 1]?.value || 0;
  const change = endValue - startValue;
  const changePercent = startValue > 0 ? ((change / startValue) * 100) : 0;
  const isPositive = change >= 0;

  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{payload[0].payload.date}</p>
          <p className="text-lg font-bold">${payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Portfolio Value Over Time</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
              <span className="text-sm text-muted-foreground">
                past {timeRange}
              </span>
            </div>
          </div>
          <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
            {timeRanges.map(({ label, value }) => (
              <Button
                key={value}
                variant={timeRange === value ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setTimeRange(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} 
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PortfolioChart;
