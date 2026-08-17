import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../lib/notify";
import { useJoyStore } from "../../../stores/joyStore";
import { isVoucherActive } from "./voucherStatus";
import { localeForLanguage } from "../../../i18n/languages";
import { joyText } from "../../../lib/joyDisplay";

const BirthdayWheel = React.lazy(() => import("../BirthdayWheel"));

const fmt = (n, locale) => Number(n || 0).toLocaleString(locale);
const dateLabel = (iso, locale, t) => (
  iso ? new Date(iso).toLocaleDateString(locale) : t("memberPortal.accountHub.perksCopy.noExpiry")
);

function CodeRow({ code, t }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code);
        notify.success(t("memberPortal.accountHub.perksCopy.codeCopied"));
      }}
      className="mt-2 flex min-h-[44px] w-full items-center gap-2 rounded-xl bg-muted px-3 text-left transition-colors hover:bg-border"
    >
      <span className="min-w-0 flex-1 truncate font-mono text-[15px] font-semibold text-foreground">{code}</span>
      <span className="material-symbols-outlined text-[20px] text-muted-foreground">content_copy</span>
    </button>
  );
}

function VoucherCard({ voucher, dimmed, locale, t }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 ${dimmed ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-[22px] text-muted-foreground">confirmation_number</span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold leading-snug text-foreground">
            {voucher.label || (voucher.percent
              ? t("memberPortal.accountHub.perksCopy.discount", { percent: voucher.percent })
              : t("memberPortal.accountHub.perksCopy.perk"))}
          </p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {voucher.usedAt
              ? t("memberPortal.accountHub.perksCopy.usedOn", {
                date: dateLabel(voucher.usedAt, locale, t),
              })
              : t("memberPortal.accountHub.perksCopy.expiresOn", {
                date: dateLabel(voucher.expiresAt, locale, t),
              })}
          </p>
        </div>
      </div>
      <CodeRow code={voucher.code} t={t} />
      {/* Mã BDAY-xx đời cũ cộng ngày hạn dùng, đổi ở trang Gói dịch vụ chứ không
          giảm giá dự án — nhãn của nó đã tự nói rõ, đừng chỉ sai đường đặt lịch. */}
      {voucher.scope !== "legacy_birthday" && (
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">
          {t("memberPortal.accountHub.perksCopy.voucherHint")}
        </p>
      )}
    </div>
  );
}

/**
 * "Ưu đãi của tôi" — chỗ đứng cố định cho mọi thứ người dùng đang cầm: voucher
 * hệ thống tặng (quà sinh nhật theo hạng, trúng từ vòng quay), đơn đã mua bằng
 * JOY, và chính lượt quay sinh nhật.
 *
 * Dữ liệu do trang Tài khoản nạp một lượt từ các API JOY hiện có rồi truyền
 * xuống, nên số đếm ở ngoài ví và danh sách trong này không bao giờ lệch nhau.
 */
export default function JoyPerks({ perks, loading, error, onReload, email }) {
  const { t, i18n } = useTranslation();
  const [showWheel, setShowWheel] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const fetchBalance = useJoyStore((s) => s.fetchBalance);

  const orders = perks?.orders || [];
  const spin = perks?.spin;
  const language = i18n.resolvedLanguage || i18n.language || "vi";
  const locale = localeForLanguage(language);

  const [active, past] = useMemo(() => {
    const now = Date.now();
    const list = perks?.vouchers || [];
    return [
      list.filter((v) => isVoucherActive(v, now)),
      list.filter((v) => !isVoucherActive(v, now)),
    ];
  }, [perks?.vouchers]);

  if (loading) {
    return <p className="rounded-2xl border border-border bg-card p-4 text-center text-[14px] text-muted-foreground">{t("memberPortal.accountHub.perksCopy.loading")}</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-center">
        <p className="text-[14px] text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={onReload}
          className="mt-2 min-h-[44px] rounded-xl border border-border px-4 text-[14px] font-medium text-foreground"
        >
          {t("memberPortal.accountHub.perksCopy.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Vòng quay may mắn — trước đây chỉ mở được từ popup tự bật đầu phiên. */}
      {spin && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[22px] text-muted-foreground">casino</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold text-foreground">
                {t("memberPortal.accountHub.perksCopy.luckySpin")}{spin.tierLabel ? ` · ${spin.tierLabel}` : ""}
              </p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {spin.available
                  ? t("memberPortal.accountHub.perksCopy.spinAvailable")
                  : spin.spunThisYear
                    ? t("memberPortal.accountHub.perksCopy.spunThisYear", {
                      amount: joyText(spin.lastPrize),
                    })
                    : spin.birthMonth
                      ? t("memberPortal.accountHub.perksCopy.opensInBirthMonth", {
                        month: new Intl.DateTimeFormat(locale, { month: "long" })
                          .format(new Date(2024, spin.birthMonth - 1, 1)),
                      })
                      : t("memberPortal.accountHub.perksCopy.addBirthday")}
              </p>
            </div>
          </div>
          {spin.available && (
            <button
              type="button"
              onClick={() => setShowWheel(true)}
              className="mt-3 min-h-[44px] w-full rounded-xl bg-primary text-[15px] font-semibold text-white transition-transform active:scale-[0.98]"
            >
              {t("memberPortal.accountHub.perksCopy.spinNow")}
            </button>
          )}
        </div>
      )}

      {/* Voucher đang dùng được */}
      <section className="space-y-2">
        <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("memberPortal.accountHub.perksCopy.activeVouchers", { count: active.length })}
        </h3>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-[14px] text-muted-foreground">
            {t("memberPortal.accountHub.perksCopy.noActiveVouchers")}
          </p>
        ) : (
          active.map((v) => <VoucherCard key={v.code} voucher={v} locale={locale} t={t} />)
        )}
      </section>

      {/* Voucher đã dùng / hết hạn — gấp lại, không xoá khỏi tầm mắt hẳn */}
      {past.length > 0 && (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-border bg-card px-4 text-left"
          >
            <span className="text-[15px] font-medium text-foreground">
              {t("memberPortal.accountHub.perksCopy.pastVouchers", { count: past.length })}
            </span>
            <span className={`material-symbols-outlined text-[20px] text-muted-foreground transition-transform ${showPast ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>
          {showPast && past.map((v) => (
            <VoucherCard key={v.code} voucher={v} dimmed locale={locale} t={t} />
          ))}
        </section>
      )}

      {/* Đơn đã mua bằng JOY */}
      <section className="space-y-2">
        <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("memberPortal.accountHub.perksCopy.purchasedWithJoy", { count: orders.length })}
        </h3>
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-4 text-[14px] text-muted-foreground">
            {t("memberPortal.accountHub.perksCopy.noPurchases")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {orders.map((o, i) => (
              <div key={o.id} className={`p-4 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[22px] text-muted-foreground">redeem</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-snug text-foreground">{o.name}</p>
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString(locale)} · {joyText(o.priceJoy)}
                      {o.status === "fulfilled"
                        ? t("memberPortal.accountHub.perksCopy.fulfilled")
                        : o.status === "cancelled"
                          ? t("memberPortal.accountHub.perksCopy.cancelled")
                          : ""}
                    </p>
                  </div>
                </div>
                <CodeRow code={o.code} t={t} />
              </div>
            ))}
          </div>
        )}
      </section>

      {showWheel && (
        <React.Suspense fallback={null}>
          <BirthdayWheel
            onClose={() => { setShowWheel(false); onReload?.(); }}
            onAwarded={() => {
              // Vòng quay có thể phát cả voucher lẫn JOY — nạp lại cả hai.
              fetchBalance(email, undefined, { force: true });
              onReload?.();
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
}
