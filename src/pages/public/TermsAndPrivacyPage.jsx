import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TermsAndPrivacyPage() {
  const [activeSection, setActiveSection] = useState('terms');

  return (
    <div className="min-h-screen bg-[#0a0c16] text-white select-none py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Back Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-2xl border border-white/10"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span> Trở về Trang Chủ
          </Link>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Hugo Studio Official Policy
          </span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            ĐIỀU KHOẢN DỊCH VỤ & BẢO MẬT VÍ JOY
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Quy định pháp lý, điều khoản sử dụng hệ sinh thái điểm thưởng JOY, chính sách chống gian lận và cam kết bảo vệ dữ liệu cá nhân tại Hugo Studio.
          </p>
        </div>

        {/* Section Switches */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveSection('terms')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSection === 'terms' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">monetization_on</span> Điều khoản Ví JOY
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSection === 'security' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">shield</span> Quy định An ninh & Chống gian lận
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSection === 'privacy' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">lock</span> Bảo vệ Dữ liệu Cá nhân
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-8 rounded-3xl bg-[#121524] border border-white/10 shadow-2xl space-y-8 text-sm leading-relaxed text-slate-300">
          
          {activeSection === 'terms' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-black text-amber-400 flex items-center gap-2">
                <span className="material-symbols-outlined">gavel</span> CHÍNH SÁCH VÀ ĐIỀU KHOẢN VÍ JOY
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">1. Quy định về Điểm thưởng JOY</h3>
                <p>
                  JOY là hệ thống điểm thưởng nội bộ được cấp cho thành viên hợp lệ tham gia vào các ứng dụng trong hệ sinh thái Hugo Studio. Bạn có thể tích lũy JOY thông qua:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-xs">
                  <li>Điểm danh hàng ngày & hoàn thành các chặng bài học Web Dev / Study with Hugo.</li>
                  <li>Thi đấu cờ vua, chinh phục kỷ lục HugoArcade và tập trung năng suất với HugoAura.</li>
                  <li>Giới thiệu người dùng mới tham gia hệ thống.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">2. Hạn mức và Giao dịch chuyển JOY</h3>
                <p>
                  Để đảm bảo an toàn tài chính và phòng chống các hành vi trục lợi, mọi giao dịch chuyển JOY giữa các người dùng đều áp dụng hạn mức ngày (`joySentToday`). Giao dịch qua mã QR code được bảo vệ bằng chữ ký mật mã HMAC thời gian thực.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-black text-blue-400 flex items-center gap-2">
                <span className="material-symbols-outlined">verified_user</span> QUY ĐỊNH AN NINH & CHỐNG GIAN LẬN
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">1. Giám sát tự động (Security Audit Engine)</h3>
                <p>
                  Hệ thống sử dụng cơ chế giám sát an ninh đa lớp (`SecurityEvent`, Geolocation Anomaly Guard, Rate Limiter) để tự động phát hiện và ngăn chặn các hành vi tấn công DDoS, quét tự động, giả mạo IP hoặc can thiệp dữ liệu ví.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">2. Xử lý vi phạm</h3>
                <p>
                  Bất kỳ tài khoản nào vi phạm sẽ bị áp dụng các biện pháp cưỡng chế:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-xs">
                  <li>Tự động thu hồi phiên làm việc và yêu cầu xác thực lại.</li>
                  <li>Khóa tính năng ví JOY hoặc khóa tài khoản vĩnh viễn đối với hành vi nghiêm trọng.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-black text-purple-400 flex items-center gap-2">
                <span className="material-symbols-outlined">lock</span> CHÍNH SÁCH BẢO VỆ DỮ LIỆU CÁ NHÂN
              </h2>
              
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">1. Tuân thủ Nghị định 13/2023/NĐ-CP</h3>
                <p>
                  Chúng tôi cam kết bảo vệ dữ liệu cá nhân của người dùng. Các thông tin thu thập (Email, Tên hiển thị, Số điện thoại) chỉ được sử dụng cho mục đích duy trì dịch vụ và tăng cường bảo mật.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500">
          © 2026 Hugo Studio. All rights reserved.
        </div>

      </div>
    </div>
  );
}
