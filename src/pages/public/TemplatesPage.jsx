import React, { useState, lazy, Suspense, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useTranslation } from "react-i18next";
import HugoLogo from "../../components/HugoLogo";

const PhotographyDemo = lazy(() => import("../../components/demos/PhotographyDemo"));
const CoffeeDemo = lazy(() => import("../../components/demos/CoffeeDemo"));
const JewelryDemo = lazy(() => import("../../components/demos/JewelryDemo"));
const PortfolioDemo = lazy(() => import("../../components/demos/PortfolioDemo"));
const ECommerceDemo = lazy(() => import("../../components/demos/ECommerceDemo"));
const DashboardDemo = lazy(() => import("../../components/demos/DashboardDemo"));

const coreValues = [
  { id: 1, title: "Tận Tâm", desc: "Tỉ mỉ đến từng chi tiết nhỏ nhất", icon: "verified" },
  { id: 2, title: "Thấu Hiểu", desc: "Lắng nghe và giải quyết đúng nhu cầu", icon: "psychology" },
  { id: 3, title: "Sáng Tạo", desc: "Luôn đổi mới và khác biệt", icon: "lightbulb" },
  { id: 4, title: "Kết Nối", desc: "Xây dựng mạng lưới bền chặt", icon: "hub" },
  { id: 5, title: "Tốc Độ", desc: "Tối ưu hóa hiệu năng tối đa", icon: "speed" },
  { id: 6, title: "Bảo Vệ", desc: "An toàn dữ liệu tuyệt đối", icon: "security" }
];

const templates = [
  { id: "photography", title: "Studio Chụp Ảnh", short: "Chụp Ảnh", subtitle: "Nhiếp ảnh gia", url: "hugo.dev/photography", icon: "photo_camera" },
  { id: "cafe", title: "Quán Cafe & Bistro", short: "Cafe", subtitle: "Nhà hàng", url: "hugo.dev/cafe", icon: "local_cafe" },
  { id: "jewelry", title: "Web Bán Vàng", short: "Bán Vàng", subtitle: "Tiệm vàng", url: "hugo.dev/jewelry", icon: "diamond" },
  { id: "portfolio", title: "Giới Thiệu Cá Nhân", short: "Portfolio", subtitle: "Hồ sơ năng lực", url: "hugo.dev/portfolio", icon: "person" },
  { id: "ecommerce", title: "Trang Bán Hàng", short: "E-Commerce", subtitle: "Đa ngành", url: "hugo.dev/store", icon: "shopping_bag" },
  { id: "dashboard", title: "Trang Quản Lý", short: "Dashboard", subtitle: "Dashboard", url: "hugo.dev/admin", icon: "dashboard" }
];

export default function TemplatesPage() {
  const { t } = useTranslation();
  useHeadMeta({
    title: "Tác Phẩm & Mẫu Giao Diện | Hugo Studio",
    description: "Khám phá các sản phẩm và mẫu giao diện sáng tạo từ Hugo Studio.",
  });

  const [activeTemplateId, setActiveTemplateId] = useState("photography");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  // Sync scroll position with activeIndex
  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, clientHeight } = containerRef.current;
      const index = Math.round(scrollTop / clientHeight);
      if (index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  };

  const scrollToSlide = (index) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: index * window.innerHeight,
        behavior: "smooth"
      });
      setActiveIndex(index);
    }
  };

  const renderActivePreview = () => {
    let Demo = null;
    switch (activeTemplateId) {
      case "photography": Demo = PhotographyDemo; break;
      case "cafe": Demo = CoffeeDemo; break;
      case "jewelry": Demo = JewelryDemo; break;
      case "portfolio": Demo = PortfolioDemo; break;
      case "ecommerce": Demo = ECommerceDemo; break;
      case "dashboard": Demo = DashboardDemo; break;
      default: return null;
    }
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Đang tải giao diện...</div>}>
        <Demo isMobile={true} />
      </Suspense>
    );
  };

  return (
    <div className="h-screen w-full bg-surface dark:bg-background text-foreground selection:bg-primary/20 overflow-hidden relative">
      
      {/* Background Ambient Light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/5 dark:bg-accent/10 blur-[150px] rounded-full" />
      </div>

      {/* Slide Indicators - Fixed on Right */}
      <div className="fixed right-6 md:right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
        {[0, 1, 2, 3].map((idx) => (
          <button
            key={idx}
            onClick={() => scrollToSlide(idx)}
            className="group flex items-center justify-end gap-3 text-right focus:outline-none"
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] font-bold tracking-widest text-primary uppercase hidden md:block">
              {idx === 0 && "Bắt Đầu"}
              {idx === 1 && "Giao Diện"}
              {idx === 2 && "Triết Lý"}
              {idx === 3 && "Lưu Trữ"}
            </span>
            <div
              className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full border-2 transition-all duration-300 ${
                activeIndex === idx
                  ? "bg-primary border-primary scale-125 shadow-lg shadow-primary/30"
                  : "border-muted-foreground/50 bg-transparent hover:border-primary"
              }`}
            />
          </button>
        ))}
      </div>

      {/* SCROLL SNAP CONTAINER */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar relative z-10"
      >
        
        {/* SLIDE 0: HERO SECTION */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 md:px-8 pt-16">
          <div className="text-center space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 mb-6">
                Hugo Studio Portfolio
              </span>
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-black text-foreground tracking-tight leading-tight">
                Tác Phẩm & <br className="md:hidden" />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Mẫu Giao Diện
                </span>
              </h1>
              <p className="mt-6 text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Khám phá không gian sáng tạo của chúng tôi với các dự án thực tế và mẫu giao diện chuẩn mực, được thiết kế tối ưu cho trải nghiệm người dùng và hiệu năng mượt mà.
              </p>
            </motion.div>
          </div>
        </section>

        {/* SLIDE 1: SHOWCASE BENTO GRID */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 md:px-8 pt-16">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start max-w-7xl mx-auto w-full">
            
            {/* Left: Interactive Tabs List */}
            <div className="w-full lg:w-1/3 space-y-4">
              <div className="mb-4 lg:mb-6 text-center lg:text-left">
                <h2 className="text-2xl md:text-3xl font-display font-black">Khám Phá Giao Diện</h2>
                <p className="text-sm text-muted-foreground mt-2">Chọn một danh mục để xem chi tiết trải nghiệm ngay trên trình duyệt.</p>
              </div>
              <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide snap-x">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setActiveTemplateId(tpl.id)}
                    className={`snap-center flex-shrink-0 w-[160px] lg:w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                      activeTemplateId === tpl.id 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                        : "bg-card/50 border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="material-symbols-outlined shrink-0 text-2xl">{tpl.icon}</span>
                    <div className="text-left hidden lg:block">
                      <p className="font-bold text-sm font-display leading-tight">{tpl.title}</p>
                      <p className={`text-[10px] mt-0.5 opacity-80 ${activeTemplateId === tpl.id ? 'text-white/80' : 'text-muted-foreground'}`}>{tpl.subtitle}</p>
                    </div>
                    <p className="lg:hidden text-xs font-bold w-full text-center">{tpl.short}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Mockup Display */}
            <div className="w-full lg:w-2/3 flex justify-center lg:justify-end">
              <div className="w-full max-w-[300px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[450px] h-[55vh] md:h-[650px] bg-muted border border-border rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-4 shadow-2xl relative flex flex-col">
                
                {/* Browser/Phone Header */}
                <div className="w-full bg-card rounded-t-[1.5rem] p-2 md:p-3 flex items-center gap-2 border-b border-border z-20 shrink-0">
                  <div className="flex gap-1.5 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full py-1.5 px-4 text-center text-[9px] md:text-[10px] font-mono text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                    {templates.find(t => t.id === activeTemplateId)?.url}
                  </div>
                </div>

                {/* Screen Content */}
                <div className="w-full flex-1 bg-card rounded-b-[1.5rem] overflow-hidden relative isolate">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTemplateId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full overflow-y-auto custom-scrollbar"
                      style={{ zoom: "0.8" }} // Scale down for mobile mockup view
                    >
                      {renderActivePreview()}
                    </motion.div>
                  </AnimatePresence>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* SLIDE 2: CORE VALUES GRID */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 md:px-8 pt-16">
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-display font-black text-foreground">Triết Lý Thiết Kế</h2>
              <p className="mt-2 md:mt-4 text-sm md:text-base text-muted-foreground">Sáu giá trị cốt lõi đằng sau mọi sản phẩm của Hugo Studio.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
              {coreValues.map((val) => (
                <div key={val.id} className="p-4 md:p-8 rounded-2xl md:rounded-[2rem] bg-card border border-border flex flex-col items-center text-center gap-3 md:gap-4 hover:border-primary/50 transition-colors shadow-sm">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl md:text-3xl">{val.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm md:text-lg text-foreground">{val.title}</h3>
                    <p className="text-[10px] md:text-sm text-muted-foreground mt-1 md:mt-2 leading-relaxed">{val.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SLIDE 3: ARCHIVE PROJECT */}
        <section className="w-full h-full snap-start shrink-0 flex items-center justify-center relative overflow-hidden px-4 md:px-8 pt-16">
          <div className="max-w-5xl mx-auto w-full">
            <div className="text-center mb-8 md:mb-12">
              <h2 className="text-2xl md:text-4xl font-display font-black text-foreground">Dự Án Lưu Trữ</h2>
              <p className="mt-2 md:mt-4 text-sm md:text-base text-muted-foreground">MinHoi Media Digital - Một trong những dự án tâm huyết đã đi vào hoạt động.</p>
            </div>
            
            <div className="w-full rounded-2xl md:rounded-[2rem] border border-border bg-card shadow-2xl overflow-hidden flex flex-col h-[50vh] md:h-[60vh]">
              {/* Mac OS Style Header */}
              <div className="px-4 py-2 md:py-3 bg-muted border-b border-border flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-1.5 md:gap-2 w-16 md:w-20">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex-grow flex justify-center">
                  <div className="px-4 md:px-8 py-1.5 bg-card border border-border rounded-full text-[9px] md:text-xs font-mono text-muted-foreground flex items-center gap-2">
                    <span className="material-symbols-outlined text-[10px] md:text-[14px]">lock</span>
                    <span className="truncate max-w-[150px] md:max-w-[200px]">https://minhoimedia.digital</span>
                  </div>
                </div>
                <div className="w-16 md:w-20" />
              </div>

              {/* Iframe container */}
              <div className="flex-1 bg-background relative">
                <iframe src="https://minhoimedia.digital" className="w-full h-full border-none" title="MinHoi Media Digital" />
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
