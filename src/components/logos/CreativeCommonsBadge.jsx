import React from 'react';

const CreativeCommonsBadge = () => {
  return (
    <a 
      href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="This work is licensed under CC BY-NC-ND 4.0"
    >
      <div className="flex items-center gap-0.5">
        <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="CC" className="w-4 h-4 opacity-80 dark:invert" />
        <img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="BY" className="w-4 h-4 opacity-80 dark:invert" />
        <img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="NC" className="w-4 h-4 opacity-80 dark:invert" />
        <img src="https://mirrors.creativecommons.org/presskit/icons/nd.svg" alt="ND" className="w-4 h-4 opacity-80 dark:invert" />
      </div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">CC BY-NC-ND 4.0</span>
    </a>
  );
};

export default CreativeCommonsBadge;
