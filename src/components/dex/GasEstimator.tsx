import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fuel, Zap, Clock, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ethers } from 'ethers';

interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
}

interface GasEstimatorProps {
  onGasPriceSelect?: (gasPrice: string, type: string) => void;
  compact?: boolean;
}

const GasEstimator = ({ onGasPriceSelect, compact = false }: GasEstimatorProps) => {
  const [gasPrices, setGasPrices] = useState<GasPrice>({
    slow: '0',
    standard: '0',
    fast: '0',
    instant: '0',
  });
  const [selectedType, setSelectedType] = useState<string>('standard');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  const fetchGasPrices = async () => {
    setIsLoading(true);
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || 0n;
        
        // Calculate different gas price tiers
        const baseGwei = Number(ethers.formatUnits(gasPrice, 'gwei'));
        
        const newPrices = {
          slow: (baseGwei * 0.8).toFixed(2),
          standard: baseGwei.toFixed(2),
          fast: (baseGwei * 1.2).toFixed(2),
          instant: (baseGwei * 1.5).toFixed(2),
        };

        // Determine trend
        const prevStandard = parseFloat(gasPrices.standard);
        if (prevStandard > 0) {
          if (baseGwei > prevStandard * 1.05) setTrend('up');
          else if (baseGwei < prevStandard * 0.95) setTrend('down');
          else setTrend('stable');
        }

        setGasPrices(newPrices);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching gas prices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(fetchGasPrices, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (type: string, price: string) => {
    setSelectedType(type);
    onGasPriceSelect?.(price, type);
  };

  const gasOptions = [
    { key: 'slow', label: 'Slow', time: '~5 min', icon: Clock, color: 'text-blue-500' },
    { key: 'standard', label: 'Standard', time: '~3 min', icon: Zap, color: 'text-green-500' },
    { key: 'fast', label: 'Fast', time: '~1 min', icon: Fuel, color: 'text-orange-500' },
    { key: 'instant', label: 'Instant', time: '~15 sec', icon: Zap, color: 'text-red-500' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Fuel className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">Gas:</span>
        <Badge variant="secondary" className="font-mono">
          {isLoading ? '...' : `${gasPrices.standard} Gwei`}
        </Badge>
        {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-500" />}
        {trend === 'down' && <TrendingDown className="w-3 h-3 text-green-500" />}
      </div>
    );
  }

  return (
    <Card className="p-4 glass border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-sakura">
            <Fuel className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold">Gas Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
          {trend === 'up' && (
            <Badge variant="secondary" className="bg-red-500/10 text-red-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              Rising
            </Badge>
          )}
          {trend === 'down' && (
            <Badge variant="secondary" className="bg-green-500/10 text-green-500">
              <TrendingDown className="w-3 h-3 mr-1" />
              Falling
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchGasPrices}
            className="h-8 w-8"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {gasOptions.map((option) => {
          const Icon = option.icon;
          const price = gasPrices[option.key as keyof GasPrice];
          const isSelected = selectedType === option.key;
          
          return (
            <button
              key={option.key}
              onClick={() => handleSelect(option.key, price)}
              className={`p-3 rounded-lg border text-left transition-all ${
                isSelected 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border/50 hover:border-primary/50 hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${option.color}`} />
                <span className="text-sm font-medium">{option.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold font-mono">
                  {isLoading ? '...' : price}
                </span>
                <span className="text-xs text-muted-foreground">Gwei</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {option.time}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-muted-foreground text-center">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </Card>
  );
};

export default GasEstimator;
