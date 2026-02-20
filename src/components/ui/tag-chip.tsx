import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagChipVariants = cva(
  "inline-flex items-center justify-center rounded-full text-xs font-medium cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-all",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-xs",
        active: "bg-primary text-primary-foreground shadow-xs",
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary hover:border-primary/20",
        muted: "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
      },
      size: {
        sm: "px-1.5 py-0.5 min-h-[20px]",
        default: "px-2 py-0.5 min-h-[24px]",
        lg: "px-2.5 py-1 min-h-[28px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface TagChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof tagChipVariants> {
  asChild?: boolean;
}

const TagChip = React.forwardRef<HTMLButtonElement, TagChipProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        type="button"
        ref={ref}
        className={cn(tagChipVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
TagChip.displayName = "TagChip";

// Static variant for non-interactive tags
const TagChipStatic = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof tagChipVariants>
>(({ className, variant, size, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        tagChipVariants({ variant, size }),
        "cursor-default",
        className
      )}
      {...props}
    />
  );
});
TagChipStatic.displayName = "TagChipStatic";

export { TagChip, TagChipStatic, tagChipVariants };

