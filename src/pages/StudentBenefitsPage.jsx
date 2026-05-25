import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useHeadMeta } from "../hooks/useHeadMeta";
import { loginMember } from "../services/authSession";

export default function StudentBenefitsPage() {
  useHeadMeta({
    title: "Quyền Lợi Sinh Viên | Hugo Studio",
    description:
      "Khám phá đặc quyền miễn phí 100% dành riêng cho Học sinh - Sinh viên khi tạo Bio Link cá nhân với thiết kế aesthetic.",
    keywords: "Student Bio, Bio Link miễn phí, email edu, Hugo Studio",
    canonicalUrl: "https://www.hugowishpax.studio/student-benefits",
  });

  const navigate = useNavigate();
  const [toast, setToast] = useState({ message: "", type: "" });
  const [gisReady, setGisReady] = useState(false);
  const googleButtonRef = useRef(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.message]);

  const handleGoogleCredential = (response) => {
    setToast({ message: "", type: "" });

    if (!response?.credential) {
      showToast("Không thể xác thực với Google.", "error");
      return;
    }

    const payloadBase64 = response.credential.split(".")[1];
    const payloadJson = atob(
      payloadBase64.replace(/-/g, "+").replace(/_/g, "/"),
    );
    const profile = JSON.parse(payloadJson);

    const email = profile.email || "";
    if (!email.toLowerCase().includes(".edu")) {
      showToast(
        "Xác thực bị từ chối: Cổng này chỉ chấp nhận email trường học (.edu / .edu.vn). Vui lòng chọn tài khoản có đuôi giáo dục.",
        "error",
      );
      return;
    }

    loginMember({
      email: profile.email,
      displayName: profile.name,
      provider: "google",
      avatarUrl: profile.picture,
    });

    navigate("/member");
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;

    let cancelled = false;
    let timer = null;

    const tryInitGoogle = () => {
      if (cancelled) return;

      const googleId = window.google?.accounts?.id;
      if (!googleId) return;

      setGisReady(true);
      if (!window.__googleInitializedForStudent) {
        googleId.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          // One Tap: tự động gợi ý tài khoản đang đăng nhập trên trình duyệt
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });
        window.__googleInitializedForStudent = true;
        // Kích hoạt One Tap popup tự động
        googleId.prompt((notification) => {
          // One Tap bị tắt hoặc không có tài khoản phù hợp -> dùng nút thường
        });
      }

      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
        googleId.renderButton(googleButtonRef.current, {
          theme: document.documentElement.classList.contains("dark")
            ? "filled_black"
            : "outline",
          size: "large",
          width: 280,
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
        });
      }

      if (timer) window.clearInterval(timer);
    };

    timer = window.setInterval(tryInitGoogle, 250);
    tryInitGoogle();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      // Reset flag khi unmount
      window.__googleInitializedForStudent = false;
    };
  }, []);

  const benefits = [
    {
      icon: "money_off",
      title: "Miễn phí 100%",
      desc: "Tài trợ toàn bộ chi phí, không phí ẩn. Gói 12 tháng, sau đó tự động huỷ — không tính phí thêm.",
      color: "text-emerald-500",
    },
    {
      icon: "diamond",
      title: "Giao diện Premium",
      desc: "Thiết kế aesthetic chuẩn Gen Z cực kỳ mượt mà. Đảm bảo sạch sẽ tuyệt đối, không chèn bất cứ quảng cáo nào.",
      color: "text-indigo-500",
    },
    {
      icon: "tune",
      title: "Toàn quyền tùy biến",
      desc: "Chỉnh sửa nội dung Bio Link 24/7. Thỏa sức sáng tạo với avatar, background, liên kết mạng xã hội theo phong cách cá nhân.",
      color: "text-rose-500",
    },
    {
      icon: "speed",
      title: "Hiệu năng & Tốc độ",
      desc: "Tốc độ tải trang siêu tốc. Trải nghiệm lướt mượt mà như một ứng dụng gốc trên nền tảng di động.",
      color: "text-amber-500",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex items-center justify-center py-8 px-4 text-slate-800 dark:text-slate-100 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-600/10 dark:bg-fuchsia-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Toast */}
      {toast.message && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-[#161420] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.35)] w-[calc(100vw-32px)] sm:w-auto sm:max-w-md border-2 transition-all animate-fadeIn ${
            toast.type === "success"
              ? "border-emerald-500"
              : "border-red-500 dark:border-rose-500"
          }`}
        >
          <span
            className={`material-symbols-outlined shrink-0 text-xl ${
              toast.type === "success"
                ? "text-emerald-500"
                : "text-red-500 dark:text-rose-500"
            }`}
          >
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <div className="flex-1 text-xs sm:text-sm font-semibold leading-snug">
            {toast.message}
          </div>
          <button
            onClick={() => setToast({ message: "", type: "" })}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <div className="max-w-6xl w-full grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 items-center relative z-10">
        {/* Left Column: Hero & Benefits */}
        <div className="space-y-6">
          <div className="space-y-4 text-center lg:text-left">
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all uppercase tracking-widest w-max mx-auto lg:mx-0"
            >
              <span className="material-symbols-outlined text-sm">
                arrow_back
              </span>
              Quay lại dịch vụ
            </Link>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">
                  workspace_premium
                </span>
                Tài Trợ 100% Học Sinh - Sinh Viên
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                Xây Dựng <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-sm">
                  Thương Hiệu Số
                </span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Hugo Studio dành tặng đặc quyền{" "}
                <strong>miễn phí 12 tháng</strong> cho sinh viên. Sở hữu Bio
                Link cá nhân chuẩn Premium, không quảng cáo và thiết kế độc bản.
              </p>
            </div>
          </div>

          {/* Value Comparison */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 p-4 rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-500/20">
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                Giá gốc dịch vụ
              </p>
              <p className="text-lg font-bold text-slate-400 dark:text-slate-500 line-through decoration-slate-400/50">
                500.000đ<span className="text-xs font-normal">/năm</span>
              </p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-indigo-200 dark:bg-indigo-500/20"></div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-center sm:justify-start gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  school
                </span>{" "}
                Đặc quyền Sinh Viên
              </p>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                0đ<span className="text-sm font-medium">/năm</span>
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 lg:gap-4">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="group relative bg-white/50 dark:bg-[#161420]/50 backdrop-blur-md border border-slate-200 dark:border-white/5 p-4 rounded-2xl hover:bg-white dark:hover:bg-[#1c1a27] hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                <div
                  className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${benefit.color} shadow-sm`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {benefit.icon}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                  {benefit.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="relative flex justify-center lg:justify-end mt-4 lg:mt-0">
          {/* Decorative elements behind card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 blur-3xl rounded-full pointer-events-none" />

          <div className="w-full max-w-[380px] bg-white/80 dark:bg-[#12111a]/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            {/* Animated Gradient Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="text-center space-y-3 mb-8">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 border border-indigo-100 dark:border-indigo-500/30 rounded-full flex items-center justify-center shadow-inner relative">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping opacity-20" />
                <span className="material-symbols-outlined text-3xl text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  school
                </span>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-800 dark:text-white mb-1">
                  Định Danh Sinh Viên
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                  Chỉ áp dụng cho tài khoản Google giáo dục (
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    .edu
                  </strong>{" "}
                  hoặc{" "}
                  <strong className="text-indigo-600 dark:text-indigo-400">
                    .edu.vn
                  </strong>
                  )
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-5">
              <div className="w-full flex flex-col items-center gap-4">
                {/* Google Sign-In Button */}
                <div
                  ref={googleButtonRef}
                  className="flex justify-center min-h-[44px]"
                />

                <div className="w-full flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                  <span>hoặc nếu không tự hiện</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                </div>

                <button
                  onClick={() => {
                    const googleId = window.google?.accounts?.id;
                    if (googleId) {
                      // Hủy prompt cũ (nếu có bị treo) trước khi gọi prompt mới để tránh lỗi FedCM outstanding request
                      googleId.cancel(); 
                      setTimeout(() => googleId.prompt(), 100);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-full border border-indigo-300 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                >
                  Bấm để chọn tài khoản Google
                </button>
              </div>

              {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <p className="text-[10px] text-center text-red-500 font-medium">
                  Cảnh báo: Thiếu Google Client ID
                </p>
              )}

              <div className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 flex gap-2.5 text-left leading-relaxed">
                <span className="material-symbols-outlined text-indigo-500 shrink-0 text-lg mt-0.5">
                  shield_person
                </span>
                <p>
                  Hệ thống bảo mật bằng Google OAuth 2.0. Tự động gợi ý tài
                  khoản edu đang đăng nhập trên trình duyệt của bạn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
