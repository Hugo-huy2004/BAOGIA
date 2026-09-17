import { useState } from "react";

/**
 * Sơ đồ giao tiếp kiến trúc (Communication Sequence & Protocol Diagrams)
 * Chuẩn phong cách Apple Developer Technical Whitepaper & Harvard Engineering Report:
 * - Trình bày luồng bắt tay giữa các bên (Client <-> Service Worker <-> Server <-> Third-Party)
 * - Tông màu đơn sắc xanh kỹ thuật (Monochromatic Blue), tương thích chuẩn light/dark
 * - Toàn bộ dữ liệu nội dung được truyền từ Data Layer (i18n) qua prop `data`
 */
export default function CommunicationDiagram({ data }) {
  const [activeStep, setActiveStep] = useState(0);

  if (!data) return null;

  const {
    badge = "",
    title = "",
    desc = "",
    nodes = [],
    steps = [],
    securityNote = "",
    uiLabels = {},
  } = data;

  const sequenceLabel = uiLabels.sequenceLabel || "Sơ đồ chuỗi giao tiếp";
  const stepsHeading = uiLabels.stepsHeading || "Trình tự các bước bắt tay giao tiếp (Sequence Steps):";

  return (
    <figure className="my-6 overflow-hidden rounded-3xl border border-sky-500/20 bg-slate-950 text-white shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-500/15 bg-sky-950/20 px-5 py-4">
        <div>
          {badge && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 border border-sky-500/40 px-3 py-0.5 text-[11px] font-bold text-sky-400">
              <span className="material-symbols-outlined text-[13px]">sync_alt</span>
              <span>{badge}</span>
            </div>
          )}
          <h3 className="mt-2 text-base font-bold text-white tracking-tight sm:text-lg">
            {title}
          </h3>
          {desc && (
            <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
              {desc}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
            {sequenceLabel}
          </span>
        </div>
      </div>

      {/* Nodes Overview */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-b border-sky-500/15 bg-white/[0.01] p-4 sm:p-5">
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`flex flex-col items-center rounded-2xl border p-3 text-center transition-all ${
                node.highlight
                  ? "border-sky-500/60 bg-sky-500/10 shadow-sm"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  node.highlight ? "bg-sky-500 text-white shadow-xs" : "bg-white/10 text-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{node.icon}</span>
              </div>
              <p className="mt-2 text-xs font-bold text-white sm:text-sm">{node.label}</p>
              <p className="text-[10px] text-slate-400">{node.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sequence Steps Timeline */}
      {steps.length > 0 && (
        <div className="p-4 sm:p-6 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-sky-400">timeline</span>
            <span>{stepsHeading}</span>
          </p>
          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isCurrent = activeStep === idx;
              return (
                <div
                  key={step.action || idx}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                    isCurrent
                      ? "border-sky-500/70 bg-sky-500/[0.12] shadow-md"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono ${
                          isCurrent ? "bg-sky-500 text-white" : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-[13px] font-bold text-white truncate">
                        {step.action}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-1.5 text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                      <span>{step.from}</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      <span>{step.to}</span>
                    </div>
                  </div>
                  <p className="mt-1.5 pl-8 text-xs text-slate-300 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Security Note */}
      {securityNote && (
        <figcaption className="border-t border-sky-500/15 bg-sky-950/20 px-5 py-3.5 text-xs text-slate-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-sky-400 text-base shrink-0">verified</span>
          <span>{securityNote}</span>
        </figcaption>
      )}
    </figure>
  );
}
