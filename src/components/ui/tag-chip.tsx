import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagChipVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-all cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        active: "bg-brand text-brand-foreground shadow-sm",
        outline: "border border-border bg-transparent text-foreground hover:bg-secondary",
        muted: "bg-muted text-muted-foreground hover:text-foreground",
      },
      size: {
        sm: "text-caption px-2 py-1 min-h-[24px]",
        default: "text-meta px-2.5 py-1.5 min-h-[28px]",
        lg: "text-sm px-3 py-2 min-h-[32px]",
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

