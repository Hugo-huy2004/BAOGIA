import React from 'react';

const NortonSafeWebBadge = () => {
  return (
    <a
      href="https://safeweb.norton.com/report/show?url=hugowishpax.studio"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="Verified Safe by Norton Safe Web"
    >
      <div className="flex items-center gap-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#FDB813" />
          <path fill="#000000" d="M10.5 15.5l-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z" />
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight ml-0.5">norton</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Safe Web</span>
    </a>
  );
};

export default NortonSafeWebBadge;
