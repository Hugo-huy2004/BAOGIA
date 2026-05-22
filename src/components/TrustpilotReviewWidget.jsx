import React from 'react';

export default function TrustpilotReviewWidget() {
  return (
    <a 
      href="https://www.trustpilot.com/review/hugowishpax.studio"
      target="_blank"
      rel="noreferrer"
      className="flex flex-col items-center justify-center space-y-3 py-6 hover:scale-105 transition-transform"
      title="View our reviews on Trustpilot"
    >
      {/* 5 Green Stars */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="w-9 h-9 bg-[#00B67A] flex items-center justify-center rounded-[3px] shadow-sm">
            <svg className="w-6 h-6 text-white drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1z" />
            </svg>
          </div>
        ))}
      </div>
      {/* Trustpilot Branding */}
      <div className="flex items-center gap-2.5 text-[15px] font-bold text-slate-700 dark:text-slate-200 tracking-tight">
        <span>Excellent</span>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
        <span className="flex items-center gap-1.5">
          <svg className="w-5 h-5 text-[#00B67A]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9-6.2-3.3-6.2 3.3 1.2-6.9-5-4.9 6.9-1z" />
          </svg>
          Trustpilot
        </span>
      </div>
    </a>
  );
}
