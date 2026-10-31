import React, { useState, useMemo, useRef, useEffect } from "react";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { SocialBrandIcon } from "../../utils/socialBrandHelper";
import { detectSocialPlatform } from "../../utils/socialBrandConstants";
import Aura from "../public/hwagfu/Aura";
import FloatingOrbs from "../public/hwagfu/FloatingOrbs";
import {
  ExternalLink,
  GraduationCap,
  Phone,
  Calendar,
  MapPin,
  Sparkles,
  Briefcase,
  Heart,
  ArrowUpRight,
  ShieldCheck,
  Globe
} from "lucide-react";
import "../../styles/bio-themes/index.css";

const VALID_THEMES = ["edu", "workspace", "sunset", "brutalism", "creative", "studio"];
const THEME_FALLBACKS = {
  default: "workspace",
  frost: "workspace",
  graphite: "studio",
  aurora: "creative",
  flat: "edu",
  stone: "studio",
};

/**
 * Hàm định dạng tiêu đề dịch vụ thông minh:
 * Nếu người dùng lỡ dán URL vào ô tiêu đề, tự động chuyển thành nhãn tinh tế chuẩn Apple.
 */
function getDisplayServiceTitle(title) {
  if (!title) return "Dịch vụ & Hợp tác";
  const str = String(title).trim();
  if (str.startsWith("http://") || str.startsWith("https://")) {
    try {
      const url = new URL(str);
      const path = url.pathname.replace(/^\/|\/$/g, "");
      if (!path || path === "services" || path === "dich-vu") return "Dịch Vụ & Hợp Tác";
      return path.split("/").pop().replace(/[-_]/g, " ").toUpperCase();
    } catch (_) {
      return "Dịch Vụ & Hợp Tác";
    }
  }
  return str;
}

/**
 * Hàm làm sạch và rút gọn URL thông minh chuẩn Apple:
 * Loại bỏ https://, www, và các chuỗi tracking query param dài dòng (?_r=1&_t=...)
 */
function formatCleanUrl(url) {
  if (!url) return "";
  try {
    const raw = String(url).trim();
    let cleaned = raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    cleaned = cleaned.split("?")[0].split("#")[0].replace(/\/$/, "");
    return cleaned;
  } catch (_) {
    return String(url);
  }
}

/**
 * UNIVERSAL BIO VIEW (STUDIO PRODUCT PROFILE FLOW - LIQUID GLASS EDITION)
 * ============================================================================
 * Hiển thị thông tin Bio theo phong cách Studio chuyên nghiệp, tinh tế chuẩn iOS Liquid Glass.
 * 
 * - 100% Thẻ Liquid Glass phân tầng bảo vệ thông tin, không bao giờ bị chìm/chồng đè vào nền.
 * - Lớp nhám mờ (Frosted Noise Grain & Blur Scrim) phủ lên nền giúp dịu mắt và tạo chiều sâu.
 * - Theme độc bản Hugo Studio Signature mang đầy đủ hiệu ứng điện ảnh từ trang Introduction.
 * - Icon mạng xã hội hiển thị chính xác màu sắc thương hiệu của từng nền tảng (TikTok 3D Cyan/Red).
 * - Tự động tạo câu giới thiệu và sở thích thông minh, sắc sảo từ dữ liệu người dùng.
 * - Hiệu ứng trượt nổi (Slide-Up Film Scroll) mượt mà khi vuốt/cuộn màn hình.
 * - Bố cục thông minh, tối ưu 100% trên cả Desktop lẫn Mobile.
 */
export default React.memo(function UniversalBioView({
  bio = {},
  isOnline = false,
  isPreview = false,
  customTemplate,
}) {
  const rawTemplate = customTemplate || bio?.theme?.template || "workspace";
  const template = VALID_THEMES.includes(rawTemplate)
    ? rawTemplate
    : (THEME_FALLBACKS[rawTemplate] || "workspace");
  const themeObj = bio?.theme || {};

  const spotlightRef = useRef(null);

  // Hiệu ứng Projector Spotlight tương tác theo chuột cho theme Hugo Studio
  useEffect(() => {
    if (template !== "studio") return;
    let rafId = null;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let curX = targetX;
    let curY = targetY;

    const handleMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const loop = () => {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      if (spotlightRef.current) {
        spotlightRef.current.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [template]);

  const displayName = bio.displayName || "Hugo Member";
  const usernameSlug = bio.slug || "member";
  const headline = bio.headline || "";
  const profileBio = bio.bio || "";
  const avatarUrl = bio.avatarUrl ? optimizeCloudinaryUrl(bio.avatarUrl, 400) : "";

  const links = useMemo(() => (Array.isArray(bio.links) ? bio.links : []), [bio.links]);
  const projects = useMemo(() => (Array.isArray(bio.projects) ? bio.projects : []), [bio.projects]);
  const services = useMemo(() => (Array.isArray(bio.services) ? bio.services : []), [bio.services]);

  // Tự động cung cấp giới thiệu thông minh & đẹp mắt nếu chưa có
  const resolvedBio = useMemo(() => {
    if (profileBio && profileBio.trim().length > 0) return profileBio;
    const highlights = [];
    if (bio.jobTitle) highlights.push(bio.jobTitle);
    if (bio.education) highlights.push(`học tại ${bio.education}`);
    if (bio.skills) {
      const s = Array.isArray(bio.skills) ? bio.skills.slice(0, 3).join(", ") : bio.skills;
      highlights.push(`chuyên sâu về ${s}`);
    }
    if (highlights.length > 0) {
      return `Xin chào! Tôi là ${displayName}, hiện là ${highlights.join(" • ")}. Tận tâm kiến tạo các giá trị số và trải nghiệm tinh tế, chuẩn mực.`;
    }
    return `Chào mừng bạn đến với không gian số của ${displayName}. Rất vui được kết nối, hợp tác và đồng hành cùng bạn!`;
  }, [profileBio, bio.jobTitle, bio.education, bio.skills, displayName]);

  // Tự động cung cấp sở thích nếu chưa có
  const resolvedHobbies = useMemo(() => {
    if (bio.hobbies && bio.hobbies.trim().length > 0) return bio.hobbies;
    return "Sáng tạo công nghệ, nhiếp ảnh, đọc sách, trải nghiệm không gian mới";
  }, [bio.hobbies]);

  const hasStats = Boolean(bio.height || bio.weight || bio.measurements);
  const hasMeta = Boolean(
    bio.birthday || bio.address || bio.phone || resolvedHobbies || bio.jobTitle || bio.education || bio.skills
  );
  const hasNarrative = Boolean(resolvedBio || hasStats || bio.birthday || bio.address || resolvedHobbies);
  const skillList = useMemo(() => {
    if (Array.isArray(bio.skills)) return bio.skills;
    if (typeof bio.skills === "string") return bio.skills.split(",").map(s => s.trim()).filter(Boolean);
    return [];
  }, [bio.skills]);
  const hasLinks = links.length > 0;
  const hasProjects = projects.length > 0;
  const hasServices = services.length > 0;

  const containerRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Theo dõi vị trí Slide hiện tại khi người dùng vuốt/cuộn
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    if (clientHeight > 0) {
      const idx = Math.round(scrollTop / clientHeight);
      setCurrentSlide(idx);
    }
  };

  const scrollToSlide = (idx) => {
    if (!containerRef.current) return;
    const clientHeight = containerRef.current.clientHeight;
    containerRef.current.scrollTo({
      top: idx * clientHeight,
      behavior: "smooth",
    });
  };

  const handleShareBio = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  // Xác định số lượng slide thực tế
  const slideTitles = useMemo(() => {
    const list = ["Danh tính"];
    if (hasNarrative) list.push("Bản thân");
    if (bio.jobTitle || bio.education || skillList.length > 0) list.push("Chuyên môn");
    if (hasLinks || hasProjects || hasServices) list.push("Kết nối");
    list.push("Hugo Studio");
    return list;
  }, [hasNarrative, bio.jobTitle, bio.education, skillList.length, hasLinks, hasProjects, hasServices]);

  return (
    <main
      ref={containerRef}
      onScroll={handleScroll}
      className={`bio-canvas bio-slide-canvas snap-y snap-mandatory overflow-y-scroll h-[100dvh] w-full scroll-smooth ${isPreview ? "is-preview" : ""}`}
      data-bio-theme={template}
      style={{
        ...(themeObj.bgColor && template === "default" ? { backgroundColor: themeObj.bgColor } : {}),
      }}
    >
      {/* 1. Nền mờ nghệ thuật nhẹ */}
      <div className="bio-film-ambient" aria-hidden="true" />

      {/* 2. Lớp Nhám Mờ Nghệ Thuật Phủ Nền (Frosted Grain & Scrim Layer) */}
      <div className="bio-frosted-scrim-layer" aria-hidden="true">
        <svg className="bio-frosted-grain-overlay">
          <filter id="bio-grain-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#bio-grain-filter)" />
        </svg>
      </div>

      {/* 3. Hugo Studio Cinematic Atmosphere, Floating Orbs & Aura */}
      {template === "studio" && (
        <>
          <Aura className="opacity-90 dark:opacity-85" />
          <FloatingOrbs className="fixed inset-0 pointer-events-none z-0" />
          <div ref={spotlightRef} className="bio-studio-spotlight" aria-hidden="true" />
          <div className="bio-studio-frame" aria-hidden="true">
            <span className="absolute top-2 left-2 font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase select-none">
              REC · 24FPS
            </span>
            <span className="absolute top-2 right-2 font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase select-none">
              432HZ · MASTER
            </span>
            <span className="absolute bottom-2 left-2 font-mono text-[9px] tracking-[0.2em] text-[#00f0ff]/60 uppercase select-none">
              HUGO STUDIO
            </span>
            <span className="absolute bottom-2 right-2 font-mono text-[9px] tracking-[0.2em] text-white/30 uppercase select-none">
              [ 1.85:1 ]
            </span>
          </div>
        </>
      )}

      {/* 4. Thanh Điều Hướng Slide (Dots Indicator Cạnh Phải) */}
      <nav className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3 select-none pointer-events-auto" aria-label="Điều hướng Slide">
        {slideTitles.map((title, idx) => {
          const isActive = currentSlide === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToSlide(idx)}
              title={`Trượt đến slide: ${title}`}
              aria-label={`Slide ${idx + 1}: ${title}`}
              className={`transition-all duration-300 rounded-full flex items-center justify-center ${
                isActive
                  ? "size-3.5 bg-current shadow-[0_0_12px_currentColor] scale-125"
                  : "size-2 bg-current opacity-30 hover:opacity-75 hover:scale-110"
              }`}
            />
          );
        })}
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════════
          SLIDE 1: HERO IDENTITY (DANH TÍNH & HỒ SƠ CHÍNH)
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="bio-slide-screen snap-start h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 shrink-0 relative box-border">
        <div className="bio-slide-card-wrap w-full max-w-[540px] my-auto">
          <div className="bio-hero-liquid-card">
            <div className="bio-hero-block">
              <div className="bio-avatar-frame">
                <div className="bio-avatar-wrapper">
                  {avatarUrl ? (
                    <img className="bio-avatar" src={avatarUrl} alt={displayName} />
                  ) : (
                    <div className="bio-avatar-placeholder">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`bio-online-indicator ${isOnline ? "is-online" : "is-offline"}`}
                    title={isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                  />
                </div>
              </div>

              <div className="bio-identity-text">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h1 className="bio-name">{displayName}</h1>
                  {bio.isEduVerified && (
                    <span className="text-sky-400 inline-flex items-center" title="Đã xác minh sinh viên">
                      <GraduationCap className="size-4" />
                    </span>
                  )}
                  {bio.status === "active" && (
                    <span className="text-emerald-400 inline-flex items-center" title="Tài khoản chính thức">
                      <ShieldCheck className="size-4" />
                    </span>
                  )}
                </div>

                <p className="bio-slug">@{usernameSlug}</p>

                {headline && <p className="bio-headline">{headline}</p>}

                {/* Thanh Icon Mạng Xã Hội Nhanh (Màu Thương Hiệu Chuẩn Xác) */}
                {hasLinks && (
                  <div className="bio-social-quick-bar" aria-label="Mạng xã hội">
                    {links.map((link, idx) => {
                      const platform = detectSocialPlatform(link.label, link.url);
                      return (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="bio-social-quick-btn"
                          title={link.label || platform}
                          aria-label={link.label || platform}
                        >
                          <SocialBrandIcon platform={platform} className="size-5" />
                        </a>
                      );
                    })}
                  </div>
                )}

                {/* Mũi tên hướng dẫn vuốt xuống Slide 2 */}
                <button
                  type="button"
                  onClick={() => scrollToSlide(1)}
                  className="bio-scroll-hint pt-4 select-none cursor-pointer group bg-transparent border-0"
                  aria-label="Vuốt xuống slide tiếp theo"
                >
                  <span className="text-xs opacity-50 tracking-widest uppercase text-[9px] font-medium block mb-0.5 group-hover:opacity-100 transition-opacity">
                    Vuốt xuống để khám phá
                  </span>
                  <span className="inline-block animate-bounce text-base opacity-60 group-hover:opacity-100 transition-opacity">
                    ↓
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════════
          SLIDE 2: NARRATIVE & SPECS (VỀ BẢN THÂN & THÔNG SỐ)
      ══════════════════════════════════════════════════════════════════════════ */}
      {hasNarrative && (
        <section className="bio-slide-screen snap-start h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 shrink-0 relative box-border">
          <div className="bio-slide-card-wrap w-full max-w-[540px] my-auto">
            <div className="bio-specs-sheet">
              <div className="bio-section-dash" aria-hidden="true" />
              
              <div className="bio-section-caption text-center mb-1">
                <span>VỀ BẢN THÂN</span>
              </div>

              {/* Giới thiệu / Triết lý cá nhân thông minh */}
              {resolvedBio && (
                <div className="bio-statement-card">
                  <span className="bio-statement-mark left font-serif select-none">“</span>
                  <p className="bio-statement-text font-serif italic tracking-wide">{resolvedBio}</p>
                  <span className="bio-statement-mark right font-serif select-none">”</span>
                </div>
              )}

              {/* Chỉ số thể chất / Số đo */}
              {hasStats && (
                <div className="bio-metrics-grid">
                  {bio.height && (
                    <div className="bio-metric-cell">
                      <span className="bio-metric-lbl">CHIỀU CAO</span>
                      <span className="bio-metric-num">{bio.height}</span>
                    </div>
                  )}
                  {bio.weight && (
                    <div className="bio-metric-cell">
                      <span className="bio-metric-lbl">CÂN NẶNG</span>
                      <span className="bio-metric-num">{bio.weight}</span>
                    </div>
                  )}
                  {bio.measurements && (
                    <div className="bio-metric-cell">
                      <span className="bio-metric-lbl">SỐ ĐO</span>
                      <span className="bio-metric-num">{bio.measurements}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Bảng thông tin: Năm sinh, Khu vực, Sở thích */}
              <div className="bio-meta-table mt-1">
                {bio.birthday && (
                  <div className="bio-meta-row">
                    <span className="bio-meta-lbl">
                      <Calendar className="size-3.5" /> Năm sinh:
                    </span>
                    <span className="bio-meta-val font-mono">{bio.birthday}</span>
                  </div>
                )}
                {bio.address && (
                  <div className="bio-meta-row">
                    <span className="bio-meta-lbl">
                      <MapPin className="size-3.5" /> Khu vực:
                    </span>
                    <span className="bio-meta-val">{bio.address}</span>
                  </div>
                )}
                {resolvedHobbies && (
                  <div className="bio-meta-row">
                    <span className="bio-meta-lbl">
                      <Heart className="size-3.5" /> Sở thích:
                    </span>
                    <span className="bio-meta-val">{resolvedHobbies}</span>
                  </div>
                )}
              </div>

              {/* Mũi tên sang Slide tiếp */}
              <button
                type="button"
                onClick={() => scrollToSlide(2)}
                className="bio-scroll-hint pt-2 select-none cursor-pointer group bg-transparent border-0"
                aria-label="Vuốt xuống slide tiếp theo"
              >
                <span className="inline-block animate-bounce text-sm opacity-50 group-hover:opacity-100">↓</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SLIDE 3: CRAFT & CAREER (HỌC VẤN, NGHỀ NGHIỆP & KỸ NĂNG)
      ══════════════════════════════════════════════════════════════════════════ */}
      {(bio.jobTitle || bio.education || skillList.length > 0) && (
        <section className="bio-slide-screen snap-start h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 shrink-0 relative box-border">
          <div className="bio-slide-card-wrap w-full max-w-[540px] my-auto">
            <div className="bio-specs-sheet">
              <div className="bio-section-dash" aria-hidden="true" />
              
              <div className="bio-section-caption text-center mb-1">
                <span>HỌC VẤN & SỰ NGHIỆP</span>
              </div>

              <div className="bio-meta-table">
                {bio.jobTitle && (
                  <div className="bio-meta-row">
                    <span className="bio-meta-lbl">
                      <Briefcase className="size-3.5" /> Nghề nghiệp:
                    </span>
                    <span className="bio-meta-val font-semibold">{bio.jobTitle}</span>
                  </div>
                )}
                {bio.education && (
                  <div className="bio-meta-row">
                    <span className="bio-meta-lbl">
                      <GraduationCap className="size-3.5" /> Học vấn:
                    </span>
                    <span className="bio-meta-val">{bio.education}</span>
                  </div>
                )}
                {bio.phone && (
                  <div className="bio-meta-row">
                    <span className="bio-meta-lbl">
                      <Phone className="size-3.5" /> Booking / Liên hệ:
                    </span>
                    <a href={`tel:${bio.phone}`} className="bio-meta-val font-mono underline hover:opacity-80">
                      {bio.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Kỹ năng chuyên môn */}
              {skillList.length > 0 && (
                <div className="bio-skills-stage mt-2">
                  <div className="bio-section-caption mb-2">
                    <Sparkles className="size-3" />
                    <span>KỸ NĂNG CHUYÊN MÔN</span>
                  </div>
                  <div className="bio-skills-cloud">
                    {skillList.map((skill, idx) => (
                      <span key={idx} className="bio-skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mũi tên sang Slide tiếp */}
              <button
                type="button"
                onClick={() => scrollToSlide(hasNarrative ? 3 : 2)}
                className="bio-scroll-hint pt-3 select-none cursor-pointer group bg-transparent border-0"
                aria-label="Vuốt xuống slide tiếp theo"
              >
                <span className="inline-block animate-bounce text-sm opacity-50 group-hover:opacity-100">↓</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SLIDE 4: CHANNELS & WORKS (KÊNH KẾT NỐI & DỰ ÁN)
      ══════════════════════════════════════════════════════════════════════════ */}
      {(hasLinks || hasProjects || hasServices) && (
        <section className="bio-slide-screen snap-start h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 shrink-0 relative box-border">
          <div className="bio-slide-card-wrap w-full max-w-[540px] my-auto flex flex-col gap-4 max-h-[85vh] overflow-y-auto pr-1">
            <div className="bio-specs-sheet">
              <div className="bio-section-dash" aria-hidden="true" />
              
              <div className="bio-section-caption text-center mb-1">
                <Globe className="size-3.5" />
                <span>LIÊN KẾT & KÊNH KẾT NỐI</span>
              </div>

              {hasLinks && (
                <div className="bio-icon-links-grid">
                  {links.map((link, index) => {
                    const platform = detectSocialPlatform(link.label || link.title, link.url);
                    const label = link.label || link.title || platform;
                    return (
                      <a
                        key={link._id || link.id || index}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="bio-icon-link-btn"
                        title={label}
                        aria-label={label}
                      >
                        <SocialBrandIcon platform={platform} className="size-6" />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* Dự án tiêu biểu */}
              {hasProjects && (
                <>
                  <div className="bio-section-caption mt-2 mb-1">
                    <Briefcase className="size-3.5" />
                    <span>DỰ ÁN TIÊU BIỂU</span>
                  </div>
                  <div className="bio-works-reel">
                    {projects.map((proj, index) => {
                      const title = proj.title || proj.name || "Dự án";
                      const desc = proj.description || proj.desc || "";
                      const link = proj.link || proj.url || proj.demoUrl || "";
                      const img = proj.image || proj.thumbnail || proj.imageUrl || "";
                      return (
                        <div key={proj._id || proj.id || index} className="bio-film-frame">
                          {img && (
                            <div className="bio-frame-screen">
                              <img
                                src={img}
                                alt={title}
                                className="bio-frame-img"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="bio-frame-meta">
                            <div className="bio-frame-title-row">
                              <h3 className="bio-frame-title">{title}</h3>
                              {link && (
                                <a
                                  href={link}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="bio-frame-cta"
                                  aria-label={`Xem dự án ${title}`}
                                >
                                  <span>Xem</span>
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                            {desc && (
                              <p className="bio-frame-desc text-xs opacity-70 leading-relaxed line-clamp-2">{desc}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Dịch vụ nếu có */}
              {hasServices && (
                <div className="bio-services-showcase mt-2">
                  {services.slice(0, 2).map((svc, index) => {
                    const displayTitle = getDisplayServiceTitle(svc.title || svc.name);
                    const targetUrl = svc.link || (typeof svc.title === "string" && svc.title.startsWith("http") ? svc.title : null);
                    return (
                      <div key={svc._id || svc.id || index} className="bio-service-card">
                        <div className="bio-service-header">
                          <h3 className="bio-service-title text-sm">{displayTitle}</h3>
                          {svc.price && <span className="bio-service-rate text-xs">{svc.price}</span>}
                        </div>
                        {svc.description && <p className="bio-service-desc text-xs">{svc.description}</p>}
                        {targetUrl && (
                          <div className="bio-service-actions mt-2">
                            <a href={targetUrl} target="_blank" rel="noreferrer" className="bio-service-inquire-btn text-xs py-1.5 px-3">
                              <span>Xem dịch vụ</span>
                              <ArrowUpRight className="size-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Mũi tên sang Slide cuối */}
              <button
                type="button"
                onClick={() => scrollToSlide(slideTitles.length - 1)}
                className="bio-scroll-hint pt-2 select-none cursor-pointer group bg-transparent border-0"
                aria-label="Vuốt xuống trang cuối"
              >
                <span className="text-xs opacity-50 tracking-widest uppercase text-[9px] font-medium block mb-0.5 group-hover:opacity-100">
                  Hugo Studio Showcase
                </span>
                <span className="inline-block animate-bounce text-sm opacity-50 group-hover:opacity-100">↓</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          SLIDE CUỐI: THE GRAND FINALE — QUẢNG BÁ HUGO STUDIO PHÁ CÁCH & ĐỘC BẢN
      ══════════════════════════════════════════════════════════════════════════ */}
      <section className="bio-slide-screen snap-start h-[100dvh] min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 shrink-0 relative box-border">
        <div className="bio-slide-card-wrap w-full max-w-[540px] my-auto">
          <div className="bio-hero-liquid-card text-center p-6 sm:p-8 flex flex-col items-center gap-5 border border-cyan-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            



            {/* Tiêu đề & Tuyên ngôn thương hiệu */}
            <div className="space-y-1.5 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                HUGO STUDIO
              </h2>
              <p className="text-xs sm:text-sm text-cyan-400 font-semibold tracking-wider uppercase">
                Hồ Sơ & Định Danh Số Độc Bản Thế Hệ Mới
              </p>
              <p className="text-xs opacity-75 leading-relaxed pt-1">
                Trang Bio cá nhân của <b>{displayName}</b> được khởi tạo bởi Hugo Studio. Trải nghiệm vuốt slide mượt mà và kết nối 1 chạm không giới hạn.
              </p>
            </div>



            {/* Các nút hành động CTA phá cách */}
            <div className="w-full flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer noopener"
                className="flex-1 py-3 px-5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all hover:scale-102"
              >
                <span>Tạo Bio Miễn Phí Ngay</span>
                <ArrowUpRight className="size-4 stroke-[3]" />
              </a>

              <button
                type="button"
                onClick={handleShareBio}
                className="py-3 px-5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:scale-102 cursor-pointer"
              >
                <span>{copiedLink ? "Đã chép liên kết!" : "Chia sẻ hồ sơ"}</span>
              </button>
            </div>

            {/* Credits footer */}
            <div className="pt-2 text-[10px] opacity-50 tracking-wider">
              © {new Date().getFullYear()} Hugo Studio • hugowishpax.studio
            </div>

          </div>
        </div>
      </section>

    </main>
  );
});
