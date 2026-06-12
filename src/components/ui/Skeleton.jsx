import { cn } from "../../lib/utils";

export function Skeleton({ className, ...props }) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-2.5 w-36 rounded" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 rounded ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 items-center">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={`h-3 rounded flex-1 ${j === 0 ? "max-w-[40px]" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
