import { useTranslation } from "react-i18next";
import { useJoy } from "../../../lib/joyDisplay";

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
    <section className="jl-credit-card">
      <div className="jl-credit-card__top">
        <span>
          <small>JOYlater</small>
          <b>Hạn mức tín dụng JOY</b>
        </span>
        <span className="material-symbols-outlined" aria-hidden="true">account_balance</span>
      </div>
      <p className="jl-credit-card__label">{t("memberPortal.joyLater.availableCredit")}</p>
      <p className="jl-credit-card__amount">{joy.text(available)}</p>
      <div className="jl-credit-card__bar" aria-label={`${usedPct}% đã sử dụng`}>
        <div style={{ width: `${usedPct}%` }} />
      </div>
      <div className="jl-credit-card__split">
        <span><small>Đã dùng</small><b>{used > 0 ? joy.text(used) : joy.text(0)}</b></span>
        <span><small>Tổng hạn mức</small><b>{joy.text(limit)}</b></span>
      </div>
      <div className="jl-credit-card__meta">
        <span><span className="material-symbols-outlined" aria-hidden="true">percent</span>{t("memberPortal.joyLater.rateNow", { rate: ((status?.weeklyRate || 0) * 100).toFixed(2) })}</span>
        <span><span className="material-symbols-outlined" aria-hidden="true">workspace_premium</span>{t("memberPortal.joyLater.scoreIs", { score: credit.score || 0 })}</span>
        {/* Chênh lệch hạn mức là JOY, không phải điểm tín dụng — nối liền vào
            "Điểm 35" thành "Điểm 35 ↑800" đọc như thể điểm tăng 800, vô lý với
            thang điểm ~100. Tách thành mục riêng, kèm đơn vị. */}
        {trend !== 0 && (
          <span>
            <span className="material-symbols-outlined" aria-hidden="true">{trend > 0 ? "trending_up" : "trending_down"}</span>
            {t("memberPortal.joyLater.limitTrend", { amount: `${trend > 0 ? "+" : "−"}${joy.text(Math.abs(trend))}` })}
          </span>
        )}
        {reviewAt && <span><span className="material-symbols-outlined" aria-hidden="true">event_repeat</span>{t("memberPortal.joyLater.reviewShort", { at: reviewAt })}</span>}
      </div>
    </section>
  );
}
