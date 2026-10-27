import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import CollabFilm from "./CollabFilm";
import PerkCards from "./PerkCards";
import { COLLAB_COPY } from "./collabCopy";
import { HUGO_DROP } from "./mascotArt";
import OnboardingProfileModal from "../../../components/member/OnboardingProfileModal";
import { API_BASE } from "../../../config/apiBase";
import { getMemberSession, loginMemberWithGoogle, logoutAuth } from "../../../services/api/core/authSession";
import { loadGoogleIdentity } from "../../../utils/loadGoogleIdentity";
import { getDeviceFingerprint, getDeviceId } from "../../../utils/deviceSignals";
import { getPartnerCampaign, PARTNER_HOST_CAMPAIGN } from "../../../../shared/partnerCampaigns";
import "./partner-collab.css";

const SERVICES_ORIGIN = "https://www.hugowishpax.studio";
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Thẻ meta riêng của trang chiến dịch — canonical trỏ về tên miền partner. */
function useCampaignMeta(campaign, copy, canonical) {
  useEffect(() => {
    if (!campaign) return undefined;
    const setMeta = (attr, key, value) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    const image = `${SERVICES_ORIGIN}/og/partner-${campaign.slug}.jpg`;
    document.title = copy.metaTitle;
    setMeta("name", "description", copy.metaDescription);
    setMeta("name", "keywords", copy.keywords);
    setMeta("name", "robots", "index, follow, max-image-preview:large");
    setMeta("name", "googlebot", "index, follow, max-image-preview:large");
    for (const [key, value] of [
      ["og:type", "website"], ["og:title", copy.metaTitle], ["og:description", copy.metaDescription],
      ["og:url", canonical], ["og:image", image], ["og:image:secure_url", image],
      ["og:image:type", "image/jpeg"], ["og:image:width", "1200"], ["og:image:height", "630"], ["og:image:alt", copy.metaTitle],
    ]) setMeta("property", key, value);
    for (const [key, value] of [
      ["twitter:card", "summary_large_image"], ["twitter:title", copy.metaTitle],
      ["twitter:description", copy.metaDescription], ["twitter:image", image],
    ]) setMeta("name", key, value);
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
    return undefined;
  }, [campaign, copy, canonical]);
}

/** Cụm logo đôi ở đầu phim — vẽ lại theo hai logo, không cần tải ảnh. */
function Lockup({ mark }) {
  const [name, tail] = mark.wordmark || [mark.label, ""];
  return (
    <span className="collab-lockup">
      <svg viewBox="19 3 62 90" aria-hidden="true"><path d={HUGO_DROP} fill="#bfe3ff" /></svg>
      <span>Hugo <span className="collab-lockup__studio">Studio</span></span>
      <span className="collab-lockup__x">×</span>
      <svg viewBox="-34 -96 68 75" aria-hidden="true">
        <rect x="-33" y="-95" width="66" height="73" rx="18" fill={mark.tile} />
        <polyline points="-11,-70 -22,-58.5 -11,-47" fill="none" stroke={mark.accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="13,-70 24,-58.5 13,-47" fill="none" stroke={mark.accent} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M -6 -74 L 8 -74 M 4 -74 L 4 -50 Q 4 -40 -4 -40 Q -9 -40 -10 -46" fill="none" stroke={mark.glyph} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>{name}<span className="collab-lockup__dev">{tail}</span></span>
    </span>
  );
}

/** Pháo hoa bằng canvas-confetti: nổ ngẫu nhiên khắp trời trong vài giây. */
function fireworks(reduced) {
  // Màu của hai logo: cyan/xanh/tím "Studio" của Hugo, cam/kem của hwagfu.
  const colors = ["#38bdf8", "#3b82f6", "#7c6cf0", "#e0793a", "#ffd9a8", "#ffffff"];
  if (reduced) {
    confetti({ particleCount: 90, spread: 90, origin: { y: 0.6 }, colors, disableForReducedMotion: false });
    return () => {};
  }
  const end = Date.now() + 4200;
  const timer = window.setInterval(() => {
    if (Date.now() > end) {
      window.clearInterval(timer);
      return;
    }
    const burst = { startVelocity: 32, spread: 360, ticks: 70, zIndex: 120, particleCount: 46, colors, scalar: 1.05 };
    confetti({ ...burst, origin: { x: 0.1 + Math.random() * 0.3, y: 0.15 + Math.random() * 0.3 } });
    confetti({ ...burst, origin: { x: 0.6 + Math.random() * 0.3, y: 0.15 + Math.random() * 0.3 } });
  }, 330);
  return () => window.clearInterval(timer);
}

const formatDate = (value, lang) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
};

function GoogleButton({ onCredential, ui }) {
  const ref = useRef(null);
  const handlerRef = useRef(onCredential);
  const [error, setError] = useState("");
  handlerRef.current = onCredential;

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(ui.googleUnavailable);
      return undefined;
    }
    let cancelled = false;
    loadGoogleIdentity()
      .then((googleId) => {
        if (cancelled || !ref.current) return;
        googleId.initialize({
          client_id: clientId,
          callback: (response) => handlerRef.current(response),
          use_fedcm_for_prompt: false,
        });
        ref.current.innerHTML = "";
        googleId.renderButton(ref.current, { theme: "filled_black", size: "large", shape: "pill", width: 300, text: "signup_with" });
      })
      .catch(() => !cancelled && setError(ui.googleUnavailable));
    return () => { cancelled = true; };
  }, [ui.googleUnavailable]);

  return (
    <div className="collab-google">
      <div ref={ref} className="collab-google__slot" />
      {error && <p className="collab-note collab-note--warn">{error}</p>}
    </div>
  );
}

export default function PartnerCollabPage() {
  const params = useParams();
  const { i18n } = useTranslation();
  const lang = String(i18n.language || "vi").startsWith("vi") ? "vi" : "en";
  const ui = COLLAB_COPY[lang];

  const slug = String(params.slug || PARTNER_HOST_CAMPAIGN).toLowerCase();
  const campaign = getPartnerCampaign(slug);
  const copy = campaign?.copy?.[lang] || campaign?.copy?.vi;
  const mark = useMemo(() => (campaign ? { ...campaign.mark, label: campaign.partnerName } : null), [campaign]);
  const canonical = slug === PARTNER_HOST_CAMPAIGN ? campaign?.publicUrl : `${SERVICES_ORIGIN}/collab/${slug}`;
  useCampaignMeta(campaign, copy, canonical);

  const [reduced] = useState(prefersReducedMotion);
  const [filmDone, setFilmDone] = useState(false);
  const [session, setSession] = useState(() => getMemberSession());
  const [stage, setStage] = useState("offer"); // offer | profile | claiming | welcome
  const [notice, setNotice] = useState(null); // { kind, title, body }
  const [result, setResult] = useState(null);
  const offerRef = useRef(null);
  const tourRef = useRef(null);
  const autoTourRef = useRef(false);

  const finishFilm = useCallback(() => setFilmDone(true), []);
  const explore = () => offerRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

  const claim = useCallback(async () => {
    setNotice(null);
    setStage("claiming");
    try {
      const me = await fetch(`${API_BASE}/partner-campaigns/${slug}/me`, { credentials: "include" });
      const meData = await me.json().catch(() => ({}));
      if (me.status === 401) {
        setSession(null);
        setStage("offer");
        return;
      }
      if (meData.error === "PROFILE_INCOMPLETE" || (me.ok && !meData.profileComplete)) {
        setStage("profile");
        return;
      }
      if (meData.rejected) {
        setNotice({ kind: "rejected", title: ui.rejectedTitle, body: meData.rejectReason });
        setStage("offer");
        return;
      }
      const [deviceId, deviceFp] = [getDeviceId(), await getDeviceFingerprint()];
      const response = await fetch(`${API_BASE}/partner-campaigns/${slug}/claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, deviceFp }),
      });
      const data = await response.json().catch(() => ({}));
      if (data.code === "PROFILE_INCOMPLETE") {
        setStage("profile");
        return;
      }
      // Hết suất / hết hạn: vẫn chào mừng thành viên mới, chỉ là không có quà
      // chiến dịch — ví còn JOY khởi tạo của hệ thống, gợi ý xác minh giáo dục.
      if (data.code === "SOLD_OUT" || data.code === "CAMPAIGN_CLOSED") {
        setResult({ ...data, soldOut: true, displayName: meData.displayName || getMemberSession()?.displayName || "" });
        setStage("welcome");
        return;
      }
      if (!response.ok) {
        const kind = data.code === "DUPLICATE_PERSON" ? "rejected" : "error";
        setNotice({ kind, title: kind === "rejected" ? ui.rejectedTitle : ui.loginFailed, body: data.error });
        setStage("offer");
        return;
      }
      setResult({ ...data, displayName: meData.displayName || getMemberSession()?.displayName || "" });
      setStage("welcome");
    } catch {
      setNotice({ kind: "error", title: ui.loginFailed, body: "" });
      setStage("offer");
    }
  }, [slug, ui]);

  const onCredential = useCallback(async ({ credential }) => {
    const { session: next, error } = await loginMemberWithGoogle(credential);
    if (!next) {
      setNotice({ kind: "error", title: ui.loginFailed, body: typeof error === "string" && error.length > 20 ? error : "" });
      return;
    }
    setSession(next);
    claim();
  }, [claim, ui.loginFailed]);

  const switchAccount = async () => {
    await logoutAuth();
    setSession(null);
    setNotice(null);
  };

  // Pháo hoa khi chào mừng — chỉ khi vừa nhận quà thật, không phải lần ghé lại.
  useEffect(() => {
    if (stage !== "welcome") return undefined;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    return result?.alreadyClaimed || result?.soldOut ? undefined : fireworks(reduced);
  }, [stage, result?.alreadyClaimed, result?.soldOut, reduced]);

  const startTour = useCallback(async () => {
    const [{ driver }] = await Promise.all([import("driver.js"), import("driver.js/dist/driver.css")]);
    tourRef.current?.destroy();
    const steps = [
      { element: "#collab-rewards", popover: { title: ui.welcomeEyebrow, description: result?.soldOut ? ui.soldOutLede : ui.welcomeLede(campaign.partnerName) } },
      ...ui.features.map((feature) => ({
        element: `#collab-feature-${feature.id}`,
        popover: { title: feature.title, description: feature.tour },
      })),
      { element: "#collab-enter", popover: { title: ui.enterPortal, description: ui.tourDone } },
    ];
    const tour = driver({
      showProgress: true,
      animate: !reduced,
      smoothScroll: !reduced,
      allowClose: true,
      overlayColor: "#0b0a12",
      overlayOpacity: 0.62,
      stagePadding: 8,
      stageRadius: 22,
      popoverClass: "collab-tour",
      nextBtnText: ui.tourNext,
      prevBtnText: ui.tourPrev,
      doneBtnText: ui.tourFinish,
      progressText: "{{current}} / {{total}}",
      steps,
    });
    tourRef.current = tour;
    tour.drive();
  }, [campaign, reduced, result?.soldOut, ui]);

  // Tự mở tour một lần, sau khi pháo hoa đã kịp nổ.
  useEffect(() => {
    if (stage !== "welcome" || autoTourRef.current) return undefined;
    autoTourRef.current = true;
    const timer = window.setTimeout(startTour, reduced ? 300 : 3400);
    return () => window.clearTimeout(timer);
  }, [stage, startTour, reduced]);

  useEffect(() => () => tourRef.current?.destroy(), []);

  const onProfileDone = useCallback(() => claim(), [claim]);

  if (!campaign) {
    return (
      <main className="collab collab--missing">
        <p className="collab-type">404</p>
        <h1>Không tìm thấy chiến dịch</h1>
        <a className="collab-btn" href={SERVICES_ORIGIN}>Hugo Studio</a>
      </main>
    );
  }


  return (
    <main className="collab" lang={lang}>
      {/* ── Mở màn: phim ─────────────────────────────────────────────────── */}
      <section className="collab-cinema" aria-label={copy.headline}>
        <header className="collab-cinema__top">
          <Lockup mark={mark} />
          <span className="collab-type collab-cinema__eyebrow" aria-hidden="true">{copy.eyebrow}</span>
        </header>

        <div className="collab-cinema__stage">
          <CollabFilm mark={mark} eyebrow={copy.eyebrow} headline={copy.headline} tagline={copy.tagline} reduced={reduced} onDone={finishFilm} />
        </div>

        <div className="collab-cinema__controls">
          <AnimatePresence mode="wait">
            {filmDone ? (
              <motion.div key="cta" className="collab-cinema__cta" initial={{ opacity: 0, y: 16, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                <p className="collab-cinema__lede">{copy.lede}</p>
                <button type="button" className="collab-btn collab-btn--glow" onClick={explore}>
                  {copy.cta.toUpperCase()}
                  <span className="material-symbols-outlined" aria-hidden="true">south</span>
                </button>
              </motion.div>
            ) : (
              <motion.button key="skip" type="button" className="collab-link collab-cinema__skip" onClick={finishFilm} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {ui.skip}<span className="material-symbols-outlined" aria-hidden="true">fast_forward</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Khám phá ưu đãi ─────────────────────────────────────────────── */}
      <section ref={offerRef} id="uu-dai" className="collab-offer" aria-labelledby="collab-offer-title">
        <div className="collab-shell">
          <p className="collab-type collab-eyebrow">{ui.offerEyebrow} · {campaign.partnerName} × Hugo Studio</p>
          <h2 id="collab-offer-title" className="collab-title">{ui.offerTitle}</h2>
          <p className="collab-lede">{ui.offerLede}</p>

          <PerkCards campaign={campaign} ui={ui} lang={lang} reduced={reduced} />

          <div className="collab-claim" id="nhan-uu-dai">
            <div className="collab-claim__copy">
              <h2 className="collab-title collab-title--sm">{ui.claimTitle}</h2>
              <p className="collab-lede">{ui.claimLede}</p>
            </div>

            <div className="collab-claim__action">
              {notice && (
                <div className={`collab-notice collab-notice--${notice.kind}`} role="alert">
                  <p className="collab-notice__title">{notice.title}</p>
                  {notice.body && <p>{notice.body}</p>}
                  {notice.kind === "rejected" && (
                    <>
                      <p>{ui.contactSupport}</p>
                      <Link className="collab-link" to="/support-request">{ui.supportCta}</Link>
                    </>
                  )}
                </div>
              )}
              {stage === "claiming" ? (
                <p className="collab-note"><span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span> {ui.claiming}</p>
              ) : session ? (
                <div className="collab-claim__session">
                  <button type="button" className="collab-btn collab-btn--glow" onClick={claim}>
                    {ui.continueAs(session.displayName || session.email)}
                    <span className="material-symbols-outlined" aria-hidden="true">redeem</span>
                  </button>
                  <button type="button" className="collab-link" onClick={switchAccount}>{ui.switchAccount}</button>
                </div>
              ) : (
                <GoogleButton onCredential={onCredential} ui={ui} />
              )}
              <p className="collab-note collab-note--small">
                <span className="material-symbols-outlined" aria-hidden="true">verified_user</span> {ui.fairPlay}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="collab-footer">
        <div className="collab-shell collab-footer__inner">
          <p>{ui.footer(campaign.partnerName)}</p>
          <nav>
            <a href={campaign.partnerUrl} target="_blank" rel="noopener noreferrer">{campaign.partnerName}</a>
            <a href={SERVICES_ORIGIN}>Hugo Studio</a>
            <Link to="/terms">{ui.terms}</Link>
            <Link to="/privacy-policy">{ui.privacy}</Link>
          </nav>
        </div>
      </footer>

      {/* ── Hồ sơ: hỏi đúng những mục còn thiếu ─────────────────────────── */}
      {stage === "profile" && session && (
        <OnboardingProfileModal email={session.email} onDone={onProfileDone} onSkip={onProfileDone} />
      )}

      {/* ── Chào mừng + bản đồ tính năng (đích của tour) ────────────────── */}
      <AnimatePresence>
        {stage === "welcome" && result && (
          <motion.div className="collab-welcome" role="dialog" aria-modal="true" aria-labelledby="collab-welcome-title"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="collab-welcome__scroll">
              <motion.section className="collab-welcome__card" initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                <p className="collab-type collab-eyebrow">{ui.welcomeEyebrow}</p>
                <h2 id="collab-welcome-title" className="collab-title">
                  {ui.welcomeTitle(result.displayName || session?.displayName || "")}
                </h2>
                <p className="collab-lede">
                  {result.soldOut ? ui.soldOutLede : result.alreadyClaimed ? ui.alreadyClaimed : ui.welcomeLede(campaign.partnerName)}
                </p>

                {result.soldOut ? (
                  <ul id="collab-rewards" className="collab-rewards">
                    <li><span className="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span>{ui.rewardJoySystem(result.joyBalance || 0)}</li>
                    <li><span className="material-symbols-outlined" aria-hidden="true">apps</span>{ui.rewardFree}</li>
                  </ul>
                ) : (
                  <ul id="collab-rewards" className="collab-rewards">
                    <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span>{ui.rewardDays(campaign.bioDays)}</li>
                    {(result.eduBonusApplied || result.granted?.eduBonusDays > 0) && (
                      <li><span className="material-symbols-outlined" aria-hidden="true">school</span>{ui.rewardEdu(campaign.eduBonusDays)}</li>
                    )}
                    <li><span className="material-symbols-outlined" aria-hidden="true">account_balance_wallet</span>{ui.rewardJoy(campaign.joy)}</li>
                    <li><span className="material-symbols-outlined" aria-hidden="true">apps</span>{ui.rewardFree}</li>
                  </ul>
                )}
                <p className="collab-type collab-welcome__facts">
                  {result.expiresAt && <span>{ui.expiresAt(formatDate(result.expiresAt, lang))}</span>}
                  <span>{ui.joyBalance(result.joyBalance || 0)}</span>
                </p>

                {!result.isEduVerified && (
                  <p className="collab-note collab-note--edu">
                    <span className="material-symbols-outlined" aria-hidden="true">school</span>
                    {result.soldOut ? ui.soldOutEdu : ui.eduHint(campaign.eduBonusDays)}{" "}
                    <a className="collab-link" href={`${SERVICES_ORIGIN}/student-pricing`}>{ui.eduCta}</a>
                  </p>
                )}

                <div className="collab-welcome__actions">
                  <button type="button" className="collab-btn" onClick={startTour}>
                    <span className="material-symbols-outlined" aria-hidden="true">explore</span>{ui.startTour}
                  </button>
                  <Link id="collab-enter" className="collab-btn collab-btn--glow" to="/member/today">
                    {ui.enterPortal}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                  </Link>
                </div>
              </motion.section>

              <section className="collab-hub" aria-labelledby="collab-hub-title">
                <h3 id="collab-hub-title" className="collab-title collab-title--sm">{ui.hubTitle}</h3>
                <p className="collab-lede">{ui.hubLede}</p>
                <div className="collab-hub__grid">
                  {ui.features.map((feature) => (
                    <Link key={feature.id} id={`collab-feature-${feature.id}`} to={feature.path} className="collab-feature">
                      <span className="material-symbols-outlined" aria-hidden="true">{feature.icon}</span>
                      <strong>{feature.title}</strong>
                      <span>{feature.body}</span>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
