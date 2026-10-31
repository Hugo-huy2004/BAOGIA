import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { API_BASE } from "../../config/apiBase";
import Turnstile, { turnstileEnabled } from "./Turnstile";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/api/core/authSession";
import { validateMessageContent } from "../../utils/contentFilter";

/**
 * Form đặt lịch nằm thẳng trong trang Dịch vụ (25/10/2026), thay trang /booking
 * 8 bước. Mỗi bước chỉ 1–2 câu ngắn; khung có chiều cao cố định nên chuyển bước
 * không làm trang giật dài ngắn. Chỉ hỏi những gì server bắt buộc (tên, email,
 * SĐT) cộng nhóm tuổi (chính sách 14+), nhu cầu và lời nhắn; ngân sách / thời
 * gian để server lấy mặc định, bảo hành và mã ưu đãi trao đổi khi Hugo liên hệ.
 */
const AGE_BANDS = ["adult", "teen", "under14"];
const PROJECT_TYPES = ["newWebsite", "portfolio", "improve", "student", "unsure"];
const STEPS = ["age", "project", "contact", "email", "details"];

const createInitialForm = () => {
  const session = getMemberSession();
  return {
    ageBand: "",
    projectType: "",
    fullName: session?.displayName || "",
    email: session?.email || "",
    phone: "",
    message: "",
  };
};

function Chips({ name, options, value, onPick, labelFor }) {
  return (
    <div className="svc-book__chips" role="radiogroup">
      {options.map((option) => (
        <label key={option} className="svc-book__chip">
          <input type="radio" name={name} value={option} checked={value === option} onChange={() => onPick(option)} />
          <span>{labelFor(option)}</span>
        </label>
      ))}
    </div>
  );
}

export default function ServicesBookingForm() {
  const { t } = useTranslation();
  const location = useLocation();
  const appliedSearchRef = useRef("");
  const bodyRef = useRef(null);
  const [form, setForm] = useState(createInitialForm);
  const [step, setStep] = useState(0);
  const [sending, setSending] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaRound, setCaptchaRound] = useState(0);
  const [done, setDone] = useState(false);

  const stepId = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  // /booking?type=student&plan=… (trang HSSV) chuyển về đây: điền sẵn như trang cũ.
  useEffect(() => {
    if (!location.search || appliedSearchRef.current === location.search) return;
    appliedSearchRef.current = location.search;
    const params = new URLSearchParams(location.search);
    if (params.get("type") !== "student") return;
    const plan = params.get("plan");
    const stack = params.get("stack");
    let planKey = "general";
    if (plan === "bug") planKey = "bug";
    if (plan === "bento") planKey = "bento";
    if (plan === "coursework") planKey = stack === "html" ? "courseworkHtml" : stack === "php" ? "courseworkPhp" : "courseworkReact";
    setForm((current) => ({ ...current, projectType: "student", message: t(`bookingPage.prefill.${planKey}`) }));
  }, [location.search, t]);

  // Sang bước mới thì đưa con trỏ vào ô đầu tiên, không cuộn trang. Lần đầu
  // dựng trang thì thôi — đừng giật focus khỏi chỗ người xem đang đọc.
  const movedRef = useRef(false);
  useEffect(() => {
    if (!movedRef.current) { movedRef.current = true; return; }
    bodyRef.current?.querySelector("input, textarea")?.focus({ preventScroll: true });
  }, [step]);

  // Kiểm tra đúng bước đang đứng; trả về câu báo lỗi hoặc rỗng.
  const stepError = () => {
    if (stepId === "age") {
      if (!form.ageBand) return t("bookingPage.toast.chooseAge");
      if (form.ageBand === "under14") return t("bookingPage.toast.underAge");
    }
    if (stepId === "project" && !form.projectType) return t("bookingPage.toast.chooseProject");
    return "";
  };

  const next = () => {
    const error = stepError();
    if (error) return notify.warning(error);
    // Ô nhập: để trình duyệt chỉ đúng ô sai, bằng ngôn ngữ của máy.
    const inputs = [...(bodyRef.current?.querySelectorAll("input") || [])];
    if (!inputs.every((input) => input.reportValidity())) return undefined;
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  // Chọn nhóm tuổi / nhu cầu là tự sang bước sau — đỡ một lần bấm.
  const pick = (name, value) => {
    update(name, value);
    if (name === "ageBand" && value === "under14") return notify.error(t("bookingPage.toast.underAge"));
    window.setTimeout(() => setStep((current) => (STEPS[current] === (name === "ageBand" ? "age" : "project") ? current + 1 : current)), 260);
  };

  const submit = async () => {
    const validation = validateMessageContent(form.message, t, form.projectType);
    const message = (validation.fixedMessage || form.message).trim();
    if (message !== form.message.trim()) update("message", message);
    if (!validation.isValid) return notify.error(validation.errorMessage);
    if (turnstileEnabled && !captcha) return notify.error(t("bookingPage.toast.captcha"));

    const structuredMessage = [
      `${t("bookingPage.summary.age")}: ${t(`bookingPage.ageBands.${form.ageBand}.title`)}`,
      `${t("bookingPage.summary.project")}: ${t(`bookingPage.projectTypes.${form.projectType}.title`)}`,
      message ? `${t("bookingPage.summary.notes")}:\n${message}` : "",
    ].filter(Boolean).join("\n");

    setSending(true);
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          projectType: form.projectType,
          notes: message,
          message: structuredMessage,
          "cf-turnstile-response": captcha,
        }),
      });
      if (!response.ok) throw new Error(`Booking request failed: ${response.status}`);
      setDone(true);
      notify.success(t("bookingPage.toast.success"));
    } catch (error) {
      console.error("Form submission error:", error);
      notify.error(t("bookingPage.toast.error"));
    } finally {
      setSending(false);
      setCaptchaRound((n) => n + 1);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (sending) return;
    if (isLast) submit();
    else next();
  };

  const restart = () => {
    setForm(createInitialForm());
    setStep(0);
    setDone(false);
  };

  const progress = done ? 1 : (step + 1) / STEPS.length;

  return (
    <form className="svc-book" onSubmit={handleSubmit} aria-labelledby="services-booking-title" noValidate>
      <div className="svc-book__head">
        <p id="services-booking-title" className="svc-type svc-book__count">
          {done ? t("bookingPage.progress.complete") : t("bookingPage.progress.label", { step: step + 1, total: STEPS.length })}
        </p>
        <span className="svc-book__bar" aria-hidden="true"><i style={{ transform: `scaleX(${progress})` }} /></span>
      </div>

      <div ref={bodyRef} key={done ? "done" : stepId} className="svc-book__body" aria-live="polite">
        {done ? (
          <>
            <p className="svc-book__q">{t("bookingPage.success.title")}</p>
            <p className="svc-type svc-book__note">{t("bookingPage.success.desc")}</p>
          </>
        ) : stepId === "age" ? (
          <>
            <p className="svc-book__q">{t("bookingPage.steps.age.title")}</p>
            <Chips name="ageBand" options={AGE_BANDS} value={form.ageBand} onPick={(value) => pick("ageBand", value)} labelFor={(id) => t(`bookingPage.ageBands.${id}.title`)} />
          </>
        ) : stepId === "project" ? (
          <>
            <p className="svc-book__q">{t("bookingPage.steps.project.title")}</p>
            <Chips name="projectType" options={PROJECT_TYPES} value={form.projectType} onPick={(value) => pick("projectType", value)} labelFor={(id) => t(`bookingPage.projectTypes.${id}.title`)} />
          </>
        ) : stepId === "contact" ? (
          <>
            <p className="svc-book__q">{t("bookingPage.steps.contact.title")}</p>
            <label className="svc-book__field">
              <span>{t("bookingPage.form.nameLabel")}</span>
              <input required minLength={2} maxLength={100} autoComplete="name" value={form.fullName} placeholder={t("bookingPage.form.namePlaceholder")} onChange={(event) => update("fullName", event.target.value)} />
            </label>
            <label className="svc-book__field">
              <span>{t("bookingPage.form.phoneLabel")}</span>
              <input required type="tel" pattern="[+\(\)\d\s.\-]{8,24}" maxLength={24} autoComplete="tel" value={form.phone} placeholder={t("bookingPage.form.phonePlaceholder")} onChange={(event) => update("phone", event.target.value)} />
            </label>
          </>
        ) : stepId === "email" ? (
          <>
            <p className="svc-book__q">{t("bookingPage.form.emailLabel")}</p>
            <label className="svc-book__field">
              <span className="sr-only">{t("bookingPage.form.emailLabel")}</span>
              <input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
            </label>
            <p className="svc-type svc-book__note">
              {form.ageBand === "teen" ? t("bookingPage.age.teenContactNote") : t("bookingPage.form.disclaimer")}
            </p>
          </>
        ) : (
          <>
            <p className="svc-book__q">{t("bookingPage.steps.details.title")}</p>
            <label className="svc-book__field svc-book__field--grow">
              <span className="sr-only">{t("bookingPage.steps.details.title")}</span>
              <textarea maxLength={1600} value={form.message} placeholder={t("bookingPage.form.messagePlaceholder")} onChange={(event) => update("message", event.target.value)} />
            </label>
            <Turnstile action="booking" onToken={setCaptcha} resetKey={captchaRound} />
          </>
        )}
      </div>

      <div className="svc-book__nav">
        {done ? (
          <button type="button" className="services-text-link" onClick={restart}>
            {t("bookingPage.success.another")} <ArrowRight aria-hidden="true" />
          </button>
        ) : (
          <>
            {step > 0 ? (
              <button type="button" className="svc-book__back" onClick={() => setStep((current) => current - 1)}>
                <ArrowLeft aria-hidden="true" /> {t("bookingPage.actions.back")}
              </button>
            ) : <span />}
            <button type="submit" className="svc-btn" disabled={sending}>
              {isLast ? (sending ? t("bookingPage.actions.sending") : t("bookingPage.actions.submit")) : t("bookingPage.actions.continue")}
              <ArrowRight aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </form>
  );
}
