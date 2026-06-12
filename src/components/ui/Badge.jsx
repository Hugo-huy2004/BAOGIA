import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-bold transition-colors select-none",
  {
    variants: {
      variant: {
        default:     "bg-primary/10 text-primary border border-primary/20",
        secondary:   "bg-secondary/10 text-secondary border border-secondary/20",
        accent:      "bg-accent/10 text-accent border border-accent/20",
        success:     "bg-success/10 text-success border border-success/20",
        warning:     "bg-warning/10 text-warning border border-warning/20",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20",
        info:        "bg-info/10 text-info border border-info/20",
        muted:       "bg-muted text-muted-foreground border border-border",
        outline:     "border border-border text-foreground bg-transparent",
        solid:       "bg-primary text-primary-foreground",
      },
      size: {
        xs: "px-1.5 py-0.5 text-[9px]",
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  }
);

export function Badge({ className, variant, size, children, pulse, ...props }) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), pulse && "animate-pulse", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusDot({ status }) {
  const map = {
    active:   "bg-success pulse-dot-green",
    pending:  "bg-warning pulse-dot-amber",
    locked:   "bg-destructive pulse-dot-red",
    rejected: "bg-muted-foreground",
    online:   "bg-success pulse-dot-green",
    offline:  "bg-muted-foreground",
  };
  return (
    <span className={cn("inline-block w-2 h-2 rounded-full", map[status] || "bg-muted-foreground")} />
  );
}
