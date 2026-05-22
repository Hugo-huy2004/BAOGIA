import React from 'react';

const GreenWebBadge = () => {
  return (
    <a 
      href="https://www.thegreenwebfoundation.org/green-web-check/?url=https%3A%2F%2Fwww.hugowishpax.studio%2F"
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/50 hover:scale-105 transition-transform"
      title="This website is hosted Green"
    >
      <span className="material-symbols-outlined text-[16px] text-green-600 dark:text-green-400">energy_savings_leaf</span>
      <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Carbon Neutral</span>
    </a>
  );
};

export default GreenWebBadge;
