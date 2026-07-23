import React, { useState } from "react";
import { ShieldCheck, Calendar, Users, MessageCircle, MapPin, Video, CheckCircle } from "lucide-react";

export default function CounselorBridge({ bio, onBookAppointment, showToast }) {
  const [method, setMethod] = useState("online_chat"); // 'online_chat' | 'google_meet' | 'offline'
  const [slot, setSlot] = useState("morning_tomorrow");
  const [counselor, setCounselor] = useState("auto");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [note, setNote] = useState("");
  const [booked, setBooked] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate a secure anonymous ticket ID
    const ticketId = "TKT-" + Math.floor(100000 + Math.random() * 900000);
    setTicketNumber(ticketId);

    const appointment = {
      ticketId,
      date: new Date().toISOString(),
      method,
      slot,
      counselor,
      isAnonymous,
      note,
      status: "pending_verification"
    };

    onBookAppointment?.(appointment);
    setBooked(true);
    showToast?.(`Đã gửi yêu cầu hẹn lịch thành công. Mã bảo mật của cậu là ${ticketId}`, "success");
  };

  const getMethodLabel = (id) => {
    if (id === "online_chat") return "Trò chuyện trực tuyến (Online Chat)";
    if (id === "google_meet") return "Gọi điện trực tuyến (Google Meet)";
    return "Gặp trực tiếp tại Phòng tham vấn học đường";
  };

  const getSlotLabel = (id) => {
    if (id === "morning_tomorrow") return "Sáng mai (8:00 - 11:30)";
    if (id === "afternoon_tomorrow") return "Chiều mai (13:30 - 17:00)";
    return "Sáng ngày kia (8:00 - 11:30)";
  };

  return (
    <div className="space-y-5 text-left max-w-md mx-auto bg-gradient-to-br from-zinc-950 via-slate-900 to-primary/20 text-zinc-100 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Not-yet-implemented banner */}
      <div className="relative z-10 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex gap-2">
        <span className="material-symbols-outlined text-amber-400 text-lg shrink-0">construction</span>
        <div>
          <p className="text-[10.5px] font-black text-amber-400 uppercase tracking-wide">Tính năng đang phát triển</p>
          <p className="text-[10px] text-zinc-300 font-bold leading-relaxed">
            Hệ thống đặt lịch tham vấn chuyên gia sẽ sớm ra mắt. Hiện tại, cậu có thể liên hệ trực tiếp qua mục Hỗ trợ.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b pb-2.5 border-zinc-800/60">
        <span className="text-[10px] font-black uppercase text-warning tracking-wider flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Đặt lịch tham vấn chuyên gia O2O
        </span>
        <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
          Bảo mật tuyệt đối
        </span>
      </div>

      {booked ? (
        <div className="py-8 text-center space-y-4 relative z-10 animate-scaleUp">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] font-black text-white">Yêu Cầu Lịch Hẹn Đã Được Gửi!</p>
            <p className="text-[10.5px] text-zinc-400 font-bold max-w-xs mx-auto leading-relaxed">
              Phòng tham vấn học đường đã ghi nhận yêu cầu của cậu. Chúng tớ sẽ gửi thông báo xác nhận lịch hẹn chính thức sớm nhất.
            </p>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-w-sm mx-auto text-left space-y-2 text-[10px] font-bold">
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span className="text-zinc-400">Mã yêu cầu bảo mật:</span>
              <span className="text-warning font-mono font-black">{ticketNumber}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1.5">
              <span className="text-zinc-400">Hình thức hỗ trợ:</span>
              <span className="text-white">{getMethodLabel(method)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Thời gian hẹn:</span>
              <span className="text-white">{getSlotLabel(slot)}</span>
            </div>
          </div>

          <button
            onClick={() => setBooked(false)}
            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all"
          >
            Đặt lịch mới
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[10.5px] font-black text-emerald-400 uppercase tracking-wide">Nguyên Tắc Bảo Mật Quyền Riêng Tư</p>
              <p className="text-[10px] text-zinc-300 font-bold leading-relaxed">
                Mọi thông tin tâm sự, đặt lịch tham vấn của cậu tại Bạn Học Đường đều được mã hóa ẩn danh. Chuyên gia sẽ chỉ liên hệ và hỗ trợ cậu dựa trên biệt danh học đường để bảo vệ an toàn danh tính của cậu.
              </p>
            </div>
          </div>

          {/* Support Method */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-400">1. Chọn hình thức tham vấn:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "online_chat", label: "Online Chat", icon: <MessageCircle className="w-4 h-4" /> },
                { id: "google_meet", label: "Google Meet", icon: <Video className="w-4 h-4" /> },
                { id: "offline", label: "Tại trường", icon: <MapPin className="w-4 h-4" /> }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMethod(item.id)}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[9px] font-black uppercase transition-all ${
                    method === item.id
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-inner"
                      : "border-white/5 text-zinc-400 bg-white/2 hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slot */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-zinc-400">2. Khung thời gian mong muốn:</label>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] text-zinc-100 focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
            >
              <option value="morning_tomorrow">Sáng mai (8:00 - 11:30)</option>
              <option value="afternoon_tomorrow">Chiều mai (13:30 - 17:00)</option>
              <option value="morning_next_day">Sáng ngày kia (8:00 - 11:30)</option>
            </select>
          </div>

          {/* Counselor */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-zinc-400">3. Chuyên gia hỗ trợ:</label>
            <select
              value={counselor}
              onChange={(e) => setCounselor(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] text-zinc-100 focus:outline-none focus:border-emerald-500 font-bold cursor-pointer"
            >
              <option value="auto">Hệ thống tự động điều phối (Nhanh nhất)</option>
              <option value="tri_counselor">Thầy Nguyễn Hữu Trí (Chuyên gia tư vấn học đường)</option>
              <option value="van_counselor">Cô Lê Thị Hồng Vân (Cố vấn sức khỏe tinh thần)</option>
            </select>
          </div>

          {/* Anonymous toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-white/2 border border-white/5 p-3 rounded-2xl">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="accent-emerald-500 rounded cursor-pointer w-4 h-4 shrink-0"
            />
            <div className="text-[10px] font-bold text-zinc-300 leading-normal">
              Giữ ẩn danh thông tin cá nhân (chỉ hiển thị biệt danh với chuyên gia hỗ trợ)
            </div>
          </label>

          {/* Message */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-zinc-400">4. Viết vài lời gửi chuyên gia (Không bắt buộc):</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Chia sẻ ngắn gọn áp lực hoặc khó khăn cậu đang gặp phải..."
              className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2 text-[10.5px] text-zinc-100 focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>

          {/* Encrypted Clinical Brief Generator */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                const brief = `=== HỒ SƠ TÓM TẮT LÂM SÀNG BẢO MẬT (HUGOPSY CLINICAL BRIEF) ===\n` +
                  `Mã định danh: HPSY-${Math.floor(100000 + Math.random() * 900000)}\n` +
                  `Biệt danh: ${bio?.nickname || bio?.name || "Thành viên ẩn danh"}\n` +
                  `Thời gian xuất: ${new Date().toLocaleString("vi-VN")}\n` +
                  `Đánh giá tổng quan: Tình trạng cần được tham vấn & lắng nghe từ chuyên gia.\n` +
                  `Ghi chú thành viên: ${note || "Không có ghi chú thêm."}\n` +
                  `=============================================================`;
                navigator.clipboard.writeText(brief);
                showToast?.("Đã sao chép Hồ Sơ Lâm Sàng Mã Hóa vào clipboard!", "success");
              }}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-indigo-300 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 mb-2"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Xuất Hồ Sơ Tóm Tắt Lâm Sàng Mã Hóa</span>
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-4 h-4" /> Đăng ký lịch hẹn tham vấn
          </button>
        </form>
      )}
    </div>
  );
}
