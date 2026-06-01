import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import HugoLogo from "../HugoLogo";

export default function MemberNfcTab({ bio, publicLink, showToast }) {
  const { t } = useTranslation();
  const [writeStatus, setWriteStatus] = useState("idle"); // idle, scanning, success, error
  const [nfcError, setNfcError] = useState("");
  const [nfcSupported, setNfcSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setNfcSupported(true);
    }
  }, []);

  const handleWriteNfc = async () => {
    if (!nfcSupported) {
      setWriteStatus("error");
      setNfcError(t("memberPortal.utilitiesPage.nfc.toastUnsupported") || "Web NFC is not supported on this browser/device.");
      return;
    }

    try {
      setWriteStatus("scanning");
      setNfcError("");
      const ndef = new window.NDEFReader();
      
      // Start writing
      await ndef.write({
        records: [{ recordType: "url", data: publicLink }]
      });
      
      setWriteStatus("success");
      if (showToast) {
        showToast(t("memberPortal.utilitiesPage.nfc.success"), "success");
      }
    } catch (err) {
      console.error("NFC Write Error:", err);
      setWriteStatus("error");
      setNfcError(err.message || t("memberPortal.utilitiesPage.nfc.retry"));
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    if (showToast) {
      showToast(t("memberPortal.utilitiesPage.vcard.toastCopySuccess"), "success");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start animate-fadeIn">
      {/* NFC Mockup Preview (Left side) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500 text-sm">credit_card</span>
              {t("memberPortal.utilitiesPage.nfc.simTitle")}
            </h3>
            <p className="text-[10px] text-zinc-400">{t("memberPortal.utilitiesPage.nfc.simDesc")}</p>
          </div>

          {/* 3D Glassmorphism Premium Luxury Metal Card */}
          <div className="relative w-full aspect-[1.586/1] rounded-[24px] p-6 text-white overflow-hidden shadow-2xl select-none group transition-all duration-750 hover:scale-[1.03] border border-amber-500/20 active:rotate-1"
               style={{
                 background: "linear-gradient(135deg, #111019 0%, #06050a 60%, #151322 100%)",
                 boxShadow: "0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 2px rgba(255,255,255,0.05), inset 0 -1px 2px rgba(0,0,0,0.4)"
               }}>
            
            {/* Glossy sweep reflection line across the card */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine pointer-events-none" />

            {/* Glowing gold background highlights */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />
            
            {/* Fine golden frame outline inside the card */}
            <div className="absolute inset-2.5 rounded-[16px] border border-amber-500/10 pointer-events-none" />

            {/* Top row: Brand & Contactless */}
            <div className="flex justify-between items-start relative z-10 px-1 pt-1">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-black text-[15px] tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    HUGO
                  </span>
                  <span className="font-light text-[15px] text-zinc-300">STUDIO</span>
                </div>
                <span className="text-[5.5px] uppercase tracking-[0.4em] font-black text-amber-500/60 font-sans">Digital Identity Card</span>
              </div>
              <span className="material-symbols-outlined text-amber-500/80 text-xl font-bold animate-pulse">contactless</span>
            </div>

            {/* Middle: Realistic Gold EMV Smart Chip */}
            <div className="absolute top-[42%] left-[8%] -translate-y-1/2 w-9 h-7 rounded-[5px] bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 p-[1px] shadow-md shadow-black/40 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full rounded-[4px] bg-gradient-to-br from-amber-400 to-amber-600 relative flex flex-wrap justify-between p-[2px]">
                {/* Microchip line textures */}
                <div className="w-[45%] h-[30%] border-r border-b border-amber-200/50" />
                <div className="w-[45%] h-[30%] border-l border-b border-amber-200/50" />
                <div className="w-[45%] h-[35%] border-r border-t border-b border-amber-200/50" />
                <div className="w-[45%] h-[35%] border-l border-t border-b border-amber-200/50" />
                <div className="w-[45%] h-[25%] border-r border-t border-amber-200/50" />
                <div className="w-[45%] h-[25%] border-l border-t border-amber-200/50" />
                {/* Center contact circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-sm bg-amber-300/80 border border-amber-600/30" />
              </div>
            </div>

            {/* Bottom Row: Name & Smart QR */}
            <div className="flex justify-between items-end mt-auto h-[55%] relative z-10 px-1 pb-1">
              <div className="space-y-1">
                <div className="text-[5.5px] font-black uppercase text-amber-500/40 tracking-[0.2em]">{t("memberPortal.bio.fullName")}</div>
                <div className="text-[12.5px] font-bold tracking-[0.2em] uppercase font-sans bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200 bg-clip-text text-transparent truncate max-w-[170px] drop-shadow-md">
                  {bio?.displayName || "HUGO MEMBER"}
                </div>
              </div>

              {/* Minimal Premium QR Code Wrapper with Golden Border */}
              <div className="bg-white p-1.5 rounded-[12px] border border-amber-500/40 flex items-center justify-center shrink-0 w-16 h-16 shadow-xl shadow-black/50 transition-all duration-300 group-hover:border-amber-400">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicLink)}`} 
                  alt="QR Link" 
                  className="w-full h-full object-contain rounded-[6px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NFC Action Configurator (Right side) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Direct Web NFC Config */}
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-sm">sensors</span>
              {t("memberPortal.utilitiesPage.nfc.writeDirect")}
            </h3>
            <p className="text-[10px] text-zinc-400">{t("memberPortal.utilitiesPage.nfc.writeDirectDesc")}</p>
          </div>

          <div className="p-4 bg-zinc-50 dark:bg-[#191723]/30 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 space-y-4">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.utilitiesPage.nfc.writeLink")}</div>
                <div className="text-xs font-bold text-indigo-500 font-mono break-all mt-0.5 select-all">{publicLink}</div>
              </div>
              <button 
                onClick={copyLink}
                className="px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase bg-zinc-200/60 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 tracking-wider transition-all active:scale-95 flex items-center gap-1 shrink-0"
              >
                <span className="material-symbols-outlined text-xs">content_copy</span>{t("memberPortal.utilitiesPage.vcard.copyBtn")}
              </button>
            </div>

            {writeStatus === "idle" && (
              <button
                type="button"
                onClick={handleWriteNfc}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">sensors</span>
                {t("memberPortal.utilitiesPage.nfc.writeBtn")}
              </button>
            )}

            {writeStatus === "scanning" && (
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-400/20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-indigo-500 animate-pulse">{t("memberPortal.utilitiesPage.nfc.scanning")}</p>
                <button
                  onClick={() => setWriteStatus("idle")}
                  className="px-3 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-[9px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
                >
                  {t("memberPortal.utilitiesPage.nfc.cancel")}
                </button>
              </div>
            )}

            {writeStatus === "success" && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-center space-y-2">
                <span className="material-symbols-outlined text-2xl text-emerald-500">check_circle</span>
                <p className="text-xs font-bold text-emerald-500">{t("memberPortal.utilitiesPage.nfc.success")}</p>
                <button
                  onClick={() => setWriteStatus("idle")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[9.5px] font-bold text-white uppercase tracking-wider transition-all"
                >
                  {t("memberPortal.utilitiesPage.nfc.writeOther")}
                </button>
              </div>
            )}

            {writeStatus === "error" && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-400/20 text-center space-y-2.5">
                <span className="material-symbols-outlined text-2xl text-rose-500">error</span>
                <p className="text-xs font-bold text-rose-500">{nfcError}</p>
                <button
                  onClick={() => setWriteStatus("idle")}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-[9.5px] font-bold text-white uppercase tracking-wider transition-all"
                >
                  {t("memberPortal.utilitiesPage.nfc.retry")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Alternate App Method Step-by-Step Instructions */}
        <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-sm">menu_book</span>
              {t("memberPortal.utilitiesPage.nfc.guideTitle")}
            </h3>
            <p className="text-[10px] text-zinc-400">{t("memberPortal.utilitiesPage.nfc.guideDesc")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50/50 dark:bg-[#181622]/40 border border-zinc-200/40 dark:border-zinc-800/80 rounded-2xl space-y-2 hover:scale-[1.01] transition-transform">
              <div className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold text-xs flex items-center justify-center">1</div>
              <h4 className="font-bold text-xs text-zinc-800 dark:text-white">{t("memberPortal.utilitiesPage.nfc.step1Title")}</h4>
              <p className="text-[9.5px] text-zinc-500 leading-relaxed">{t("memberPortal.utilitiesPage.nfc.step1Desc")}</p>
            </div>

            <div className="p-4 bg-zinc-50/50 dark:bg-[#181622]/40 border border-zinc-200/40 dark:border-zinc-800/80 rounded-2xl space-y-2 hover:scale-[1.01] transition-transform">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center">2</div>
              <h4 className="font-bold text-xs text-zinc-800 dark:text-white">{t("memberPortal.utilitiesPage.nfc.step2Title")}</h4>
              <p className="text-[9.5px] text-zinc-500 leading-relaxed">{t("memberPortal.utilitiesPage.nfc.step2Desc")}</p>
            </div>

            <div className="p-4 bg-zinc-50/50 dark:bg-[#181622]/40 border border-zinc-200/40 dark:border-zinc-800/80 rounded-2xl space-y-2 hover:scale-[1.01] transition-transform">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">3</div>
              <h4 className="font-bold text-xs text-zinc-800 dark:text-white">{t("memberPortal.utilitiesPage.nfc.step3Title")}</h4>
              <p className="text-[9.5px] text-zinc-500 leading-relaxed">{t("memberPortal.utilitiesPage.nfc.step3Desc")}</p>
            </div>

            <div className="p-4 bg-zinc-50/50 dark:bg-[#181622]/40 border border-zinc-200/40 dark:border-zinc-800/80 rounded-2xl space-y-2 hover:scale-[1.01] transition-transform">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">4</div>
              <h4 className="font-bold text-xs text-zinc-800 dark:text-white">{t("memberPortal.utilitiesPage.nfc.step4Title")}</h4>
              <p className="text-[9.5px] text-zinc-500 leading-relaxed">{t("memberPortal.utilitiesPage.nfc.step4Desc")}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
