import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getJoyLaterStatus, quoteJoyLater, openJoyLater, payOffJoyLater, payInstallmentJoyLater,
  getJoyLaterHistory,
} from "../../../services/joyApi";
import JoyLaterHistory from "./JoyLaterHistory";
import { notify } from "../../../lib/notify";
import { localeForLanguage } from "../../../i18n/languages";
import { useJoy } from "../../../lib/joyDisplay";

// JOYlater — mở khoá trước, hoàn lại dần bằng JOY kiếm được.
//
// Vốn từ ở màn này cố tình KHÔNG phải vốn từ tín dụng (không "nợ", "lãi",
// "hạn mức"): JOY không mua được bằng tiền và không đổi ra tiền, nên gọi nó là
// khoản vay vừa sai thực tế vừa mời gọi hiểu lầm. Trong mã nguồn thì các biến
// vẫn là `loan`/`fee` cho khớp cơ sở dữ liệu.
//
// Màn này KHÔNG tự tính con số nào: mức tối đa, phần cộng thêm, số ngày dự kiến
// đều lấy từ `/joy/joylater/quote`, cùng công thức server sẽ ghi vào hồ sơ.
// Client tự tính là con đường chắc chắn dẫn tới "màn hình hứa 200, ví bị trừ 220".
export default function JoyLaterSheet({ onBalanceChange }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  // Mọi số tiền ra màn hình đều đi qua đơn vị của tài khoản — `fmt` là SỐ,
  // `money` là số kèm mã đơn vị. Không chỗ nào in "JOY" làm đơn vị nữa.
  const joy = useJoy();
  const { number: fmt, text: money, toRaw } = joy;
  const day = (value) => (value
    ? new Date(value).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—");

  const [status, setStatus] = useState(null);
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState(1);
  const [quote, setQuote] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await getJoyLaterStatus());
    } catch (error) {
      notify.error(error.message);
    }
    // Lịch sử hỏng thì cũng không được làm hỏng cả màn — nó là phần đọc thêm.
    getJoyLaterHistory().then(setHistory).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // Báo giá theo số vừa nhập theo ĐƠN VỊ HIỂN THỊ CỦA NGUYỜI DÙNG -> chuyển sang JOY gốc
  useEffect(() => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) { setQuote(null); return undefined; }
    const rawJoy = toRaw(value);
    if (!Number.isFinite(rawJoy) || rawJoy <= 0) { setQuote(null); return undefined; }
    const timer = setTimeout(() => {
      quoteJoyLater(Math.round(rawJoy), installments).then(setQuote).catch(() => setQuote(null));
    }, 350);
    return () => clearTimeout(timer);
  }, [amount, installments, toRaw]);

  const handleOpen = async () => {
    if (!quote?.withinLimit) return;
    setBusy(true);
    try {
      const next = await openJoyLater({
        amount: quote.principal,
        installments,
        itemLabel: t("memberPortal.joyLater.advanceLabel"),
        itemKey: "wallet",
      });
      setStatus(next);
      load();
      setAmount("");
      setInstallments(1);
      setQuote(null);
      onBalanceChange?.();
      notify.success(t("memberPortal.joyLater.opened", { amount: money(quote.principal) }));
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePayInstallment = async () => {
    const step = status?.loan?.next;
    const confirmed = await notify.confirm({
      title: t("memberPortal.joyLater.payStepTitle", { index: step?.index, of: step?.of }),
      message: t("memberPortal.joyLater.payStepConfirm", { amount: step?.due }),
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      setStatus(await payInstallmentJoyLater());
      load();
      onBalanceChange?.();
      notify.success(t("memberPortal.joyLater.paidStep", { amount: step?.due }));
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePayOff = async () => {
    const confirmed = await notify.confirm({
      title: t("memberPortal.joyLater.payOffTitle"),
      message: t("memberPortal.joyLater.payOffConfirm", { amount: status?.loan?.outstanding }),
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      setStatus(await payOffJoyLater());
      load();
      onBalanceChange?.();
      notify.success(t("memberPortal.joyLater.paidOff"));
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (!status) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">{t("memberPortal.joyLater.loading")}</p>;
  }

  const loan = status.loan;
  const paid = loan ? loan.principal + loan.fee - loan.outstanding : 0;
  const progress = loan ? Math.round((paid / (loan.principal + loan.fee)) * 100) : 0;

  // Mốc so sánh của cả màn chọn: bảng giá khi hoàn MỘT LẦN. Mọi mức chia đợt đều
  // được nói bằng "cộng thêm bao nhiêu so với cách này".
  const once = quote?.options?.find((option) => option.installments === 1);
  const splitOptions = quote?.options?.filter((option) => option.installments > 1) || [];
  const mode = installments === 1 ? "once" : "split";

  return (
    <div className="space-y-4 px-1 pb-4">
      {/* Đang có lượt chưa hoàn xong: hiện tiến độ, không mời mở trước tiếp */}
      {loan ? (
        <section className="jl-panel is-owing">
          <p className="jl-panel__label">
            {t("memberPortal.joyLater.owing")}
          </p>
          <p className="jl-panel__amount">{money(loan.outstanding)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("memberPortal.joyLater.progress", { paid: paid, total: loan.principal + loan.fee, percent: progress })}
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.itemRow")}</dt><dd className="font-semibold">{loan.itemLabel || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.garnishRow")}</dt><dd className="font-semibold">{Math.round(status.garnishRate * 100)}%</dd></div>
            {loan.installments > 1 && (
              <>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("memberPortal.joyLater.stepRow")}</dt>
                  <dd className="font-semibold">
                    {t("memberPortal.joyLater.stepOf", { index: loan.next.index, of: loan.next.of })}
                    {" · "}
                    {money(loan.next.due)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("memberPortal.joyLater.dueRow")}</dt>
                  <dd className="font-semibold">{day(loan.next.dueAt)}</dd>
                </div>
              </>
            )}
            {loan.penalty > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("memberPortal.joyLater.penaltyRow")}</dt>
                <dd className="font-semibold text-rose-500">+{money(loan.penalty)}</dd>
              </div>
            )}
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.remainingDaysRow")}</dt><dd className="font-semibold">{t("memberPortal.joyLater.days", { count: loan.remainingDays })}</dd></div>
          </dl>

          {/* Chia đợt thì cửa hoàn chỉ mở đúng ngày — cả nút hoàn đợt lẫn nút
              hoàn hết. Khoá thì nói rõ MỞ LÚC NÀO, đừng chỉ làm mờ nút đi. */}
          {loan.next.locked ? (
            <>
              <button type="button" disabled className="jl-cta">
                {t("memberPortal.joyLater.lockedUntil", { date: day(loan.next.dueAt) })}
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {t("memberPortal.joyLater.lockedNote")}
              </p>
            </>
          ) : loan.installments > 1 && loan.next.due > 0 && loan.next.due < loan.outstanding ? (
            <>
              <button type="button" onClick={handlePayInstallment} disabled={busy} className="jl-cta">
                {t("memberPortal.joyLater.payStepNow", { amount: loan.next.due })}
              </button>
              <button
                type="button"
                onClick={handlePayOff}
                disabled={busy}
                className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-muted-foreground"
              >
                {t("memberPortal.joyLater.payOffRest", { amount: loan.outstanding })}
              </button>
            </>
          ) : (
            <button type="button" onClick={handlePayOff} disabled={busy} className="jl-cta">
              {t("memberPortal.joyLater.payOffNow")}
            </button>
          )}
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {loan.installments > 1
              ? t("memberPortal.joyLater.lateNote", { percent: Math.round(status.latePenaltyRate * 100) })
              : t("memberPortal.joyLater.noDeadline")}
          </p>
        </section>
      ) : status.eligible ? (
        <>
        {/* Hướng dẫn 3 bước — trước đây màn này mở ra là một ô nhập số trơ trọi,
            người chưa từng dùng không hiểu mình đang vay cái gì và trả thế nào. */}
        <section className="jl-how">
          <h3>{t("memberPortal.joyLater.howTitle")}</h3>
          <ol>
            {["how1", "how2", "how3"].map((key, index) => (
              <li key={key}>
                <b>{index + 1}</b>
                <span>{t(`memberPortal.joyLater.${key}`, { percent: Math.round(status.garnishRate * 100) })}</span>
              </li>
            ))}
          </ol>
          <p className="jl-how__note">
            <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
            {t("memberPortal.joyLater.noInterest")}
          </p>
        </section>

        <section className="jl-panel">
          <p className="jl-panel__label">
            {t("memberPortal.joyLater.limit")}
          </p>
          <p className="jl-panel__amount">{money(status.limit)}</p>
          <p className="jl-panel__sub">{t("memberPortal.joyLater.limitFrom", { income: money(status.medianDaily) })}</p>

          <label className="mt-4 block text-sm font-semibold text-foreground flex items-center justify-between" htmlFor="joylater-amount">
            <span>Muốn mở trước bao nhiêu {joy.code}?</span>
            <span className="text-xs font-bold text-muted-foreground">(Đơn vị: {joy.code})</span>
          </label>
          <input
            id="joylater-amount"
            type="number"
            inputMode="numeric"
            min="1"
            max={joy.value(status.limit)}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={String(Math.round(joy.value(status.limit)))}
            className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground font-mono font-bold"
          />

          {/* Chọn cách trả — hai bước.
              Bước 1 hỏi "một lần hay theo đợt". Bày thẳng bốn mức như trước thì
              người chỉ muốn trả một lần vẫn phải đọc bảng phí của cả bốn, còn
              chênh lệch giữa "một lần" và "chia đợt" thì lại chìm mất. */}
          {once && (
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold text-foreground">
                {t("memberPortal.joyLater.payModeLabel")}
              </legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInstallments(1)}
                  aria-pressed={mode === "once"}
                  className={`min-h-16 rounded-xl border p-2.5 text-left transition-colors ${
                    mode === "once"
                      ? "border-transparent bg-primary text-on-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <span className="block text-sm font-bold">{t("memberPortal.joyLater.payOnce")}</span>
                  <span className="mt-0.5 block text-[11.5px] opacity-75">
                    {t("memberPortal.joyLater.payOnceHint", { percent: Math.round(once.feeRate * 100) })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setInstallments((current) => (current > 1 ? current : 2))}
                  aria-pressed={mode === "split"}
                  className={`min-h-16 rounded-xl border p-2.5 text-left transition-colors ${
                    mode === "split"
                      ? "border-transparent bg-primary text-on-primary"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  <span className="block text-sm font-bold">{t("memberPortal.joyLater.paySplit")}</span>
                  <span className="mt-0.5 block text-[11.5px] opacity-75">
                    {t("memberPortal.joyLater.paySplitHint", {
                      max: status.maxInstallments,
                      percent: Math.round((splitOptions[0]?.feeRate || 0) * 100),
                    })}
                  </span>
                </button>
              </div>

              {/* Bước 2: chỉ hiện khi đã chọn chia đợt. Mỗi mức nói thẳng nó đắt
                  hơn cách trả một lần bao nhiêu JOY — con số thật do server tính,
                  không phải phần trăm để người đọc tự nhân. */}
              {mode === "split" && (
                <div className="mt-2.5 space-y-1.5">
                  {splitOptions.map((option) => (
                    <button
                      key={option.installments}
                      type="button"
                      onClick={() => setInstallments(option.installments)}
                      aria-pressed={installments === option.installments}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                        installments === option.installments
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-black text-foreground">
                        {option.installments}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-foreground">
                          {t("memberPortal.joyLater.perStepShort", { amount: option.perInstallment })}
                        </span>
                        <span className="block text-[11.5px] text-muted-foreground">
                          {t("memberPortal.joyLater.feeShort", { percent: Math.round(option.feeRate * 100) })}
                          {" · "}
                          {t("memberPortal.joyLater.extraVsOnce", { amount: option.total - once.total })}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("memberPortal.joyLater.installmentsNote")}
              </p>
              {/* Điều kiện nặng nhất của việc chia đợt phải nằm NGAY cạnh nút
                  chọn, không giấu trong tài liệu. */}
              {mode === "split" && (
                <p className="mt-1.5 text-xs font-semibold text-amber-600">
                  {t("memberPortal.joyLater.lateWarn", {
                    percent: Math.round(status.latePenaltyRate * 100),
                  })}
                </p>
              )}
            </fieldset>
          )}

          {/* Bảng số TRƯỚC khi đồng ý — phí, tổng nợ, thời gian dự kiến */}
          {quote && (
            <dl className="mt-3 space-y-1 rounded-xl bg-muted/60 p-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.principalRow")}</dt><dd className="font-semibold">{money(quote.principal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.feeRow", { percent: Math.round(quote.feeRate * 100) })}</dt><dd className="font-semibold">+{money(quote.fee)}</dd></div>
              <div className="flex justify-between border-t border-dashed border-border pt-1"><dt className="font-bold">{t("memberPortal.joyLater.totalRow")}</dt><dd className="font-black">{money(quote.total)}</dd></div>
              {quote.installments > 1 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("memberPortal.joyLater.perStepRow")}</dt>
                  <dd className="font-semibold">{money(quote.schedule[0])}</dd>
                </div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.expectedRow")}</dt><dd className="font-semibold">{t("memberPortal.joyLater.days", { count: quote.expectedDays })}</dd></div>
            </dl>
          )}
          {quote && !quote.withinLimit && (
            <p className="mt-2 text-xs font-semibold text-destructive">{t("memberPortal.joyLater.overLimit")}</p>
          )}

          <button
            type="button"
            onClick={handleOpen}
            disabled={busy || !quote?.withinLimit}
            className="jl-cta"
          >
            {t("memberPortal.joyLater.openNow")}
          </button>
        </section>
        </>
      ) : (
        // Chưa đủ điều kiện: nói THẲNG thiếu cái gì, không nói chung chung.
        <section className="rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-bold text-foreground">{t("memberPortal.joyLater.notEligible")}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            {status.reasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">block</span>
                {t(`memberPortal.joyLater.reason.${reason}`, {
                  days: status.accountDays,
                  minDays: 14,
                  earned: fmt(status.lifetimeEarned),
                })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <JoyLaterHistory rounds={history} />
    </div>
  );
}
