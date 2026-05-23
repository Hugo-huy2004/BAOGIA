import React, { useState, useRef, useEffect } from "react";
import { useHeadMeta } from "../hooks/useHeadMeta";
import PhotographyDemo from "../components/demos/PhotographyDemo";
import CoffeeDemo from "../components/demos/CoffeeDemo";
import JewelryDemo from "../components/demos/JewelryDemo";
import PortfolioDemo from "../components/demos/PortfolioDemo";
import ECommerceDemo from "../components/demos/ECommerceDemo";
import DashboardDemo from "../components/demos/DashboardDemo";

export default function TemplatesPage() {
  useHeadMeta({
    title: "Tác Phẩm | Hugo Studio",
    description: "Khám phá kho mẫu giao diện website tương tác thực tế từ studio nhiếp ảnh, quán cafe, tiệm vàng bạc, cửa hàng trực tuyến đến dashboard quản trị.",
    keywords: "mẫu website, thiết kế web, giao diện tương tác, live demo, Hugo Studio",
    canonicalUrl: "https://www.hugowishpax.studio/templates"
  });

  const playPopSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio pop effect failed:", e);
    }
  };

  const [activeTemplateId, setActiveTemplateId] = useState("photography");
  const [isRealMobile, setIsRealMobile] = useState(false);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [clientPreviewMode, setClientPreviewMode] = useState("desktop");
  const [isReloading, setIsReloading] = useState(false);

  // Auto-detect real device viewport
  useEffect(() => {
    const checkMobile = () => {
      const isMob = window.innerWidth < 768;
      setIsRealMobile(isMob);
      if (isMob) {
        setPreviewMode("mobile");
        setClientPreviewMode("mobile");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [templateDimensions, setTemplateDimensions] = useState({ width: 800, height: 480 });
  const [clientDimensions, setClientDimensions] = useState({ width: 800, height: 480 });
  const templateContainerRef = useRef(null);
  const clientContainerRef = useRef(null);

  useEffect(() => {
    if (!templateContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let e of entries) {
        setTemplateDimensions({ width: e.contentRect.width || 800, height: e.contentRect.height || 480 });
      }
    });
    observer.observe(templateContainerRef.current);
    return () => observer.disconnect();
  }, [previewMode]);

  useEffect(() => {
    if (!clientContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let e of entries) {
        setClientDimensions({ width: e.contentRect.width || 800, height: e.contentRect.height || 480 });
      }
    });
    observer.observe(clientContainerRef.current);
    return () => observer.disconnect();
  }, [clientPreviewMode]);

  const templates = [
    {
      id: "photography",
      title: "Studio Chụp Ảnh",
      short: "Chụp Ảnh",
      subtitle: "Dành cho Studio nghệ thuật, nhiếp ảnh gia",
      desc: "Trưng bày bộ sưu tập tác phẩm, đặt lịch chụp ảnh online, tích hợp bộ lọc ảnh nghệ thuật trực tiếp trên trình duyệt.",
      badge: "Creative",
      url: "hugo.dev/photography-studio",
      icon: "photo_camera"
    },
    {
      id: "cafe",
      title: "Quán Cafe & Bistro",
      short: "Cafe",
      subtitle: "Dành cho quán cà phê, tiệm bánh, nhà hàng",
      desc: "Thực đơn điện tử thông minh, khách hàng tự gọi món tại bàn, cập nhật giỏ hàng & tính tổng tiền tự động.",
      badge: "F&B / Order",
      url: "hugo.dev/coffee-shop",
      icon: "local_cafe"
    },
    {
      id: "jewelry",
      title: "Web Bán Vàng",
      short: "Bán Vàng",
      subtitle: "Dành cho tiệm vàng bạc, đá quý cao cấp",
      desc: "Trưng bày trang sức sang trọng, công cụ tính giá vàng thời gian thực theo trọng lượng (chỉ/lượng) và khắc tên cá nhân hóa.",
      badge: "Luxury Store",
      url: "hugo.dev/jewelry-store",
      icon: "diamond"
    },
    {
      id: "portfolio",
      title: "Giới Thiệu Cá Nhân",
      short: "Portfolio",
      subtitle: "Hồ sơ năng lực, Bio Link thương hiệu",
      desc: "Kết nối tất cả mạng xã hội, chia sẻ bài viết, liên hệ nhanh, chế độ sáng/tối tùy chỉnh và hiệu ứng lướt mượt mà.",
      badge: "Personal Bio",
      url: "hugo.dev/personal-portfolio",
      icon: "person"
    },
    {
      id: "ecommerce",
      title: "Trang Bán Hàng",
      short: "E-Commerce",
      subtitle: "Website bán hàng đa ngành chuyên nghiệp",
      desc: "Thêm vào giỏ hàng, tùy chọn màu sắc/kích thước sản phẩm, hiển thị drawer giỏ hàng & thanh toán quét mã QR tự động.",
      badge: "E-Commerce",
      url: "hugo.dev/online-store",
      icon: "shopping_bag"
    },
    {
      id: "dashboard",
      title: "Trang Quản Lý",
      short: "Dashboard",
      subtitle: "Hệ thống Dashboard Admin doanh nghiệp",
      desc: "Báo cáo doanh thu & khách hàng bằng biểu đồ, bộ lọc trạng thái đơn hàng, mô phỏng giao dịch mới thời gian thực.",
      badge: "Management",
      url: "hugo.dev/store-manager",
      icon: "dashboard"
    }
  ];

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  const tplIsMobile = previewMode === "mobile";
  let tplScale = 1, tplVirtualWidth = 1280, tplVirtualHeight = 800;
  if (tplIsMobile) {
    tplVirtualWidth = 417; tplVirtualHeight = 876;
    tplScale = Math.min(templateDimensions.width / tplVirtualWidth, templateDimensions.height / tplVirtualHeight, 1);
  } else {
    tplVirtualWidth = 1280;
    tplScale = templateDimensions.width / tplVirtualWidth;
    tplVirtualHeight = templateDimensions.height / tplScale;
  }
  const tplScaledWidth = tplVirtualWidth * tplScale;
  const tplScaledHeight = tplVirtualHeight * tplScale;
  const tplLeftOffset = (templateDimensions.width - tplScaledWidth) / 2;
  const tplTopOffset = (templateDimensions.height - tplScaledHeight) / 2;

  const clientIsMobile = clientPreviewMode === "mobile";
  let clientScale = 1, clientVirtualWidth = 1280, clientVirtualHeight = 800;
  if (clientIsMobile) {
    clientVirtualWidth = 417; clientVirtualHeight = 876;
    clientScale = Math.min(clientDimensions.width / clientVirtualWidth, clientDimensions.height / clientVirtualHeight, 1);
  } else {
    clientVirtualWidth = 1280;
    clientScale = clientDimensions.width / clientVirtualWidth;
    clientVirtualHeight = clientDimensions.height / clientScale;
  }
  const clientScaledWidth = clientVirtualWidth * clientScale;
  const clientScaledHeight = clientVirtualHeight * clientScale;
  const clientLeftOffset = (clientDimensions.width - clientScaledWidth) / 2;
  const clientTopOffset = (clientDimensions.height - clientScaledHeight) / 2;

  const getMobileStatusColor = () => {
    switch (activeTemplateId) {
      case "photography": return "text-white";
      case "cafe": return "text-[#4E342E]";
      case "jewelry": return "text-[#2C3E29]";
      case "portfolio": return "text-white";
      case "dashboard": return "text-white";
      default: return "text-slate-800";
    }
  };

  const renderActivePreview = () => {
    switch (activeTemplateId) {
      case "photography": return <PhotographyDemo isMobile={tplIsMobile} />;
      case "cafe": return <CoffeeDemo isMobile={tplIsMobile} />;
      case "jewelry": return <JewelryDemo isMobile={tplIsMobile} />;
      case "portfolio": return <PortfolioDemo isMobile={tplIsMobile} />;
      case "ecommerce": return <ECommerceDemo isMobile={tplIsMobile} />;
      case "dashboard": return <DashboardDemo isMobile={tplIsMobile} />;
      default: return null;
    }
  };

  // Reusable iPhone frame renderer
  const PhoneFrame = ({ children, statusColor = "text-slate-800" }) => (
    <div
      className="w-[417px] h-[876px] rounded-[3rem] shadow-2xl relative bg-black select-none overflow-hidden"
      style={{ isolation: "isolate" }}
    >
      {/* Screen content */}
      <div
        className="absolute inset-[12px] rounded-[2.2rem] overflow-hidden flex flex-col z-10 bg-white dark:bg-zinc-950"
        style={{ clipPath: "inset(0px round 2.2rem)", isolation: "isolate" }}
      >
        {children}
      </div>
      {/* Bezel overlay */}
      <div className="absolute inset-0 border-[12px] border-zinc-900 dark:border-zinc-800 rounded-[3rem] pointer-events-none z-30" />
      {/* Status bar */}
      <div className={`absolute top-3 left-3 right-3 h-10 px-6 flex justify-between items-center z-40 pointer-events-none select-none text-[10px] font-bold ${statusColor}`}>
        <span className="font-sans">9:41</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[11px] font-bold">signal_cellular_alt</span>
          <span className="material-symbols-outlined text-[11px] font-bold">wifi</span>
          <span className="material-symbols-outlined text-[13px] font-bold">battery_5_bar</span>
        </div>
      </div>
      {/* Dynamic Island */}
      <div className="absolute top-[22px] left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="w-[104px] h-[30px] bg-black rounded-full" />
      </div>
      {/* Home bar */}
      <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 w-32 h-1 bg-black/45 dark:bg-white/45 rounded-full z-50 pointer-events-none" />
    </div>
  );

  // Shared browser chrome bar
  const BrowserChrome = ({ url, onReset, onReload, reloading, mode, onModeChange, showDeviceToggle }) => (
    <div className="flex items-center justify-between px-3 md:px-4 py-2.5 bg-[#eaeaea]/80 dark:bg-zinc-900 border-b border-slate-200 dark:border-white/5 select-none shrink-0 gap-2">
      {/* Traffic lights */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer hover:brightness-90 transition-all"
          onClick={onReset}
          title="Reset"
        />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]" />
      </div>

      {/* Address bar */}
      <div className="flex-grow relative min-w-0">
        <div className="w-full bg-white dark:bg-zinc-800/80 rounded-md py-1 px-6 text-[9px] md:text-[10px] font-mono text-center text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5 truncate flex items-center justify-center gap-1 shadow-sm">
          <span className="material-symbols-outlined text-[8px] md:text-[9px] text-green-500 shrink-0">lock</span>
          <span className="truncate">https://{url}</span>
        </div>
        {onReload && (
          <button
            onClick={onReload}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-0.5 rounded"
          >
            <span className={`material-symbols-outlined text-[10px] ${reloading ? "animate-spin" : ""}`}>refresh</span>
          </button>
        )}
      </div>

      {/* Device toggle */}
      {showDeviceToggle ? (
        !isRealMobile ? (
          <div className="flex items-center gap-0.5 bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-300/50 dark:border-white/5 shrink-0">
            <button
              onClick={() => onModeChange("desktop")}
              className={`p-1 rounded flex items-center justify-center transition-all ${mode === "desktop" ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              title="Desktop Preview"
            >
              <span className="material-symbols-outlined text-[12px] md:text-[13px]">desktop_windows</span>
            </button>
            <button
              onClick={() => onModeChange("mobile")}
              className={`p-1 rounded flex items-center justify-center transition-all ${mode === "mobile" ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              title="Mobile Preview"
            >
              <span className="material-symbols-outlined text-[12px] md:text-[13px]">smartphone</span>
            </button>
          </div>
        ) : (
          <span className="text-[8px] font-bold text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/50 rounded border border-indigo-200/50 dark:border-indigo-500/20 shrink-0 flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[9px]">smartphone</span>
            <span className="hidden sm:inline">Mobile</span>
          </span>
        )
      ) : null}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto text-slate-800 dark:text-slate-100 pb-16">

      {/* ── PAGE HEADER ── */}
      <section className="text-center space-y-3 max-w-3xl mx-auto pt-8 md:pt-12 pb-6 md:pb-8 px-4">
        <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
          Live Preview Playground
        </span>
        <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Kho Mẫu Website<br className="sm:hidden" /> Thực Tế
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Chọn loại website để tương tác trực tiếp với tính năng thực tế ngay trong khung demo.
        </p>
      </section>

      {/* ── MOBILE: Horizontal chip template picker ── */}
      <div className="lg:hidden relative mb-3">
        {/* Right fade hint */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#0d0d14] to-transparent z-10 pointer-events-none" />
        <div className="overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-2 w-max py-1">
            {templates.map((tpl) => {
              const isActive = activeTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => { setActiveTemplateId(tpl.id); playPopSound(); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border shadow-sm ${
                    isActive
                      ? "bg-indigo-500 text-white border-indigo-500 shadow-indigo-500/20"
                      : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{tpl.icon}</span>
                  <span>{tpl.short || tpl.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── MOBILE: Active template info card ── */}
      <div className="lg:hidden mx-4 mb-3">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-white/10 p-3 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500 text-white shrink-0">
            <span className="material-symbols-outlined text-base">{activeTemplate.icon}</span>
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{activeTemplate.title}</p>
              <span className="text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                {activeTemplate.badge}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{activeTemplate.subtitle}</p>
          </div>
        </div>
      </div>

      {/* ── MAIN SHOWCASE ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-stretch px-4 md:px-6">

        {/* Desktop sidebar — hidden on mobile */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-3 justify-center">
          {templates.map((tpl) => {
            const isActive = activeTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => { setActiveTemplateId(tpl.id); playPopSound(); }}
                className={`group relative text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 border-indigo-500 shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 scale-[1.02]"
                    : "bg-white/50 dark:bg-[#12111a]/40 border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-zinc-900/60 hover:scale-[1.01]"
                }`}
              >
                {isActive && <span className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-500 rounded-r-full" />}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-500"
                }`}>
                  <span className="material-symbols-outlined text-lg">{tpl.icon}</span>
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <h4 className={`text-xs font-bold font-display truncate ${isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                      {tpl.title}
                    </h4>
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-slate-500"
                    }`}>{tpl.badge}</span>
                  </div>
                  <p className={`text-[10px] mt-0.5 truncate ${isActive ? "text-slate-500 dark:text-slate-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {tpl.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Browser Window */}
        <div className="lg:col-span-8 flex flex-col">
          <div className={`rounded-2xl lg:rounded-3xl bg-[#f4f4f7] dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${
            isRealMobile ? "h-[500px]" : previewMode === "mobile" ? "h-[750px]" : "h-[600px]"
          }`}>
            <BrowserChrome
              url={activeTemplate.url}
              onReset={() => { setActiveTemplateId(templates[0].id); playPopSound(); }}
              onReload={() => { setIsReloading(true); setTimeout(() => setIsReloading(false), 800); playPopSound(); }}
              reloading={isReloading}
              mode={previewMode}
              onModeChange={(m) => { setPreviewMode(m); playPopSound(); }}
              showDeviceToggle={true}
            />

            {/* Template info strip */}
            <div className="bg-slate-50 dark:bg-zinc-900/50 px-3 py-1.5 text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-2 border-b border-slate-200/50 dark:border-white/5 select-none">
              <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">{activeTemplate.title}</span>
              <span className="text-slate-300 dark:text-white/20 shrink-0">·</span>
              <span className="italic truncate hidden sm:block">{activeTemplate.desc}</span>
            </div>

            {/* Viewport */}
            <div ref={templateContainerRef} className="flex-grow bg-slate-200 dark:bg-zinc-950/40 overflow-hidden relative select-none">
              {isReloading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 z-30 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                  <span className="text-[10px] font-mono text-slate-400">Loading preview…</span>
                </div>
              )}

              <div
                className="absolute origin-top-left transition-all duration-300"
                style={{
                  width: `${tplVirtualWidth}px`,
                  height: `${tplVirtualHeight}px`,
                  transform: `scale(${tplScale})`,
                  left: `${tplLeftOffset}px`,
                  top: `${tplTopOffset}px`
                }}
              >
                {tplIsMobile ? (
                  <PhoneFrame statusColor={getMobileStatusColor()}>
                    {renderActivePreview()}
                  </PhoneFrame>
                ) : (
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex flex-col">
                    {renderActivePreview()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED CLIENT PROJECT ── */}
      <hr className="border-slate-200/50 dark:border-white/5 mx-4 md:mx-6 mt-10 md:mt-16 mb-8 md:mb-12" />

      <section className="px-4 md:px-6 space-y-6 md:space-y-8">
        {/* Section header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Dự Án Khách Hàng Thực Tế
          </span>
          <h2 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dự Án Độc Bản Đã Bàn Giao
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Các sản phẩm website thực tế được thiết kế độc bản và vận hành chính thức cho khách hàng của Hugo Studio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">

          {/* Project info sidebar */}
          <div className="lg:col-span-4 space-y-3 md:space-y-4">
            {/* Main project card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-500/20">
                  <span className="material-symbols-outlined text-xl">language</span>
                </div>
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">Mình Ơi Media</h3>
                  <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">Truyền thông & Báo chí số</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Website chính thức của Mình Ơi Media — thương hiệu truyền thông số hiện đại. Thiết kế độc bản, tối ưu luồng đọc tin tức, tích hợp hiệu ứng tương tác mượt mà và SEO tối đa.
              </p>

              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Công nghệ & Đặc tính</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Độc bản 100%", "HTML5", "CSS3", "JavaScript", "SEO Chuẩn", "SSL"].map((tag, idx) => (
                    <span key={idx} className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex gap-2">
                <span className="material-symbols-outlined text-indigo-500 text-base shrink-0 mt-0.5">info</span>
                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Chế độ xem thử bảo mật — tương tác link đã được khóa để bảo vệ bản quyền thiết kế độc bản.
                </p>
              </div>
            </div>

            {/* Performance stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Lighthouse", value: "99", unit: "điểm", color: "text-amber-500" },
                { label: "Load Time", value: "<1s", unit: "", color: "text-emerald-500" },
                { label: "SEO Score", value: "100", unit: "%", color: "text-indigo-500" }
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-center shadow-sm">
                  <p className={`text-sm md:text-base font-black ${stat.color}`}>
                    {stat.value}<span className="text-[9px] text-slate-400 ml-0.5">{stat.unit}</span>
                  </p>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Virtual browser for Mình Ơi */}
          <div className="lg:col-span-8 flex flex-col">
            <div className={`rounded-2xl lg:rounded-3xl bg-[#f4f4f7] dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${
              isRealMobile ? "h-[460px]" : clientPreviewMode === "mobile" ? "h-[750px]" : "h-[600px]"
            }`}>
              <BrowserChrome
                url="minhoimedia.digital"
                showDeviceToggle={true}
                mode={clientPreviewMode}
                onModeChange={(m) => { setClientPreviewMode(m); playPopSound(); }}
              />

              {/* Mình Ơi info strip */}
              <div className="bg-slate-50 dark:bg-zinc-900/50 px-3 py-1.5 text-[9px] text-slate-500 dark:text-slate-400 flex items-center gap-2 border-b border-slate-200/50 dark:border-white/5 select-none">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">Mình Ơi Media</span>
                <span className="text-slate-300 dark:text-white/20 shrink-0">·</span>
                <span className="italic truncate hidden sm:block">Website truyền thông số độc bản — Dự án thực tế đã bàn giao chính thức.</span>
              </div>

              {/* Viewport */}
              <div ref={clientContainerRef} className="flex-grow bg-slate-200 dark:bg-zinc-950/40 overflow-hidden relative select-none">
                <div
                  className="absolute origin-top-left transition-all duration-300"
                  style={{
                    width: `${clientVirtualWidth}px`,
                    height: `${clientVirtualHeight}px`,
                    transform: `scale(${clientScale})`,
                    left: `${clientLeftOffset}px`,
                    top: `${clientTopOffset}px`
                  }}
                >
                  {clientIsMobile ? (
                    <div
                      className="w-[417px] h-[876px] rounded-[3rem] shadow-2xl relative bg-black select-none overflow-hidden"
                      style={{ isolation: "isolate" }}
                    >
                      <div
                        className="absolute inset-[12px] rounded-[2.2rem] overflow-hidden flex flex-col z-10 bg-white"
                        style={{ clipPath: "inset(0px round 2.2rem)", isolation: "isolate" }}
                      >
                        <iframe
                          src="https://minhoimedia.digital"
                          className="w-full h-full border-none"
                          title="Mình Ơi Media Mobile Live Showcase"
                          sandbox="allow-scripts allow-same-origin allow-forms"
                        />
                      </div>
                      <div className="absolute inset-0 border-[12px] border-zinc-900 dark:border-zinc-800 rounded-[3rem] pointer-events-none z-30" />
                      <div className="absolute top-3 left-3 right-3 h-10 px-6 flex justify-between items-center z-40 pointer-events-none select-none text-[10px] font-bold text-slate-800">
                        <span className="font-sans">9:41</span>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[11px] font-bold">signal_cellular_alt</span>
                          <span className="material-symbols-outlined text-[11px] font-bold">wifi</span>
                          <span className="material-symbols-outlined text-[13px] font-bold">battery_5_bar</span>
                        </div>
                      </div>
                      <div className="absolute top-[22px] left-1/2 -translate-x-1/2 pointer-events-none z-50">
                        <div className="w-[104px] h-[30px] bg-black rounded-full" />
                      </div>
                      <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 w-32 h-1 bg-black/45 rounded-full z-50 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex flex-col">
                      <iframe
                        src="https://minhoimedia.digital"
                        className="w-full h-full border-none"
                        title="Mình Ơi Media Desktop Live Showcase"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
