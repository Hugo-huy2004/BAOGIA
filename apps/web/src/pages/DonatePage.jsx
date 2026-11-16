import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import dataApi from "../services/api/modules/dataApi";
import HugoLogo from "../components/HugoLogo";
import { notify } from "../lib/notify";
import { legalDoc } from "../content/legal";
import { API_BASE } from "../config/apiBase";

// Khớp DONATION_MIN_AMOUNT / DONATION_MAX_AMOUNT / DONATION_STEP ở apps/server/routes/payosRoutes.js.
const MIN_AMOUNT = 20000;
const MAX_AMOUNT = 100000000;
const STEP = 10000;
const HIGH_VALUE_REVIEW_AMOUNT = 10000000;
const QUICK_AMOUNTS = [20000, 50000, 100000, 200000];

export default function DonatePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language;
  const navigate = useNavigate();
  const [digits, setDigits] = useState("");
  const [quickAmount, setQuickAmount] = useState(null);
  const [donor, setDonor] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [contact, setContact] = useState({ email: "", transaction: "", message: "" });
  const [contactState, setContactState] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyEndReached, setPolicyEndReached] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [acceptedRefund, setAcceptedRefund] = useState(false);
  const policySectionRef = useRef(null);
  const policyEndRef = useRef(null);
  const amount = quickAmount ?? Number(digits) * 1000;
  const valid = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT && amount % STEP === 0;
  const needsRounding = !quickAmount && Boolean(digits) && Number(digits) % 10 !== 0;
  const needsReviewInfo = amount >= HIGH_VALUE_REVIEW_AMOUNT;
  const donorInfoValid = donor.name.trim().length >= 2
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email.trim())
    && /^[0-9+()\-\s]{8,15}$/.test(donor.phone.trim());

  useEffect(() => {
    if (!policyOpen || !policyEndRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setPolicyEndReached(true);
    }, { root: policySectionRef.current, threshold: 0.5 });
    observer.observe(policyEndRef.current);
    return () => observer.disconnect();
  }, [policyOpen]);

  useEffect(() => {
    if (!policyOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [policyOpen]);

  const pay = async (value) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await dataApi.createDonationLink({
        amount: value,
        termsAccepted: true,
        ...(value >= HIGH_VALUE_REVIEW_AMOUNT && donor),
      });
      navigate(`/pay/${result.data.customLinkId}`);
    } catch (error) {
      notify.error(error?.message || t("paymentGateway.donateFailed"));
      setSubmitting(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (!valid) return;
    setAcceptedRules(false);
    setAcceptedRefund(false);
    setPolicyEndReached(false);
    setPolicyOpen(true);
  };

  const submitContact = async (event) => {
    event.preventDefault();
    setContactState("sending");
    try {
      const response = await fetch(`${API_BASE}/support/donation-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email,
          issue: `${t("paymentGateway.donateContactTopic")}: ${contact.message}\n${t("paymentGateway.donateContactCode")}: ${contact.transaction || "—"}`,
        }),
      });
      if (response.status === 429) {
        setContactState("limited");
        return;
      }
      if (!response.ok) throw new Error("Request failed");
      setContactState("sent");
      setContact({ email: "", transaction: "", message: "" });
    } catch {
      setContactState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f2] px-4 py-5 text-[#171914] md:px-8 md:py-8">
      <main className="mx-auto w-full max-w-6xl">
        <header className="flex items-center justify-between">
          <a href="/" aria-label="Hugo Studio" className="flex items-center gap-3"><HugoLogo className="h-9 w-9" /><span className="text-sm font-bold tracking-tight">Hugo Studio</span></a>
          <span className="hidden rounded-full border border-black/10 bg-white/70 px-4 py-2 text-xs font-semibold text-black/60 md:inline-flex">{t("paymentGateway.khoanUngHoTu")}</span>
        </header>

        <div className="grid items-center gap-6 py-8 md:gap-8 md:py-14 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <section className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#756a23]">{t("paymentGateway.khoanUngHoTu")}</p>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-[-0.045em] md:text-6xl">{t("paymentGateway.donateTitle")}</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-black/65 md:mt-5 md:text-lg">{t("paymentGateway.donateIntro")}</p>
            <div className="mt-6 flex items-start gap-3 border-t border-black/10 pt-4 text-sm leading-6 text-black/60 md:mt-8 md:pt-5">
              <span className="material-symbols-outlined mt-0.5 text-[20px]" aria-hidden="true">verified_user</span>
              <p>{t("paymentGateway.donateSecure")}</p>
            </div>
          </section>

          <form onSubmit={submit} className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(36,33,14,0.45)] md:rounded-[28px] md:p-8">
            <h2 className="text-lg font-bold">{t("paymentGateway.donateChoose")}</h2>
            <p className="mt-1 text-sm text-black/55">{t("paymentGateway.donateFastHint")}</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5 md:mt-6 md:gap-3">
              {QUICK_AMOUNTS.filter((value) => value % STEP === 0).map((value) => (
                <button key={value} type="button" aria-pressed={quickAmount === value} onClick={() => { setDigits(""); setQuickAmount(value); setAcceptedRules(false); setAcceptedRefund(false); }} className={`group flex min-h-14 items-center justify-between rounded-2xl border px-3.5 text-left transition md:min-h-[68px] md:px-4 ${quickAmount === value ? "border-[#8e831b] bg-[#fff7a6] shadow-[inset_0_0_0_1px_#8e831b]" : "border-black/10 bg-[#faf9f4] hover:border-[#b8a930] hover:bg-[#fffbe0]"}`}>
                  <span className="text-lg font-extrabold tracking-tight">{value.toLocaleString("vi-VN")}<span className="ml-1 text-xs font-semibold text-black/45">₫</span></span>
                  <span className="material-symbols-outlined text-[19px] text-black/35 group-hover:text-black" aria-hidden="true">arrow_outward</span>
                </button>
              ))}
            </div>
            <label className="mt-7 block">
              <span className="text-sm font-semibold">{t("paymentGateway.donateAmount")}</span>
              <div className={`mt-2 flex min-h-[58px] items-center rounded-2xl border bg-white px-4 ${needsRounding ? "border-red-500 bg-red-50 text-red-700 focus-within:border-red-500" : "border-black/15 focus-within:border-black"}`}>
                <input inputMode="numeric" aria-describedby="donate-amount-hint" value={digits} onChange={(event) => { setQuickAmount(null); setAcceptedRules(false); setAcceptedRefund(false); setDigits(event.target.value.replace(/\D/g, "").slice(0, 6)); }} placeholder="50" className="min-w-0 flex-1 bg-transparent text-xl font-bold outline-none placeholder:text-black/25" />
                <span className={`text-xl font-bold ${needsRounding ? "text-red-700" : "text-black/60"}`}>.000</span>
                <span className="ml-2 text-sm font-semibold text-black/45">VNĐ</span>
              </div>
            </label>
            <div className="mt-2 flex min-h-5 items-center justify-between gap-2">
              <p id="donate-amount-hint" className={`text-xs ${needsRounding ? "font-semibold text-red-600" : "text-black/50"}`}>{needsRounding ? t("paymentGateway.donateRoundRule") : t("paymentGateway.donateMin")}</p>
              {needsRounding && <button type="button" aria-label={t("paymentGateway.donateRoundNearest")} title={t("paymentGateway.donateRoundNearest")} onClick={() => { setDigits(String(Math.min(MAX_AMOUNT / 1000, Math.round(Number(digits) / 10) * 10))); setAcceptedRules(false); setAcceptedRefund(false); }} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-red-100 px-3 text-red-700 transition hover:bg-red-200" ><span className="material-symbols-outlined text-lg">autorenew</span><span className="text-xs font-bold">{t("paymentGateway.donateRoundButton")}</span></button>}
            </div>
            {needsReviewInfo && <div className="mt-5 rounded-2xl border border-[#e9d95a] bg-[#fffbe0] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold"><span className="material-symbols-outlined" aria-hidden="true">fact_check</span>{t("paymentGateway.donateReviewInfoTitle")}</div>
              <p className="mb-3 text-xs leading-5 text-black/60">{t("paymentGateway.donateReviewInfoBody")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <input autoComplete="name" value={donor.name} onChange={(e) => setDonor({ ...donor, name: e.target.value })} placeholder={t("paymentGateway.donateFullName")} aria-label={t("paymentGateway.donateFullName")} className="min-h-11 rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-black" />
                <input type="email" autoComplete="email" value={donor.email} onChange={(e) => setDonor({ ...donor, email: e.target.value })} placeholder={t("paymentGateway.donateEmail")} aria-label={t("paymentGateway.donateEmail")} className="min-h-11 rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-black" />
                <input type="tel" autoComplete="tel" value={donor.phone} onChange={(e) => setDonor({ ...donor, phone: e.target.value })} placeholder={t("paymentGateway.donatePhone")} aria-label={t("paymentGateway.donatePhone")} className="min-h-11 rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-black sm:col-span-2" />
              </div>
            </div>}
            <button type="submit" disabled={!valid || (needsReviewInfo && !donorInfoValid) || submitting} className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#171914] px-5 text-sm font-bold text-white transition hover:bg-[#33362c] disabled:cursor-not-allowed disabled:opacity-40">
              {t("paymentGateway.donateReviewPolicies")}<span className="material-symbols-outlined text-[19px]" aria-hidden="true">arrow_forward</span>
            </button>
            <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-black/50"><span className="material-symbols-outlined text-base" aria-hidden="true">schedule</span>{t("paymentGateway.donateExpiryNotice")}</p>
          </form>
        </div>

        <section className="relative overflow-hidden rounded-[24px] bg-[#f3e84e] p-5 md:rounded-[28px] md:p-10" aria-label={t("paymentGateway.donateImpactTitle")}>
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/55">Hugo Studio · {t("paymentGateway.donateImpactEyebrow")}</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight md:text-4xl">{t("paymentGateway.donateImpactTitle")}</h2>
              <p className="mt-3 text-sm leading-6 text-black/65 md:text-base">{t("paymentGateway.donateImpactBody")}</p>
            </div>
            <svg viewBox="0 0 220 160" className="mx-auto w-36 md:w-56" role="img" aria-label={t("paymentGateway.donateImpactArt")}>
              <path d="M35 112c18-39 38-59 60-59 17 0 24 12 31 25 8 15 15 25 30 25 12 0 22-8 32-25" fill="none" stroke="#171914" strokeWidth="7" strokeLinecap="round" />
              <path d="M25 107l10 12 11-10M178 70l10 8 10-13" fill="none" stroke="#171914" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="109" cy="38" r="23" fill="#fff" /><path d="M109 26v24m-8-8 8 8 8-8" fill="none" stroke="#171914" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="41" cy="50" r="8" fill="#fff" /><circle cx="182" cy="127" r="10" fill="#fff" />
            </svg>
          </div>
          <div className="mt-5 grid gap-2.5 md:mt-7 md:grid-cols-3 md:gap-3">
            {["donateImpactOne", "donateImpactTwo", "donateImpactThree"].map((key, i) => (
              <div key={key} className="rounded-2xl bg-white/75 p-4 md:p-5">
                <span className="material-symbols-outlined grid size-10 place-items-center rounded-full bg-[#f3e84e] text-[21px]" aria-hidden="true">{["favorite", "handyman", "lightbulb"][i]}</span>
                <h3 className="mt-4 text-sm font-extrabold leading-5">{t(`paymentGateway.${key}Title`)}</h3>
                <p className="mt-1.5 text-sm leading-5 text-black/65">{t(`paymentGateway.${key}`)}</p>
              </div>
            ))}
          </div>
        </section>

        {policyOpen && <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm md:items-center md:p-6 animate-fadeIn" onMouseDown={(event) => { if (event.target === event.currentTarget) setPolicyOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") setPolicyOpen(false); }}>
        <section ref={policySectionRef} role="dialog" aria-modal="true" aria-labelledby="donate-policy-title" className="max-h-[94dvh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-t-[28px] bg-[#f8f7f2] p-5 pb-8 shadow-2xl md:max-h-[88dvh] md:rounded-[28px] md:p-8">
          <div className="sticky top-0 z-10 -mx-5 -mt-5 mb-6 flex items-center justify-between border-b border-black/10 bg-[#f8f7f2] px-5 py-3 md:-mx-8 md:-mt-8 md:px-8">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-black/50">Hugo Studio · {t("paymentGateway.donatePolicyEyebrow")}</span>
            <button type="button" onClick={() => setPolicyOpen(false)} aria-label={t("paymentGateway.closeDialog")} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-black/10"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
          </div>
          <div className="mb-7 max-w-2xl">
            <h2 id="donate-policy-title" className="mt-3 text-2xl font-black tracking-tight md:text-4xl">{legalDoc("donate", lang).title}</h2>
            <p className="mt-3 text-sm leading-6 text-black/60">{t("paymentGateway.donatePolicyIntro")}</p>
          </div>
          <article className="overflow-hidden rounded-[24px] border border-black/10 bg-white divide-y divide-black/10">
            {legalDoc("donate", lang).sections.map((section) => (
              <section key={section.h} className="p-5 md:p-7">
                <h3 className="mb-3 flex items-center gap-2 text-base font-extrabold md:text-lg"><span className="size-2 rounded-full bg-[#d4c52b]" aria-hidden="true" />{section.h}</h3>
                <ul className="space-y-2.5 text-[13px] leading-5 text-black/65 md:text-sm md:leading-6">
                  {section.li.map((text) => <li key={text} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#a59717]" aria-hidden="true" /><span>{text}</span></li>)}
                </ul>
              </section>
            ))}
          </article>

          <div ref={policyEndRef} className="rounded-[24px] border border-black/10 bg-white p-5 md:p-7">
            {policyEndReached ? <>
              <p className="mb-4 text-sm font-bold">{t("paymentGateway.donateConfirmBoth")}</p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl p-3 hover:bg-[#faf9f4]">
                <input type="checkbox" checked={acceptedRules} onChange={(event) => setAcceptedRules(event.target.checked)} className="mt-1 size-5 accent-[#171914]" />
                <span className="text-sm leading-6">{t("paymentGateway.donateAcceptRules")}</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl p-3 hover:bg-[#faf9f4]">
                <input type="checkbox" checked={acceptedRefund} onChange={(event) => setAcceptedRefund(event.target.checked)} className="mt-1 size-5 accent-[#171914]" />
                <span className="text-sm leading-6">{t("paymentGateway.donateAcceptRefund")}</span>
              </label>
              <button type="button" disabled={!acceptedRules || !acceptedRefund || submitting} onClick={() => pay(amount)} className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#171914] px-5 text-sm font-bold text-white transition hover:bg-[#33362c] disabled:cursor-not-allowed disabled:opacity-40">
                {submitting ? t("paymentGateway.dangChuanBiThong") : t("paymentGateway.donateAgreeContinue")}<span className="material-symbols-outlined text-[19px]" aria-hidden="true">arrow_forward</span>
              </button>
            </> : <p className="flex items-center gap-2 text-sm text-black/55"><span className="material-symbols-outlined animate-bounce" aria-hidden="true">south</span>{t("paymentGateway.donateScrollToAccept")}</p>}
          </div>
        </section></div>}
        <details id="donate-contact" className="mt-6 rounded-[24px] border border-black/10 bg-white p-5 md:p-7">
          <summary className="flex cursor-pointer list-none items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#f3e84e]"><span className="material-symbols-outlined" aria-hidden="true">support_agent</span></span>
            <span className="flex-1"><strong className="block text-base">{t("paymentGateway.donateContactTitle")}</strong><span className="text-xs text-black/55">{t("paymentGateway.donateContactHint")}</span></span>
            <span className="material-symbols-outlined text-black/50" aria-hidden="true">expand_more</span>
          </summary>
          <form onSubmit={submitContact} className="mt-5 space-y-3">
            <input type="email" required autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder={t("paymentGateway.donateContactEmail")} aria-label={t("paymentGateway.donateContactEmail")} className="min-h-12 w-full rounded-xl border border-black/15 bg-[#faf9f4] px-4 text-sm outline-none focus:border-black" />
            <input type="text" value={contact.transaction} onChange={(e) => setContact({ ...contact, transaction: e.target.value })} placeholder={t("paymentGateway.donateContactCode")} aria-label={t("paymentGateway.donateContactCode")} className="min-h-12 w-full rounded-xl border border-black/15 bg-[#faf9f4] px-4 text-sm outline-none focus:border-black" />
            <textarea required rows={3} value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} placeholder={t("paymentGateway.donateContactMessage")} aria-label={t("paymentGateway.donateContactMessage")} className="w-full resize-y rounded-xl border border-black/15 bg-[#faf9f4] px-4 py-3 text-sm outline-none focus:border-black" />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-xs text-black/55">{contactState === "sent" ? t("paymentGateway.donateContactSent") : contactState === "limited" ? t("paymentGateway.donateContactLimited") : contactState === "error" ? t("paymentGateway.donateContactError") : contactState === "sending" ? t("paymentGateway.donateContactSending") : ""}</p>
              <button disabled={["sending", "sent", "limited"].includes(contactState)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#171914] px-5 text-sm font-bold text-white disabled:opacity-50"><span className="material-symbols-outlined text-lg" aria-hidden="true">send</span>{t("paymentGateway.donateContactSend")}</button>
            </div>
          </form>
        </details>
        <p className="mt-6 text-center text-[13px] text-black/50">
          <a href="/terms" className="underline">{legalDoc("terms", lang).title}</a>
          {" · "}
          <a href="/privacy-policy" className="underline">{legalDoc("privacy", lang).title}</a>
        </p>
      </main>
    </div>
  );
}
