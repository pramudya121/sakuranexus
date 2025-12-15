import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

const LiquiditySkeleton = () => {
  return (
    <Card className="w-full max-w-md mx-auto glass border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4 pb-0">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Token A Box */}
        <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>

        {/* Plus Icon */}
        <div className="flex justify-center">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>

        {/* Token B Box */}
        <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>

        {/* Pool Info */}
        <div className="bg-secondary/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Button */}
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </Card>
  );
};

export default LiquiditySkeleton;
