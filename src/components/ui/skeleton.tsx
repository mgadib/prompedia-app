import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-lg bg-muted animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:400%_100%]", className)}
      {...props}
    />
  );
});
Skeleton.displayName = "Skeleton";

// Skeleton for prompt card - matches rounded-2xl card design
const PromptCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <Skeleton className="h-5 w-3/5 rounded-full" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </div>
      {/* Content lines */}
      <div className="space-y-2.5 mb-6">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-full" />
      </div>
      {/* Footer: tags + actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export { Skeleton, PromptCardSkeleton };
