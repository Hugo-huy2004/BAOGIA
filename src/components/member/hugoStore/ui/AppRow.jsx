import UtilityAppIcon from "../../utilities/UtilityAppIcon";
import { GRADIENTS } from "../storeData";

/** Dòng phụ mô tả bậc đang có — chữ do dữ liệu thật quyết định. */
const TIER_NOTE = {
  own: "Đã sở hữu",
  rent: "Đang thuê",
  trial: "Đang dùng thử",
};

export default function AppRow({ app, state, ladder, onOpen, onPlans }) {
  const locked = Boolean(ladder) && !state?.unlocked;
  const note = TIER_NOTE[state?.tier] || app.tagline;

  return (
    <div className="flex items-center gap-3 p-3.5">
      <UtilityAppIcon app={app} gradient={GRADIENTS[app.color]} size="medium" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="hgs-ink truncate text-[15px] font-semibold">{app.label}</p>
          {locked && (
            <span className="material-symbols-outlined hgs-dim shrink-0 text-[14px]">lock</span>
          )}
        </div>
        <p className="hgs-dim truncate text-[13.5px]">{note}</p>
      </div>
      <button
        type="button"
        onClick={() => (locked ? onPlans?.(app.id) : onOpen?.(app.id))}
        className="hgs-pill"
      >
        {locked ? "Xem gói" : "Mở"}
      </button>
    </div>
  );
}
