import * as RadixProgress from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

export function Progress({ value = 0, max = 100, className, color = "primary", label, showValue }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    primary:     "bg-primary",
    success:     "bg-success",
    warning:     "bg-warning",
    destructive: "bg-destructive",
    accent:      "bg-accent",
    info:        "bg-info",
  };

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-xs font-bold">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && <span className="text-foreground tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <RadixProgress.Root
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
        value={pct}
      >
        <RadixProgress.Indicator
          className={cn("h-full w-full flex-1 transition-all duration-500 ease-spring rounded-full", colors[color])}
          style={{ transform: `translateX(-${100 - pct}%)` }}
        />
      </RadixProgress.Root>
    </div>
  );
}
