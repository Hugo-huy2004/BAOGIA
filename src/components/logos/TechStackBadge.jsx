import React from 'react';

const TechStackBadge = () => {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform cursor-default"
      title="Powered by Vercel & React"
    >
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 1L24 22H0L12 1Z" fill="currentColor" className="text-black dark:text-white"/>
        </svg>
        <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-4 h-4 text-[#61DAFB]" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <circle cx="0" cy="0" r="2.05" fill="#61DAFB" stroke="none"/>
          <g stroke="#61DAFB">
            <ellipse rx="11" ry="4.2"/>
            <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
            <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
          </g>
        </svg>
      </div>
      <div className="h-3 w-px bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Powered</span>
    </div>
  );
};

export default TechStackBadge;
