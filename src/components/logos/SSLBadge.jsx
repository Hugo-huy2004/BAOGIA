import React from 'react';

const SSLBadge = () => {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform cursor-default"
      title="SSL Secured - 256-bit Encryption"
    >
      <div className="flex items-center gap-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect x="5" y="10" width="14" height="11" rx="2" fill="#10B981"/>
          <path d="M8 10V7a4 4 0 118 0v3" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="15.5" r="1.5" fill="#FFFFFF"/>
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight ml-0.5">SSL Secured</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">256-bit</span>
    </div>
  );
};

export default SSLBadge;
