import { cn } from "../../lib/utils";

export function Input({ className, icon, suffix, error, ...props }) {
  const base = cn(
    "w-full rounded-2xl border border-border/70 bg-card/78 px-3 py-2 text-sm font-medium text-foreground shadow-inner-soft backdrop-blur-sm",
    "placeholder:text-muted-foreground/70 placeholder:font-normal",
    "transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/60",
    "disabled:cursor-not-allowed disabled:opacity-60",
    error ? "border-destructive focus:ring-destructive/20" : "hover:border-primary/20",
    icon && "pl-9",
    suffix && "pr-9",
    className
  );

  if (icon || suffix) {
    return (
      <div className="relative w-full">
        {icon && (
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {icon}
          </span>
        )}
        <input className={base} {...props} />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return <input className={base} {...props} />;
}

export function Select({ className, children, error, ...props }) {
  return (
    <select
      className={cn(
        "w-full rounded-2xl border border-border/70 bg-card/78 px-3 py-2 text-sm font-medium text-foreground shadow-inner-soft backdrop-blur-sm",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary/60",
        "disabled:cursor-not-allowed disabled:opacity-60",
        error ? "border-destructive" : "border-border",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, required, children, ...props }) {
  return (
    <label className={cn("block text-[11px] font-bold text-muted-foreground uppercase tracking-[0.16em] mb-1.5", className)} {...props}>
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

export function Field({ label, required, error, children, className }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
    </div>
  );
}
