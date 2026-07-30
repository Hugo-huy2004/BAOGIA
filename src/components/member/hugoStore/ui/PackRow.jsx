import { perkLabel, money } from "../storeData";

/** Một vật phẩm tiêu hao (thời lượng nghe, lượt trò chuyện, gia hạn…). */
export default function PackRow({ pack, onBuy }) {
  const soldOut = pack.stock !== -1 && pack.stock <= 0;
  return (
    <div className="flex items-center gap-3 p-3.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--hgs-accent-soft)]">
        <span className="material-symbols-outlined hgs-accent-text text-[21px]">
          {pack.icon || "redeem"}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="hgs-ink truncate text-[15px] font-semibold">{pack.name}</p>
        <p className="hgs-dim truncate text-[13.5px]">
          {perkLabel(pack) || pack.description || "Vật phẩm cửa hàng"}
        </p>
      </div>
      <button type="button" disabled={soldOut} onClick={() => onBuy?.(pack)} className="hgs-pill">
        {soldOut ? "Hết" : money(pack.priceJoy)}
      </button>
    </div>
  );
}
