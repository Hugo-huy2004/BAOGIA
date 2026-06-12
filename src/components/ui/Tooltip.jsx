import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "../../lib/utils";

export function TooltipProvider({ children }) {
  return <RadixTooltip.Provider delayDuration={400}>{children}</RadixTooltip.Provider>;
}

export function Tooltip({ content, side = "top", children, className }) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className={cn(
            "z-50 overflow-hidden rounded-lg bg-foreground px-3 py-1.5 text-[11px] font-semibold text-background",
            "shadow-lg animate-slide-up select-none",
            className
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-foreground" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
