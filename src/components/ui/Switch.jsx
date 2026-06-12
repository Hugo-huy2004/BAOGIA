import * as RadixSwitch from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

export function Switch({ checked, onCheckedChange, disabled, className, label, description }) {
  const id = Math.random().toString(36).slice(2);
  return (
    <div className="flex items-center gap-3">
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted",
          className
        )}
      >
        <RadixSwitch.Thumb
          className={cn(
            "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md ring-0",
            "transition-transform duration-200",
            "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
          )}
        />
      </RadixSwitch.Root>
      {(label || description) && (
        <label htmlFor={id} className="cursor-pointer space-y-0.5">
          {label && <p className="text-xs font-bold text-foreground">{label}</p>}
          {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </label>
      )}
    </div>
  );
}
