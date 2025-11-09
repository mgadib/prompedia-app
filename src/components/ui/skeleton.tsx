import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )} 
      {...props} 
    />
  );
}

// Skeleton variants for different use cases
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <Skeleton className="w-4 h-4" />
        </div>
        <Skeleton className="w-4 h-4" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard };
