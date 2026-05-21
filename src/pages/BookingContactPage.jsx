import React, { useState, useEffect } from "react";
import { useHeadMeta } from "../hooks/useHeadMeta";
import HugoLogo from "../components/HugoLogo";

// Hugo Studio Brand Logo component to match styling exactly

export default function BookingContactPage() {
  useHeadMeta({
    title: "Đặt Lịch & Liên Hệ | Hugo Studio",
    description: "Đặt lịch hẹn thiết kế website hoặc gửi tin nhắn trực tiếp cho Hugo Studio để nhận báo giá chi tiết trong vòng 24 giờ.",
    keywords: "đặt lịch thiết kế, liên hệ Hugo Studio, thiết kế web portfolio, thiết kế web cá nhân",
    canonicalUrl: "https://www.hugowishpax.studio/booking"
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: ""
  });
  const [toast, setToast] = useState({ message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ message: "", type: "" });
    
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast("Yêu cầu của bạn đã được gửi thành công! Tôi sẽ liên hệ trong 24h.", "success");
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          message: ""
        });
      } else {
        showToast("Có lỗi khi gửi form. Vui lòng thử lại sau.", "error");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      showToast("Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.", "error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex flex-col justify-start lg:justify-center items-center px-4 py-8 md:py-16 text-slate-800 dark:text-slate-100 relative overflow-hidden">
      <style>{`
        @keyframes slideInDown {
          0% { transform: translate(-50%, -120%); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-toast-in {
          animation: slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Floating Toast Notification */}
      {toast.message && (
        <div className={`fixed top-6 left-1/2 z-50 animate-toast-in flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-[#161420] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35)] md:max-w-md w-[calc(100vw-32px)] border-2 transition-all ${
          toast.type === "success" 
            ? "border-emerald-500 dark:border-emerald-600" 
            : "border-red-500 dark:border-rose-500"
        }`}>
          <span className={`material-symbols-outlined shrink-0 text-xl ${
            toast.type === "success" ? "text-emerald-500" : "text-red-500 dark:text-rose-500"
          }`}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <div className="flex-1 text-xs sm:text-sm font-semibold text-slate-850 dark:text-slate-100 leading-snug">
            {toast.message}
          </div>
          <button 
            type="button"
            onClick={() => setToast({ message: "", type: "" })}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0 ml-1 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Two-column layout in desktop */}
      <section className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start relative">
        {/* Decorative background glows */}
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#6366f1]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full bg-[#0ea5e9]/5 blur-3xl pointer-events-none" />

        {/* Left Column: Branding / Process */}
        <div className="lg:col-span-5 space-y-6 relative z-10 text-center lg:text-left">
          {/* Brand Logo Header */}
          <div className="flex justify-center lg:justify-start items-center select-none">
            <HugoLogo className="text-xs font-black tracking-tight" />
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Đặt Lịch Thiết Kế.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
              Hãy phác thảo sơ bộ về dự án của bạn. Tôi sẽ liên lạc trực tiếp qua Zalo/Email trong vòng 24h để trao đổi chi tiết và lập báo giá phù hợp nhất.
            </p>
          </div>

          {/* Feature List/Workflow */}
          <div className="hidden lg:block space-y-5 pt-4">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-[#6366f1] text-lg mt-0.5">palette</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Ý tưởng độc bản</h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-0.5">Không dùng template rập khuôn. Giao diện được may đo phù hợp định dạng thương hiệu.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-[#0ea5e9] text-lg mt-0.5">bolt</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Hiệu năng & SEO</h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-0.5">Mã nguồn được viết sạch sẽ, tối ưu chuẩn Apple giúp tải trang nhanh và đạt thứ hạng Google tốt.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-[#10b981] text-lg mt-0.5">chat_bubble</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Hỗ trợ 1-1 qua Zalo</h4>
                <p className="text-[11px] text-slate-450 dark:text-slate-400 mt-0.5">Trao đổi nhanh chóng trực tiếp. Cam kết bảo trì và sửa lỗi trọn đời sản phẩm.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form (Apple style segmented cards) */}
        <div className="lg:col-span-7 relative z-10 w-full">
          <div className="bg-white/70 dark:bg-[#111016]/80 backdrop-blur-2xl border border-slate-200/50 dark:border-white/10 p-5 sm:p-8 rounded-3xl shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Unified iOS List Panel */}
              <div className="bg-slate-50 dark:bg-[#16151c] border border-slate-200/60 dark:border-white/5 rounded-2xl overflow-hidden divide-y divide-slate-200/50 dark:divide-white/5">
                
                {/* Full Name */}
                <div className="px-4 py-3.5 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 min-h-[56px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full md:w-44 shrink-0">
                    Quý danh:
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Nhập tên của bạn..."
                    className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none text-xs sm:text-sm font-semibold"
                  />
                </div>

                {/* Email */}
                <div className="px-4 py-3.5 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 min-h-[56px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full md:w-44 shrink-0">
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="yourname@domain.com"
                    className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none text-xs sm:text-sm font-semibold"
                  />
                </div>

                {/* Phone */}
                <div className="px-4 py-3.5 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 min-h-[56px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full md:w-44 shrink-0">
                    Số Điện Thoại (Zalo):
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="Số kết nối Zalo..."
                    className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none text-xs sm:text-sm font-semibold"
                  />
                </div>

                {/* Message */}
                <div className="px-4 py-4 flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-full shrink-0">
                    Lời Nhắn (Tùy Chọn):
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Chia sẻ mong muốn của bạn về giao diện, tính năng hoặc ý tưởng riêng..."
                    rows="4"
                    className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none text-xs sm:text-sm font-semibold resize-none leading-relaxed"
                  />
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold py-4 rounded-xl hover:scale-[1.01] active:scale-99 transition-all text-xs sm:text-sm shadow-md"
              >
                Gửi Yêu Cầu Đặt Lịch
              </button>

              {/* Apple-style Educational Disclaimer Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 text-[10px] text-slate-450 dark:text-slate-400 flex gap-2.5 text-left leading-relaxed">
                <span className="material-symbols-outlined text-[#0ea5e9] shrink-0 text-base mt-0.5">info</span>
                <span>
                  Tôi cung cấp dịch vụ trực tuyến (Online). Thông tin của quý khách sẽ được bảo mật tuyệt đối và chỉ dùng để thực hiện cuộc gọi Zalo tư vấn.
                </span>
              </div>

            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
