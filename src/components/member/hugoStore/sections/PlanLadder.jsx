import UtilityAppIcon from "../../utilities/UtilityAppIcon";
import SectionHead from "../ui/SectionHead";
import { GRADIENTS, money, appById } from "../storeData";

const daysLeft = (value) =>
  Math.max(0, Math.ceil((new Date(value) - Date.now()) / 86400000));

/**
 * Ba bậc của một ứng dụng: Dùng thử → Thuê → Sở hữu.
 *
 * Cách sắp xếp là có chủ đích: bậc sở hữu đặt cạnh giá thuê 12 tháng để người
 * đọc tự so, và % tiết kiệm in ra là số server tính từ giá thật (xem
 * appPlanService.planLadder) — không phải con số marketing gõ tay.
 */
export default function PlanLadder({ section, onTrial, onRent, onOwn, onGift, balance }) {
  const { plan, state } = section;
  const app = appById(plan.appId);

  return (
    <section id="hgs-ladder">
      <SectionHead title={section.title} subtitle={section.subtitle} />

      <div className="px-4">
        <div className="hgs-card overflow-hidden">
          {/* Đầu thẻ: app + bậc đang có */}
          <div className="flex items-center gap-3 p-4">
            {app && <UtilityAppIcon app={app} gradient={GRADIENTS[app.color]} size="medium" />}
            <div className="min-w-0 flex-1">
              <p className="hgs-ink truncate text-[16px] font-bold">{plan.label}</p>
              <p className="hgs-dim truncate text-[13.5px]">
                {state.tier === "own" && "Bạn đã sở hữu vĩnh viễn"}
                {state.tier === "rent" && `Đang thuê · còn ${daysLeft(state.expiresAt)} ngày`}
                {state.tier === "trial" && `Đang dùng thử · còn ${daysLeft(state.expiresAt)} ngày`}
                {state.tier === "none" && (app?.tagline || "Chọn một bậc để mở")}
              </p>
            </div>
            {onGift && (
              <button
                type="button"
                onClick={() => onGift(plan.appId)}
                className="hgs-pill min-w-0 gap-1 px-3"
              >
                <span className="material-symbols-outlined text-[17px]">redeem</span>
                Tặng
              </button>
            )}
          </div>

          {/* Bậc 1 — dùng thử */}
          <Tier
            title={`Dùng thử ${plan.trial.days} ngày`}
            note="Không mất JOY. Hết hạn tự khoá."
            price="Miễn phí"
            cta="Bắt đầu"
            state={
              state.tier === "trial" ? "current"
                : state.unlocked ? "hidden"
                  : state.trialUsed ? "used"
                    : "open"
            }
            usedNote="Bạn đã dùng thử rồi"
            onClick={() => onTrial?.(plan.appId)}
          />

          {/* Bậc 2 — thuê tháng */}
          <Tier
            title="Thuê 1 tháng"
            note={state.tier === "rent" ? "Mua thêm sẽ cộng nối vào hạn cũ" : "Gia hạn khi cần, dừng lúc nào cũng được"}
            price={`${money(plan.rent.total)} JOY`}
            cta={state.tier === "rent" ? "Gia hạn" : "Thuê"}
            highlight
            state={state.tier === "own" ? "hidden" : "open"}
            short={balance != null && balance < plan.rent.total ? plan.rent.total - balance : 0}
            onClick={() => onRent?.(plan.appId)}
          />

          {/* Bậc 3 — sở hữu */}
          <Tier
            title="Sở hữu vĩnh viễn"
            note={`Thuê ${plan.own.equivMonths} tháng tốn ${money(plan.own.comparedTo)} JOY`}
            price={`${money(plan.own.total)} JOY`}
            badge={`Tiết kiệm ${plan.own.savePercent}%`}
            cta="Sở hữu"
            state={state.tier === "own" ? "current" : "open"}
            short={balance != null && balance < plan.own.total ? plan.own.total - balance : 0}
            onClick={() => onOwn?.(plan.appId)}
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Một dòng bậc. `state`:
 *   open · current (đang ở bậc này) · used (đã dùng thử) · hidden (không còn ý nghĩa)
 */
function Tier({ title, note, price, badge, cta, highlight, state, short = 0, usedNote, onClick }) {
  if (state === "hidden") return null;

  const disabled = state === "current" || state === "used";

  return (
    <div
      className={`flex items-center gap-3 border-t border-[var(--hgs-line)] p-4 ${
        highlight ? "bg-[var(--hgs-accent-soft)]" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="hgs-ink text-[15px] font-semibold">{title}</p>
          {badge && (
            <span className="rounded-full bg-emerald-500/14 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              {badge}
            </span>
          )}
          {highlight && !badge && (
            <span className="hgs-accent-text rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold dark:bg-white/10">
              Phổ biến
            </span>
          )}
        </div>
        <p className="hgs-dim mt-0.5 text-[13.5px] leading-snug">
          {state === "used" ? usedNote : note}
        </p>
        {short > 0 && (
          <p className="mt-0.5 text-[13px] font-semibold text-rose-500">
            Còn thiếu {money(short)} JOY
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="hgs-ink text-[15px] font-bold tabular-nums">{price}</p>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`mt-1.5 ${highlight ? "hgs-btn hgs-btn--primary h-11 px-4 text-[14.5px]" : "hgs-pill"}`}
        >
          {state === "current" ? "Đang dùng" : state === "used" ? "Đã dùng" : cta}
        </button>
      </div>
    </div>
  );
}
