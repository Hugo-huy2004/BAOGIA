import React from 'react';

const PrivacyBadge = () => {
  return (
    <a
      href="https://themarkup.org/blacklight?url=hugowishpax.studio"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50 hover:scale-105 transition-transform"
      title="Verified Tracking-Free by Blacklight"
    >
      <div className="flex items-center gap-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" fill="#3B82F6"/>
          <path d="M10 16.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z" fill="#FFFFFF"/>
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight ml-0.5">Privacy</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Protected</span>
    </a>
  );
};

export default PrivacyBadge;
