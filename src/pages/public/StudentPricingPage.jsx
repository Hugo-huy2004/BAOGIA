import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import BioThemePicker from "../../components/public/BioThemePicker";
import EduPattern from "../../components/public/EduPattern";
import { useServiceCopy } from "../../hooks/useServiceCopy";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { getMemberSession, loginMemberWithGoogle } from "../../services/api/core/authSession";
import { isEduEmail } from "../../utils/eduEmail";
import { notify } from "../../lib/notify";
import { loadGoogleIdentity } from "../../utils/loadGoogleIdentity";

const EASE = [0.16, 1, 0.3, 1];

function VerifyStep({ state, icon, title, desc }) {
  const mark = {
    done: ["check_circle", "text-emerald-500"],
    loading: ["progress_activity", "animate-spin text-primary"],
    warn: ["pending", "text-amber-500"],
    todo: [icon, "text-muted-foreground"],
  }[state];
  return (
    <li className="flex items-start gap-3 py-4">
      <span className={`material-symbols-outlined mt-0.5 text-[20px] ${mark[1]}`}>{mark[0]}</span>
      <div><p className="text-sm font-extrabold text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p></div>
    </li>
  );
}

export default function StudentPricingPage() {
  const { t } = useTranslation();
  const [session, setSession] = useState(() => getMemberSession());
  const [eduState, setEduState] = useState("idle");
  const [gisReady, setGisReady] = useState(false);
  const [googleConfigError, setGoogleConfigError] = useState("");
  const googleButtonRef = useRef(null);
  const verified = eduState === "edu";

  useHeadMeta({
    title: t("studentPage.meta.title"),
    description: t("studentPage.meta.description"),
    keywords: t("studentPage.meta.keywords"),
    canonicalUrl: "https://www.hugowishpax.studio/student-pricing",
  });

  useEffect(() => {
    const email = session?.email;
    if (!email) { setEduState("idle"); return; }
    let alive = true;
    setEduState("checking");
    isEduEmail(email).then((ok) => { if (alive) setEduState(ok ? "edu" : "pending"); });
    return () => { alive = false; };
  }, [session?.email]);

  const handleGoogleCredential = useCallback(async (response) => {
    if (!response?.credential) { notify.error(t("studentBenefitsPage.toastFail")); return; }
    const { session: next, error } = await loginMemberWithGoogle(response.credential);
    if (!next) { notify.error(error === "network" ? t("studentBenefitsPage.toastNetwork") : t("studentBenefitsPage.toastFail")); return; }
    setSession(next);
  }, [t]);
  const credentialHandler = useRef(handleGoogleCredential);
  credentialHandler.current = handleGoogleCredential;

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    setGisReady(false);
    setGoogleConfigError("");
    if (!clientId || session?.email) return;
    let cancelled = false;
    let timer;
    let timeout;
    let initialized = false;
    let rendered = false;
    const tryInitGoogle = (loadedGoogleId) => {
      if (cancelled || rendered) return;
      const googleId = loadedGoogleId || window.google?.accounts?.id;
      if (!googleId || !googleButtonRef.current) return;
      if (!initialized) {
        googleId.initialize({ client_id: clientId, callback: (res) => credentialHandler.current(res), auto_select: false, cancel_on_tap_outside: true, itp_support: true });
        initialized = true;
        googleId.prompt();
      }
      googleButtonRef.current.innerHTML = "";
      try {
        googleId.renderButton(googleButtonRef.current, { theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline", size: "large", width: 280, text: "continue_with", shape: "pill", logo_alignment: "left" });
      } catch {
        setGoogleConfigError(`Google Sign-In chưa được cấp quyền cho origin ${window.location.origin}.`);
        window.clearInterval(timer);
        return;
      }
      rendered = true;
      setGisReady(true);
      window.clearInterval(timer);
      window.clearTimeout(timeout);
    };
    timer = window.setInterval(tryInitGoogle, 250);
    loadGoogleIdentity().then(tryInitGoogle).catch(() => { if (!cancelled) setGoogleConfigError(`Google Sign-In chưa sẵn sàng cho origin ${window.location.origin}.`); });
    timeout = window.setTimeout(() => {
      if (cancelled) return;
      setGoogleConfigError(`Google Sign-In chưa sẵn sàng cho origin ${window.location.origin}. Hãy thêm origin này vào Google Cloud Console.`);
      window.clearInterval(timer);
    }, 4000);
    tryInitGoogle();
    return () => { cancelled = true; window.clearInterval(timer); window.clearTimeout(timeout); window.google?.accounts?.id?.cancel?.(); };
  }, [session?.email]);

  // Hỏi đáp lấy chung nguồn với trang dịch vụ, khỏi có hai bản trả lời lệch nhau.
  const faq = useServiceCopy("hugo-edu-plus")?.faq || [];

  const BLOCK_ICONS = ["account_circle", "folder_open", "link", "school", "handyman", "qr_code_2"];
  const bioBlocks = t("studentPage.blocks", { returnObjects: true }).map((b, i) => ({ ...b, icon: BLOCK_ICONS[i] }));

  const BENEFIT_ICONS = ["badge", "terminal", "psychology", "groups"];
  const benefits = t("studentPage.benefits", { returnObjects: true }).map((b, i) => ({ ...b, icon: BENEFIT_ICONS[i] }));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_10%_0%,rgba(23,234,217,.15),transparent_30rem),radial-gradient(circle_at_90%_10%,rgba(96,120,234,.17),transparent_32rem),hsl(var(--background))] pb-24 pt-16 text-foreground">
      <section className="relative isolate flex min-h-[78svh] items-center overflow-hidden px-5 py-20 text-center sm:px-8">
        <EduPattern className="-z-10 text-foreground/[.07] dark:text-foreground/[.06]" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, ease: EASE }} className="mx-auto max-w-6xl">
          <p className="mx-auto max-w-xl text-[11px] font-extrabold uppercase tracking-[.2em] text-primary">{t("studentPage.heroEyebrow")}</p>
          <h1 className="mx-auto mt-7 max-w-5xl text-[clamp(3.3rem,8vw,8rem)] font-black leading-[.91] tracking-[-.07em]">{t("studentPage.heroTitle1")}<span className="mt-2 block bg-[linear-gradient(100deg,#17ead9,#6078ea_58%,#a76cf2)] bg-clip-text text-transparent">{t("studentPage.heroTitle2")}</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{t("studentPage.heroLede")}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#verify" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-extrabold text-background">{t("studentPage.heroCta")}<span className="material-symbols-outlined text-[17px]">arrow_downward</span></a>
            <a href="#giao-dien" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-6 text-sm font-extrabold">{t("studentPage.heroCtaAlt")}</a>
          </div>
        </motion.div>
      </section>

      <section id="verify" className="scroll-mt-20 px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
          <motion.div initial={{ opacity: 0, x: -28 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease: EASE }}>
            <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-primary">{t("studentPage.startKicker")}</p>
            <div className="mt-5 flex items-end gap-4"><strong className="text-[clamp(6rem,15vw,11rem)] font-black leading-[.78] tracking-[-.09em]">365</strong><span className="pb-2 text-sm font-extrabold uppercase tracking-[.16em] text-muted-foreground">{t("studentPage.daysUnit")}<br/>{t("studentPage.daysFree")}</span></div>
            <h2 className="mt-8 max-w-2xl text-3xl font-black tracking-[-.045em] sm:text-5xl">{t("studentPage.startTitle")}</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">{t("studentPage.startLede")}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .7, ease: EASE }} className="rounded-[2.3rem] border border-white/75 bg-white/70 p-6 shadow-[0_30px_90px_rgba(58,88,170,.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:p-8">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><span className="material-symbols-outlined">{verified ? "verified" : "school"}</span></span><div><h2 className="text-lg font-black">{t("studentPage.verifyTitle")}</h2><p className="text-xs text-muted-foreground">{t("studentPage.verifySub")}</p></div></div>
            <ul className="mt-5 divide-y divide-border/70">
              <VerifyStep state={session?.email ? "done" : "todo"} icon="account_circle" title={t("studentPage.step1")} desc={session?.email || t("studentPage.step1Desc")} />
              <VerifyStep state={eduState === "checking" ? "loading" : verified ? "done" : eduState === "pending" ? "warn" : "todo"} icon="alternate_email" title={t("studentPage.step2")} desc={verified ? t("studentPage.step2Ok") : eduState === "pending" ? t("studentPage.step2Pending") : t("studentPage.step2Todo")} />
              <VerifyStep state={verified ? "done" : eduState === "pending" ? "warn" : "todo"} icon="redeem" title={t("studentPage.step3")} desc={t("studentPage.step3Desc")} />
            </ul>
            <div className="mt-5 border-t border-border/70 pt-5">
              {!session?.email && <div className="flex flex-col items-center gap-3"><div ref={googleButtonRef} className="flex min-h-[44px] justify-center"/><button type="button" onClick={() => { const googleId = window.google?.accounts?.id; if (!googleId) return; googleId.cancel(); setTimeout(() => googleId.prompt(), 100); }} className="w-full rounded-full border border-border py-3 text-xs font-extrabold hover:bg-muted">{t("studentPage.pickAccount")}</button>{googleConfigError && <p className="text-center text-[10px] leading-5 text-amber-600">{googleConfigError}</p>}<p className="text-[10px] text-muted-foreground">{gisReady ? t("studentPage.gisReady") : t("studentPage.gisLoading")}</p></div>}
              {verified && <Link to="/member" className="block w-full rounded-full bg-foreground py-3 text-center text-xs font-extrabold text-background">{t("studentPage.openBenefits")}</Link>}
              {eduState === "pending" && <div className="space-y-3"><p className="text-xs leading-5 text-muted-foreground">{t("studentPage.pendingNote")}</p><Link to="/booking?type=student&plan=verify" className="block w-full rounded-full border border-border py-3 text-center text-xs font-extrabold">{t("studentPage.pendingCta")}</Link></div>}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="giao-dien" className="relative isolate scroll-mt-20 overflow-hidden px-5 py-20 sm:px-8">
        <EduPattern className="-z-10 text-foreground/[.07] dark:text-foreground/[.06]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-primary">{t("studentPage.themeKicker")}</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(2.4rem,5.5vw,4.5rem)] font-black leading-[.98] tracking-[-.055em]">{t("studentPage.themeTitle1")}<br className="hidden sm:block" /> {t("studentPage.themeTitle2")}</h2>
          <div className="mt-14">
            <BioThemePicker />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-primary">{t("studentPage.blocksKicker")}</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(2.4rem,5.5vw,4.5rem)] font-black leading-[.98] tracking-[-.055em]">{t("studentPage.blocksTitle")}</h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {bioBlocks.map((block) => (
              <article key={block.title} className="bg-card p-7">
                <span className="material-symbols-outlined grid size-11 place-items-center rounded-2xl bg-muted text-foreground">{block.icon}</span>
                <h3 className="mt-5 text-lg font-black tracking-[-.03em]">{block.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-16 bg-[linear-gradient(145deg,#10172b,#1d315a)] px-5 py-24 text-white sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-[#17ead9]">{t("studentPage.insideKicker")}</p>
          <h2 className="mt-5 max-w-4xl text-[clamp(3rem,7vw,6.5rem)] font-black leading-[.94] tracking-[-.065em]">{t("studentPage.insideTitle")}</h2>
          <div className="mt-16 divide-y divide-white/12 border-y border-white/12">
            {benefits.map((benefit, index) => <motion.article key={benefit.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .6, delay: index * .05, ease: EASE }} className="grid gap-4 py-8 sm:grid-cols-[64px_1fr_1fr] sm:items-center sm:gap-8"><span className="material-symbols-outlined text-4xl text-[#17ead9]">{benefit.icon}</span><h3 className="text-2xl font-black tracking-[-.035em]">{benefit.title}</h3><p className="text-sm leading-7 text-white/60">{benefit.desc}</p></motion.article>)}
          </div>
        </div>
      </section>

      {faq.length ? (
        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-primary">{t("studentPage.faqKicker")}</p>
            <h2 className="mt-5 text-[clamp(2.4rem,5.5vw,4.5rem)] font-black leading-[.98] tracking-[-.055em]">{t("studentPage.faqTitle")}</h2>
            <div className="mt-12 border-t border-border">
              {faq.map((item) => (
                <details key={item.question} className="group border-b border-border py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-extrabold tracking-[-.02em]">
                    <span>{item.question}</span>
                    <span className="text-2xl font-normal text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-4 pr-10 text-sm leading-7 text-muted-foreground">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="px-5 py-24 text-center sm:px-8 sm:py-32"><div className="mx-auto max-w-5xl"><p className="text-[11px] font-extrabold uppercase tracking-[.2em] text-primary">{t("studentPage.closingKicker")}</p><h2 className="mt-5 text-[clamp(3rem,7vw,6.5rem)] font-black leading-[.94] tracking-[-.065em]">{t("studentPage.closingTitle1")}<span className="mt-2 block bg-[linear-gradient(100deg,#17ead9,#6078ea)] bg-clip-text text-transparent">{t("studentPage.closingTitle2")}</span></h2><p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{t("studentPage.closingLede")}</p><Link to="/booking?type=student" className="mt-9 inline-flex min-h-13 items-center gap-2 rounded-full bg-foreground px-7 py-4 text-sm font-extrabold text-background">{t("studentPage.closingCta")}<span className="material-symbols-outlined text-[17px]">arrow_forward</span></Link></div></section>
    </main>
  );
}
