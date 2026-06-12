import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "../../lib/utils";

export const Dialog        = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({ children, className, title, description, ...props }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
          "rounded-2xl bg-card border border-border shadow-[0_24px_80px_hsl(var(--shadow)/0.25)]",
          "p-6 space-y-4",
          "data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
          "focus:outline-none",
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <RadixDialog.Title className="font-bold text-base text-foreground">{title}</RadixDialog.Title>}
            {description && <RadixDialog.Description className="text-sm text-muted-foreground mt-1">{description}</RadixDialog.Description>}
          </div>
          <RadixDialog.Close className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </RadixDialog.Close>
        </div>
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Xác nhận", onConfirm, variant = "destructive" }) {
  const variantMap = { destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90", default: "bg-primary text-primary-foreground hover:bg-primary/90" };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description}>
        <div className="flex gap-3 justify-end pt-2">
          <RadixDialog.Close className="inline-flex items-center justify-center h-9 px-4 rounded-xl border border-border bg-transparent text-sm font-bold hover:bg-muted transition-colors">
            Hủy
          </RadixDialog.Close>
          <button
            onClick={() => { onConfirm?.(); onOpenChange?.(false); }}
            className={cn("inline-flex items-center justify-center h-9 px-4 rounded-xl text-sm font-bold transition-colors", variantMap[variant])}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
