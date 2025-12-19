import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagChipVariants = cva(
  "inline-flex items-center justify-center rounded-sm font-medium cursor-pointer select-none border",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border",
        active: "bg-brand !text-white border-brand",
        outline: "border-border bg-transparent text-foreground hover:bg-secondary",
        muted: "bg-muted text-muted-foreground hover:text-foreground border-transparent",
      },
      size: {
        sm: "px-1.5 py-0.5 min-h-[22px] text-caption",
        default: "px-2 py-0.5 min-h-[24px] text-meta",
        lg: "px-2.5 py-1 min-h-[28px] text-sm",
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

