import { cn } from "../../lib/utils";

export function Spinner({ className, size = "md" }) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-8 w-8 border-3", xl: "h-12 w-12 border-4" };
  return (
    <div className={cn("rounded-full border-primary/20 border-t-primary animate-spin", sizes[size], className)} />
  );
}

export function LoadingScreen({ text = "Đang tải..." }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest animate-pulse">{text}</p>
    </div>
  );
}

export function ButtonSpinner() {
  return <div className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />;
}
