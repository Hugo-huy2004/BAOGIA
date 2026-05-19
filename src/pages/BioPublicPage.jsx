import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import dataApi from "../services/dataApi";

// Detect Social Brand Details
const getSocialBrandStyle = (label = "") => {
  const lowercase = label.toLowerCase();
  if (lowercase.includes("facebook") || lowercase.includes("fb")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "facebook" }; // Light gray circle like screenshot
  }
  if (lowercase.includes("zalo")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "chat" };
  }
  if (lowercase.includes("instagram") || lowercase.includes("ig")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "photo_camera" };
  }
  if (lowercase.includes("tiktok")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "music_note" };
  }
  if (lowercase.includes("youtube") || lowercase.includes("yt")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "play_circle" };
  }
  // Generic link
  return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "language" };
};

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
  `}</style>
);

// Gradient colors for brand identity
const BRAND_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"];

// Function to render text with each character in a different color
const RenderColoredText = ({ text }) => {
  if (!text) return null;
  return (
    <>
      {text.split("").map((char, idx) => (
        <span key={idx} style={{ color: BRAND_COLORS[idx % BRAND_COLORS.length] }}>
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


export default function BioPublicPage() {
  const { slug } = useParams();
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [globalData, setGlobalData] = useState(null);
  useEffect(() => {
    const loadBio = async () => {
      try {
        const response = await dataApi.getBioBySlug(slug);
        const b = response.bio;
        setBio(b);
        if (b?.tabs && b.tabs.length > 0) {
          setActiveTab(0);
        }
        const gData = await dataApi.getData().catch(() => null);
        setGlobalData(gData);


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

  const themeObj = bio.theme || {};
  const bgColor = themeObj.bgColor || "#000000";
  const accentColor = themeObj.accentColor || "#ffffff";

  // Filter links for Social Icons vs Normal Links
  // For Slide 1: Show first 4 social links as circular icons
  // For Slide 3: Show all links as big buttons
  const socialLinks = bio.links ? bio.links.slice(0, 4) : [];

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
          <img src={bio.avatarUrl} alt="Cover" className="w-full h-full object-cover" />
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

          {/* Tabs */}
          {bio.tabs && bio.tabs.length > 0 && (
            <div className="mt-8 space-y-4">
              <div className="relative bg-white/5 p-1.5 rounded-2xl flex gap-1.5 border border-white/10 backdrop-blur-md">
                {bio.tabs.map((tab, idx) => {
                  const isActive = activeTab === idx;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`flex-1 py-3 px-4 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all duration-300 ${
                        isActive 
                          ? "bg-white text-black shadow-lg scale-[1.02]" 
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      {tab.title}
                    </button>
                  );
                })}
              </div>
              {activeTab !== null && bio.tabs[activeTab] && (
                <div className="relative p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl text-xs text-white/90 leading-relaxed text-center shadow-2xl animate-fadeIn">
                  <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <p className="relative z-10 font-medium tracking-wide">
                    {bio.tabs[activeTab].content}
                  </p>
                </div>
              )}
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
