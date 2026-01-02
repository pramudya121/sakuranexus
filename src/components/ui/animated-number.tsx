import { useEffect, useState, useRef, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
  compact?: boolean; // Use compact notation for large numbers
}

// Format large numbers compactly
const formatCompact = (value: number, decimals: number): string => {
  if (Math.abs(value) >= 1e9) {
    return (value / 1e9).toFixed(decimals) + 'B';
  }
  if (Math.abs(value) >= 1e6) {
    return (value / 1e6).toFixed(decimals) + 'M';
  }
  if (Math.abs(value) >= 1e3) {
    return (value / 1e3).toFixed(decimals) + 'K';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  className,
  duration = 400,
  compact = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    // Skip animation for initial mount or very small changes
    const diff = Math.abs(value - previousValue.current);
    const threshold = Math.abs(previousValue.current) * 0.001;
    
    if (diff < threshold && previousValue.current !== 0) {
      previousValue.current = value;
      setDisplayValue(value);
      return;
    }

    const startValue = previousValue.current;
    const endValue = value;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function: easeOutQuart - smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      
      const current = startValue + (endValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
        setDisplayValue(endValue);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = useMemo(() => {
    if (compact) {
      return formatCompact(displayValue, decimals);
    }
    return displayValue.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }, [displayValue, decimals, compact]);

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
});

// Simple counter for integer values
export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  className,
  duration = 400,
}: {
  value: number;
  className?: string;
  duration?: number;
}) {
  return (
    <AnimatedNumber 
      value={value} 
      decimals={0} 
      className={className} 
      duration={duration}
    />
  );
});

// Currency display with $ prefix
export const AnimatedCurrency = memo(function AnimatedCurrency({
  value,
  className,
  compact = false,
}: {
  value: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <AnimatedNumber 
      value={value} 
      prefix="$" 
      decimals={2} 
      className={className}
      compact={compact}
    />
  );
});

// Percentage display
export const AnimatedPercentage = memo(function AnimatedPercentage({
  value,
  className,
  showSign = true,
}: {
  value: number;
  className?: string;
  showSign?: boolean;
}) {
  const prefix = showSign && value > 0 ? '+' : '';
  return (
    <AnimatedNumber 
      value={value} 
      prefix={prefix}
      suffix="%" 
      decimals={2} 
      className={className}
    />
  );
});

export default AnimatedNumber;
