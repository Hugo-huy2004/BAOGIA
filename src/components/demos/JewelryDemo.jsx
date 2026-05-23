import React, { useState, useEffect } from "react";

export default function JewelryDemo({ isMobile = false }) {
  const [activePage, setActivePage] = useState("home");
  const [selectedBarId, setSelectedBarId] = useState("sjc_1chi");
  const [engravingText, setEngravingText] = useState("");
  const [showCheckoutQR, setShowCheckoutQR] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "" });

  const triggerToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // 5 Carousel Slides Banner content
  const slides = [
    { title: "BST Nhẫn Cưới Eternal Love 2026", desc: "Tặng gói khắc chữ chìm nghệ thuật độc bản cho 50 cặp đôi đăng ký đầu tiên.", btnText: "Xem nhẫn cưới", badge: "New Campaign" },
    { title: "Tích Trữ An Toàn Với Thỏi Vàng SJC 9999", desc: "Thỏi vàng miếng SJC 9999 đúc nguyên khối, vỉ nhựa bảo an tiện lợi tích lũy cá nhân.", btnText: "Mua vàng thỏi", badge: "Best Seller" },
    { title: "Tuyệt Tác Thủ Công Từ Nghệ Nhân Kim Hoàn", desc: "Từng đường nét được đẽo gọt tỉ mỉ dưới bàn tay nghệ nhân trên 20 năm kinh nghiệm.", btnText: "Tìm hiểu chế tác", badge: "Handcrafted" },
    { title: "Chính Sách Đặc Quyền Bảo Hành Trọn Đời", desc: "Đánh bóng, xi mạ, làm mới sản phẩm không giới hạn hoàn toàn miễn phí.", btnText: "Xem chính sách", badge: "Membership" },
    { title: "Giao Hàng An Ninh Cao - Bảo Hiểm 100%", desc: "Vận chuyển niêm phong bởi đối tác vận tải an ninh, đền bù tuyệt đối giá trị.", btnText: "Hỗ trợ vận chuyển", badge: "Insured Shipping" }
  ];

  // Auto scroll carousel every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const baseRate = 7500000; // 7.500.000đ per chỉ
  const goldBars = [
    { id: "sjc_1chi", name: "Thỏi Vàng SJC 1 Chỉ 9999", weight: 1, fee: 150000, desc: "Thỏi vàng miếng SJC 9999 đúc nguyên khối, bọc vỉ nhựa bảo an tiện lợi tích lũy cá nhân." },
    { id: "sjc_2chi", name: "Thỏi Vàng SJC 2 Chỉ 9999", weight: 2, fee: 200000, desc: "Lựa chọn tiết kiệm tối ưu cho gia đình nhỏ, chống hao mòn vật lý, dễ dàng bảo quản." },
    { id: "sjc_5chi", name: "Thỏi Vàng SJC 5 Chỉ 9999", weight: 5, fee: 350000, desc: "Trọng lượng trung bình phù hợp làm quà tặng cưới cao cấp hoặc tích lũy tài sản trung hạn." },
    { id: "sjc_1luong", name: "Thỏi Vàng SJC 1 Lượng (10 Chỉ)", weight: 10, fee: 600000, desc: "Miếng vàng SJC tiêu chuẩn lưu thông quốc gia, giữ giá vượt trội, thanh khoản nhanh chóng." },
    { id: "gold_10luong", name: "Bánh Vàng Hoàng Gia 10 Lượng", weight: 100, desc: "Bánh vàng đúc khối nguyên bản 99.99% dành cho các quỹ đầu tư tài chính lớn.", fee: 2500000 }
  ];

  const activeBar = goldBars.find((b) => b.id === selectedBarId) || goldBars[0];
  const totalPrice = baseRate * activeBar.weight + activeBar.fee;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#FAF9F6] text-[#2C3E29] font-sans selection:bg-[#B89855]/30 border-t-8 border-[#B89855]">
      
      {/* Scrollable Container */}
      <div className="w-full h-full overflow-y-auto scrollbar-hide flex flex-col justify-between">
        
        {/* Luxury Header */}
        <header className={`sticky top-0 z-30 backdrop-blur-md bg-[#FAF9F6]/90 border-b border-[#B89855]/20 px-4 pb-3 flex justify-between items-center transition-all ${isMobile ? "pt-12" : "pt-4"}`}>
          <button onClick={() => setActivePage("home")} className="flex items-center gap-2 font-serif text-base font-black hover:opacity-90 tracking-[0.15em] text-[#2C3E29]">
            <span className="material-symbols-outlined text-[#B89855] text-lg font-bold">diamond</span>
            <span>HUGO JEWELRY</span>
          </button>

          <nav className={`${isMobile ? "hidden" : "hidden md:flex"} items-center gap-8 text-xs font-bold uppercase tracking-widest text-[#2C3E29]/70`}>
            <button onClick={() => setActivePage("home")} className={`hover:text-[#B89855] transition-colors ${activePage === "home" ? "text-[#B89855] font-black" : ""}`}>Sản Phẩm</button>
            <button onClick={() => setActivePage("customizer")} className={`hover:text-[#B89855] transition-colors ${activePage === "customizer" ? "text-[#B89855] font-black" : ""}`}>Khắc Chữ Thỏi Vàng</button>
            <button onClick={() => setActivePage("policy")} className={`hover:text-[#B89855] transition-colors ${activePage === "policy" ? "text-[#B89855] font-black" : ""}`}>Chính Sách</button>
          </nav>

          <div className="flex items-center gap-3">
            <span className="bg-[#B89855]/10 border border-[#B89855]/30 text-[#B89855] text-[10px] font-extrabold px-2.5 py-1 rounded tracking-wider uppercase">LUXURY BOUTIQUE</span>
          </div>
        </header>

        {/* Navigation for Mobile inside frame - Hidden when using custom bottom tab bar */}
        {!isMobile && (
          <div className="md:hidden flex justify-around py-3 border-b border-[#B89855]/10 bg-[#FAF9F6]/80 text-xs uppercase tracking-wider font-extrabold sticky top-[80px] z-20">
            <button onClick={() => setActivePage("home")} className={`px-3 py-1 rounded transition-colors ${activePage === "home" ? "bg-[#B89855]/10 text-[#B89855] font-black" : "text-[#2C3E29]/60"}`}>Sản Phẩm</button>
            <button onClick={() => setActivePage("customizer")} className={`px-3 py-1 rounded transition-colors ${activePage === "customizer" ? "bg-[#B89855]/10 text-[#B89855] font-black" : "text-[#2C3E29]/60"}`}>Khắc Thỏi</button>
            <button onClick={() => setActivePage("policy")} className={`px-3 py-1 rounded transition-colors ${activePage === "policy" ? "bg-[#B89855]/10 text-[#B89855] font-black" : "text-[#2C3E29]/60"}`}>Chính Sách</button>
          </div>
        )}

        {/* Main Content Area */}
        <main className={`flex-grow w-full ${isMobile ? "p-4" : ""} space-y-12`}>
          {activePage === "home" && (
            <div className="space-y-12 animate-fadeIn text-left">
              
              {/* Auto-playing Promo Slider Banner (5 Slides) */}
              <section className="relative w-full overflow-hidden bg-gradient-to-r from-[#172516] to-[#243523] text-white p-6 md:p-10 flex flex-col justify-center min-h-[180px] md:min-h-[220px]">
                {/* Dynamic Slides render */}
                <div className="space-y-4 max-w-xl transition-all duration-500">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-[#B89855] text-zinc-950">
                    {slides[currentSlide].badge}
                  </span>
                  <h2 className="font-serif text-lg sm:text-2xl md:text-3xl font-light text-white leading-tight">
                    {slides[currentSlide].title}
                  </h2>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    {slides[currentSlide].desc}
                  </p>
                  <button 
                    onClick={() => {
                      setActivePage("customizer");
                      if (currentSlide === 1) setSelectedBarId("sjc_1luong");
                    }} 
                    className="px-4 py-2 bg-[#B89855] hover:bg-[#A38345] text-zinc-950 text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 self-start"
                  >
                    {slides[currentSlide].btnText} <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>

                {/* Slider Dots */}
                <div className="absolute bottom-4 right-6 flex gap-1.5 z-10">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentSlide === idx ? "bg-[#B89855] w-5" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </section>

              {/* Gold Bar Catalog Grid Section */}
              <section className={`${isMobile ? "px-0" : "px-6 md:px-10"} max-w-5xl mx-auto space-y-6`}>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-bold text-[#2C3E29]">Danh Sách Thỏi Vàng SJC 9999</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bảng giá niêm yết thỏi vàng và bánh vàng đúc nguyên chất. Giá bán tỉ lệ thuận theo trọng lượng và chi phí vỉ bảo an.
                  </p>
                </div>

                <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-6`}>
                  {goldBars.map((bar) => {
                    const barPrice = baseRate * bar.weight + bar.fee;
                    return (
                      <div key={bar.id} className="bg-white border border-[#B89855]/20 p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-[#2C3E29] uppercase tracking-wider">{bar.name}</h4>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Trọng lượng: {bar.weight} chỉ ({bar.weight * 3.75} gram)</p>
                            </div>
                            <span className="bg-[#B89855]/10 text-[#B89855] text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                              SJC 99.99%
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 leading-relaxed font-light">{bar.desc}</p>
                        </div>

                        <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center">
                          <div className="text-left font-mono">
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">ĐƠN GIÁ NIÊM YẾT</p>
                            <p className="text-base font-black text-[#B89855]">{barPrice.toLocaleString("vi-VN")}đ</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBarId(bar.id);
                              setActivePage("customizer");
                            }}
                            className="bg-[#2C3E29] hover:bg-[#1E291C] text-white px-3.5 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                          >
                            Chọn khắc
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}

          {activePage === "customizer" && (
            <div className={`${isMobile ? "px-0" : "px-6 md:px-10"} max-w-5xl mx-auto space-y-8 animate-fadeIn text-left`}>
              <div className="space-y-2">
                <h2 className="font-serif text-2xl font-bold text-[#2C3E29]">Thiết Kế Khắc Chữ Thỏi Vàng</h2>
                <p className="text-xs text-[#2C3E29]/75">Lựa chọn thỏi vàng theo trọng lượng tích lũy, nhập tên hoặc nội dung để nghệ nhân khắc laser chìm trực tiếp lên bề mặt miếng vàng.</p>
              </div>

              <div className={`grid ${isMobile ? "grid-cols-1 gap-6" : "grid-cols-12 gap-8"} items-stretch`}>
                {/* Left visual representation */}
                <div className={`${isMobile ? "w-full p-4 min-h-[250px]" : "col-span-5 p-6 min-h-[300px]"} bg-white border border-[#B89855]/20 rounded-2xl flex flex-col items-center justify-center relative shadow-sm`}>
                  <span className="absolute top-4 left-4 text-[9px] font-bold tracking-widest text-[#B89855] uppercase bg-[#B89855]/5 border border-[#B89855]/20 px-2.5 py-1 rounded">Miếng Vàng Khắc Laser</span>
                  
                  {/* Gold bar representation */}
                  <div className="relative w-36 h-48 bg-gradient-to-tr from-[#D4AF37] via-[#FFFDD0] to-[#AA7C11] rounded-xl border border-[#AA7C11] p-4 shadow-xl flex flex-col justify-between items-center text-center">
                    <div className="space-y-1">
                      <p className="text-[7px] font-bold text-amber-950/80 uppercase tracking-[0.25em] leading-none">RỒNG VÀO SJC</p>
                      <p className="text-[9px] font-bold text-amber-900 tracking-wider">999.9 PURE GOLD</p>
                    </div>

                    {engravingText ? (
                      <div className="w-full bg-[#1e2e1d]/90 text-[#B89855] border border-[#B89855]/50 py-1.5 px-2 rounded shadow-lg text-center rotate-[-12deg] animate-scaleIn">
                        <p className="text-[9px] font-serif italic font-bold tracking-widest">"{engravingText}"</p>
                      </div>
                    ) : (
                      <div className="w-16 h-8 border border-dashed border-amber-950/40 rounded flex items-center justify-center text-[7px] text-amber-950/50 uppercase">
                        Laser Logo
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <p className="text-[10px] font-extrabold text-amber-950 font-mono">{activeBar.weight} CHỈ</p>
                      <p className="text-[6px] text-amber-900/80 leading-none">NET WEIGHT</p>
                    </div>
                  </div>
                </div>

                {/* Right configuration settings */}
                <div className={`${isMobile ? "w-full p-4" : "col-span-7 p-6 md:p-8"} bg-white border border-[#B89855]/10 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm`}>
                  <div className="space-y-4">
                    {/* Select Bar Option */}
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Bước 1: Chọn Thỏi Vàng Cần Mua</span>
                      <select
                        value={selectedBarId}
                        onChange={(e) => setSelectedBarId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-[#B89855]"
                      >
                        {goldBars.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} - {b.weight} chỉ ({(baseRate * b.weight + b.fee).toLocaleString("vi-VN")}đ)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Engraving Input Box */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Bước 2: Nội dung Khắc Laser (Tối đa 12 ký tự)</label>
                      <input
                        type="text"
                        maxLength="12"
                        placeholder="Ví dụ: HUGO WISHPAX, LOVE 2026..."
                        value={engravingText}
                        onChange={(e) => setEngravingText(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-[#B89855] transition-colors font-mono"
                      />
                    </div>

                    {/* Detailed Description */}
                    <div className="bg-[#FAF9F6] border border-slate-100 p-4 rounded-xl space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Thông số thỏi chọn</p>
                      <p className="text-xs text-slate-600 font-light leading-relaxed">{activeBar.desc}</p>
                    </div>
                  </div>

                  {/* Calculation summary */}
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                    <div className="text-left font-mono">
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">GIÁ ĐƠN HÀNG TỔNG CỘNG</p>
                      <p className="text-lg font-black text-[#B89855] mt-0.5">{totalPrice.toLocaleString("vi-VN")}đ</p>
                      <p className="text-[8px] text-slate-400 mt-0.5">(Đã bao gồm thuế SJC & phí vỉ)</p>
                    </div>
                    <button
                      onClick={() => setShowCheckoutQR(true)}
                      className="bg-[#2C3E29] hover:bg-[#1E291C] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 hover:scale-102 active:scale-98"
                    >
                      MUA <span className="material-symbols-outlined text-xs">qr_code</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "policy" && (
            <div className={`${isMobile ? "px-0" : "px-6 md:px-10"} max-w-5xl mx-auto space-y-8 animate-fadeIn text-left text-xs leading-relaxed`}>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-[#2C3E29]">Chính Sách Bảo Hành & Cam Kết Kim Hoàn</h3>
                <p className="text-xs text-slate-500">Hugo Jewelry cam kết mang lại trải nghiệm tích trữ vàng miếng minh bạch và an toàn.</p>
              </div>

              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-6`}>
                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="material-symbols-outlined text-[#B89855] text-2xl">verified_user</span>
                  <h4 className="font-bold text-[#2C3E29]">Kiểm Định Tuổi Vàng</h4>
                  <p className="text-slate-500">Miếng vàng được phân tích quang phổ huỳnh quang đảm bảo đúng chuẩn hàm lượng SJC 99.99%. Hỗ trợ đền bù gấp đôi nếu phát hiện sai lệch tuổi vàng.</p>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="material-symbols-outlined text-[#B89855] text-2xl">swap_horiz</span>
                  <h4 className="font-bold text-[#2C3E29]">Thu Mua Biên Độ Nhỏ</h4>
                  <p className="text-slate-500">Hugo Jewelry cam kết thu mua lại các thỏi vàng SJC do chúng tôi phân phối với biên độ mua-bán chênh lệch cực nhỏ, đảm bảo tối đa tài sản khách hàng tích lũy.</p>
                </div>

                <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3">
                  <span className="material-symbols-outlined text-[#B89855] text-2xl">local_shipping</span>
                  <h4 className="font-bold text-[#2C3E29]">Vận Chuyển An Ninh</h4>
                  <p className="text-slate-500">Sử dụng hộp ký gửi bọc chì niêm phong có gắn mã định vị GPS. Vận chuyển tuyệt đối an toàn đến tay chủ sở hữu thông qua đội ngũ chuyển phát chuyên biệt.</p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer Branding - Hidden on mobile to save vertical space */}
        {!isMobile && (
          <footer className="border-t border-[#B89855]/20 py-6 mt-12 bg-white select-none">
            <div className="max-w-5xl mx-auto px-6 flex justify-between items-center text-xs text-[#2C3E29]/50">
              <span>© 2026 Hugo Jewelry. Chế Tác Thỏi Vàng SJC 9999 Độc Bản.</span>
              <span className="font-mono">SBV Approved Licence</span>
            </div>
          </footer>
        )}

      </div>

      {/* Custom Bottom Tab Bar for Mobile */}
      {isMobile && (
        <div className="bg-[#FAF9F6]/95 backdrop-blur-md border-t border-[#B89855]/20 px-6 pt-3 pb-5 flex justify-around items-center shrink-0 z-30 select-none">
          <button 
            onClick={() => setActivePage("home")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "home" ? "text-[#B89855] font-bold" : "text-[#2C3E29]/50 hover:text-[#2C3E29]"}`}
          >
            <span className="material-symbols-outlined text-xl">diamond</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Sản phẩm</span>
          </button>
          <button 
            onClick={() => setActivePage("customizer")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "customizer" ? "text-[#B89855] font-bold" : "text-[#2C3E29]/50 hover:text-[#2C3E29]"}`}
          >
            <span className="material-symbols-outlined text-xl">border_color</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Khắc thỏi</span>
          </button>
          <button 
            onClick={() => setActivePage("policy")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "policy" ? "text-[#B89855] font-bold" : "text-[#2C3E29]/50 hover:text-[#2C3E29]"}`}
          >
            <span className="material-symbols-outlined text-xl">verified_user</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Chính sách</span>
          </button>
        </div>
      )}

      {/* Floating Toast - Made responsive bottom offset on mobile */}
      {toast.show && (
        <div className={`absolute ${isMobile ? "bottom-20" : "bottom-6"} left-1/2 -translate-x-1/2 bg-[#2C3E29] text-[#FAF9F6] border border-[#B89855] text-xs px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-slideUp`}>
          <span className="material-symbols-outlined text-[#B89855] text-base font-black">verified</span>
          <span className="font-bold tracking-wider">{toast.message}</span>
        </div>
      )}

      {/* Checkout VietQR Payment popup */}
      {showCheckoutQR && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-50 animate-fadeIn">
          <div className="bg-white text-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative border-t-8 border-[#B89855] space-y-4">
            
            <h4 className="font-serif text-sm font-black uppercase tracking-widest text-[#2C3E29]">THANH TOÁN ĐƠN HÀNG</h4>
            <p className="text-[11px] text-slate-400">Quét mã chuyển khoản VietQR để khởi chạy chế tác khắc laser thỏi vàng miếng.</p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center relative">
              <div className="bg-white p-3 rounded-lg shadow-md border border-slate-200/50 flex flex-col items-center justify-center">
                {/* Simulated VietQR QR Graphic */}
                <div className="w-28 h-28 bg-[#FAF9F6] flex flex-col items-center justify-center gap-1.5 border border-dashed border-[#B89855]/50">
                  <span className="material-symbols-outlined text-[#2C3E29] text-4xl animate-pulse">qr_code_2</span>
                  <span className="text-[8px] text-[#B89855] font-mono tracking-widest">VIETQR_VERIFIED</span>
                </div>
              </div>
              
              <div className="mt-3 text-left w-full text-[11px] font-mono space-y-1 text-slate-650 border-t border-slate-200/50 pt-3">
                <p>Ngân hàng: <span className="font-bold text-slate-800">Vietcombank</span></p>
                <p>Số tài khoản: <span className="font-bold text-slate-800">101 234 5678</span></p>
                <p>Chủ TK: <span className="font-bold text-slate-800">LÊ HUGO WISHPAX</span></p>
                <p>Số tiền: <span className="font-bold text-[#B89855] text-xs">{totalPrice.toLocaleString("vi-VN")}đ</span></p>
                <p className="truncate">Nội dung: <span className="text-slate-800 font-bold">HUGO_GOLD_{engravingText || "BAR"}</span></p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">Sau khi nhận được khoản thanh toán, chúng tôi sẽ lập tức khắc chữ và bàn giao hộp ký gửi niêm phong cho đối tác vận tải an ninh.</p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCheckoutQR(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Quay lại
              </button>
              <button
                onClick={() => {
                  setShowCheckoutQR(false);
                  triggerToast("Đặt hàng thỏi vàng thành công!");
                  setEngravingText("");
                  setActivePage("home");
                }}
                className="w-1/2 bg-[#2C3E29] hover:bg-[#1E291C] text-white py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Xác nhận đã chuyển
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
