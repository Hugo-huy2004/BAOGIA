import React from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function TherapyPanelShell({ method, onBack, children }) {
  if (!method) return children;

  const title = method.name || method.title || "Bài Tập Trị Liệu";
  const desc = method.desc || method.description || "";
  const duration = method.duration || "5–15 phút";
  const category = method.category || "Trị liệu tâm lý";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto pb-24 text-left"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border bg-white/60 dark:bg-card/60 backdrop-blur-xl border-border/50 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 border border-border/60 text-foreground transition-all active:scale-95 shrink-0"
            title="Quay lại"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-foreground truncate leading-tight">{title}</h3>
            <p className="text-[10px] font-bold text-muted-foreground truncate mt-0.5">{desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Clock className="w-3 h-3" />
            {duration}
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
            {category}
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-6 rounded-2xl border bg-white/40 dark:bg-card/40 backdrop-blur-xl border-border/50 shadow-sm min-h-[300px]">
        {children}
      </div>
    </motion.div>
  );
}
