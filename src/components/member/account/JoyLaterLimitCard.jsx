import { useTranslation } from "react-i18next";
import { useJoy } from "../../../lib/joyDisplay";
import JoyAmount from "../shared/JoyAmount";

/**
 * Thẻ HẠN MỨC — con số đầu tiên người có JOYlater muốn thấy.
 *
 * ── VÌ SAO LÀ MỘT THANH, KHÔNG PHẢI HAI CON SỐ ──────────────────────────────
 * "Còn 3.400 / tổng 5.000" bắt người đọc tự làm phép trừ để biết mình đã dùng
 * bao nhiêu. Một thanh có hai đầu ghi rõ 0 và tổng thì trả lời cả ba câu hỏi
 * (còn bao nhiêu, đã dùng bao nhiêu, trên tổng bao nhiêu) trong một cái liếc.
 *
 * ── HẠN MỨC CÓ THỂ ĐI XUỐNG ─────────────────────────────────────────────────
 * Nó được xét lại mỗi 17:00 thứ Bảy, nên màn này luôn nói mốc xét kế tiếp. Một
 * con số có thể đổi mà không nói khi nào đổi là một con số không ai dám dựa vào.
 */
export default function JoyLaterLimitCard({ status }) {
  const { t } = useTranslation();
  const joy = useJoy();

  const credit = status?.credit || {};
  const limit = Number(credit.limit || 0);
  const used = Number(status?.loan?.outstanding || 0);
  // Không bao giờ âm và không bao giờ quá tổng: lãi dồn có thể đẩy dư nợ vượt
  // hạn mức, và một thanh tràn ra ngoài khung trông như lỗi giao diện.
  const available = Math.max(0, limit - used);
  const usedPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const reviewAt = credit.nextReviewAt
    ? new Date(credit.nextReviewAt).toLocaleString(undefined, {
      weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    })
    : "";

  const trend = credit.history?.length > 1
    ? credit.history[credit.history.length - 1].limit - credit.history[credit.history.length - 2].limit
    : 0;

  return (
    <section className="rounded-2xl bg-muted p-5">
      <p className="text-[13px] font-medium text-muted-foreground">
        {t("memberPortal.joyLater.availableCredit")}
      </p>
      <p className="mt-1 text-[32px] font-bold leading-none tabular-nums text-foreground">
        <JoyAmount value={available} /> <span className="text-[0.62em] font-medium opacity-70">JOY</span>
      </p>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-card">
        <div
          className="h-full rounded-full bg-foreground transition-[width] duration-500"
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] tabular-nums text-muted-foreground">
        <span>{used > 0 ? t("memberPortal.joyLater.usedAmount", { amount: joy.text(used) }) : joy.text(0)}</span>
        <span>{joy.text(limit)}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">percent</span>
          {t("memberPortal.joyLater.rateNow", { rate: ((status?.weeklyRate || 0) * 100).toFixed(2) })}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">workspace_premium</span>
          {t("memberPortal.joyLater.scoreIs", { score: credit.score || 0 })}
          {/* Hạn mức vừa lên hay vừa xuống — nói bằng dấu, không bằng màu, vì
              màu đỏ/xanh ở đây sẽ là màu duy nhất trên cả trang phẳng. */}
          {trend !== 0 && (
            <span className="font-semibold tabular-nums">
              {trend > 0 ? " ↑" : " ↓"}{joy.number(Math.abs(trend))}
            </span>
          )}
        </span>
        {reviewAt && (
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">event_repeat</span>
            {t("memberPortal.joyLater.reviewShort", { at: reviewAt })}
          </span>
        )}
      </div>
    </section>
  );
}
