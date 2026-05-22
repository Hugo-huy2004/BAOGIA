import React from 'react';

const BingWebmasterBadge = () => {
  return (
    <a
      href="https://www.bing.com/webmasters/"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="Indexed by Microsoft Bing Webmaster Tools"
    >
      <div className="flex items-center gap-1">
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path fill="#00A4EF" d="M10.4 20.3L4.5 17V3.2L16.2 1v13.5l-5.8 5.8z" />
          <path fill="#0078D7" d="M16.2 1v13.5l3.3-3.3V5.5L16.2 1z" />
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight">Bing</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Indexed</span>
    </a>
  );
};

export default BingWebmasterBadge;
