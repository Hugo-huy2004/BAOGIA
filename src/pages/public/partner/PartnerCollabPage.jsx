import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import CollabFilm from "./CollabFilm";
import PerkCards from "./PerkCards";
import { COLLAB_COPY, COLLAB_LANGS, COLLAB_LANG_PICKER, collabLocale } from "./collabCopy";
import { detectCollabLang, getSavedCollabLang, saveCollabLang } from "./detectCollabLang";
import { HUGO_DROP } from "./mascotArt";
import OnboardingProfileModal from "../../../components/member/OnboardingProfileModal";
import { API_BASE } from "../../../config/apiBase";
import { getMemberSession, loginMemberWithGoogle, logoutAuth } from "../../../services/api/core/authSession";
import { loadGoogleIdentity } from "../../../utils/loadGoogleIdentity";
import { getDeviceFingerprint, getDeviceId } from "../../../utils/deviceSignals";
import { markPartnerWelcomed } from "../../../utils/partnerWelcome";
import { detectInstallTarget, IS_NATIVE } from "../../../config/platform";
import { useStandalone } from "../../../hooks/usePWA";
import MobileInstallGate from "../../../components/ui/MobileInstallGate";
import { useServicesFonts } from "../../../hooks/useServicesFonts";
import { getPartnerCampaign, isPartnerLang, partnerCampaignCopy, partnerCampaignPath, PARTNER_HOST_CAMPAIGN } from "../../../../shared/partnerCampaigns";
import "./partner-collab.css";

const SERVICES_ORIGIN = "https://www.hugowishpax.studio";
const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Thẻ meta riêng của trang chiến dịch — canonical trỏ về tên miền partner. */
function useCampaignMeta(campaign, copy, canonical, baseUrl) {
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
    // Tiêu đề link mang đuôi /VI, /EN, /ZH: chia sẻ ra ngoài nhìn là biết bản nào.
    document.title = copy.linkTitle;
    setMeta("name", "description", copy.metaDescription);
    setMeta("name", "keywords", copy.keywords);
    setMeta("name", "robots", "index, follow, max-image-preview:large");
    setMeta("name", "googlebot", "index, follow, max-image-preview:large");
    for (const [key, value] of [
      ["og:type", "website"], ["og:title", copy.linkTitle], ["og:description", copy.metaDescription],
      ["og:url", canonical], ["og:image", image], ["og:image:secure_url", image],
      ["og:image:type", "image/jpeg"], ["og:image:width", "1200"], ["og:image:height", "630"], ["og:image:alt", copy.linkTitle],
      ["og:locale", collabLocale(copy.lang).replace("-", "_")],
    ]) setMeta("property", key, value);
    for (const [key, value] of [
      ["twitter:card", "summary_large_image"], ["twitter:title", copy.linkTitle],
      ["twitter:description", copy.metaDescription], ["twitter:image", image],
    ]) setMeta("name", key, value);
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
    // hreflang: ba bản ngôn ngữ chỉ vào nhau, trang gốc (hỏi chọn ngôn ngữ) là x-default.
    document.head.querySelectorAll('link[data-collab-hreflang]').forEach((node) => node.remove());
    for (const [hreflang, href] of [...COLLAB_LANGS.map((code) => [code, `${baseUrl}/${code}`]), ["x-default", baseUrl]]) {
      const alt = document.createElement("link");
      alt.rel = "alternate";
      alt.hreflang = hreflang;
      alt.href = href;
      alt.dataset.collabHreflang = "";
      document.head.appendChild(alt);
    }
    document.documentElement.lang = copy.lang;
    return () => document.head.querySelectorAll('link[data-collab-hreflang]').forEach((node) => node.remove());
  }, [campaign, copy, canonical, baseUrl]);
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
    return new Date(value).toLocaleDateString(collabLocale(lang), { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "";
  }
};

/**
 * Bộ chọn ngôn ngữ lúc vào trang: ngôn ngữ đoán theo vùng thiết bị được chọn
 * sẵn và gắn nhãn "gợi ý", người dùng xác nhận hoặc đổi rồi mới vào phim.
 */
function LangPicker({ suggested, onChoose }) {
  const [choice, setChoice] = useState(suggested);
  return (
    <div className="collab-langpick" role="dialog" aria-modal="true" aria-labelledby="collab-langpick-title">
      <motion.div className="collab-langpick__card" initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <span className="material-symbols-outlined collab-langpick__icon" aria-hidden="true">translate</span>
        <h2 id="collab-langpick-title" className="collab-langpick__title">{COLLAB_LANG_PICKER.title[choice]}</h2>
        <div className="collab-langpick__list" role="radiogroup">
          {COLLAB_LANGS.map((code) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={choice === code}
              lang={code}
              className={`collab-langpick__option${choice === code ? " is-active" : ""}`}
              onClick={() => setChoice(code)}
            >
              <span className="collab-langpick__code">/{code.toUpperCase()}</span>
              <span className="collab-langpick__name">{COLLAB_LANG_PICKER.names[code]}</span>
              {code === suggested && <span className="collab-langpick__hint">{COLLAB_LANG_PICKER.suggested[code]}</span>}
              <span className="material-symbols-outlined collab-langpick__check" aria-hidden="true">{choice === code ? "radio_button_checked" : "radio_button_unchecked"}</span>
            </button>
          ))}
        </div>
        <button type="button" className="collab-btn collab-btn--glow collab-langpick__go" onClick={() => onChoose(choice)}>
          {COLLAB_LANG_PICKER.confirm[choice]}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
        </button>
      </motion.div>
    </div>
  );
}

/** Công tắc ngôn ngữ trên đầu trang: mỗi bản là một link thật /vi, /en, /zh. */
function LangSwitch({ slug, lang, onChoose }) {
  return (
    <nav className="collab-langswitch" aria-label="Language">
      {COLLAB_LANGS.map((code) => (
        <Link
          key={code}
          to={partnerCampaignPath(slug, code)}
          replace
          lang={code}
          hrefLang={code}
          aria-current={code === lang ? "true" : undefined}
          className={code === lang ? "is-active" : ""}
          onClick={() => onChoose(code, { navigate: false })}
          title={COLLAB_LANG_PICKER.names[code]}
        >
          /{code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

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
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  useServicesFonts();

  const slug = String(params.slug || PARTNER_HOST_CAMPAIGN).toLowerCase();
  const campaign = getPartnerCampaign(slug);

  // Ngôn ngữ: đường dẫn /vi|/en|/zh thắng tất cả (link chia sẻ phải mở đúng
  // bản). Không có thì dùng lựa chọn đã lưu; lần đầu thì hỏi, gợi ý theo vùng.
  // Tiêu đề link ghi "/EN", "/ZH" nên người ta hay gõ chữ hoa: nhận cả hai,
  // rồi effect bên dưới đưa về đường dẫn chữ thường.
  const urlLang = isPartnerLang(String(params.lang || "").toLowerCase()) ? String(params.lang).toLowerCase() : null;
  const [suggested] = useState(detectCollabLang);
  const [savedLang, setSavedLang] = useState(getSavedCollabLang);
  const [pickerOpen, setPickerOpen] = useState(() => !urlLang && !getSavedCollabLang());
  const lang = urlLang || savedLang || suggested;
  const ui = COLLAB_COPY[lang];
  const copy = partnerCampaignCopy(campaign, lang);

  const chooseLang = useCallback((code, { navigate: go = true } = {}) => {
    saveCollabLang(code);
    setSavedLang(code);
    setPickerOpen(false);
    if (go) navigate(`${partnerCampaignPath(slug, code)}${location.search}${location.hash}`, { replace: true });
  }, [navigate, slug, location.search, location.hash]);

  // Đã chọn ở lần trước mà mở link gốc → đưa về đúng bản, khỏi hỏi lại.
  // Link sai mã ngôn ngữ (/collab/x/fr) cũng về bản hợp lệ thay vì 404.
  useEffect(() => {
    if (!campaign || (urlLang && params.lang === urlLang) || pickerOpen) return;
    if (params.lang || savedLang) navigate(`${partnerCampaignPath(slug, lang)}${location.search}${location.hash}`, { replace: true });
  }, [campaign, urlLang, pickerOpen, params.lang, savedLang, slug, lang, navigate, location.search, location.hash]);

  // Giao diện chung (hồ sơ, đăng nhập…) đi theo ngôn ngữ trang.
  useEffect(() => {
    if (!pickerOpen && !String(i18n.language || "").startsWith(lang)) i18n.changeLanguage(lang);
  }, [lang, pickerOpen, i18n]);

  const mark = useMemo(() => (campaign ? { ...campaign.mark, label: campaign.partnerName } : null), [campaign]);
  const baseUrl = slug === PARTNER_HOST_CAMPAIGN ? campaign?.publicUrl : `${SERVICES_ORIGIN}/collab/${slug}`;
  const canonical = urlLang ? `${baseUrl}/${urlLang}` : baseUrl;
  useCampaignMeta(campaign, copy, canonical, baseUrl);

  const [reduced] = useState(prefersReducedMotion);
  // Điện thoại: đăng nhập + nhận quà ngay trên web trước, cài app là "còn một
  // bước nữa" ở màn chào mừng (phiên theo sang app, xem utils/appHandoff.js).
  // Trước đây bắt cài app trước tiên — đa số người bỏ đi ngay lần ghé đầu.
  const isPWA = useStandalone();
  const [isMobile] = useState(() => detectInstallTarget().isMobile);
  const mustInstall = isMobile && !isPWA && !IS_NATIVE;
  const [showInstall, setShowInstall] = useState(false);
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
      const send = () => fetch(`${API_BASE}/partner-campaigns/${slug}/claim`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, deviceFp }),
      });
      // Nhận quà gọi lại an toàn (đã nhận thì server không cộng lần hai), nên
      // rớt mạng/edge trả lỗi không kèm CORS thì thử lại một lần trước khi báo.
      const response = await send().catch(() => new Promise((resolve) => setTimeout(resolve, 1500)).then(send));
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
      setNotice({ kind: "error", title: ui.networkError, body: "" });
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
    markPartnerWelcomed(slug);
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    return result?.alreadyClaimed || result?.soldOut ? undefined : fireworks(reduced);
  }, [stage, result?.alreadyClaimed, result?.soldOut, reduced, slug]);

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
        <div className="collab-cinema__bg" aria-hidden="true"><i /><i /><i /></div>
        <header className="collab-cinema__top">
          <Lockup mark={mark} />
          <span className="collab-type collab-cinema__eyebrow" aria-hidden="true">{copy.eyebrow}</span>
          <LangSwitch slug={slug} lang={lang} onChoose={chooseLang} />
        </header>

        <div className="collab-cinema__stage">
          {/* Phim chờ người dùng chọn xong ngôn ngữ mới chạy, để không lỡ mất đoạn mở màn. */}
          {!pickerOpen && (
            <CollabFilm mark={mark} eyebrow={copy.eyebrow} headline={copy.headline} tagline={copy.tagline} reduced={reduced} onDone={finishFilm} />
          )}
        </div>

        <div className="collab-cinema__controls">
          <AnimatePresence mode="wait">
            {pickerOpen ? null : filmDone ? (
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

      <div className="collab-marquee" aria-hidden="true">
        <div className="collab-marquee__track">
          {[...ui.marquee(campaign), ...ui.marquee(campaign)].map((item, index) => <span key={index}><i />{item}</span>)}
        </div>
      </div>

      {/* ── Khám phá ưu đãi ─────────────────────────────────────────────── */}
      <section ref={offerRef} id="uu-dai" className="collab-offer" aria-labelledby="collab-offer-title">
        <div className="collab-shell">
          <p className="collab-marker collab-reveal"><span>01</span>{ui.offerEyebrow} · {campaign.partnerName} × Hugo Studio</p>
          <h2 id="collab-offer-title" className="collab-title collab-reveal">{ui.offerTitle[0]}<br /><em>{ui.offerTitle[1]}</em></h2>
          <p className="collab-lede">{ui.offerLede}</p>

          <PerkCards campaign={campaign} ui={ui} lang={lang} reduced={reduced} />

          <div className="collab-claim" id="nhan-uu-dai">
            <div className="collab-claim__copy">
              <p className="collab-marker"><span>02</span>{ui.claimMarker}</p>
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

      {pickerOpen && <LangPicker suggested={suggested} onChoose={chooseLang} />}

      {/* ── Điện thoại: bước cuối — cài app (video + từng bước), phiên theo sang ── */}
      {showInstall && mustInstall && (
        <div className="collab-install" role="dialog" aria-modal="true">
          <MobileInstallGate title={ui.installTitle} lede={ui.installLede} copyPath="/member/today" allowBypass={false} onClose={() => setShowInstall(false)} />
        </div>
      )}

      {/* ── Hồ sơ: hỏi đúng những mục còn thiếu ─────────────────────────── */}
      {stage === "profile" && session && (
        <OnboardingProfileModal email={session.email} purpose="reward" onDone={onProfileDone} onSkip={onProfileDone} />
      )}

      {/* ── Chào mừng + bản đồ tính năng (đích của tour) ────────────────── */}
      <AnimatePresence>
        {stage === "welcome" && result && (
          <motion.div className="collab-welcome" role="dialog" aria-modal="true" aria-labelledby="collab-welcome-title"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="collab-welcome__scroll">
              <motion.section className="collab-welcome__card" initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
                <p className="collab-marker">{ui.welcomeEyebrow}</p>
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
                  {mustInstall ? (
                    <button id="collab-enter" type="button" className="collab-btn collab-btn--glow" onClick={() => setShowInstall(true)}>
                      {ui.installCta}<span className="material-symbols-outlined" aria-hidden="true">install_mobile</span>
                    </button>
                  ) : (
                    <Link id="collab-enter" className="collab-btn collab-btn--glow" to="/member/today">
                      {ui.enterPortal}<span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                    </Link>
                  )}
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
