import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, MessageSquare, TrendingUp, TrendingDown, Minus, RefreshCw, Twitter, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AISentimentAnalysisProps {
  nftOrCollection: {
    name: string;
  };
  socialData?: {
    news?: string[];
    socialMentions?: string[];
  };
}

const AISentimentAnalysis = ({ nftOrCollection, socialData }: AISentimentAnalysisProps) => {
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { analyzeSentiment } = useAIFeatures();

  const analyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSentiment(
      { name: nftOrCollection.name },
      socialData
    );
    if (result) {
      setSentimentData(result);
    }
    setIsAnalyzing(false);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Very Bullish': return 'bg-green-600 text-white';
      case 'Bullish': return 'bg-green-500/20 text-green-600';
      case 'Neutral': return 'bg-yellow-500/20 text-yellow-600';
      case 'Bearish': return 'bg-red-500/20 text-red-600';
      case 'Very Bearish': return 'bg-red-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment?.includes('Bullish')) return <TrendingUp className="w-4 h-4" />;
    if (sentiment?.includes('Bearish')) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  // Normalize sentiment score from -100 to 100 to 0 to 100 for progress bar
  const normalizedScore = sentimentData?.sentimentScore ? 
    ((sentimentData.sentimentScore + 100) / 2) : 50;

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Sentiment Analysis
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={analyze}
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
            <p className="text-sm text-muted-foreground">Analyzing social sentiment...</p>
          </div>
        ) : sentimentData ? (
          <div className="space-y-4">
            {/* Overall Sentiment */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Badge className={`text-lg px-4 py-1 ${getSentimentColor(sentimentData.overallSentiment)}`}>
                {getSentimentIcon(sentimentData.overallSentiment)}
                <span className="ml-2">{sentimentData.overallSentiment}</span>
              </Badge>
              <div className="mt-3">
                <div className="text-2xl font-bold">
                  {sentimentData.sentimentScore > 0 ? '+' : ''}{sentimentData.sentimentScore}
                </div>
                <div className="text-sm text-muted-foreground">Sentiment Score</div>
              </div>
              <div className="mt-2 relative">
                <Progress value={normalizedScore} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Bearish</span>
                  <span>Neutral</span>
                  <span>Bullish</span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border text-center">
                <Twitter className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                <div className="text-lg font-bold">{sentimentData.socialBuzz || 0}</div>
                <div className="text-xs text-muted-foreground">Social Buzz</div>
              </div>
              <div className="p-3 rounded-lg border text-center">
                <Users className="w-4 h-4 mx-auto text-purple-500 mb-1" />
                <div className="text-lg font-bold">{sentimentData.influencerMentions || 0}</div>
                <div className="text-xs text-muted-foreground">Influencer Mentions</div>
              </div>
            </div>

            {/* Community Growth */}
            {sentimentData.communityGrowth !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Community Growth</span>
                <Badge variant={sentimentData.communityGrowth > 0 ? 'default' : 'destructive'}>
                  {sentimentData.communityGrowth > 0 ? '+' : ''}{sentimentData.communityGrowth}%
                </Badge>
              </div>
            )}

            {/* Key Topics */}
            {sentimentData.keyTopics && sentimentData.keyTopics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Trending Topics</h4>
                <div className="flex flex-wrap gap-1">
                  {sentimentData.keyTopics.map((topic: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      #{topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors & Opportunities */}
            <div className="grid grid-cols-2 gap-3">
              {sentimentData.riskFactors && sentimentData.riskFactors.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <h4 className="text-sm font-medium text-red-600 mb-2">Risk Factors</h4>
                  <ul className="space-y-1">
                    {sentimentData.riskFactors.slice(0, 3).map((risk: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
              {sentimentData.opportunities && sentimentData.opportunities.length > 0 && (
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h4 className="text-sm font-medium text-green-600 mb-2">Opportunities</h4>
                  <ul className="space-y-1">
                    {sentimentData.opportunities.slice(0, 3).map((opp: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {opp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Analyze social media and market sentiment
            </p>
            <Button onClick={analyze} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Analyze Sentiment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AISentimentAnalysis;
