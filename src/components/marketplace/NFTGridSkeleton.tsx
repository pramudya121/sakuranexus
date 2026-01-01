import { Card } from '@/components/ui/card';

interface NFTGridSkeletonProps {
  count?: number;
}

const NFTGridSkeleton = ({ count = 8 }: NFTGridSkeletonProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(count)].map((_, index) => (
        <Card key={index} className="overflow-hidden animate-pulse">
          <div className="aspect-square bg-muted" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-16" />
              <div className="h-4 bg-muted rounded w-20" />
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="h-6 bg-muted rounded w-24 mx-auto" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-muted rounded flex-1" />
              <div className="h-10 bg-muted rounded flex-1" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default NFTGridSkeleton;
