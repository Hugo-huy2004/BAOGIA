import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

export const Tabs      = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export function TabsList({ children, className, pill }) {
  return (
    <RadixTabs.List
      className={cn(
        pill
          ? "inline-flex items-center gap-1 p-1 rounded-xl bg-muted"
          : "flex items-center gap-1 border-b border-border",
        className
      )}
    >
      {children}
    </RadixTabs.List>
  );
}

export function TabsTrigger({ children, className, pill, value, badge, ...props }) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={cn(
        "inline-flex items-center gap-2 text-xs font-bold transition-all duration-200 select-none",
        "focus-visible:outline-none",
        pill
          ? "px-4 py-2 rounded-lg text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          : "pb-3 px-1 border-b-2 border-transparent text-muted-foreground data-[state=active]:text-primary data-[state=active]:border-primary",
        className
      )}
      {...props}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="bg-destructive text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none animate-pulse">
          {badge}
        </span>
      )}
    </RadixTabs.Trigger>
  );
}
