import { useEffect, useCallback, memo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getPriceAlerts, savePriceAlerts, PriceAlert } from './PriceAlertModal';
import { Bell } from 'lucide-react';

// Mock price generator for demo
const getMockPrice = (nftId: string): number => {
  const basePrice = parseFloat(nftId.slice(-4)) || 1;
  const variation = (Math.random() - 0.5) * 0.5;
  return Math.max(0.01, basePrice * (1 + variation));
};

const PriceAlertNotifier = memo(() => {
  const { toast } = useToast();

  const checkAlerts = useCallback(() => {
    const alerts = getPriceAlerts();
    const now = Date.now();
    let hasChanges = false;

    const updatedAlerts = alerts.map((alert) => {
      if (!alert.isActive || alert.triggeredAt) return alert;

      // Get mock current price (in production, this would come from real data)
      const currentPrice = getMockPrice(alert.nftId);
      
      const isTriggered = 
        (alert.condition === 'below' && currentPrice <= alert.targetPrice) ||
        (alert.condition === 'above' && currentPrice >= alert.targetPrice);

      if (isTriggered) {
        hasChanges = true;
        toast({
          title: '🔔 Price Alert Triggered!',
          description: `${alert.nftName} is now ${alert.condition} ${alert.targetPrice} NEX (Current: ${currentPrice.toFixed(2)} NEX)`,
          duration: 10000,
        });

        return {
          ...alert,
          currentPrice,
          triggeredAt: now,
          isActive: false,
        };
      }

      return { ...alert, currentPrice };
    });

    if (hasChanges) {
      savePriceAlerts(updatedAlerts);
    }
  }, [toast]);

  useEffect(() => {
    // Check alerts every 30 seconds
    const interval = setInterval(checkAlerts, 30000);
    
    // Initial check
    checkAlerts();

    return () => clearInterval(interval);
  }, [checkAlerts]);

  return null; // This is a background component
});

PriceAlertNotifier.displayName = 'PriceAlertNotifier';

export default PriceAlertNotifier;
