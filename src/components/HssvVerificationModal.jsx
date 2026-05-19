import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginMember } from "../services/authSession";

export default function HssvVerificationModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOTP = async () => {
    setError("");
    if (!email.includes("@")) {
      setError("Email không hợp lệ.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Lỗi khi gửi OTP.");
        return;
      }
      setStep(2);
    } catch (err) {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    if (otp.length < 6) {
      setError("Vui lòng nhập đủ mã OTP 6 số.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Mã OTP không đúng hoặc đã hết hạn.");
        return;
      }
      
      // Auto Login
      loginMember({
        email: email,
        displayName: email.split("@")[0],
        provider: "otp_hssv",
        avatarUrl: ""
      });

      alert("Xác minh thành công! Đang chuyển hướng bạn đến Trang cá nhân.");
      onClose();
      navigate("/member");
    } catch (err) {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#12111a] rounded-3xl max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-emerald-500 text-lg">verified_user</span>
            Xác Minh Học Sinh Sinh Viên
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-sm block">close</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="flex h-1.5 bg-slate-100 dark:bg-slate-800">
          <div className="bg-emerald-500 h-full transition-all duration-500 ease-out" style={{ width: `${(step / 2) * 100}%` }} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* STEP 1: Email */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-2 mb-2">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">mail</span>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">Bước 1: Nhập Email Xác Minh</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                  Vui lòng sử dụng địa chỉ email của bạn để nhận mã xác thực (OTP) kích hoạt đặc quyền HSSV.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email của bạn:</label>
                <input
                  type="email"
                  placeholder="hocsinh@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendOTP(); }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1f1929] text-sm p-3.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && <p className="text-[10px] text-rose-500 font-bold text-center">{error}</p>}

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
              >
                {loading ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : "Gửi mã OTP"}
              </button>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="text-center space-y-2 mb-2">
                <span className="material-symbols-outlined text-4xl text-emerald-500/50">password</span>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">Bước 2: Xác thực OTP</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                  Mã xác thực 6 số đã được gửi tới <strong>{email}</strong>.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Nhập mã OTP:</label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="•••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOTP(); }}
                  className="w-full max-w-[200px] mx-auto block rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1f1929] text-xl p-3.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-[0.5em] text-center font-bold"
                />
              </div>

              {error && <p className="text-[10px] text-rose-500 font-bold text-center">{error}</p>}

              <button
                onClick={handleVerifyOTP}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
              >
                {loading ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : "Hoàn Tất Đăng Ký"}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
