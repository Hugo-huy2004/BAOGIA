import React from 'react';

const BraveVerifiedBadge = () => {
  return (
    <a
      href="https://brave.com/creators/"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="Brave Verified Creator"
    >
      <div className="flex items-center gap-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2L22 20H2L12 2Z" fill="#FF5000"/>
          <path d="M12 6.5L17.5 16.5H6.5L12 6.5Z" fill="#FFFFFF"/>
          <path d="M12 9.5L14.5 14.5H9.5L12 9.5Z" fill="#FF5000"/>
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight ml-0.5">Brave</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Creator</span>
    </a>
  );
};

export default BraveVerifiedBadge;
