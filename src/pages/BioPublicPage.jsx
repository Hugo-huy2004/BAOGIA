import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import dataApi from "../services/dataApi";
import { useHeadMeta } from "../hooks/useHeadMeta";
import { optimizeCloudinaryUrl } from "../utils/imageOptimizer";

// Constants
const BRAND_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"];
const FLAT_COLORS = ["#FF4B4B", "#3b82f6", "#10b981", "#ff5f00", "#8b5cf6"];
const BRUTAL_COLORS = ["#FF3333", "#00E676", "#2979FF", "#D500F9", "#FFEA00"];

// Hugo Studio Logo Style with Gradient and We Bare Bears Font
const HugoStudioLogo = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');
    
    .hugo-studio-gradient {
      background: linear-gradient(90deg, #EF4444 0%, #F97316 20%, #EAB308 40%, #22C55E 60%, #3B82F6 80%, #A855F7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .we-bare-bears {
      font-family: 'Fredoka', sans-serif;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    .scrollbar-hide::-webkit-scrollbar {
      display: none !important;
    }
    
    /* Hide scrollbar for IE, Edge and Firefox */
    .scrollbar-hide {
      -ms-overflow-style: none !important;  /* IE and Edge */
      scrollbar-width: none !important;  /* Firefox */
    }
  `}</style>
);

// Gradient colors for brand identity
const BRAND_COLORS_GRADIENT = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"];

// Function to render text with each character in a different color
const RenderColoredText = ({ text }) => {
  if (!text) return null;
  return (
    <>
      {text.split("").map((char, idx) => (
        <span key={idx} style={{ color: BRAND_COLORS_GRADIENT[idx % BRAND_COLORS_GRADIENT.length] }}>
          {char}
        </span>
      ))}
    </>
  );
};

// Hugo Studio Brand Logo component to match styling exactly
const HugoStudioColoredBrandLogo = ({ className = "text-xl sm:text-2xl" }) => {
  const chars = [
    { char: "H", color: "#EF4444" },
    { char: "u", color: "#F97316" },
    { char: "g", color: "#EAB308" },
    { char: "o", color: "#22C55E" },
    { char: " ", color: "transparent" },
    { char: "S", color: "#3B82F6" },
    { char: "t", color: "#6366F1" },
    { char: "u", color: "#A855F7" },
    { char: "d", color: "#EC4899" },
    { char: "i", color: "#06B6D4" },
    { char: "o", color: "#0ea5e9" }
  ];
  return (
    <span className={`we-bare-bears select-none ${className}`}>
      {chars.map((item, idx) => (
        <span key={idx} style={{ color: item.color }}>
          {item.char}
        </span>
      ))}
    </span>
  );
};

const isColorDark = (color) => {
  if (!color) return false;
  const c = color.substring(1);
  const rgb = parseInt(c, 16);
  if (isNaN(rgb)) return false;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 140;
};

const getPatternStyle = (pattern, bgColor) => {
  const isDark = isColorDark(bgColor);
  const opacityColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  
  switch (pattern) {
    case "dots":
      return {
        backgroundImage: `radial-gradient(${opacityColor} 1.5px, transparent 1.5px)`,
        backgroundSize: "16px 16px"
      };
    case "dots-dense":
      return {
        backgroundImage: `radial-gradient(${opacityColor} 1.2px, transparent 1.2px)`,
        backgroundSize: "8px 8px"
      };
    case "stripes":
      return {
        backgroundImage: `linear-gradient(135deg, ${opacityColor} 25%, transparent 25%, transparent 50%, ${opacityColor} 50%, ${opacityColor} 75%, transparent 75%, transparent)`,
        backgroundSize: "24px 24px"
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${opacityColor} 1px, transparent 1px), linear-gradient(90deg, ${opacityColor} 1px, transparent 1px)`,
        backgroundSize: "20px 20px"
      };
    case "waves":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${opacityColor} 8px, ${opacityColor} 16px)`
      };
    default:
      return {};
  }
};

const getBrutalPatternStyle = (pattern, bgColor) => {
  const isDark = isColorDark(bgColor);
  const lineColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";
  const dotColor = isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.22)";
  
  switch (pattern) {
    case "dots":
    case "dots-dense":
      return {
        backgroundImage: `radial-gradient(${dotColor} 3px, transparent 3px)`,
        backgroundSize: "16px 16px"
      };
    case "stripes":
      return {
        backgroundImage: `repeating-linear-gradient(-45deg, ${lineColor}, ${lineColor} 12px, transparent 12px, transparent 24px)`
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${lineColor} 2px, transparent 2px), linear-gradient(90deg, ${lineColor} 2px, transparent 2px)`,
        backgroundSize: "28px 28px"
      };
    case "waves":
      return {
        backgroundImage: `conic-gradient(${lineColor} 25%, transparent 25%, transparent 50%, ${lineColor} 50%, ${lineColor} 75%, transparent 75%)`,
        backgroundSize: "40px 40px"
      };
    default: // "none" or anything else
      return {
        backgroundImage: `radial-gradient(${dotColor} 2.5px, transparent 2.5px)`,
        backgroundSize: "24px 24px"
      };
  }
};

const getFlatPatternStyle = (pattern, bgColor) => {
  const isDark = isColorDark(bgColor);
  const lineColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  
  switch (pattern) {
    case "grid":
      return {
        backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: "20px 20px"
      };
    case "dots":
    case "dots-dense":
      return {
        backgroundImage: `radial-gradient(${lineColor} 1px, transparent 1px)`,
        backgroundSize: "16px 16px"
      };
    default:
      return {};
  }
};



export default function BioPublicPage() {
  const { slug } = useParams();
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  // Initialize theme values early (before any returns)
  const themeObj = useMemo(() => bio?.theme || {}, [bio]);
  const bgColor = useMemo(() => themeObj.bgColor || "#000000", [themeObj]);
  const accentColor = useMemo(() => themeObj.accentColor || "#ffffff", [themeObj]);
  const template = useMemo(() => themeObj.template || "default", [themeObj]);
  const effectiveBgColor = useMemo(() => 
    template === "brutalism" ? (themeObj.bgColor === "#000000" || !themeObj.bgColor ? "#facc15" : themeObj.bgColor) : bgColor,
    [template, themeObj, bgColor]
  );
  const isDark = useMemo(() => isColorDark(effectiveBgColor), [effectiveBgColor]);

  useEffect(() => {
    const loadBio = async () => {
      try {
        const response = await dataApi.getBioBySlug(slug);
        setBio(response.bio);
      } catch (error) {
        if (error?.message === "Bio not found") {
          setExpired(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadBio();
  }, [slug]);

  // SEO Meta Tags - Dynamic based on bio data
  useHeadMeta({
    title: bio ? `${bio.displayName} | Hugo Studio` : 'Hugo Studio',
    description: bio?.bio || 'Khám phá profile độc bản trên Hugo Studio - Nền tảng quản lý bio, booking và portfolio chuyên nghiệp.',
    keywords: `${bio?.displayName || 'Hugo Studio'}, ${bio?.headline || 'Professional Bio'}, Bio page, Portfolio, Booking`,
    ogTitle: bio ? `${bio.displayName} - Hugo Studio` : 'Hugo Studio',
    ogDescription: bio?.bio || 'Tạo bio độc bản với Hugo Studio',
    ogImage: bio?.avatarUrl || 'https://hugo.studio/og-image.jpg',
    ogUrl: window.location.href,
    canonicalUrl: window.location.href
  });



  if (loading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-[#0b0910]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading...</p>
        </div>
      </main>
    );
  }

  if (!bio || expired || bio.status === 'locked') {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-[#0b0910] px-4">
        <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <span className="material-symbols-outlined text-4xl text-red-500">lock</span>
          <h1 className="font-display text-2xl font-extrabold text-white">
            {bio?.status === 'locked' ? 'Liên Kết Bị Tạm Khóa' : 'Bio Không Tồn Tại'}
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {bio?.status === 'locked' 
              ? 'Trang Bio này đã bị khóa tạm thời bởi quản trị viên hệ thống.' 
              : 'Liên kết này đã hết hạn sau 12 tháng sử dụng, bị gỡ bỏ hoặc chưa bao giờ được kích hoạt trên hệ thống.'}
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold transition-all"
          >
            Trở về trang chủ
          </a>
        </div>
      </main>
    );
  }

  if (template === "flat") {
    const flatBgColor = (themeObj.bgColor === "#000000" || !themeObj.bgColor) ? "#f1f5f9" : themeObj.bgColor;
    const flatCardStyle = {
      backgroundColor: isColorDark(flatBgColor) ? "#1e1e24" : "#ffffff",
      color: isColorDark(flatBgColor) ? "#ffffff" : "#111111",
      border: `2.5px solid ${isColorDark(flatBgColor) ? "#ffffff" : "#000000"}`,
      boxShadow: "none",
      borderRadius: "18px"
    };

    const flatBtnStyle = (color = accentColor) => ({
      backgroundColor: color,
      color: isColorDark(color) ? "#ffffff" : "#111111",
      border: "none",
      boxShadow: "none",
      borderRadius: "12px",
      fontWeight: "700",
      transition: "transform 0.1s ease"
    });

    return (
      <>
        <HugoStudioLogo />
        <main 
          className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory relative scroll-smooth scrollbar-hide"
          style={{ backgroundColor: flatBgColor }}
        >
          {/* Global Fixed Background (Avatar Image) */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            {bio.avatarUrl && (
              <img src={optimizeCloudinaryUrl(bio.avatarUrl, 800)} alt="Cover" className="w-full h-full object-cover opacity-90" />
            )}
          </div>

          {/* SLIDE 1: HERO COVER */}
          <section 
            style={{ 
              backgroundColor: flatBgColor,
              ...getFlatPatternStyle(themeObj.pattern, flatBgColor)
            }}
            className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 transition-colors duration-500"
          >
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            
            <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
              {/* Overlapping Background Banner Collage for avatar */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute w-32 h-32 bg-[#00f0ff] rounded-2xl rotate-6 transform border-2 border-black" />
                <div className="absolute w-32 h-32 bg-[#ff007f] rounded-2xl -rotate-6 transform border-2 border-black" />
                <div className="absolute w-32 h-32 bg-[#ffff00] rounded-2xl rotate-12 transform border-2 border-black" />
                
                {bio.avatarUrl ? (
                  <div className="relative w-28 h-28 overflow-hidden rounded-full border-3 border-black z-10 bg-white">
                    <img src={optimizeCloudinaryUrl(bio.avatarUrl, 300)} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="relative w-28 h-28 rounded-full border-3 border-black z-10 bg-zinc-200 flex items-center justify-center font-bold text-xl text-black">
                    HUGO
                  </div>
                )}
              </div>

              {/* Overlapping Banners for Name & Headline */}
              <div className="relative w-full py-4 flex flex-col items-center">
                <div className="relative bg-[#ffff00] text-black border-2.5 border-black px-6 py-3 rounded-xl rotate-[-2deg] z-10 shadow-none">
                  <h1 className="font-serif text-2xl sm:text-3xl uppercase tracking-wider leading-none font-black we-bare-bears">
                    {bio.displayName}
                  </h1>
                </div>

                {bio.headline && (
                  <div className="relative bg-[#00f0ff] text-black border-2 border-black px-4 py-1.5 rounded-lg rotate-[3deg] -mt-2.5 z-20 shadow-none font-bold uppercase text-[10px] tracking-wider font-mono">
                    {bio.headline}
                  </div>
                )}
              </div>

              {/* Slide Indicator arrow */}
              <div className="pt-2 animate-bounce opacity-60 text-slate-850 dark:text-white">
                <span className="material-symbols-outlined text-lg">keyboard_double_arrow_down</span>
              </div>
            </div>
          </section>


          {/* SLIDE 2B: ACADEMIC & CAREER */}
          {(bio.education || bio.skills || bio.jobTitle || bio.contactEmail) && (
            <section 
              style={{ 
                backgroundColor: "#00f0ff",
                ...getFlatPatternStyle(themeObj.pattern, "#00f0ff")
              }}
              className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 transition-colors duration-500"
            >
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
              
              <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center space-y-6">
                <div className="px-4 py-1.5 bg-[#ffff00] text-black text-xs font-black uppercase tracking-widest rounded-lg border-2 border-black rotate-[-1deg]">
                  HỌC VẤN & SỰ NGHIỆP
                </div>
                
                {/* Overlapping card wrapper */}
                <div className="relative w-full">
                  {/* Background overlapping pink banner */}
                  <div className="absolute inset-0 bg-[#ff007f] rounded-3xl -rotate-1.5 translate-x-[-2px] translate-y-[2px] border-2.5 border-black pointer-events-none" />
                  
                  <div 
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#111111",
                      border: "2.5px solid #000000",
                      borderRadius: "18px"
                    }}
                    className="relative z-10 p-6 w-full text-xs space-y-3.5 text-left font-bold"
                  >
                    {bio.jobTitle && (
                      <div className="flex items-start justify-between border-b border-black/10 pb-2.5">
                        <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">Công việc</span>
                        <p className="font-bold text-right max-w-[65%] leading-tight break-words">{bio.jobTitle}</p>
                      </div>
                    )}
                    {bio.education && (
                      <div className="flex items-start justify-between border-b border-black/10 pb-2.5">
                        <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">Học vấn</span>
                        <p className="font-bold text-right max-w-[65%] leading-tight break-words">{bio.education}</p>
                      </div>
                    )}
                    {bio.skills && (
                      <div className="flex items-start justify-between border-b border-black/10 pb-2.5">
                        <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">Kỹ năng</span>
                        <p className="font-bold text-right max-w-[65%] leading-tight break-words">{bio.skills}</p>
                      </div>
                    )}
                    {bio.contactEmail && (
                      <div className="flex items-start justify-between">
                        <span className="uppercase tracking-widest text-[9px] font-bold opacity-60">Email LH</span>
                        <p className="font-bold break-all text-right max-w-[65%]">{bio.contactEmail}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SLIDE 3: LINKS & TABS */}
          <section 
            style={{ 
              backgroundColor: "#ffff00",
              ...getFlatPatternStyle(themeObj.pattern, "#ffff00")
            }}
            className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20 transition-colors duration-500"
          >
            <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            
            <div className="relative z-20 w-full max-w-md mx-auto space-y-6">
              <div className="text-center">
                <span className="px-4 py-1.5 bg-[#ff007f] text-white text-xs font-black uppercase tracking-widest rounded-lg border-2 border-black rotate-[1deg]">
                  LIÊN KẾT & THÔNG TIN
                </span>
              </div>

              {/* Buttons List */}
              {bio.links && bio.links.length > 0 && (
                <div className="space-y-4">
                  {bio.links.map((link, idx) => {
                    const color = FLAT_COLORS[idx % FLAT_COLORS.length];
                    const rotation = idx % 2 === 0 ? "rotate-1" : "-rotate-1";
                    
                    return (
                      <div key={idx} className="relative w-full">
                        {/* Background overlapping black/dark layer for flat effect */}
                        <div className="absolute inset-0 bg-black rounded-xl translate-x-1.5 translate-y-1.5 border border-black pointer-events-none" />
                        
                        <a
                          href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={flatBtnStyle(color)}
                          className={`relative z-10 block w-full py-4 px-6 text-center text-xs font-black uppercase tracking-widest border-2 border-black transform transition-transform hover:-translate-y-0.5 active:translate-y-0.5 ${rotation}`}
                        >
                          {link.label}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* SLIDE 4: HUGO STUDIO FOOTER */}
          <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 bg-[#09090b] text-white">
            <div style={{
              backgroundColor: "#1c1c1e",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px"
            }} className="p-8 max-w-sm w-full mx-auto space-y-6 text-center font-mono">
              <h3 className="text-2xl font-black tracking-tight uppercase">HUGO STUDIO</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Professional Booking & Management</p>
              
              <a 
                href="/" 
                style={flatBtnStyle("#ffffff")} 
                className="inline-block px-8 py-3.5 text-xs text-black border-2 border-black"
              >
                TẠO NGAY BIO
              </a>
              
              <div className="pt-4 border-t border-white/10 mt-4 text-[9px] opacity-60">
                Sản phẩm được phát triển bởi Hugo Portal
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  if (template === "brutalism") {
    const brutalCardStyle = {
      backgroundColor: isDark ? "#121212" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
      border: `3px solid ${isDark ? "#ffffff" : "#000000"}`,
      boxShadow: `5px 5px 0px 0px ${isDark ? "#ffffff" : "#000000"}`,
      borderRadius: "0px"
    };

    const brutalBtnStyle = (color = accentColor) => ({
      backgroundColor: color,
      color: isColorDark(color) ? "#ffffff" : "#000000",
      border: `3px solid ${isDark ? "#ffffff" : "#000000"}`,
      boxShadow: `4px 4px 0px 0px ${isDark ? "#ffffff" : "#000000"}`,
      borderRadius: "0px",
      fontWeight: "900",
      transition: "all 0.1s ease"
    });

    return (
      <>
        <HugoStudioLogo />
        <main 
          className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory relative text-white bg-black scroll-smooth scrollbar-hide"
          style={{ 
            backgroundColor: effectiveBgColor,
            ...getBrutalPatternStyle(themeObj.pattern, effectiveBgColor)
          }}
        >
          {/* Global Fixed Background (Avatar Image) */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            {bio.avatarUrl && (
              <img src={optimizeCloudinaryUrl(bio.avatarUrl, 800)} alt="Cover" className="w-full h-full object-cover opacity-85" />
            )}
            <div 
              className="absolute inset-0"
              style={getBrutalPatternStyle(themeObj.pattern, effectiveBgColor)}
            />
          </div>

          {/* SLIDE 1: HERO COVER */}
          <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />

            <div className="relative z-20 w-full max-w-sm mx-auto flex flex-col items-center text-center space-y-6">
              {bio.avatarUrl && (
                <div 
                  style={{
                    border: `3px solid ${isDark ? "#ffffff" : "#000000"}`,
                    boxShadow: `5px 5px 0px 0px ${isDark ? "#ffffff" : "#000000"}`
                  }}
                  className="w-32 h-32 overflow-hidden rotate-2 transform transition-transform duration-300 hover:rotate-0"
                >
                  <img src={optimizeCloudinaryUrl(bio.avatarUrl, 300)} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              )}

              <div style={brutalCardStyle} className="p-6 w-full -rotate-1 transform">
                <h1 className="font-mono text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none">
                  {bio.displayName}
                </h1>
                {bio.headline && (
                  <div className="mt-3 px-3 py-1 bg-black text-white dark:bg-white dark:text-black inline-block text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-black dark:border-white">
                    {bio.headline}
                  </div>
                )}
              </div>

              {/* Scroll Down Indicator */}
              <div className="pt-4 animate-bounce">
                <span className="material-symbols-outlined text-3xl text-white/70">keyboard_arrow_down</span>
              </div>
            </div>
          </section>

          {/* SLIDE 2: INFO (Thông tin) */}
          <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-md pointer-events-none" />
            
            <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
              <div className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-mono font-black uppercase border-3 border-black dark:border-white tracking-widest shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
                VỀ BẢN THÂN
              </div>
              
              {bio.bio && (
                <div style={brutalCardStyle} className="p-5 w-full text-left font-mono">
                  <p className="text-xs sm:text-sm leading-relaxed">
                    {bio.bio}
                  </p>
                </div>
              )}

              <div className="w-full space-y-4">
                {/* Info Banner */}
                {(bio.height || bio.weight || bio.measurements) && (
                  <div className="grid grid-cols-3 gap-3 w-full">
                    {bio.height && (
                      <div style={brutalCardStyle} className="p-3 flex flex-col items-center justify-center">
                        <span className="text-[7px] uppercase tracking-wider font-bold opacity-60">Chiều cao</span>
                        <p className="text-xs font-black mt-1">{bio.height}</p>
                      </div>
                    )}
                    {bio.weight && (
                      <div style={brutalCardStyle} className="p-3 flex flex-col items-center justify-center">
                        <span className="text-[7px] uppercase tracking-wider font-bold opacity-60">Cân nặng</span>
                        <p className="text-xs font-black mt-1">{bio.weight}</p>
                      </div>
                    )}
                    {bio.measurements && (
                      <div style={brutalCardStyle} className="p-3 flex flex-col items-center justify-center">
                        <span className="text-[7px] uppercase tracking-wider font-bold opacity-60">Số đo</span>
                        <p className="text-xs font-black mt-1 truncate w-full text-center">{bio.measurements}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Other details */}
                {(bio.birthday || bio.address || bio.hobbies || bio.phone) && (
                  <div style={brutalCardStyle} className="p-4 text-[10px] sm:text-xs space-y-3.5 text-left font-mono">
                    {bio.phone && (
                      <div className="flex items-center justify-between border-b border-black/20 dark:border-white/20 pb-2">
                        <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Booking</span>
                        <p className="font-bold opacity-90">{bio.phone}</p>
                      </div>
                    )}
                    {bio.birthday && (
                      <div className="flex items-center justify-between border-b border-black/20 dark:border-white/20 pb-2">
                        <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Ngày sinh</span>
                        <p className="font-bold opacity-90">{bio.birthday}</p>
                      </div>
                    )}
                    {bio.address && (
                      <div className="flex items-center justify-between border-b border-black/20 dark:border-white/20 pb-2">
                        <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Khu vực</span>
                        <p className="font-bold opacity-90">{bio.address}</p>
                      </div>
                    )}
                    {bio.hobbies && (
                      <div className="flex items-start justify-between">
                        <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70 mt-0.5">Sở thích</span>
                        <p className="font-bold opacity-90 text-right max-w-[65%] leading-relaxed">{bio.hobbies}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SLIDE 2B: ACADEMIC & CAREER */}
          {(bio.education || bio.skills || bio.jobTitle || bio.contactEmail) && (
            <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/35 backdrop-blur-md pointer-events-none" />
              
              <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
                <div className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-mono font-black uppercase border-3 border-black dark:border-white tracking-widest shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
                  HỌC VẤN & SỰ NGHIỆP
                </div>
                
                <div style={brutalCardStyle} className="p-4 w-full text-[10px] sm:text-xs space-y-3 text-left font-mono">
                  {bio.jobTitle && (
                    <div className="flex items-start justify-between border-b border-black/20 dark:border-white/20 pb-2.5">
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Công việc</span>
                      <p className="font-semibold opacity-90 text-right max-w-[65%]">{bio.jobTitle}</p>
                    </div>
                  )}
                  {bio.education && (
                    <div className="flex items-start justify-between border-b border-black/20 dark:border-white/20 pb-2.5">
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Học vấn</span>
                      <p className="font-semibold opacity-90 text-right max-w-[65%]">{bio.education}</p>
                    </div>
                  )}
                  {bio.skills && (
                    <div className="flex items-start justify-between border-b border-black/20 dark:border-white/20 pb-2.5">
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Kỹ năng</span>
                      <p className="font-semibold opacity-90 text-right max-w-[65%]">{bio.skills}</p>
                    </div>
                  )}
                  {bio.contactEmail && (
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px] font-bold opacity-70">Email LH</span>
                      <p className="font-semibold opacity-90 break-all text-right max-w-[65%]">{bio.contactEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SLIDE 3: LINKS & TABS */}
          <section className="min-h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-none" />
            
            <div className="relative z-20 w-full max-w-md mx-auto space-y-8">
              <div className="text-center">
                <span className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-mono font-black uppercase border-3 border-black dark:border-white tracking-widest shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff]">
                  LIÊN KẾT & THÔNG TIN
                </span>
              </div>

              {/* Buttons List */}
              {bio.links && bio.links.length > 0 && (
                <div className="space-y-3.5">
                  {bio.links.map((link, idx) => {
                    const color = BRUTAL_COLORS[idx % BRUTAL_COLORS.length];
                    return (
                      <a
                        key={idx}
                        href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={brutalBtnStyle(color)}
                        className="block w-full py-4 px-6 text-center text-xs font-black uppercase tracking-widest hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              )}

            </div>
          </section>

          {/* SLIDE 4: HUGO STUDIO FOOTER */}
          <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 bg-[#09090b] text-white">
            <div style={brutalCardStyle} className="p-8 max-w-sm w-full mx-auto space-y-6 text-center font-mono">
              <h3 className="text-2xl font-black tracking-tight uppercase">HUGO STUDIO</h3>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Professional Booking & Management</p>
              
              <a 
                href="/" 
                style={brutalBtnStyle("#ffffff")} 
                className="inline-block px-8 py-3.5 text-xs hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                TẠO NGAY BIO
              </a>
              
              <div className="pt-4 border-t border-black/20 dark:border-white/20 mt-4 text-[9px] opacity-60">
                Sản phẩm được phát triển bởi Hugo Portal
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <HugoStudioLogo />


      <main 
        className="h-[100dvh] w-full overflow-y-scroll snap-y snap-mandatory relative text-white bg-black scroll-smooth scrollbar-hide"
        style={{ 
          backgroundColor: bgColor,
          ...getPatternStyle(themeObj.pattern, bgColor)
        }}
      >
      {/* Global Fixed Background (Avatar Image) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {bio.avatarUrl && (
          <img src={optimizeCloudinaryUrl(bio.avatarUrl, 800)} alt="Cover" className="w-full h-full object-cover" />
        )}
        <div 
          className="absolute inset-0"
          style={getPatternStyle(themeObj.pattern, bgColor)}
        />
      </div>

      {/* SLIDE 1: HERO COVER */}
      <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-end pb-12 px-6">
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent pointer-events-none" />

        <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-4 px-4">
          
          <div className="space-y-1 w-full drop-shadow-lg">
            <h1 className="font-serif text-3xl sm:text-4xl uppercase tracking-[0.15em] leading-tight we-bare-bears">
              <RenderColoredText text={bio.displayName} />
            </h1>
            {bio.headline && (
              <h2 className="text-[11px] sm:text-xs tracking-[0.3em] font-light text-white/80 uppercase mt-3 we-bare-bears">
                {bio.headline}
              </h2>
            )}
          </div>

          {/* Scroll Down Indicator */}
          <div className="pt-8 animate-bounce">
            <span className="material-symbols-outlined text-3xl text-white/70">keyboard_arrow_down</span>
          </div>
        </div>
      </section>

      {/* SLIDE 2: INFO (Thông tin) */}
      <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-lg pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
          <div className="w-12 h-1 bg-white/20 rounded-full mb-1" />
          
          <div className="space-y-1.5 text-center drop-shadow-md">
            <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-white/50">
              <span className="material-symbols-outlined text-[11px] sm:text-xs text-white/40">fingerprint</span>
              IDENTITY PROFILE
            </div>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] font-serif we-bare-bears hugo-studio-gradient">
              Về Bản Thân
            </h3>
          </div>
          
          {bio.bio && (
            <div className="relative w-full p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-left space-y-2">
              <span className="absolute -top-3 -left-1 font-serif text-4xl text-white/20 select-none">“</span>
              <p className="text-xs sm:text-sm leading-relaxed text-white/90 font-serif tracking-wide italic pl-4 pr-2">
                {bio.bio}
              </p>
              <span className="absolute -bottom-7 -right-1 font-serif text-4xl text-white/20 select-none">”</span>
            </div>
          )}

          <div className="w-full space-y-4">
            {/* Info Banner */}
            {(bio.height || bio.weight || bio.measurements) && (
              <div className="grid grid-cols-3 gap-2.5 w-full">
                {bio.height && (
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                    <span className="material-symbols-outlined text-white/70 mb-1 text-base">height</span>
                    <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 mb-0.5">Chiều cao</span>
                    <p className="text-[10px] sm:text-xs font-serif font-bold tracking-widest text-white/95">{bio.height}</p>
                  </div>
                )}
                {bio.weight && (
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                    <span className="material-symbols-outlined text-white/70 mb-1 text-base">monitor_weight</span>
                    <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 mb-0.5">Cân nặng</span>
                    <p className="text-[10px] sm:text-xs font-serif font-bold tracking-widest text-white/95">{bio.weight}</p>
                  </div>
                )}
                {bio.measurements && (
                  <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                    <span className="material-symbols-outlined text-white/70 mb-1 text-base">straighten</span>
                    <span className="text-[7px] uppercase tracking-[0.15em] text-white/40 mb-0.5">Số đo</span>
                    <p className="text-[10px] sm:text-xs font-serif font-bold tracking-widest text-white/95">{bio.measurements}</p>
                  </div>
                )}
              </div>
            )}

            {/* Other details */}
            {(bio.birthday || bio.address || bio.hobbies || bio.phone) && (
              <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-[10px] sm:text-xs space-y-3 text-left">
                {bio.phone && (
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <span className="material-symbols-outlined text-sm">call</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Booking</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90">{bio.phone}</p>
                  </div>
                )}
                {bio.birthday && (
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <span className="material-symbols-outlined text-sm">cake</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Ngày sinh</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90">{bio.birthday}</p>
                  </div>
                )}
                {bio.address && (
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <span className="material-symbols-outlined text-sm">distance</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Khu vực</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90">{bio.address}</p>
                  </div>
                )}
                {bio.hobbies && (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5 text-white/40 mt-0.5">
                      <span className="material-symbols-outlined text-sm">favorite</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Sở thích</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 text-right max-w-[65%] leading-relaxed">{bio.hobbies}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SLIDE 2B: ACADEMIC & CAREER (Học vấn & Sự nghiệp) - Rendered only if fields are present */}
      {(bio.education || bio.skills || bio.jobTitle || bio.contactEmail) && (
        <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-lg pointer-events-none" />
          
          <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
            <div className="w-12 h-1 bg-white/20 rounded-full mb-1" />
            
            <div className="space-y-1.5 text-center drop-shadow-md">
              <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase font-bold text-white/50">
                <span className="material-symbols-outlined text-[11px] sm:text-xs text-white/40">school</span>
                PORTFOLIO PROFILE
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-[0.1em] font-serif we-bare-bears hugo-studio-gradient">
                Học vấn & Sự nghiệp
              </h3>
            </div>
            
            <div className="w-full space-y-4">
              <div className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-[10px] sm:text-xs space-y-3.5 text-left">
                {bio.jobTitle && (
                  <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-1.5 text-white/40 mt-0.5">
                      <span className="material-symbols-outlined text-sm">work</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Công việc</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 text-right max-w-[65%]">{bio.jobTitle}</p>
                  </div>
                )}
                {bio.education && (
                  <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-1.5 text-white/40 mt-0.5">
                      <span className="material-symbols-outlined text-sm">history_edu</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Học vấn</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 text-right max-w-[65%]">{bio.education}</p>
                  </div>
                )}
                {bio.skills && (
                  <div className="flex items-start justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-1.5 text-white/40 mt-0.5">
                      <span className="material-symbols-outlined text-sm">psychology</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Kỹ năng</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 text-right max-w-[65%]">{bio.skills}</p>
                  </div>
                )}
                {bio.contactEmail && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <span className="material-symbols-outlined text-sm">alternate_email</span>
                      <span className="uppercase tracking-widest text-[8px] sm:text-[9px]">Email LH</span>
                    </div>
                    <p className="font-semibold tracking-wide text-white/90 break-all text-right max-w-[65%]">{bio.contactEmail}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SLIDE 3: LINKS & TABS (Liên kết mở rộng) */}
      <section className="min-h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-md mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-[10px] tracking-[0.4em] uppercase text-white/50 font-bold">Các Liên Kết</h3>
          </div>

          {/* Buttons List */}
          {bio.links && bio.links.length > 0 && (
            <div className="space-y-3">
              {bio.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-4 px-6 text-center text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02] bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  style={{ borderRadius: "12px" }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SLIDE 4: HUGO STUDIO FOOTER */}
      <section className="h-[100dvh] w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 bg-[#09090b] text-white">
        {/* Soft radial ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)] pointer-events-none" />
        
        <div className="relative z-20 w-full max-w-md mx-auto text-center space-y-8 p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl shadow-2xl">
          
          <div className="space-y-3">
            <div className="flex justify-center">
              <HugoStudioColoredBrandLogo className="text-2xl sm:text-3xl font-black tracking-tight" />
            </div>
            <p className="text-[9px] sm:text-[10px] tracking-[0.3em] font-medium text-white/40 uppercase">Professional Booking & Management</p>
          </div>

          <a
            href="/"
            className="inline-block px-10 py-4 rounded-2xl bg-white text-black hover:bg-zinc-100 text-xs font-bold uppercase tracking-widest transition-all duration-300 transform hover:scale-[1.03] shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] we-bare-bears"
          >
            Tạo ngay bio
          </a>
          
          <div className="pt-8 space-y-3 border-t border-white/5">
            <p className="text-[8px] sm:text-[9px] text-white/30 uppercase tracking-[0.25em]">Sản phẩm được phát triển bởi</p>
            <div className="flex justify-center items-center gap-1.5 font-display text-xs font-black tracking-[0.25em] uppercase text-white/80">
              <span>Hugo</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Portal</span>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  );
}
