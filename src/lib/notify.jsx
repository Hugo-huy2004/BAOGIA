import React from "react";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// notify — the ONE notification API for the whole app.
//
// Before this, three systems coexisted (raw react-hot-toast, the HugoNotice
// portal card, and dozens of per-component `useState`+`<HugoNoticeToast>`
// setups) — inconsistent looks and duplicate stacks. Everything now funnels
// through here: react-hot-toast's engine (queueing, positioning, timing) drives
// the HugoNotice visual, and identical messages DEDUPE (same id) instead of
// piling up. One import, one look, one source of truth.
//
//   notify.success(msg) / .error / .warning / .info / .loading
//   notify.dismiss(id?)                     — clear one or all
//   notify.confirm({ title, message })      — Promise<boolean> modal
//   toastCompat(msg, type)                  — drop-in for old showToast(msg,type)
// ─────────────────────────────────────────────────────────────────────────────

const META = {
  success: { icon: "verified",           label: "Thành công",       accent: "bg-emerald-500 text-white shadow-emerald-500/25", line: "from-emerald-500 to-teal-400" },
  warning: { icon: "warning",            label: "Cần chú ý",        accent: "bg-amber-500 text-white shadow-amber-500/25",     line: "from-amber-500 to-orange-400" },
  error:   { icon: "error",              label: "Không thành công", accent: "bg-rose-500 text-white shadow-rose-500/25",       line: "from-rose-500 to-red-500" },
  info:    { icon: "info",               label: "Thông báo",        accent: "bg-primary text-white shadow-primary/25",   line: "from-primary to-secondary" },
  loading: { icon: "progress_activity",  label: "Đang xử lý",       accent: "bg-primary text-white shadow-primary/25",   line: "from-primary to-secondary" },
};

// Small stable hash so the same message reuses one toast id → no stacking.
function hashId(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return "n" + (h >>> 0).toString(36);
}

function Card({ t, type, message, title }) {
  const meta = META[type] || META.info;
  return (
    <div
      className={`brand-panel pointer-events-auto relative w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-[28px] px-4 py-3 text-foreground ${t.visible ? "animate-enter" : "animate-leave"}`}
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${meta.line}`} />
      <div className="flex items-start gap-3">
        <span
          className={`material-symbols-outlined grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-[21px] shadow-lg ${meta.accent} ${type === "loading" ? "animate-spin" : ""}`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="m-0 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">{title || meta.label}</p>
          <p className="m-0 mt-0.5 text-sm font-black leading-snug text-foreground break-words">{message}</p>
        </div>
        {type !== "loading" && (
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted/70"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>
    </div>
  );
}

function show(type, message, opts = {}) {
  if (!message) return undefined;
  if (typeof message === "function" || React.isValidElement(message)) {
    const id = opts.id || "custom_" + Date.now();
    const duration = opts.duration ?? (type === "loading" ? Infinity : type === "error" ? 5000 : 3200);
    return toast.custom(
      typeof message === "function" ? message : () => message,
      { id, duration }
    );
  }
  const msg = String(message);
  const id = opts.id || hashId(type + "|" + msg);
  const duration = opts.duration ?? (type === "loading" ? Infinity : type === "error" ? 5000 : 3200);
  return toast.custom((t) => <Card t={t} type={type} message={msg} title={opts.title} />, { id, duration });
}

export const notify = {
  success: (m, o) => show("success", m, o),
  error:   (m, o) => show("error", m, o),
  warning: (m, o) => show("warning", m, o),
  info:    (m, o) => show("info", m, o),
  loading: (m, o) => show("loading", m, o),
  dismiss: (id) => toast.dismiss(id),

  // Promise<boolean> confirm rendered as a persistent toast card with actions —
  // replaces window.confirm and every bespoke confirm modal.
  confirm({ title = "Xác nhận", message, confirmText = "Đồng ý", cancelText = "Huỷ", danger = false } = {}) {
    return new Promise((resolve) => {
      const id = "confirm_" + Date.now();
      const done = (v) => { toast.dismiss(id); resolve(v); };
      toast.custom(
        (t) => (
          <div className={`brand-panel pointer-events-auto w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-[28px] p-4 ${t.visible ? "animate-enter" : "animate-leave"}`}>
            <p className="text-sm font-black text-foreground">{title}</p>
            {message && <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">{message}</p>}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => done(false)}
                className="flex-1 rounded-2xl border border-border/70 bg-muted/75 py-2.5 text-xs font-bold text-muted-foreground active:scale-[0.98] transition-transform hover:bg-muted">
                {cancelText}
              </button>
              <button type="button" onClick={() => done(true)}
                className={`flex-1 rounded-2xl py-2.5 text-xs font-black text-white active:scale-[0.98] transition-transform ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:bg-primary/90"}`}>
                {confirmText}
              </button>
            </div>
          </div>
        ),
        { id, duration: Infinity }
      );
    });
  },
};

// Backward-compatible shim for the ubiquitous `showToast(message, type)` prop.
// Point old call sites at this and the local toast plumbing can be deleted.
export function toastCompat(message, type = "info") {
  const t = type === "loading" ? "loading" : (META[type] ? type : "info");
  return show(t, message);
}

export default notify;
