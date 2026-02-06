import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, Shield, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, RefreshCw } from 'lucide-react';

interface AIFakeDetectionProps {
  nft: {
    name: string;
    image_url: string;
    owner_address: string;
  };
}

const riskColors: Record<string, string> = {
  Low: 'text-green-500 bg-green-500/10 border-green-500/20',
  Medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  High: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  Critical: 'text-red-500 bg-red-500/10 border-red-500/20',
};

const riskIcons: Record<string, React.ReactNode> = {
  Low: <ShieldCheck className="w-5 h-5 text-green-500" />,
  Medium: <Shield className="w-5 h-5 text-yellow-500" />,
  High: <ShieldAlert className="w-5 h-5 text-orange-500" />,
  Critical: <ShieldX className="w-5 h-5 text-red-500" />,
};

const AIFakeDetection = ({ nft }: AIFakeDetectionProps) => {
  const [detectionData, setDetectionData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { detectFakeArt } = useAIFeatures();

  const analyzeAuthenticity = async () => {
    setIsAnalyzing(true);
    const result = await detectFakeArt(
      { name: nft.name, creatorAddress: nft.owner_address },
      nft.image_url
    );
    if (result) {
      setDetectionData(result);
    }
    setIsAnalyzing(false);
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Authenticity Check
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={analyzeAuthenticity}
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
            <p className="text-sm text-muted-foreground">Checking authenticity...</p>
          </div>
        ) : detectionData ? (
          <div className="space-y-4">
            {/* Risk Level */}
            <div className={`p-4 rounded-lg border ${riskColors[detectionData.riskLevel] || ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {riskIcons[detectionData.riskLevel]}
                  <div>
                    <div className="font-semibold">{detectionData.riskLevel} Risk</div>
                    <div className="text-sm opacity-80">
                      Authenticity Score: {detectionData.authenticityScore}/100
                    </div>
                  </div>
                </div>
                <Badge variant={detectionData.isSuspicious ? 'destructive' : 'default'}>
                  {detectionData.isSuspicious ? 'Suspicious' : 'Verified'}
                </Badge>
              </div>
              <Progress value={detectionData.authenticityScore} className="mt-3" />
            </div>

            {/* Warnings */}
            {detectionData.warnings && detectionData.warnings.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Warnings Detected</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {detectionData.warnings.map((warning: string, i: number) => (
                      <li key={i} className="text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {detectionData.recommendations && detectionData.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {detectionData.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Similar Artworks */}
            {detectionData.similarArtworks && detectionData.similarArtworks.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Potential Matches</h4>
                <div className="flex flex-wrap gap-1">
                  {detectionData.similarArtworks.map((art: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {art}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Verify this NFT's authenticity with AI analysis
            </p>
            <Button onClick={analyzeAuthenticity} className="gap-2">
              <Shield className="w-4 h-4" />
              Check Authenticity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIFakeDetection;
