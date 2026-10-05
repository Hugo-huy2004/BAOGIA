import React from "react";

/**
 * Component vỏ bọc chuẩn hoá cho toàn bộ Trust Badges.
 * - Chiều cao cố định chuẩn 32px (h-8), căn giữa hoàn hảo.
 * - Glassmorphism sang trọng, border tinh tế, hỗ trợ Dark/Light mode.
 * - Tương tác hover micro-glow & subtle scaling.
 * - Hỗ trợ cả dạng Link (<a>) và dạng Static Badge (<div>) có ngữ nghĩa A11y.
 */
export default function TrustBadgePill({
  href,
  title,
  ariaLabel,
  icon,
  badgeTitle,
  badgeSubtitle,
  statusDot = null,
  className = "",
  children,
}) {
  const commonClasses = `group inline-flex items-center gap-2 h-8 px-3 rounded-full 
    bg-white/80 dark:bg-slate-900/80 backdrop-blur-md 
    border border-slate-200/80 dark:border-slate-800/80 
    hover:border-primary/40 dark:hover:border-primary/50 
    shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] 
    hover:shadow-[0_4px_16px_rgba(59,130,246,0.12)] 
    transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] 
    select-none text-xs ${className}`;

  const content = (
    <>
      {statusDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot}`}
          aria-hidden="true"
        />
      )}
      {icon && <div className="shrink-0 flex items-center justify-center">{icon}</div>}
      {children ? (
        children
      ) : (
        <div className="flex items-center gap-1.5 min-w-0">
          {badgeTitle && (
            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] tracking-tight whitespace-nowrap">
              {badgeTitle}
            </span>
          )}
          {badgeSubtitle && (
            <>
              <span className="h-2.5 w-px bg-slate-300/80 dark:bg-slate-700/80 shrink-0" aria-hidden="true" />
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                {badgeSubtitle}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={commonClasses}
        title={title}
        aria-label={ariaLabel || title}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={`${commonClasses} cursor-default`}
      title={title}
      role="note"
      aria-label={ariaLabel || title}
    >
      {content}
    </div>
  );
}
