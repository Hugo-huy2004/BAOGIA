import React from 'react';

const A11yBadge = () => {
  return (
    <a
      href="https://pagespeed.web.dev/analysis/https-www-hugowishpax-studio/8w21iom0x0?form_factor=mobile"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="Web Accessibility (A11y) - High Score 92/100"
    >
      <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-[18px]">accessibility_new</span>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">A11y Passed</span>
    </a>
  );
};

export default A11yBadge;
