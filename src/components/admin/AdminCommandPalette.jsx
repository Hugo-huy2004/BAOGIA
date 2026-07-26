import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function AdminCommandPalette({ isOpen, onClose, onExecuteCommand, onNavigateTab, users = [] }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onOpen?.();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(u => 
    (u.displayName || "").toLowerCase().includes(query.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const QUICK_COMMANDS = [
    { label: "Bật/Tắt Chế độ bảo trì hệ thống", icon: "construction", action: () => onExecuteCommand?.("bật bảo trì") },
    { label: "Dọn dẹp toàn bộ Error Logs rác", icon: "cleaning_services", action: () => onExecuteCommand?.("/clean-logs") },
    { label: "Nạp 1000 JOY cho người dùng", icon: "payments", action: () => onExecuteCommand?.("nạp 1000 joy") },
    { label: "Khóa khẩn cấp toàn bộ hệ thống", icon: "lock", action: () => onExecuteCommand?.("/lock") },
    { label: "Xem báo cáo chỉ số hệ thống", icon: "analytics", action: () => onExecuteCommand?.("/stats") },
  ].filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const TAB_NAVIGATIONS = [
    { label: "Đi tới Control Hub & AI Terminal", icon: "dashboard", tab: "dashboard" },
    { label: "Đi tới Quản lý Thành Viên & Support", icon: "group", tab: "users" },
    { label: "Đi tới Cửa Hàng & Dịch Vụ VIP", icon: "storefront", tab: "ecosystem" },
    { label: "Đi tới HugoCoder Portal", icon: "school", tab: "coder" },
    { label: "Đi tới Giám Sát & Cài Đặt Hệ Thống", icon: "tune", tab: "system" },
  ].filter(t => t.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-20 px-4 animate-fadeIn select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-2xl transition-opacity" 
        onClick={onClose} 
      />

      {/* Palette Container - macOS Spotlight Window */}
      <div className="relative w-full max-w-xl bg-[#1c1c1e]/90 border border-white/15 rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.7)] overflow-hidden backdrop-blur-3xl text-white z-10 animate-toast-in">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-white/10 gap-3.5">
          <span className="material-symbols-outlined text-blue-400 text-2xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập lệnh AI hoặc tìm người dùng (Ví dụ: nạp 1000 joy, dọn log, tên user)..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none font-semibold"
          />
          <kbd className="hidden sm:inline-block px-2.5 py-1 text-[10px] font-mono font-black text-slate-400 bg-white/10 rounded-xl border border-white/10 shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-4 font-sans scrollbar-thin">
          
          {/* Quick AI Commands Section */}
          {QUICK_COMMANDS.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-3 mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-amber-400">bolt</span>
                LỆNH THIẾT YẾU SIÊU TỐC
              </div>
              <div className="space-y-1">
                {QUICK_COMMANDS.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => { cmd.action(); onClose(); }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-xs font-bold transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-indigo-400 group-hover:scale-110 transition-transform">
                        {cmd.icon}
                      </span>
                      <span>{cmd.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      Chạy ↵
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User Search Section */}
          {filteredUsers.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-3 mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-indigo-400">person_search</span>
                KẾT QUẢ THÀNH VIÊN ({filteredUsers.length})
              </div>
              <div className="space-y-1">
                {filteredUsers.map((user) => (
                  <button
                    key={user._id || user.email}
                    onClick={() => { 
                      onNavigateTab?.("users"); 
                      onClose(); 
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-xs font-bold transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-[10px] shrink-0">
                        {(user.displayName || user.email || "HG")[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-white font-bold">{user.displayName || "Thành viên Hugo"}</span>
                        <span className="text-[10px] text-zinc-400 truncate">{user.email}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                      Xem chi tiết ↵
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Section */}
          {TAB_NAVIGATIONS.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-3 mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-emerald-400">near_me</span>
                CHUYỂN HUB ĐIỀU HÀNH
              </div>
              <div className="space-y-1">
                {TAB_NAVIGATIONS.map((nav, idx) => (
                  <button
                    key={idx}
                    onClick={() => { onNavigateTab?.(nav.tab); onClose(); }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-xs font-bold transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-emerald-400 group-hover:scale-110 transition-transform">
                        {nav.icon}
                      </span>
                      <span>{nav.label}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      Mở ↵
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-black/40 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
          <span>Hệ thống nhận diện lệnh tự động Hugo AI</span>
          <span>Bấm ESC để đóng</span>
        </div>
      </div>
    </div>
  );
}
