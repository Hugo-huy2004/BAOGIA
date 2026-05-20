import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SupportRequestPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [issue, setIssue] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !email.trim() || !phone.trim() || !issue.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin yêu cầu.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Địa chỉ Email không hợp lệ.');
      return;
    }

    // Phone validation
    const phoneRegex = /^[0-9+()-\s]{8,15}$/;
    if (!phoneRegex.test(phone)) {
      setErrorMsg('Số điện thoại không hợp lệ.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          issue
        })
      });

      if (!res.ok) {
        throw new Error('Gửi yêu cầu thất bại');
      }

      setIsSuccess(true);
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setIssue('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Không thể kết nối với máy chủ. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0a0f] text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 py-12 relative overflow-hidden transition-colors duration-300">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl bg-white/75 dark:bg-[#12111a]/75 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl p-6 sm:p-10 relative overflow-hidden transition-all">
        
        {isSuccess ? (
          /* SUCCESS STATE */
          <div className="text-center py-8 space-y-6 animate-fadeIn">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10 border border-emerald-200 dark:border-emerald-900/60 animate-bounce">
              <span className="material-symbols-outlined text-emerald-500 text-4xl">check_circle</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Gửi Yêu Cầu Thành Công
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Hệ thống hỗ trợ 1:1 đã tiếp nhận vấn đề của bạn. Đội ngũ kỹ thuật viên sẽ chủ động liên hệ trực tiếp qua số Zalo bạn cung cấp trong vòng 10 - 15 phút tới.
              </p>
            </div>

            <div className="pt-4 flex gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-indigo-600/15 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                style={{ minHeight: 0, minWidth: 0 }}
              >
                <span className="material-symbols-outlined text-sm">home</span>
                Về Trang Chủ
              </button>
              
              <button
                onClick={() => navigate('/member')}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-350 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-2xl flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                style={{ minHeight: 0, minWidth: 0 }}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Khu Vực Thành Viên
              </button>
            </div>
          </div>
        ) : (
          /* FORM STATE */
          <div className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Yêu Cầu Hỗ Trợ 1:1
              </h1>
              <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed">
                Điền đầy đủ thông tin bên dưới để kết nối nhanh với nhân viên hỗ trợ thông qua Zalo chat. Chúng tôi sẽ giải quyết vấn đề của bạn ngay lập tức.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/60 rounded-2xl text-xs text-rose-500 flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined text-base">error</span>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-slate-450">badge</span>
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-colors text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-slate-450">mail</span>
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-colors text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Phone Number (Zalo) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-base text-slate-450">call</span>
                    Số Zalo liên hệ
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0901234567"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-colors text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-base text-slate-450">description</span>
                  Mô tả vấn đề bạn gặp phải
                </label>
                <textarea
                  required
                  rows={4}
                  value={issue}
                  onChange={e => setIssue(e.target.value)}
                  placeholder="Hãy mô tả chi tiết lỗi, thắc mắc hoặc yêu cầu nâng cấp gói dịch vụ của bạn tại đây..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/80 transition-colors text-slate-800 dark:text-slate-100 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-2xl transition-colors"
                  style={{ minHeight: 0, minWidth: 0 }}
                >
                  Quay lại
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
                  style={{ minHeight: 0, minWidth: 0 }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang gửi yêu cầu...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">support_agent</span>
                      Gửi Yêu Cầu Hỗ Trợ
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportRequestPage;
