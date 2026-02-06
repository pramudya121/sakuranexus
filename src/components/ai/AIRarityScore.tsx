import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, Star, Gem, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

interface AIRarityScoreProps {
  nft: {
    name: string;
    description?: string;
    image_url: string;
    token_id: number;
  };
  compact?: boolean;
}

const rarityColors: Record<string, string> = {
  Common: 'bg-gray-500',
  Uncommon: 'bg-green-500',
  Rare: 'bg-blue-500',
  Epic: 'bg-purple-500',
  Legendary: 'bg-orange-500',
  Mythic: 'bg-gradient-to-r from-pink-500 to-purple-500',
};

const AIRarityScore = ({ nft, compact = false }: AIRarityScoreProps) => {
  const [rarityData, setRarityData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { getRarityScore } = useAIFeatures();

  const analyzeRarity = async () => {
    setIsAnalyzing(true);
    const result = await getRarityScore(
      { name: nft.name, description: nft.description },
      nft.image_url
    );
    if (result) {
      setRarityData(result);
    }
    setIsAnalyzing(false);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {rarityData ? (
          <>
            <Badge className={`${rarityColors[rarityData.rarityTier] || 'bg-gray-500'} text-white`}>
              {rarityData.rarityTier}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Score: {rarityData.rarityScore}/100
            </span>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={analyzeRarity} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Star className="w-3 h-3 mr-1" />
            )}
            Analyze Rarity
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gem className="w-5 h-5 text-primary" />
          AI Rarity Analysis
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={analyzeRarity}
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
            <p className="text-sm text-muted-foreground">Analyzing rarity...</p>
          </div>
        ) : rarityData ? (
          <div className="space-y-4">
            {/* Rarity Score */}
            <div className="text-center">
              <Badge className={`${rarityColors[rarityData.rarityTier] || 'bg-gray-500'} text-white text-lg px-4 py-1`}>
                {rarityData.rarityTier}
              </Badge>
              <div className="mt-3">
                <div className="text-3xl font-bold">{rarityData.rarityScore}</div>
                <div className="text-sm text-muted-foreground">Rarity Score</div>
              </div>
              <Progress value={rarityData.rarityScore} className="mt-2" />
            </div>

            {/* Unique Traits */}
            {rarityData.uniqueTraits && rarityData.uniqueTraits.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Unique Traits</h4>
                <div className="flex flex-wrap gap-1">
                  {rarityData.uniqueTraits.map((trait: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Value */}
            {rarityData.estimatedValue && (
              <div className="p-3 rounded-lg bg-gradient-sakura-soft">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Estimated Value</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Low: {rarityData.estimatedValue.low} NEX</span>
                  <span className="font-bold">Mid: {rarityData.estimatedValue.mid} NEX</span>
                  <span>High: {rarityData.estimatedValue.high} NEX</span>
                </div>
              </div>
            )}

            {/* Confidence */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Analysis Confidence</span>
              <Badge variant="outline">{rarityData.confidence}%</Badge>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Get AI-powered rarity analysis for this NFT
            </p>
            <Button onClick={analyzeRarity} className="gap-2">
              <Gem className="w-4 h-4" />
              Analyze Rarity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRarityScore;
