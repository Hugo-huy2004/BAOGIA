import React from "react";
import { notify } from "../../lib/notify";

const NOTICE_META = {
  success: {
    icon: "verified",
    label: "Thành công",
    accent: "bg-emerald-500 text-white shadow-emerald-500/25",
    line: "from-emerald-500 to-teal-400",
  },
  warning: {
    icon: "warning",
    label: "Cần chú ý",
    accent: "bg-amber-500 text-white shadow-amber-500/25",
    line: "from-amber-500 to-orange-400",
  },
  error: {
    icon: "error",
    label: "Không thành công",
    accent: "bg-rose-500 text-white shadow-rose-500/25",
    line: "from-rose-500 to-red-500",
  },
  info: {
    icon: "info",
    label: "Thông báo",
    accent: "bg-indigo-500 text-white shadow-indigo-500/25",
    line: "from-indigo-500 to-violet-500",
  },
  loading: {
    icon: "progress_activity",
    label: "Đang xử lý",
    accent: "bg-indigo-500 text-white shadow-indigo-500/25",
    line: "from-indigo-500 to-violet-500",
  },
};

function getNoticeMeta(type) {
  return NOTICE_META[type] || NOTICE_META.info;
}

// Thin compatibility shim: the old floating portal toast now DELEGATES to the
// single `notify` system, so the ~14 components that still render
// <HugoNoticeToast open .../> converge onto one queue, one look, with dedup —
// without any of them having to change. It renders nothing itself; when `open`
// flips to a truthy message it fires the matching notify() call.
export function HugoNoticeToast({ open, type = "info", title, message }) {
  const lastRef = React.useRef("");
  React.useEffect(() => {
    if (!open || !message) { if (!open) lastRef.current = ""; return; }
    const key = `${type}|${message}`;
    if (lastRef.current === key) return; // don't re-fire on unrelated re-renders
    lastRef.current = key;
    const fn = notify[type] ? type : "info";
    notify[fn](message, title ? { title } : undefined);
  }, [open, message, type, title]);
  return null;
}

export function HugoInlineNotice({ type = "info", title, message, children, className = "" }) {
  const meta = getNoticeMeta(type);
  const content = message || children;
  if (!content) return null;

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/60 bg-white/86 px-3.5 py-3 text-slate-900 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06] dark:text-white ${className}`}>
      <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${meta.line}`} />
      <div className="flex items-start gap-3 pl-1">
        <span className={`material-symbols-outlined grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[18px] shadow-md ${meta.accent}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-white/40">{title || meta.label}</p>
          <p className="m-0 mt-0.5 text-xs font-bold leading-relaxed text-slate-700 dark:text-white/74">{content}</p>
        </div>
      </div>
    </div>
  );
}

