import React from 'react';

const CopyscapeBadge = () => {
  return (
    <a
      href="https://www.copyscape.com/"
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-center px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="Protected by Copyscape - Do not copy content from this page."
    >
      <img src="https://banners.copyscape.com/img/copyscape-banner-black-130x46.png" alt="Protected by Copyscape" className="h-3.5 w-auto object-contain dark:invert opacity-80" />
    </a>
  );
};

export default CopyscapeBadge;
