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
    <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-5 sm:p-6 shadow-sm animate-fade-in flex flex-col min-h-[160px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />
          <Skeleton className="h-5 w-1/2 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20 rounded-full flex-shrink-0 mt-1" />
      </div>

      {/* Content lines */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-2/3 rounded-full" />
      </div>

      {/* Footer: tags + actions */}
      <div className="flex items-end justify-between gap-3 mt-auto pt-4 border-t border-border/40">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Skeleton className="h-5 w-14 rounded-md" />
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-16 rounded-lg" />
          <Skeleton className="h-7 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export { Skeleton, PromptCardSkeleton };
