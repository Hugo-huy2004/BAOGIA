import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const FIELD_CLASS =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-[#0c0b11] text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground";
const SELECT_CLASS =
  "w-full px-2.5 py-2.5 rounded-xl border border-border bg-white dark:bg-[#0c0b11] text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all text-foreground";

const thisYear = new Date().getFullYear();
const range = (length, map) => Array.from({ length }, (_, index) => map(index));

/**
 * Hỏi ĐÚNG những thông tin hồ sơ đang thiếu — danh sách do server trả về
 * (GET /bios/me/profile-gaps), không phải client tự đoán. Ai thiếu gì hỏi nấy;
 * thêm yêu cầu mới sau này chỉ cần khai báo ở server/utils/profileRequirements.js
 * là modal tự biết hỏi.
 */
export default function OnboardingProfileModal({ email, onDone, onSkip }) {
  const { t } = useTranslation();
  const [missing, setMissing] = useState(null);
  const [values, setValues] = useState({});
  const [referrerCode, setReferrerCode] = useState(() => {
    try {
      return (new URLSearchParams(window.location.search).get("ref") || "").toUpperCase();
    } catch {
      return "";
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${apiBase}/bios/me/profile-gaps`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        const gaps = Array.isArray(data.missing) ? data.missing : [];
        setMissing(gaps);
        // Không thiếu gì và cũng không có mã giới thiệu chờ áp → không việc gì
        // phải chặn người dùng lại.
        if (!gaps.length && !referrerCode) onSkip?.();
      })
      .catch(() => alive && setMissing([]));
    return () => { alive = false; };
  }, [onSkip, referrerCode]);

  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  const isFilled = (field) => {
    if (field.type === "birthDate") return values.birthDay && values.birthMonth && values.birthYear;
    if (field.type === "checkbox") return values[field.key] === true;
    return String(values[field.key] || "").trim();
  };
  const ready = (missing || []).every(isFilled);

  async function handleSubmit() {
    if (!ready) {
      setError(t("memberPortal.onboarding.completeRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const r = await fetch(`${apiBase}/bios/me/onboarding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, referrerCode, ...values }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.onboarding.genericError"));
      // Server vẫn báo thiếu thì giữ modal lại và hỏi tiếp đúng phần còn thiếu.
      if (Array.isArray(data.missing) && data.missing.length) {
        setMissing(data.missing);
        setError(t("memberPortal.onboarding.invalidFields"));
        setSubmitting(false);
        return;
      }
      if (data.referralError) setError(data.referralError);
      onDone?.(data);
    } catch (err) {
      setError(err.message || t("memberPortal.onboarding.genericError"));
      setSubmitting(false);
    }
  }

  if (missing === null) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#15141c] border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-warning/15 dark:bg-warning/10 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl text-foreground" aria-hidden="true">
              {missing.length ? "assignment" : "redeem"}
            </span>
          </div>
          <h2 className="font-black text-lg text-foreground">
            {missing.length ? t("memberPortal.onboarding.missingTitle") : t("memberPortal.onboarding.title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {missing.length
              ? t("memberPortal.onboarding.missingDescription", { count: missing.length })
              : t("memberPortal.onboarding.subtitle")}
          </p>
        </div>

        <div className="space-y-3">
          {missing.map((field) => {
            const label = t(`memberPortal.onboarding.fields.${field.key}.label`, { defaultValue: field.label });
            const hint = t(`memberPortal.onboarding.fields.${field.key}.hint`, { defaultValue: field.hint || "" });
            const checkboxLabel = t(`memberPortal.onboarding.fields.${field.key}.checkboxLabel`, {
              defaultValue: field.checkboxLabel || label,
            });
            return <div key={field.key} className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
                {label} <span className="text-destructive">*</span>
              </label>

              {field.type === "birthDate" ? (
                <div className="grid grid-cols-3 gap-2">
                  <select className={SELECT_CLASS} value={values.birthDay || ""} onChange={(e) => setValue("birthDay", e.target.value)} aria-label={t("memberPortal.onboarding.dayAria")}>
                    <option value="">{t("memberPortal.onboarding.day")}</option>
                    {range(31, (i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className={SELECT_CLASS} value={values.birthMonth || ""} onChange={(e) => setValue("birthMonth", e.target.value)} aria-label={t("memberPortal.onboarding.monthAria")}>
                    <option value="">{t("memberPortal.onboarding.month")}</option>
                    {range(12, (i) => i + 1).map((m) => <option key={m} value={m}>{t("memberPortal.onboarding.monthOption", { month: m })}</option>)}
                  </select>
                  <select className={SELECT_CLASS} value={values.birthYear || ""} onChange={(e) => setValue("birthYear", e.target.value)} aria-label={t("memberPortal.onboarding.yearAria")}>
                    <option value="">{t("memberPortal.onboarding.year")}</option>
                    {range(80, (i) => thisYear - 14 - i).map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              ) : field.type === "checkbox" ? (
                <label className="flex items-start gap-2.5 rounded-2xl border border-border bg-muted/40 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values[field.key] === true}
                    onChange={(e) => setValue(field.key, e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-primary"
                  />
                  <span className="text-[12px] leading-relaxed text-foreground">
                    {checkboxLabel}
                  </span>
                </label>
              ) : (
                <input
                  type={field.type === "tel" ? "tel" : "text"}
                  inputMode={field.type === "tel" ? "tel" : undefined}
                  value={values[field.key] || ""}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  className={FIELD_CLASS}
                />
              )}

              {hint && <p className="ml-1 text-[10px] text-muted-foreground">{hint}</p>}
            </div>
          })}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">
              {t("memberPortal.onboarding.referralLabel")}
            </label>
            <input
              type="text"
              value={referrerCode}
              onChange={(e) => setReferrerCode(e.target.value.toUpperCase())}
              placeholder={t("memberPortal.onboarding.referralPlaceholder")}
              className={`${FIELD_CLASS} font-mono tracking-widest`}
            />
            <p className="text-[10px] text-muted-foreground ml-1">{t("memberPortal.onboarding.referralHint")}</p>
          </div>
        </div>

        {error && <p className="text-xs text-destructive text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting || !ready}
          className="w-full py-3 rounded-xl bg-foreground text-background text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? t("memberPortal.onboarding.submitting") : t("memberPortal.onboarding.submitButton")}
        </button>

        {/* Chỉ cho để sau khi không còn mục bắt buộc nào thiếu. */}
        {!missing.length && onSkip && (
          <button
            onClick={onSkip}
            disabled={submitting}
            className="w-full -mt-1 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {t("memberPortal.onboarding.skipButton")}
          </button>
        )}
      </div>
    </div>
  );
}
