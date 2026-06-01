import React from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

export default function MemberVCardTab({ bio, showToast, onBack, getApiUrl }) {
  const { t } = useTranslation();

  const vcardDownloadUrl = `${getApiUrl()}/vcard/${bio?.slug}`;

  const copyVcardLink = () => {
    navigator.clipboard.writeText(vcardDownloadUrl);
    if (showToast) {
      showToast(t("memberPortal.utilitiesPage.vcard.toastCopySuccess"), "success");
    }
  };

  const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-6">
      <SubUtilityHeader
        title={t("memberPortal.utilitiesPage.vcard.title")}
        icon="contact_phone"
        colorClass="text-rose-500"
        onBack={onBack}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Profile Card Mockup */}
        <div className="md:col-span-5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 text-center flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-rose-500 shadow-lg bg-zinc-950">
              {bio?.avatarUrl ? (
                <img src={bio.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-rose-500 font-black text-xl">
                  {bio?.displayName?.charAt(0)}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-100">{bio?.displayName}</h4>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">{bio?.jobTitle || t("memberPortal.utilitiesPage.vcard.defaultJobTitle") || "Hugo Studio Member"}</p>
            </div>

            <div className="pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50 space-y-2 text-left">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="material-symbols-outlined text-xs">phone</span>
                <span>{bio?.phone || t("memberPortal.utilitiesPage.vcard.noPhone") || "No phone number"}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="material-symbols-outlined text-xs">mail</span>
                <span className="truncate">{bio?.contactEmail || bio?.email}</span>
              </div>
            </div>
          </div>

          {isMobile ? (
            <a
              href={vcardDownloadUrl}
              download
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black text-[11.5px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 animate-pulse"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              {t("memberPortal.utilitiesPage.vcard.mobileSaveBtn")}
            </a>
          ) : (
            <a
              href={vcardDownloadUrl}
              download
              className="w-full py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-xs">download</span>
              {t("memberPortal.utilitiesPage.vcard.desktopDownloadBtn")}
            </a>
          )}
        </div>

        {/* Right: QR + Public Link */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          {isMobile ? (
            <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">phone_iphone</span>
                {t("memberPortal.utilitiesPage.vcard.mobileInstructionTitle")}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {t("memberPortal.utilitiesPage.vcard.mobileInstructionDesc")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center p-6 bg-zinc-50 dark:bg-[#1a1926]/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[24px] shadow-sm">
              <div className="sm:col-span-4 flex flex-col items-center justify-center space-y-2">
                <div
                  className="bg-white p-2.5 border border-zinc-200/80 flex items-center justify-center shrink-0 w-28 h-28 shadow-sm"
                  style={{ borderRadius: "20px" }}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(vcardDownloadUrl)}`}
                    alt="vCard QR Code"
                    className="w-full h-full object-contain"
                    style={{ borderRadius: "12px" }}
                  />
                </div>
                <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  {t("memberPortal.utilitiesPage.vcard.qrLabel") || "Quick Save QR"}
                </span>
              </div>

              <div className="sm:col-span-8 space-y-2">
                <h4 className="text-xs font-black text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
                  {t("memberPortal.utilitiesPage.vcard.desktopInstructionTitle")}
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                  {t("memberPortal.utilitiesPage.vcard.desktopInstructionDesc")}
                </p>
              </div>
            </div>
          )}

          {/* Public Link Box */}
          <div className="bg-zinc-50 dark:bg-[#1a1926]/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-[24px] p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                {t("memberPortal.utilitiesPage.vcard.publicLinkTitle")}
              </h4>
              <p className="text-[9.5px] text-zinc-400">
                {t("memberPortal.utilitiesPage.vcard.publicLinkDesc")}
              </p>
            </div>

            <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#12111a] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl">
              <div className="font-mono text-[10.5px] text-zinc-550 dark:text-zinc-400 break-all select-all flex-1 px-3 py-1 font-bold">
                {vcardDownloadUrl}
              </div>
              <button
                onClick={copyVcardLink}
                className="px-4 py-2 rounded-lg text-[9.5px] font-extrabold uppercase bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-[11px]">content_copy</span>
                {t("memberPortal.utilitiesPage.vcard.copyBtn")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
