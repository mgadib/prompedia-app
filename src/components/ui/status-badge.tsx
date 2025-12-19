import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-meta font-medium transition-colors",
  {
    variants: {
      variant: {
        public: "bg-status-public-bg text-status-public border border-status-public/20",
        private: "bg-status-private-bg text-status-private-foreground border border-transparent",
        date: "bg-secondary text-muted-foreground border border-transparent",
        default: "bg-secondary text-secondary-foreground border border-transparent",
      },
      size: {
        sm: "text-caption px-1.5 py-0.5",
        default: "text-meta px-2 py-1",
        lg: "text-sm px-2.5 py-1.5",
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
    VariantProps<typeof statusBadgeVariants> {}

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

