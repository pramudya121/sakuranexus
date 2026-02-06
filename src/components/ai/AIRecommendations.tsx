import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, Lightbulb, Sparkles, TrendingUp, Zap, RefreshCw } from 'lucide-react';

interface AIRecommendationsProps {
  userAddress: string;
  userHoldings?: Array<{ token_id: number; name: string }>;
  availableNFTs?: Array<{ token_id: number; name: string; price: string; image_url: string }>;
}

const AIRecommendations = ({ userAddress, userHoldings, availableNFTs }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getRecommendations } = useAIFeatures();

  const fetchRecommendations = async () => {
    setIsLoading(true);
    const result = await getRecommendations(
      userAddress,
      { holdings: userHoldings },
      { available: availableNFTs?.slice(0, 20) }
    );
    if (result) {
      setRecommendations(result);
    }
    setIsLoading(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Similar Style': return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'Trending': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'Undervalued': return <Zap className="w-4 h-4 text-yellow-500" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Smart Recommendations
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={fetchRecommendations}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Analyzing your preferences...</p>
          </div>
        ) : recommendations ? (
          <div className="space-y-4">
            {/* Recommendations List */}
            {recommendations.recommendations && recommendations.recommendations.length > 0 && (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {recommendations.recommendations.map((rec: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(rec.category)}
                          <span className="font-medium">NFT #{rec.tokenId}</span>
                        </div>
                        <Badge variant="outline">{rec.matchScore}% Match</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                      <Badge className="mt-2" variant="secondary">
                        {rec.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Trending Categories */}
            {recommendations.trendingCategories && recommendations.trendingCategories.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Categories You Might Like</h4>
                <div className="flex flex-wrap gap-1">
                  {recommendations.trendingCategories.map((cat: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Investment Suggestions */}
            {recommendations.investmentSuggestions && recommendations.investmentSuggestions.length > 0 && (
              <div className="p-3 rounded-lg bg-gradient-sakura-soft">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Investment Opportunities
                </h4>
                <ul className="space-y-1">
                  {recommendations.investmentSuggestions.slice(0, 3).map((sug: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">• {sug}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Get personalized NFT recommendations based on your collection
            </p>
            <Button onClick={fetchRecommendations} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Get Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;
