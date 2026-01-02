import { memo } from 'react';
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

// NFT Card Skeleton - memoized for performance
export const NFTCardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn(
    "rounded-2xl border border-border/50 bg-card overflow-hidden",
    // Fixed dimensions to prevent layout shift
    "min-h-[320px]",
    className
  )}>
    <Skeleton className="aspect-square w-full" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  </div>
));

NFTCardSkeleton.displayName = 'NFTCardSkeleton';

// Pool Card Skeleton - memoized
export const PoolCardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn(
    "glass rounded-2xl border border-border/50 p-5",
    // Fixed height
    "min-h-[280px]",
    className
  )}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <div>
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <Skeleton className="h-20 w-full rounded-lg mb-4" />
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-3 w-10 mx-auto mb-1" />
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
      ))}
    </div>
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
));

PoolCardSkeleton.displayName = 'PoolCardSkeleton';

// Dashboard Stats Skeleton - memoized
export const StatsCardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn(
    "glass rounded-xl border border-border/50 p-5",
    // Fixed height
    "min-h-[120px]",
    className
  )}>
    <div className="flex items-center justify-between mb-3">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <Skeleton className="h-5 w-12 rounded-full" />
    </div>
    <Skeleton className="h-8 w-24 mb-2" />
    <Skeleton className="h-4 w-20" />
  </div>
));

StatsCardSkeleton.displayName = 'StatsCardSkeleton';

// Token Balance Skeleton - memoized with fixed height
export const TokenBalanceSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn(
    "flex items-center justify-between p-4 rounded-xl bg-secondary/30",
    // Fixed height to match TokenRow
    "h-[72px]",
    className
  )}>
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div>
        <Skeleton className="h-5 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="text-right">
      <Skeleton className="h-5 w-20 mb-1" />
      <Skeleton className="h-3 w-14" />
    </div>
  </div>
));

TokenBalanceSkeleton.displayName = 'TokenBalanceSkeleton';

// Activity Item Skeleton - memoized
export const ActivityItemSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn(
    "flex items-center gap-3 p-4",
    "h-[72px]",
    className
  )}>
    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
    <div className="text-right">
      <Skeleton className="h-4 w-16 mb-1" />
      <Skeleton className="h-3 w-12" />
    </div>
  </div>
));

ActivityItemSkeleton.displayName = 'ActivityItemSkeleton';

// Chart Skeleton - memoized with deterministic bars
export const ChartSkeleton = memo(({ className, height = 256 }: { className?: string; height?: number }) => {
  // Deterministic heights for bars
  const barHeights = [40, 65, 45, 80, 55, 70, 50, 60, 75, 45];
  
  return (
    <div 
      className={cn(
        "w-full rounded-xl bg-muted/30 flex items-end justify-around p-4 gap-2",
        className
      )}
      style={{ height }}
    >
      {barHeights.map((barHeight, i) => (
        <div 
          key={i} 
          className="bg-primary/20 rounded-t-md w-full transition-all duration-500"
          style={{ height: `${barHeight}%` }}
        />
      ))}
    </div>
  );
});

ChartSkeleton.displayName = 'ChartSkeleton';

// Table Row Skeleton - memoized
export const TableRowSkeleton = memo(({ columns = 5, className }: { columns?: number; className?: string }) => (
  <div className={cn(
    "flex items-center gap-4 p-4 border-b border-border/30",
    "h-[64px]",
    className
  )}>
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={cn(
          "h-4",
          i === 0 ? "w-8" : i === 1 ? "w-32" : "w-20"
        )}
      />
    ))}
  </div>
));

TableRowSkeleton.displayName = 'TableRowSkeleton';

// Token Row Skeleton - fixed height for token lists
export const TokenRowSkeleton = memo(() => (
  <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border/30 h-[72px]">
    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <Skeleton className="h-5 w-24 mb-1" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="text-right">
      <Skeleton className="h-5 w-20 mb-1" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
));

TokenRowSkeleton.displayName = 'TokenRowSkeleton';

// Page Loading Skeleton - optimized for Suspense
export const PageLoadingSkeleton = memo(() => (
  <div className="min-h-screen bg-background animate-in fade-in duration-200">
    {/* Header skeleton */}
    <div className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="hidden md:flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>
    </div>
    
    {/* Content skeleton */}
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <NFTCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
));

PageLoadingSkeleton.displayName = 'PageLoadingSkeleton';

// Card skeleton with fixed dimensions
export const CardSkeleton = memo(({ className }: { className?: string }) => (
  <div className={cn(
    "p-6 rounded-xl border border-border/50 bg-card min-h-[160px]",
    className
  )}>
    <Skeleton className="h-6 w-32 mb-4" />
    <Skeleton className="h-24 w-full" />
  </div>
));

CardSkeleton.displayName = 'CardSkeleton';

// Table skeleton
export const TableSkeleton = memo(({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
    <div className="p-4 border-b border-border/30">
      <Skeleton className="h-6 w-48" />
    </div>
    <div className="divide-y divide-border/30">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4 h-[64px]">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  </div>
));

TableSkeleton.displayName = 'TableSkeleton';

export default PageLoadingSkeleton;
