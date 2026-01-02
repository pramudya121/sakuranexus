import { cn } from '@/lib/utils';

interface StableSkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

// Layout-stable skeleton that maintains exact dimensions
export function StableSkeleton({ 
  className, 
  width, 
  height 
}: StableSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted/60',
        className
      )}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        minWidth: typeof width === 'number' ? `${width}px` : width,
        minHeight: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Token row skeleton with fixed layout
export function TokenRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 h-[76px]">
      <div className="flex items-center gap-3">
        <StableSkeleton className="rounded-full" width={40} height={40} />
        <div className="space-y-2">
          <StableSkeleton width={60} height={16} />
          <StableSkeleton width={80} height={12} />
        </div>
      </div>
      <div className="text-right space-y-2">
        <StableSkeleton width={80} height={16} className="ml-auto" />
        <StableSkeleton width={60} height={12} className="ml-auto" />
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <div className="glass border-border/50 p-4 rounded-xl h-[120px]">
      <div className="flex items-center justify-between mb-3">
        <StableSkeleton className="rounded-lg" width={36} height={36} />
        <StableSkeleton width={40} height={20} className="rounded-full" />
      </div>
      <StableSkeleton width={96} height={32} className="mb-2" />
      <StableSkeleton width={80} height={14} />
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div 
      className="flex items-end justify-around gap-2 p-4" 
      style={{ height }}
    >
      {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 0.5].map((h, i) => (
        <StableSkeleton
          key={i}
          className="flex-1 rounded-t-md"
          height={`${h * 100}%`}
        />
      ))}
    </div>
  );
}

export default StableSkeleton;
