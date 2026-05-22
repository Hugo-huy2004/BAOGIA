import React from 'react';

const VietnamBadge = () => {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform cursor-default"
      title="Proudly Handcrafted in Vietnam"
    >
      <div className="flex items-center gap-1">
        <svg viewBox="0 0 24 24" className="w-4 h-4 rounded-[2px] overflow-hidden" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="24" height="24" fill="#DA251D"/>
          <path d="M12 4.5l2.3 7h7.2l-5.8 4.2 2.2 7-5.9-4.3-5.9 4.3 2.2-7-5.8-4.2h7.2z" fill="#FFFF00"/>
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight">Vietnam</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Handcrafted</span>
    </div>
  );
};

export default VietnamBadge;
