import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={2500}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:shadow-black/10 !rounded-2xl !w-fit min-w-[280px] max-w-[90vw] md:max-w-[480px] break-words whitespace-normal px-5 py-4 text-sm font-semibold",
          description: "group-[.toast]:text-muted-foreground break-words whitespace-normal text-xs font-medium mt-0.5",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground !rounded-xl",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground !rounded-xl",
          success: "group-[.toast]:!border-green-500/20 group-[.toast]:!bg-green-50 dark:group-[.toast]:!bg-green-950/30",
          error: "group-[.toast]:!border-destructive/20 group-[.toast]:!bg-red-50 dark:group-[.toast]:!bg-red-950/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
