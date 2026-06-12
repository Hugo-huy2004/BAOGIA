import * as RadixAvatar from "@radix-ui/react-avatar";
import { cn } from "../../lib/utils";

export function Avatar({ src, alt, fallback, size = "md", className, status }) {
  const sizes = { xs: "h-6 w-6 text-[9px]", sm: "h-8 w-8 text-[10px]", md: "h-10 w-10 text-xs", lg: "h-12 w-12 text-sm", xl: "h-16 w-16 text-base" };
  const statusColors = { online: "bg-success", offline: "bg-muted-foreground", busy: "bg-warning", away: "bg-info" };

  return (
    <div className="relative inline-block">
      <RadixAvatar.Root className={cn("relative flex shrink-0 overflow-hidden rounded-full", sizes[size], className)}>
        <RadixAvatar.Image src={src} alt={alt} className="h-full w-full object-cover" />
        <RadixAvatar.Fallback className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
          {fallback || (alt ? alt.slice(0, 2).toUpperCase() : "?")}
        </RadixAvatar.Fallback>
      </RadixAvatar.Root>
      {status && (
        <span className={cn("absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-card", statusColors[status] || "bg-muted-foreground")} />
      )}
    </div>
  );
}
