import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, Waves, AlertTriangle, ShieldCheck, RefreshCw, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AIWashTradingProps {
  nft: {
    name: string;
    token_id: number;
  };
  transactions?: Array<{ from: string; to: string; price: number; timestamp: string }>;
}

const AIWashTradingDetection = ({ nft, transactions }: AIWashTradingProps) => {
  const [detectionData, setDetectionData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { detectWashTrading } = useAIFeatures();

  const analyzeWashTrading = async () => {
    setIsAnalyzing(true);
    const result = await detectWashTrading(
      { name: nft.name, tokenId: nft.token_id },
      { transactions, uniqueAddresses: new Set(transactions?.map(t => t.from)).size }
    );
    if (result) {
      setDetectionData(result);
    }
    setIsAnalyzing(false);
  };

  const getRiskColorClass = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'Critical': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Wash Trading Detection
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={analyzeWashTrading}
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
            <p className="text-sm text-muted-foreground">Analyzing trading patterns...</p>
          </div>
        ) : detectionData ? (
          <div className="space-y-4">
            {/* Risk Level */}
            <div className={`p-4 rounded-lg border ${getRiskColorClass(detectionData.riskLevel)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {detectionData.riskLevel === 'Low' ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                  <span className="font-semibold">{detectionData.riskLevel} Risk</span>
                </div>
                <span className="text-2xl font-bold">{detectionData.washTradingRisk}%</span>
              </div>
              <Progress value={detectionData.washTradingRisk} className="h-2" />
            </div>

            {/* Volume Inflation */}
            {detectionData.volumeInflation !== undefined && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Estimated Fake Volume</span>
                <Badge variant="outline">{detectionData.volumeInflation}%</Badge>
              </div>
            )}

            {/* Suspicious Patterns */}
            {detectionData.suspiciousPatterns && detectionData.suspiciousPatterns.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Detected Patterns</h4>
                <ul className="space-y-1">
                  {detectionData.suspiciousPatterns.map((pattern: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 mt-1 text-orange-500 shrink-0" />
                      {pattern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Flagged Addresses */}
            {detectionData.flaggedAddresses && detectionData.flaggedAddresses.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Flagged Addresses</h4>
                <div className="flex flex-wrap gap-1">
                  {detectionData.flaggedAddresses.map((addr: string, i: number) => (
                    <Badge key={i} variant="destructive" className="text-xs font-mono">
                      {addr.slice(0, 6)}...{addr.slice(-4)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            {detectionData.recommendation && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="text-muted-foreground">{detectionData.recommendation}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Waves className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Detect potential wash trading and market manipulation
            </p>
            <Button onClick={analyzeWashTrading} className="gap-2">
              <Activity className="w-4 h-4" />
              Analyze Trading
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIWashTradingDetection;
