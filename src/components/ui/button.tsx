import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation min-h-[36px] sm:min-h-0 transition-all duration-fast active:scale-[0.97] uppercase tracking-wide",
  {
    variants: {
      variant: {
        // Brand variant - Orange primary action
        brand: "bg-action text-action-foreground hover:bg-action-hover hover:shadow-sm",
        // Default - now uses orange primary
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-sm",
        outline: "border border-input bg-background hover:bg-secondary hover:text-foreground hover:border-primary/20",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-xs",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        // Subtle action link style
        action: "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
      },
      size: {
        default: "h-9 sm:h-8 px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0",
        sm: "h-8 sm:h-7 px-2.5 sm:px-2 py-2 sm:py-1 min-h-[44px] sm:min-h-0",
        lg: "h-10 sm:h-9 px-6 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0",
        icon: "h-9 w-9 sm:h-8 sm:w-8 min-w-[44px] sm:min-w-[36px]",
        // Inline text button
        inline: "h-auto p-0 text-caption min-h-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
