import { useState, useEffect, memo, useCallback } from 'react';
import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

// Global cache for logo load results - persists across re-renders
const logoCache = new Map<string, 'success' | 'error'>();

// Preload queue for batch loading
const preloadQueue = new Set<string>();
let preloadTimeout: NodeJS.Timeout | null = null;

// Preload logos in background
export function preloadTokenLogos(urls: string[]) {
  urls.forEach(url => {
    if (url && !logoCache.has(url)) {
      preloadQueue.add(url);
    }
  });

  if (preloadTimeout) clearTimeout(preloadTimeout);
  
  preloadTimeout = setTimeout(() => {
    preloadQueue.forEach(url => {
      const img = new Image();
      img.onload = () => logoCache.set(url, 'success');
      img.onerror = () => logoCache.set(url, 'error');
      img.src = url;
    });
    preloadQueue.clear();
  }, 100);
}

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

// Generate consistent color from symbol
const getGradientFromSymbol = (symbol: string): string => {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-red-500 to-pink-500',
    'from-violet-500 to-purple-500',
    'from-sky-500 to-blue-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
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
    'rounded-full flex-shrink-0',
    sizeClasses[size],
    className
  );

  // Success state - show image
  if (status === 'success' && src) {
    return (
      <img
        src={src}
        alt={`${symbol} logo`}
        loading="lazy"
        decoding="async"
        className={cn(
          baseClasses, 
          'object-cover shadow-sm ring-1 ring-border/20'
        )}
      />
    );
  }

  // Loading state - show skeleton placeholder
  if (status === 'loading') {
    return (
      <div 
        className={cn(
          baseClasses,
          'bg-muted/50 animate-pulse'
        )}
      />
    );
  }

  // Error/fallback state - show gradient with initials
  const gradientClass = getGradientFromSymbol(symbol);
  
  return (
    <div 
      className={cn(
        baseClasses,
        'bg-gradient-to-br flex items-center justify-center font-bold text-white shadow-sm',
        gradientClass
      )}
    >
      {symbol.length <= 3 ? (
        <span className="uppercase">{symbol.slice(0, 2)}</span>
      ) : (
        <Coins size={iconSizes[size]} />
      )}
    </div>
  );
});

// Clear cache (useful for testing or manual refresh)
export function clearLogoCache() {
  logoCache.clear();
}

// Get cache status
export function getLogoCacheSize(): number {
  return logoCache.size;
}

export default TokenLogo;
