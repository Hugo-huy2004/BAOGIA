import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../../lib/notify";
import { useJoyStore } from "../../../stores/joyStore";
import { isVoucherActive } from "./voucherStatus";
import { localeForLanguage } from "../../../i18n/languages";
import { joyText } from "../../../lib/joyDisplay";

const BirthdayWheel = React.lazy(() => import("../BirthdayWheel"));

const apiBase = import.meta.env.VITE_API_URL || "/api";

const dateLabel = (iso        , locale        , t     ) => (
  iso ? new Date(iso).toLocaleDateString(locale) : t("memberPortal.accountHub.perksCopy.noExpiry")
);

function normalizeCodeInput(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 24);
}

function CodeRow({ code, t }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code);
        notify.success(t("memberPortal.accountHub.perksCopy.codeCopied", { defaultValue: "Đã chép mã" }));
      }}
      className="mt-3 flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl bg-muted px-4 text-left transition-colors hover:bg-border"
    >
      <span className="min-w-0 flex-1 truncate font-mono text-[16px] font-bold tracking-wider text-foreground">{code}</span>
      <span className="material-symbols-outlined text-[20px] text-muted-foreground">content_copy</span>
    </button>
  );
}

function VoucherCard({ voucher, dimmed, locale, t, onSelectUtility }) {
  const getActionLabel = () => {
    switch(voucher.scope) {
      case "radio": return t("memberPortal.walletApp.perks.useInRadio", "Dùng tại Radio");
      default: return t("memberPortal.walletApp.perks.useNow", "Dùng ngay");
    }
  };

  const handleUseNow = () => {
    if (voucher.scope === "radio") onSelectUtility?.("radio");
    else onSelectUtility?.("store"); // Default to utility store
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-card p-4 transition-opacity ${dimmed ? "opacity-60" : ""}`}>
      {/* Cắt góc tạo hình vé */}
      <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-r border-border bg-background" />
      <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-l border-border bg-background" />

      <div className="flex items-start gap-4 px-2">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[24px]">
            {voucher.percent ? "percent" : "loyalty"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-bold leading-snug text-foreground">
            {voucher.label || (voucher.percent
              ? t("memberPortal.accountHub.perksCopy.discount", { percent: voucher.percent, defaultValue: `Giảm ${voucher.percent}%` })
              : t("memberPortal.accountHub.perksCopy.perk", "Ưu đãi đặc quyền"))}
          </p>
          <p className="mt-1 text-[13px] font-medium text-muted-foreground">
            {voucher.usedAt
              ? t("memberPortal.accountHub.perksCopy.usedOn", { date: dateLabel(voucher.usedAt, locale, t), defaultValue: `Đã dùng: ${dateLabel(voucher.usedAt, locale, t)}` })
              : t("memberPortal.accountHub.perksCopy.expiresOn", { date: dateLabel(voucher.expiresAt, locale, t), defaultValue: `HSD: ${dateLabel(voucher.expiresAt, locale, t)}` })}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-border/60 pt-4 px-2">
        <CodeRow code={voucher.code} t={t} />
        {voucher.scope !== "legacy_birthday" && !dimmed && (
          <button
            type="button"
            onClick={handleUseNow}
            className="mt-2 w-full rounded-xl bg-primary/10 py-2.5 text-[14px] font-bold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            {getActionLabel()}
          </button>
        )}
      </div>
    </div>
  );
}

export default function JoyRewardsHub({ perks, loading, error, onReload, email, onSelectUtility }) {
  const { t, i18n } = useTranslation();
  const [showWheel, setShowWheel] = useState(false);
  const [showPast, setShowPast] = useState(false);

  // Redeem state
  const [codeInput, setCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const fetchBalance = useJoyStore((s) => s.fetchBalance);
  const setBalance = useJoyStore((s) => s.setBalance);

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

  async function handleSmartRedeem() {
    if (!codeInput.trim() || !email || redeeming) return;
    setRedeeming(true);
    const code = normalizeCodeInput(codeInput);

    try {
      // 1. Thử áp dụng như Gift Code trước
      const r = await fetch(`${apiBase}/joy-gift-cards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      const data = await r.json();

      if (r.ok) {
        setBalance(data.balance);
        notify.success(t("memberPortal.accountHub.redeemCopy.giftSuccess", { amount: data.amount, defaultValue: `Nhận thành công ${data.amount} JOY!` }));
        setCodeInput("");
        onReload?.();
        return;
      }

      throw new Error(data.error || t("memberPortal.accountHub.redeemCopy.giftError", "Mã không hợp lệ hoặc đã hết hạn."));

    } catch (err) {
      notify.error(err.message);
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) {
    return <p className="rounded-2xl border border-border bg-card p-4 text-center text-[14px] text-muted-foreground">{t("memberPortal.accountHub.perksCopy.loading", "Đang tải...")}</p>;
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
          {t("memberPortal.accountHub.perksCopy.retry", "Thử lại")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* 1. KHUNG NHẬP MÃ THÔNG MINH */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">redeem</span>
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-foreground">
              {t("memberPortal.walletApp.rewards.redeemTitle", "Đổi mã nhận quà")}
            </h3>
            <p className="text-[13px] text-muted-foreground">
              {t("memberPortal.walletApp.rewards.redeemHint", "Nhập mã quà tặng, mã ưu đãi hoặc mã giới thiệu")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder={t("memberPortal.walletApp.rewards.enterCode", "Nhập mã tại đây...")}
            className="min-h-[52px] min-w-0 flex-1 rounded-2xl border border-border bg-muted/50 px-4 font-mono text-[16px] text-foreground outline-none focus:border-primary focus:bg-background transition-colors"
          />
          <button
            type="button"
            onClick={handleSmartRedeem}
            disabled={redeeming || !codeInput.trim()}
            className="min-h-[52px] shrink-0 rounded-2xl bg-foreground px-6 text-[15px] font-bold text-background transition-transform active:scale-[0.98] disabled:opacity-45"
          >
            {redeeming ? "…" : t("memberPortal.walletApp.rewards.apply", "Áp dụng")}
          </button>
        </div>
      </section>

      {/* 2. VÒNG QUAY MAY MẮN */}
      {spin && (
        <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]">casino</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-bold text-foreground">
                {t("memberPortal.accountHub.perksCopy.luckySpin", "Vòng quay may mắn")}{spin.tierLabel ? ` · ${spin.tierLabel}` : ""}
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {spin.available
                  ? t("memberPortal.walletApp.rewards.spinReady", "Bạn có 1 lượt quay miễn phí hôm nay! Thử vận may ngay để nhận JOY hoặc Voucher xịn.")
                  : spin.spunThisYear
                    ? t("memberPortal.accountHub.perksCopy.spunThisYear", { amount: spin.lastPrize, defaultValue: `Đã quay: Trúng ${joyText(spin.lastPrize)}` })
                    : spin.birthMonth
                      ? t("memberPortal.accountHub.perksCopy.opensInBirthMonth", { month: new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2024, spin.birthMonth - 1, 1)) })
                      : t("memberPortal.accountHub.perksCopy.addBirthday")}
              </p>
              {spin.available && (
                <button
                  type="button"
                  onClick={() => setShowWheel(true)}
                  className="mt-4 min-h-[44px] rounded-xl bg-primary px-6 text-[14px] font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
                >
                  {t("memberPortal.accountHub.perksCopy.spinNow", "Quay ngay")}
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. KHO VOUCHER / ƯU ĐÃI */}
      <section className="space-y-4 pt-2">
        <h3 className="px-1 text-[18px] font-bold text-foreground">
          {t("memberPortal.walletApp.rewards.myVouchers", "Kho ưu đãi của tôi")}
        </h3>

        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-10 px-4 text-center">
            <span className="material-symbols-outlined text-[48px] text-muted-foreground/50 mb-3">auto_awesome</span>
            <p className="text-[15px] font-semibold text-foreground">
              {t("memberPortal.walletApp.rewards.emptyTitle", "Chưa có ưu đãi nào")}
            </p>
            <p className="mt-1 max-w-[250px] text-[13px] text-muted-foreground">
              {t("memberPortal.walletApp.rewards.emptyDesc", "Thử vòng quay may mắn hoặc mời bạn bè để nhận thêm quà tặng hấp dẫn.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {active.map((v) => <VoucherCard key={v.code} voucher={v} locale={locale} t={t} onSelectUtility={onSelectUtility} />)}
          </div>
        )}
      </section>

      {/* VOUCHER ĐÃ DÙNG */}
      {past.length > 0 && (
        <section className="pt-4">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="mx-auto flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-[13px] font-medium text-muted-foreground hover:bg-muted"
          >
            {t("memberPortal.accountHub.perksCopy.pastVouchers", { count: past.length, defaultValue: `Đã dùng / Hết hạn (${past.length})` })}
            <span className={`material-symbols-outlined text-[18px] transition-transform ${showPast ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {showPast && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {past.map((v) => (
                <VoucherCard key={v.code} voucher={v} dimmed locale={locale} t={t} onSelectUtility={onSelectUtility} />
              ))}
            </div>
          )}
        </section>
      )}


      {showWheel && (
        <React.Suspense fallback={null}>
          <BirthdayWheel
            onClose={() => { setShowWheel(false); onReload?.(); }}
            onAwarded={() => {
              fetchBalance(email, undefined, { force: true });
              onReload?.();
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
}
