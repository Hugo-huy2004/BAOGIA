import React from "react";
import { Link } from "react-router-dom";

export default function ServicesPage() {
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
    <main className="max-w-6xl mx-auto space-y-16 py-12 px-4 md:px-6 mb-16 text-slate-800 dark:text-slate-100">
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.18); }
        }
        @keyframes heartbeat-delayed {
          0%, 100% { transform: scale(0.9); }
          50% { transform: scale(1.15); }
        }
        @keyframes ticker-pulse {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.12) translateY(-2px); }
        }
        .animate-heartbeat {
          animation: heartbeat 1.4s infinite ease-in-out;
        }
        .animate-heartbeat-delayed {
          animation: heartbeat-delayed 1.4s infinite ease-in-out;
          animation-delay: 0.35s;
        }
        .animate-ticker-pulse {
          animation: ticker-pulse 1.2s infinite ease-in-out;
        }
      `}</style>
      
      {/* Header section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.24em] bg-primary/10 text-primary dark:text-[#a5b4fc] border border-primary/20">
          ✦ Premium Portfolios & Web Applications ✦
        </span>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Các Gói Dịch Vụ Của Tôi
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Cung cấp các giải pháp thiết kế website chuyên nghiệp, từ trang Bio Link tối giản cho học sinh sinh viên đến các ứng dụng web quản trị doanh nghiệp cao cấp độc bản.
        </p>
      </section>

      {/* Services Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        
        {/* Tier 1: Student Bio (Free) */}
        <div className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#12111a] border border-slate-200 dark:border-white/10 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 relative group overflow-visible">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100/50 to-transparent dark:from-white/5 pointer-events-none" />
          
          {/* Education Ticker Badge */}
          <div className="absolute top-2 right-2 z-20 flex items-center justify-center pointer-events-none">
            <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/50 animate-ticker-pulse origin-center shadow-lg">
              ✦ Education
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                Học Sinh & Sinh Viên
              </span>
              <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">Student Bio</h3>
              <p className="text-2xl font-black text-slate-800 dark:text-white font-mono">0đ <span className="text-xs font-normal text-slate-400">/năm</span></p>
            </div>

            <div className="border-t border-slate-100 dark:border-white/5 pt-6">
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-350">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span>Dành cho các bạn HSSV đang theo học tại các trường ĐH.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span>Sửa nội dung bất cứ lúc nào qua trang cá nhân.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span>Tự do tùy biến liên kết mạng xã hội & hình ảnh.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span>Xóa Bio hoặc đổi đường dẫn khi không dùng nữa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span>Thời hạn sử dụng Bio Link trong vòng 12 tháng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span>Tối ưu tải trang siêu nhanh, mượt mà trên mọi di động.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed">
              * Mỗi tài khoản cung cấp cho 1 lần dùng. Yêu cầu xác thực email .edu.
            </p>
            <Link 
              to="/login"
              onClick={playPopSound}
              className="w-full inline-flex justify-center items-center py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:scale-[1.02] active:scale-98 transition-transform duration-200"
            >
              NHẬN MIỄN PHÍ NGAY
            </Link>
          </div>
        </div>

        {/* Tier 2: Signature Portfolio */}
        <div className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#12111a] border-2 border-primary dark:border-[#a5b4fc] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative group">
          {/* Overlapping Pulsing Hearts in 3D */}
          <div className="absolute -top-6 -right-6 z-20 flex items-center justify-center pointer-events-none">
            <span className="material-symbols-outlined text-red-500 dark:text-rose-500 text-5xl select-none filter drop-shadow-[0_10px_15px_rgba(244,63,94,0.6)] animate-heartbeat">
              favorite
            </span>
            <span className="material-symbols-outlined text-pink-400 dark:text-pink-300 text-3xl absolute translate-x-3.5 translate-y-3.5 select-none filter drop-shadow-[0_5px_8px_rgba(244,63,94,0.4)] animate-heartbeat-delayed">
              favorite
            </span>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-primary/10 text-primary dark:text-[#a5b4fc] border border-primary/20">
                Cá Nhân & Doanh Nghiệp
              </span>
              <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">Signature Portfolio</h3>
              <div className="space-y-1">
                <p className="text-xl font-black text-slate-800 dark:text-white">Thiết kế theo yêu cầu</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Báo giá tùy chỉnh theo quy mô dự án</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/5 pt-6">
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-350">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Thiết kế độc bản hoàn toàn:</strong> Nói không với template có sẵn, kiến tạo giao diện mang bản sắc cá nhân.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Trang riêng biệt (Landing Page):</strong> Bố cục nghệ thuật, tập trung tối đa vào thông điệp cốt lõi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Hồ sơ năng lực số:</strong> Tích hợp thông tin cá nhân, doanh nghiệp và kinh nghiệm làm việc trực quan.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Công nghệ tối tân:</strong> Phát triển bằng React, Tailwind CSS cho hiệu năng tải trang nhanh vượt trội.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Đa phương tiện:</strong> Hỗ trợ hiển thị tối đa 15 hình ảnh sắc nét và 8 video chất lượng cao.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Tối ưu SEO chuẩn Apple:</strong> Thiết kế cấu trúc thẻ chuẩn giúp website dễ dàng tiếp cận người dùng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Tương thích đa thiết bị:</strong> Hiển thị mượt mà trên Mobile, Tablet, Laptop và Desktop.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed">
              * Chưa bao gồm chi phí tên miền, hosting và các dịch vụ bên thứ 3.
            </p>
            <Link 
              to="/booking"
              onClick={playPopSound}
              className="w-full inline-flex justify-center items-center py-3.5 rounded-full bg-primary text-white font-bold text-xs hover:scale-[1.02] active:scale-98 transition-transform duration-200"
            >
              TƯ VẤN NGAY
            </Link>
          </div>
        </div>

        {/* Tier 3: Ultimate Web App */}
        <div className="flex flex-col justify-between rounded-3xl bg-white dark:bg-[#12111a] border border-slate-200 dark:border-white/10 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100/50 to-transparent dark:from-white/5 pointer-events-none" />
          
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                Cửa Hàng & Doanh Nghiệp
              </span>
              <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">Ultimate Web App</h3>
              <div className="space-y-1">
                <p className="text-xl font-black text-slate-800 dark:text-white">Hệ thống cao cấp</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Đo ni đóng giày cho mọi mô hình kinh doanh</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/5 pt-6">
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-350">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#a5b4fc] mt-0.5">verified</span>
                  <span><strong>Độc bản & Đẳng cấp:</strong> Giao diện tùy chỉnh 100% phù hợp hoàn hảo với nhận diện thương hiệu.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#a5b4fc] mt-0.5">verified</span>
                  <span><strong>Quản trị CMS chuyên sâu:</strong> Trang Dashboard Admin riêng bảo mật để dễ dàng tự quản lý nội dung.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#a5b4fc] mt-0.5">verified</span>
                  <span><strong>Quản lý sản phẩm & Giỏ hàng:</strong> Tích hợp kho hàng, thuộc tính sản phẩm và quy trình mua sắm.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#a5b4fc] mt-0.5">verified</span>
                  <span><strong>Cổng thanh toán tự động:</strong> Tích hợp quét mã QR ngân hàng, chuyển khoản, ví điện tử Momo/ZaloPay.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#a5b4fc] mt-0.5">verified</span>
                  <span><strong>Form Booking & Liên hệ:</strong> Thu thập thông tin khách hàng và gửi thông báo trực tiếp qua Telegram/Email.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#a5b4fc] mt-0.5">verified</span>
                  <span><strong>Báo cáo & Phân tích:</strong> Theo dõi doanh số, số đơn hàng và lượng khách truy cập theo thời gian thực.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-[#a5b4fc] mt-0.5">verified</span>
                  <span><strong>Bảo trì & Hỗ trợ trọn đời:</strong> Cam kết hỗ trợ kỹ thuật, tối ưu và sao lưu cơ sở dữ liệu định kỳ 24/7.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 pt-8">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed">
              * Chưa bao gồm chi phí tên miền, hosting và các dịch vụ bên thứ 3.
            </p>
            <Link 
              to="/booking"
              onClick={playPopSound}
              className="w-full inline-flex justify-center items-center py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:scale-[1.02] active:scale-98 transition-transform duration-200"
            >
              TƯ VẤN NGAY
            </Link>
          </div>
        </div>

      </section>

    </main>
  );
}
