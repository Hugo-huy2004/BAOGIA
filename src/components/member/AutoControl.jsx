import React from "react";
import { hapticSelect } from "../../utils/haptics";

// Tri-state segmented control: Tự động (app decides) / Bật / Tắt.
// The automation-first replacement for a binary ToggleSwitch — "Tự động" is the
// default and does the smart thing per context (see utils/autoPrefs.js).
// Monochrome, tactile: a sliding pill highlights the active choice.
const OPTIONS = [
  { v: "auto", label: "Tự động", icon: "auto_awesome" },
  { v: "on", label: "Bật", icon: "check" },
  { v: "off", label: "Tắt", icon: "remove" },
];

export default function AutoControl({ value = "auto", onChange, disabled = false, effective }) {
  const idx = Math.max(0, OPTIONS.findIndex((o) => o.v === value));
  return (
    <div className="w-full">
      <div className="relative grid grid-cols-3 rounded-xl bg-foreground/[0.05] p-0.5 ring-1 ring-inset ring-foreground/10">
        {/* Sliding active pill — neon indigo→violet gradient, glows in both themes */}
        <span
          className="pointer-events-none absolute inset-y-0.5 w-[calc(33.333%-1px)] rounded-lg shadow-[0_2px_12px_-2px_rgba(99,102,241,0.6)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(calc(${idx} * (100% + 2px)))`, background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
        />
        {OPTIONS.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              type="button"
              disabled={disabled}
              onClick={() => { hapticSelect(); onChange?.(o.v); }}
              className={`relative z-10 flex items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-black transition-colors active:scale-95 disabled:opacity-40 ${
                active ? "text-white" : "text-muted-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-[12px]">{o.icon}</span>
              {o.label}
            </button>
          );
        })}
      </div>
      {value === "auto" && effective !== undefined && (
        <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-muted-foreground">
          <span className={`h-1 w-1 rounded-full ${effective ? "bg-indigo-500" : "bg-foreground/30"}`} />
          Hugo đang tự {effective ? "bật" : "tắt"} theo ngữ cảnh
        </p>
      )}
    </div>
  );
}
