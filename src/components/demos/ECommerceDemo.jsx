import React, { useState, useEffect } from "react";

export default function ECommerceDemo({ isMobile = false }) {
  const [activePage, setActivePage] = useState("shop");
  const [cart, setCart] = useState({}); // { [item_key]: { product, color, size, qty } }
  const [selectedProduct, setSelectedProduct] = useState(null); // active product for detail modal
  const [modalColor, setModalColor] = useState("");
  const [modalSize, setModalSize] = useState("");
  const [modalQty, setModalQty] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({ name: "", phone: "", address: "" });
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "" });

  const triggerToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  // 5 Carousel Slides Banner content
  const slides = [
    { title: "SUMMER BOOMING SALE 2026", desc: "Bùng nổ ưu đãi hè, giảm giá tới 50% toàn bộ giày sneaker thể thao.", btnText: "Khám phá ngay", badge: "Hè rực rỡ" },
    { title: "Áo Khoác Bomber Techwear Độc Bản", desc: "Dòng bomber chống nước nhẹ siêu bền, phong cách futuristic thành thị.", btnText: "Mua ngay", badge: "Xu Hướng" },
    { title: "Balo Sợi Carbon Chống Nước Tuyệt Đối", desc: "Được gia cố sợi carbon cao cấp, sạc USB thông minh, chống trộm.", btnText: "Xem phụ kiện", badge: "Bán chạy" },
    { title: "Miễn Phí Ship Toàn Quốc Đơn Từ 500k", desc: "Nhập mã FREESHIP nhận ngay ưu đãi vận chuyển nhanh từ Viettel Post.", btnText: "Xem chi tiết", badge: "Ưu đãi ship" },
    { title: "Thành Viên Hugo Club - Tích Điểm 5%", desc: "Trở thành thành viên thân thiết để nhận thêm 10% giảm giá vào sinh nhật.", btnText: "Đăng ký thành viên", badge: "Hugo Member" }
  ];

  // 5 Commercial Products
  const products = [
    { id: "sneaker", name: "Hugo Sneaker Pro V2", type: "Giày thể thao", price: 1850000, oldPrice: 2050000, img: "/image/avt5.png", colors: ["black", "blue", "gold"], sizes: ["39", "40", "41", "42", "43"], desc: "Sneaker bọt khí siêu nhẹ tuần hoàn đệm nâng, phối màu thời trang sành điệu." },
    { id: "bomber", name: "Áo Khoác Bomber Techwear", type: "Thời trang", price: 1250000, oldPrice: 1500000, img: "/image/avt1.png", colors: ["black", "blue"], sizes: ["M", "L", "XL"], desc: "Dù dù dệt lỗ khí chống gió gió, chống thấm nhẹ nhiều ngăn đa dụng." },
    { id: "backpack", name: "Balo Da Chống Nước Carbon", type: "Phụ kiện", price: 950000, oldPrice: 1100000, img: "/image/avt2.png", colors: ["black"], sizes: ["Standard"], desc: "Vải da phối sợi carbon siêu chống nước, ngăn laptop 16 inch chuyên biệt." },
    { id: "smartwatch", name: "Đồng Hồ GPS Smart Sport", type: "Thiết bị", price: 3200000, oldPrice: 3800000, img: "/image/avt3.png", colors: ["black", "gold"], sizes: ["Standard"], desc: "AMOLED chống chói, GPS định vị, đo sức khỏe nhịp tim 24/7." },
    { id: "earbuds", name: "Tai Nghe Bluetooth Pro Sound", type: "Âm thanh", price: 1500000, oldPrice: 1800000, img: "/image/avt4.png", colors: ["black", "blue", "gold"], sizes: ["Standard"], desc: "Chống ồn ANC đàm thoại, âm bass mạnh mẽ, pin trâu liên tục 36h." }
  ];

  const colorNames = { black: "Carbon Black", blue: "Navy Blue", gold: "Rich Gold" };
  const colorHex = {
    black: "bg-zinc-950 border-zinc-500",
    blue: "bg-indigo-600 border-indigo-400",
    gold: "bg-amber-500 border-amber-300",
  };

  // Auto scroll carousel every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const openProductModal = (product) => {
    setSelectedProduct(product);
    setModalColor(product.colors[0]);
    setModalSize(product.sizes[0]);
    setModalQty(1);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const key = `${selectedProduct.id}_${modalColor}_${modalSize}`;
    setCart((prev) => {
      const existing = prev[key] || { product: selectedProduct, color: modalColor, size: modalSize, qty: 0 };
      return {
        ...prev,
        [key]: { ...existing, qty: existing.qty + modalQty }
      };
    });
    setSelectedProduct(null);
    triggerToast(`Đã thêm ${modalQty} sản phẩm vào giỏ hàng!`);
  };

  const updateCartItemQty = (key, change) => {
    setCart((prev) => {
      const item = prev[key];
      if (!item) return prev;
      const newQty = item.qty + change;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return {
        ...prev,
        [key]: { ...item, qty: newQty }
      };
    });
  };

  const removeCartItem = (key) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === "HUGO20") {
      setDiscountPercent(20);
      triggerToast("Áp dụng mã giảm giá 20% thành công!");
    } else {
      triggerToast("Mã không hợp lệ. Vui lòng thử 'HUGO20'");
    }
  };

  const cartItems = Object.entries(cart);
  const totalQty = cartItems.reduce((acc, [_, item]) => acc + item.qty, 0);
  const subtotal = cartItems.reduce((acc, [_, item]) => acc + item.product.price * item.qty, 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const deliveryFee = subtotal > 500000 ? 0 : 30000;
  const totalPayable = subtotal - discountAmount + (subtotal > 0 ? deliveryFee : 0);

  const handlePayment = (e) => {
    e.preventDefault();
    if (shippingInfo.name && shippingInfo.phone) {
      setCheckoutSuccess(true);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/20">
      
      {/* Scrollable Container */}
      <div className="w-full h-full overflow-y-auto scrollbar-hide flex flex-col justify-between">
        
        {/* Retail Header */}
        <header className={`sticky top-0 z-30 backdrop-blur-md bg-white/90 border-b border-slate-200 px-4 pb-3 flex justify-between items-center transition-all ${isMobile ? "pt-12" : "pt-4"}`}>
          <button onClick={() => { setActivePage("shop"); setCheckoutSuccess(false); }} className="flex items-center gap-1.5 hover:opacity-90">
            <span className="material-symbols-outlined text-indigo-600 text-xl font-black">shopping_bag</span>
            <span className="font-extrabold text-base tracking-widest text-slate-900">HUGO BOUTIQUE</span>
          </button>

          <nav className={`${isMobile ? "hidden" : "hidden md:flex"} items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-500`}>
            <button onClick={() => { setActivePage("shop"); setCheckoutSuccess(false); }} className={`hover:text-indigo-600 transition-colors ${activePage === "shop" ? "text-indigo-600 font-black" : ""}`}>Cửa Hàng</button>
            <button onClick={() => { setActivePage("details"); setCheckoutSuccess(false); }} className={`hover:text-indigo-600 transition-colors ${activePage === "details" ? "text-indigo-600 font-black" : ""}`}>Chi Tiết Kỹ Thuật</button>
            <button onClick={() => { setActivePage("cart"); setCheckoutSuccess(false); }} className={`hover:text-indigo-600 transition-colors ${activePage === "cart" ? "text-indigo-600 font-black" : ""}`}>Giỏ Hàng ({totalQty})</button>
          </nav>

          <div className="flex items-center gap-4">
            {!isMobile && (
              <button
                onClick={() => {
                  setActivePage("cart");
                  setCheckoutSuccess(false);
                }}
                className="relative p-2.5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-650 transition-colors"
              >
                <span className="material-symbols-outlined text-base">shopping_cart</span>
                {totalQty > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black animate-scaleIn">
                    {totalQty}
                  </span>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Navigation for Mobile inside frame - Hidden when using custom bottom tab bar */}
        {!isMobile && (
          <div className="md:hidden flex justify-around py-3 border-b border-slate-200 bg-white/80 text-xs uppercase tracking-wider font-extrabold sticky top-[80px] z-20">
            <button onClick={() => { setActivePage("shop"); setCheckoutSuccess(false); }} className={`px-3 py-1 rounded transition-colors ${activePage === "shop" ? "bg-indigo-550/10 text-indigo-600 font-black" : "text-slate-505"}`}>Cửa Hàng</button>
            <button onClick={() => { setActivePage("details"); setCheckoutSuccess(false); }} className={`px-3 py-1 rounded transition-colors ${activePage === "details" ? "bg-indigo-550/10 text-indigo-600 font-black" : "text-slate-505"}`}>Thông Số</button>
            <button onClick={() => { setActivePage("cart"); setCheckoutSuccess(false); }} className={`px-3 py-1 rounded transition-colors ${activePage === "cart" ? "bg-indigo-550/10 text-indigo-600 font-black" : "text-slate-505"}`}>Giỏ ({totalQty})</button>
          </div>
        )}

        {/* Main Body content area */}
        <main className={`flex-grow w-full ${isMobile ? "p-4" : ""} space-y-12`}>
          {activePage === "shop" && (
            <div className="space-y-12 animate-fadeIn text-left">
              
              {/* Auto-playing Promo Slider Banner (5 Slides) */}
              <section className="relative w-full overflow-hidden bg-gradient-to-r from-slate-900 to-indigo-955 text-white p-6 md:p-10 flex flex-col justify-center min-h-[180px] md:min-h-[220px]">
                <div className="space-y-4 max-w-xl transition-all duration-500">
                  <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-indigo-500 text-white">
                    {slides[currentSlide].badge}
                  </span>
                  <h2 className="font-serif text-lg sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
                    {slides[currentSlide].title}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed font-light">
                    {slides[currentSlide].desc}
                  </p>
                  <button 
                    onClick={() => {
                      if (currentSlide === 1) openProductModal(products[1]);
                      else if (currentSlide === 2) openProductModal(products[2]);
                      else openProductModal(products[0]);
                    }} 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 self-start"
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
                        currentSlide === idx ? "bg-indigo-500 w-5" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>
              </section>

              {/* Product Grid Section */}
              <section className="px-6 md:px-10 max-w-5xl mx-auto space-y-6">
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-bold text-slate-900">Danh Mục Sản Phẩm</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Chọn sản phẩm bất kỳ để tinh chỉnh thông số màu sắc, kích thước và thêm vào giỏ hàng.</p>
                </div>

                <div className={`grid ${isMobile ? "grid-cols-2 gap-3.5" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"}`}>
                  {products.map((product) => (
                    <div 
                      key={product.id} 
                      onClick={() => openProductModal(product)}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-full group"
                    >
                      <div className={`bg-slate-100 flex items-center justify-center relative aspect-square ${isMobile ? "p-3" : "p-6"}`}>
                        <img 
                          src={product.img} 
                          alt={product.name} 
                          className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isMobile ? "w-20 h-20" : "w-32 h-32 md:w-36 md:h-36"}`} 
                        />
                        <span className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-[8px] font-bold text-slate-505 px-2 py-0.5 rounded uppercase font-mono">
                          {product.type}
                        </span>
                      </div>

                      <div className={`space-y-3 flex-grow flex flex-col justify-between ${isMobile ? "p-3" : "p-4"}`}>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-650 transition-colors uppercase tracking-wider truncate">{product.name}</h4>
                          {!isMobile && <p className="text-[10px] text-slate-400 font-light leading-relaxed line-clamp-2">{product.desc}</p>}
                        </div>

                        <div className="flex justify-between items-baseline pt-2 border-t border-slate-50">
                          <span className="text-xs font-mono font-black text-[#4F46E5]">{product.price.toLocaleString("vi-VN")}đ</span>
                          {!isMobile && <span className="text-[9px] text-slate-400 line-through">{product.oldPrice.toLocaleString("vi-VN")}đ</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activePage === "details" && (
            <div className={`grid ${isMobile ? "grid-cols-1 gap-6" : "grid-cols-1 md:grid-cols-12 gap-8"} px-6 md:px-10 max-w-5xl mx-auto text-left animate-fadeIn`}>
              {/* Specs Column */}
              <div className={`${isMobile ? "" : "md:col-span-7"} space-y-6`}>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="material-symbols-outlined text-indigo-600 text-base font-bold">settings_suggest</span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">Thông Số Kỹ Thuật Chi Tiết</h3>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "Hugo Sneaker Pro V2",
                      type: "Giày thể thao",
                      img: "/image/avt5.png",
                      specs: [
                        { label: "Đế giày", val: "Phylon bọt khí tuần hoàn 4cm siêu êm" },
                        { label: "Thân giày", val: "Vải Mesh 3D dệt kim co giãn 4 chiều" },
                        { label: "Tính năng", val: "Hấp thụ lực, thoáng khí chống mùi" }
                      ]
                    },
                    {
                      name: "Áo Khoác Bomber Techwear",
                      type: "Thời trang",
                      img: "/image/avt1.png",
                      specs: [
                        { label: "Chất liệu", val: "Dù 2 lớp dệt chéo phủ Nano chống thấm" },
                        { label: "Thiết kế", val: "Ergonomic 3D, 6 ngăn túi tiện dụng" },
                        { label: "Cản gió", val: "Chống gió lạnh & tia UV bảo vệ da" }
                      ]
                    },
                    {
                      name: "Balo Da Chống Nước Carbon",
                      type: "Phụ kiện",
                      img: "/image/avt2.png",
                      specs: [
                        { label: "Chất liệu", val: "Da PU phối sợi carbon siêu nhẹ chịu lực" },
                        { label: "Ngăn chứa", val: "Đệm chống sốc Laptop 16 inch chuyên biệt" },
                        { label: "Khóa kéo", val: "YKK phản quang chống thấm nước" }
                      ]
                    },
                    {
                      name: "Đồng Hồ GPS Smart Sport",
                      type: "Thiết bị",
                      img: "/image/avt3.png",
                      specs: [
                        { label: "Màn hình", val: "AMOLED 1.43 inch độ sáng 1000 nits" },
                        { label: "Cảm biến", val: "PPG đo nhịp tim, SpO2 & theo dõi giấc ngủ" },
                        { label: "Chống nước", val: "Tiêu chuẩn 5ATM đi mưa, bơi lội an toàn" }
                      ]
                    },
                    {
                      name: "Tai Nghe Bluetooth Pro Sound",
                      type: "Âm thanh",
                      img: "/image/avt4.png",
                      specs: [
                        { label: "Khử tiếng ồn", val: "ANC chủ động lọc 98% tạp âm môi trường" },
                        { label: "Thời lượng pin", val: "8h liên tục, hộp sạc hỗ trợ thêm 28h" },
                        { label: "Driver âm thanh", val: "Củ loa Dynamic 10mm tăng cường âm bass" }
                      ]
                    }
                  ].map((p, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex gap-4 items-start">
                      <img src={p.img} alt={p.name} className="w-12 h-12 object-cover bg-slate-50 rounded-lg border border-slate-100 shrink-0" />
                      <div className="flex-grow space-y-2 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wide truncate">{p.name}</h4>
                          <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider">{p.type}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1 text-[10px]">
                          {p.specs.map((s, sIdx) => (
                            <div key={sIdx} className="flex gap-1.5 items-baseline">
                              <span className="text-slate-500 font-bold w-16 shrink-0 text-right">{s.label}:</span>
                              <span className="text-slate-600 truncate">{s.val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews Column */}
              <div className={`${isMobile ? "" : "md:col-span-5"} space-y-6`}>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="material-symbols-outlined text-indigo-650 text-base font-bold">reviews</span>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">Đánh Giá Từ Khách Hàng</h3>
                </div>

                {/* Rating Summary Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4 justify-center">
                  <div className="text-center shrink-0">
                    <span className="text-3xl font-black text-slate-900 leading-none">4.8</span>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">trên 5 sao</p>
                    <div className="text-amber-500 font-bold text-xs mt-1">★★★★★</div>
                  </div>
                  <div className="h-12 w-px bg-slate-200 shrink-0"></div>
                  <div className="flex-grow space-y-1 text-[9px] font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-8 text-slate-500 text-right">5 sao</span>
                      <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: "85%" }}></div>
                      </div>
                      <span className="w-8 text-slate-500 text-right">85%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-8 text-slate-500 text-right">4 sao</span>
                      <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: "12%" }}></div>
                      </div>
                      <span className="w-8 text-slate-500 text-right">12%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-8 text-slate-500 text-right">3 sao</span>
                      <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: "3%" }}></div>
                      </div>
                      <span className="w-8 text-slate-500 text-right">3%</span>
                    </div>
                  </div>
                </div>

                {/* Reviews Feed */}
                <div className={`space-y-3 ${isMobile ? "max-h-[220px]" : "max-h-[380px]"} overflow-y-auto pr-1 scrollbar-hide`}>
                  {[
                    { name: "Nguyễn Văn Hùng", rate: 5, date: "24/05/2026", comment: "Giày Sneaker đi siêu êm chân, bọt khí đàn hồi tốt, đóng gói cẩn thận có cả túi vải bảo quản xịn sò." },
                    { name: "Lê Thị Thu Thảo", rate: 5, date: "22/05/2026", comment: "Đồng hồ GPS đo nhịp tim rất chuẩn xác khi chạy bộ, màn hình AMOLED hiển thị cực kỳ sắc nét dưới nắng gắt." },
                    { name: "Trần Thế Minh", rate: 4, date: "19/05/2026", comment: "Tai nghe Bluetooth pin cực trâu, chống ồn ANC hoạt động ổn định trong tầm giá. Giao hàng rất nhanh." },
                    { name: "Phạm Minh Hoàng", rate: 5, date: "15/05/2026", comment: "Áo bomber techwear chống nước và chống gió siêu tốt, mặc đi phượt ban đêm rất ấm áp và thời trang." }
                  ].map((rev, idx) => (
                    <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm">
                      <div className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{rev.name}</span>
                          <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1 py-0.2 rounded border border-emerald-100 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[8px] font-black">verified</span>Đã mua
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono text-[9px]">{rev.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-500 text-xs font-bold font-mono">{"★".repeat(rev.rate)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-light leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer Branding - Hidden on mobile to save space */}
        {!isMobile && (
          <footer className="border-t border-slate-200 py-6 mt-12 bg-white select-none">
            <div className="max-w-5xl mx-auto px-6 flex justify-between items-center text-xs text-slate-400">
              <span>© 2026 Hugo E-Store. Đa Mẫu Mã - Bảo Hành Vàng.</span>
              <span className="font-mono">Ver 3.2 - 256bit Encrypted</span>
            </div>
          </footer>
        )}

      </div>

      {/* Custom Bottom Tab Bar for Mobile */}
      {isMobile && (
        <div className="bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 pt-3 pb-5 flex justify-around items-center shrink-0 z-30 select-none">
          <button 
            onClick={() => { setActivePage("shop"); setCheckoutSuccess(false); }} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "shop" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-650"}`}
          >
            <span className="material-symbols-outlined text-xl">storefront</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Cửa hàng</span>
          </button>
          <button 
            onClick={() => { setActivePage("details"); setCheckoutSuccess(false); }} 
            className={`flex flex-col items-center gap-1 transition-colors ${activePage === "details" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-650"}`}
          >
            <span className="material-symbols-outlined text-xl">table_chart</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Thông số</span>
          </button>
          <button 
            onClick={() => { setActivePage("cart"); setCheckoutSuccess(false); }} 
            className={`flex flex-col items-center gap-1 transition-colors relative ${activePage === "cart" ? "text-indigo-600 font-bold" : "text-slate-400 hover:text-slate-650"}`}
          >
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider">Giỏ hàng</span>
            {totalQty > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-650 text-white font-mono text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black animate-scaleIn">
                {totalQty}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Product Detail Customization Overlay Modal */}
      {selectedProduct && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50 animate-fadeIn">
          <div className={`bg-white text-slate-800 rounded-2xl max-w-lg w-full shadow-2xl relative animate-scaleIn text-left ${isMobile ? "p-4 space-y-4" : "p-6 md:p-8 space-y-6"}`}>
            <button 
              onClick={() => setSelectedProduct(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>

            <div className={`flex ${isMobile ? "flex-col gap-4" : "flex-col sm:flex-row gap-6"}`}>
              {/* Image preview */}
              <div className={`bg-slate-100 rounded-xl flex items-center justify-center ${isMobile ? "w-20 h-20 p-2 mx-auto" : "w-full sm:w-1/3 p-4"}`}>
                <img src={selectedProduct.img} alt={selectedProduct.name} className={`${isMobile ? "w-16 h-16" : "w-24 h-24"} object-cover`} />
              </div>
              
              {/* Product specifications */}
              <div className="flex-grow space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-indigo-650 uppercase font-mono">{selectedProduct.type}</span>
                  <h3 className="text-xs sm:text-base font-extrabold text-slate-900">{selectedProduct.name}</h3>
                  <p className="text-xs font-mono font-bold text-[#4F46E5]">{selectedProduct.price.toLocaleString("vi-VN")}đ</p>
                </div>

                <p className="text-[10px] sm:text-xs text-slate-505 leading-relaxed font-light">{selectedProduct.desc}</p>
                
                {/* Modal Color picker */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Màu sắc:</span>
                  <div className="flex gap-2">
                    {selectedProduct.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setModalColor(c)}
                        className={`w-5 h-5 rounded-full border transition-all ${colorHex[c]} ${
                          modalColor === c ? "scale-115 ring-2 ring-indigo-550/20" : "opacity-60"
                        }`}
                        title={colorNames[c] || c}
                      />
                    ))}
                  </div>
                </div>

                {/* Modal Size picker */}
                {selectedProduct.sizes.length > 1 && (
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Kích cỡ (EU):</span>
                    <div className="flex gap-1.5">
                      {selectedProduct.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => setModalSize(s)}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                            modalSize === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:border-slate-350"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Quantity selector */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full py-1 px-3">
                    <button onClick={() => setModalQty((prev) => Math.max(1, prev - 1))} className="text-xs font-bold w-4 text-center">-</button>
                    <span className="text-xs font-mono font-bold w-4 text-center">{modalQty}</span>
                    <button onClick={() => setModalQty((prev) => prev + 1)} className="text-xs font-bold w-4 text-center">+</button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-colors shadow-md shadow-indigo-500/10"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toast.show && (
        <div className={`absolute ${isMobile ? "bottom-20" : "bottom-6"} left-1/2 -translate-x-1/2 bg-slate-900 text-white border border-white/10 text-xs px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-slideUp`}>
          <span className="material-symbols-outlined text-indigo-500 text-base font-black">check_circle</span>
          <span className="font-bold tracking-wider">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
