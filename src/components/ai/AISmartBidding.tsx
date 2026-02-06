import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, Gavel, Target, Clock, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AISmartBiddingProps {
  nft: {
    name: string;
    token_id: number;
  };
  currentBid?: number;
  timeRemaining?: string;
  bidHistory?: Array<{ bidder: string; amount: number; timestamp: string }>;
  floorPrice?: number;
}

const AISmartBidding = ({ nft, currentBid, timeRemaining, bidHistory, floorPrice }: AISmartBiddingProps) => {
  const [bidData, setBidData] = useState<any>(null);
  const [userBudget, setUserBudget] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { getSmartBid } = useAIFeatures();

  const analyzeBidding = async () => {
    setIsAnalyzing(true);
    const result = await getSmartBid(
      { name: nft.name, tokenId: nft.token_id, budget: userBudget },
      { currentBid, timeRemaining, bidHistory, floorPrice }
    );
    if (result) {
      setBidData(result);
    }
    setIsAnalyzing(false);
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'Aggressive': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'Conservative': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Wait': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gavel className="w-5 h-5 text-primary" />
          Smart Bidding Assistant
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={analyzeBidding}
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
        {/* Budget Input */}
        <div className="mb-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Your max budget (NEX)"
              value={userBudget}
              onChange={(e) => setUserBudget(e.target.value)}
              className="flex-1"
            />
            <Button onClick={analyzeBidding} disabled={isAnalyzing} size="sm">
              Analyze
            </Button>
          </div>
        </div>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Calculating optimal bid...</p>
          </div>
        ) : bidData ? (
          <div className="space-y-4">
            {/* Recommended Bid */}
            <div className="text-center p-4 rounded-lg bg-gradient-sakura-soft">
              <div className="text-sm text-muted-foreground mb-1">Recommended Bid</div>
              <div className="text-3xl font-bold text-primary">
                {bidData.recommendedBid?.toFixed(3)} NEX
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Max suggested: {bidData.maxSuggestedBid?.toFixed(3)} NEX
              </div>
            </div>

            {/* Win Probability */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Win Probability</span>
                <span className="font-medium">{bidData.winProbability}%</span>
              </div>
              <Progress value={bidData.winProbability} className="h-2" />
            </div>

            {/* Strategy */}
            <div className={`p-3 rounded-lg border ${getStrategyColor(bidData.strategy)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Strategy: {bidData.strategy}</span>
                </div>
              </div>
              {bidData.reasoning && (
                <p className="text-sm mt-2 opacity-80">{bidData.reasoning}</p>
              )}
            </div>

            {/* Optimal Bid Time */}
            {bidData.optimalBidTime && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Best time to bid: {bidData.optimalBidTime}</span>
              </div>
            )}

            {/* Anti-Snipe Alert */}
            {bidData.antiSnipeAlert && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600">Anti-snipe protection may extend auction</span>
              </div>
            )}

            {/* Competitor Analysis */}
            {bidData.competitorAnalysis && (
              <div className="p-3 rounded-lg border">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Competitor Analysis
                </h4>
                <p className="text-sm text-muted-foreground">{bidData.competitorAnalysis}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Gavel className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">
              Get AI-powered bidding suggestions
            </p>
            <p className="text-sm text-muted-foreground">
              Enter your budget above and click Analyze
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AISmartBidding;
