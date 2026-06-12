import { cn } from "../../lib/utils";

export function Card({ className, children, hover, glass, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-card",
        hover && "card-hover cursor-pointer",
        glass && "glass-card",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn("flex flex-col space-y-1 p-5 pb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3 className={cn("font-bold text-sm leading-tight text-foreground", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn("p-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn("flex items-center px-5 py-4 border-t border-border", className)} {...props}>
      {children}
    </div>
  );
}

export function StatCard({ icon, label, value, trend, color = "primary", loading, className }) {
  const colors = {
    primary:     "bg-primary/10 text-primary",
    success:     "bg-success/10 text-success",
    warning:     "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    info:        "bg-info/10 text-info",
    accent:      "bg-accent/10 text-accent",
  };

  if (loading) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-5 space-y-3", className)}>
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="skeleton h-7 w-16 rounded-lg" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    );
  }

  return (
    <Card className={cn("p-5 group", className)} hover>
      <div className={cn("inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3", colors[color])}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>
      <div className="text-2xl font-black text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground font-medium mt-1">{label}</div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-[10px] font-bold mt-2", trend > 0 ? "text-success" : "text-destructive")}>
          <span className="material-symbols-outlined text-[12px]">{trend > 0 ? "trending_up" : "trending_down"}</span>
          {Math.abs(trend)}%
        </div>
      )}
    </Card>
  );
}
