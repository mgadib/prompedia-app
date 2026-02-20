import * as React from "react";
import { memo } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const promptCardVariants = cva(
  [
    "relative flex flex-col rounded-2xl bg-card/60 backdrop-blur-sm text-card-foreground cursor-pointer animate-fade-in",
    "border border-border/60 shadow-sm",
    "transition-all duration-normal ease-default",
    "hover:-translate-y-1.5 hover:shadow-xl hover:border-border hover:bg-card/80",
    "group overflow-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "hover:shadow-black/8",
        ].join(" "),
        public: [
          "border-l-[3px] border-l-green-500",
          "hover:shadow-green-500/10 hover:bg-green-50/30",
          "dark:hover:bg-green-950/10",
        ].join(" "),
        private: [
          "hover:shadow-black/8",
        ].join(" "),
        selected: [
          "border-primary/50 bg-primary/3 shadow-md shadow-primary/10",
          "border-l-[3px] border-l-primary",
        ].join(" "),
      },
      size: {
        sm: "p-4",
        default: "p-5 sm:p-6",
        lg: "p-6 sm:p-7",
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

const PromptCardComponent = React.forwardRef<HTMLDivElement, PromptCardProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(promptCardVariants({ variant, size }), className)}
        {...props}
      >
        {/* Subtle shine effect on hover */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.04), transparent 40%)",
          }}
          aria-hidden
        />
        {props.children}
      </div>
    );
  }
);
PromptCardComponent.displayName = "PromptCard";

const PromptCard = memo(PromptCardComponent) as typeof PromptCardComponent;

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
      "text-base font-black text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors duration-normal font-heading",
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
    className={cn("text-sm text-muted-foreground line-clamp-2 leading-relaxed", className)}
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
      "flex items-end justify-between gap-3 mt-auto pt-4 border-t border-border/40",
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
    className={cn(
      "flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0",
      className
    )}
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
