import React from "react";
import { Link } from "react-router-dom";
import { useHeadMeta } from "../hooks/useHeadMeta";

export default function ServicesPage() {
  useHeadMeta({
    title: "Dịch Vụ | Hugo Studio",
    description: "Cung cấp các gói dịch vụ thiết kế Bio Link cá nhân, Signature Portfolio và ứng dụng Web App doanh nghiệp cao cấp.",
    keywords: "dịch vụ thiết kế web, Bio Link sinh viên, Signature Portfolio, Ultimate Web App, Hugo Studio",
    canonicalUrl: "https://www.hugowishpax.studio/services"
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

  return (
    <div className="max-w-6xl mx-auto space-y-12 md:space-y-16 py-8 md:py-12 px-4 md:px-6 mb-16 text-slate-800 dark:text-slate-100">
      
      {/* Header section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
          Premium Portfolios & Web Applications
        </span>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Các Gói Dịch Vụ Của Tôi
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Cung cấp các giải pháp thiết kế website chuyên nghiệp, từ trang Bio Link tối giản cho học sinh sinh viên đến các ứng dụng web quản trị doanh nghiệp cao cấp độc bản.
        </p>
      </section>

      {/* Services Grid */}
      <section className="flex lg:grid lg:grid-cols-3 gap-6 lg:gap-8 overflow-x-auto lg:overflow-visible pb-8 lg:pb-0 snap-x snap-mandatory scrollbar-hide items-stretch mt-4 md:mt-8 px-4 lg:px-0 -mx-4 lg:mx-0">
        
        {/* Tier 1: Student Bio (Free) */}
        <div className="flex-none w-[85vw] sm:w-[380px] lg:w-auto snap-center lg:snap-align-none flex flex-col justify-between rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-[#12111a] dark:to-black border border-slate-200/50 dark:border-white/10 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-visible">
          
          {/* Badge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <span className="px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-950 border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1 whitespace-nowrap">
              <span className="material-symbols-outlined text-[10px]">school</span>
              Đặc quyền .edu
            </span>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="space-y-2 text-left">
              <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                Tài Trợ 100% Cho Sinh Viên
              </span>
              <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Student Bio
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-xl" title="Đã xác thực">verified</span>
              </h3>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-800 dark:text-white font-mono">0đ <span className="text-xs font-normal text-slate-400">/năm</span></p>
                <p className="text-sm text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600 font-medium">500.000đ</p>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-white/5 pt-6 text-left">
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-350">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Chỉ dành riêng</strong> cho các bạn HSSV sở hữu email đuôi <code>.edu</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Giao diện Premium:</strong> Không chứa quảng cáo, thiết kế aesthetic chuẩn Gen Z.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Toàn quyền làm chủ:</strong> Tùy biến hình ảnh, liên kết MXH & chỉnh sửa 24/7.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Tối ưu tốc độ:</strong> Trải nghiệm lướt mượt mà như một App thực thụ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Thời hạn 12 tháng:</strong> Gia hạn hoặc đóng tự do, không ràng buộc.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 pt-8 relative z-10">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed bg-slate-50 dark:bg-white/5 p-2.5 rounded-lg border border-slate-100 dark:border-white/5 text-left">
              * Hệ thống sẽ tự động xét duyệt. Mỗi sinh viên nhận 1 suất tài trợ trọn gói.
            </p>
            <Link 
              to="/login"
              onClick={playPopSound}
              className="w-full inline-flex justify-center items-center py-3.5 rounded-full border border-slate-300 dark:border-white/10 hover:border-slate-800 dark:hover:border-white text-slate-700 dark:text-slate-350 dark:hover:text-white font-bold text-xs hover:scale-[1.01] active:scale-98 transition-all duration-200 text-center"
            >
              KÍCH HOẠT ĐẶC QUYỀN
            </Link>
          </div>
        </div>

        {/* Tier 2: Signature Portfolio */}
        <div className="flex-none w-[85vw] sm:w-[380px] lg:w-auto snap-center lg:snap-align-none flex flex-col justify-between rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-[#12111a] dark:to-black border-2 border-primary dark:border-[#a5b4fc]/50 p-6 sm:p-8 shadow-2xl hover:shadow-[0_25px_50px_rgba(99,102,241,0.15)] transition-all duration-300 relative group overflow-visible">
          
          {/* Top Badge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <span className="px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-primary text-white shadow-md flex items-center gap-1 whitespace-nowrap">
              <span className="material-symbols-outlined text-[10px]">star</span>
              Phổ biến nhất
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-primary/10 text-primary dark:text-[#a5b4fc] border border-primary/20">
                Cá Nhân & Doanh Nghiệp
              </span>
              <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">Signature Portfolio</h3>
              <div className="space-y-1">
                <p className="text-xl font-black text-slate-800 dark:text-white">Thiết kế theo yêu cầu</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Báo giá tùy chỉnh theo quy mô dự án</p>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-white/5 pt-6 text-left">
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-350">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Thiết kế độc bản hoàn toàn:</strong> Nói không với template có sẵn, kiến tạo giao diện mang bản sắc cá nhân.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Trang riêng biệt (Landing Page):</strong> Bố cục nghệ thuật, tập trung tối đa vào thông điệp cốt lõi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Hồ sơ năng lực số:</strong> Tích hợp thông tin cá nhân, doanh nghiệp và kinh nghiệm làm việc trực quan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Công nghệ tối tân:</strong> Phát triển cho hiệu năng tải trang nhanh vượt trội.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Đa phương tiện:</strong> Hỗ trợ hiển thị tối đa 15 hình ảnh sắc nét và 8 video chất lượng cao.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Tối ưu SEO:</strong> Thiết kế cấu trúc thẻ chuẩn giúp website dễ dàng tiếp cận người dùng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Tương thích đa thiết bị:</strong> Hiển thị mượt mà trên Mobile, Tablet, Laptop và Desktop.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 pt-8 text-left">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed">
              * Chưa bao gồm chi phí tên miền, hosting và các dịch vụ bên thứ 3.
            </p>
            <Link 
              to="/booking"
              onClick={playPopSound}
              className="w-full inline-flex justify-center items-center py-3.5 rounded-full bg-primary text-white font-bold text-xs hover:scale-[1.01] active:scale-98 transition-all duration-200 text-center shadow-lg shadow-primary/25"
            >
              TƯ VẤN NGAY
            </Link>
          </div>
        </div>

        {/* Tier 3: Ultimate Web App */}
        <div className="flex-none w-[85vw] sm:w-[380px] lg:w-auto snap-center lg:snap-align-none flex flex-col justify-between rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-[#12111a] dark:to-black border border-slate-200/50 dark:border-white/10 p-6 sm:p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative group overflow-visible">
          
          {/* Top Badge */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <span className="px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-950 border border-slate-200 dark:border-white/10 shadow-sm flex items-center gap-1 whitespace-nowrap">
              <span className="material-symbols-outlined text-[10px]">business_center</span>
              Doanh nghiệp
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-white/5">
                Cửa Hàng & Doanh Nghiệp
              </span>
              <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">Ultimate Web App</h3>
              <div className="space-y-1">
                <p className="text-xl font-black text-slate-800 dark:text-white">Hệ thống cao cấp</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Đo ni đóng giày cho mọi mô hình kinh doanh</p>
              </div>
            </div>

            <div className="border-t border-slate-150 dark:border-white/5 pt-6 text-left">
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-350">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Độc bản & Đẳng cấp:</strong> Giao diện tùy chỉnh 100% phù hợp hoàn hảo với nhận diện thương hiệu.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Quản trị CMS chuyên sâu:</strong> Trang Dashboard Admin riêng bảo mật để dễ dàng tự quản lý nội dung.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Quản lý sản phẩm & Giỏ hàng:</strong> Tích hợp kho hàng, thuộc tính sản phẩm và quy trình mua sắm.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Cổng thanh toán tự động:</strong> Tích hợp quét mã QR ngân hàng, chuyển khoản, ví điện tử Momo/ZaloPay.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Form Booking & Liên hệ:</strong> Thu thập thông tin khách hàng và gửi thông báo trực tiếp qua Telegram/Email.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Báo cáo & Phân tích:</strong> Theo dõi doanh số, số đơn hàng và lượng khách truy cập theo thời gian thực.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-slate-400 dark:text-slate-500 mt-0.5 select-none">check</span>
                  <span><strong>Hỗ trợ:</strong> Kỹ thuật, tối ưu và sao lưu cơ sở dữ liệu.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 pt-8 text-left">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed">
              * Chưa bao gồm chi phí tên miền, hosting và các dịch vụ bên thứ 3.
            </p>
            <Link 
              to="/booking"
              onClick={playPopSound}
              className="w-full inline-flex justify-center items-center py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:scale-[1.01] active:scale-98 transition-all duration-200 text-center shadow-md"
            >
              TƯ VẤN NGAY
            </Link>
          </div>
        </div>

      </section>

    </div>
  );
}
