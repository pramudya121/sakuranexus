import { useState, useEffect, memo } from 'react';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

// Global cache for logo load results
const logoCache = new Map<string, 'success' | 'error'>();

interface TokenLogoProps {
  src?: string;
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
};

const iconSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
};

export const TokenLogo = memo(function TokenLogo({ 
  src, 
  symbol, 
  size = 'md',
  className 
}: TokenLogoProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() => {
    if (!src) return 'error';
    const cached = logoCache.get(src);
    return cached || 'loading';
  });

  useEffect(() => {
    if (!src) {
      setStatus('error');
      return;
    }

    const cached = logoCache.get(src);
    if (cached) {
      setStatus(cached);
      return;
    }

    const img = new Image();
    img.onload = () => {
      logoCache.set(src, 'success');
      setStatus('success');
    };
    img.onerror = () => {
      logoCache.set(src, 'error');
      setStatus('error');
    };
    img.src = src;
  }, [src]);

  const baseClasses = cn(
    'rounded-full flex-shrink-0 transition-transform duration-300',
    sizeClasses[size],
    className
  );

  if (status === 'success' && src) {
    return (
      <img
        src={src}
        alt={`${symbol} logo`}
        loading="lazy"
        decoding="async"
        className={cn(baseClasses, 'object-cover shadow-md')}
      />
    );
  }

  // Fallback: gradient circle with icon or initials
  return (
    <div 
      className={cn(
        baseClasses,
        'bg-gradient-sakura flex items-center justify-center font-bold text-primary-foreground shadow-md'
      )}
    >
      {symbol.length <= 2 ? (
        symbol.slice(0, 2).toUpperCase()
      ) : (
        <Coins size={iconSizes[size]} />
      )}
    </div>
  );
});

export default TokenLogo;
