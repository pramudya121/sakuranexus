import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

// NFT Card Skeleton
export function NFTCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card overflow-hidden animate-pulse", className)}>
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
  );
}

// Pool Card Skeleton
export function PoolCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-2xl border border-border/50 p-5 animate-pulse", className)}>
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
        <div className="text-center">
          <Skeleton className="h-3 w-10 mx-auto mb-1" />
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-3 w-10 mx-auto mb-1" />
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-3 w-10 mx-auto mb-1" />
          <Skeleton className="h-5 w-16 mx-auto" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

// Dashboard Stats Skeleton
export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass rounded-xl border border-border/50 p-5 animate-pulse", className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

// Token Balance Skeleton
export function TokenBalanceSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-between p-4 rounded-xl bg-secondary/30 animate-pulse", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
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
  );
}

// Activity Item Skeleton
export function ActivityItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-4 animate-pulse", className)}>
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="text-right">
        <Skeleton className="h-4 w-16 mb-1" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-full h-64 rounded-xl bg-muted/30 animate-pulse flex items-end justify-around p-4 gap-2", className)}>
      {[40, 65, 45, 80, 55, 70, 50].map((height, i) => (
        <div 
          key={i} 
          className="bg-primary/20 rounded-t-md w-full"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5, className }: { columns?: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4 border-b border-border/30 animate-pulse", className)}>
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
  );
}

// Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
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
        {[...Array(4)].map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <NFTCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
