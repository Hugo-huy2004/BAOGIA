import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import SubUtilityHeader from "./SubUtilityHeader";

export default function MemberVCardTab({ bio, showToast, getApiUrl, onBack }) {
  const { t } = useTranslation();
  const qrRef = useRef(null);

  const publicLink = typeof window !== "undefined" ? window.location.origin + "/" + (bio?.slug || "") : "";
  const vcardDownloadUrl = `${getApiUrl()}/vcard/${bio?.slug}`;

  // The offline vCard content embedded in the QR Code
  const vcardData = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${bio?.displayName || ""}`,
    bio?.phone ? `TEL:${bio.phone}` : "",
    bio?.contactEmail || bio?.email ? `EMAIL:${bio?.contactEmail || bio?.email}` : "",
    bio?.jobTitle ? `TITLE:${bio.jobTitle}` : "",
    `URL:${publicLink}`,
    "END:VCARD"
  ].filter(Boolean).join("\n");

  const copyVcardLink = () => {
    navigator.clipboard.writeText(vcardDownloadUrl);
    if (showToast) {
      showToast(t("memberPortal.utilitiesPage.vcard.toastCopySuccess") || "Đã sao chép liên kết!", "success");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Danh bạ của ${bio?.displayName || "tôi"}`,
          text: `Lưu nhanh danh bạ của ${bio?.displayName || "tôi"} vào điện thoại của bạn nhé!`,
          url: vcardDownloadUrl,
        });
        if (showToast) showToast("Đã mở giao diện chia sẻ!", "success");
      } catch (err) {
        console.log("Share cancelled or failed", err);
      }
    } else {
      copyVcardLink();
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
        canvas.width = 1000;
        canvas.height = 1000;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const padding = 100;
        ctx.drawImage(img, padding, padding, canvas.width - padding*2, canvas.height - padding*2);
        DOMURL.revokeObjectURL(url);
        
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `vCard_QR_${bio?.slug || "contact"}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        if (showToast) showToast("Tải mã QR thành công!", "success");
      };
      img.src = url;
    } catch (err) {
      if (showToast) showToast("Lỗi khi tải mã QR.", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-white dark:bg-background rounded-[2rem] p-6 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
      <SubUtilityHeader
        title={t("utilities.vcard.title", "Danh Bạ vCard Thông Minh")}
        icon="contact_phone"
        colorClass="text-accent"
        onBack={onBack}
      />
      
      {/* Header Info */}
      <div className="text-center space-y-2 pt-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
          {t("utilities.vcard.desc", "Nhập thông tin của bạn để tạo file danh bạ vCard. Người dùng khác chỉ cần quét mã QR là có thể lưu thông tin liên hệ của bạn vào danh bạ điện thoại ngay lập tức.")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* LEFT: QR Code Display */}
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/20 rounded-[2rem] border border-dashed border-zinc-300 dark:border-zinc-800/80 min-h-[380px]">
          <div className="relative">
            <div ref={qrRef} className="bg-white p-5 rounded-xl shadow-xl border border-zinc-200">
              <QRCodeSVG 
                  value={vcardData} 
                  size={200} 
                  level="Q" 
                  includeMargin={false}
                  fgColor="#8b5cf6" // Accent (violet-500)
              />
            </div>
            
            {/* Floating icon */}
            <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-lg bg-accent text-white border-2 border-white shadow-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">contact_page</span>
            </div>
          </div>

          <button 
            onClick={handleDownloadQR}
            className="mt-10 px-8 py-3.5 rounded-lg text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-accent/25 transition-all active:scale-[0.98] flex items-center gap-2 bg-accent hover:brightness-110"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            {t("utilities.vcard.qrCodeTitle", "MÃ QR VCARD QUÉT OFFLINE")}
          </button>
        </div>

        {/* RIGHT: Action Tools */}
        <div className="bg-white dark:bg-background rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/60 p-6 shadow-sm flex flex-col justify-center space-y-6 min-h-[380px]">
          
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/80 rounded-lg space-y-2">
             <h4 className="text-xs font-black text-accent uppercase flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">info</span> {t("utilities.vcard.autoMechanism", "Cơ chế Tự Động")}</h4>
             <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
               {t("utilities.vcard.autoMechanismDesc", "Vì lý do bảo mật của iOS/Android, một trang web không thể ngầm tự động thêm số điện thoại vào danh bạ của người dùng nếu không có thao tác xác nhận. Mã QR này chứa gói lệnh VCF, khi camera nhận dạng được, nó sẽ tự động bật popup Lưu Danh Bạ để người dùng bấm Lưu là xong.")}
             </p>
          </div>

          <div className="space-y-4">
            <a
              href={vcardDownloadUrl}
              download
              className="w-full p-4 rounded-md bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-4 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">cloud_download</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-0.5">{t("utilities.vcard.downloadBtn", "Tải vCard (.vcf)")}</h4>
                <p className="text-[10px] text-zinc-500 font-medium">{t("utilities.vcard.downloadVcfDesc", "Tải file nén chuẩn VCF về thiết bị hiện tại.")}</p>
              </div>
            </a>

            <button
              onClick={handleShare}
              className="w-full p-4 rounded-md bg-accent/10 dark:bg-accent/5 hover:bg-accent/20 dark:hover:bg-accent/10 border border-accent/20 dark:border-accent/10 transition-colors flex items-center gap-4 group cursor-pointer text-left"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">{navigator.share ? "ios_share" : "content_copy"}</span>
              </div>
              <div className="flex-1">
                <h4 className="text-[11px] font-black text-accent uppercase tracking-wider mb-0.5">
                  {navigator.share ? t("utilities.vcard.shareBtn", "Chia sẻ qua App") : t("utilities.vcard.copyBtn", "Copy Link Trực Tuyến")}
                </h4>
                <p className="text-[10px] text-accent/70 font-medium">
                  {navigator.share ? t("utilities.vcard.shareDesc", "Gửi ngay danh bạ qua AirDrop, Zalo, SMS...") : t("utilities.vcard.copyDesc", "Sao chép link tải danh bạ trực tuyến.")}
                </p>
              </div>
            </button>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">{t("utilities.vcard.permalinkLabel", "Link Cố định")}</label>
            <div className="flex items-center gap-2 p-1.5 bg-zinc-50 dark:bg-[#1a1926]/40 border border-zinc-200/80 dark:border-zinc-800/80 rounded-md shadow-inner">
              <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate flex-1 px-3 py-1 font-bold">
                {vcardDownloadUrl}
              </div>
              <button
                onClick={copyVcardLink}
                className="px-4 py-2 rounded text-[9.5px] font-black uppercase bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                {t("utilities.secretLink.btnCopy", "Copy")}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
