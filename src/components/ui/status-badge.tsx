import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm text-xs font-medium",
  {
    variants: {
      variant: {
        public: "bg-status-public-bg text-status-public",
        private: "bg-status-private-bg text-status-private",
        date: "text-muted-foreground",
        default: "bg-secondary text-secondary-foreground",
      },
      size: {
        sm: "px-1.5 py-0.5",
        default: "px-2 py-0.5",
        lg: "px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
  VariantProps<typeof statusBadgeVariants> { }

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };

