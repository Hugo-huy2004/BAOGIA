import React from 'react';

const CloudflareProtectedBadge = () => {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-800/50 hover:scale-105 transition-transform cursor-default"
      title="Protected by Cloudflare Advanced Security"
    >
      <div className="flex items-center gap-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.431 8.213A7.542 7.542 0 0 0 10.5 3a7.514 7.514 0 0 0-7.391 6.136 5.526 5.526 0 0 0-1.609 10.158C2.593 20.084 4.015 20.5 5.5 20.5h13c2.485 0 4.5-2.015 4.5-4.5 0-2.434-1.93-4.417-4.346-4.492a5.534 5.534 0 0 0-1.223-3.295z"/>
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight ml-0.5">Cloudflare</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Protected</span>
    </div>
  );
};

export default CloudflareProtectedBadge;
