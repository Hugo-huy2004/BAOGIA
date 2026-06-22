import React from "react";

export default function PreviewSimulator({
  previewMode,
  setPreviewMode,
  previewIframeRef,
  slug,
  t
}) {
  return (
    <div className="lg:col-span-5 lg:sticky lg:top-6 flex flex-col items-center space-y-3 sm:space-y-4 w-full">
      <div className="flex items-center gap-2 sm:gap-3 w-full justify-center sm:justify-start">
        <span className="text-[8px] sm:text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">
          {t("memberPortal.preview.livePreview")}
        </span>
        <div className="flex bg-[#767680]/10 dark:bg-[#767680]/20 p-0.5 rounded-full border border-zinc-200/10 dark:border-zinc-800/10 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]">
          <button
            type="button"
            onClick={() => setPreviewMode("mobile")}
            className={`px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 sm:gap-1 transition-all ${
              previewMode === "mobile"
                ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm"
                : "text-zinc-500"
            }`}
          >
            <span className="material-symbols-outlined text-xs">phone_iphone</span>
            <span className="hidden sm:inline">Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("desktop")}
            className={`px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 sm:gap-1 transition-all ${
              previewMode === "desktop"
                ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm"
                : "text-zinc-500"
            }`}
          >
            <span className="material-symbols-outlined text-xs">laptop</span>
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>
      </div>

      {/* Dynamic device simulator viewport */}
      <div
        className={`transition-all duration-300 w-full flex justify-center ${
          previewMode === "mobile" ? "max-w-[280px] sm:max-w-[295px]" : "max-w-[440px]"
        }`}
      >
        <div
          className={`${
            previewMode === "mobile"
              ? "w-[280px] sm:w-[295px] h-[580px] sm:h-[610px] rounded-[2.5rem] sm:rounded-[3rem] border-[6px] sm:border-[8px] border-zinc-950 dark:border-zinc-800 bg-black shadow-2xl p-1.5 sm:p-2 relative flex flex-col justify-between"
              : "w-full h-[580px] sm:h-[610px] rounded-lg sm:rounded-xl border-2 sm:border-4 border-zinc-200 dark:border-zinc-800 bg-background dark:bg-zinc-950 shadow-2xl p-0.5 sm:p-1 relative flex flex-col justify-between"
          }`}
        >
          {/* Dynamic Island for mobile preview */}
          {previewMode === "mobile" && (
            <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-3 sm:h-4 bg-black rounded-full z-30 flex items-center justify-center shadow-inner" />
          )}

          <div className="w-full h-full rounded-[1.8rem] sm:rounded-[2.3rem] overflow-hidden bg-white dark:bg-background relative flex flex-col border border-zinc-900/10 dark:border-zinc-800/10">
            {/* Simulated Safari URL Bar */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/60 px-3 py-2 flex items-center justify-between text-[9px] text-zinc-450 select-none shrink-0">
              <div className="flex gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              </div>
              <div className="bg-white dark:bg-black px-2.5 py-0.5 rounded-full border border-zinc-200/40 dark:border-zinc-800/60 truncate max-w-[150px] text-[8px] font-mono">
                {slug ? `bio.hugostudio.vn/${slug}` : "chua-kich-hoat-slug"}
              </div>
              <span className="material-symbols-outlined text-[10px]">refresh</span>
            </div>

            {/* Simulator Screen Content */}
            <div className="flex-1 relative overflow-hidden bg-black">
              <iframe
                ref={previewIframeRef}
                src="/preview?v=2"
                className="w-full h-full border-none"
                title="Live Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
