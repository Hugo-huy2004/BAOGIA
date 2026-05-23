import React, { useState, useEffect } from "react";

export default function PhotographyDemo({ isMobile = false }) {
  const [activePage, setActivePage] = useState("home");
  const [filter, setFilter] = useState("none");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", date: "", package: "fineart", note: "" });
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { title: "Concept Ánh Sáng Cinematic Mới", desc: "Giảm ngay 20% cho gói chụp Cinematic Couple khi đăng ký chụp ngoại cảnh cuối tuần này.", btnText: "Đặt lịch ngay", badge: "Hot Promotion" },
    { title: "Đào Tạo Photo Studio Thực Chiến", desc: "Khóa học nhiếp ảnh nghệ thuật độc bản cùng Giám đốc sáng tạo Peter Hugo Wishpax.", btnText: "Tìm hiểu khóa học", badge: "Academy" },
    { title: "Tải Ảnh Số Tốc Độ Cao Bằng QR", desc: "Hệ thống điện toán đám mây bảo mật riêng biệt giúp duyệt và tải toàn bộ ảnh gốc chỉ sau 24h.", btnText: "Xem trải nghiệm", badge: "Cloud Tech" },
    { title: "Tặng Gói Makeup Chuyên Nghiệp 800k", desc: "Đã bao gồm chi phí trang điểm cá nhân, làm tóc & thay 3 bộ trang phục cho gói Editorial.", btnText: "Chi tiết dịch vụ", badge: "Gift Combo" },
    { title: "Tư Vấn Thiết Kế Concept Moodboard", desc: "Lên ý tưởng thiết kế bảng phối cảnh trang phục & moodboard ánh sáng hoàn toàn miễn phí.", btnText: "Tư vấn miễn phí", badge: "Aesthetic" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const filterClasses = {
    none: "brightness-100 contrast-100",
    noir: "grayscale brightness-90 contrast-125",
    warm: "sepia brightness-95 saturate-110 hue-rotate-[5deg]",
    vivid: "contrast-125 saturate-150 brightness-105",
    chrome: "contrast-115 saturate-50 brightness-95",
  };

  const packages = {
    fineart: { title: "Fine Art Portrait", price: "2.500.000đ", desc: "Chân dung nghệ thuật trong Studio với ánh sáng tối giản." },
    editorial: { title: "Editorial & Fashion", price: "5.000.000đ", desc: "Concept thời trang cá nhân hoặc lookbook thương hiệu." },
    couple: { title: "Cinematic Couple", price: "3.800.000đ", desc: "Chụp ảnh đôi phim trường hoặc ngoại cảnh nghệ thuật." }
  };

  const handleBooking = (e) => {
    e.preventDefault();
    if (formData.name && formData.date) {
      setBookingSuccess(true);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans selection:bg-amber-500/30 relative">
      
      {/* Sticky Navigation Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md bg-zinc-950/85 border-b border-white/5 px-4 pb-3 flex justify-between items-center transition-all ${isMobile ? "pt-12" : "pt-4"}`}>
        <button onClick={() => setActivePage("home")} className="flex items-center gap-2 hover:opacity-90">
          <span className="font-serif text-lg font-bold tracking-[0.2em] text-white">HUGO</span>
          <span className="h-4 w-px bg-white/20"></span>
          <span className="text-[10px] tracking-[0.3em] text-amber-500 font-extrabold uppercase">STUDIO</span>
        </button>

        {/* Navigation Menu */}
        <nav className={`${isMobile ? "hidden" : "hidden md:flex"} items-center gap-8 text-xs font-semibold uppercase tracking-wider`}>
          <button onClick={() => setActivePage("home")} className={`hover:text-amber-500 transition-colors ${activePage === "home" ? "text-amber-500" : "text-zinc-400"}`}>Trang Chủ</button>
          <button onClick={() => setActivePage("gallery")} className={`hover:text-amber-500 transition-colors ${activePage === "gallery" ? "text-amber-500" : "text-zinc-400"}`}>Tác Phẩm</button>
          <button onClick={() => setActivePage("booking")} className={`hover:text-amber-500 transition-colors ${activePage === "booking" ? "text-amber-500" : "text-zinc-400"}`}>Dịch Vụ & Đặt Lịch</button>
        </nav>

        <div className="flex items-center gap-4">
          {!isMobile && (
            <button 
              onClick={() => setActivePage("booking")} 
              className="px-4 py-2 border border-amber-500/40 text-amber-400 text-xs font-semibold tracking-wider uppercase rounded-full hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-all duration-300 shadow-md shadow-amber-500/5 hover:scale-102"
            >
              ĐẶT KHUNG HÌNH
            </button>
          )}
        </div>
      </header>

      {/* Navigation for Mobile inside frame - Hidden when using custom bottom tab bar */}
      {!isMobile && (
        <div className="md:hidden flex justify-around py-3 border-b border-white/5 bg-zinc-900/60 text-xs uppercase tracking-wider font-extrabold sticky top-[53px] z-20">
          <button onClick={() => setActivePage("home")} className={`px-3 py-1 rounded transition-colors ${activePage === "home" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400"}`}>Home</button>
          <button onClick={() => setActivePage("gallery")} className={`px-3 py-1 rounded transition-colors ${activePage === "gallery" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400"}`}>Tác phẩm</button>
          <button onClick={() => setActivePage("booking")} className={`px-3 py-1 rounded transition-colors ${activePage === "booking" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-zinc-400"}`}>Đặt lịch</button>
        </div>
      )}

      {/* Main Body */}
      <main className={`flex-grow ${isMobile ? "p-4" : "p-6 md:p-10"} max-w-5xl mx-auto w-full space-y-12`}>
        {activePage === "home" && (
          <div className="space-y-12 animate-fadeIn text-left">
            
            {/* Auto-playing Promo Slider Banner (5 Slides) */}
            <section className="relative w-full overflow-hidden bg-gradient-to-r from-zinc-900 to-amber-955 text-white p-6 md:p-8 rounded-2xl flex flex-col justify-center min-h-[160px] border border-white/5">
              <div className="space-y-3 max-w-xl transition-all duration-500 text-left">
                <span className="inline-block px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest bg-amber-500 text-black">
                  {slides[currentSlide].badge}
                </span>
                <h2 className="font-serif text-base sm:text-xl md:text-2xl font-black text-white leading-tight">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-[10px] sm:text-xs text-zinc-300 leading-relaxed font-light">
                  {slides[currentSlide].desc}
                </p>
                <button 
                  onClick={() => {
                    setActivePage("booking");
                  }} 
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1 self-start"
                >
                  {slides[currentSlide].btnText} <span className="material-symbols-outlined text-[10px] font-black">arrow_forward</span>
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

            {/* Split Hero Section */}
            <section className={`grid ${isMobile ? "grid-cols-1 gap-6" : "grid-cols-12 gap-8"} items-center`}>
              <div className={`${isMobile ? "w-full space-y-4" : "col-span-7 space-y-6"} text-left`}>
                <span className="inline-flex gap-2 items-center px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span> Live Concept Studio
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] text-white tracking-tight">
                  Lưu Giữ <br />
                  <span className="italic text-amber-500 font-light">Linh Hồn</span> Ánh Sáng
                </h1>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-lg">
                  Chúng tôi không chụp lại những gì bạn thấy, chúng tôi ghi lại cảm xúc và vẻ đẹp độc bản của bạn dưới những góc máy nghệ thuật độc đáo và cách phối sáng chuyên sâu.
                </p>
                <div className="flex gap-4 pt-2">
                  <button onClick={() => setActivePage("gallery")} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-wider rounded transition-all hover:scale-102 flex items-center gap-2">
                    Xem Tác Phẩm <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
                  </button>
                  <button onClick={() => setActivePage("booking")} className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded transition-all hover:scale-102">
                    Báo Giá
                  </button>
                </div>
              </div>

              <div className={`${isMobile ? "w-full" : "col-span-5"} relative group`}>
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition duration-500"></div>
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
                  <img 
                    src="/image/avt1.png" 
                    alt="Photography Hero Model" 
                    className="w-full h-full object-cover grayscale transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent flex flex-col justify-end p-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 leading-none">Creative Director</span>
                    <h4 className="text-lg font-serif font-medium text-white mt-1 leading-tight">Peter Hugo Wishpax</h4>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Value Section */}
            <section className="border-t border-white/5 pt-12 text-left space-y-8">
              <div className="max-w-xl space-y-2">
                <h3 className="font-serif text-xl text-white">Tại sao chọn Hugo Studio?</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">Sự đầu tư chỉnh chu về công nghệ, phong cách nghệ thuật cùng dịch vụ cao cấp.</p>
              </div>
              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-6`}>
                {[
                  { title: "Thiết Kế Concept Riêng", desc: "Không rập khuôn. Mỗi khách hàng được thiết kế một ý tưởng, trang phục và tông màu độc lập phù hợp cá tính.", icon: "palette" },
                  { title: "Kỹ Thuật Phối Sáng Fine-Art", desc: "Sử dụng nguồn sáng nghệ thuật, tạo độ sâu chi tiết và chiều sâu tâm trạng chân thực cho từng bức chân dung.", icon: "lightbulb" },
                  { title: "Đồng Bộ Live-Preview", desc: "Khách hàng có thể trải nghiệm, chọn lọc các bộ lọc màu nghệ thuật trực tiếp và tải ảnh kỹ thuật số tốc độ cao.", icon: "filter_b_and_w" }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 bg-zinc-900/40 rounded-xl border border-white/5 space-y-3 hover:border-amber-500/20 hover:bg-zinc-900/60 transition-all duration-300">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                      <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activePage === "gallery" && (
          <div className="space-y-8 animate-fadeIn text-left">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-white">Phòng Lọc Màu Tác Phẩm</h2>
              <p className="text-xs text-zinc-400">Chọn các bộ lọc chuyên sâu dưới đây để cảm nhận sự thay đổi sắc thái màu sắc của chân dung nghệ thuật.</p>
            </div>

            {/* Photo Editor Simulation Layout */}
            <div className={`grid ${isMobile ? "grid-cols-1 gap-6" : "grid-cols-12 gap-8"} items-stretch bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden`}>
              
              {/* Workspace (Image View) */}
              <div className={`${isMobile ? "w-full p-4 border-b" : "col-span-8 bg-zinc-950 p-6 border-r"} flex items-center justify-center relative min-h-[250px] border-white/5`}>
                <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
                  <img
                    src="/image/avt1.png"
                    alt="Photography Model Editor Showcase"
                    className={`w-full h-full object-cover transition-all duration-700 ease-out ${filterClasses[filter]}`}
                  />
                  <div className="absolute bottom-3 left-3 bg-zinc-950/80 backdrop-blur-md text-[10px] px-3 py-1 rounded border border-white/10 text-amber-400 font-mono tracking-wider">
                    LUT: {filter.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Editor Toolbar Side Panel */}
              <div className={`${isMobile ? "w-full p-4" : "col-span-4 p-6"} space-y-6 bg-zinc-900/30 flex flex-col justify-between`}>
                <div className="space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-amber-500">hdr_strong</span> BỘ LỌC CONCEPT (LUTs)
                  </span>

                  <div className="flex flex-col gap-2.5">
                    {[
                      { id: "none", name: "Original (Gốc)", desc: "Màu ánh sáng studio chân thực" },
                      { id: "noir", name: "Noir (Đen Trắng)", desc: "Tương phản sâu sắc kiểu Pháp cổ" },
                      { id: "warm", name: "Warm Amber (Mơ Hồ)", desc: "Tông ấm chiều muộn mơ màng" },
                      { id: "vivid", name: "Vivid Color (Rực Rỡ)", desc: "Nổi bật chi tiết, bão hòa màu cao" },
                      { id: "chrome", name: "Vint Chrome (Cổ Điển)", desc: "Màu phim nhạt hoài niệm" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={`text-left p-3 rounded-lg border text-xs transition-all flex justify-between items-center ${
                          filter === f.id
                            ? "bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10"
                            : "bg-white/5 text-zinc-300 border-white/5 hover:border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div>
                          <p className="font-bold">{f.name}</p>
                          <p className={`text-[9px] mt-0.5 ${filter === f.id ? "text-black/70" : "text-zinc-400"}`}>{f.desc}</p>
                        </div>
                        {filter === f.id && (
                          <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 text-[10px] text-zinc-500 font-mono flex justify-between items-center">
                  <span>Render: WebGL Core</span>
                  <span>FPS: 60</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePage === "booking" && (
          <div className={`grid ${isMobile ? "grid-cols-1 gap-6" : "grid-cols-12 gap-8"} text-left animate-fadeIn`}>
            {/* Price list */}
            <div className={isMobile ? "w-full space-y-4" : "col-span-5 space-y-6"}>
              <div className="space-y-2">
                <h3 className="font-serif text-xl text-white">Gói Dịch Vụ Studio</h3>
                <p className="text-xs text-zinc-400">Các phương án chụp ảnh và báo giá ước tính tại Hugo Studio.</p>
              </div>

              <div className="space-y-4">
                {Object.entries(packages).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setFormData({ ...formData, package: key })}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      formData.package === key
                        ? "bg-amber-500/10 border-amber-500/50 text-white"
                        : "bg-zinc-900/30 border-white/5 text-zinc-300 hover:border-white/10"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider">{value.title}</span>
                      <span className="text-xs font-mono font-extrabold text-amber-400">{value.price}</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">{value.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className={`${isMobile ? "p-4" : "col-span-7 p-6 md:p-8"} bg-zinc-900/40 border border-white/5 rounded-2xl space-y-6`}>
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-amber-500">Đăng Ký Khung Giờ Chụp</h4>
                <p className="text-xs text-zinc-400">Điền thông tin đặt lịch tư vấn, ekip sẽ gọi lại xác nhận trong vòng 30 phút.</p>
              </div>

              <form onSubmit={handleBooking} className="space-y-4">
                <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block">Tên của bạn *</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nguyễn Văn A..."
                      className="w-full px-3.5 py-2 bg-zinc-950 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block">Email liên hệ</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@gmail.com..."
                      className="w-full px-3.5 py-2 bg-zinc-950 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block">Ngày chụp mong muốn *</label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2 bg-zinc-950 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block">Gói lựa chọn</label>
                    <select
                      value={formData.package}
                      onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                      className="w-full px-3.5 py-2 bg-zinc-950 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="fineart">Fine Art Portrait (2.500.000đ)</option>
                      <option value="editorial">Editorial & Fashion (5.000.000đ)</option>
                      <option value="couple">Cinematic Couple (3.800.000đ)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block">Ý tưởng / Ghi chú concept</label>
                  <textarea
                    rows="3"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Mô tả phong cách ảnh hoặc ghi chú đặc biệt..."
                    className="w-full px-3.5 py-2 bg-zinc-950 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-3 rounded font-bold transition-all text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-98 shadow-lg shadow-amber-500/10"
                >
                  XÁC NHẬN ĐĂNG KÝ LỊCH CHỤP
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding - Hidden on mobile to save vertical space */}
      {!isMobile && (
        <footer className="border-t border-white/5 py-8 mt-12 bg-zinc-950 select-none">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">© 2026 Hugo Photo Studio. All rights reserved.</span>
            </div>
            <div className="flex gap-6 text-zinc-400">
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-amber-500">Quy định bản quyền</a>
              <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-amber-500">Chính sách đặt cọc</a>
            </div>
          </div>
        </footer>
      )}

      {/* Custom Bottom Tab Bar for Mobile */}
      {isMobile && (
        <div className="bg-zinc-950/95 backdrop-blur-md border-t border-white/10 px-6 pt-3 pb-5 flex justify-around items-center shrink-0 z-30 select-none">
          <button 
            onClick={() => setActivePage("home")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "home" ? "text-amber-500" : "text-zinc-500 hover:text-zinc-400"}`}
          >
            <span className="material-symbols-outlined text-xl">home</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Trang chủ</span>
          </button>
          <button 
            onClick={() => setActivePage("gallery")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "gallery" ? "text-amber-500" : "text-zinc-500 hover:text-zinc-400"}`}
          >
            <span className="material-symbols-outlined text-xl">photo_library</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Tác phẩm</span>
          </button>
          <button 
            onClick={() => setActivePage("booking")} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "booking" ? "text-amber-500" : "text-zinc-500 hover:text-zinc-400"}`}
          >
            <span className="material-symbols-outlined text-xl">calendar_month</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Đặt lịch</span>
          </button>
        </div>
      )}

      {/* Success Modal Overlay - Made absolute inside mobile container */}
      {bookingSuccess && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-50 animate-fadeIn">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl relative">
            <span className="material-symbols-outlined text-green-400 text-5xl animate-bounce-gentle">check_circle</span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Đăng Ký Đã Nhận!</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Xin chào <span className="font-semibold text-white">{formData.name}</span>, yêu cầu đặt gói <span className="text-amber-400 font-semibold uppercase">{packages[formData.package].title}</span> đã được ghi nhận.
              </p>
            </div>
            
            <div className="p-3 bg-zinc-950 rounded-lg text-left text-[11px] font-mono text-zinc-400 border border-white/5 space-y-1">
              <p>Ngày chụp: <span className="text-white">{formData.date}</span></p>
              <p>Báo giá gói: <span className="text-amber-400 font-bold">{packages[formData.package].price}</span></p>
              <p>Ekip hỗ trợ: <span className="text-white">Hugo Crew</span></p>
            </div>

            <p className="text-[10px] text-zinc-500">Ekip Hugo Studio sẽ liên hệ sớm qua email/số điện thoại để tư vấn chi tiết concept.</p>
            
            <button
              onClick={() => {
                setBookingSuccess(false);
                setFormData({ name: "", email: "", date: "", package: "fineart", note: "" });
              }}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              ĐỒNG Ý & ĐÓNG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
