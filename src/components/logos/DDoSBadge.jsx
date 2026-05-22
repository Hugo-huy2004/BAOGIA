import React from 'react';

const DDoSBadge = () => {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform cursor-default"
      title="DDoS Protected Network"
    >
      <div className="flex items-center gap-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#F59E0B" stroke="#D97706" strokeWidth="1"/>
          <path d="M13 9h-2v3H8l4 5v-3h2l-4-5z" fill="#FFFFFF"/>
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight ml-0.5">DDoS</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Protected</span>
    </div>
  );
};

export default DDoSBadge;
