import React, { useState } from "react";

export default function DashboardDemo({ isMobile = false }) {
  const [lightTheme, setLightTheme] = useState(false);
  const [activePage, setActivePage] = useState("overview");
  const [revenue, setRevenue] = useState(148500000);
  const [orders, setOrders] = useState(382);
  const [filter, setFilter] = useState("all");
  const [soundNotify, setSoundNotify] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("7days");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Initial rich transaction history integrating all templates
  const [sales, setSales] = useState([
    { id: 1, name: "Nguyễn Văn Tuấn", product: "Thỏi Vàng 1 Chỉ SJC 9999", category: "jewelry", amount: 7650000, time: "5 phút trước", status: "completed" },
    { id: 2, name: "Lê Thu Duyên", product: "Hugo Sneaker Pro V2", category: "ecommerce", amount: 1850000, time: "15 phút trước", status: "completed" },
    { id: 3, name: "Phạm Thị Mai", product: "Gói Fine Art Portrait", category: "photography", amount: 2500000, time: "30 phút trước", status: "pending" },
    { id: 4, name: "Trần Quốc Hưng", product: "Combo Cafe & Croissant", category: "cafe", amount: 80000, time: "1 giờ trước", status: "completed" },
    { id: 5, name: "Hoàng Văn Nam", product: "Balo Da Carbon Waterproof", category: "ecommerce", amount: 950000, time: "2 giờ trước", status: "completed" }
  ]);

  // Main Sales Chart Data Points (Last 7 Days)
  const chartData = [
    { day: "T2", sales: 12 },
    { day: "T3", sales: 19 },
    { day: "T4", sales: 15 },
    { day: "T5", sales: 27 },
    { day: "T6", sales: 22 },
    { day: "T7", sales: 34 },
    { day: "CN", sales: 42 }
  ];

  // List of templates products for simulation
  const simulationPool = [
    { name: "Trần Minh Khôi", product: "Thỏi Vàng SJC 2 Chỉ 9999", category: "jewelry", amount: 15200000 },
    { name: "Phạm Khánh Huyền", product: "Đồng Hồ GPS Smart Sport", category: "ecommerce", amount: 3200000 },
    { name: "Đỗ Gia Bảo", product: "Tai Nghe Bluetooth Pro Sound", category: "ecommerce", amount: 1500000 },
    { name: "Nguyễn Hương Giang", product: "Gói Cinematic Couple Photo", category: "photography", amount: 3800000 },
    { name: "Lê Tuấn Kiệt", product: "Đơn E-Menu Bàn Số 5", category: "cafe", amount: 245000 }
  ];

  const handleSimulateSale = () => {
    const randomSale = simulationPool[Math.floor(Math.random() * simulationPool.length)];
    const saleAmount = randomSale.amount;

    setRevenue((prev) => prev + saleAmount);
    setOrders((prev) => prev + 1);

    const newSale = {
      id: Date.now(),
      name: randomSale.name,
      product: randomSale.product,
      category: randomSale.category,
      amount: saleAmount,
      time: "Vừa xong",
      status: "completed"
    };

    setSales((prev) => [newSale, ...prev.slice(0, 4)]);
    setToastMessage(`ĐƠN MỚI: ${randomSale.name} mua ${randomSale.product} (+${saleAmount.toLocaleString("vi-VN")}đ)`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Audio beep simulation using Web Audio API
    if (soundNotify) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.warn("Audio Context blocked:", e);
      }
    }
  };

  const filteredSales = sales.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  // Calculate category distribution shares (static mockup calculation with updates)
  const categoryTotals = {
    jewelry: revenue * 0.55,
    ecommerce: revenue * 0.30,
    photography: revenue * 0.10,
    cafe: revenue * 0.05
  };

  // Color classes mapping
  const bgMain = lightTheme ? "bg-[#F8FAFC] text-slate-800" : "bg-[#080B11] text-[#E2E8F0]";
  const bgCard = lightTheme ? "bg-white border-slate-200/80 shadow-sm text-slate-800" : "bg-[#111726]/40 border-white/5 text-[#E2E8F0] shadow-md";
  const borderSubtle = lightTheme ? "border-slate-100" : "border-white/5";
  const borderCard = lightTheme ? "border-slate-200" : "border-white/5";
  const bgHeader = lightTheme ? "bg-white/90 border-slate-200" : "bg-[#080B11]/90 border-white/5";
  const textSecondary = lightTheme ? "text-slate-500" : "text-slate-400";
  const textPrimary = lightTheme ? "text-slate-900" : "text-white";

  return (
    <div className={`w-full h-full overflow-y-auto scrollbar-hide flex flex-col justify-between transition-colors duration-300 font-sans selection:bg-indigo-500/20 ${bgMain}`}>
      
      {/* High-Fidelity Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md px-6 flex justify-between items-center select-none border-b transition-colors ${bgHeader} ${isMobile ? "pt-12 pb-3" : "py-4"}`}>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-indigo-500 text-xl font-bold">admin_panel_settings</span>
          <span className={`font-black text-xs font-mono tracking-widest ${lightTheme ? "text-slate-655" : "text-[#94A3B8]"} ${isMobile ? "text-[10px]" : "text-xs"}`}>
            {isMobile ? "ADMIN" : "ADMIN PORTAL v2.5"}
          </span>
          {!isMobile && (
            <>
              <span className={`h-4.5 w-px ${lightTheme ? "bg-slate-200" : "bg-white/10"}`}></span>
              <span className={`inline-flex items-center gap-1.5 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                lightTheme ? "text-emerald-700 bg-emerald-100 border border-emerald-200" : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              }`}>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live updates
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Light/Dark Toggle Switch */}
          <button
            onClick={() => setLightTheme(!lightTheme)}
            className={`p-2 rounded-xl flex items-center justify-center transition-all border ${
              lightTheme 
                ? "bg-slate-100 text-slate-700 border-slate-300/80 hover:bg-slate-200" 
                : "bg-white/5 text-yellow-400 border-white/10 hover:bg-white/10"
            }`}
            title={lightTheme ? "Chế độ Tối" : "Chế độ Sáng"}
          >
            <span className="material-symbols-outlined text-sm font-bold">
              {lightTheme ? "dark_mode" : "light_mode"}
            </span>
          </button>

          <span className={`h-6 w-px ${lightTheme ? "bg-slate-200" : "bg-white/10"}`}></span>

          {/* User Profile Info */}
          <div className="flex items-center gap-3">
            <img src="/image/avt6.png" className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover" alt="Admin profile" />
            {!isMobile && (
              <div className="text-left text-xs font-bold leading-tight">
                <p className={textPrimary}>Lê Hugo Admin</p>
                <p className="text-slate-400 text-[10px] font-medium">Quản trị cấp cao</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation tabs inside browser preview frame - Hidden on mobile viewports inside frame */}
      {!isMobile && (
        <div className={`md:hidden flex justify-around py-3 border-b text-xs uppercase tracking-wider font-extrabold sticky top-[53px] z-20 transition-colors ${bgHeader}`}>
          <button 
            onClick={() => setActivePage("overview")} 
            className={`px-3 py-1 rounded-lg transition-colors ${
              activePage === "overview" 
                ? (lightTheme ? "bg-indigo-50 text-indigo-650" : "bg-indigo-500/15 text-indigo-400") 
                : (lightTheme ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white")
            }`}
          >
            Tổng quan
          </button>
          <button 
            onClick={() => setActivePage("transactions")} 
            className={`px-3 py-1 rounded-lg transition-colors ${
              activePage === "transactions" 
                ? (lightTheme ? "bg-indigo-50 text-indigo-650" : "bg-indigo-500/15 text-indigo-400") 
                : (lightTheme ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white")
            }`}
          >
            Giao dịch
          </button>
          <button 
            onClick={() => setActivePage("settings")} 
            className={`px-3 py-1 rounded-lg transition-colors ${
              activePage === "settings" 
                ? (lightTheme ? "bg-indigo-50 text-indigo-650" : "bg-indigo-500/15 text-indigo-400") 
                : (lightTheme ? "text-slate-500 hover:text-slate-800" : "text-slate-400 hover:text-white")
            }`}
          >
            Cấu hình
          </button>
        </div>
      )}

      {/* Main Administrative content wrapper */}
      <main className={`flex-grow ${isMobile ? "p-4 space-y-6" : "p-10 space-y-8"} max-w-5xl mx-auto w-full text-left`}>
        
        {/* Navigation Sidebar-style for desktop layouts */}
        {!isMobile && (
          <div className="hidden md:flex gap-4 border-b border-indigo-500/10 pb-4">
            {[
              { id: "overview", name: "Bảng Điều Khiển Tổng Quan", icon: "dashboard" },
              { id: "transactions", name: "Sổ Giao Dịch Chi Tiết", icon: "list_alt" },
              { id: "settings", name: "Cấu Hình & Tham Số", icon: "settings" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePage(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  activePage === tab.id
                    ? (lightTheme 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                        : "bg-indigo-600/20 text-indigo-400 border-indigo-500/30")
                    : (lightTheme 
                        ? "bg-white text-slate-655 border-slate-200 hover:bg-slate-100" 
                        : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:text-white")
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        )}

        {activePage === "overview" && (
          <div className="space-y-6 md:space-y-8 animate-fadeIn">
            {/* KPI Cards Grid */}
            <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 md:grid-cols-3 gap-6"}`}>
              
              {/* Revenue Card */}
              <div className={`p-5 rounded-2xl border ${bgCard}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] uppercase font-bold tracking-wider ${textSecondary}`}>TỔNG DOANH THU</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    lightTheme ? "text-emerald-700 bg-emerald-100" : "text-emerald-400 bg-emerald-500/10"
                  }`}>+15.2%</span>
                </div>
                <div className="space-y-1 mt-3">
                  <h3 className={`text-xl md:text-3xl font-extrabold tracking-tight font-mono leading-none ${
                    lightTheme ? "text-indigo-700" : "text-indigo-400"
                  }`}>
                    {revenue.toLocaleString("vi-VN")}đ
                  </h3>
                  <p className={`text-[9px] font-medium ${textSecondary}`}>Được đồng bộ liên tục thời gian thực</p>
                </div>
                {/* SVG Trend line inside card */}
                <div className="h-8 w-full mt-3 opacity-80">
                  <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0,18 Q15,4 30,14 T60,5 T80,1 T100,10" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Orders Card */}
              <div className={`p-5 rounded-2xl border ${bgCard}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] uppercase font-bold tracking-wider ${textSecondary}`}>TỔNG ĐƠN HÀNG</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                    lightTheme ? "text-indigo-700 bg-indigo-100" : "text-indigo-400 bg-indigo-500/10"
                  }`}>+9.4%</span>
                </div>
                <div className="space-y-1 mt-3">
                  <h3 className={`text-xl md:text-3xl font-extrabold tracking-tight font-mono leading-none ${
                    lightTheme ? "text-emerald-700" : "text-emerald-400"
                  }`}>
                    {orders}
                  </h3>
                  <p className={`text-[9px] font-medium ${textSecondary}`}>Đơn hàng giao dịch thành công</p>
                </div>
                {/* SVG Bar Chart inside card */}
                <div className="h-8 w-full flex items-end gap-1 mt-3 opacity-80">
                  {[20, 45, 30, 60, 50, 75, 95].map((val, i) => (
                    <div 
                      key={i} 
                      className={`w-full rounded-sm ${lightTheme ? "bg-emerald-650" : "bg-emerald-500"}`} 
                      style={{ height: `${val}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Online Users Card */}
              <div className={`p-5 rounded-2xl border ${bgCard}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] uppercase font-bold tracking-wider ${textSecondary}`}>TRUY CẬP TRỰC TUYẾN</span>
                  <span className="text-[8px] font-extrabold text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                </div>
                <div className="space-y-1 mt-3">
                  <h3 className={`text-xl md:text-3xl font-extrabold tracking-tight font-mono leading-none ${
                    lightTheme ? "text-amber-600" : "text-amber-400"
                  }`}>
                    58
                  </h3>
                  <p className={`text-[9px] font-medium ${textSecondary}`}>Người dùng đang lướt xem các mẫu web</p>
                </div>
                {/* Pulsing visual graph */}
                <div className="h-8 w-full flex items-center justify-center mt-3">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-[9px] font-mono text-amber-500 font-bold ml-1">Live WebSocket Connection</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Main Interactive SVG Analytics Chart & Category Split Grid */}
            <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 lg:grid-cols-12 gap-6"}`}>
              
              {/* Interactive Line Chart (8 cols) */}
              <div className={`${isMobile ? "w-full" : "lg:col-span-8"} p-5 rounded-3xl border ${bgCard} space-y-4`}>
                <div className="flex justify-between items-center">
                  <h4 className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${textPrimary}`}>
                    <span className="material-symbols-outlined text-sm text-indigo-500">analytics</span> Báo Cáo Đơn Hàng 7 Ngày Qua
                  </h4>
                  <div className="flex gap-2">
                    {["7days", "30days"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setSelectedPeriod(p)}
                        className={`text-[8px] sm:text-[9px] font-bold px-2 py-1 rounded transition-all uppercase ${
                          selectedPeriod === p
                            ? "bg-indigo-600 text-white"
                            : (lightTheme ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/5 text-slate-400 hover:text-white")
                        }`}
                      >
                        {p === "7days" ? "7 Ngày" : "30 Ngày"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Visual graph container */}
                <div className="relative h-44 w-full border-b border-l border-slate-500/10 pt-4 pl-4 select-none">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 text-[8px] font-mono text-slate-400 pr-2 pb-6">
                    <div className="border-t border-slate-500 border-dashed w-full text-right pt-0.5">50 đơn</div>
                    <div className="border-t border-slate-500 border-dashed w-full text-right pt-0.5">25 đơn</div>
                    <div className="border-t border-slate-500 border-dashed w-full text-right pt-0.5">0 đơn</div>
                  </div>

                  {/* SVG line and interactive hover areas */}
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* SVG Line path */}
                    <path
                      d="M 5,80 L 20,68 L 35,76 L 50,52 L 65,62 L 80,38 L 95,22"
                      fill="none"
                      stroke={lightTheme ? "#4F46E5" : "#6366F1"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Dots at data points */}
                    {[
                      { x: 5, y: 80, val: 12 },
                      { x: 20, y: 68, val: 19 },
                      { x: 35, y: 76, val: 15 },
                      { x: 50, y: 52, val: 27 },
                      { x: 65, y: 62, val: 22 },
                      { x: 80, y: 38, val: 34 },
                      { x: 95, y: 22, val: 42 }
                    ].map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredPoint === idx ? "2.5" : "1.5"}
                          fill={lightTheme ? "#6366F1" : "#818CF8"}
                          stroke={lightTheme ? "#FAF9F6" : "#080B11"}
                          strokeWidth="0.8"
                          className="cursor-pointer transition-all"
                          onMouseEnter={() => setHoveredPoint(idx)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Tooltip Overlay */}
                  {hoveredPoint !== null && (
                    <div 
                      className="absolute bg-[#0F1420] text-white p-2 rounded-lg border border-indigo-500/20 text-[9px] font-mono shadow-xl transition-all animate-scaleIn pointer-events-none z-10"
                      style={{
                        left: `${hoveredPoint * 13 + 4}%`,
                        top: "10%"
                      }}
                    >
                      <p className="font-bold text-indigo-400">{chartData[hoveredPoint].day}</p>
                      <p>Đơn hàng: <span className="font-bold text-white">{chartData[hoveredPoint].sales}</span></p>
                    </div>
                  )}
                </div>

                {/* Day labels */}
                <div className="flex justify-between px-2 text-[9px] font-mono text-slate-400 font-bold uppercase">
                  {chartData.map((d, i) => (
                    <span key={i} className="w-8 text-center">{d.day}</span>
                  ))}
                </div>
              </div>

              {/* Template Category Distribution (4 cols) */}
              <div className={`${isMobile ? "w-full" : "lg:col-span-4"} p-5 rounded-3xl border ${bgCard} flex flex-col justify-between gap-4`}>
                <h4 className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${textPrimary}`}>
                  <span className="material-symbols-outlined text-sm text-indigo-500">donut_large</span> Doanh Số Theo Lĩnh Vực
                </h4>

                {/* Horizontal Progress chart showing division of templates */}
                <div className="space-y-3 my-2 text-[9px] font-mono">
                  <div>
                    <div className="flex justify-between font-bold mb-0.5">
                      <span>Vàng Bạc (Jewelry)</span>
                      <span>55%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${lightTheme ? "bg-slate-100" : "bg-white/5"}`}>
                      <div className="bg-amber-500 h-full" style={{ width: "55%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-0.5">
                      <span>Mua Sắm (E-Commerce)</span>
                      <span>30%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${lightTheme ? "bg-slate-100" : "bg-white/5"}`}>
                      <div className="bg-indigo-500 h-full" style={{ width: "30%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-0.5">
                      <span>Nhiếp Ảnh (Photo Studio)</span>
                      <span>10%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${lightTheme ? "bg-slate-100" : "bg-white/5"}`}>
                      <div className="bg-emerald-500 h-full" style={{ width: "10%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold mb-0.5">
                      <span>Ẩm Thực (Cafe Shop)</span>
                      <span>5%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${lightTheme ? "bg-slate-100" : "bg-white/5"}`}>
                      <div className="bg-red-500 h-full" style={{ width: "5%" }}></div>
                    </div>
                  </div>
                </div>

                <div className={`text-[8.5px] ${textSecondary} leading-relaxed pt-2 border-t border-slate-500/10 font-medium`}>
                  * Vàng miếng SJC luôn dẫn đầu tỉ lệ doanh thu do giá trị thỏi vàng lớn và tần suất tích lũy an toàn cao.
                </div>
              </div>

            </div>

            {/* Quick Simulation panel */}
            <div className={`p-5 border rounded-2xl transition-all ${lightTheme ? "bg-white border-slate-200 shadow-sm" : "bg-[#0F1420] border-white/5 shadow-md"}`}>
              <div className="space-y-1.5 text-left mb-4">
                <h4 className={`text-xs font-bold uppercase tracking-wider ${textPrimary}`}>Giả Lập Giao Dịch Liên Kết</h4>
                <p className={`text-[11px] leading-relaxed ${textSecondary}`}>
                  Mô phỏng một đơn hàng thành công bất kỳ đến từ một trong các trang template (Coffee, Jewelry, E-Commerce, Photography). Hệ thống sẽ tự động cập nhật doanh số, đơn hàng và phát tín hiệu báo động trực quan.
                </p>
              </div>
              <button
                onClick={handleSimulateSale}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-1.5 shadow"
              >
                <span className="material-symbols-outlined text-sm">add_circle</span> Phát sinh giao dịch live (+Giá ngẫu nhiên)
              </button>
            </div>

          </div>
        )}

        {activePage === "transactions" && (
          <div className={`border rounded-2xl p-5 transition-all ${lightTheme ? "bg-white border-slate-200 shadow-sm" : "bg-[#0F1420] border-white/5 shadow-md"}`}>
            
            {/* Header controls inside box */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5">
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${lightTheme ? "text-slate-650" : "text-slate-350"}`}>
                <span className="material-symbols-outlined text-sm text-indigo-500">list_alt</span> Danh Sách Giao Dịch Thực Tế
              </span>
              
              <div className="flex gap-1.5 text-[9px] sm:text-[10px] font-bold">
                {["all", "completed", "pending"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg border transition-all uppercase ${
                      filter === f
                        ? "bg-indigo-650 text-white border-indigo-650"
                        : (lightTheme 
                            ? "bg-slate-50 text-slate-505 border-slate-200 hover:bg-slate-100" 
                            : "bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:text-white")
                    }`}
                  >
                    {f === "all" ? "Tất cả" : f === "completed" ? "Thành công" : "Chờ duyệt"}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Table or Mobile Cards List */}
            {isMobile ? (
              <div className="space-y-3">
                {filteredSales.map((s) => (
                  <div key={s.id} className={`p-4 rounded-xl border flex flex-col gap-2 ${bgCard}`}>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 font-bold text-xs">
                        <span className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] font-black font-mono text-white uppercase ${
                          s.category === "jewelry" ? "bg-amber-500" :
                          s.category === "ecommerce" ? "bg-indigo-500" :
                          s.category === "photography" ? "bg-emerald-500" : "bg-red-500"
                        }`}>
                          {s.category.charAt(0)}
                        </span>
                        <span className={lightTheme ? "text-slate-800" : "text-slate-200"}>{s.name}</span>
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                        s.status === "completed" 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-450 border border-amber-500/20"
                      }`}>
                        {s.status === "completed" ? "Thành công" : "Chờ duyệt"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px]">
                      <span className={textSecondary}>{s.product}</span>
                      <span className="font-mono text-slate-400">{s.time}</span>
                    </div>

                    <div className="flex justify-end pt-1 border-t border-slate-500/10">
                      <span className={`font-mono font-black text-xs ${lightTheme ? "text-indigo-700" : "text-indigo-400"}`}>
                        +{s.amount.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto select-text">
                <table className="w-full text-xs text-left border-collapse min-w-[550px]">
                  <thead>
                    <tr className="border-b border-slate-500/10 text-slate-450 uppercase font-bold text-[9px]">
                      <th className="py-2.5 pl-2">Khách hàng</th>
                      <th className="py-2.5">Sản phẩm / Mẫu web</th>
                      <th className="py-2.5">Thời gian</th>
                      <th className="py-2.5">Số tiền</th>
                      <th className="py-2.5 text-right pr-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((s) => (
                      <tr 
                        key={s.id} 
                        className={`border-b transition-colors ${
                          lightTheme ? "border-slate-100 hover:bg-slate-50/50" : "border-white/5 hover:bg-white/5"
                        }`}
                      >
                        <td className="py-3.5 pl-2 font-bold flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full flex items-center justify-center text-[7px] font-black font-mono text-white uppercase ${
                            s.category === "jewelry" ? "bg-amber-500" :
                            s.category === "ecommerce" ? "bg-indigo-500" :
                            s.category === "photography" ? "bg-emerald-500" : "bg-red-500"
                          }`}>
                            {s.category.charAt(0)}
                          </span>
                          <span className={lightTheme ? "text-slate-800" : "text-slate-200"}>{s.name}</span>
                        </td>
                        <td className={`py-3.5 font-medium ${textSecondary}`}>
                          {s.product}
                        </td>
                        <td className={`py-3.5 font-mono text-[10px] ${textSecondary}`}>{s.time}</td>
                        <td className={`py-3.5 font-mono font-black ${lightTheme ? "text-indigo-700" : "text-indigo-400"}`}>
                          +{s.amount.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            s.status === "completed" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {s.status === "completed" ? "Thành công" : "Chờ duyệt"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {activePage === "settings" && (
          <div className={`grid ${isMobile ? "grid-cols-1 gap-4" : "grid-cols-1 md:grid-cols-2 gap-6"} animate-fadeIn text-xs`}>
            
            {/* Toggles Settings Card */}
            <div className={`p-5 border rounded-2xl transition-all ${borderCard} ${bgCard}`}>
              <h4 className={`font-bold border-b pb-2 mb-4 ${lightTheme ? "text-slate-800 border-slate-100" : "text-slate-350 border-white/5"}`}>
                Cài Đặt Sự Kiện & Phản Hồi
              </h4>

              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5 text-left max-w-[80%]">
                    <p className={`font-bold ${textPrimary}`}>Âm thanh thông báo đơn hàng</p>
                    <p className={`text-[10px] ${textSecondary} leading-relaxed`}>Phát chuông kép nghệ thuật thông qua hệ thống Web Audio API khi có đơn hàng mới.</p>
                  </div>
                  <button 
                    onClick={() => setSoundNotify(!soundNotify)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${soundNotify ? "bg-indigo-600" : (lightTheme ? "bg-slate-200" : "bg-zinc-800")}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${soundNotify ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div className="space-y-0.5 text-left max-w-[80%]">
                    <p className={`font-bold ${textPrimary}`}>Đồng bộ hóa API Live</p>
                    <p className={`text-[10px] ${textSecondary} leading-relaxed`}>Duy trì các cổng WebSocket kết nối ảo liên tục để đồng bộ hóa dữ liệu trực tiếp.</p>
                  </div>
                  <button 
                    onClick={() => setAutoSync(!autoSync)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${autoSync ? "bg-indigo-600" : (lightTheme ? "bg-slate-200" : "bg-zinc-800")}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${autoSync ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Virtual Node Engine Specs */}
            <div className={`p-5 border rounded-2xl transition-all ${borderCard} ${bgCard}`}>
              <h4 className={`font-bold border-b pb-2 mb-4 ${lightTheme ? "text-slate-800 border-slate-100" : "text-slate-350 border-white/5"}`}>
                Thông Số Kỹ Thuật Node Engine
              </h4>
              
              <div className="space-y-3 font-mono text-[10px] sm:text-[10.5px] leading-relaxed">
                <div className="flex justify-between border-b border-slate-500/10 pb-1">
                  <span className="text-slate-400">Trạng thái CPU:</span>
                  <span className="text-emerald-500 font-bold">14% (Ổn định)</span>
                </div>
                <div className="flex justify-between border-b border-slate-500/10 pb-1">
                  <span className="text-slate-400">Bộ nhớ RAM đã dùng:</span>
                  <span className={lightTheme ? "text-indigo-750 font-bold" : "text-indigo-400 font-bold"}>128 MB / 1024 MB</span>
                </div>
                <div className="flex justify-between border-b border-slate-500/10 pb-1">
                  <span className="text-slate-400">Độ trễ phản hồi Ping:</span>
                  <span className="text-emerald-500 font-bold">1.5 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hệ điều hành ảo:</span>
                  <span className={textPrimary}>Ubuntu 24.04 LTS (x64)</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer Branding - Hidden on mobile viewports */}
      {!isMobile && (
        <footer className={`border-t py-6 mt-12 transition-colors select-none text-xs ${
          lightTheme ? "bg-white border-slate-200 text-slate-400" : "bg-[#080B11] border-white/5 text-slate-505"
        }`}>
          <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
            <span>© 2026 Admin Portal Dashboard. Secured with 256-bit SSL.</span>
            <span className="font-mono text-[10px]">Powered by Node.js</span>
          </div>
        </footer>
      )}

      {/* Custom Bottom Tab Bar for Mobile */}
      {isMobile && (
        <div className={`border-t px-6 pt-3 pb-5 flex justify-around items-center shrink-0 z-30 select-none ${
          lightTheme ? "bg-white border-slate-200 text-slate-800" : "bg-[#0F1420] border-white/5 text-slate-100"
        }`}>
          <button 
            onClick={() => setActivePage("overview")} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              activePage === "overview" 
                ? "text-indigo-500 font-bold" 
                : "text-slate-400 hover:text-slate-350"
            }`}
          >
            <span className="material-symbols-outlined text-xl">space_dashboard</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Tổng quan</span>
          </button>
          <button 
            onClick={() => setActivePage("transactions")} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              activePage === "transactions" 
                ? "text-indigo-500 font-bold" 
                : "text-slate-400 hover:text-slate-350"
            }`}
          >
            <span className="material-symbols-outlined text-xl">receipt_long</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Giao dịch</span>
          </button>
          <button 
            onClick={() => setActivePage("settings")} 
            className={`flex flex-col items-center gap-1 transition-colors ${
              activePage === "settings" 
                ? "text-indigo-500 font-bold" 
                : "text-slate-400 hover:text-slate-350"
            }`}
          >
            <span className="material-symbols-outlined text-xl">settings</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Cấu hình</span>
          </button>
        </div>
      )}

      {/* Live toast notification banner when a simulated sale happens */}
      {showToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-max max-w-[90%] bg-emerald-600/95 backdrop-blur-md text-white font-extrabold text-[10px] sm:text-[11px] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-1.5 z-50 border border-emerald-400/50 animate-fadeIn text-center">
          <span className="material-symbols-outlined text-[16px] animate-bounce">notifications_active</span>
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
