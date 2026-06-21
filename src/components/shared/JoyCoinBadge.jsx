import React from "react";

const SIZES = {
  sm: { coin: "w-4 h-4", coinText: "text-[5px]", label: "text-[10px]" },
  md: { coin: "w-6 h-6", coinText: "text-[6px]", label: "text-xs" },
  lg: { coin: "w-9 h-9", coinText: "text-[8px]", label: "text-base" },
};

/**
 * Reusable JOY coin badge — a circular gold coin with "Joy" centered,
 * followed by the numeric amount. Used everywhere a spendable JOY balance
 * is shown (member header, Services tab, store, admin tools).
 */
export default function JoyCoinBadge({ amount, size = "md", className = "" }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <span
        className={`${s.coin} rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-inner shrink-0`}
      >
        <span className={`${s.coinText} font-black text-amber-900 leading-none`}>Joy</span>
      </span>
      {amount != null && (
        <span className={`${s.label} font-mono font-bold text-foreground`}>
          {Number(amount).toLocaleString("vi-VN")} JOY
        </span>
      )}
    </span>
  );
}
