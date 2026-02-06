import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { Loader2, Users, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Wallet } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface AIWhaleTrackerProps {
  collectionName?: string;
  largeTransactions?: Array<{ address: string; action: string; amount: number; timestamp: string }>;
  topHolders?: Array<{ address: string; balance: number }>;
}

const AIWhaleTracker = ({ collectionName, largeTransactions, topHolders }: AIWhaleTrackerProps) => {
  const [whaleData, setWhaleData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { trackWhaleActivity } = useAIFeatures();

  const analyzeWhales = async () => {
    setIsAnalyzing(true);
    const result = await trackWhaleActivity(
      { name: collectionName || 'General Market' },
      { largeTransactions, topHolders }
    );
    if (result) {
      setWhaleData(result);
    }
    setIsAnalyzing(false);
  };

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'Accumulating': return 'text-green-600';
      case 'Distributing': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Whale Activity Tracker
        </CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={analyzeWhales}
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
            <p className="text-sm text-muted-foreground">Tracking whale movements...</p>
          </div>
        ) : whaleData ? (
          <div className="space-y-4">
            {/* Activity Level */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm font-medium">Whale Activity Level</span>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getActivityColor(whaleData.whaleActivity)} animate-pulse`} />
                <Badge variant="outline">{whaleData.whaleActivity}</Badge>
              </div>
            </div>

            {/* Accumulation Trend */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Accumulation Trend</span>
              <span className={`font-semibold flex items-center gap-1 ${getTrendColor(whaleData.accumulationTrend)}`}>
                {whaleData.accumulationTrend === 'Accumulating' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : whaleData.accumulationTrend === 'Distributing' ? (
                  <TrendingDown className="w-4 h-4" />
                ) : null}
                {whaleData.accumulationTrend}
              </span>
            </div>

            {/* Top Holder Concentration */}
            {whaleData.topHolderConcentration !== undefined && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Top 10 Holders Concentration</span>
                  <span className="font-medium">{whaleData.topHolderConcentration}%</span>
                </div>
                <Progress value={whaleData.topHolderConcentration} className="h-2" />
              </div>
            )}

            {/* Recent Whale Actions */}
            {whaleData.recentWhaleActions && whaleData.recentWhaleActions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Whale Actions</h4>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {whaleData.recentWhaleActions.slice(0, 5).map((action: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3 h-3 text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {action.address?.slice(0, 6)}...{action.address?.slice(-4)}
                        </span>
                      </div>
                      <Badge variant={action.action === 'buy' ? 'default' : 'destructive'} className="text-xs">
                        {action.action} {action.amount}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Signals */}
            {whaleData.signals && whaleData.signals.length > 0 && (
              <div className="p-3 rounded-lg bg-gradient-sakura-soft">
                <h4 className="text-sm font-medium mb-2">Whale Signals</h4>
                <ul className="space-y-1">
                  {whaleData.signals.map((signal: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {signal}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alert Level */}
            {whaleData.alertLevel && whaleData.alertLevel !== 'None' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600">Alert: {whaleData.alertLevel}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Track whale activity and large holder movements
            </p>
            <Button onClick={analyzeWhales} className="gap-2">
              <Users className="w-4 h-4" />
              Track Whales
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIWhaleTracker;
