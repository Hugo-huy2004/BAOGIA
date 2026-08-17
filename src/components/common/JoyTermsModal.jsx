export default function JoyTermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#10121e] text-white w-full max-w-3xl max-h-[85vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-amber-900/20 via-blue-900/20 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">gavel</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-white">ĐIỀU KHOẢN VÀ QUY ĐỊNH VÍ JOY</h3>
              <p className="text-xs text-slate-400">Chính sách sử dụng, điểm thưởng và an toàn bảo mật hệ sinh thái JOY</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6 text-xs leading-relaxed text-slate-300">
          
          <section className="space-y-2">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">monetization_on</span> 1. Bản chất và Quyền sở hữu Điểm JOY
            </h4>
            <p>
              Điểm JOY là đơn vị ghi nhận phần thưởng nội bộ thuộc hệ sinh thái Hugo Studio. Điểm JOY được cấp thông qua các hoạt động tương tác hợp lệ (Điểm danh, Cờ vua, Tập trung HugoAura, HugoArcade, Giới thiệu bạn bè).
            </p>
            <p>
              Điểm JOY <strong>không phải là tiền tệ pháp định</strong>, không có giá trị quy đổi trực tiếp ra tiền mặt ngoại trừ các chương trình ưu đãi, đổi quà hoặc giảm giá dịch vụ chính thức do Ban Quản Trị công bố.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">shield_lock</span> 2. Chống Gian Lận & Siêu Bảo Mật (Anti-Fraud Policy)
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mọi hành vi sử dụng Bot, Script, giả lập Geolocation, hoặc can thiệp vào Client SDK đều bị hệ thống tự động ghi vết (`SecurityEvent`).</li>
              <li>Mã QR thanh toán và chuyển JOY được ký số mật mã HMAC (Server-side signed token). Client tuyệt đối không tự tạo hoặc giải mã payload QR.</li>
              <li>Hệ thống áp dụng hạn mức chuyển JOY theo ngày (`joySentToday`) nhằm ngăn ngừa hành vi rửa điểm hoặc phát tán bất hợp pháp.</li>
              <li>Trường hợp phát hiện gian lận, Ban Quản Trị có quyền khóa tài khoản tạm thời hoặc vĩnh viễn và hủy bỏ toàn bộ số dư JOY vi phạm.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">verified_user</span> 3. Bảo vệ Dữ liệu Cá nhân & Quyền Riêng Tư
            </h4>
            <p>
              Hệ thống tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Các thông tin định danh (Email, Tên, Ngày sinh, Vị trí tin cậy) được mã hóa an toàn và chỉ sử dụng cho mục đích xác thực và bảo mật tài khoản.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">sync</span> 4. Điều chỉnh và Cập nhật Quy định
            </h4>
            <p>
              Ban Quản Trị có quyền điều chỉnh tỷ lệ tích lũy JOY, hạn mức giao dịch và điều khoản sử dụng vào bất kỳ lúc nào để đảm bảo tính ổn định và an toàn cho toàn bộ cộng đồng.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0a0b14] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black transition-all"
          >
            Đã Hiểu và Đồng Ý
          </button>
        </div>

      </div>
    </div>
  );
}
