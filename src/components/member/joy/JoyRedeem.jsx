import { useEffect, useState } from "react";
import { useJoyStore } from "../../../stores/joyStore";
import { useTranslation } from "react-i18next";

const apiBase = import.meta.env.VITE_API_URL || "/api";

/** Bóc mã ra khỏi link mời (…?ref=ABC) rồi chuẩn hoá về chữ in. */
function normalizeReferralInput(value) {
  let next = String(value || "").trim();
  if (next.includes("?") || next.includes("://")) {
    try {
      next = new URL(next, window.location.origin).searchParams.get("ref") || next;
    } catch { /* không phải URL thì giữ nguyên */ }
  }
  return next.toUpperCase().replace(/\s+/g, "").slice(0, 24);
}

/**
 * Đổi mã quà tặng, nhập mã người giới thiệu, và chia sẻ mã của mình. Ba việc
 * cùng một họ "mã", nên ở chung một màn.
 */
export default function JoyRedeem({ email, bio, showToast, onBioUpdate }) {
  const { t } = useTranslation();
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [referrerCode, setReferrerCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [referralApplied, setReferralApplied] = useState(Boolean(bio?.referralApplied));

  const setBalance = useJoyStore((s) => s.setBalance);
  const fetchBalance = useJoyStore((s) => s.fetchBalance);
  const referralCode = useJoyStore((s) => s.referralCode) || bio?.referralCode || "";
  const referralCount = useJoyStore((s) => s.referralCount);
  const setReferralCount = useJoyStore((s) => s.setReferralCount);

  useEffect(() => {
    if (!email) return;
    fetch(`${apiBase}/referral/me?email=${encodeURIComponent(email)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setReferralCount(d.referralCount || 0);
        setReferralApplied(Boolean(d.referralApplied || d.referredBy));
      })
      .catch(() => {});
  }, [email, setReferralCount]);

  async function handleRedeem() {
    if (!giftCode.trim() || !email || redeeming) return;
    setRedeeming(true);
    try {
      const r = await fetch(`${apiBase}/joy-gift-cards/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code: giftCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.accountHub.redeemCopy.giftError"));
      setBalance(data.balance);
      showToast?.(t("memberPortal.accountHub.redeemCopy.giftSuccess", { amount: data.amount }), "success");
      setGiftCode("");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setRedeeming(false);
    }
  }

  async function handleApplyReferral() {
    if (!referrerCode.trim() || !email || applying) return;
    setApplying(true);
    try {
      const r = await fetch(`${apiBase}/referral/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, referrerCode: referrerCode.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.accountHub.redeemCopy.referralError"));
      fetchBalance(email, undefined, { force: true });
      setReferralApplied(true);
      onBioUpdate?.({ referralApplied: true });
      showToast?.(t("memberPortal.accountHub.redeemCopy.referralSuccess", { days: data.bioExtendedDays }), "success");
      setReferrerCode("");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setApplying(false);
    }
  }

  async function shareOwnCode() {
    if (!referralCode) return;
    const link = `${window.location.origin}/?ref=${referralCode}`;
    try {
      if (navigator.share) await navigator.share({ title: "Hugo Studio", text: t("memberPortal.accountHub.redeemCopy.shareText", { code: referralCode }), url: link });
      else {
        await navigator.clipboard.writeText(link);
        showToast?.(t("memberPortal.accountHub.redeemCopy.linkCopied"), "success");
      }
    } catch { /* người dùng huỷ hộp chia sẻ */ }
  }

  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{t("memberPortal.accountHub.redeemCopy.giftCode")}</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
            placeholder={t("memberPortal.accountHub.redeemCopy.enterCode")}
            className="min-h-[48px] min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 font-mono text-[15px] text-foreground outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={handleRedeem}
            disabled={redeeming || !giftCode.trim()}
            className="min-h-[48px] shrink-0 rounded-2xl bg-primary px-5 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-45"
          >
            {redeeming ? "…" : t("memberPortal.accountHub.redeemCopy.redeem")}
          </button>
        </div>
        <p className="px-1 text-[12.5px] text-muted-foreground">{t("memberPortal.accountHub.redeemCopy.giftHint")}</p>
      </section>

      {!referralApplied && (
        <section className="space-y-2">
          <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{t("memberPortal.accountHub.redeemCopy.referralCode")}</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={referrerCode}
              onChange={(e) => setReferrerCode(normalizeReferralInput(e.target.value))}
              placeholder={t("memberPortal.accountHub.redeemCopy.referralPlaceholder")}
              className="min-h-[48px] min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 font-mono text-[15px] uppercase text-foreground outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleApplyReferral}
              disabled={applying || !referrerCode.trim()}
              className="min-h-[48px] shrink-0 rounded-2xl bg-primary px-5 text-[15px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-45"
            >
              {applying ? "…" : t("memberPortal.accountHub.redeemCopy.apply")}
            </button>
          </div>
          <p className="px-1 text-[12.5px] text-muted-foreground">{t("memberPortal.accountHub.redeemCopy.referralHint")}</p>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{t("memberPortal.accountHub.redeemCopy.inviteFriends")}</h3>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-[15px] font-semibold text-foreground">{t("memberPortal.accountHub.redeemCopy.rewardPerFriend")}</p>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{t("memberPortal.accountHub.redeemCopy.referralCount", { count: referralCount })}</p>
          <p className="mt-2 font-mono text-[19px] font-bold tracking-wider text-foreground">{referralCode || "—"}</p>
          <button
            type="button"
            onClick={shareOwnCode}
            disabled={!referralCode}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-muted text-[15px] font-semibold text-foreground transition-colors hover:bg-border disabled:opacity-45"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
            {t("memberPortal.accountHub.redeemCopy.shareLink")}
          </button>
        </div>
      </section>
    </div>
  );
}
