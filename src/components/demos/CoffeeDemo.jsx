import React, { useState, useEffect } from "react";

export default function CoffeeDemo({ isMobile = false }) {
  const [activePage, setActivePage] = useState("home");
  const [cart, setCart] = useState({});
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [menuTab, setMenuTab] = useState("coffee");
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { title: "Ưu Đãi Sáng Sớm - Đồng Giá 29k", desc: "Thưởng thức Combo Espresso & Croissant bơ tỏi nóng hổi từ 7h - 9h sáng hằng ngày.", btnText: "Gọi món ngay", badge: "Morning Combo" },
    { title: "Trải Nghiệm Cold Brew Ủ Lạnh Mới", desc: "Độc quyền dòng cà phê ủ chậm 16h thanh mát kết hợp lát cam chín mọng và sả thơm.", btnText: "Xem menu nước", badge: "New Arrival" },
    { title: "Thành Viên Hugo Cafe - Tặng 10%", desc: "Tích lũy điểm đổi đồ uống miễn phí, nhận mã ưu đãi giảm 10% cho đơn hàng tiếp theo.", btnText: "Đăng ký thành viên", badge: "Loyalty Club" },
    { title: "Freeship Đơn Gọi Nhóm Trên 150k", desc: "Đặt tiệc trà bánh chiều văn phòng, miễn phí vận chuyển nhanh trong phạm vi 2km.", btnText: "Đặt nhóm ngay", badge: "Freeship" },
    { title: "Đặt Phòng Workshop Riêng Tư", desc: "Không gian máy chiếu, bảng vẽ, máy lạnh đầy đủ tiện nghi cho các cuộc họp dưới 30 người.", btnText: "Liên hệ đặt chỗ", badge: "Workshop Room" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = {
    coffee: [
      { id: "espresso", name: "Espresso Đậm Vị", price: 45000, desc: "Cà phê nguyên chất pha máy dưới áp suất cao, giữ trọn hương vị." },
      { id: "latte", name: "Café Latte Nghệ Thuật", price: 55000, desc: "Sự kết hợp hoàn hảo giữa Espresso và sữa nóng đánh bọt mịn vẽ hình." },
      { id: "coldbrew", name: "Cold Brew Cam Sả", price: 60000, desc: "Cà phê ủ lạnh 16 tiếng thanh mát kết hợp lát cam tươi và sả thơm." }
    ],
    tea: [
      { id: "peachtea", name: "Trà Đào Cam Sả", price: 55000, desc: "Trà đen đậm vị đào tươi giòn, lát cam vàng chín mọng và sả thơm." },
      { id: "matcha", name: "Matcha Latte Nhật Bản", price: 65000, desc: "Bột trà xanh Uji nguyên chất hòa quyện cùng sữa tươi không đường." }
    ],
    cakes: [
      { id: "croissant", name: "Croissant Bơ Tỏi", price: 35000, desc: "Bánh sừng bò nướng giòn tan thơm lừng bơ tỏi và phô mai kéo sợi." },
      { id: "tiramisu", name: "Tiramisu Truyền Thống", price: 50000, desc: "Bánh ngọt Ý vị cà phê thơm nồng hương rượu rum nhẹ nhàng." }
    ]
  };

  const updateCart = (id, change) => {
    setCart((prev) => {
      const val = (prev[id] || 0) + change;
      return { ...prev, [id]: Math.max(0, val) };
    });
  };

  const allItems = [...menuItems.coffee, ...menuItems.tea, ...menuItems.cakes];
  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = allItems.reduce((acc, item) => acc + (cart[item.id] || 0) * item.price, 0);

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide bg-[#FAF6F0] text-[#4E342E] flex flex-col justify-between font-sans selection:bg-[#8D6E63]/30 relative">
      
      {/* Cozy Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md bg-[#FAF6F0]/90 border-b border-[#4E342E]/10 px-4 pb-3 flex justify-between items-center transition-all ${isMobile ? "pt-12" : "pt-4"}`}>
        <button onClick={() => setActivePage("home")} className="flex items-center gap-2 font-serif text-base font-black hover:opacity-90">
          <span className="material-symbols-outlined text-amber-800 text-lg">local_cafe</span>
          <span className="tracking-wider">HUGO CAFE</span>
        </button>

        <nav className={`${isMobile ? "hidden" : "hidden md:flex"} items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#4E342E]/70`}>
          <button onClick={() => setActivePage("home")} className={`hover:text-amber-800 transition-colors ${activePage === "home" ? "text-amber-800" : ""}`}>Trang Chủ</button>
          <button onClick={() => setActivePage("menu")} className={`hover:text-amber-800 transition-colors ${activePage === "menu" ? "text-amber-800" : ""}`}>E-Menu</button>
          <button onClick={() => setActivePage("contact")} className={`hover:text-amber-800 transition-colors ${activePage === "contact" ? "text-amber-800" : ""}`}>Liên Hệ</button>
        </nav>

        <div className="flex items-center gap-3">
          <span className="bg-[#8D6E63]/10 border border-[#8D6E63]/30 text-amber-900 text-[10px] px-2.5 py-1 rounded font-mono font-bold">BÀN 08</span>
        </div>
      </header>

      {/* Navigation for Mobile inside frame - Hidden when using custom bottom tab bar */}
      {!isMobile && (
        <div className="md:hidden flex justify-around py-3 border-b border-[#4E342E]/5 bg-[#FAF6F0]/80 text-xs uppercase tracking-wider font-extrabold sticky top-[53px] z-20">
          <button onClick={() => setActivePage("home")} className={`px-3 py-1 rounded transition-colors ${activePage === "home" ? "bg-amber-800/10 text-amber-800 font-black" : "text-[#4E342E]/60"}`}>Trang Chủ</button>
          <button onClick={() => setActivePage("menu")} className={`px-3 py-1 rounded transition-colors ${activePage === "menu" ? "bg-amber-800/10 text-amber-800 font-black" : "text-[#4E342E]/60"}`}>E-Menu</button>
          <button onClick={() => setActivePage("contact")} className={`px-3 py-1 rounded transition-colors ${activePage === "contact" ? "bg-amber-800/10 text-amber-800 font-black" : "text-[#4E342E]/60"}`}>Liên Hệ</button>
        </div>
      )}

      {/* Main Body */}
      <main className={`flex-grow ${isMobile ? "p-4" : "p-6 md:p-10"} max-w-5xl mx-auto w-full space-y-12`}>
        {activePage === "home" && (
          <div className="space-y-12 animate-fadeIn text-left">
            
            {/* Auto-playing Promo Slider Banner (5 Slides) */}
            <section className="relative w-full overflow-hidden bg-gradient-to-r from-[#3E2723] to-[#5D4037] text-white p-6 md:p-8 rounded-2xl flex flex-col justify-center min-h-[160px]">
              <div className="space-y-3 max-w-xl transition-all duration-500 text-left">
                <span className="inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-amber-600 text-white">
                  {slides[currentSlide].badge}
                </span>
                <h2 className="font-serif text-base sm:text-xl md:text-2xl font-black text-white leading-tight">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-[10px] sm:text-xs text-amber-100 leading-relaxed font-light">
                  {slides[currentSlide].desc}
                </p>
                <button 
                  onClick={() => {
                    if (currentSlide === 4) setActivePage("contact");
                    else setActivePage("menu");
                  }} 
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1 self-start"
                >
                  {slides[currentSlide].btnText} <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                </button>
              </div>

              {/* Slider Dots */}
              <div className="absolute bottom-3 right-6 flex gap-1.5 z-10">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      currentSlide === idx ? "bg-amber-500 w-4" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </section>

            {/* Hero Section */}
            <section className={`grid ${isMobile ? "grid-cols-1 gap-6" : "grid-cols-12 gap-8"} items-center`}>
              <div className={`${isMobile ? "w-full space-y-4" : "col-span-7 space-y-6"} text-left`}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-800/10 text-amber-800 border border-amber-800/25">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Mở cửa phục vụ hằng ngày
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-amber-950 leading-tight">
                  Tận Hưởng <br />
                  <span className="italic font-light text-amber-800">Hương Vị Mộc</span> & Tĩnh Lặng
                </h1>
                <p className="text-sm text-[#4E342E]/70 leading-relaxed max-w-lg">
                  Chúng tôi tự hào tuyển chọn kỹ lưỡng từng hạt cà phê Organic từ cao nguyên LangBiang, chế biến thủ công giữ trọn sự mộc mạc nguyên bản để mang lại một tách cà phê hoàn hảo trong không gian yên ả.
                </p>
                <div className="flex gap-4 pt-2">
                  <button onClick={() => setActivePage("menu")} className="px-5 py-2.5 bg-[#5D4037] hover:bg-[#4E342E] text-white text-xs font-bold uppercase tracking-wider rounded transition-all hover:scale-102 flex items-center gap-2 shadow-md">
                    Xem E-Menu <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                  </button>
                  <button onClick={() => setActivePage("contact")} className="px-5 py-2.5 bg-white hover:bg-zinc-50 border border-amber-900/15 text-[#4E342E] text-xs font-bold uppercase tracking-wider rounded transition-all hover:scale-102">
                    Đặt Bàn
                  </button>
                </div>
              </div>

              <div className={`${isMobile ? "w-full" : "col-span-5"} relative group`}>
                <div className="absolute -inset-1 bg-amber-800/10 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500"></div>
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-amber-900/10 shadow-xl bg-white">
                  <img 
                    src="/image/avt2.png" 
                    alt="Coffee Cup Aesthetic" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute top-3 left-3 bg-[#5D4037]/80 text-white text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-widest backdrop-blur-sm">
                    Aesthetic Workspace
                  </div>
                </div>
              </div>
            </section>

            {/* Specialties Section */}
            <section className="border-t border-[#4E342E]/10 pt-12 text-left space-y-6">
              <h3 className="font-serif text-xl font-bold text-amber-950">Giá Trị Cốt Lõi</h3>
              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-6`}>
                {[
                  { title: "Hạt Cà Phê Mộc", desc: "Được rang mộc 100%, không pha tạp chất hay tẩm bơ đường để đảm bảo hương vị sạch nhất.", icon: "eco" },
                  { title: "Bánh Nướng Mỗi Sáng", desc: "Đội ngũ baker nướng tươi mỗi sáng từ bột nhập khẩu, bánh luôn nóng giòn khi phục vụ.", icon: "bakery_dining" },
                  { title: "Không Gian Trầm Ấm", desc: "Thiết kế gỗ tối giản, tích hợp ổ cắm sạc tại bàn và nhạc lo-fi nhẹ nhàng lý tưởng để làm việc.", icon: "chair" }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 bg-white/50 rounded-xl border border-amber-900/5 space-y-3 hover:bg-white transition-all shadow-sm">
                    <span className="material-symbols-outlined text-amber-800 text-2xl">{item.icon}</span>
                    <h4 className="text-sm font-bold text-amber-950">{item.title}</h4>
                    <p className="text-xs text-[#4E342E]/70 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activePage === "menu" && (
          <div className="space-y-8 animate-fadeIn text-left">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-black text-amber-950">E-Menu Gọi Món Tự Động</h2>
              <p className="text-xs text-[#4E342E]/70">Khách hàng tự do thêm sản phẩm vào khay giỏ hàng, hệ thống tự động cộng dồn báo giá chi tiết.</p>
            </div>

            {/* Menu Navigation Categories */}
            <div className="flex gap-2 border-b border-amber-900/10 pb-2 overflow-x-auto scrollbar-hide">
              {[
                { id: "coffee", name: "Cà Phê Mộc", icon: "coffee" },
                { id: "tea", name: "Trà & Nước Ép", icon: "local_drink" },
                { id: "cakes", name: "Bánh Nướng", icon: "cake" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMenuTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all border shrink-0 ${
                    menuTab === tab.id
                      ? "bg-[#5D4037] text-white border-[#5D4037] shadow-sm"
                      : "bg-white text-[#4E342E]/70 border-amber-900/5 hover:bg-[#5D4037]/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
              {menuItems[menuTab].map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-amber-900/5 shadow-sm transition-all hover:shadow-md">
                  <div className="space-y-1.5 pr-4 flex-grow">
                    <h4 className="text-xs font-bold text-[#4E342E] uppercase tracking-wider">{item.name}</h4>
                    <p className="text-[10px] text-[#4E342E]/70 leading-relaxed">{item.desc}</p>
                    <p className="text-xs font-mono font-extrabold text-amber-800">{item.price.toLocaleString("vi-VN")}đ</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 bg-[#FAF6F0] border border-amber-900/10 py-1 px-2.5 rounded-full">
                    <button
                      onClick={() => updateCart(item.id, -1)}
                      className="w-5 h-5 rounded-full bg-white hover:bg-amber-100 text-[#4E342E] flex items-center justify-center text-xs font-black shadow-sm"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-black w-4 text-center">{cart[item.id] || 0}</span>
                    <button
                      onClick={() => updateCart(item.id, 1)}
                      className="w-5 h-5 rounded-full bg-[#5D4037] hover:bg-[#4E342E] text-white flex items-center justify-center text-xs font-black shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Price Bar */}
            <div className="flex justify-between items-center bg-white border border-amber-900/5 p-4 rounded-xl shadow-sm mt-6">
              <div>
                <p className="text-[9px] text-[#4E342E]/50 font-bold uppercase tracking-wider">Tổng Đơn Hàng ({totalQty} món)</p>
                <p className="text-sm font-mono font-black text-amber-900 mt-0.5">{totalPrice.toLocaleString("vi-VN")}đ</p>
              </div>
              <button
                onClick={() => {
                  if (totalPrice > 0) setOrderSubmitted(true);
                }}
                disabled={totalPrice === 0}
                className={`px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow ${
                  totalPrice > 0
                    ? "bg-[#5D4037] hover:bg-[#4E342E] text-white cursor-pointer hover:scale-102 active:scale-98"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                Gửi Đơn <span className="material-symbols-outlined text-xs">send</span>
              </button>
            </div>
          </div>
        )}

        {activePage === "contact" && (
          <div className={`grid ${isMobile ? "grid-cols-1 gap-6" : "grid-cols-2 gap-8"} text-left animate-fadeIn`}>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-bold text-amber-950">Thông Tin Liên Hệ</h3>
                <p className="text-xs text-[#4E342E]/70">Ghé thăm hoặc liên hệ với chúng tôi để nhận các ưu đãi đặt chỗ trước.</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: "schedule", title: "Giờ Mở Cửa", desc: "Hằng ngày: 07:00 AM - 10:00 PM" },
                  { icon: "location_on", title: "Địa Chỉ Cửa Hàng", desc: "128 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh" },
                  { icon: "call", title: "Điện Thoại Đặt Bàn", desc: "090 123 4567" },
                  { icon: "mail", title: "Email Thư Tín", desc: "bistro@hugocafe.vn" }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-white rounded-xl border border-amber-900/5 shadow-sm">
                    <span className="material-symbols-outlined text-amber-800 text-xl">{item.icon}</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-amber-950">{item.title}</p>
                      <p className="text-xs text-[#4E342E]/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-amber-900/5 rounded-2xl p-6 shadow-sm flex flex-col justify-center space-y-4 text-center">
              <span className="material-symbols-outlined text-amber-800 text-5xl">event_seat</span>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-amber-950 uppercase tracking-wider">Đặt Chỗ Trước Riêng Tư</h4>
                <p className="text-xs text-[#4E342E]/70 max-w-sm mx-auto leading-relaxed">Bạn cần một không gian họp nhóm riêng, tổ chức sinh nhật ấm cúng hoặc workshop nhỏ? Nhấn nút gọi nhanh để giữ bàn tốt nhất.</p>
              </div>
              <a href="tel:0901234567" className="inline-block px-6 py-3 bg-[#5D4037] hover:bg-[#4E342E] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-md self-center">
                Gọi Ngay: 090 123 4567
              </a>
            </div>
          </div>
        )}
      </main>

      {/* Footer Copyright - Hidden on mobile to save space */}
      {!isMobile && (
        <footer className="border-t border-amber-900/10 py-6 mt-12 select-none">
          <div className="max-w-5xl mx-auto px-6 flex justify-between items-center text-xs text-[#4E342E]/50">
            <span>© 2026 Hugo Cafe Bistro. Mộc Mạc & Chân Thành.</span>
            <span className="font-mono">Tables v1.4</span>
          </div>
        </footer>
      )}

      {/* Custom Bottom Tab Bar for Mobile */}
      {isMobile && (
        <div className="bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#4E342E]/10 px-6 pt-3 pb-5 flex justify-around items-center shrink-0 z-30 select-none">
          <button 
            onClick={() => setActivePage("home")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "home" ? "text-amber-800 font-bold" : "text-[#4E342E]/50 hover:text-[#4E342E]"}`}
          >
            <span className="material-symbols-outlined text-xl">home</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Trang chủ</span>
          </button>
          <button 
            onClick={() => setActivePage("menu")} 
            className={`flex flex-col items-center gap-1 transition-colors relative ${activePage === "menu" ? "text-amber-800 font-bold" : "text-[#4E342E]/50 hover:text-[#4E342E]"}`}
          >
            <span className="material-symbols-outlined text-xl">restaurant_menu</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">E-Menu</span>
            {totalQty > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-650 text-white font-mono text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-scaleIn">
                {totalQty}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActivePage("contact")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "contact" ? "text-amber-800 font-bold" : "text-[#4E342E]/50 hover:text-[#4E342E]"}`}
          >
            <span className="material-symbols-outlined text-xl">contact_support</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Liên hệ</span>
          </button>
        </div>
      )}

      {/* Order Complete Print Receipt Animation Modal Overlay - Made absolute inside mobile container */}
      {orderSubmitted && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-50 animate-fadeIn">
          <div className="bg-white text-zinc-800 p-6 rounded-2xl max-w-xs w-full shadow-2xl relative border-t-8 border-dashed border-[#5D4037] animate-slideUp">
            
            <div className="text-center pb-4 border-b border-dashed border-zinc-200">
              <span className="material-symbols-outlined text-amber-800 text-3xl mb-1">receipt_long</span>
              <h3 className="font-serif text-sm font-black uppercase tracking-widest text-[#4E342E]">HÓA ĐƠN GỌI MÓN</h3>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Mã số: #0823052026</p>
            </div>

            <div className="py-4 space-y-2 border-b border-dashed border-zinc-200 text-xs font-mono max-h-[140px] overflow-y-auto scrollbar-hide">
              {allItems.map((item) => {
                const qty = cart[item.id] || 0;
                if (qty === 0) return null;
                return (
                  <div key={item.id} className="flex justify-between items-center text-left">
                    <div className="truncate max-w-[120px]">
                      <span>{item.name}</span>
                    </div>
                    <span>{qty} x {item.price.toLocaleString("vi-VN")}đ</span>
                  </div>
                );
              })}
            </div>

            <div className="py-3 flex justify-between items-center font-mono text-xs font-bold text-[#4E342E] uppercase">
              <span>Tổng thanh toán:</span>
              <span className="text-amber-800 text-sm font-black">{totalPrice.toLocaleString("vi-VN")}đ</span>
            </div>

            <div className="p-3 bg-[#FAF6F0] rounded-lg text-center space-y-1.5 border border-amber-900/5 mt-2">
              <p className="text-[10px] text-amber-950 font-bold">Bắt đầu pha chế!</p>
              <p className="text-[9px] text-[#4E342E]/70 leading-relaxed">Ekip đang chuẩn bị nước uống tại quầy. Bánh ngọt sẽ được hâm nóng giòn trước khi bưng tới bàn số 08.</p>
            </div>

            <button
              onClick={() => {
                setOrderSubmitted(false);
                setCart({});
                setActivePage("home");
              }}
              className="w-full bg-[#5D4037] hover:bg-[#4E342E] text-white py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors mt-4 shadow-sm"
            >
              CẢM ƠN & TIẾP TỤC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
