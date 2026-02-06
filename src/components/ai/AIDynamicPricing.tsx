import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, DollarSign, TrendingUp, Clock, Target, RefreshCw } from 'lucide-react';

interface AIDynamicPricingProps {
  nft: {
    name: string;
    token_id: number;
    currentPrice?: string;
    rarityScore?: number;
    daysListed?: number;
  };
  similarSales?: Array<{ price: number; date: string }>;
  onPriceSuggested?: (price: number) => void;
}

const AIDynamicPricing = ({ nft, similarSales, onPriceSuggested }: AIDynamicPricingProps) => {
  const [pricingData, setPricingData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { getDynamicPricing } = useAIFeatures();

  const analyzePricing = async () => {
    setIsAnalyzing(true);
    const result = await getDynamicPricing(
      { 
        name: nft.name, 
        tokenId: nft.token_id,
        currentPrice: nft.currentPrice,
        rarityScore: nft.rarityScore,
        daysListed: nft.daysListed
      },
      { similarSales }
    );
    if (result) {
      setPricingData(result);
    }
    setIsAnalyzing(false);
  };

  const handleUseSuggestedPrice = () => {
    if (pricingData?.suggestedPrice && onPriceSuggested) {
      onPriceSuggested(pricingData.suggestedPrice);
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'Premium': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'Competitive': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Value': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Fire Sale': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case 'Good': return 'text-green-600';
      case 'Average': return 'text-yellow-600';
      case 'Poor': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          Dynamic Pricing
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={analyzePricing}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Calculating optimal price...</p>
          </div>
        ) : pricingData ? (
          <div className="space-y-4">
            {/* Suggested Price */}
            <div className="text-center p-4 rounded-lg bg-gradient-sakura-soft">
              <div className="text-sm text-muted-foreground mb-1">Suggested Price</div>
              <div className="text-4xl font-bold text-primary">
                {pricingData.suggestedPrice?.toFixed(3)} NEX
              </div>
              {onPriceSuggested && (
                <Button 
                  onClick={handleUseSuggestedPrice}
                  size="sm"
                  className="mt-3"
                >
                  Use This Price
                </Button>
              )}
            </div>

            {/* Price Range */}
            {pricingData.priceRange && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold">{pricingData.priceRange.min?.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Min</div>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-lg font-bold text-primary">{pricingData.priceRange.optimal?.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Optimal</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <div className="text-lg font-bold">{pricingData.priceRange.max?.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Max</div>
                </div>
              </div>
            )}

            {/* Strategy & Timing */}
            <div className="flex gap-2">
              {pricingData.pricingStrategy && (
                <div className={`flex-1 p-3 rounded-lg border ${getStrategyColor(pricingData.pricingStrategy)}`}>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-medium">{pricingData.pricingStrategy}</span>
                  </div>
                </div>
              )}
              {pricingData.marketTiming && (
                <div className="flex-1 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${getTimingColor(pricingData.marketTiming)}`} />
                    <span className={`text-sm font-medium ${getTimingColor(pricingData.marketTiming)}`}>
                      {pricingData.marketTiming} Timing
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Expected Sale Time */}
            {pricingData.expectedSaleTime && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Expected Time to Sell</span>
                <Badge variant="outline">{pricingData.expectedSaleTime}</Badge>
              </div>
            )}

            {/* Price Adjustments */}
            {pricingData.adjustments && pricingData.adjustments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Price Factors</h4>
                <div className="space-y-1">
                  {pricingData.adjustments.slice(0, 4).map((adj: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{adj.factor}</span>
                      <span className={adj.impact > 0 ? 'text-green-600' : adj.impact < 0 ? 'text-red-600' : ''}>
                        {adj.impact > 0 ? '+' : ''}{adj.impact}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Justification */}
            {pricingData.priceJustification && (
              <div className="p-3 rounded-lg border text-sm text-muted-foreground">
                {pricingData.priceJustification}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Get AI-powered pricing suggestions
            </p>
            <Button onClick={analyzePricing} className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Calculate Price
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIDynamicPricing;
