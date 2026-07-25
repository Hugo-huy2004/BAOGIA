import { useState, useEffect } from "react";
import { RoutePrefetcher } from "../../../utils/routePrefetcher";
import { triggerPWAInstallDirectly } from "../../../utils/pwaInstallTrigger";
import { useData } from "../../../context/DataContext";

// Kept in sync with the same map in MemberUtilitiesDashboard.jsx
const APP_STORAGE_MB = {
  hugoskin: 2.8,
  ide: 4.5,
  psychology: 3.2,
  arcade: 5.1,
  radio: 1.9,
  helpdesk: 1.4,
  handle: 1.2,
  aura: 1.8,
  deco: 3.8,
  team: 1.6,
  bio: 1.5,
  info: 0.8,
  joy_wallet: 1.1
};

const DESCRIPTIONS = {
  bio: "Kiến tạo hồ sơ cá nhân độc bản và liên kết mạng xã hội (Biolink) mang phong cách của riêng bạn. Hỗ trợ tùy chỉnh ảnh đại diện, tiểu sử ngắn và tích hợp mã QR thanh toán nhanh.",
  ide: "Trình soạn thảo mã nguồn trực tuyến cực mạnh dành cho lập trình viên Hugo. Hỗ trợ các bài tập thực hành lập trình từ cơ bản tới nâng cao, kiểm thử code tức thì và chuẩn bị cho các kỳ thi chứng chỉ.",
  team: "Nơi kết nối và tuyển dụng nhân tài, các dự án thực tế của cộng đồng sinh viên. Khám phá các cơ hội làm việc nhóm và đóng góp cho các dự án mã nguồn mở chất lượng.",
  psychology: "AI Trợ lý thấu cảm và tư vấn tâm lý 24/7. Trò chuyện giải tỏa áp lực học hành, thi cử, kết hợp các liệu pháp cải thiện chất lượng giấc ngủ và đo lường chỉ số tinh thần hoàn toàn bảo mật.",
  hugoskin: "Phân tích tình trạng da và tư vấn chu trình chăm sóc (Skincare) cá nhân hóa bằng AI. Quét sắc tố da qua camera, phát hiện khuyết điểm và gợi ý sản phẩm tối ưu.",
  radio: "Không gian thư giãn với Lofi music streaming trực tiếp từ các đài phát uy tín toàn cầu và cập nhật tin tức công nghệ mới nhất. Người bạn đồng hành không thể thiếu khi viết code.",
  helpdesk: "Trình tạo chữ ký email chuyên nghiệp và tích hợp thẻ liên kết thông minh NFC/QR. Định hình thương hiệu cá nhân của bạn trong các giao dịch số.",
  handle: "Bộ công cụ tiện ích đa năng hỗ trợ nén dung lượng hình ảnh chất lượng cao và rút gọn đường dẫn bảo mật chống mã độc, bảo vệ quyền riêng tư tuyệt đối.",
  arcade: "Thế giới mini-game giải trí tích lũy điểm thưởng JOY. Vừa thư giãn đầu óc vừa nhận về vô số ưu đãi đổi thưởng giá trị cao từ hệ sinh thái Hugo.",
  aura: "Tiện ích Pomodoro tập trung năng suất cao kết hợp âm thanh sóng nền alpha/theta và nhạc tiếng mưa, tiếng quán cafe xung quanh giúp tối đa hóa khả năng học tập.",
  deco: "Tự tay thiết kế và trang trí căn phòng ký túc xá ảo theo phong cách Claymorphism. Sắp đặt nội thất, thể hiện phong cách sống và chia sẻ tới bạn bè.",
  info: "Bảng điều khiển thông tin hệ thống, nhật ký thay đổi phiên bản (Changelog) và cấu hình kỹ thuật của siêu ứng dụng Hugo Studio.",
  joy_wallet: "Ví điện tử JOY cá nhân. Xem trực quan lịch sử thu chi, số dư tài khoản và thực hiện chuyển khoản nhanh bằng mã QR giữa các thành viên hệ thống."
};

const APP_VERSIONS = {
  bio: "3.2.0",
  ide: "2.8.1",
  team: "1.4.0",
  psychology: "4.1.0",
  hugoskin: "2.0.3",
  radio: "1.6.0",
  helpdesk: "2.3.0",
  handle: "1.9.0",
  arcade: "3.5.0",
  aura: "2.1.0",
  deco: "1.7.0",
  info: "1.0.0",
  joy_wallet: "2.4.0"
};

const CATEGORY_LABELS = { edu: "Học tập", wellness: "Sức khỏe", tools: "Công cụ", arcade: "Giải trí" };
const categoryLabel = (cat) => CATEGORY_LABELS[cat] || "Giải trí";

const FEATURED_SLIDES = [
  {
    id: "psychology",
    badge: "AI SPOTLIGHT",
    title: "HugoPSY AI Trợ Lý Tâm Lý",
    desc: "Lắng nghe bạn 24/7. Trò chuyện giải tỏa áp lực thi cử, liệu pháp thư giãn và theo dõi giấc ngủ cá nhân hóa.",
    icon: "psychology",
    gradient: "from-cyan-500/20 via-indigo-500/15 to-purple-600/10",
    buttonText: "Mở AI Tâm Lý"
  },
  {
    id: "ide",
    badge: "PRO DEV TOOL",
    title: "HugoCoder Lập Trình AI",
    desc: "Trình soạn thảo code đa ngôn ngữ trực quan, kiểm thử thuật toán và học lập trình thực chiến 100%.",
    icon: "code",
    gradient: "from-blue-500/20 via-indigo-500/15 to-violet-600/10",
    buttonText: "Bắt Đầu Code"
  },
  {
    id: "arcade",
    badge: "GAMING & JOY",
    title: "HugoArcade Đấu Trường Game",
    desc: "Thế giới mini-game 2048, cờ vua, bắn tàu vũ trụ giải trí tích điểm thưởng JOY và chinh phục bảng xếp hạng.",
    icon: "stadium",
    gradient: "from-amber-500/20 via-orange-500/15 to-rose-600/10",
    buttonText: "Vào Chơi Game"
  }
];

export default function LibraryCatalog({
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  categories,
  libraryAppsList,
  downloadingAppId,
  downloadProgress = {},
  installedApps,
  handleInstallApp,
  setSelectedUtility,
  gradients,
  onBack
}) {
  const { data } = useData();
  const [selectedApp, setSelectedApp] = useState(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [pendingInstallApp, setPendingInstallApp] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("apps"); // "apps" | "installed"

  const joyBalance = data?.member?.joyBalance || 1540;

  // Auto rotate featured banner every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % FEATURED_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Hide mobile bottom tab bar whenever a modal sheet (product detail or install choice) is open
  useEffect(() => {
    const isOpen = Boolean(selectedApp || pendingInstallApp);
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
    };
  }, [selectedApp, pendingInstallApp]);

  const currentSlide = FEATURED_SLIDES[activeSlideIndex] || FEATURED_SLIDES[0];

  const confirmInstall = (addToHome) => {
    if (!pendingInstallApp) return;
    handleInstallApp(pendingInstallApp.id, addToHome);
    setPendingInstallApp(null);
  };

  const handleOpenApp = (appId) => {
    if (appId === "library") {
      setActiveCategory("all");
      setSearchQuery("");
      return;
    }
    setSelectedUtility(appId);
  };

  const filteredApps = libraryAppsList.filter((app) => {
    if (activeTab === "installed") return installedApps.includes(app.id);
    return true;
  });

  return (
    <div className="space-y-4 animate-fadeIn text-left relative pb-20 select-none">
      {/* ── 1. HUGO ARCADE STYLE HEADER BAR (LIGHT & DARK SUPPORT) ──────────────── */}
      <div className="sticky top-0 z-40 bg-background/85 dark:bg-background/90 backdrop-blur-xl py-2 px-1 flex items-center justify-between border-b border-border/15 transition-all duration-300">
        {/* Left: Hugo Arcade Circle Back Button */}
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button
              type="button"
              onClick={() => {
                if (onBack) onBack();
                if (setSelectedUtility) setSelectedUtility(null);
              }}
              className="w-9 h-9 rounded-full bg-card hover:bg-muted border border-border/50 text-foreground flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title="Quay lại"
            >
              <span className="material-symbols-outlined text-lg font-black">arrow_back</span>
            </button>
          )}

          {/* Hugo Library Brand Badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-primary/25">
              <span className="material-symbols-outlined text-lg font-black">store</span>
            </div>
            <span className="text-base font-black tracking-tight text-foreground font-sans">
              Hugo<span className="text-primary">Library</span>
            </span>
          </div>
        </div>

        {/* Right: JOY Coin Balance & App Counter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs px-3 py-1 rounded-full shadow-xs">
            <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>toll</span>
            <span>{(joyBalance ?? 0).toLocaleString("vi-VN")}</span>
            <span className="text-[10px] text-amber-500/80 ml-0.5">JOY</span>
          </div>
        </div>
      </div>

      {/* ── 2. CATEGORY SELECTOR PILLS BAR ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto px-1 py-1 scrollbar-hide">
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all active:scale-95 ${
                active
                  ? "bg-primary text-white shadow-md shadow-primary/25 border-transparent"
                  : "bg-card/80 text-muted-foreground border border-border/40 hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. FEATURED HERO SPOTLIGHT BANNER (ARCADE LIQUID GLASS STYLE) ────────── */}
      {activeTab === "apps" && (
        <div className={`relative overflow-hidden bg-gradient-to-r ${currentSlide.gradient} border border-border/40 rounded-[28px] p-5 sm:p-6 text-left shadow-sm transition-all duration-700 backdrop-blur-2xl`}>
          {/* Ambient Glow Orbits */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-primary/20 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-purple-600/20 rounded-full blur-[70px] pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between gap-6">
            <div className="max-w-md space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-primary/20 text-primary border border-primary/30 uppercase shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {currentSlide.badge}
              </div>
              
              <div className="space-y-1">
                <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight leading-snug">
                  {currentSlide.title}
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {currentSlide.desc}
                </p>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => handleOpenApp(currentSlide.id)}
                  className="px-5 py-2 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-full shadow-md shadow-primary/25 hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  <span>{currentSlide.buttonText}</span>
                </button>
              </div>
            </div>

            {/* 3D Showcase Card (Right Side) */}
            <div 
              onClick={() => handleOpenApp(currentSlide.id)}
              className="hidden sm:flex flex-col items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/30 to-indigo-600/20 p-3 text-center border border-border/40 shadow-sm cursor-pointer shrink-0 hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined text-primary text-4xl mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>{currentSlide.icon}</span>
              <span className="text-[9px] font-black text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                Studio App
              </span>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="absolute bottom-3 right-4 flex items-center gap-1 z-20">
            {FEATURED_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlideIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeSlideIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 4. SEARCH BAR ────────────────────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3.5 text-muted-foreground/60 text-base pointer-events-none">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm tiện ích, ứng dụng..."
          className="w-full h-10 pl-10 pr-9 rounded-2xl border border-border/40 bg-card/70 backdrop-blur-md focus:bg-background text-xs font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 w-5 h-5 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        )}
      </div>

      {/* ── 5. COLLECTION SECTION HEADER ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 pt-2">
        <div>
          <p className="uppercase tracking-widest text-[9.5px] font-black text-primary">COLLECTION</p>
          <h2 className="text-base font-black text-foreground tracking-tight">Thư Viện Ứng Dụng Nổi Bật</h2>
        </div>
        <span className="text-xs font-mono text-muted-foreground/80 font-bold bg-muted px-2.5 py-1 rounded-full border border-border/40">
          {filteredApps.length} Apps
        </span>
      </div>

      {/* ── 6. CATALOG APP CARDS GRID (HUGO ARCADE GAMECARD STYLE) ────────────────── */}
      {filteredApps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 bg-card border border-border/40 rounded-2xl p-6 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <span className="material-symbols-outlined text-2xl">search_off</span>
          </div>
          <div>
            <p className="text-xs font-black text-foreground uppercase tracking-wider">Không tìm thấy ứng dụng</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Vui lòng nhập từ khóa khác hoặc chuyển danh mục.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredApps.map((app) => {
            const gradient = gradients[app.tint] || gradients.indigo;
            const isInstalled = installedApps.includes(app.id);
            const isDownloading = downloadingAppId === app.id;
            const progress = downloadProgress[app.id] || 0;
            const appSize = (APP_STORAGE_MB[app.id] || 2.0).toFixed(1);

            return (
              <div
                key={app.id}
                onMouseEnter={() => RoutePrefetcher.prefetchApp(app.id)}
                onTouchStart={() => RoutePrefetcher.prefetchApp(app.id)}
                onClick={() => { setSelectedApp(app); setDescExpanded(false); }}
                className="cursor-pointer flex flex-col justify-between p-4 bg-card/80 dark:bg-card/60 border border-border/40 hover:border-primary/40 rounded-[24px] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 space-y-3"
              >
                {/* Top Info Header */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl shrink-0 bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md relative overflow-hidden border border-white/20`}>
                    <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-60 pointer-events-none" />
                    <span className="material-symbols-outlined text-white text-[26px] sm:text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>{app.icon}</span>
                  </div>

                  <div className="min-w-0 flex-1 text-left space-y-0.5">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-primary block">
                      {categoryLabel(app.category)}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-black text-foreground leading-snug truncate">
                        {app.title}
                      </h3>
                      {app.badge && (
                        <span className="px-1.5 py-0.2 text-[8px] font-black tracking-wider bg-primary/10 border border-primary/20 text-primary uppercase rounded-md leading-none select-none">
                          {app.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate leading-normal">
                      {app.subLabel}
                    </p>
                  </div>
                </div>

                {/* Footer Bar with Size & Action Button */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30 gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/80">
                    <span className="font-mono bg-muted px-2 py-0.5 rounded-md border border-border/40">{appSize} MB</span>
                    <span>•</span>
                    <span>v{APP_VERSIONS[app.id] || "1.0.0"}</span>
                  </div>

                  {/* Hugo Arcade Style Solid Action Button */}
                  <div>
                    {isDownloading ? (
                      <div 
                        className="w-[72px] h-[30px] relative overflow-hidden bg-muted border border-border/30 rounded-full flex items-center justify-center select-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-primary/30 transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                        <span className="text-[10px] font-black text-primary relative z-10">{progress}%</span>
                      </div>
                    ) : isInstalled ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleOpenApp(app.id); }}
                        className="w-[72px] h-[30px] flex items-center justify-center rounded-full bg-primary text-white font-black text-[11px] uppercase tracking-wider shadow-sm shadow-primary/20 hover:opacity-90 active:scale-95 transition-all duration-200"
                      >
                        Mở
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPendingInstallApp(app); }}
                        className="w-[72px] h-[30px] flex items-center justify-center rounded-full bg-muted hover:bg-primary text-foreground hover:text-white font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all duration-200 border border-border/40 shadow-xs"
                      >
                        Tải
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 7. BOTTOM NAVIGATION BAR (HUGO ARCADE NAVBAR STYLE) ────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 dark:bg-card/95 border-t border-border/40 backdrop-blur-xl py-2 px-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button 
            onClick={() => setActiveTab("apps")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
              activeTab === "apps" ? "text-primary font-black scale-105" : "text-muted-foreground hover:text-foreground font-bold"
            }`}
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === "apps" ? "'FILL' 1" : "" }}>apps</span>
            <span className="text-[10px] uppercase tracking-wider">Ứng dụng</span>
          </button>

          <button 
            onClick={() => setActiveTab("installed")}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
              activeTab === "installed" ? "text-primary font-black scale-105" : "text-muted-foreground hover:text-foreground font-bold"
            }`}
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeTab === "installed" ? "'FILL' 1" : "" }}>download_done</span>
            <span className="text-[10px] uppercase tracking-wider">Đã cài ({installedApps.length})</span>
          </button>
        </div>
      </div>

      {/* ── 8. MODAL SHEET: INSTALL LOCATION CHOICE ────────────────────────────── */}
      {pendingInstallApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[600] p-4 text-center animate-fadeIn">
          <div className="bg-card border border-border/60 rounded-[32px] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slideUp text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white mx-auto shadow-md">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{pendingInstallApp.icon}</span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-foreground">
                Tải "{pendingInstallApp.title}" vào đâu?
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cả 2 lựa chọn đều cài đặt ứng dụng giống nhau, chỉ khác việc có icon riêng ở bàn làm việc hay không.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => confirmInstall(true)}
                className="w-full py-3 px-4 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add_to_home_screen</span>
                <span>Màn hình chính &amp; Thư viện</span>
              </button>

              <button
                onClick={() => confirmInstall(false)}
                className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-black text-xs uppercase tracking-wider rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2 border border-border/40"
              >
                <span className="material-symbols-outlined text-sm">inventory_2</span>
                <span>Chỉ Thư viện</span>
              </button>

              <button
                onClick={() => setPendingInstallApp(null)}
                className="w-full py-2 text-center text-xs font-bold text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. PRODUCT DETAIL SHEET (APPLE APP STORE 2.0 STYLE) ──────────────────── */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 transition-opacity">
          <div className="absolute inset-0" onClick={() => setSelectedApp(null)} />

          <div className="relative w-full sm:max-w-lg bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl z-[510] max-h-[90vh] overflow-y-auto animate-slideUp text-left space-y-6">
            <div className="w-12 h-1 bg-muted rounded-full mx-auto sm:hidden" />

            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradients[selectedApp.tint] || gradients.indigo} flex items-center justify-center text-white shadow-md shrink-0 relative overflow-hidden`}>
                <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{selectedApp.icon}</span>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-foreground truncate">{selectedApp.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{selectedApp.subLabel}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                    {categoryLabel(selectedApp.category)}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground font-bold">v{APP_VERSIONS[selectedApp.id] || "1.0.0"}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Mô tả ứng dụng</h4>
              <p className={`text-xs text-foreground leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}>
                {DESCRIPTIONS[selectedApp.id] || selectedApp.subLabel}
              </p>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-xs font-black text-primary hover:underline focus:outline-none"
              >
                {descExpanded ? "Thu gọn" : "Xem thêm"}
              </button>
            </div>

            {/* Technical Metadata Grid */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-center">
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-[10px] font-bold text-muted-foreground block uppercase">Dung lượng</span>
                <span className="text-xs font-black text-foreground font-mono">{APP_STORAGE_MB[selectedApp.id] || 2.0} MB</span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-[10px] font-bold text-muted-foreground block uppercase">Độ tuổi</span>
                <span className="text-xs font-black text-foreground">4+ Sinh viên</span>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-[10px] font-bold text-muted-foreground block uppercase">Khả dụng</span>
                <span className="text-xs font-black text-foreground">PWA &amp; Web</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {installedApps.includes(selectedApp.id) ? (
                <button
                  onClick={() => { setSelectedApp(null); handleOpenApp(selectedApp.id); }}
                  className="w-full py-3.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  <span>Mở ứng dụng ngay</span>
                </button>
              ) : (
                <button
                  onClick={() => { setSelectedApp(null); setPendingInstallApp(selectedApp); }}
                  className="w-full py-3.5 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/25 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Cài đặt ứng dụng</span>
                </button>
              )}

              <button
                onClick={() => triggerPWAInstallDirectly(selectedApp.title)}
                className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-black text-xs uppercase tracking-wider rounded-2xl border border-border/40 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm text-primary">shortcut</span>
                <span>Tạo Shortcut Màn Hình Chính PWA</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
