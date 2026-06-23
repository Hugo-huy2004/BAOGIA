import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

const QR_TYPES = [
  { id: "url",   icon: "link",           labelKey: "nfc.typeUrl",   color: "indigo" },
  { id: "vcard", icon: "contact_page",   labelKey: "nfc.typeVcard", color: "rose" },
  { id: "wifi",  icon: "wifi",           labelKey: "nfc.typeWifi",  color: "emerald" },
  { id: "text",  icon: "groups",         labelKey: "nfc.typeText",  color: "amber" },
];

const COLOR_MAP = {
  indigo:  { bg: "bg-indigo-500/10", border: "border-indigo-400/30", text: "text-indigo-500" },
  rose:    { bg: "bg-rose-500/10",   border: "border-rose-400/30",   text: "text-rose-500" },
  emerald: { bg: "bg-emerald-500/10",border: "border-emerald-400/30",text: "text-emerald-500" },
  amber:   { bg: "bg-amber-500/10",  border: "border-amber-400/30",  text: "text-amber-500" },
};

export default function MemberNfcTab({ bio, publicLink, showToast }) {
  const { t } = useTranslation();
  const qrRef = useRef(null);

  /* state */
  const [qrType, setQrType] = useState("url");
  
  // Specific data states
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiEnc,  setWifiEnc]  = useState("WPA");
  const [customText, setCustomText] = useState("");

  const getQRData = () => {
      switch(qrType) {
          case 'url': return publicLink;
          case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${bio?.displayName || ""}\nTEL:${bio?.phone || ""}\nURL:${publicLink}\nEND:VCARD`;
          case 'wifi': return `WIFI:T:${wifiEnc};S:${wifiSsid};P:${wifiPass};;`;
          case 'text': return customText || publicLink;
          default: return publicLink;
      }
  };

  const handleDownloadQR = () => {
    try {
      const svgElement = qrRef.current.querySelector("svg");
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);

      img.onload = () => {
        // High res download
        canvas.width = 1000;
        canvas.height = 1000;
        
        // Add white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add padding (10%)
        const padding = 100;
        ctx.drawImage(img, padding, padding, canvas.width - padding*2, canvas.height - padding*2);
        
        DOMURL.revokeObjectURL(url);
        
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_${qrType}_${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        if (showToast) showToast(t("utilities.qrCode.downloadSuccess", "Tải mã QR thành công!"), "success");
      };
      img.src = url;
    } catch (err) {
      if (showToast) showToast(t("utilities.qrCode.downloadError", "Lỗi khi tải mã QR."), "error");
    }
  };

  const activeColor = COLOR_MAP[QR_TYPES.find(t => t.id === qrType)?.color || "indigo"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* LEFT: Generator Form */}
        <div className="bg-white dark:bg-background rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/60 p-6 shadow-sm space-y-6">
          
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 block">{t("utilities.qrCode.selectType", "1. Chọn loại dữ liệu")}</label>
            <div className="grid grid-cols-2 gap-3">
              {QR_TYPES.map(tp => {
                const c = COLOR_MAP[tp.color];
                const active = qrType === tp.id;
                return (
                  <button key={tp.id} onClick={() => setQrType(tp.id)}
                    className={`flex flex-col items-center gap-2 p-3.5 rounded-lg border transition-all active:scale-95 text-center ${
                      active ? `${c.bg} ${c.border} ${c.text} font-extrabold shadow-sm` : "border-border/50 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    }`}>
                    <span className="material-symbols-outlined text-[22px]">{tp.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
                      {t(`memberPortal.utilitiesPage.${tp.labelKey}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3 block">{t("utilities.qrCode.configureContent", "2. Cấu hình nội dung")}</label>
            <div className="bg-zinc-50 dark:bg-zinc-900/40 p-5 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
              {qrType === "url" && (
                  <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-xs">public</span> {t("utilities.qrCode.profileUrlLabel", "URL HỒ SƠ CHÍNH")}</div>
                      <div className="px-4 py-3 bg-white dark:bg-background border border-zinc-200 dark:border-zinc-800 rounded-md text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono break-all select-all shadow-inner">{publicLink}</div>
                      <p className="text-[10px] text-zinc-500 mt-2">{t("utilities.qrCode.profileUrlDesc", "Quét mã sẽ mở ngay trang Bio của bạn.")}</p>
                  </div>
              )}
              
              {qrType === "vcard" && (
                  <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-xs">medical_information</span> {t("utilities.qrCode.iceContactLabel", "LIÊN HỆ KHẨN CẤP (ICE)")}</div>
                      <div className="grid grid-cols-2 gap-3 px-4 py-3 bg-white dark:bg-background border border-zinc-200 dark:border-zinc-800 rounded-md shadow-inner text-[11px]">
                          <div><span className="text-zinc-400 font-bold">{t("utilities.vcard.fields.firstName", "Họ tên")}:</span> <span className="font-black text-zinc-800 dark:text-zinc-200">{bio?.displayName || "—"}</span></div>
                          <div><span className="text-zinc-400 font-bold">{t("utilities.vcard.fields.phone", "SĐT")}:</span> <span className="font-black text-zinc-800 dark:text-zinc-200">{bio?.phone || "—"}</span></div>
                          <div className="col-span-2 truncate"><span className="text-zinc-400 font-bold">{t("utilities.vcard.fields.email", "Email")}:</span> <span className="font-black text-zinc-800 dark:text-zinc-200">{bio?.contactEmail || bio?.email || "—"}</span></div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">{t("utilities.qrCode.vcardDesc", "Quét mã sẽ mở màn hình tự động Thêm vào Danh bạ.")}</p>
                  </div>
              )}
              
              {qrType === "wifi" && (
                  <div className="space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-xs">router</span> {t("utilities.qrCode.wifiLabel", "CHIA SẺ WIFI HỌC NHÓM")}</div>
                      <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1.5">
                              <label className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">{t("utilities.qrCode.wifiSsidLabel", "SSID (Tên Mạng)")}</label>
                              <input value={wifiSsid} onChange={e => setWifiSsid(e.target.value)} placeholder="SSID..." className="w-full px-4 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-background text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow font-bold" />
                          </div>
                          <div className="space-y-1.5">
                              <label className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">{t("utilities.qrCode.wifiPasswordLabel", "Mật Khẩu")}</label>
                              <input value={wifiPass} onChange={e => setWifiPass(e.target.value)} placeholder="••••••••" type="password" className="w-full px-4 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-background text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-shadow font-bold" />
                          </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">{t("utilities.qrCode.wifiDesc", "Quét mã điện thoại sẽ tự động kết nối mạng WiFi này.")}</p>
                  </div>
              )}
              
              {qrType === "text" && (
                  <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5"><span className="material-symbols-outlined text-xs">edit_document</span> {t("utilities.qrCode.customTextLabel", "LINK NHÓM / TÀI LIỆU")}</div>
                      <textarea value={customText} onChange={e => setCustomText(e.target.value)} placeholder="..." rows={3} className="w-full px-4 py-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-background text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-shadow font-mono resize-none" />
                      <p className="text-[10px] text-zinc-500 mt-2">{t("utilities.qrCode.customTextDesc", "Quét mã sẽ sao chép hoặc hiển thị nội dung này.")}</p>
                  </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT: QR Display & Download */}
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-800/80 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={qrType}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotate: 5 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative"
              >
                <div ref={qrRef} className="bg-white p-6 rounded-xl shadow-xl border border-zinc-200">
                  <QRCodeSVG 
                      value={getQRData()} 
                      size={220} 
                      level="H" 
                      includeMargin={false}
                      fgColor="#18181b"
                  />
                </div>
                
                {/* Floating icon */}
                <div className={`absolute -bottom-4 -right-4 w-12 h-12 rounded-lg ${activeColor.bg} ${activeColor.text} ${activeColor.border} border shadow-lg flex items-center justify-center backdrop-blur-md`}>
                  <span className="material-symbols-outlined text-2xl">{QR_TYPES.find(t=>t.id===qrType)?.icon}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <button 
              onClick={handleDownloadQR}
              className={`mt-10 px-8 py-3.5 rounded-lg text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] flex items-center gap-2 bg-gradient-to-r hover:brightness-110
                ${qrType === 'url' ? 'from-indigo-500 to-purple-600 shadow-indigo-500/25' : ''}
                ${qrType === 'vcard' ? 'from-rose-500 to-pink-600 shadow-rose-500/25' : ''}
                ${qrType === 'wifi' ? 'from-emerald-500 to-teal-500 shadow-emerald-500/25' : ''}
                ${qrType === 'text' ? 'from-amber-500 to-orange-500 shadow-amber-500/25' : ''}
              `}
            >
              <span className="material-symbols-outlined text-lg">download</span>
              {t("utilities.qrCode.downloadBtn", "Tải Mã QR Về Máy")}
            </button>
        </div>

      </div>
    </div>
  );
}
