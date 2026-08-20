import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useTranslation } from "react-i18next";
import logos from "./logos";
import { API_BASE } from "../config/apiBase";
import { isVietnameseLanguage } from "../i18n/languages";

const linkClass = "inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const btnBase = "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const btnClass = `${btnBase} border-border text-foreground hover:bg-muted`;
const btnPrimaryClass = `${btnBase} border-foreground bg-foreground text-background hover:opacity-90`;
const colTitleClass = "text-xs font-bold uppercase tracking-[0.12em] text-foreground";

const trustContent = {
  vi: {
    capabilityLabel: "Năng lực",
    capabilities: ["PWA", "Offline", "Mobile & safe area", "SEO + JSON-LD", "Reduce Motion", "Xác thực máy chủ"],
    referencesTitle: "Liên kết kiểm tra & chính sách",
    referencesDescription: "Công cụ kiểm tra và trang chính sách — bấm để tự đối chiếu. Không phải mục nào cũng là chứng nhận của bên thứ ba.",
    referencesLabel: "Các liên kết kiểm tra, chính sách và thông tin tham chiếu",
  },
  en: {
    capabilityLabel: "Capabilities",
    capabilities: ["PWA", "Offline", "Mobile & safe areas", "SEO + JSON-LD", "Reduced Motion", "Server verification"],
    referencesTitle: "Checks, policies & references",
    referencesDescription: "Public checkers and policy pages — click to verify for yourself. Not every item is a third-party certification.",
    referencesLabel: "Website checks, policies and reference information",
  },
  es: {
    capabilityLabel: "Capacidades",
    capabilities: ["PWA", "Offline", "Áreas móviles y seguras", "SEO + JSON-LD", "Movimiento Reducido", "Verificación del Servidor"],
    referencesTitle: "Controles, Políticas y Referencias",
    referencesDescription: "Herramientas de verificación pública y páginas de políticas — haz clic para verificar por ti mismo. No todos los elementos son certificaciones de terceros.",
    referencesLabel: "Verificaciones de sitio, políticas e información de referencia",
  },
  fr: {
    capabilityLabel: "Capacités",
    capabilities: ["PWA", "Hors Ligne", "Zones mobiles et sécurisées", "SEO + JSON-LD", "Mouvement Réduit", "Vérification Serveur"],
    referencesTitle: "Vérifications, Politiques & Références",
    referencesDescription: "Vérificateurs publics et pages de politiques — cliquez pour vérifier par vous-même. Tous les éléments ne sont pas des certifications tierces.",
    referencesLabel: "Vérifications de site, politiques et informations de référence",
  },
  ko: {
    capabilityLabel: "기능",
    capabilities: ["PWA", "오프라인", "모바일 및 안전 영역", "SEO + JSON-LD", "움직임 줄이기", "서버 확인"],
    referencesTitle: "확인, 정책 및 참조",
    referencesDescription: "공개 검사기 및 정책 페이지 — 직접 클릭하여 확인해 보세요. 모든 항목이 타사 인증은 아닙니다.",
    referencesLabel: "웹사이트 검사, 정책 및 참조 정보",
  },
  th: {
    capabilityLabel: "ความสามารถ",
    capabilities: ["PWA", "ออฟไลน์", "พื้นที่มือถือและปลอดภัย", "SEO + JSON-LD", "ลดการเคลื่อนไหว", "การตรวจสอบเซิร์ฟเวอร์"],
    referencesTitle: "การตรวจสอบ นโยบาย & การอ้างอิง",
    referencesDescription: "เครื่องมือตรวจสอบสาธารณะและหน้านโยบาย — คลิกเพื่อตรวจสอบด้วยตัวคุณเอง ไม่ใช่ทุกรายการจะเป็นการรับรองจากบุคคลที่สาม",
    referencesLabel: "การตรวจสอบเว็บไซต์ นโยบาย และข้อมูลอ้างอิง",
  },
  zh: {
    capabilityLabel: "功能",
    capabilities: ["PWA", "离线", "移动与安全区域", "SEO + JSON-LD", "减少动画", "服务器验证"],
    referencesTitle: "检查、政策与参考",
    referencesDescription: "公共检查工具和政策页面 — 点击自行验证。并非所有项目都是第三方认证。",
    referencesLabel: "网站检查、政策和参考信息",
  }
};

function LogoMarquee({ trust }) {
  const sectionRef = useRef(null);
  const [shouldRenderLogos, setShouldRenderLogos] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) {
      setShouldRenderLogos(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldRenderLogos(true);
      observer.disconnect();
    }, { rootMargin: "480px 0px" });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} aria-labelledby="footer-reference-title" className="border-b border-border pb-8">
      <h2 id="footer-reference-title" className={colTitleClass}>{trust.referencesTitle}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {trust.referencesDescription}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground" aria-label={trust.capabilityLabel}>
        <strong className="font-bold uppercase tracking-[0.12em] text-foreground">{trust.capabilityLabel}</strong>
        {trust.capabilities.map((capability) => (
          <span key={capability} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            {capability}
          </span>
        ))}
      </div>

      {/* Băng chạy: track chứa 2 bản danh sách, animation dịch -50% nên nối liền */}
      <div
        className="relative mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4rem,black_calc(100%-4rem),transparent)]"
        aria-busy={!shouldRenderLogos}
      >
        {shouldRenderLogos ? (
          <ul className="flex w-max animate-logo-marquee items-center gap-3" aria-label={trust.referencesLabel}>
            {[0, 1].map((copy) => logos.map((Logo, index) => (
              <li
                key={`${copy}-${Logo.displayName || Logo.name || index}`}
                className="flex shrink-0 items-center"
                aria-hidden={copy === 1 ? "true" : undefined}
              >
                <Logo />
              </li>
            )))}
          </ul>
        ) : (
          <div className="h-9 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}

export default function Footer() {
  const { data } = useData();
  const { t, i18n } = useTranslation();
  const email = "contact@hugowishpax.studio";
  const resolvedLang = i18n.resolvedLanguage || i18n.language || "vi";
  const locale = trustContent[resolvedLang] ? resolvedLang : (isVietnameseLanguage(resolvedLang) ? "vi" : "en");
  const trust = trustContent[locale];

  return (
    <footer className="site-trust-footer w-full snap-start border-t border-border bg-background px-[max(1rem,env(safe-area-inset-left,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <LogoMarquee trust={trust} />

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[1.2fr_1fr_1fr] md:gap-8">
          <div className="col-span-2 max-w-sm md:col-span-1">
            <Link to="/introduction" className="inline-flex min-h-11 items-center text-lg font-extrabold tracking-[-0.03em] text-foreground">
              Hugo Studio
            </Link>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline", "Một góc số dành cho người học, cá nhân và những cửa hàng nhỏ cần hiện diện chỉn chu trên internet.")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/booking" className={btnPrimaryClass}>
                {t("footer.booking", "Đặt lịch trao đổi")}
              </Link>
              <a href={`mailto:${email}`} className={btnClass}>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">mail</span>
                Email
              </a>
              <a href={`${API_BASE}/contact/zalo`} target="_blank" rel="noreferrer" className={btnClass}>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat_bubble</span>
                Zalo
              </a>
            </div>
          </div>

          <nav aria-label={t("footer.links", "Khám phá")}>
            <p className={colTitleClass}>{t("footer.links", "Khám phá")}</p>
            <ul className="mt-2 flex flex-col">
              <li><Link to="/introduction" className={linkClass}>{t("footer.introduction", "Giới thiệu")}</Link></li>
              <li><Link to="/student-pricing" className={linkClass}>{t("navbar.benefits", "Quyền lợi HSSV")}</Link></li>
              <li><Link to="/services" className={linkClass}>{t("footer.services", "Dịch vụ")}</Link></li>
              <li><Link to="/faq" className={linkClass}>{t("navbar.faq", "Hỏi đáp")}</Link></li>
            </ul>
          </nav>

          <nav aria-label={t("footer.connect", "Bắt đầu")}>
            <p className={colTitleClass}>{t("footer.connect", "Bắt đầu")}</p>
            <ul className="mt-2 flex flex-col">
              <li><Link to="/login" className={linkClass}>{t("navbar.login", "Đăng nhập")}</Link></li>
              <li>
                <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-donation"))} className={linkClass}>
                  {t("footer.supportServer", "Ủng hộ máy chủ")}
                </button>
              </li>
              <li><Link to="/privacy-policy" className={linkClass}>{t("footer.privacyPolicy", "Chính sách bảo mật")}</Link></li>
              <li><Link to="/terms" className={linkClass}>{t("footer.terms", "Điều khoản sử dụng")}</Link></li>
              <li><Link to="/user-guide" className={linkClass}>{t("footer.userGuide", "Hướng dẫn sử dụng")}</Link></li>
            </ul>
          </nav>
        </div>

        <p className="border-t border-border pt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {data.profile.fullName || "Peter Hugo Wishpax Le"}
        </p>
      </div>
    </footer>
  );
}
