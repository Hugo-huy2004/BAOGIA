import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_14px_hsl(var(--primary)/0.3)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.4)]",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        accent:      "bg-accent text-accent-foreground hover:bg-accent/90",
        outline:     "border border-border bg-transparent hover:bg-muted text-foreground",
        ghost:       "hover:bg-muted text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success:     "bg-success text-success-foreground hover:bg-success/90",
        glass:       "glass border-border/50 text-foreground hover:bg-primary/5",
        link:        "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs:   "h-7 px-3 text-[10px] rounded-lg",
        sm:   "h-8 px-3.5 text-xs",
        md:   "h-9 px-4 text-xs",
        default: "h-10 px-5 text-sm",
        lg:   "h-12 px-6 text-sm",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-7 w-7 p-0 rounded-lg",
        "icon-lg": "h-11 w-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export function Button({ className, variant, size, children, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </button>
  );
}

export { buttonVariants };
