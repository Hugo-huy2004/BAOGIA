import React from "react";
import { useTranslation } from "react-i18next";

export default function MemberUtilitiesDashboard({ setSelectedUtility }) {
  const { t } = useTranslation();

  const utilities = [
    {
      id: "nfc",
      icon: "sensors",
      title: t("memberPortal.utilitiesPage.nfc.title"),
      desc: t("memberPortal.utilitiesPage.nfc.desc"),
      btnText: t("intro.slide5.createBtn")
    },
    {
      id: "vcard",
      icon: "contact_phone",
      title: t("memberPortal.utilitiesPage.vcard.title"),
      desc: t("memberPortal.utilitiesPage.vcard.desc"),
      btnText: t("intro.slide1.explore")
    },
    {
      id: "signature",
      icon: "signature",
      title: t("memberPortal.utilitiesPage.signature.title"),
      desc: t("memberPortal.utilitiesPage.signature.desc"),
      btnText: t("intro.slide5.createBtn")
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header section */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-950 dark:to-zinc-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden border border-zinc-200/10 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <span className="px-3 py-1 rounded-full text-[9px] font-black tracking-widest bg-indigo-500/20 text-indigo-300 uppercase border border-indigo-500/30">
            {t("memberPortal.utilitiesPage.tabTitle")}
          </span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            {t("memberPortal.utilitiesPage.title")}
          </h2>
          <p className="text-[10px] sm:text-xs text-zinc-400 max-w-xl leading-relaxed">
            {t("memberPortal.utilitiesPage.desc")}
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {utilities.map((util) => (
          <div 
            key={util.id}
            onClick={() => setSelectedUtility(util.id)}
            className="group cursor-pointer bg-white dark:bg-[#12111a] rounded-3xl p-6 border border-zinc-200/50 dark:border-zinc-800/60 hover:border-zinc-800 dark:hover:border-zinc-200 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between h-[210px]"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors group-hover:bg-zinc-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black">
                <span className="material-symbols-outlined text-2xl">{util.icon}</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100">{util.title}</h3>
                <p className="text-[10.5px] text-zinc-450 dark:text-zinc-450 leading-relaxed">
                  {util.desc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white uppercase tracking-widest pt-2">
              {util.btnText} <span className="material-symbols-outlined text-[10px] transform group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
