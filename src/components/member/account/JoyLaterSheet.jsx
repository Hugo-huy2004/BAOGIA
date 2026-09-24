import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getJoyLaterStatus, quoteJoyLater, openJoyLater, payOffJoyLater, payInstallmentJoyLater,
  getJoyLaterHistory,
} from "../../../services/api/modules/joyApi";
import JoyLaterHistory from "./JoyLaterHistory";
import JoyLaterIntro from "./JoyLaterIntro";
import JoyLaterLimitCard from "./JoyLaterLimitCard";
import { notify } from "../../../lib/notify";
import { localeForLanguage } from "../../../i18n/languages";
import { useJoy } from "../../../lib/joyDisplay";
import { CYCLE_DAYS } from "../../../../shared/joyLaterRates";

// JOYlater — vay JOY theo chu kỳ tuần, có hạn mức được xét và có lãi.
//
// ── ĐỔI VỐN TỪ (20/09/2026) ─────────────────────────────────────────────────
// Trước đây màn này cố tình TRÁNH vốn từ tín dụng ("nợ", "lãi", "hạn mức") vì
// JOY không mua được bằng tiền. Nhưng sản phẩm nay có hạn mức được xét, lãi
// tính theo ngày trên ba tầng, và chế tài khoá tài khoản khi quá hạn — gọi nó
// bằng từ khác đi là làm nhẹ đi đúng những điều người dùng cần hiểu rõ nhất.
// Nói thẳng "vay", "lãi", "quá hạn" là tôn trọng người đọc hơn.
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
  const [cycles, setCycles] = useState(1);
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
      quoteJoyLater(Math.round(rawJoy), cycles).then(setQuote).catch(() => setQuote(null));
    }, 350);
    return () => clearTimeout(timer);
  }, [amount, cycles, toRaw]);

  const handleOpen = async () => {
    if (!quote?.withinLimit) return;
    setBusy(true);
    try {
      const next = await openJoyLater({
        amount: quote.principal,
        cycles,
        itemLabel: t("memberPortal.joyLater.advanceLabel"),
        itemKey: "wallet",
      });
      setStatus(next);
      load();
      setAmount("");
      setCycles(1);
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
  const once = quote?.options?.find((option) => option.cycles === 1);
  const splitOptions = quote?.options?.filter((option) => option.cycles > 1) || [];
  const mode = cycles === 1 ? "once" : "split";
  const pctOf = (option) => {
    const principal = Number(option?.principal ?? quote?.principal) || 0;
    return principal ? ((Number(option?.interest) || 0) / principal * 100).toFixed(2) : "0.00";
  };
  const overduePercent = Math.round((Number(status.overdueMultiplier || 1) - 1) * 100);

  // CHƯA CÓ HẠN MỨC → màn giới thiệu + quy chế đầy đủ, không phải một dòng
  // "chưa dùng được". Người chưa đủ điều kiện vẫn cần biết sản phẩm là gì, xét
  // theo cái gì và làm sao để dùng được — nếu không, họ chỉ rời đi.
  //
  // Lưu ý thứ tự: kiểm `loan` TRƯỚC, vì người đang nợ mà hạn mức vừa bị xét về
  // 0 thì vẫn phải thấy khoản nợ của mình, không phải màn mời đăng ký.
  if (!loan && status.credit?.status !== "approved") {
    return <JoyLaterIntro status={status} onApplied={load} />;
  }

  return (
    <div className="space-y-4 px-1 pb-4">
      {/* Thẻ hạn mức: còn bao nhiêu / đã dùng bao nhiêu / trên tổng bao nhiêu */}
      {status.credit?.status === "approved" && <JoyLaterLimitCard status={status} />}

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

          {/* BẢNG BÁO TRƯỚC. Chế tài mà người vay chỉ biết lúc đã mất quyền thì
              không phải chế tài, mà là một cái bẫy. Ở đây nói đúng ba điều:
              đang ở bậc nào, quyền nào đã mất, còn mấy ngày tới bậc kế tiếp. */}
          {loan.enforcement && loan.enforcement.stage !== "ontime" && (
            <div className="mt-3 rounded-xl bg-muted p-3">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <span className="material-symbols-outlined text-[17px]">schedule</span>
                {t(`memberPortal.joyLater.stage.${loan.enforcement.stage}`, {
                  days: loan.enforcement.daysOverdue,
                })}
              </p>
              {loan.enforcement.restrict.length > 0 && (
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {loan.enforcement.restrict
                    .map((item) => t(`memberPortal.joyLater.restrict.${item}`))
                    .join(" · ")}
                </p>
              )}
              {loan.enforcement.next && (
                <p className="mt-1.5 text-[12px] font-medium text-foreground">
                  {t("memberPortal.joyLater.stageNext", {
                    days: loan.enforcement.next.inDays,
                    stage: t(`memberPortal.joyLater.stageName.${loan.enforcement.next.stage}`),
                  })}
                </p>
              )}
            </div>
          )}
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.itemRow")}</dt><dd className="font-semibold">{loan.itemLabel || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.garnishRow")}</dt><dd className="font-semibold">{Math.round(status.garnishRate * 100)}%</dd></div>
            {loan.installments > 1 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("memberPortal.joyLater.dueRow")}</dt>
                <dd className="font-semibold">{day(loan.next.dueAt)}</dd>
              </div>
            )}
            {loan.penalty > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("memberPortal.joyLater.penaltyRow")}</dt>
                <dd className="font-semibold text-rose-500">+{money(loan.penalty)}</dd>
              </div>
            )}
            {loan.installments <= 1 && (
              <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.remainingDaysRow")}</dt><dd className="font-semibold">{t("memberPortal.joyLater.days", { count: loan.remainingDays })}</dd></div>
            )}
          </dl>

          {/* TOÀN BỘ lịch đợt. Chọn chia 4 đợt mà chỉ thấy đợt kế tiếp thì
              không kiểm được mình đã hoàn tới đâu và còn mấy mốc nữa. */}
          {loan.installments > 1 && (loan.steps || []).length > 0 && (
            <ul className="mt-3 space-y-1">
              {loan.steps.map((item) => (
                <li
                  key={item.index}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${
                    item.index === loan.next.index && item.due > 0
                      ? "border-foreground/25 bg-background"
                      : "border-transparent bg-background/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground" aria-hidden="true">
                    {item.due === 0 ? "check_circle" : item.late ? "error" : "schedule"}
                  </span>
                  <span className="flex-1 font-semibold text-foreground">
                    {t("memberPortal.joyLater.stepOf", { index: item.index, of: loan.installments })}
                  </span>
                  <span className="text-xs text-muted-foreground">{day(item.dueAt)}</span>
                  <span className={`font-semibold tabular-nums ${item.due === 0 ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {money(item.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Chia đợt thì cửa hoàn TỪNG ĐỢT chỉ mở đúng ngày — khoá thì nói rõ MỞ
              LÚC NÀO, đừng chỉ làm mờ nút đi. Nhưng THANH KHOẢN (trả hết) mở sớm
              hơn `earlyPayoffDays` ngày: người muốn dứt nợ không phải chờ đúng
              ngày đợt kế tiếp mới được đóng sổ — server đã cho phép ở payOffJoyLater(),
              đây là chỗ giao diện phải theo cho khớp. */}
          {loan.next.locked ? (
            <>
              <button type="button" disabled className="jl-cta">
                {t("memberPortal.joyLater.lockedUntil", { date: day(loan.next.dueAt) })}
              </button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {t("memberPortal.joyLater.lockedNote")}
              </p>
              {!loan.next.payoffLocked && (
                <button
                  type="button"
                  onClick={handlePayOff}
                  disabled={busy}
                  className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-muted-foreground"
                >
                  {t("memberPortal.joyLater.payOffRest", { amount: loan.outstanding })}
                </button>
              )}
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
              ? t("memberPortal.joyLater.lateNote", { percent: overduePercent })
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
          <div className="jl-panel__head">
            <span className="material-symbols-outlined" aria-hidden="true">payments</span>
            <span><b>Mở hạn mức mới</b><small>{t("memberPortal.joyLater.limitFrom", { income: money(status.medianDaily) })}</small></span>
          </div>

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
            className="jl-amount-input"
          />
          <div className="jl-quick-amounts" aria-label="Chọn nhanh số JOY muốn mở trước">
            {[0.25, 0.5, 1].map((ratio) => {
              const value = Math.max(1, Math.round(joy.value(status.limit) * ratio));
              return <button key={ratio} type="button" onClick={() => setAmount(String(value))}>{ratio === 1 ? "Tối đa" : `${Math.round(ratio * 100)}%`}<small>{joy.number(value)}</small></button>;
            })}
          </div>

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
                  onClick={() => setCycles(1)}
                  aria-pressed={mode === "once"}
                  className={`min-h-16 rounded-xl border p-2.5 text-left transition-colors ${
                    mode === "once" ? "jl-plan-option is-selected" : "jl-plan-option"
                  }`}
                >
                  <span className="block text-sm font-bold">{t("memberPortal.joyLater.payOnce")}</span>
                  <span className="mt-0.5 block text-[11.5px] opacity-75">
                    {t("memberPortal.joyLater.payOnceHint", { percent: pctOf(once) })}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCycles((current) => (current > 1 ? current : 2))}
                  aria-pressed={mode === "split"}
                  className={`min-h-16 rounded-xl border p-2.5 text-left transition-colors ${
                    mode === "split" ? "jl-plan-option is-selected" : "jl-plan-option"
                  }`}
                >
                  <span className="block text-sm font-bold">{t("memberPortal.joyLater.paySplit")}</span>
                  <span className="mt-0.5 block text-[11.5px] opacity-75">
                    {t("memberPortal.joyLater.paySplitHint", {
                      max: Math.max(...(status.cycleOptions || [1])),
                      percent: pctOf(splitOptions[0]),
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
                      key={option.cycles}
                      type="button"
                      onClick={() => setCycles(option.cycles)}
                      aria-pressed={cycles === option.cycles}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                        cycles === option.cycles ? "jl-plan-option is-selected" : "jl-plan-option"
                      }`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-black text-foreground">
                        {option.cycles}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-foreground">
                          {t("memberPortal.joyLater.perStepShort", { amount: option.weeklyPayment })}
                        </span>
                        <span className="block text-[11.5px] text-muted-foreground">
                          {t("memberPortal.joyLater.feeShort", { percent: pctOf(option) })}
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
                    percent: overduePercent,
                  })}
                </p>
              )}
            </fieldset>
          )}

          {/* Bảng số TRƯỚC khi đồng ý — phí, tổng nợ, thời gian dự kiến */}
          {quote && (
            <dl className="jl-quote">
              <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.principalRow")}</dt><dd className="font-semibold">{money(quote.principal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.feeRow", { percent: pctOf(quote) })}</dt><dd className="font-semibold">+{money(quote.interest)}</dd></div>
              <div className="flex justify-between border-t border-dashed border-border pt-1"><dt className="font-bold">{t("memberPortal.joyLater.totalRow")}</dt><dd className="font-black">{money(quote.total)}</dd></div>
              {quote.cycles > 1 && Number.isFinite(Number(quote.weeklyPayment)) && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("memberPortal.joyLater.perStepRow")}</dt>
                  <dd className="font-semibold">{money(quote.weeklyPayment)}</dd>
                </div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">{t("memberPortal.joyLater.expectedRow")}</dt><dd className="font-semibold">{t("memberPortal.joyLater.days", { count: (quote.cycles || 1) * CYCLE_DAYS })}</dd></div>
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
