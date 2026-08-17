import { useTranslation } from "react-i18next";
import { perkLabel, money } from "../storeData";

/** Một vật phẩm tiêu hao (thời lượng nghe, lượt trò chuyện, gia hạn…). */
export default function PackRow({ pack, tint, onBuy }) {
  const { t } = useTranslation();
  const soldOut = pack.stock !== -1 && pack.stock <= 0;

  return (
    <div className="hgs-row">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br text-white ${tint || "from-violet-500 to-purple-600"}`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {pack.icon || "redeem"}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="hgs-ink truncate text-[17px] font-semibold tracking-[-0.01em]">{pack.name}</p>
        <p className="hgs-dim truncate text-[13px]">
          {perkLabel(pack) || pack.description || t("utilities.store.packs.fallback")}
        </p>
      </div>
      <button type="button" disabled={soldOut} onClick={() => onBuy?.(pack)} className="hgs-get">
        {soldOut ? t("utilities.store.packs.soldOut") : money(pack.priceJoy)}
      </button>
    </div>
  );
}
