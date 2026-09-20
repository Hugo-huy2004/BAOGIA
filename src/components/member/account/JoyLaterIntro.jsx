import { useState } from "react";
import { useTranslation } from "react-i18next";
import { applyJoyLater } from "../../../services/joyApi";
import { notify } from "../../../lib/notify";
import { useJoy } from "../../../lib/joyDisplay";

/**
 * JOYlater — màn GIỚI THIỆU và QUY CHẾ, hiện khi chưa có hạn mức.
 *
 * ── VÌ SAO MÀN NÀY TỒN TẠI ──────────────────────────────────────────────────
 * Trước đây người chưa đủ điều kiện chỉ thấy đúng một dòng: "Chưa dùng được
 * JOYlater · Chưa có thu nhập JOY đều đặn". Không nói sản phẩm này là gì, xét
 * theo cái gì, lãi bao nhiêu, trễ thì sao, và phải làm gì để dùng được. Một câu
 * từ chối không kèm đường đi tiếp thì chỉ khiến người ta rời đi.
 *
 * Bố cục theo đúng thứ tự người đọc cần: đây là gì → được gì → trả thế nào →
 * quy chế đầy đủ → nút đăng ký. Quy chế đặt TRƯỚC nút, không giấu sau một liên
 * kết: đây là sản phẩm có lãi và có chế tài khoá tài khoản, người bấm phải đọc
 * được toàn bộ luật chơi mà không phải đi tìm.
 *
 * FAQ dựng bằng <details> của chính trình duyệt — mở/đóng, bàn phím, và trình
 * đọc màn hình đều có sẵn, không cần một dòng JavaScript nào.
 */

const BENEFITS = ["unlock", "cycles", "noHidden"];
const REPAY = ["garnish", "early"];
const FAQ = ["howLimit", "howRate", "whenReview", "ifLate", "canCancel"];

export default function JoyLaterIntro({ status, onApplied }) {
  const { t } = useTranslation();
  const joy = useJoy();
  const [busy, setBusy] = useState(false);

  const credit = status?.credit || {};
  const weeklyPct = ((status?.weeklyRate || 0) * 100).toFixed(2);
  const reviewAt = credit.nextReviewAt
    ? new Date(credit.nextReviewAt).toLocaleString(undefined, {
      weekday: "long", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit",
    })
    : "";

  const handleApply = async () => {
    setBusy(true);
    try {
      const result = await applyJoyLater();
      if (result.limit > 0) {
        notify.success(t("memberPortal.joyLater.applyApproved", { amount: joy.text(result.limit) }));
      } else {
        // Từ chối KHÔNG phải ngõ cụt: nói ngay khi nào được xét lại.
        notify.info(t("memberPortal.joyLater.applyPending", { at: reviewAt }));
      }
      onApplied?.();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const Row = ({ icon, title, body }) => (
    <div className="flex gap-3 rounded-xl bg-muted p-3">
      <span className="material-symbols-outlined shrink-0 text-[20px] text-foreground" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-snug text-foreground">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 px-1 pb-6">
      {/* ── Lời mời ── */}
      <section className="rounded-2xl bg-muted p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {t("memberPortal.joyLater.introEyebrow")}
        </p>
        <h2 className="mt-2 text-[27px] font-bold leading-tight text-foreground">JOYlater</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {t("memberPortal.joyLater.introLead")}
        </p>

        <ul className="mt-4 space-y-2.5">
          {BENEFITS.map((key) => (
            <li key={key} className="flex items-start gap-2.5">
              <span className="material-symbols-outlined mt-px shrink-0 text-[19px] text-foreground" aria-hidden="true">
                check_circle
              </span>
              <span className="text-[14px] leading-relaxed text-foreground">
                {t(`memberPortal.joyLater.benefit.${key}`, {
                  rate: weeklyPct,
                  weeks: (status?.cycleOptions || [1, 2, 4, 8]).join(" · "),
                })}
              </span>
            </li>
          ))}
        </ul>

        {credit.canApply ? (
          <button
            type="button"
            onClick={handleApply}
            disabled={busy}
            className="mt-5 flex min-h-[52px] w-full items-center justify-between rounded-xl bg-foreground px-5 text-left text-background disabled:opacity-50"
          >
            <span>
              <span className="block text-[16px] font-semibold">
                {busy ? t("memberPortal.joyLater.applyBusy") : t("memberPortal.joyLater.applyCta")}
              </span>
              <span className="block text-[12px] opacity-75">{t("memberPortal.joyLater.applyCtaNote")}</span>
            </span>
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">arrow_forward</span>
          </button>
        ) : (
          <div className="mt-5 rounded-xl bg-card p-4">
            <p className="text-[14px] font-semibold text-foreground">
              {t(`memberPortal.joyLater.gate.${credit.status === "barred" ? "barred" : "notYet"}`)}
            </p>
            <ul className="mt-2 space-y-1">
              {(credit.applyBlockedBy?.length ? credit.applyBlockedBy : credit.reasons || []).map((reason) => (
                <li key={reason} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
                  <span className="material-symbols-outlined mt-px text-[16px]" aria-hidden="true">remove</span>
                  {t(`memberPortal.joyLater.reason.${reason}`, t("memberPortal.joyLater.reason.lowScore"))}
                </li>
              ))}
            </ul>
            {credit.status !== "barred" && reviewAt && (
              <p className="mt-3 text-[13px] font-medium text-foreground">
                {t("memberPortal.joyLater.reviewAt", { at: reviewAt })}
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Trả lại thế nào ── */}
      <section>
        <h3 className="mb-2 px-1 text-[17px] font-semibold text-foreground">
          {t("memberPortal.joyLater.repayTitle")}
        </h3>
        <div className="space-y-2">
          {REPAY.map((key) => (
            <Row
              key={key}
              icon={key === "garnish" ? "savings" : "bolt"}
              title={t(`memberPortal.joyLater.repay.${key}.title`, {
                percent: Math.round((status?.garnishRate || 0.4) * 100),
              })}
              body={t(`memberPortal.joyLater.repay.${key}.body`, {
                percent: Math.round((status?.garnishRate || 0.4) * 100),
              })}
            />
          ))}
        </div>
      </section>

      {/* ── Quy chế lãi: ba tầng, kèm trần luật ──
          Bày nguyên bảng chứ không tóm tắt thành "có thể phát sinh phí": người
          sắp vay có quyền biết con số xấu nhất TRƯỚC khi ký, không phải sau. */}
      <section>
        <h3 className="mb-2 px-1 text-[17px] font-semibold text-foreground">
          {t("memberPortal.joyLater.ratesTitle")}
        </h3>
        <div className="overflow-hidden rounded-xl bg-muted">
          {[
            ["inTerm", `${weeklyPct}%/${t("memberPortal.joyLater.week")}`],
            ["overdue", `×${status?.overdueMultiplier ?? 1.5}`],
            ["onInterest", `${Math.round((status?.lateInterestAnnual ?? 0.1) * 100)}%/${t("memberPortal.joyLater.year")}`],
          ].map(([key, value], index) => (
            <div
              key={key}
              className={`flex items-start justify-between gap-3 p-3 ${index ? "border-t border-border" : ""}`}
            >
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-foreground">
                  {t(`memberPortal.joyLater.rate.${key}.title`)}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                  {t(`memberPortal.joyLater.rate.${key}.body`)}
                </p>
              </div>
              <span className="shrink-0 text-[15px] font-bold tabular-nums text-foreground">{value}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 px-1 text-[12px] leading-relaxed text-muted-foreground">
          {t("memberPortal.joyLater.ratesLegal")}
        </p>
      </section>

      {/* ── Câu hỏi thường gặp ── */}
      <section>
        <h3 className="mb-2 px-1 text-[17px] font-semibold text-foreground">
          {t("memberPortal.joyLater.faqTitle")}
        </h3>
        <div className="overflow-hidden rounded-xl bg-muted">
          {FAQ.map((key, index) => (
            <details key={key} className={`group ${index ? "border-t border-border" : ""}`}>
              <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 p-3 text-[14px] font-medium text-foreground">
                {t(`memberPortal.joyLater.faq.${key}.q`)}
                <span
                  className="material-symbols-outlined shrink-0 text-[20px] text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden="true"
                >
                  expand_more
                </span>
              </summary>
              <p className="px-3 pb-3 text-[13px] leading-relaxed text-muted-foreground">
                {t(`memberPortal.joyLater.faq.${key}.a`, {
                  rate: weeklyPct,
                  percent: Math.round((status?.garnishRate || 0.4) * 100),
                })}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
