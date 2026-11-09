import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import MobileDrawer from "./MobileDrawer";
import HugoLogo from "./HugoLogo";
import { AccountOrb } from "./NavDock";
import { changeAppLanguage } from "../i18n/config";
import { SELECTABLE_LANGUAGES, languageCode } from "../i18n/languages";

// Header (08/11/2026): mờ tới mức gần như không có — chỉ còn lớp blur, không
// viền, không nền; wordmark + mục in hoa như portfolio, viên nền trượt theo
// chuột, ẩn khi vuốt xuống, hiện lại khi vuốt lên. Lớp `dark` bật khi nền phía
// sau tối để NavDock/Drawer đổi token theo.
//
// HIỆU NĂNG (09/11): thanh này có ở mọi trang. Đọc cuộn gộp theo khung hình
// (rAF); dò màu nền (elementsFromPoint + getComputedStyle bắt trình duyệt tính
// lại bố cục) chỉ chạy tối đa ~4 lần/giây. Trước đó chạy ở MỌI sự kiện cuộn
// và làm cả web giật. Trang cuộn ở #root (mặc định) hoặc ở cửa sổ (trang kể
// chuyện bật html.doc-scroll) — nghe cả hai.

// Nền ngay dưới thanh sáng hay tối? Đi từ phần tử phía sau lên tới nền đặc đầu
// tiên — thanh gần như trong suốt nên màu chữ phải theo nền, không theo theme.
function surfaceIsLight(y) {
  const behind = document.elementsFromPoint(window.innerWidth / 2, y).find((el) => !el.closest("[data-hs-nav]"));
  for (let node = behind; node; node = node.parentElement) {
    const [r, g, b, a = 1] = getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    if (a > 0.5) return 0.2126 * r + 0.7152 * g + 0.0722 * b > 160;
  }
  return !document.documentElement.classList.contains("dark");
}

const SHORT = { vi: "VI", en: "EN", zh: "中" };

// Nút bên phải theo portfolio: đổi sáng/tối (vòng tròn lan từ nút, View
// Transition) + viên ngôn ngữ (quả địa cầu + mã) mở danh sách.
function NavActions() {
  const { t, i18n } = useTranslation();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const current = languageCode(i18n.resolvedLanguage || i18n.language);
  const toggleTheme = (event) => {
    const next = !dark;
    try { localStorage.setItem("hugo-theme", next ? "dark" : "light"); } catch { /* chỉ là tiện ích */ }
    const apply = () => { document.documentElement.classList.toggle("dark", next); setDark(next); };
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { apply(); return; }
    const box = event.currentTarget.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: "cubic-bezier(.16,1,.3,1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  };
  const pick = (code, details) => { details?.removeAttribute("open"); if (code !== current) changeAppLanguage(code); };
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <button type="button" onClick={toggleTheme}
        aria-label={dark ? t("navbar.lightMode", "Giao diện sáng") : t("navbar.darkMode", "Giao diện tối")}
        className="grid h-11 w-11 place-items-center rounded-xl text-foreground/90 transition-colors hover:bg-foreground/10">
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{dark ? "light_mode" : "dark_mode"}</span>
      </button>
      <details className="group relative">
        <summary aria-label={t("navbar.chooseLanguage", "Chọn ngôn ngữ")}
          className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-2xl bg-foreground/10 px-4 text-[13px] font-bold text-foreground/90 transition-colors hover:bg-foreground/15 [&::-webkit-details-marker]:hidden">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">language</span>
          {SHORT[current] || current.toUpperCase()}
        </summary>
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] grid min-w-[170px] gap-0.5 rounded-2xl border border-foreground/10 bg-background p-1.5 shadow-xl">
          {SELECTABLE_LANGUAGES.map((language) => (
            <button key={language.code} type="button" role="menuitem"
              onClick={(event) => pick(language.code, event.currentTarget.closest("details"))}
              className={`flex h-11 items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition-colors hover:bg-foreground/5 ${language.code === current ? "text-foreground" : "text-foreground/60"}`}>
              {language.label}{language.code === current && <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check</span>}
            </button>
          ))}
        </div>
      </details>
      <AccountOrb />
    </div>
  );
}

export default function Navbar() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(null);
  const [hidden, setHidden] = useState(false);
  const scrolled = useMotionValue(0);
  const progress = useSpring(scrolled, { stiffness: 180, damping: 28, mass: 0.25 });
  const [onLight, setOnLight] = useState(false);
  useEffect(() => {
    const root = document.getElementById("root");
    let frame = 0;
    let last = 0;
    let lastProbe = 0;
    const read = () => {
      frame = 0;
      const docScroll = document.documentElement.classList.contains("doc-scroll");
      const y = docScroll ? window.scrollY : root?.scrollTop || 0;
      const max = docScroll ? document.documentElement.scrollHeight - window.innerHeight : (root?.scrollHeight || 0) - (root?.clientHeight || 0);
      scrolled.set(max > 0 ? y / max : 0);
      setHidden(y > last && y > 120);
      last = y;
      const now = performance.now();
      if (now - lastProbe > 250) { lastProbe = now; setOnLight(surfaceIsLight(72)); }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    window.addEventListener("scroll", onScroll, { passive: true });
    root?.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root?.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [scrolled]);
  useEffect(() => {
    const check = () => setOnLight(surfaceIsLight(72));
    const late = setTimeout(check, 600); // trang lazy: đợi chunk vẽ xong
    check();
    return () => clearTimeout(late);
  }, [pathname]);

  const items = [
    { to: "/", label: t("footer.introduction", "Giới thiệu") },
    { to: "/services", label: t("navbar.services", "Dịch vụ") },
    { to: "/project", label: t("projectsPage.navLabel", "Dự án") },
    { to: "/faq", label: t("navbar.faq", "Hỏi đáp") },
  ];

  const hover = (key) => ({ onMouseEnter: () => setHovered(key), onFocus: () => setHovered(key) });
  const pill = (key) => (
    <AnimatePresence>
      {hovered === key && (
        <motion.span layoutId="hs-nav-pill" aria-hidden="true"
          className="absolute inset-x-[-10px] inset-y-1.5 -z-10 rounded-xl bg-foreground/10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }} />
      )}
    </AnimatePresence>
  );
  const linkClass = (active) =>
    `relative isolate inline-flex h-11 items-center text-[12px] font-semibold uppercase tracking-[0.1em] outline-none transition-colors ${active ? "text-foreground" : "text-foreground/70 hover:text-foreground"}`;

  return (
    <>
      <motion.div aria-hidden="true" style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-[linear-gradient(90deg,#b600a8,#7621b0,#be4c00)]" />
      <motion.header
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        onFocusCapture={() => setHidden(false)}
        data-hs-nav
        className={`${onLight ? "" : "dark"} sticky top-0 z-50 w-full bg-transparent pt-[env(safe-area-inset-top,0px)] text-foreground backdrop-blur-md transition-colors duration-300`}
      >
        <nav aria-label={t("navbar.main", "Điều hướng chính")} onMouseLeave={() => setHovered(null)}
          className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between gap-4 px-[clamp(1rem,3.5vw,2.5rem)]">
          <Link to="/" viewTransition aria-label="Hugo Studio" {...hover("home")}
            className="relative isolate inline-flex h-11 shrink-0 items-center gap-2.5 text-[14px] font-bold uppercase tracking-[0.08em] text-foreground">
            {pill("home")}<HugoLogo className="h-7 w-7" /><span translate="no">Hugo Studio</span>
          </Link>

          <div className="hidden items-center gap-[clamp(16px,3.5vw,44px)] lg:flex">
            {items.map((item) => (
              <Link key={item.to} to={item.to} viewTransition {...hover(item.to)}
                aria-current={pathname === item.to ? "page" : undefined} className={linkClass(pathname === item.to)}>
                {pill(item.to)}{item.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <NavActions />
            <MobileDrawer />
          </div>
        </nav>
      </motion.header>
    </>
  );
}
