import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getJoyLaterStatus, payOffJoyLater, payInstallmentJoyLater,
  getJoyLaterHistory,
} from "../../../services/api/modules/joyApi";
import JoyLaterHistory from "./JoyLaterHistory";
import { notify } from "../../../lib/notify";
import { localeForLanguage } from "../../../i18n/languages";
import { useJoy } from "../../../lib/joyDisplay";

// JOYlater — vay JOY theo chu kỳ tuần, có hạn mức được xét và có lãi.
//
// NGỪNG MỞ KHOẢN MỚI 25/10/2026: màn này chỉ còn để người đang nợ trả nốt và xem
// lịch sử. Form vay, màn giới thiệu và thẻ hạn mức đã gỡ; sổ nợ về 0 thì gỡ hẳn.
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
  // Mọi số tiền ra màn hình đều đi qua đơn vị của tài khoản:
  // `money` là số kèm mã đơn vị. Không chỗ nào in "JOY" làm đơn vị nữa.
  const joy = useJoy();
  const { text: money } = joy;
  const day = (value) => (value
    ? new Date(value).toLocaleDateString(locale, { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—");

  const [status, setStatus] = useState(null);
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

  const overduePercent = Math.round((Number(status.overdueMultiplier || 1) - 1) * 100);

  // Không còn nợ: chỉ còn thông báo ngừng mở khoản mới + lịch sử các lượt cũ.
  if (!loan) {
    return (
      <div className="space-y-4 px-1 pb-4">
        <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">{status.limitNote}</p>
        <JoyLaterHistory rounds={history} />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 pb-4">
      {/* Lượt đang nợ: tiến độ + nút trả */}
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

      <JoyLaterHistory rounds={history} />
    </div>
  );
}
