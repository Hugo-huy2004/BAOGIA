import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { TegakiRenderer } from "tegaki";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import scriptFont from "../../../fonts/heroScript";
import { DocScroll } from "../../../components/public/landing/Story";
import { STUDIO_SOCIAL_LINKS } from "../../../config/studioSocialLinks";
import { useHeadMeta } from "../../../hooks/useHeadMeta";
import { useServicesFonts } from "../../../hooks/useServicesFonts";
import { projects, shotUrl } from "../../../data/projects";
import "./introduction.css";

/*
 * Chép nguyên từ ../hugo-portfolio (src/pages/public/IntroductionPage.jsx) ngày
 * 08/11/2026 theo yêu cầu user: trang Giới thiệu của Hugo Studio hiển thị và
 * chuyển động giống hệt portfolio. Chỉ đổi những chỗ bắt buộc:
 *  - trang public ở đây mặc định cuộn trong #root; trang này bật <DocScroll/>
 *    để cuộn bằng cửa sổ như portfolio (ghim position:fixed, không giật);
 *  - không có @gsap/react: useGSAP là bản rút gọn bên dưới;
 *  - bỏ âm thanh/rung (sound.js) — Hugo Studio không có;
 *  - ảnh nằm ở /image.
 * NỘI DUNG đã viết lại thành trang giới thiệu Hugo Studio (không phải hồ sơ xin
 * việc): không nêu ngoại ngữ, không giới thiệu trường; chỉ ghi điều kiểm chứng
 * được — giá lấy đúng bảng giá tác giả (VNĐ), không số liệu hay đánh giá bịa.
 * Nhiều chỗ "bấm thử" dẫn tới bản đang chạy để khách tự trải nghiệm.
 */
// ponytail: thay @gsap/react — chạy một lần, dọn sạch mọi tween/trigger khi rời trang.
function useGSAP(fn, { scope } = {}) {
  useLayoutEffect(() => {
    const ctx = gsap.context(fn, scope?.current || undefined);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ dựng khi mount, giống @gsap/react
  }, []);
}

// Ảnh chưa tải: mờ dần vào (bản rút gọn SmartImg của portfolio).
function SmartImg({ src, alt = "", ...props }) {
  return <img {...props} src={src} alt={alt} loading="lazy" decoding="async" />;
}

const reveal = {
  initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

// Headings rise out of a mask like the hero name. Negative insets keep accents and descenders visible once open.
// The wrapper observes the viewport: IntersectionObserver ignores an element whose own clip-path hides it.
const riseVariants = {
  hidden: { clipPath: "inset(-20% -5% 100% -5%)", y: 48 },
  show: { clipPath: "inset(-20% -5% -20% -5%)", y: 0, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } },
};

function RiseHeading({ children }) {
  return (
    <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
      <motion.h2 variants={riseVariants}>{children}</motion.h2>
    </motion.div>
  );
}

// Liquid glass: backdrop-filter: url() refraction only renders in Chromium; other engines keep the frosted blur.
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
// Pinned, scroll-jacked scenes only where they feel good: wide screens. Phones keep native scrolling with lighter reveals.
const desktopMotion = "(min-width: 821px) and (prefers-reduced-motion: no-preference)";
const phoneMotion = "(max-width: 820px) and (prefers-reduced-motion: no-preference)";

const supportsLiquid = typeof navigator !== "undefined" && "userAgentData" in navigator;
const ease = [0.16, 1, 0.3, 1];

// Handwritten lines: "Creation" starts once the name has risen, "Development" follows when it finishes.
function HeroScript() {
  const [step, setStep] = useState(0);
  useEffect(() => { const timer = setTimeout(() => setStep(1), 900); return () => clearTimeout(timer); }, []);
  return (
    <div className="hero-script" aria-hidden="true" translate="no">
      {/* Wrappers carry the positioning: the renderer sets its own inline position. */}
      <div className="hero-script-creation">
        <TegakiRenderer font={scriptFont} reducedMotion="user" fallbackFont="cursive"
          time={{ mode: "uncontrolled", speed: 1.3, playing: step >= 1 }} onComplete={() => setStep(2)}>Creation</TegakiRenderer>
      </div>
      <div className="hero-script-development">
        <TegakiRenderer font={scriptFont} reducedMotion="user"
          time={{ mode: "uncontrolled", speed: 1.5, playing: step >= 2 }}>Development</TegakiRenderer>
      </div>
    </div>
  );
}

// Two-tier gold podium the portrait sits on: brushed-metal sides, lit top faces, a bright rim on each edge.
function Podium() {
  return (
    <svg viewBox="0 0 600 244" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="podium-side" x1="0" x2="1">
          <stop offset="0" stopColor="#7a5418" /><stop offset=".12" stopColor="#c9952f" /><stop offset=".3" stopColor="#f6d78a" />
          <stop offset=".46" stopColor="#d6a743" /><stop offset=".62" stopColor="#a8761f" /><stop offset=".8" stopColor="#e9c56c" /><stop offset="1" stopColor="#6e4a12" />
        </linearGradient>
        <radialGradient id="podium-top" cx=".42" cy=".35" r=".75">
          <stop offset="0" stopColor="#f8e2a4" /><stop offset=".55" stopColor="#d9ab4c" /><stop offset="1" stopColor="#a9781f" />
        </radialGradient>
        <linearGradient id="podium-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".28" />
        </linearGradient>
      </defs>
      {/* base tier */}
      <path d="M8 140 A292 42 0 0 0 592 140 V196 A292 42 0 0 1 8 196 Z" fill="url(#podium-side)" />
      <path d="M8 140 A292 42 0 0 0 592 140 V196 A292 42 0 0 1 8 196 Z" fill="url(#podium-shade)" />
      <ellipse cx="300" cy="140" rx="292" ry="42" fill="url(#podium-top)" />
      <ellipse cx="300" cy="140" rx="292" ry="42" fill="none" stroke="#fff3cf" strokeOpacity=".7" strokeWidth="2.5" />
      <ellipse cx="300" cy="146" rx="212" ry="26" fill="#4d3208" opacity=".22" />
      {/* top tier */}
      <path d="M90 52 A210 30 0 0 0 510 52 V120 A210 30 0 0 1 90 120 Z" fill="url(#podium-side)" />
      <path d="M90 52 A210 30 0 0 0 510 52 V120 A210 30 0 0 1 90 120 Z" fill="url(#podium-shade)" />
      <ellipse cx="300" cy="52" rx="210" ry="30" fill="url(#podium-top)" />
      <ellipse cx="300" cy="52" rx="210" ry="30" fill="none" stroke="#fff3cf" strokeOpacity=".75" strokeWidth="2.5" />
    </svg>
  );
}

function HeroSection({ copy }) {
  const ref = useRef(null);

  // Opening scene: hero pins, dock & type recede, the room darkens, Hugo steps forward on the podium.
  // Lighting is plain gradient divs animated by opacity/transform only: the old full-screen SVG beams with blend modes lagged.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    const build = (end, frontScale) => gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top top", end, scrub: true, pin: true, anticipatePin: 1 } })
      .to(".hero-dock-wrap", { autoAlpha: 0, y: 30, duration: 0.22, ease: "none" }, 0)
      .to(".hero-layer--back", { autoAlpha: 0, yPercent: -10, scale: 0.88, duration: 0.3, ease: "none" }, 0)
      .to(".hero-museum-backdrop", { autoAlpha: 1, duration: 0.35, ease: "none" }, 0.05)
      .fromTo(".hero-beam", { autoAlpha: 0, scaleY: 0.2 }, { autoAlpha: 1, scaleY: 1, duration: 0.3, ease: "power2.out" }, 0.15)
      .fromTo(".hero-pool", { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.3)
      .to(".hero-layer--front", { scale: frontScale, transformOrigin: "50% 80%", duration: 0.45, ease: "none" }, 0.18)
      .fromTo(".hero-title", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, ease: "none" }, 0.4)
      .from(".hero-title > *", { y: 40, opacity: 0, stagger: 0.08, duration: 0.25, ease: "power2.out" }, 0.4)
      .to({}, { duration: 0.25 });
    mm.add(desktopMotion, () => { build("+=80%", 1.05); });
    mm.add(phoneMotion, () => { build("+=60%", 1.02); });
  }, { scope: ref });

  return (
    <section ref={ref} className="hero">

      {/* Dark atmospheric backdrop */}
      <div className="hero-museum-backdrop" aria-hidden="true" />
      {/* Stage light: one beam from above, a pool on the floor, and the title card once the room is dark. */}
      <div className="hero-beam" aria-hidden="true" />
      <div className="hero-pool" aria-hidden="true" />
      <div className="hero-title" aria-hidden="true">
        <p>{copy.sloganKicker}</p>
        <p>{copy.slogan}</p>
      </div>

      {/* Background layer: sun, handwritten script, Hugo name */}
      <div className="hero-layer hero-layer--back">
        <motion.span className="hero-sun" aria-hidden="true" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, duration: 1.2, ease }} />
        <HeroScript />
        <motion.h1 className="hero-name" aria-label="Hugo" translate="no">
          {"Hugo".split("").map((letter, index) => (
            <span key={letter} className="hero-name-mask" aria-hidden="true">
              <motion.span initial={{ y: "105%" }} animate={{ y: "0%" }} transition={{ delay: 0.1 + index * 0.07, duration: 1.1, ease }}>{letter}</motion.span>
            </span>
          ))}
        </motion.h1>
      </div>



      {/* Centerpiece: Golden Podium and Portrait with Full Feet Visible */}
      <div className="hero-layer hero-layer--front">
        <motion.div className="hero-podium" aria-hidden="true"
          initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 1.1, ease }}>
          <Podium />
        </motion.div>
        <motion.img className="hero-portrait" src="/image/hugo-portrait.webp" alt="Hugo Wishpax"
          initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 1.1, ease }} />
      </div>

      {/* Hero dock banner */}
      <div className="hero-dock-wrap">
        <motion.div className={`hero-dock${supportsLiquid ? " is-liquid" : ""}`}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.9, ease }}>
          <div className="hero-meta">
            <p><i aria-hidden="true" />{copy.heroStatus}</p>
            <p><MapPin size={14} aria-hidden="true" />{copy.heroPlace}</p>
          </div>
          <p className="hero-line">{copy.heroLine}</p>
          <div className="hero-actions">
            <Link to="/services" className="hero-cta">{copy.ctaPrimary}</Link>
            <a href="#more" className="hero-cta hero-cta--quiet">{copy.ctaMore}<ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Signature reveal: thick strokes traced over public/hugo-signature.png (617×405) in signing order,
// used as a mask so the real ink appears as if being signed. [path, seconds to draw]
const signatureStrokes = [
  ["M72 215 C110 188 150 170 192 158 C230 150 240 176 226 204 C214 230 198 256 180 270", 0.55],
  ["M118 192 C145 189 162 200 174 224", 0.2],
  ["M188 158 L184 302", 0.25],
  ["M190 182 C178 232 164 284 145 334", 0.3],
  ["M250 220 C232 226 214 250 220 258 C230 262 244 256 252 252 M224 240 L242 238", 0.35],
  ["M256 132 L264 294", 0.25],
  ["M258 192 L294 190", 0.12],
  ["M236 220 C252 214 262 206 270 212 C266 226 282 234 290 224 C294 214 300 228 308 222 C318 206 326 202 334 212 C340 220 346 206 354 206 C364 206 370 200 382 212 C386 220 372 222 368 214", 0.6],
  ["M368 206 C390 172 430 125 488 90", 0.35],
];

// The strokes are drawn by the page's scroll timeline (About pins until the signature is complete).
function Signature() {
  return (
    <svg className="creator-signature" viewBox="0 0 617 405" aria-hidden="true">
      <defs>
        <mask id="signature-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="617" height="405">
          {signatureStrokes.map(([d, duration]) => (
            <path key={d} className="sig-stroke" data-duration={duration} d={d} pathLength="1" fill="none" stroke="#fff" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </mask>
      </defs>
      <image href="/image/hugo-signature.png" width="617" height="405" mask="url(#signature-reveal)" />
    </svg>
  );
}

// Cảnh "Bạn cần gì": mỗi khung là một loại sản phẩm, kèm chỗ bấm thử. Giá đúng bảng giá tác giả.
const skillFrames = (language) => {
  const vi = language === "vi";
  return [
    { title: "Landing page", text: vi ? ["Một trang, một mục tiêu", "Chỉ từ 1,29 triệu", "Không cần cọc"] : ["One page, one goal", "From 1.29M VND", "No deposit"],
      try: ["/services/hugo-one", vi ? "Xem gói Hugo One" : "See Hugo One"] },
    { title: vi ? "Website giới thiệu" : "Company website", text: vi ? ["4 trang", "Đã gồm đưa lên tên miền", "Từ 2,99 triệu"] : ["4 pages", "Domain setup included", "From 2.99M VND"],
      try: ["/services/hugo-story", vi ? "Xem gói Hugo Story" : "See Hugo Story"] },
    { title: vi ? "Đặt lịch, nhận đơn" : "Bookings & orders", text: vi ? ["4 trang + 1 chức năng", "Trang quản trị riêng", "Từ 4,99 triệu"] : ["4 pages + 1 feature", "Your own admin panel", "From 4.99M VND"],
      try: ["/services/hugo-flow-plus", vi ? "Xem gói Hugo Flow+" : "See Hugo Flow+"] },
    { title: vi ? "Cài lên điện thoại" : "Installs like an app", text: vi ? ["Không qua chợ ứng dụng", "Một chạm từ màn hình chính"] : ["No app store needed", "One tap from the home screen"],
      try: ["/login", vi ? "Mở thử Hugo Studio App" : "Try Hugo Studio App"] },
  ];
};

const socialLinks = STUDIO_SOCIAL_LINKS.filter((link) => link.labelKey !== "socialGroupChat")
  .map(({ fallbackLabel, href, platform }) => ({ name: fallbackLabel, icon: platform, href }));

const profileCopy = {
  vi: {
    heroLine: "Website, landing page và ứng dụng web cho cá nhân, cửa hàng nhỏ và người mới khởi nghiệp. Mỗi dự án đều có bản chạy thử để bạn mở ra dùng trước khi quyết định.",
    heroStatus: "Nhận dự án website · làm việc online",
    heroPlace: "Hugo Studio · Việt Nam",
    ctaPrimary: "Xem bảng giá", ctaMore: "Xem thêm",
    sloganKicker: "HUGO STUDIO",
    slogan: "Từ ý tưởng đến trang web đang chạy",
    aboutKicker: "Hugo Studio",
    aboutTitle: "Một xưởng nhỏ.\nLàm trọn từ đầu đến cuối.",
    about: "Hugo Studio do Hugo Wishpax lập ra và vận hành. Một người lo cả thiết kế, lập trình, đưa lên mạng và bảo hành, nên bạn luôn trao đổi thẳng với người làm, không qua trung gian.",
    meta: [["Người làm", "Hugo Wishpax · Sinh viên University of Greenwich (Việt Nam), có tên trong danh sách tôn vinh sinh viên kỳ Summer 2026"],
      ["Cách làm việc", "Online, chốt phạm vi và hợp đồng trước khi bắt đầu"]],
    techHeading: "Bạn cần gì?", techNote: "Kéo qua từng loại sản phẩm. Thẻ nào cũng có thứ để bấm thử.",
    eco: "Dự án cộng đồng",
    workKicker: "Dự án", workHeading: "Đang chạy thật, mở ra là dùng được.", workNote: "Mỗi chặng là một dự án đã bàn giao. Bấm để mở bản đang chạy.",
    stop: "Dự án", live: "Mở bản đang chạy", workEnd: "Còn nhiều dự án khác.",
    outroLead: "Bắt đầu cùng", outroLine: "Kể Hugo nghe bạn cần gì. Báo giá miễn phí, bạn chỉ quyết định khi đã rõ phạm vi.",
    outroCta: "Gửi yêu cầu báo giá", credits: "Hết phim · Cảm ơn bạn đã xem",
    metaDesc: "Hugo Studio làm website, landing page và ứng dụng web cho cá nhân và cửa hàng nhỏ. Có bản chạy thử cho mỗi dự án, giá niêm yết rõ ràng.",
  },
  en: {
    heroLine: "Websites, landing pages and web apps for individuals, small shops and new founders. Every project comes with a live build you can try before you decide.",
    heroStatus: "Taking website projects · fully online",
    heroPlace: "Hugo Studio · Vietnam",
    ctaPrimary: "See pricing", ctaMore: "See more",
    sloganKicker: "HUGO STUDIO",
    slogan: "From an idea to a site that's live",
    aboutKicker: "Hugo Studio",
    aboutTitle: "A small studio.\nEnd to end.",
    about: "Hugo Studio is founded and run by Hugo Wishpax. One person handles design, development, launch and warranty, so you always talk directly to the person doing the work.",
    meta: [["Who", "Hugo Wishpax · Student at University of Greenwich (Vietnam), named on the Summer 2026 student honours list"],
      ["How we work", "Online, with scope and contract agreed before starting"]],
    techHeading: "What do you need?", techNote: "Swipe through each kind of product. Every card has something to try.",
    eco: "Community projects",
    workKicker: "Projects", workHeading: "Live, and ready to open.", workNote: "Each stop is a delivered project. Tap to open the live build.",
    stop: "Project", live: "Open the live site", workEnd: "There are more projects.",
    outroLead: "Start with", outroLine: "Tell Hugo what you need. Quotes are free, and you only decide once the scope is clear.",
    outroCta: "Request a quote", credits: "The end · Thanks for watching",
    metaDesc: "Hugo Studio builds websites, landing pages and web apps for individuals and small shops. A live build for every project, clear published prices.",
  },
};

// Projects as a journey: one full-screen slide per project — stop number and dates, the name set large,
// one hero shot that carries the project, and frosted-glass polaroids of other screens with their captions.
function JourneySlide({ project, index, total, t, from, stopLabel, liveLabel }) {
  const base = `projectsPage.items.${project.id}`;
  const shots = [project.cover || project.shots[0].src, ...project.shots.map(({ src }) => src)]
    .filter((name, position, all) => all.indexOf(name) === position);
  const caption = (src) => t(`${base}.shots.${src}`, project.shots.find((shot) => shot.src === src)?.caption || project.title);
  const [hero, ...rest] = shots;
  return (
    <article className="journey-slide" style={{ "--ambient": `url(${shotUrl(project.id, hero)})` }}>
      <div className="journey-copy">
        <p className="journey-stop"><span>{stopLabel} {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</span>{project.period.replace("{now}", t("projectsPage.periodNow"))}</p>
        <h3 translate="no">{project.title}</h3>
        <p className="journey-kind">{t(`projectsPage.kinds.${project.kind}`, project.kind)}</p>
        <p className="journey-tagline">{t(`${base}.tagline`, project.tagline)}</p>
        {/* Một khối cho cả hai nút: GSAP kéo từng con của .journey-copy theo nhịp riêng, để rời thì chúng trượt đè lên nhau. */}
        <div className="journey-actions">
          <Link className="journey-cta" to={`/project/${project.id}`} state={{ from }}>
            {t("projectsPage.openProject", "Xem dự án")} <ArrowUpRight size={18} />
          </Link>
          {project.url && <a className="journey-live" href={project.url} target="_blank" rel="noreferrer"><i aria-hidden="true" />{liveLabel}</a>}
        </div>
      </div>
      <div className="journey-visual">
        <figure className="journey-hero"><SmartImg src={shotUrl(project.id, hero)} alt={caption(hero)} /></figure>
        {rest.slice(0, 3).map((src, polaroid) => (
          <figure key={src} className={`journey-polaroid journey-polaroid--${polaroid + 1}`}>
            <SmartImg src={shotUrl(project.id, src)} />
            <figcaption>{caption(src)}</figcaption>
          </figure>
        ))}
      </div>
    </article>
  );
}

// Hệ sinh thái miễn phí, kể thành ba chương (dùng lại khung "Học vấn" của portfolio).
const educationChapters = (language) => {
  const vi = language === "vi";
  // Ảnh chụp thật của trang (khung trình duyệt) + nhân vật đại diện ló ra ở góc.
  const shot = (src, host, mascot, variant = "") => (
    <figure className={`eco-shot${variant ? ` eco-shot--${variant}` : ""}`} aria-hidden="true">
      <div className="eco-shot__bar"><i /><i /><i /><span>{host}</span></div>
      <img src={src} alt="" loading="lazy" />
      <img className="eco-shot__mascot" src={mascot} alt="" loading="lazy" />
    </figure>
  );
  return [
    {
      id: "edu", tone: "sky", label: vi ? "Học" : "Learn", visual: (
        // Bản đồ bước học chụp từ chính Education Hugo: khổ máy tính làm nền, khổ điện thoại nổi lên.
        <figure className="eco-qr eco-edu" aria-hidden="true">
          <div className="eco-shot eco-qr__gen">
            <div className="eco-shot__bar"><i /><i /><i /><span>education.hugowishpax.studio</span></div>
            <img src="/image/eco/edu-map.webp" alt="" loading="lazy" />
          </div>
          <div className="eco-edu__phone"><img src="/image/eco/edu-phone.webp" alt="" loading="lazy" /></div>
          <img className="eco-qr__mascot" src="/brand/edu-hugo-mascot.png" alt="" loading="lazy" />
        </figure>
      ),
      kicker: vi ? "Miễn phí cho học sinh, sinh viên" : "Free for students",
      title: "Education Hugo", sub: "education.hugowishpax.studio",
      body: vi ? "Khoá học miễn phí cho học sinh, sinh viên mọi ngành, từ kỹ năng mềm đến kỹ thuật chuyên sâu." : "Free courses for students in every field, from soft skills to in-depth engineering.",
      links: [{ href: "https://education.hugowishpax.studio", label: vi ? "Vào học thử" : "Start learning" }],
    },
    {
      id: "qr", tone: "cobalt", label: "QR", visual: (
        // Dựng lại từ chính trang QR Hugo: màn tạo mã làm nền, mã QR mẫu nổi lên, nhãn loại nội dung bay quanh.
        <figure className="eco-qr" aria-hidden="true">
          <div className="eco-shot eco-qr__gen">
            <div className="eco-shot__bar"><i /><i /><i /><span>qr.hugowishpax.studio</span></div>
            <img src="/image/eco/qr-gen.webp" alt="" loading="lazy" />
          </div>
          <div className="eco-qr__card"><img src="/image/eco/qr-card.webp" alt="" loading="lazy" /></div>
          {[["wifi", "Wi-Fi"], ["contact_page", "vCard"], ["link", "Link"], ["location_on", vi ? "Vị trí" : "Location"]].map(([icon, label], i) => (
            <span key={label} className={`eco-qr__chip eco-qr__chip--${i + 1}`}><span className="material-symbols-outlined">{icon}</span>{label}</span>
          ))}
          <img className="eco-qr__mascot" src="/image/avt5.png" alt="" loading="lazy" />
        </figure>
      ),
      kicker: vi ? "Mã QR mang màu thương hiệu" : "QR codes in your brand colours",
      title: "QR Hugo", sub: "qr.hugowishpax.studio",
      body: vi ? "Biến link, Wi-Fi, danh thiếp hay vị trí thành mã QR: chọn kiểu chấm, màu, gắn logo rồi tải ảnh về. Đăng nhập Hugo Studio để quản lý và dùng API." : "Turn a link, Wi-Fi, contact card or location into a QR code: pick dots, colours, add a logo and download. Sign in with Hugo Studio to manage them and use the API.",
      links: [{ href: "https://qr.hugowishpax.studio", label: vi ? "Tạo mã QR thử" : "Make a QR code" }],
    },
    {
      id: "app", tone: "paper", label: "App", visual: shot("/project-screenshots/hugo-studio/apps.webp", "hugowishpax.studio", "/image/avt1.png", "phone"),
      kicker: vi ? "Cài lên điện thoại" : "On your phone",
      title: "Hugo Studio App", sub: "hugowishpax.studio",
      body: vi ? "Danh thiếp số, ví điểm JOY, trò chơi và bảng tin Today. Đăng nhập bằng Google hoặc passkey." : "Digital business card, JOY points wallet, games and the Today feed. Sign in with Google or a passkey.",
      links: [{ to: "/login", label: vi ? "Mở app" : "Open the app" }],
    },
  ];
};

function Education({ language, copy, from }) {
  const chapters = educationChapters(language);
  return (
    <section id="ecosystem" className="edu" aria-label={copy.eco}>
      <div className="edu-stage">
        {chapters.map((chapter, index) => <article key={chapter.id} className={`edu-panel edu-panel--${chapter.tone}`}>
          <div className="edu-head">
            <p className="edu-tag">{copy.eco}</p>
            <ol className="edu-chapters" aria-hidden="true">
              {chapters.map((item, itemIndex) => <li key={item.id} className={itemIndex === index ? "is-active" : undefined}>{item.label}</li>)}
            </ol>
          </div>
          <div className="edu-visual">{chapter.visual}</div>
          <div className="edu-copy">
            <p className="edu-kicker">{chapter.kicker}</p>
            <h2>{chapter.title}</h2>
            {chapter.sub && <p className="edu-sub" translate="no">{chapter.sub}</p>}
            {chapter.body && <p className="edu-body">{chapter.body}</p>}
            {chapter.facts && <dl className="edu-facts">{chapter.facts.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
            {chapter.links && <div className="edu-links">{chapter.links.map((link, index) => link.href
              ? <a key={link.href} className={`edu-link${index ? " edu-link--quiet" : ""}`} href={link.href} target="_blank" rel="noreferrer">{link.label} <ArrowUpRight size={18} /></a>
              : <Link key={link.to} className={`edu-link${index ? " edu-link--quiet" : ""}`} to={link.to} state={{ from }}>{link.label} <ArrowUpRight size={18} /></Link>)}</div>}
          </div>
        </article>)}
      </div>
    </section>
  );
}

// Closing scene: the film ends on the same cobalt as the hero. An iris opens on it while you scroll in,
// the line is handed to the visitor, and each channel is one tile to tap.
function OutroName() {
  const [play, setPlay] = useState(false);
  return (
    <motion.span translate="no" className="outro-name" onViewportEnter={() => setPlay(true)} viewport={{ once: true, amount: 0.8 }}>
      <TegakiRenderer font={scriptFont} reducedMotion="user" time={{ mode: "uncontrolled", speed: 1.2, playing: play }}>Hugo</TegakiRenderer>
    </motion.span>
  );
}

function Contact({ copy }) {
  return (
    <section id="contact" className="outro">
      <div className="outro-iris">
        <h2 className="outro-title">
          <span>{copy.outroLead}</span>
          <OutroName />
        </h2>
        <p className="outro-line">{copy.outroLine}</p>
        <Link className="outro-mail" to="/services#dat-lich">{copy.outroCta} <ArrowUpRight size={22} /></Link>
        <ul className="outro-channels">
          {socialLinks.map((social) => <li key={social.href}>
            <a href={social.href} target="_blank" rel="noreferrer" aria-label={social.name} title={social.name}>
              <img src={`/social-logos/${social.icon}.svg`} alt="" />
            </a>
          </li>)}
        </ul>
        <p className="outro-credits">{copy.credits}</p>
      </div>
    </section>
  );
}

// The page is cut like a film: seven scenes, letterbox bars close and reopen on every cut,
// a HUD in the corner reads the scene and a timecode off the scroll position.
const scenes = [
  [".hero", "Mở màn", "Opening"], [".creator-marquee", "Thước phim", "Showreel"], [".creator-about", "Hugo Studio", "Hugo Studio"],
  [".creator-skills", "Bạn cần gì", "What you need"], [".edu", "Cộng đồng", "Community"], [".journey", "Dự án", "Projects"], [".outro", "Bắt đầu", "Start"],
];
const FILM_SECONDS = 180; // ponytail: whole page reads as a 3-minute reel; the timecode is scroll progress × this

function FilmHud({ language }) {
  const { scrollYProgress } = useScroll();
  const [scene, setScene] = useState(0);
  const timecode = useRef(null);
  const sceneRef = useRef(0);
  // Rect checks instead of triggers: pin spacers already shift the sections, so this never goes stale after a refresh.
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const middle = window.innerHeight / 2;
    const current = scenes.reduce((found, [selector], index) => (document.querySelector(selector)?.getBoundingClientRect().top <= middle ? index : found), 0);
    sceneRef.current = current;
    setScene(current);
    const frames = Math.round(progress * FILM_SECONDS * 24);
    const pad = (value) => String(value).padStart(2, "0");
    if (timecode.current) timecode.current.textContent = `${pad(Math.floor(frames / 1440))}:${pad(Math.floor(frames / 24) % 60)}:${pad(frames % 24)}`;
  });
  return (
    <>
      <div className="film-bars" aria-hidden="true"><i /><i /></div>
      {/* Always mounted, only faded: GSAP wraps pinned siblings in pin-spacers, so React must never insert nodes next to them. */}
      <motion.div className="film-hud" aria-hidden="true" initial={false} animate={{ opacity: scene > 0 ? 1 : 0, y: scene > 0 ? 0 : 16 }} transition={{ duration: 0.5, ease }}>
        <span className="film-hud-rec" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.b key={scene} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ duration: 0.35, ease }}>
            SC {String(scene + 1).padStart(2, "0")} · {scenes[scene][language === "vi" ? 1 : 2]}
          </motion.b>
        </AnimatePresence>
        <span ref={timecode} className="film-hud-time">00:00:00</span>
      </motion.div>
    </>
  );
}

export default function IntroductionPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const language = i18n.language.startsWith("vi") ? "vi" : "en";
  const copy = profileCopy[language];
  const featured = ["minh-oi-media", "hwj", "chanh-toa"].map((id) => projects.find((project) => project.id === id));
  const marquee = useMemo(() => projects.map((project) => ({ id: project.id, title: project.title, src: shotUrl(project.id, project.cover || project.shots[0].src) })), []);
  useServicesFonts();
  useHeadMeta({
    title: "Hugo Studio — Hugo Wishpax",
    description: copy.metaDesc,
    canonicalUrl: "https://www.hugowishpax.studio/",
  });
  const root = useRef(null);

  // One timeline script for the whole film, written in page order: ScrollTrigger measures each scene
  // after the pins above it, so the order below is load-bearing. Hero (scene 1) pins in HeroSection, which mounts first.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add({ desktop: desktopMotion, phone: phoneMotion }, ({ conditions }) => {
      const { desktop, phone } = conditions;
      if (!desktop && !phone) return undefined;

      // A cut: the letterbox closes as the next scene arrives and reopens once it has the frame.
      // `wipe` also opens the incoming scene from an inset, rounded frame, like a shot cutting in.
      const cut = (section, wipe) => {
        gsap.timeline({ scrollTrigger: { trigger: section, start: "top 85%", end: "top 15%", scrub: 0.4 } })
          .to(".film-bars i", { scaleY: 1, ease: "power2.in" })
          .to(".film-bars i", { scaleY: 0, ease: "power2.out" });
        if (wipe) gsap.fromTo(section, { clipPath: "inset(6% 5% 0% 5% round 3rem)" }, { clipPath: "inset(0% 0% 0% 0% round 0rem)", ease: "none",
          scrollTrigger: { trigger: section, start: "top bottom", end: "top 25%", scrub: 0.5 } });
      };
      // Phones: every scene plays with the scroll (scrubbed), so dragging back rewinds it like a film.
      const scrubIn = (targets, vars, trigger, start = "top 90%", end = "top 45%") => gsap.from(targets, { ease: "none", ...vars, scrollTrigger: { trigger: trigger || targets, start, end, scrub: 0.5 } });

      // ── Scene 2 · Showreel: strips advance with scroll and lean into the scroll speed like film through a gate.
      cut(".creator-marquee");
      const reel = { trigger: ".creator-marquee", start: "top bottom", end: "bottom top", scrub: 0.5 };
      gsap.fromTo(".creator-marquee-track:not(.is-reverse)", { xPercent: 0 }, { xPercent: -30, ease: "none", scrollTrigger: reel });
      gsap.fromTo(".creator-marquee-track.is-reverse", { xPercent: -30 }, { xPercent: 0, ease: "none", scrollTrigger: reel });
      const lean = gsap.quickSetter(".creator-marquee-viewport", "skewX", "deg");
      const proxy = { skew: 0 };
      ScrollTrigger.create({ trigger: ".creator-marquee", start: "top bottom", end: "bottom top", onUpdate: (self) => {
        const skew = gsap.utils.clamp(-10, 10, self.getVelocity() / -300);
        if (Math.abs(skew) > Math.abs(proxy.skew)) {
          proxy.skew = skew;
          gsap.to(proxy, { skew: 0, duration: 0.8, ease: "power3", overwrite: true, onUpdate: () => lean(proxy.skew) });
        }
      } });

      // ── Scene 3 · Profile: pinned; the line plays out word by word like a subtitle, then the signature is signed.
      cut(".creator-about");
      const words = gsap.utils.toArray(".sub-word");
      const strokes = gsap.utils.toArray(".sig-stroke");
      gsap.set(words, { opacity: 0.14 });
      gsap.set(strokes, { strokeDasharray: "1 1", strokeDashoffset: 1, opacity: 0 }); // opacity hides each round-cap dot until its stroke starts
      // Phones: the stacked profile is taller than the screen, so pinning it would crop the heading; it plays as it scrolls past instead.
      const profile = gsap.timeline({ scrollTrigger: desktop
        ? { trigger: ".creator-about", start: "top top", end: "+=150%", scrub: 0.5, pin: true, anticipatePin: 1 }
        : { trigger: ".creator-about-copy", start: "top 85%", end: () => `+=${innerHeight * 0.9}`, scrub: 0.5 } });
      profile.to(words, { opacity: 1, stagger: 0.05, duration: 0.2, ease: "none" }).to({}, { duration: 0.15 });
      // Phones show the photo above the copy, so the signature is signed while the photo itself scrolls by.
      const signing = desktop ? profile
        : gsap.timeline({ scrollTrigger: { trigger: ".creator-about-photo", start: "top 70%", end: "bottom 35%", scrub: 0.5 } });
      strokes.forEach((stroke) => {
        signing.set(stroke, { opacity: 1 }).to(stroke, { strokeDashoffset: 0, ease: "power1.inOut", duration: Number(stroke.dataset.duration) }).to({}, { duration: 0.06 });
      });
      if (desktop) gsap.fromTo(".creator-about-photo", { yPercent: 14 }, { yPercent: -14, ease: "none",
        scrollTrigger: { trigger: ".creator-about", start: "top bottom", end: "bottom top", scrub: 0.5 } });

      // ── Scene 4 · Skills: pinned, the frames slide sideways (phones too: the reel is short enough to fit one screen).
      cut(".creator-skills", true);
      {
        const track = root.current.querySelector(".skills-track");
        const distance = () => track.scrollWidth - track.parentElement.clientWidth;
        gsap.set(".skills-reel", { overflow: "hidden" });
        gsap.set(".skills-progress", { display: "block" });
        const reelTween = gsap.to(track, { x: () => -distance(), ease: "none",
          scrollTrigger: { trigger: ".creator-skills", start: "top top", end: () => `+=${distance()}`, scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
        gsap.to(".skills-progress i", { scaleX: 1, ease: "none",
          scrollTrigger: { trigger: ".creator-skills", start: "top top", end: () => `+=${distance()}`, scrub: true } });
        gsap.utils.toArray(".skills-frame").forEach((frame) => {
          const inReel = (start, end) => ({ trigger: frame, containerAnimation: reelTween, start, end, scrub: 0.6 });
          gsap.from(frame.querySelector("h3"), { xPercent: 35, autoAlpha: 0, ease: "power2.out", scrollTrigger: inReel("left 95%", "left 45%") });
          gsap.from(frame.querySelectorAll("li"), { yPercent: 140, rotate: -28, scale: 0.4, autoAlpha: 0, stagger: 0.08, ease: "back.out(1.7)", scrollTrigger: inReel("left 85%", "left 30%") });
        });
      }

      // ── Scene 5 · Education: desktop stacks the chapters on a pinned stage; phones stack them as sticky cards (chapters can be taller than a phone screen).
      cut(".edu", true);
      if (desktop) {
        const panels = gsap.utils.toArray(".edu-panel");
        gsap.set(panels.slice(1), { yPercent: 100 });
        gsap.from(panels[0].querySelector(".edu-visual"), { scale: 0.6, rotate: -14, autoAlpha: 0, ease: "back.out(1.6)",
          scrollTrigger: { trigger: ".edu", start: "top 85%", end: "top 15%", scrub: 0.6 } });
        const hold = 0.8; // each chapter holds still this long (in viewports of scroll) before the next cuts in
        const chaptersTl = gsap.timeline({ scrollTrigger: { trigger: ".edu", start: "top top", scrub: 0.7, pin: true, anticipatePin: 1,
          end: () => `+=${window.innerHeight * chaptersTl.duration()}`, invalidateOnRefresh: true } });
        panels.slice(1).forEach((panel, index) => {
          const at = hold + index * (1 + hold);
          chaptersTl
            // explicit start value: tweening from filter "none" would start at brightness(0), i.e. black
            .fromTo(panels[index], { scale: 1, filter: "brightness(1)" }, { scale: 0.88, filter: "brightness(0.55)", ease: "none" }, at)
            .to(panel, { yPercent: 0, ease: "none" }, at)
            .from(panel.querySelectorAll(".edu-copy > *"), { y: 46, autoAlpha: 0, stagger: 0.06, ease: "power2.out", duration: 0.4 }, at + 0.5)
            .from(panel.querySelector(".edu-visual"), { scale: 0.5, rotate: -18, autoAlpha: 0, ease: "back.out(1.7)", duration: 0.45 }, at + 0.45);
        });
        chaptersTl.to({}, { duration: hold }); // last chapter holds before the section unpins
      } else {
        // Chapters stack like cards: each sticks once fully read (top = viewport − its height, so tall ones still scroll),
        // the next slides over it and the one underneath sinks back. Each cuts in from a framed inset, emblem and copy scrub in.
        const panels = gsap.utils.toArray(".edu-panel");
        panels.forEach((panel, index) => {
          if (index < panels.length - 1) {
            gsap.set(panel, { position: "sticky", top: () => Math.min(0, window.innerHeight - panel.offsetHeight) });
            gsap.fromTo(panel, { scale: 1, "--dim": 0 }, { scale: 0.9, "--dim": 0.65, ease: "none", transformOrigin: "50% 0", // dim via overlay: fading the card would show the one beneath
              scrollTrigger: { trigger: panels[index + 1], start: "top bottom", end: "top top", scrub: true } });
          }
          if (index) gsap.fromTo(panel, { clipPath: "inset(8% 6% 0% 6% round 2rem)" }, { clipPath: "inset(0% 0% 0% 0% round 0rem)", ease: "none",
            scrollTrigger: { trigger: panel, start: "top bottom", end: "top 30%", scrub: 0.5 } });
          scrubIn(panel.querySelector(".edu-visual"), { scale: 0.5, rotate: -16, autoAlpha: 0 }, panel, "top 80%", "top 25%");
          scrubIn(panel.querySelectorAll(".edu-copy > *"), { y: 60, autoAlpha: 0, stagger: 0.1 }, panel.querySelector(".edu-copy"));
        });
      }

      // ── Scene 6 · Journey: desktop pins and travels sideways, the path drawing as it goes; phones stack the stops and scrub each one in.
      cut(".journey", true);
      if (desktop) {
        const journey = root.current.querySelector(".journey-track");
        const journeyDistance = () => journey.scrollWidth - journey.parentElement.clientWidth;
        gsap.set(".journey-reel", { overflow: "hidden" });
        gsap.set(".journey-path path", { strokeDasharray: "0.012 0.012" });
        const journeyTween = gsap.to(journey, { x: () => -journeyDistance(), ease: "none",
          scrollTrigger: { trigger: ".journey-reel", start: "top top", end: () => `+=${journeyDistance() * 1.2}`, scrub: 0.8, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
        gsap.fromTo(".journey-path path", { strokeDashoffset: 1, opacity: 0.2 }, { strokeDashoffset: 0, opacity: 1, ease: "none",
          scrollTrigger: { trigger: ".journey-reel", start: "top top", end: () => `+=${journeyDistance() * 1.2}`, scrub: true } });
        gsap.utils.toArray(".journey-slide").forEach((slide) => {
          const stop = (start, end) => ({ trigger: slide, containerAnimation: journeyTween, start, end, scrub: 0.6 });
          gsap.from(slide.querySelectorAll(".journey-copy > *"), { x: 120, autoAlpha: 0, stagger: 0.05, ease: "power2.out", scrollTrigger: stop("left 90%", "left 35%") });
          gsap.from(slide.querySelector(".journey-hero"), { scale: 0.78, rotate: -6, autoAlpha: 0, ease: "power2.out", scrollTrigger: stop("left 95%", "left 40%") });
          gsap.from(slide.querySelectorAll(".journey-polaroid"), { y: 260, rotate: (index) => [-28, 22, -16][index], autoAlpha: 0, stagger: 0.08, ease: "back.out(1.4)", scrollTrigger: stop("left 75%", "left 15%") });
        });
      } else {
        // Each stop: copy slides in from the left, the main shot lands, polaroids are tossed on top.
        gsap.utils.toArray(".journey-slide").forEach((slide) => {
          const visual = slide.querySelector(".journey-visual");
          scrubIn(slide.querySelectorAll(".journey-copy > *"), { x: -60, autoAlpha: 0, stagger: 0.08 }, slide, "top 85%", "top 35%");
          scrubIn(slide.querySelector(".journey-hero"), { scale: 0.75, rotate: -8, autoAlpha: 0 }, visual, "top 95%", "top 50%");
          scrubIn(slide.querySelectorAll(".journey-polaroid"), { y: 160, rotate: (index) => [-24, 20, -14][index], autoAlpha: 0, stagger: 0.1 }, visual, "top 85%", "top 30%");
        });
      }

      // ── Scene 7 · Credits: an iris opens on the cobalt frame, then the lines and channels step in.
      cut(".outro");
      gsap.fromTo(".outro-iris", { clipPath: "circle(12% at 50% 55%)" }, { clipPath: "circle(150% at 50% 55%)", ease: "none",
        scrollTrigger: { trigger: ".outro", start: "top 90%", end: "top 10%", scrub: 0.6 } });
      // Content plays as one beat once the iris is mostly open (not scrubbed: half-way states stacked the mail over the tiles).
      gsap.timeline({ scrollTrigger: { trigger: ".outro", start: "top 35%", toggleActions: "play none none reverse" } })
        .from(".outro-title > span:first-child, .outro-line, .outro-mail", { y: 40, autoAlpha: 0, stagger: 0.1, duration: 0.7, ease: "power3.out" })
        .from(".outro-channels li", { y: 40, scale: 0.8, autoAlpha: 0, stagger: 0.06, duration: 0.6, ease: "back.out(1.6)" }, "-=0.35")
        .from(".outro-credits", { autoAlpha: 0, duration: 0.6 }, "-=0.2");

      // Resizing across 820px swaps scripts: hand the reels back to native scrolling.
      return () => {
        gsap.set(".skills-reel, .skills-progress, .journey-reel", { clearProps: "overflow,display" });
        gsap.set(".edu-panel", { clearProps: "all" });
      };
    });
  }, { scope: root });
  return (
    <div ref={root} className="creator-home">
      <DocScroll />
      <FilmHud language={language} />
      <HeroSection copy={copy} />

      <section id="more" className="creator-marquee" aria-label={copy.workKicker}>
        {[marquee, [...marquee].reverse()].map((row, rowIndex) => <div className="creator-marquee-viewport" key={rowIndex}>
          <div className={`creator-marquee-track ${rowIndex ? "is-reverse" : ""}`}>
            {[...row, ...row].map((item, index) => <SmartImg key={`${item.id}-${index}`} src={item.src} alt={index < row.length ? item.title : ""} />)}
          </div>
        </div>)}
      </section>

      <section id="about" className="creator-about">
        <div className="creator-about-text">
          <motion.p className="creator-kicker" {...reveal}>{copy.aboutKicker}</motion.p>
          <RiseHeading>{copy.aboutTitle.split("\n").map((line, index) => <span key={line}>{index ? <em>{line}</em> : line}</span>)}</RiseHeading>
          <p className="creator-about-copy">{copy.about.split(" ").map((word, index) => <span key={index} className="sub-word">{word} </span>)}</p>
          <motion.div className="creator-about-meta" {...reveal}>
            {copy.meta.map(([label, value]) => <span key={label}>{label}<b>{value}</b></span>)}
          </motion.div>
        </div>
        <figure className="creator-about-photo">
          <svg width="0" height="0" aria-hidden="true" focusable="false">
            {/* Duotone from the hero palette: shadows → cobalt #283DB7, highlights → sun #FFBF08 */}
            <filter id="about-duotone" colorInterpolationFilters="sRGB">
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer>
                <feFuncR type="table" tableValues="0.157 1" />
                <feFuncG type="table" tableValues="0.239 0.749" />
                <feFuncB type="table" tableValues="0.718 0.031" />
              </feComponentTransfer>
            </filter>
          </svg>
          <motion.img src="/image/hugo-about.webp" alt={language === "vi" ? "Hugo Wishpax quàng khăn len, nhìn sang bên" : "Hugo Wishpax in a knitted scarf, looking to the side"} loading="lazy"
            initial={{ opacity: 0, scale: 1.18, rotate: -12 }} whileInView={{ opacity: 1, scale: 1, rotate: -3 }}
            viewport={{ once: true, amount: 0.4 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} />
          <Signature />
        </figure>
      </section>

      <section id="skills" className="creator-skills">
        <header><RiseHeading>{copy.techHeading}</RiseHeading><motion.p {...reveal}>{copy.techNote}</motion.p></header>
        {/* Reel: pinned while the frames travel sideways; GSAP drives it, native horizontal scroll is the fallback. */}
        <div className="skills-reel">
          <div className="skills-track">
            {skillFrames(language).map((frame, index, all) => <article key={frame.title} className="skills-frame">
              <p className="skills-frame-count">{index + 1} / {all.length}</p>
              <h3>{frame.title}</h3>
              <ul className="skills-frame-words">
                {frame.text.map((name) => <li key={name}><span>{name}</span></li>)}
              </ul>
              {frame.try && <Link className="skills-try" to={frame.try[0]}>{frame.try[1]} <ArrowUpRight size={16} /></Link>}
            </article>)}
          </div>
        </div>
        <div className="skills-progress" aria-hidden="true"><i /></div>
      </section>

      <Education language={language} copy={copy} from={`${location.pathname}${location.search}${location.hash}`} />

      <section id="projects" className="journey">
        <header className="journey-intro"><motion.p className="creator-kicker" {...reveal}>{copy.workKicker}</motion.p><RiseHeading>{copy.workHeading}</RiseHeading><motion.p {...reveal}>{copy.workNote}</motion.p></header>
        <div className="journey-reel">
          <div className="journey-track">
            <svg className="journey-path" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
              <path pathLength="1" d="M0 70 C120 20 220 95 333 55 S560 15 666 60 S880 95 1000 40" />
            </svg>
            {featured.map((project, index) => <JourneySlide key={project.id} project={project} index={index} total={featured.length} t={t} stopLabel={copy.stop} liveLabel={copy.live} from={`${location.pathname}${location.search}${location.hash}`} />)}
            <div className="journey-end">
              <p>{copy.workEnd}</p>
              <Link className="journey-cta" to="/project" state={{ from: location.pathname }}>{t("intro.story.work.viewAll")} <ArrowUpRight size={18} /></Link>
            </div>
          </div>
        </div>
      </section>
      <Contact copy={copy} />
    </div>
  );
}
