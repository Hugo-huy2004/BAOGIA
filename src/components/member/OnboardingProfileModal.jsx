import { useState } from "react";
import { useTranslation } from "react-i18next";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const SELECT_CLASS = "w-full px-2.5 py-2.5 rounded-xl border border-border bg-white dark:bg-[#0c0b11] text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground";

export default function OnboardingProfileModal({ email, onDone, onSkip, requireBirthDate = false }) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState({ birthDay: "", birthMonth: "", birthYear: "" });
  const [referrerCode, setReferrerCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get("ref") || "").toUpperCase();
    } catch (_) {
      return "";
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const birthReady = !requireBirthDate || (birth.birthDay && birth.birthMonth && birth.birthYear);

  async function handleSubmit() {
    if (!birthReady) {
      setError("Vui lòng chọn đủ ngày, tháng và năm sinh.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${apiBase}/bios/me/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, phone, referrerCode, ...birth }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Có lỗi xảy ra.");
      onDone?.({ ...data, birth: requireBirthDate ? {
        birthDay: Number(birth.birthDay),
        birthMonth: Number(birth.birthMonth),
        birthYear: Number(birth.birthYear),
      } : null });
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141c] border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-warning/15 dark:bg-warning/10 flex items-center justify-center mx-auto text-2xl">🎁</div>
          <h2 className="font-black text-lg text-foreground">{t("memberPortal.onboarding.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("memberPortal.onboarding.subtitle")}</p>
        </div>

        <div className="space-y-3">
          {requireBirthDate && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
                Ngày sinh <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select className={SELECT_CLASS} value={birth.birthDay} onChange={e => setBirth(v => ({ ...v, birthDay: e.target.value }))} aria-label="Ngày sinh">
                  <option value="">Ngày</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className={SELECT_CLASS} value={birth.birthMonth} onChange={e => setBirth(v => ({ ...v, birthMonth: e.target.value }))} aria-label="Tháng sinh">
                  <option value="">Tháng</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
                </select>
                <select className={SELECT_CLASS} value={birth.birthYear} onChange={e => setBirth(v => ({ ...v, birthYear: e.target.value }))} aria-label="Năm sinh">
                  <option value="">Năm</option>
                  {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - 14 - i).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <p className="ml-1 text-[10px] text-muted-foreground">
                Chỉ khai một lần rồi khoá. Dùng để xác định tính năng phù hợp độ tuổi và mở quà tháng sinh nhật.
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
              {t("memberPortal.onboarding.phoneLabel")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t("memberPortal.onboarding.phonePlaceholder")}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-[#0c0b11] text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
              {t("memberPortal.onboarding.referralLabel")}
            </label>
            <input
              type="text"
              value={referrerCode}
              onChange={e => setReferrerCode(e.target.value.toUpperCase())}
              placeholder={t("memberPortal.onboarding.referralPlaceholder")}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-[#0c0b11] text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground"
            />
            <p className="text-[10px] text-zinc-400 ml-1">{t("memberPortal.onboarding.referralHint")}</p>
          </div>
        </div>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !birthReady}
          className="w-full py-3 rounded-xl bg-foreground text-background text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? t("memberPortal.onboarding.submitting") : t("memberPortal.onboarding.submitButton")}
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            disabled={submitting}
            className="w-full -mt-1 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {t("memberPortal.onboarding.skipButton", "Để sau")}
          </button>
        )}
      </div>
    </div>
  );
}
