import { useState } from "react";
import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../../i18n/languages";
import { useJoy } from "../../../lib/joyDisplay";

/**
 * Lịch sử các lượt mở trước — mỗi lượt một dòng, chạm vào là mở phiếu đầy đủ.
 *
 * Phiếu bày ĐỦ bốn con số làm nên tổng (mở trước, cộng thêm, tổng cần hoàn, đã
 * hoàn) rồi mới tới từng dòng hoàn. Chỉ hiện tổng thì người dùng không tự đối
 * soát được, mà đây đúng là chỗ người ta mở ra để đối soát.
 *
 * Lượt cũ mở từ trước khi hệ thống ghi sổ tay sẽ thiếu phần tách cộng thêm —
 * chỗ nào không có số thì bỏ hẳn dòng đó, không điền 0 cho đầy.
 */
export default function JoyLaterHistory({ rounds }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const [openAt, setOpenAt] = useState(null);

  const joy = useJoy();
  const day = (value) => new Date(value).toLocaleDateString(locale, {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
  const stamp = (value) => new Date(value).toLocaleString(locale, {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  if (!rounds?.length) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h3 className="text-sm font-bold text-foreground">{t("memberPortal.joyLater.historyTitle")}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{t("memberPortal.joyLater.historyHint")}</p>

      <ul className="mt-3 space-y-2">
        {rounds.map((round) => {
          const open = openAt === round.openedAt;
          return (
            <li key={round.openedAt} className="overflow-hidden rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setOpenAt(open ? null : round.openedAt)}
                aria-expanded={open}
                className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    round.done ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {round.done ? "check" : "hourglass_bottom"}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {round.itemLabel || t("memberPortal.joyLater.advanceLabel")}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {day(round.openedAt)}
                    {" · "}
                    {round.done
                      ? t("memberPortal.joyLater.historyDone")
                      : t("memberPortal.joyLater.historyOpen")}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-bold tabular-nums text-foreground">
                    {joy.text(round.total ?? round.principal)}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground" aria-hidden="true">
                    {open ? "expand_less" : "expand_more"}
                  </span>
                </span>
              </button>

              {open && (
                <div className="border-t border-border bg-muted/40 px-3 py-3">
                  <dl className="space-y-1 text-sm">
                    <Row label={t("memberPortal.joyLater.principalRow")} value={joy.text(round.principal)} />
                    {round.fee != null && (
                      <Row label={t("memberPortal.joyLater.historyAdded")} value={`+${joy.text(round.fee)}`} />
                    )}
                    {round.total != null && (
                      <Row label={t("memberPortal.joyLater.totalRow")} value={joy.text(round.total)} strong />
                    )}
                    {round.installments > 1 && (
                      <Row
                        label={t("memberPortal.joyLater.historySplit")}
                        value={t("memberPortal.joyLater.stepOf", { index: round.installments, of: round.installments })}
                      />
                    )}
                    <Row label={t("memberPortal.joyLater.historyReturned")} value={joy.text(round.returned)} />
                    {round.remaining > 0 && (
                      <Row label={t("memberPortal.joyLater.owing")} value={joy.text(round.remaining)} />
                    )}
                    {round.closedAt && (
                      <Row label={t("memberPortal.joyLater.historyClosedAt")} value={stamp(round.closedAt)} />
                    )}
                  </dl>

                  <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {t("memberPortal.joyLater.historyLines", { count: round.payments.length })}
                  </p>
                  {round.payments.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("memberPortal.joyLater.historyNoLines")}
                    </p>
                  ) : (
                    <ul className="mt-1 divide-y divide-border">
                      {round.payments.map((payment) => (
                        <li key={`${payment.at}-${payment.amount}`} className="flex items-center gap-2 py-1.5">
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] text-foreground">
                              {payment.auto
                                ? t("memberPortal.joyLater.historyAuto")
                                : t("memberPortal.joyLater.historyManual")}
                            </span>
                            <span className="block text-[11.5px] text-muted-foreground">{stamp(payment.at)}</span>
                          </span>
                          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
                            −{joy.text(payment.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "border-t border-dashed border-border pt-1" : ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`tabular-nums ${strong ? "font-black text-foreground" : "font-semibold text-foreground"}`}>
        {value}
      </dd>
    </div>
  );
}
