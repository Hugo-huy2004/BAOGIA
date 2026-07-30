import UtilityAppIcon from "../../utilities/UtilityAppIcon";
import { GRADIENTS, money } from "../storeData";

const daysLeft = (value) =>
  Math.max(0, Math.ceil((new Date(value) - Date.now()) / 86400000));

/**
 * Thẻ tâm điểm — đứng yên, đọc một lần là hiểu.
 *
 * Bản trước chạy ba "cảnh" tự đổi mỗi 2.8 giây kiểu story: chữ nhảy khi đang
 * đọc, cả thẻ là một nút "chạm để sang cảnh" nên chạm để mở app hoá ra đổi
 * cảnh, và vuốt dọc từ thẻ làm nó đứng hình luôn (pointercancel không bao giờ
 * trả lại trạng thái chạy). Giờ mọi thông tin của ba cảnh nằm sẵn trên thẻ,
 * chỉ nút mới bấm được.
 */
export default function SpotlightCard({ app, ladder, state, onOpenUtility, onPlans, onGift }) {
  const locked = Boolean(ladder) && !state?.unlocked;

  return (
    <section className="px-4">
      <div className="hgs-violet p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/70">
          Ứng dụng trong ngày
        </p>

        <div className="mt-3 flex items-center gap-3">
          <UtilityAppIcon app={app} gradient={GRADIENTS[app.color]} size="large" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[22px] font-bold leading-tight tracking-[-0.02em]">
              {app.label}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-white/80">
              {app.tagline}
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5">
          {facts(ladder, state).map(fact => (
            <li key={fact} className="flex items-start gap-2 text-[14px] leading-snug text-white/90">
              <span className="material-symbols-outlined mt-px shrink-0 text-[17px] text-white/70">
                check
              </span>
              {fact}
            </li>
          ))}
        </ul>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => (locked ? onPlans?.(app.id) : onOpenUtility?.(app.id))}
            className="hgs-btn h-12 flex-1 bg-white text-[15px] text-[var(--hgs-accent-press)]"
          >
            {locked ? "Xem gói" : "Mở ngay"}
          </button>
          {onGift && ladder && (
            <button
              type="button"
              onClick={() => onGift(app.id)}
              aria-label={`Tặng ${app.label} cho bạn bè`}
              className="hgs-btn h-12 w-12 shrink-0 bg-white/16 px-0 text-white"
            >
              <span className="material-symbols-outlined text-[22px]">redeem</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Ba dòng dữ kiện thay cho ba "cảnh" cũ. Mọi con số là số thật do server tính
 * (giá, % tiết kiệm, ngày còn lại) — không có khan hiếm giả.
 */
function facts(ladder, state) {
  if (!ladder) return ["Miễn phí, mở là dùng — không cần JOY."];

  if (state?.tier === "own") {
    return ["Bạn đã sở hữu vĩnh viễn.", "Không còn hạn sử dụng, không phải gia hạn."];
  }

  const list = [];

  if (state?.tier === "trial" && state.expiresAt) {
    const left = daysLeft(state.expiresAt);
    list.push(left > 0 ? `Bản dùng thử còn ${left} ngày.` : "Bản dùng thử kết thúc hôm nay.");
  } else if (state?.tier === "rent" && state.expiresAt) {
    list.push(`Đang thuê · còn ${daysLeft(state.expiresAt)} ngày.`);
  } else if (!state?.trialUsed) {
    list.push(`Dùng thử ${ladder.trial.days} ngày miễn phí, hết hạn tự khoá.`);
  }

  list.push(`Thuê ${money(ladder.rent.total)} JOY mỗi tháng.`);
  list.push(
    `Sở hữu ${money(ladder.own.total)} JOY — rẻ hơn ${ladder.own.savePercent}% so với thuê ${ladder.own.equivMonths} tháng.`
  );

  return list;
}
