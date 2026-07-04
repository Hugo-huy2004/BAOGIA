import React from "react";
import { useTranslation } from "react-i18next";
import { useArcadeSound } from "../../hooks/useArcadeSound";

export default function QuickWidgetGrid({ navigate, publicLink, formData }) {
  const { t } = useTranslation();
  const { playBeep } = useArcadeSound();

  const handleLinkClick = (url) => {
    playBeep();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const activeThemeName = (formData?.theme?.template || "Classic").toUpperCase();

  // Color mappings based on active theme to display a customized theme aura bulb
  const getThemeAuraGlow = () => {
    switch (activeThemeName) {
      case "BRUTALISM":
        return "from-[#ff2d55] to-[#ff9500] shadow-md shadow-red-500/10";
      case "LUXURY":
        return "from-[#d97706] to-[#f59e0b] shadow-md shadow-amber-500/10";
      case "NEO":
        return "from-[#af52de] to-[#ff2d55] shadow-md shadow-purple-500/10";
      default:
        return "from-[#0071e3] to-[#5856d6] shadow-md shadow-blue-500/10";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10.5px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Tổng quan Hồ sơ Bio
        </h3>
      </div>

      {/* Bento Grid layout matching premium Hugo Studio style */}
      <div className="grid grid-cols-2 gap-4.5">
        
        {/* Card 1: Giao diện & Aura (col-span-1) */}
        <div className="relative overflow-hidden rounded-[24px] p-5 bg-[#0d0e1a]/95 dark:bg-[#0c0d14]/95 border border-white/10 dark:border-zinc-800/60 shadow-lg flex flex-col justify-between items-start min-h-[140px] hover:scale-[1.01] transition-transform duration-300">
          {/* Accent glow */}
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-purple-500/10 rounded-full filter blur-2xl pointer-events-none" />
          
          <div className="w-full flex justify-between items-center z-10">
            <span className="inline-block text-[8px] font-black tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/10 uppercase">
              Thiết kế
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
              <span className="material-symbols-outlined text-[17px]">palette</span>
            </div>
          </div>

          <div className="w-full z-10 space-y-2 mt-4">
            <div className="flex items-center gap-3">
              {/* Dynamic glowing aura bulb */}
              <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${getThemeAuraGlow()} animate-pulse shrink-0 border border-white/10`} />
              <div>
                <p className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 font-mono tracking-wider">AURA ACTIVE</p>
                <h4 className="text-[13px] font-black text-white leading-none tracking-tight">{activeThemeName}</h4>
              </div>
            </div>
            <p className="text-[9px] text-zinc-400 font-bold leading-normal truncate">Chủ đề hiển thị công khai</p>
          </div>
        </div>

        {/* Card 2: Quét Bio / QR Code (col-span-1) */}
        <div className="relative overflow-hidden rounded-[24px] p-5 bg-[#0d0e1a]/95 dark:bg-[#0c0d14]/95 border border-white/10 dark:border-zinc-800/60 shadow-lg flex flex-col justify-between items-start min-h-[140px] hover:scale-[1.01] transition-transform duration-300">
          {/* Accent glow */}
          <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-cyan-500/10 rounded-full filter blur-2xl pointer-events-none" />

          <div className="w-full flex justify-between items-center z-10">
            <span className="inline-block text-[8px] font-black tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/10 uppercase">
              Chia sẻ
            </span>
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined text-[17px]">qr_code_2</span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between gap-2 z-10 mt-4">
            <div className="text-left">
              <h4 className="text-[12px] font-black text-white leading-tight">Mã QR Bio</h4>
              <p className="text-[9px] text-zinc-400 font-bold mt-0.5 leading-normal">Quét nhanh liên kết</p>
            </div>

            {/* Embedded QR Code image */}
            {publicLink ? (
              <div className="w-11 h-11 bg-white rounded-lg p-0.5 shadow-md flex items-center justify-center shrink-0 border border-white/20 hover:scale-125 transition-transform duration-250 z-20">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100&data=${encodeURIComponent(publicLink)}`}
                  alt="QR"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm text-zinc-650">link_off</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Danh sách Liên kết (col-span-2) */}
        <div className="relative overflow-hidden rounded-[24px] p-5 bg-[#0d0e1a]/95 dark:bg-[#0c0d14]/95 border border-white/10 dark:border-zinc-800/60 shadow-lg flex flex-col justify-between items-start min-h-[120px] col-span-2">
          {/* Accent glow */}
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-2xl pointer-events-none" />

          <div className="w-full flex justify-between items-center z-10 border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[8px] font-black tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/10 uppercase">
                Liên kết
              </span>
              <h4 className="text-[12px] font-black text-white leading-tight">Danh sách mạng xã hội</h4>
            </div>
            <div className="w-7.5 h-7.5 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <span className="material-symbols-outlined text-[16px]">link</span>
            </div>
          </div>

          <div className="w-full z-10 mt-3.5">
            {formData?.links && formData.links.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {formData.links.map((lnk, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleLinkClick(lnk.url)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white transition-all active:scale-95 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[13px] text-zinc-400">arrow_right_alt</span>
                    <span>{lnk.label || "Liên kết"}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-400 font-bold py-2 leading-relaxed">
                Chưa cấu hình liên kết mạng xã hội. Hãy chuyển qua mục **Cài đặt** để thiết lập.
              </p>
            )}
          </div>
        </div>

        {/* Card 4: Dự án tiêu biểu (col-span-2) */}
        <div className="relative overflow-hidden rounded-[24px] p-5 bg-[#0d0e1a]/95 dark:bg-[#0c0d14]/95 border border-white/10 dark:border-zinc-800/60 shadow-lg flex flex-col justify-between items-start min-h-[120px] col-span-2">
          {/* Accent glow */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full filter blur-2xl pointer-events-none" />

          <div className="w-full flex justify-between items-center z-10 border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[8px] font-black tracking-wider px-2.5 py-0.5 rounded bg-white/10 text-white/90 border border-white/10 uppercase">
                Thành tựu
              </span>
              <h4 className="text-[12px] font-black text-white leading-tight">Dự án & Tác phẩm nổi bật</h4>
            </div>
            <div className="w-7.5 h-7.5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-[16px]">folder_special</span>
            </div>
          </div>

          <div className="w-full z-10 mt-3.5 space-y-2">
            {formData?.projects && formData.projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {formData.projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 border border-white/5 text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                      <span className="material-symbols-outlined text-sm">folder</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-bold text-white leading-tight truncate">{proj.title}</p>
                      <p className="text-[8.5px] text-zinc-500 font-semibold truncate mt-0.5 uppercase tracking-widest">{proj.category || "Dự án"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-zinc-400 font-bold py-2 leading-relaxed">
                Chưa cấu hình dự án nổi bật. Hãy chuyển qua mục **Cài đặt** để thiết lập.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
