import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded bg-muted", className)}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

// Skeleton for prompt card
const PromptCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded shadow-sm p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-5 w-16 rounded" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Skeleton className="h-5 w-16 rounded-sm" />
        <Skeleton className="h-5 w-20 rounded-sm" />
        <Skeleton className="h-5 w-12 rounded-sm" />
      </div>
    </div>
  );
};

export { Skeleton, PromptCardSkeleton };
