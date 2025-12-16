import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PriceImpactWarningProps {
  priceImpact: number;
  className?: string;
}

const PriceImpactWarning = ({ priceImpact, className = '' }: PriceImpactWarningProps) => {
  if (priceImpact < 2) return null;

  const isHighImpact = priceImpact >= 5;
  const isModerateImpact = priceImpact >= 2 && priceImpact < 5;

  return (
    <Alert 
      variant={isHighImpact ? 'destructive' : 'default'} 
      className={`${className} ${isHighImpact ? 'border-destructive/50 bg-destructive/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}
    >
      {isHighImpact ? (
        <AlertTriangle className="h-4 w-4 text-destructive" />
      ) : (
        <Info className="h-4 w-4 text-yellow-500" />
      )}
      <AlertTitle className={isHighImpact ? 'text-destructive' : 'text-yellow-500'}>
        {isHighImpact ? 'High Price Impact!' : 'Moderate Price Impact'}
      </AlertTitle>
      <AlertDescription className={isHighImpact ? 'text-destructive/80' : 'text-yellow-500/80'}>
        {isHighImpact ? (
          <>
            This swap has a <strong>{priceImpact.toFixed(2)}%</strong> price impact. 
            You may receive significantly less tokens than expected. 
            Consider swapping a smaller amount or wait for more liquidity.
          </>
        ) : (
          <>
            This swap has a <strong>{priceImpact.toFixed(2)}%</strong> price impact. 
            The exchange rate is slightly worse than the market price.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default PriceImpactWarning;
