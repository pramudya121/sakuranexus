import { useState, useMemo, useRef } from 'react';
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
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity, Layers, Expand, Settings2 } from 'lucide-react';
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

const indicators = ['MA', 'EMA', 'BB', 'VOL'] as const;
type Indicator = typeof indicators[number];

// Generate stable OHLC data using seed
const generateMockOHLCData = (range: TimeRange, seed: number): OHLCData[] => {
  const data: OHLCData[] = [];
  const now = Date.now();
  let points = 24;
  let interval = 60 * 60 * 1000;

  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  switch (range) {
    case '1H':
      points = 60;
      interval = 60 * 1000;
      break;
    case '4H':
      points = 48;
      interval = 5 * 60 * 1000;
      break;
    case '1D':
      points = 24;
      interval = 60 * 60 * 1000;
      break;
    case '1W':
      points = 7 * 24;
      interval = 60 * 60 * 1000;
      break;
    case '1M':
      points = 30;
      interval = 24 * 60 * 60 * 1000;
      break;
  }

  let basePrice = 0.85 + seededRandom(seed) * 0.3;
  
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - i * interval;
    const volatility = 0.02;
    const change = (seededRandom(seed + i) - 0.5) * volatility;
    
    const open = basePrice;
    const close = basePrice * (1 + change);
    const high = Math.max(open, close) * (1 + seededRandom(seed + i + 100) * 0.01);
    const low = Math.min(open, close) * (1 - seededRandom(seed + i + 200) * 0.01);
    const volume = 10000 + seededRandom(seed + i + 300) * 50000;

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
const calculateBB = (data: OHLCData[], period: number = 20, stdDev: number = 2) => {
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
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(['MA', 'VOL']));
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('area');
  const seedRef = useRef(12345);

  const data = useMemo(() => generateMockOHLCData(timeRange, seedRef.current), [timeRange]);

  const chartData = useMemo(() => {
    const ma7 = calculateMA(data, 7);
    const ma25 = calculateMA(data, 25);
    const ema12 = calculateEMA(data, 12);
    const bb = calculateBB(data, 20);

    return data.map((d, i) => ({
      ...d,
      candleBody: [d.open, d.close],
      candleWick: [d.low, d.high],
      color: d.close >= d.open ? 'hsl(142 76% 36%)' : 'hsl(0 84% 60%)',
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
  const totalVolume = data.reduce((acc, d) => acc + d.volume, 0);

  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardHeader className="pb-2 space-y-3">
        {/* Top Row - Title & Price */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {tokenIn.symbol}/{tokenOut.symbol}
                <Badge variant="outline" className="text-[10px] font-normal">
                  SPOT
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-bold">{latestPrice.toFixed(4)}</span>
                <Badge 
                  className={`flex items-center gap-1 ${
                    isPositive 
                      ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{priceChangePercent}%
                </Badge>
              </div>
            </div>
          </div>
          
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
              <Button
                size="sm"
                variant={chartType === 'area' ? 'default' : 'ghost'}
                onClick={() => setChartType('area')}
                className="h-7 px-2"
              >
                <Activity className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={chartType === 'line' ? 'default' : 'ghost'}
                onClick={() => setChartType('line')}
                className="h-7 px-2"
              >
                <TrendingUp className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant={chartType === 'candle' ? 'default' : 'ghost'}
                onClick={() => setChartType('candle')}
                className="h-7 px-2"
              >
                <Layers className="w-3 h-3" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Settings2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Expand className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
            {timeRanges.map(range => (
              <Button
                key={range}
                size="sm"
                variant={timeRange === range ? 'default' : 'ghost'}
                onClick={() => setTimeRange(range)}
                className="h-6 px-3 text-xs"
              >
                {range}
              </Button>
            ))}
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Indicators */}
          <div className="flex items-center gap-1">
            {indicators.map(indicator => (
              <Button
                key={indicator}
                size="sm"
                variant={activeIndicators.has(indicator) ? 'secondary' : 'ghost'}
                onClick={() => toggleIndicator(indicator)}
                className={`h-6 px-2 text-xs ${
                  activeIndicators.has(indicator) ? 'bg-primary/20 text-primary border border-primary/30' : ''
                }`}
              >
                {indicator}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {/* Main Price Chart */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  name="Price"
                />
                {activeIndicators.has('MA') && (
                  <>
                    <Line type="monotone" dataKey="ma7" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MA7" />
                    <Line type="monotone" dataKey="ma25" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="MA25" />
                  </>
                )}
                {activeIndicators.has('EMA') && (
                  <Line type="monotone" dataKey="ema12" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="EMA12" />
                )}
                {activeIndicators.has('BB') && (
                  <>
                    <Line type="monotone" dataKey="bbUpper" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="bbLower" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                  </>
                )}
              </AreaChart>
            ) : (
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
                />
                
                {chartType === 'line' && (
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    name="Price"
                  />
                )}
                
                {chartType === 'candle' && (
                  <Bar
                    dataKey="close"
                    barSize={8}
                    shape={(props: any) => {
                      const { x, y, width, payload } = props;
                      const { open, close, high, low, color } = payload;
                      const priceScale = (maxPrice - minPrice) / 280;
                      const bodyTop = Math.min(open, close);
                      const bodyBottom = Math.max(open, close);
                      const bodyHeight = Math.max(2, (bodyBottom - bodyTop) / priceScale);
                      const bodyY = 280 - ((bodyBottom - minPrice) / priceScale);
                      const wickTop = 280 - ((high - minPrice) / priceScale);
                      const wickBottom = 280 - ((low - minPrice) / priceScale);
                      
                      return (
                        <g>
                          {/* Wick */}
                          <line
                            x1={x + width / 2}
                            y1={wickTop}
                            x2={x + width / 2}
                            y2={wickBottom}
                            stroke={color}
                            strokeWidth={1}
                          />
                          {/* Body */}
                          <rect
                            x={x}
                            y={bodyY}
                            width={width}
                            height={bodyHeight}
                            fill={color}
                            rx={1}
                          />
                        </g>
                      );
                    }}
                  />
                )}

                {activeIndicators.has('MA') && (
                  <>
                    <Line type="monotone" dataKey="ma7" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="MA7" />
                    <Line type="monotone" dataKey="ma25" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="MA25" />
                  </>
                )}
                {activeIndicators.has('EMA') && (
                  <Line type="monotone" dataKey="ema12" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="EMA12" />
                )}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        {activeIndicators.has('VOL') && (
          <div className="h-[60px] w-full">
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
                  opacity={0.4}
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">24h High</p>
            <p className="text-sm font-bold text-green-500">{maxPrice.toFixed(4)}</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">24h Low</p>
            <p className="text-sm font-bold text-red-500">{minPrice.toFixed(4)}</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">24h Volume</p>
            <p className="text-sm font-bold">${(totalVolume / 1000).toFixed(1)}K</p>
          </div>
          <div className="text-center p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Change</p>
            <p className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(4)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingChart;