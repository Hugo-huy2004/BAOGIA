import React from 'react';

const TrustpilotBadge = () => {
  return (
    <a
      href="https://www.trustpilot.com/review/hugowishpax.studio"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="Review us on Trustpilot"
    >
      <div className="flex items-center gap-0.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path fill="#00B67A" d="M12 0l3.7 7.5 8.3 1.2-6 5.8 1.4 8.2-7.4-3.9-7.4 3.9 1.4-8.2-6-5.8 8.3-1.2z" />
        </svg>
        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight ml-0.5">Trustpilot</span>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Verified</span>
    </a>
  );
};

export default TrustpilotBadge;
