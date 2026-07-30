import SectionHead from "../ui/SectionHead";
import { money } from "../storeData";

/**
 * Nhắc hạn sắp hết.
 *
 * Chỉ hiện khi hạn thật sắp hết (xem ExpiringSection) và câu chữ nói đúng việc
 * sẽ xảy ra: hết hạn thì khoá lại, không trừ tiền tự động. Không hù "mất hết dữ
 * liệu" — quyền dùng hết chứ dữ liệu vẫn còn.
 */
export default function ExpiringNudge({ section, onRent, onOwn }) {
  return (
    <section>
      <SectionHead
        title="Đang dùng dở"
        subtitle="Hết hạn thì khoá lại, không tự trừ JOY"
      />
      <div className="space-y-2 px-4">
        {section.items.map(({ plan, daysLeft }) => (
          <div key={plan.appId} className="hgs-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-amber-500/14 text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-[22px]">hourglass_bottom</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="hgs-ink text-[15px] font-bold">{plan.label}</p>
                <p className="hgs-dim text-[13.5px]">
                  {plan.state.tier === "trial" ? "Bản dùng thử" : "Gói thuê"}
                  {daysLeft <= 0 ? " · hết hạn hôm nay" : ` · còn ${daysLeft} ngày`}
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => onRent?.(plan.appId)}
                className="hgs-btn hgs-btn--primary h-11 flex-1 text-[14px]"
              >
                {plan.state.tier === "rent" ? "Gia hạn" : "Thuê"} · {money(plan.rent.total)}
              </button>
              <button
                type="button"
                onClick={() => onOwn?.(plan.appId)}
                className="hgs-btn hgs-btn--ghost h-11 flex-1 text-[14px]"
              >
                Sở hữu · tiết kiệm {plan.own.savePercent}%
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
