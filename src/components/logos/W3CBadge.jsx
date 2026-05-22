import React from 'react';

const W3CBadge = () => {
  return (
    <a
      href="https://validator.w3.org/nu/?doc=https%3A%2F%2Fwww.hugowishpax.studio%2F"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 hover:scale-105 transition-transform"
      title="W3C HTML5 Validated - Passed 100%"
    >
      <svg viewBox="0 0 512 512" className="w-3.5 h-3.5" aria-hidden="true">
        <path fill="#E34F26" d="M71,460 L30,4 L482,4 L441,460 L256,512 Z" />
        <path fill="#EF652A" d="M256,472 L405,431 L440,37 L256,37 Z" />
        <path fill="#EBEBEB" d="M256,208 L181,208 L176,150 L256,150 L256,94 L114,94 L115,109 L129,265 L256,265 Z M256,355 L255,355 L192,338 L188,293 L132,293 L140,382 L255,414 L256,414 Z" />
        <path fill="#FFFFFF" d="M255,208 L255,265 L325,265 L318,338 L255,355 L255,414 L371,382 L372,372 L385,208 Z M255,94 L255,150 L390,150 L391,138 L395,94 Z" />
      </svg>
      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">W3C Validated</span>
    </a>
  );
};

export default W3CBadge;
