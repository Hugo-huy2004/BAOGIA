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
        <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-b from-white to-slate-50 dark:from-[#16151f] dark:to-[#12111a] border border-emerald-200 dark:border-emerald-900/30 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 relative group overflow-visible ring-1 ring-emerald-500/10 hover:ring-emerald-500/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100/50 to-transparent dark:from-emerald-500/5 pointer-events-none rounded-tr-3xl" />
          
          {/* Education Ticker Badge */}
          <div className="absolute top-0 right-4 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none">
            <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-ticker-pulse origin-center flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[10px]">workspace_premium</span>
              ĐẶC QUYỀN .EDU
            </span>
          </div>
          
          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                Tài Trợ 100% Cho Sinh Viên
              </span>
              <h3 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Student Bio
                <span className="material-symbols-outlined text-emerald-500 text-2xl" title="Đã xác thực">verified</span>
              </h3>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-slate-800 dark:text-white font-mono">0đ <span className="text-xs font-normal text-slate-400">/năm</span></p>
                <p className="text-sm text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600 font-medium">500.000đ</p>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/5 pt-6">
              <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-350">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500 mt-0.5">lock_open</span>
                  <span><strong>Chỉ dành riêng</strong> cho các bạn HSSV sở hữu email đuôi <code>.edu</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500 mt-0.5">auto_awesome</span>
                  <span><strong>Giao diện Premium:</strong> Không chứa quảng cáo, thiết kế aesthetic chuẩn Gen Z.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500 mt-0.5">edit_square</span>
                  <span><strong>Toàn quyền làm chủ:</strong> Tùy biến hình ảnh, liên kết MXH & chỉnh sửa 24/7.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500 mt-0.5">speed</span>
                  <span><strong>Tối ưu tốc độ:</strong> Trải nghiệm lướt mượt mà như một App thực thụ.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-emerald-500 mt-0.5">history</span>
                  <span><strong>Thời hạn 12 tháng:</strong> Gia hạn hoặc đóng tự do, không ràng buộc.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4 pt-8 relative z-10">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic font-medium leading-relaxed bg-slate-50 dark:bg-white/5 p-2.5 rounded-lg border border-slate-100 dark:border-white/5">
              * Hệ thống sẽ tự động xét duyệt. Mỗi sinh viên nhận 1 suất tài trợ trọn gói.
            </p>
            <Link 
              to="/login"
              onClick={playPopSound}
              className="group relative w-full inline-flex justify-center items-center py-3.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:scale-[1.02] active:scale-98 transition-all duration-300 overflow-hidden shadow-[0_5px_15px_rgba(0,0,0,0.1)] dark:shadow-[0_5px_15px_rgba(255,255,255,0.1)]"
            >
              <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/20 dark:via-slate-900/10 to-transparent group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
              <span className="flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-[14px]">rocket_launch</span>
                KÍCH HOẠT ĐẶC QUYỀN .EDU
              </span>
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
                  <span><strong>Công nghệ tối tân:</strong> Phát triển cho hiệu năng tải trang nhanh vượt trội.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Đa phương tiện:</strong> Hỗ trợ hiển thị tối đa 15 hình ảnh sắc nét và 8 video chất lượng cao.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-xs text-emerald-500 mt-0.5">check_circle</span>
                  <span><strong>Tối ưu SEO:</strong> Thiết kế cấu trúc thẻ chuẩn giúp website dễ dàng tiếp cận người dùng.</span>
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
                  <span><strong>Hỗ trợ:</strong> Kỹ thuật, tối ưu và sao lưu cơ sở dữ liệu.</span>
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
