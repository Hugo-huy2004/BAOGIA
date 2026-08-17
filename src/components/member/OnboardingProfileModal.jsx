import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { JOY_DENOMS, denomKey } from "../../../shared/joyCurrency.js";
import { languageLabel, persistAppLanguage } from "../../i18n/languages";

const apiBase = import.meta.env.VITE_API_URL || "/api";

// Quà khi nhập mã người giới thiệu — khớp với phần server cộng vào.
const REFERRAL_BONUS = 10;
const REFERRAL_BIO_DAYS = 15;

const thisYear = new Date().getFullYear();
const range = (length, map) => Array.from({ length }, (_, index) => map(index));

const FIELD_CLASS =
  "w-full min-h-[52px] rounded-2xl border border-border bg-muted/50 px-4 text-[17px] text-foreground outline-none focus:border-foreground/35 focus:bg-card";
const SELECT_CLASS =
  "w-full min-h-[52px] rounded-2xl border border-border bg-muted/50 px-2 text-[16px] text-foreground outline-none focus:border-foreground/35";

/**
 * Hỏi ĐÚNG những thông tin hồ sơ đang thiếu — danh sách do server trả về
 * (GET /bios/me/profile-gaps), không phải client tự đoán. Ai thiếu gì hỏi nấy;
 * thêm yêu cầu mới sau này chỉ cần khai báo ở server/utils/profileRequirements.js
 * là modal tự biết hỏi.
 *
 * MỖI BƯỚC MỘT CÂU HỎI. Bản trước dồn cả 5 mục vào một khung: ngôn ngữ 9 nút,
 * đơn vị 8 nút, ngày sinh 3 ô chọn, điện thoại, mã giới thiệu — một cột dọc dài
 * hơn màn hình, chữ phải bóp xuống 10px mới vừa, và người dùng không biết còn
 * bao nhiêu nữa mới xong. Một câu hỏi một màn thì chữ để to được, nút để 52px
 * được, và có thanh tiến độ nói rõ còn mấy bước.
 */
export default function OnboardingProfileModal({ email, onDone, onSkip }) {
  const { t, i18n } = useTranslation();
  const [missing, setMissing] = useState(null);
  const [values, setValues] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
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

  // Mã giới thiệu là bước CUỐI và không bắt buộc — gộp nó vào danh sách bước để
  // thanh tiến độ đếm đúng, thay vì treo thêm một ô ở đáy mọi bước.
  const steps = useMemo(
    () => [...(missing || []), { key: "referral", type: "referral" }],
    [missing],
  );
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  // Nhãn của các lựa chọn do CLIENT dựng: tên ngôn ngữ viết bằng chính tiếng đó
  // (`languageLabel`) và đơn vị JOY lấy từ shared/joyCurrency. Server chỉ gửi mã
  // xuống, nên không có chuỗi giao diện nào nằm ở backend.
  const optionLabel = (fieldKey, value) => {
    if (fieldKey === "language") return languageLabel(value);
    const denom = JOY_DENOMS[value];
    return denom ? `${denom.code} — ${denom.name}` : value;
  };

  // Chọn ngôn ngữ là đổi giao diện NGAY (thấy liền kết quả, không phải đoán), và
  // gợi ý luôn đơn vị JOY của nước đó — vẫn đổi được, chỉ là mặc định hợp lý.
  const chooseLanguage = (code) => {
    setValues((current) => ({
      ...current,
      language: code,
      joyDenom: current.joyDenom || denomKey(code),
    }));
    persistAppLanguage(code);
    i18n.changeLanguage(code);
  };

  const isFilled = (field) => {
    if (!field) return false;
    if (field.type === "referral") return true;            // không bắt buộc
    if (field.type === "birthDate") return Boolean(values.birthDay && values.birthMonth && values.birthYear);
    if (field.type === "checkbox") return values[field.key] === true;
    return Boolean(String(values[field.key] || "").trim());
  };

  const goNext = () => {
    if (!isFilled(step)) {
      setError(t("memberPortal.onboarding.completeRequired"));
      return;
    }
    setError("");
    if (isLastStep) handleSubmit();
    else setStepIndex((index) => index + 1);
  };

  async function handleSubmit() {
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
      // Server vẫn báo thiếu thì hỏi tiếp đúng phần còn thiếu, quay về bước đầu.
      if (Array.isArray(data.missing) && data.missing.length) {
        setMissing(data.missing);
        setStepIndex(0);
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

  const label = step.type === "referral"
    ? t("memberPortal.onboarding.referralLabel")
    : t(`memberPortal.onboarding.fields.${step.key}.label`, { defaultValue: step.label });
  const hint = step.type === "referral"
    ? t("memberPortal.onboarding.referralHint", { amount: REFERRAL_BONUS, days: REFERRAL_BIO_DAYS })
    : t(`memberPortal.onboarding.fields.${step.key}.hint`, { defaultValue: step.hint || "" });

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] sm:m-4 bg-card shadow-2xl">
        <div className="px-6 pt-4" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)" }}>

          {/* Thanh tiến độ: một vạch cho mỗi bước, vạch đã qua tô đậm. Người dùng
              phải biết còn bao nhiêu nữa mới xong, không thì mỗi bước là một
              cánh cửa không biết dẫn tới đâu. */}
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((item, index) => (
              <span
                key={item.key}
                className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-foreground" : "bg-muted"}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => { setError(""); setStepIndex((index) => index - 1); }}
                disabled={submitting}
                aria-label={t("memberPortal.joy.particle.back")}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back_ios_new</span>
              </button>
            )}
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("memberPortal.onboarding.stepOf", { current: stepIndex + 1, total: steps.length })}
            </p>
          </div>

          <h2 className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight text-foreground">
            {label}
          </h2>
          {hint && <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{hint}</p>}

          {/* ── Nội dung của đúng bước này ── */}
          <div className="mt-5 max-h-[46vh] space-y-2.5 overflow-y-auto">
            {step.type === "choice" && (step.options || []).map((option) => {
              const active = values[step.key] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => (step.key === "language"
                    ? chooseLanguage(option.value)
                    : setValue(step.key, option.value))}
                  aria-pressed={active}
                  className={`flex w-full min-h-[56px] items-center justify-between gap-3 rounded-2xl border px-4 text-left text-[17px] font-semibold transition-colors ${
                    active ? "border-foreground bg-muted text-foreground" : "border-border bg-card text-foreground"
                  }`}
                >
                  <span className="min-w-0 truncate">{optionLabel(step.key, option.value)}</span>
                  <span className="material-symbols-outlined shrink-0 text-[22px] text-muted-foreground">
                    {active ? "radio_button_checked" : "radio_button_unchecked"}
                  </span>
                </button>
              );
            })}

            {step.type === "birthDate" && (
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
            )}

            {step.type === "checkbox" && (
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4">
                <input
                  type="checkbox"
                  checked={values[step.key] === true}
                  onChange={(e) => setValue(step.key, e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-primary"
                />
                <span className="text-[15px] leading-relaxed text-foreground">
                  {t(`memberPortal.onboarding.fields.${step.key}.checkboxLabel`, {
                    defaultValue: step.checkboxLabel || label,
                  })}
                </span>
              </label>
            )}

            {(step.type === "tel" || step.type === "text") && (
              <input
                type={step.type === "tel" ? "tel" : "text"}
                inputMode={step.type === "tel" ? "tel" : undefined}
                value={values[step.key] || ""}
                onChange={(e) => setValue(step.key, e.target.value)}
                placeholder={t("memberPortal.onboarding.phonePlaceholder", { defaultValue: "" })}
                className={FIELD_CLASS}
                autoFocus
              />
            )}

            {step.type === "referral" && (
              <input
                type="text"
                value={referrerCode}
                onChange={(e) => setReferrerCode(e.target.value.toUpperCase())}
                placeholder={t("memberPortal.onboarding.referralPlaceholder")}
                className={`${FIELD_CLASS} font-mono tracking-widest`}
              />
            )}
          </div>

          {error && <p className="mt-3 text-center text-[13px] text-destructive">{error}</p>}

          <button
            onClick={goNext}
            disabled={submitting}
            className="mt-5 w-full min-h-[52px] rounded-2xl bg-foreground text-[17px] font-bold text-background active:scale-[.99] disabled:opacity-50"
          >
            {submitting
              ? t("memberPortal.onboarding.submitting")
              : isLastStep
                ? t("memberPortal.onboarding.submitButton")
                : t("memberPortal.onboarding.next")}
          </button>

          {/* Chỉ cho để sau khi không còn mục bắt buộc nào thiếu. */}
          {!missing.length && onSkip && (
            <button
              onClick={onSkip}
              disabled={submitting}
              className="mt-2 w-full py-2 text-[14px] font-medium text-muted-foreground disabled:opacity-50"
            >
              {t("memberPortal.onboarding.skipButton")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
