import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity, Layers } from 'lucide-react';
import { Token } from '@/lib/web3/dex-config';

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingChartProps {
  tokenIn: Token;
  tokenOut: Token;
}

const timeRanges = ['1H', '4H', '1D', '1W', '1M'] as const;
type TimeRange = typeof timeRanges[number];

const indicators = ['MA', 'EMA', 'BB'] as const;
type Indicator = typeof indicators[number];

// Generate mock OHLC data
const generateMockOHLCData = (range: TimeRange): OHLCData[] => {
  const data: OHLCData[] = [];
  const now = Date.now();
  let points = 24;
  let interval = 60 * 60 * 1000; // 1 hour in ms

  switch (range) {
    case '1H':
      points = 60;
      interval = 60 * 1000; // 1 minute
      break;
    case '4H':
      points = 48;
      interval = 5 * 60 * 1000; // 5 minutes
      break;
    case '1D':
      points = 24;
      interval = 60 * 60 * 1000; // 1 hour
      break;
    case '1W':
      points = 7 * 24;
      interval = 60 * 60 * 1000; // 1 hour
      break;
    case '1M':
      points = 30;
      interval = 24 * 60 * 60 * 1000; // 1 day
      break;
  }

  let basePrice = 0.85 + Math.random() * 0.3;
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - i * interval;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    
    const open = basePrice;
    const close = basePrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = 10000 + Math.random() * 50000;

    const date = new Date(timestamp);
    let timeStr = '';
    
    if (range === '1M') {
      timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (range === '1W' || range === '1D') {
      timeStr = date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
    } else {
      timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    data.push({
      time: timeStr,
      open: Number(open.toFixed(4)),
      high: Number(high.toFixed(4)),
      low: Number(low.toFixed(4)),
      close: Number(close.toFixed(4)),
      volume: Math.round(volume),
    });

    basePrice = close;
  }

  return data;
};

// Calculate Moving Average
const calculateMA = (data: OHLCData[], period: number): (number | null)[] => {
  return data.map((_, index) => {
    if (index < period - 1) return null;
    const sum = data.slice(index - period + 1, index + 1).reduce((acc, d) => acc + d.close, 0);
    return Number((sum / period).toFixed(4));
  });
};

// Calculate EMA
const calculateEMA = (data: OHLCData[], period: number): (number | null)[] => {
  const multiplier = 2 / (period + 1);
  const ema: (number | null)[] = [];
  
  data.forEach((d, index) => {
    if (index < period - 1) {
      ema.push(null);
    } else if (index === period - 1) {
      const sum = data.slice(0, period).reduce((acc, item) => acc + item.close, 0);
      ema.push(Number((sum / period).toFixed(4)));
    } else {
      const prevEma = ema[index - 1] as number;
      ema.push(Number((d.close * multiplier + prevEma * (1 - multiplier)).toFixed(4)));
    }
  });
  
  return ema;
};

// Calculate Bollinger Bands
const calculateBB = (data: OHLCData[], period: number = 20, stdDev: number = 2): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } => {
  const ma = calculateMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  data.forEach((_, index) => {
    if (ma[index] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(Math.max(0, index - period + 1), index + 1);
      const mean = ma[index] as number;
      const squaredDiffs = slice.map(d => Math.pow(d.close - mean, 2));
      const variance = squaredDiffs.reduce((acc, d) => acc + d, 0) / slice.length;
      const std = Math.sqrt(variance);
      upper.push(Number((mean + stdDev * std).toFixed(4)));
      lower.push(Number((mean - stdDev * std).toFixed(4)));
    }
  });
  
  return { upper, middle: ma, lower };
};

const TradingChart = ({ tokenIn, tokenOut }: TradingChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(['MA']));
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');

  const data = useMemo(() => generateMockOHLCData(timeRange), [timeRange]);

  const chartData = useMemo(() => {
    const ma7 = calculateMA(data, 7);
    const ma25 = calculateMA(data, 25);
    const ema12 = calculateEMA(data, 12);
    const bb = calculateBB(data, 20);

    return data.map((d, i) => ({
      ...d,
      // Candlestick data
      candleBody: [d.open, d.close],
      candleWick: [d.low, d.high],
      color: d.close >= d.open ? '#22c55e' : '#ef4444',
      // Indicators
      ma7: activeIndicators.has('MA') ? ma7[i] : null,
      ma25: activeIndicators.has('MA') ? ma25[i] : null,
      ema12: activeIndicators.has('EMA') ? ema12[i] : null,
      bbUpper: activeIndicators.has('BB') ? bb.upper[i] : null,
      bbMiddle: activeIndicators.has('BB') ? bb.middle[i] : null,
      bbLower: activeIndicators.has('BB') ? bb.lower[i] : null,
    }));
  }, [data, activeIndicators]);

  const toggleIndicator = (indicator: Indicator) => {
    setActiveIndicators(prev => {
      const newSet = new Set(prev);
      if (newSet.has(indicator)) {
        newSet.delete(indicator);
      } else {
        newSet.add(indicator);
      }
      return newSet;
    });
  };

  const latestPrice = data[data.length - 1]?.close || 0;
  const firstPrice = data[0]?.close || 0;
  const priceChange = latestPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  const minPrice = Math.min(...data.map(d => d.low)) * 0.995;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.005;

  return (
    <Card className="glass border border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-lg">
                {tokenIn.symbol}/{tokenOut.symbol}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{latestPrice.toFixed(4)}</span>
              <Badge 
                variant={isPositive ? 'default' : 'destructive'}
                className={`flex items-center gap-1 ${isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{priceChangePercent}%
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              <Button
                size="sm"
                variant={chartType === 'candle' ? 'default' : 'ghost'}
                onClick={() => setChartType('candle')}
                className="h-7 px-2"
              >
                <Layers className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={chartType === 'line' ? 'default' : 'ghost'}
                onClick={() => setChartType('line')}
                className="h-7 px-2"
              >
                <Activity className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Time Range & Indicators */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {/* Time Range */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
            {timeRanges.map(range => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? 'default' : 'ghost'}
                onClick={() => setTimeRange(range)}
                className="h-7 px-3 text-xs"
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-1">
            {indicators.map(indicator => (
              <Button
                key={indicator}
                size="sm"
                variant={activeIndicators.has(indicator) ? 'secondary' : 'ghost'}
                onClick={() => toggleIndicator(indicator)}
                className={`h-7 px-2 text-xs ${activeIndicators.has(indicator) ? 'bg-primary/20 text-primary' : ''}`}
              >
                {indicator}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Price Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[minPrice, maxPrice]}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.toFixed(3)}
                orientation="right"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => {
                  if (name === 'volume') return [`$${value.toLocaleString()}`, 'Volume'];
                  return [value?.toFixed(4), name];
                }}
              />
              
              {/* Bollinger Bands Area */}
              {activeIndicators.has('BB') && (
                <Area
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="transparent"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.05}
                />
              )}

              {/* Price Line or Candlestick */}
              {chartType === 'line' ? (
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Price"
                />
              ) : (
                <>
                  {/* Candlestick Wicks */}
                  {chartData.map((entry, index) => (
                    <ReferenceLine
                      key={`wick-${index}`}
                      segment={[
                        { x: entry.time, y: entry.low },
                        { x: entry.time, y: entry.high },
                      ]}
                      stroke={entry.color}
                      strokeWidth={1}
                    />
                  ))}
                  {/* Candlestick Bodies as Bar */}
                  <Bar
                    dataKey="close"
                    fill="hsl(var(--primary))"
                    barSize={6}
                    shape={(props: any) => {
                      const { x, y, width, payload } = props;
                      const { open, close, color } = payload;
                      const bodyY = Math.min(open, close);
                      const bodyHeight = Math.abs(close - open);
                      const scale = (maxPrice - minPrice) / 300; // Approximate scale
                      const scaledY = 300 - ((close - minPrice) / scale);
                      const scaledHeight = Math.max(2, bodyHeight / scale);
                      
                      return (
                        <rect
                          x={x - 3}
                          y={y - scaledHeight / 2}
                          width={6}
                          height={Math.max(2, scaledHeight)}
                          fill={color}
                          rx={1}
                        />
                      );
                    }}
                  />
                </>
              )}

              {/* MA Lines */}
              {activeIndicators.has('MA') && (
                <>
                  <Line type="monotone" dataKey="ma7" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MA7" />
                  <Line type="monotone" dataKey="ma25" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="MA25" />
                </>
              )}

              {/* EMA Line */}
              {activeIndicators.has('EMA') && (
                <Line type="monotone" dataKey="ema12" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="EMA12" />
              )}

              {/* Bollinger Bands */}
              {activeIndicators.has('BB') && (
                <>
                  <Line type="monotone" dataKey="bbUpper" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="BB Upper" />
                  <Line type="monotone" dataKey="bbMiddle" stroke="#64748b" strokeWidth={1} dot={false} name="BB Middle" />
                  <Line type="monotone" dataKey="bbLower" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="BB Lower" />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        <div className="h-[80px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
              />
              <Bar 
                dataKey="volume" 
                fill="hsl(var(--primary))"
                opacity={0.5}
                radius={[2, 2, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">24h High</p>
            <p className="text-sm font-semibold text-green-500">{maxPrice.toFixed(4)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">24h Low</p>
            <p className="text-sm font-semibold text-red-500">{minPrice.toFixed(4)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">24h Volume</p>
            <p className="text-sm font-semibold">${(data.reduce((acc, d) => acc + d.volume, 0) / 1000).toFixed(1)}K</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Change</p>
            <p className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(4)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingChart;
