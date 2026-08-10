import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { API_BASE } from "../../config/apiBase";
import HugoLogo from "../../components/HugoLogo";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";
import { getMemberSession } from "../../services/authSession";

const EMPTY_FORM = {
  fullName: "",
  email: "",
  phone: "",
  projectType: "",
  budget: "unsure",
  timeline: "flexible",
  message: "",
};

const PROJECT_TYPES = [
  { id: "newWebsite", icon: "web" },
  { id: "portfolio", icon: "badge" },
  { id: "improve", icon: "build" },
  { id: "student", icon: "school" },
  { id: "unsure", icon: "help" },
];

const BUDGETS = ["unsure", "underOne", "oneToThree", "threeToEight", "overEight"];
const TIMELINES = ["flexible", "twoWeeks", "oneMonth", "twoMonths"];
const PROMPTS = ["identity", "sales", "mobile", "unsure"];
const TOTAL_STEPS = 4;

const createInitialForm = () => {
  const session = getMemberSession();
  return {
    ...EMPTY_FORM,
    fullName: session?.displayName || "",
    email: session?.email || "",
  };
};

function ChoiceButton({ active, icon, title, description, onClick, wide = false }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-20 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 ${
        wide ? "col-span-2" : ""
      } ${
        active
          ? "border-foreground bg-foreground text-background shadow-[0_10px_28px_hsl(var(--shadow)/0.16)]"
          : "border-border/70 bg-card text-foreground hover:border-foreground/30 hover:bg-muted/55"
      }`}
    >
      <span className="flex items-start gap-3">
        <span
          className={`material-symbols-outlined mt-0.5 text-[20px] ${active ? "text-background" : "text-muted-foreground"}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="min-w-0">
          <strong className="block text-sm leading-snug">{title}</strong>
          {description && (
            <span className={`mt-1 block text-[11px] leading-relaxed ${active ? "text-background/70" : "text-muted-foreground"}`}>
              {description}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold text-foreground">{label}</span>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

export default function BookingContactPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const appliedSearchRef = useRef("");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(createInitialForm);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [donationDeclined, setDonationDeclined] = useState(false);

  useHeadMeta({
    title: t("bookingPage.meta.title"),
    description: t("bookingPage.meta.description"),
    keywords: t("bookingPage.meta.keywords"),
    canonicalUrl: "https://www.hugowishpax.studio/booking",
  });

  const projectOptions = useMemo(
    () => PROJECT_TYPES.map((item) => ({
      ...item,
      title: t(`bookingPage.projectTypes.${item.id}.title`),
      description: t(`bookingPage.projectTypes.${item.id}.desc`),
    })),
    [t],
  );

  const selectedProject = projectOptions.find((item) => item.id === formData.projectType);
  const selectedBudget = t(`bookingPage.budgets.${formData.budget}`);
  const selectedTimeline = t(`bookingPage.timelines.${formData.timeline}`);

  useEffect(() => {
    if (!location.search || appliedSearchRef.current === location.search) return;
    appliedSearchRef.current = location.search;
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("type") !== "student") return;

    const plan = searchParams.get("plan");
    const stack = searchParams.get("stack");
    let planKey = "general";
    if (plan === "bug") planKey = "bug";
    if (plan === "bento") planKey = "bento";
    if (plan === "coursework") {
      planKey = stack === "html" ? "courseworkHtml" : stack === "php" ? "courseworkPhp" : "courseworkReact";
    }

    setFormData((current) => ({
      ...current,
      projectType: "student",
      message: t(`bookingPage.prefill.${planKey}`),
    }));
  }, [location.search, t]);

  useEffect(() => {
    if (!toast.message) return undefined;
    const timer = window.setTimeout(() => setToast({ message: "", type: "" }), 4500);
    return () => window.clearTimeout(timer);
  }, [toast.message]);

  const updateField = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const addPrompt = (prompt) => {
    const suggestion = t(`bookingPage.prompts.${prompt}`);
    setFormData((current) => {
      if (current.message.includes(suggestion)) return current;
      return {
        ...current,
        message: current.message ? `${current.message}\n${suggestion}` : suggestion,
      };
    });
  };

  const goForward = () => {
    if (step === 1 && !formData.projectType) {
      setToast({ message: t("bookingPage.toast.chooseProject"), type: "warning" });
      return;
    }
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
    window.requestAnimationFrame(() => document.getElementById("booking-form-title")?.focus());
  };

  const goBack = () => {
    setStep((current) => Math.max(current - 1, 1));
    window.requestAnimationFrame(() => document.getElementById("booking-form-title")?.focus());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setToast({ message: "", type: "" });

    const structuredMessage = [
      `${t("bookingPage.summary.project")}: ${selectedProject?.title || "—"}`,
      `${t("bookingPage.summary.budget")}: ${selectedBudget}`,
      `${t("bookingPage.summary.timeline")}: ${selectedTimeline}`,
      formData.message ? `${t("bookingPage.summary.notes")}:\n${formData.message.trim()}` : "",
    ].filter(Boolean).join("\n");

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          projectType: formData.projectType,
          budget: formData.budget,
          timeline: formData.timeline,
          notes: formData.message.trim(),
          message: structuredMessage,
        }),
      });

      if (!response.ok) throw new Error(`Booking request failed: ${response.status}`);

      setIsComplete(true);
      setToast({ message: t("bookingPage.toast.success"), type: "success" });
    } catch (error) {
      console.error("Form submission error:", error);
      setToast({ message: t("bookingPage.toast.error"), type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(createInitialForm());
    setStep(1);
    setIsComplete(false);
    setDonationDeclined(false);
  };

  const openDonation = () => {
    window.dispatchEvent(new CustomEvent("open-donation", {
      detail: { name: formData.fullName.trim(), email: formData.email.trim() },
    }));
  };

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12 lg:py-16">
      <HugoNoticeToast
        open={Boolean(toast.message)}
        type={toast.type || "info"}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "" })}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_15%,hsl(var(--primary)/0.08),transparent_27%),radial-gradient(circle_at_88%_80%,hsl(var(--foreground)/0.05),transparent_24%)]" />

      <section className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <HugoLogo className="text-xs font-black tracking-tight" />

          <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            {t("bookingPage.header.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-4xl lg:text-5xl">
            {t("bookingPage.header.title")}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("bookingPage.header.desc")}
          </p>

          <div className="mt-8 space-y-4 border-t border-border/60 pt-6">
            {["brief", "scope", "reply"].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[18px] text-muted-foreground" aria-hidden="true">
                  {item === "brief" ? "edit_note" : item === "scope" ? "fact_check" : "schedule"}
                </span>
                <div>
                  <p className="text-sm font-bold">{t(`bookingPage.expectations.${item}.title`)}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t(`bookingPage.expectations.${item}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-donation"))}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-xs font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">volunteer_activism</span>
            {t("footer.supportServer")}
          </button>
        </aside>

        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-[0_24px_70px_hsl(var(--shadow)/0.1)]">
          <div className="border-b border-border/60 px-5 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {isComplete ? t("bookingPage.progress.complete") : t("bookingPage.progress.label", { step })}
                </p>
                <h2
                  id="booking-form-title"
                  tabIndex="-1"
                  className="mt-1 text-lg font-extrabold tracking-[-0.025em] outline-none sm:text-xl"
                >
                  {isComplete
                    ? t("bookingPage.success.title")
                    : t(`bookingPage.steps.${step}.title`)}
                </h2>
              </div>
              {!isComplete && (
                <div className="flex gap-1.5" aria-hidden="true">
                  {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((item) => (
                    <span
                      key={item}
                      className={`h-1.5 rounded-full transition-all ${item <= step ? "w-8 bg-primary" : "w-4 bg-muted"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {isComplete ? (
            <div className="px-5 py-10 text-center sm:px-8 sm:py-14">
              <span className="material-symbols-outlined text-[52px] text-primary" aria-hidden="true">mark_email_read</span>
              <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t("bookingPage.success.desc")}
              </p>
              {!donationDeclined ? (
                <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-border bg-muted/40 p-4 text-left sm:p-5">
                  <p className="text-sm font-extrabold">{t("bookingPage.success.donateTitle")}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("bookingPage.success.donateDesc")}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" onClick={openDonation} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-3 text-xs font-bold text-background">
                      <span className="material-symbols-outlined text-[18px]">volunteer_activism</span>
                      {t("bookingPage.success.donateYes")}
                    </button>
                    <button type="button" onClick={() => setDonationDeclined(true)} className="min-h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold">
                      {t("bookingPage.success.donateNo")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mx-auto mt-7 max-w-md rounded-xl bg-muted/55 px-4 py-3 text-xs text-muted-foreground">{t("bookingPage.success.donateSkipped")}</p>
              )}
              <button type="button" onClick={resetForm} className="mt-6 min-h-11 rounded-full border border-border px-5 text-sm font-bold transition-colors hover:bg-muted">
                {t("bookingPage.success.another")}
              </button>
            </div>
          ) : step === 1 ? (
            <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
              <fieldset>
                <legend className="text-sm font-extrabold">{t("bookingPage.sections.project")}</legend>
                <p className="mt-1 text-xs text-muted-foreground">{t("bookingPage.sections.projectHint")}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {projectOptions.map((item, index) => (
                    <ChoiceButton
                      key={item.id}
                      active={formData.projectType === item.id}
                      icon={item.icon}
                      title={item.title}
                      description={item.description}
                      wide={index === projectOptions.length - 1}
                      onClick={() => updateField("projectType", item.id)}
                    />
                  ))}
                </div>
              </fieldset>
              <button type="button" onClick={goForward} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">
                {t("bookingPage.actions.continue")}<span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
              <fieldset>
                <legend className="text-sm font-extrabold">{t("bookingPage.sections.budget")}</legend>
                <p className="mt-1 text-xs text-muted-foreground">{t("bookingPage.sections.budgetHint")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {BUDGETS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={formData.budget === item}
                      onClick={() => updateField("budget", item)}
                      className={`min-h-11 rounded-full border px-4 text-xs font-semibold transition-colors ${
                        formData.budget === item
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(`bookingPage.budgets.${item}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-extrabold">{t("bookingPage.sections.timeline")}</legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TIMELINES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={formData.timeline === item}
                      onClick={() => updateField("timeline", item)}
                      className={`min-h-11 rounded-xl border px-3 text-xs font-semibold transition-colors ${
                        formData.timeline === item
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t(`bookingPage.timelines.${item}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <button type="button" onClick={goBack} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold">{t("bookingPage.actions.back")}</button>
                <button type="button" onClick={goForward} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">{t("bookingPage.actions.continue")}<span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>
              </div>
            </div>
          ) : step === 3 ? (
            <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
              <div>
                <label htmlFor="booking-message" className="text-sm font-extrabold">
                  {t("bookingPage.sections.notes")}
                </label>
                <p className="mt-1 text-xs text-muted-foreground">{t("bookingPage.sections.notesHint")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PROMPTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => addPrompt(item)}
                      className="min-h-9 rounded-full bg-muted px-3 text-left text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      + {t(`bookingPage.promptLabels.${item}`)}
                    </button>
                  ))}
                </div>
                <textarea
                  id="booking-message"
                  name="message"
                  value={formData.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  rows="5"
                  maxLength="1600"
                  placeholder={t("bookingPage.form.messagePlaceholder")}
                  className="mt-3 w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <button type="button" onClick={goBack} className="min-h-12 rounded-full border border-border px-5 text-sm font-bold">{t("bookingPage.actions.back")}</button>
                <button type="button" onClick={goForward} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground">{t("bookingPage.actions.continue")}<span className="material-symbols-outlined text-[18px]">arrow_forward</span></button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
              <div className="rounded-2xl bg-muted/65 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("bookingPage.summary.title")}
                </p>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">{t("bookingPage.summary.project")}</dt>
                    <dd className="mt-0.5 font-bold text-foreground">{selectedProject?.title}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("bookingPage.summary.budget")}</dt>
                    <dd className="mt-0.5 font-bold text-foreground">{selectedBudget}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("bookingPage.summary.timeline")}</dt>
                    <dd className="mt-0.5 font-bold text-foreground">{selectedTimeline}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-5">
                <Field label={t("bookingPage.form.nameLabel")}>
                  <input
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    required
                    maxLength="100"
                    value={formData.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    placeholder={t("bookingPage.form.namePlaceholder")}
                    className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                </Field>

                <Field label={t("bookingPage.form.emailLabel")} hint={t("bookingPage.form.emailHint")}>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    maxLength="160"
                    value={formData.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="name@example.com"
                    className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                </Field>

                <Field label={t("bookingPage.form.phoneLabel")} hint={t("bookingPage.form.phoneHint")}>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    minLength="8"
                    maxLength="24"
                    value={formData.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    placeholder={t("bookingPage.form.phonePlaceholder")}
                    className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                </Field>
              </div>

              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <span className="material-symbols-outlined mt-0.5 text-[15px]" aria-hidden="true">lock</span>
                {t("bookingPage.form.disclaimer")}
              </p>

              <div className="grid grid-cols-[auto_1fr] gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="min-h-12 rounded-full border border-border px-5 text-sm font-bold transition-colors hover:bg-muted"
                >
                  {t("bookingPage.actions.back")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-wait disabled:opacity-65"
                >
                  {isSubmitting ? t("bookingPage.actions.sending") : t("bookingPage.actions.submit")}
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    {isSubmitting ? "progress_activity" : "send"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
