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
    title: "Mẫu Website | Hugo Studio",
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
  const [previewMode, setPreviewMode] = useState("desktop"); // desktop or mobile
  const [clientPreviewMode, setClientPreviewMode] = useState("desktop"); // desktop or mobile
  const [isReloading, setIsReloading] = useState(false);

  const [templateDimensions, setTemplateDimensions] = useState({ width: 800, height: 480 });
  const [clientDimensions, setClientDimensions] = useState({ width: 800, height: 480 });
  const templateContainerRef = useRef(null);
  const clientContainerRef = useRef(null);

  useEffect(() => {
    if (!templateContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setTemplateDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 480
        });
      }
    });
    observer.observe(templateContainerRef.current);
    return () => observer.disconnect();
  }, [previewMode]);

  useEffect(() => {
    if (!clientContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setClientDimensions({
          width: entry.contentRect.width || 800,
          height: entry.contentRect.height || 480
        });
      }
    });
    observer.observe(clientContainerRef.current);
    return () => observer.disconnect();
  }, [clientPreviewMode]);

  const templates = [
    {
      id: "photography",
      title: "Studio Chụp Ảnh",
      subtitle: "Dành cho Studio nghệ thuật, nhiếp ảnh gia",
      desc: "Trưng bày bộ sưu tập tác phẩm, đặt lịch chụp ảnh online, tích hợp bộ lọc ảnh nghệ thuật trực tiếp trên trình duyệt.",
      badge: "Creative",
      url: "hugo.dev/photography-studio",
      image: "/image/avt1.png",
      icon: "photo_camera"
    },
    {
      id: "cafe",
      title: "Quán Cafe & Bistro",
      subtitle: "Dành cho quán cà phê, tiệm bánh, nhà hàng",
      desc: "Thực đơn điện tử thông minh, khách hàng tự gọi món tại bàn, cập nhật giỏ hàng & tính tổng tiền tự động.",
      badge: "F&B / Order",
      url: "hugo.dev/coffee-shop",
      image: "/image/avt2.png",
      icon: "local_cafe"
    },
    {
      id: "jewelry",
      title: "Web Bán Vàng / Bạc",
      subtitle: "Dành cho tiệm vàng bạc, đá quý cao cấp",
      desc: "Trưng bày trang sức sang trọng, công cụ tính giá vàng thời gian thực theo trọng lượng (chỉ/lượng) và khắc tên cá nhân hóa.",
      badge: "Luxury Store",
      url: "hugo.dev/jewelry-store",
      image: "/image/avt3.png",
      icon: "diamond"
    },
    {
      id: "portfolio",
      title: "Trang Giới Thiệu Cá Nhân",
      subtitle: "Hồ sơ năng lực, Bio Link thương hiệu",
      desc: "Kết nối tất cả mạng xã hội, chia sẻ bài viết, liên hệ nhanh, chế độ sáng/tối tùy chỉnh và hiệu ứng lướt mượt mà.",
      badge: "Personal Bio",
      url: "hugo.dev/personal-portfolio",
      image: "/image/avt4.png",
      icon: "person"
    },
    {
      id: "ecommerce",
      title: "Trang Bán Hàng Trực Tuyến",
      subtitle: "Website bán hàng đa ngành chuyên nghiệp",
      desc: "Thêm vào giỏ hàng, tùy chọn màu sắc/kích thước sản phẩm, hiển thị drawer giỏ hàng & thanh toán quét mã QR tự động.",
      badge: "E-Commerce",
      url: "hugo.dev/online-store",
      image: "/image/avt5.png",
      icon: "shopping_bag"
    },
    {
      id: "dashboard",
      title: "Trang Quản Lý Cửa Hàng",
      subtitle: "Hệ thống Dashboard Admin doanh nghiệp",
      desc: "Báo cáo doanh thu & khách hàng bằng biểu đồ, bộ lọc trạng thái đơn hàng, mô phỏng giao dịch mới thời gian thực.",
      badge: "Management",
      url: "hugo.dev/store-manager",
      image: "/image/avt6.png",
      icon: "dashboard"
    }
  ];

  const activeTemplate = templates.find((t) => t.id === activeTemplateId) || templates[0];

  const renderActivePreview = () => {
    switch (activeTemplateId) {
      case "photography":
        return <PhotographyDemo isMobile={tplIsMobile} />;
      case "cafe":
        return <CoffeeDemo isMobile={tplIsMobile} />;
      case "jewelry":
        return <JewelryDemo isMobile={tplIsMobile} />;
      case "portfolio":
        return <PortfolioDemo isMobile={tplIsMobile} />;
      case "ecommerce":
        return <ECommerceDemo isMobile={tplIsMobile} />;
      case "dashboard":
        return <DashboardDemo isMobile={tplIsMobile} />;
      default:
        return null;
    }
  };

  const tplIsMobile = previewMode === "mobile";
  let tplScale = 1;
  let tplVirtualWidth = 1280;
  let tplVirtualHeight = 800;

  if (tplIsMobile) {
    tplVirtualWidth = 417;
    tplVirtualHeight = 876;
    const scaleX = templateDimensions.width / tplVirtualWidth;
    const scaleY = templateDimensions.height / tplVirtualHeight;
    tplScale = Math.min(scaleX, scaleY, 1);
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
  let clientScale = 1;
  let clientVirtualWidth = 1280;
  let clientVirtualHeight = 800;

  if (clientIsMobile) {
    clientVirtualWidth = 417;
    clientVirtualHeight = 876;
    const scaleX = clientDimensions.width / clientVirtualWidth;
    const scaleY = clientDimensions.height / clientVirtualHeight;
    clientScale = Math.min(scaleX, scaleY, 1);
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
      case "photography":
        return "text-white";
      case "cafe":
        return "text-[#4E342E]";
      case "jewelry":
        return "text-[#2C3E29]";
      case "ecommerce":
        return "text-slate-850";
      case "portfolio":
        return "text-white";
      case "dashboard":
        return "text-white";
      default:
        return "text-slate-850";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-16 py-8 md:py-12 px-4 md:px-6 mb-16 text-slate-800 dark:text-slate-100">
      
      {/* Header section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
          Live Preview Playground
        </span>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Kho Mẫu Website Thực Tế
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Nhấp chọn các loại website mẫu dưới đây để tương tác trực tiếp với các tính năng thực tế được mô phỏng ngay trong khung trình duyệt.
        </p>
      </section>

      {/* Showcase Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-8">
        {/* Left Menu Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
          {templates.map((tpl) => {
            const isActive = activeTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                onClick={() => {
                  setActiveTemplateId(tpl.id);
                  playPopSound();
                }}
                className={`group relative text-left p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4 ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 border-indigo-500 shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 scale-[1.02]"
                    : "bg-white/50 dark:bg-[#12111a]/40 border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:bg-white dark:hover:bg-zinc-900/60 hover:scale-[1.01]"
                }`}
              >
                {/* Left accent line for active */}
                {isActive && (
                  <span className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-500 rounded-r-full" />
                )}
                
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-500"
                }`}>
                  <span className="material-symbols-outlined text-lg">{tpl.icon}</span>
                </div>

                {/* Title & Description */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className={`text-xs font-bold font-display ${isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                      {tpl.title}
                    </h4>
                    <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-slate-500"
                    }`}>
                      {tpl.badge}
                    </span>
                  </div>
                  <p className={`text-[10px] mt-0.5 truncate ${isActive ? "text-slate-500 dark:text-slate-400" : "text-slate-400 dark:text-slate-500"}`}>
                    {tpl.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Mock Browser Window */}
        <div className="lg:col-span-8 flex flex-col">
          <div className={`rounded-3xl bg-[#f4f4f7] dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 relative group/browser ${
            previewMode === "mobile" ? "h-[750px]" : "h-[600px]"
          }`}>
            {/* Browser Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#eaeaea]/80 dark:bg-zinc-900 border-b border-slate-200 dark:border-white/5 select-none shrink-0">
              {/* Windows dots */}
              <div className="flex items-center gap-1.5 w-20">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer" onClick={() => { setActiveTemplateId(templates[0].id); playPopSound(); }} title="Reset to photography"></span>
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
              </div>

              {/* Address Bar */}
              <div className="flex-grow max-w-md mx-4 relative">
                <div className="w-full bg-white dark:bg-zinc-800/80 rounded-lg py-1 px-3 pl-8 pr-12 text-[10px] font-mono text-center text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5 truncate shadow-sm flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[9px] text-slate-400">lock</span>
                  <span>https://{activeTemplate.url}</span>
                </div>
                
                {/* Mock Refresh Button */}
                <button 
                  onClick={() => {
                    setIsReloading(true);
                    setTimeout(() => setIsReloading(false), 800);
                    playPopSound();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex items-center justify-center p-0.5 rounded hover:bg-slate-100 dark:hover:bg-zinc-700/50"
                >
                  <span className={`material-symbols-outlined text-[11px] ${isReloading ? "animate-spin" : ""}`}>
                    refresh
                  </span>
                </button>
              </div>

              {/* Device view toggle switcher */}
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-300/50 dark:border-white/5">
                <button
                  onClick={() => {
                    setPreviewMode("desktop");
                    playPopSound();
                  }}
                  className={`p-1 rounded flex items-center justify-center ${
                    previewMode === "desktop" ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Desktop Preview"
                >
                  <span className="material-symbols-outlined text-[13px]">desktop_windows</span>
                </button>
                <button
                  onClick={() => {
                    setPreviewMode("mobile");
                    playPopSound();
                  }}
                  className={`p-1 rounded flex items-center justify-center ${
                    previewMode === "mobile" ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Mobile Preview"
                >
                  <span className="material-symbols-outlined text-[13px]">smartphone</span>
                </button>
              </div>
            </div>

            {/* Description panel above viewport */}
            <div className="bg-slate-100 dark:bg-zinc-900/50 px-4 py-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between border-b border-slate-200/50 dark:border-white/5 select-none">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{activeTemplate.title}</span>
              <span className="italic">{activeTemplate.desc}</span>
            </div>

            {/* Viewport Area */}
            <div 
              ref={templateContainerRef} 
              className="flex-grow bg-slate-200 dark:bg-zinc-950/40 overflow-hidden relative select-none"
            >
              {isReloading ? (
                <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 z-30 flex flex-col items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  <span className="text-[10px] font-mono text-slate-400">Loading components...</span>
                </div>
              ) : null}

              {/* Inner scaled container */}
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
                  /* iPhone 15 Pro Wrapper */
                  <div className="w-[417px] h-[876px] rounded-[3rem] shadow-2xl relative bg-black select-none overflow-hidden"
                       style={{ isolation: "isolate" }}>
                    
                    {/* Viewport Content - Inset by border width to stay inside bezel */}
                    <div className="absolute inset-[12px] rounded-[2.2rem] overflow-hidden flex flex-col z-10 bg-white dark:bg-zinc-950"
                         style={{ clipPath: "inset(0px round 2.2rem)", isolation: "isolate" }}>
                      {renderActivePreview()}
                    </div>

                    {/* Bezel Border Overlay - Placed above content to hide protruding square corners */}
                    <div className="absolute inset-0 border-[12px] border-zinc-900 dark:border-zinc-800 rounded-[3rem] pointer-events-none z-30"></div>

                    {/* Status Bar Overlay - Offset by 12px (top-3, left-3, right-3) */}
                    <div className={`absolute top-3 left-3 right-3 h-10 px-6 flex justify-between items-center z-40 pointer-events-none select-none text-[10px] font-bold ${getMobileStatusColor()}`}>
                      <span className="font-sans">9:41</span>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[11px] font-bold">signal_cellular_alt</span>
                        <span className="material-symbols-outlined text-[11px] font-bold">wifi</span>
                        <span className="material-symbols-outlined text-[13px] font-bold">battery_5_bar</span>
                      </div>
                    </div>

                    {/* Dynamic Island Notch */}
                    <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-26 h-6.5 bg-black rounded-full z-50 flex items-center justify-between px-3.5 pointer-events-none shadow-inner">
                      <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full border border-zinc-800"></div>
                      <div className="w-2.5 h-0.5 bg-zinc-900 rounded-full border border-zinc-800"></div>
                    </div>
                    
                    {/* Home bar at bottom */}
                    <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 w-32 h-1 bg-black/45 dark:bg-white/45 rounded-full z-50 pointer-events-none"></div>
                  </div>
                ) : (
                  /* Desktop Browser Canvas */
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex flex-col">
                    <div className="w-full h-full overflow-hidden relative flex flex-col">
                      {renderActivePreview()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Client Project Section */}
      <hr className="border-slate-200/50 dark:border-white/5 my-16" />

      <section className="space-y-8 pb-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Dự Án Khách Hàng Thực Tế
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Dự Án Độc Bản Đã Bàn Giao
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Các sản phẩm website thực tế được thiết kế độc bản và vận hành chính thức cho khách hàng của Hugo Studio.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-8">
          {/* Project Details */}
          <div className="lg:col-span-4 space-y-6 text-left">
            <div className="space-y-3">
              <h3 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
                Mình Ơi Media
              </h3>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">
                Dịch vụ Truyền thông & Báo chí số
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Website chính thức của Mình Ơi Media - thương hiệu truyền thông số hiện đại. Giao diện được thiết kế độc bản, tối ưu luồng đọc tin tức, tích hợp hiệu ứng tương tác mượt mà và tối ưu hóa SEO tối đa.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Công nghệ & Đặc tính</h4>
              <div className="flex flex-wrap gap-2">
                {["Độc bản 100%", "HTML5", "CSS3", "JavaScript", "SEO Chuẩn", "Bảo mật SSL"].map((tag, idx) => (
                  <span key={idx} className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-350 border border-slate-200/50 dark:border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-[#f4f4f7]/80 dark:bg-zinc-900/60 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-lg">info</span>
                <span className="text-[11px] font-bold">Chế độ Xem Thử Bảo Mật</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Hệ thống tải live website của đối tác trong khung ảo. Tương tác nhấn link chuyển trang đã được khóa để bảo vệ bản quyền thiết kế độc bản.
              </p>
            </div>
          </div>

          {/* Virtual Browser Window for Minh Khoi Media */}
          <div className="lg:col-span-8 flex flex-col">
            <div className={`rounded-3xl bg-[#f4f4f7] dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 relative ${
            clientPreviewMode === "mobile" ? "h-[750px]" : "h-[600px]"
          }`}>
            {/* Browser Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#eaeaea]/80 dark:bg-zinc-900 border-b border-slate-200 dark:border-white/5 select-none shrink-0">
              <div className="flex items-center gap-1.5 w-20">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]"></span>
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]"></span>
                <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]"></span>
              </div>

              <div className="flex-grow max-w-md mx-4">
                <div className="w-full bg-white dark:bg-zinc-800/80 rounded-lg py-1 px-3 pl-8 text-[10px] font-mono text-center text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5 truncate shadow-sm flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-[9px] text-slate-400">lock</span>
                  <span>https://minhoimedia.digital</span>
                </div>
              </div>

              {/* Device view toggle switcher */}
              <div className="flex items-center gap-1 bg-slate-200 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-300/50 dark:border-white/5">
                <button
                  onClick={() => {
                    setClientPreviewMode("desktop");
                    playPopSound();
                  }}
                  className={`p-1 rounded flex items-center justify-center ${
                    clientPreviewMode === "desktop" ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="Desktop Preview"
                >
                  <span className="material-symbols-outlined text-[13px]">desktop_windows</span>
                </button>
                <button
                  onClick={() => {
                    setClientPreviewMode("mobile");
                    playPopSound();
                  }}
                  className={`p-1 rounded flex items-center justify-center ${
                    clientPreviewMode === "mobile" ? "bg-white dark:bg-zinc-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                  title="iPhone 15 Mobile Preview"
                >
                  <span className="material-symbols-outlined text-[13px]">smartphone</span>
                </button>
              </div>
            </div>

            {/* Viewport Area */}
            <div 
              ref={clientContainerRef} 
              className="flex-grow bg-slate-200 dark:bg-zinc-950/40 overflow-hidden relative select-none"
            >
              {/* Inner scaled container */}
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
                  /* iPhone 15 Pro Wrapper */
                  <div className="w-[417px] h-[876px] rounded-[3rem] shadow-2xl relative bg-black select-none overflow-hidden"
                       style={{ isolation: "isolate" }}>
                    
                    {/* Viewport Content - Inset by border width to stay inside bezel */}
                    <div className="absolute inset-[12px] rounded-[2.2rem] overflow-hidden flex flex-col z-10 bg-white dark:bg-zinc-950"
                         style={{ clipPath: "inset(0px round 2.2rem)", isolation: "isolate" }}>
                      <iframe 
                        src="https://minhoimedia.digital" 
                        className="w-full h-full border-none animate-fadeIn" 
                        title="Mình Ơi Media Mobile Live Showcase"
                        sandbox="allow-scripts allow-same-origin allow-forms"
                      />
                    </div>

                    {/* Bezel Border Overlay - Placed above content to hide protruding square corners */}
                    <div className="absolute inset-0 border-[12px] border-zinc-900 dark:border-zinc-800 rounded-[3rem] pointer-events-none z-30"></div>

                    {/* Status Bar Overlay - Offset by 12px (top-3, left-3, right-3) */}
                    <div className="absolute top-3 left-3 right-3 h-10 px-6 flex justify-between items-center z-40 pointer-events-none select-none text-[10px] font-bold text-slate-800">
                      <span className="font-sans">9:41</span>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[11px] font-bold">signal_cellular_alt</span>
                        <span className="material-symbols-outlined text-[11px] font-bold">wifi</span>
                        <span className="material-symbols-outlined text-[13px] font-bold">battery_5_bar</span>
                      </div>
                    </div>

                    {/* Dynamic Island Notch */}
                    <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-26 h-6.5 bg-black rounded-full z-50 flex items-center justify-between px-3.5 pointer-events-none shadow-inner">
                      <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full border border-zinc-800"></div>
                      <div className="w-2.5 h-0.5 bg-zinc-900 rounded-full border border-zinc-800"></div>
                    </div>
                    
                    {/* Home bar at bottom */}
                    <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 w-32 h-1 bg-black/45 dark:bg-white/45 rounded-full z-50 pointer-events-none"></div>
                  </div>
                ) : (
                  /* Desktop Browser Canvas */
                  <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-zinc-950 flex flex-col">
                    <iframe 
                      src="https://minhoimedia.digital" 
                      className="w-full h-full border-none animate-fadeIn" 
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
