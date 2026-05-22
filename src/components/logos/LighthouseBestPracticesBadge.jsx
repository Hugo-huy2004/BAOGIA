import React from 'react';

const LighthouseBestPracticesBadge = () => {
  return (
    <a
      href="https://pagespeed.web.dev/analysis/https-www-hugowishpax-studio/8w21iom0x0?form_factor=mobile"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="Google Lighthouse - Best Practices 100/100"
    >
      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white font-bold text-[8px] leading-none">
        100
      </div>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Best Practices</span>
    </a>
  );
};

export default LighthouseBestPracticesBadge;
