import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, TrendingUp, TrendingDown, Minus, DollarSign, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';

interface AIPricePredictionProps {
  nft: {
    name: string;
    token_id: number;
    price?: string;
  };
  salesHistory?: Array<{ price: number; date: string }>;
}

const trendIcons: Record<string, React.ReactNode> = {
  up: <TrendingUp className="w-4 h-4 text-green-500" />,
  down: <TrendingDown className="w-4 h-4 text-red-500" />,
  stable: <Minus className="w-4 h-4 text-yellow-500" />,
};

const sentimentColors: Record<string, string> = {
  Bullish: 'bg-green-500/10 text-green-500 border-green-500/20',
  Bearish: 'bg-red-500/10 text-red-500 border-red-500/20',
  Neutral: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
};

const AIPricePrediction = ({ nft, salesHistory }: AIPricePredictionProps) => {
  const [predictionData, setPredictionData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { predictPrice } = useAIFeatures();

  const analyzePrediction = async () => {
    setIsAnalyzing(true);
    const result = await predictPrice(
      { name: nft.name, tokenId: nft.token_id, price: nft.price },
      { salesHistory }
    );
    if (result) {
      setPredictionData(result);
    }
    setIsAnalyzing(false);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    }
    return price.toFixed(2);
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Price Prediction
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={analyzePrediction}
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
            <p className="text-sm text-muted-foreground">Analyzing market trends...</p>
          </div>
        ) : predictionData ? (
          <div className="space-y-4">
            {/* Current Valuation */}
            <div className="text-center p-4 rounded-lg bg-gradient-sakura-soft">
              <div className="text-sm text-muted-foreground mb-1">Current Valuation</div>
              <div className="text-3xl font-bold flex items-center justify-center gap-2">
                <DollarSign className="w-6 h-6" />
                {formatPrice(predictionData.currentValuation)} NEX
              </div>
            </div>

            {/* Predictions Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* 7 Days */}
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-xs text-muted-foreground mb-1">7 Days</div>
                <div className="flex items-center justify-center gap-1">
                  {trendIcons[predictionData.prediction7Days?.trend]}
                  <span className="font-bold">
                    {formatPrice(predictionData.prediction7Days?.price || 0)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {predictionData.prediction7Days?.confidence}% conf.
                </div>
              </div>

              {/* 30 Days */}
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-xs text-muted-foreground mb-1">30 Days</div>
                <div className="flex items-center justify-center gap-1">
                  {trendIcons[predictionData.prediction30Days?.trend]}
                  <span className="font-bold">
                    {formatPrice(predictionData.prediction30Days?.price || 0)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {predictionData.prediction30Days?.confidence}% conf.
                </div>
              </div>

              {/* 90 Days */}
              <div className="p-3 rounded-lg border bg-card text-center">
                <div className="text-xs text-muted-foreground mb-1">90 Days</div>
                <div className="flex items-center justify-center gap-1">
                  {trendIcons[predictionData.prediction90Days?.trend]}
                  <span className="font-bold">
                    {formatPrice(predictionData.prediction90Days?.price || 0)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {predictionData.prediction90Days?.confidence}% conf.
                </div>
              </div>
            </div>

            {/* Market Sentiment */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Market Sentiment</span>
              <Badge className={sentimentColors[predictionData.marketSentiment] || ''}>
                {predictionData.marketSentiment}
              </Badge>
            </div>

            {/* Recommendation */}
            <div className="p-3 rounded-lg border flex items-center justify-between">
              <span className="text-sm font-medium">AI Recommendation</span>
              <Badge variant={
                predictionData.recommendations === 'buy' ? 'default' :
                predictionData.recommendations === 'sell' ? 'destructive' : 'secondary'
              } className="uppercase">
                {predictionData.recommendations === 'buy' && <ArrowUp className="w-3 h-3 mr-1" />}
                {predictionData.recommendations === 'sell' && <ArrowDown className="w-3 h-3 mr-1" />}
                {predictionData.recommendations}
              </Badge>
            </div>

            {/* Key Factors */}
            {predictionData.factors && predictionData.factors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Key Price Factors</h4>
                <div className="flex flex-wrap gap-1">
                  {predictionData.factors.slice(0, 5).map((factor: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Get AI-powered price predictions for this NFT
            </p>
            <Button onClick={analyzePrediction} className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Predict Price
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPricePrediction;
