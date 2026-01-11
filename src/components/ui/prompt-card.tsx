import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const promptCardVariants = cva(
  "relative flex flex-col rounded border bg-card text-card-foreground cursor-pointer transition-all duration-fast ease-default shadow-sm hover:shadow-md hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default: "border-border hover:bg-secondary/50",
        public: "border-border hover:bg-secondary/50",
        private: "border-border hover:bg-secondary/50",
        selected: "border-primary bg-primary/5 shadow-md",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface PromptCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof promptCardVariants> { }

const PromptCard = React.forwardRef<HTMLDivElement, PromptCardProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(promptCardVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
PromptCard.displayName = "PromptCard";

// Sub-components for consistent structure
const PromptCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-start justify-between gap-3 mb-3", className)}
    {...props}
  />
));
PromptCardHeader.displayName = "PromptCardHeader";

const PromptCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-base font-medium text-foreground truncate leading-normal",
      className
    )}
    {...props}
  />
));
PromptCardTitle.displayName = "PromptCardTitle";

const PromptCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-meta text-muted-foreground line-clamp-2", className)}
    {...props}
  />
));
PromptCardDescription.displayName = "PromptCardDescription";

const PromptCardMeta = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2.5 flex-wrap mt-1", className)}
    {...props}
  />
));
PromptCardMeta.displayName = "PromptCardMeta";

const PromptCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-end justify-between gap-3 mt-auto pt-3",
      className
    )}
    {...props}
  />
));
PromptCardFooter.displayName = "PromptCardFooter";

const PromptCardActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 flex-shrink-0", className)}
    {...props}
  />
));
PromptCardActions.displayName = "PromptCardActions";

export {
  PromptCard,
  PromptCardHeader,
  PromptCardTitle,
  PromptCardDescription,
  PromptCardMeta,
  PromptCardFooter,
  PromptCardActions,
  promptCardVariants,
};

