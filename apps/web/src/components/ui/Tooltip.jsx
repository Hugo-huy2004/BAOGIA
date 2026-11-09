import * as RadixTooltip from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }) {
  return <RadixTooltip.Provider delayDuration={400}>{children}</RadixTooltip.Provider>;
}
