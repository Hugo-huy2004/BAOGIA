import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight, Check } from "lucide-react";
import { useServiceCopy } from "../../hooks/useServiceCopy";
import { useTranslation } from "react-i18next";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useServicesFonts } from "../../hooks/useServicesFonts";
import { getMemberSession, loginMemberWithGoogle } from "../../services/api/core/authSession";
import { isEduEmail } from "../../utils/eduEmail";
import { notify } from "../../lib/notify";
import { loadGoogleIdentity } from "../../utils/loadGoogleIdentity";
import "./services-editorial.css";
import "./edu-page.css";

const OBJ = { returnObjects: true };

// Ảnh chụp thật từ app (393×852, @3x) — chụp lại khi giao diện app đổi.
// `top` = màu mép trên của ảnh, tô dải thanh trạng thái quanh Dynamic Island.
const FEATURE_SHOTS = [
  { src: "/image/edu/bio.webp", top: "#e9e5df", colors: ["#f472b6", "#f59e0b"] },
  { src: "/image/edu/focus.webp", top: "#fdfaff", colors: ["#34d399", "#0ea5e9"] },
  { src: "/image/edu/arcade.webp", top: "#cda4f8", colors: ["#8b5cf6", "#ec4899"] },
  { src: "/image/edu/hugokit.webp", top: "#fafafe", colors: ["#6366f1", "#22d3ee"] },
];

// Nền giáo dục: biểu tượng Material Symbols đơn sắc (đúng quy ước trang public)
// xen vài ký hiệu chữ. [biểu tượng, trái %, trên %, cỡ px, độ sâu thị sai].
const EDU_SYMBOLS = [
  ["school", 3, 5, 54, 1.4], ["menu_book", 28, 6, 40, 0.8], ["Edu+", 52, 4, 30, 1.2], ["science", 88, 10, 46, 1.8],
  ["calculate", 3, 46, 36, 0.9], ["lightbulb", 42, 34, 32, 0.6], ["functions", 72, 40, 38, 1.3], ["A+", 95, 50, 30, 1],
  ["history_edu", 10, 90, 44, 1.1], ["translate", 47, 76, 34, 1.5], ["π", 60, 88, 34, 0.7], ["auto_stories", 84, 80, 46, 1.4],
  ["edit", 47, 20, 30, 0.7], ["∑", 50, 60, 30, 1], ["biotech", 97, 92, 34, 1.2], ["architecture", 2, 72, 30, 0.8],
];

function EduSymbols() {
  return EDU_SYMBOLS.map(([symbol, left, top, size, depth], index) => {
    const style = { left: `${left}%`, top: `${top}%`, fontSize: size, "--d": depth, animationDelay: `${-index * 0.7}s` };
    // Tên biểu tượng toàn chữ thường/gạch dưới; còn lại là ký hiệu vẽ bằng chữ.
    return /^[a-z_]+$/.test(symbol)
      ? <span key={index} className="material-symbols-outlined svc-logo edu-symbol" style={style}>{symbol}</span>
      : <span key={index} className="svc-logo edu-symbol edu-symbol--text" style={{ ...style, fontSize: size * 0.8 }}>{symbol}</span>;
  });
}

/** iPhone 15 Pro dựng bằng CSS: viền titan, nút hông, thanh trạng thái, thanh Home, kính phản chiếu. */
function Phone({ shot, alt, className = "", eager = false }) {
  const { src, top } = shot;
  return (
    <figure className={`edu-phone ${className}`} style={{ "--top": top }}>
      <i className="edu-phone__btn edu-phone__btn--action" aria-hidden="true" />
      <i className="edu-phone__btn edu-phone__btn--up" aria-hidden="true" />
      <i className="edu-phone__btn edu-phone__btn--down" aria-hidden="true" />
      <i className="edu-phone__btn edu-phone__btn--power" aria-hidden="true" />
      <div className="edu-phone__screen">
        <div className="edu-phone__status" aria-hidden="true">
          <span>9:41</span>
          <span className="edu-phone__island" />
          <svg viewBox="0 0 66 12">
            <path d="M1 9h3v3H1zM6 7h3v5H6zM11 4.5h3V12h-3zM16 2h3v10h-3z" />
            <path d="M31 3.2a9.6 9.6 0 0 1 12.8 0l-1.4 1.5a7.5 7.5 0 0 0-10 0zM33.3 5.7a6.3 6.3 0 0 1 8.2 0l-1.4 1.5a4.2 4.2 0 0 0-5.4 0zM35.6 8.2a3 3 0 0 1 3.6 0L37.4 10z" />
            <rect x="48.5" y="1.5" width="15" height="9" rx="2.6" fill="none" stroke="currentColor" strokeOpacity=".4" />
            <rect x="50" y="3" width="12" height="6" rx="1.4" />
            <path d="M64.6 4.6v2.8a1.5 1.5 0 0 0 0-2.8z" fillOpacity=".45" />
          </svg>
        </div>
        <img src={src} alt={alt} width="393" height="852" loading={eager ? "eager" : "lazy"} decoding="async" />
        <span className="edu-phone__home" aria-hidden="true" />
        <span className="edu-phone__glare" aria-hidden="true" />
      </div>
    </figure>
  );
}

function VerifyStep({ state, icon, title, desc }) {
  const mark = {
    done: ["check_circle", "edu-verify__mark--done"],
    loading: ["progress_activity", "animate-spin"],
    warn: ["pending", "edu-verify__mark--warn"],
    todo: [icon, ""],
  }[state];
  return (
    <li>
      <span className={`material-symbols-outlined edu-verify__mark ${mark[1]}`} aria-hidden="true">{mark[0]}</span>
      <div><p className="edu-verify__title">{title}</p><p className="svc-type edu-verify__desc">{desc}</p></div>
    </li>
  );
}

/** Mở màn: ba màn hình app thật xoè quạt, nghiêng theo con trỏ (chỉ ghi biến CSS). */
function EduHero() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const handlePointerMove = (event) => {
    if (event.pointerType !== "mouse") return;
    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    ref.current.style.setProperty("--mx", (x * 2 - 1).toFixed(3));
    ref.current.style.setProperty("--my", (y * 2 - 1).toFixed(3));
    ref.current.style.setProperty("--sx", `${Math.round(x * 100)}%`);
    ref.current.style.setProperty("--sy", `${Math.round(y * 100)}%`);
  };
  const reset = () => {
    ref.current?.style.setProperty("--mx", "0");
    ref.current?.style.setProperty("--my", "0");
  };
  const features = t("eduPage.features", OBJ);

  return (
    <section ref={ref} className="svc-hero edu-hero" aria-labelledby="edu-title" onPointerMove={handlePointerMove} onPointerLeave={reset}>
      <div className="svc-hero__bg" aria-hidden="true"><i /><i /><i /><div className="svc-hero__spot" /><EduSymbols /></div>
      <div className="services-shell edu-hero__inner">
        <div className="edu-hero__copy">
          <p className="svc-type svc-hero__eyebrow">{t("eduPage.heroEyebrow")}</p>
          <h1 id="edu-title" aria-label="Hugo Edu+">
            <span aria-hidden="true">Hugo</span>
            <span aria-hidden="true">Edu+</span>
          </h1>
          <p className="svc-type edu-hero__lede">{t("eduPage.heroLede")}</p>
          <a href="#dieu-kien" className="svc-btn">{t("eduPage.heroCta")} <ArrowDown aria-hidden="true" /></a>
        </div>
        <div className="edu-fan">
          <Phone shot={FEATURE_SHOTS[1]} alt={features[1]?.app} className="edu-fan__l" eager />
          <Phone shot={FEATURE_SHOTS[2]} alt={features[2]?.app} className="edu-fan__r" eager />
          <Phone shot={FEATURE_SHOTS[0]} alt={features[0]?.app} className="edu-fan__c" eager />
        </div>
      </div>
    </section>
  );
}

/**
 * Hiện kiểu cuộn phim: khung nào lọt vào màn hình thì chạy trọn hiệu ứng kéo từ
 * trên xuống (CSS transition). Không gắn thẳng vào vị trí cuộn, vì dừng cuộn
 * giữa chừng sẽ để khung đứng mờ, cắt nửa.
 */
function useFilmReveal(rootRef) {
  useEffect(() => {
    const nodes = rootRef.current?.querySelectorAll(".edu-film") || [];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((node) => node.classList.add("is-in"));
      return undefined;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
      // Ngưỡng 0 + lề dưới: khung đang bị clip-path cắt gần hết nên tỉ lệ
      // giao nhau luôn ≈ 0 — ngưỡng kiểu 0.18 sẽ không bao giờ tới.
    }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [rootRef]);
}

export default function StudentPricingPage() {
  const { t } = useTranslation();
  useServicesFonts();
  const pageRef = useRef(null);
  useFilmReveal(pageRef);
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
  const features = t("eduPage.features", OBJ);
  const facts = t("eduPage.facts", OBJ);
  const terms = t("eduPage.terms", OBJ);

  return (
    <div ref={pageRef} className="services-editorial edu-page">
      <EduHero />

      <section className="edu-member" aria-labelledby="edu-member-title">
        <div className="services-shell">
          <p className="svc-type svc-kicker edu-film">{t("eduPage.memberKicker")}</p>
          <h2 id="edu-member-title" className="svc-big edu-film">{t("eduPage.memberTitle1")}<br /><em>{t("eduPage.memberTitle2")}</em></h2>
          <p className="svc-type edu-member__body edu-film">{t("eduPage.memberBody")}</p>
          <dl className="edu-facts">
            {facts.map((fact) => (
              <div key={fact.label} className="edu-film"><dt>{fact.value}</dt><dd className="svc-type">{fact.label}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      <section className="edu-features" aria-labelledby="edu-features-title">
        <div className="edu-features__bg" aria-hidden="true"><EduSymbols /></div>
        <div className="services-shell">
          <p className="svc-type svc-kicker edu-film">{t("eduPage.featuresKicker")}</p>
          <h2 id="edu-features-title" className="svc-big edu-film">{t("eduPage.featuresTitle1")}<br /><em>{t("eduPage.featuresTitle2")}</em></h2>
          <div className="edu-features__list">
            {features.map((feature, index) => {
              const shot = FEATURE_SHOTS[index];
              return (
                <article key={feature.app} className="edu-feature edu-film" style={{ "--a": shot.colors[0], "--b": shot.colors[1] }}>
                  <div className="edu-feature__art">
                    <i className="edu-feature__glow" aria-hidden="true" />
                    <Phone shot={shot} alt={feature.app} />
                  </div>
                  <div className="edu-feature__copy">
                    <p className="svc-type edu-feature__app">{String(index + 1).padStart(2, "0")} · {feature.app}</p>
                    <h3>{feature.title}</h3>
                    <p className="svc-type edu-feature__body">{feature.body}</p>
                    <ul>
                      {feature.points.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="dieu-kien" className="edu-terms" aria-labelledby="edu-terms-title">
        <div className="services-shell">
          <p className="svc-type svc-kicker edu-film">{t("eduPage.termsKicker")}</p>
          <h2 id="edu-terms-title" className="svc-big edu-film">{t("eduPage.termsTitle1")}<br /><em>{t("eduPage.termsTitle2")}</em></h2>
          <div className="edu-terms__grid">
            <ol className="edu-terms__list">
              {terms.map((term, index) => (
                <li key={term.title} className="svc-step edu-film">
                  <span className="svc-step__n" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{term.title}</h3>
                  <p className="svc-type">{term.body}</p>
                </li>
              ))}
            </ol>

            <div id="verify" className="edu-verify">
              <div className="edu-verify__head">
                <span className="material-symbols-outlined" aria-hidden="true">{verified ? "verified" : "school"}</span>
                <div><h3>{t("studentPage.verifyTitle")}</h3><p className="svc-type">{t("studentPage.verifySub")}</p></div>
              </div>
              <ul className="edu-verify__steps">
                <VerifyStep state={session?.email ? "done" : "todo"} icon="account_circle" title={t("studentPage.step1")} desc={session?.email || t("studentPage.step1Desc")} />
                <VerifyStep state={eduState === "checking" ? "loading" : verified ? "done" : eduState === "pending" ? "warn" : "todo"} icon="alternate_email" title={t("studentPage.step2")} desc={verified ? t("studentPage.step2Ok") : eduState === "pending" ? t("studentPage.step2Pending") : t("studentPage.step2Todo")} />
                <VerifyStep state={verified ? "done" : eduState === "pending" ? "warn" : "todo"} icon="redeem" title={t("studentPage.step3")} desc={t("studentPage.step3Desc")} />
              </ul>
              <div className="edu-verify__actions">
                {!session?.email && (
                  <>
                    <div ref={googleButtonRef} className="edu-verify__gis" />
                    <button type="button" className="edu-verify__alt" onClick={() => { const googleId = window.google?.accounts?.id; if (!googleId) return; googleId.cancel(); setTimeout(() => googleId.prompt(), 100); }}>{t("studentPage.pickAccount")}</button>
                    {googleConfigError && <p className="svc-type edu-verify__warn">{googleConfigError}</p>}
                    <p className="svc-type edu-verify__hint">{gisReady ? t("studentPage.gisReady") : t("studentPage.gisLoading")}</p>
                  </>
                )}
                {verified && <Link to="/member" className="svc-btn">{t("studentPage.openBenefits")} <ArrowRight aria-hidden="true" /></Link>}
                {eduState === "pending" && (
                  <>
                    <p className="svc-type edu-verify__hint">{t("studentPage.pendingNote")}</p>
                    <Link to="/services?type=student&plan=verify#dat-lich" className="edu-verify__alt">{t("studentPage.pendingCta")}</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {faq.length ? (
        <section className="edu-faq" aria-labelledby="edu-faq-title">
          <div className="services-shell edu-faq__inner">
            <p className="svc-type svc-kicker">{t("studentPage.faqKicker")}</p>
            <h2 id="edu-faq-title" className="svc-big">{t("studentPage.faqTitle")}</h2>
            <div className="edu-faq__list">
              {faq.map((item) => (
                <details key={item.question}>
                  <summary><span>{item.question}</span><span aria-hidden="true">+</span></summary>
                  <p className="svc-type">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="services-closing edu-closing" aria-labelledby="edu-closing-title">
        <div className="services-shell">
          <p className="svc-type svc-kicker">{t("studentPage.closingKicker")}</p>
          <h2 id="edu-closing-title" className="svc-big edu-film">{t("studentPage.closingTitle1")}<br /><em>{t("studentPage.closingTitle2")}</em></h2>
          <p className="svc-type edu-closing__lede">{t("studentPage.closingLede")}</p>
          <Link to="/services?type=student#dat-lich" className="svc-btn">{t("eduPage.closingCta")} <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  );
}
