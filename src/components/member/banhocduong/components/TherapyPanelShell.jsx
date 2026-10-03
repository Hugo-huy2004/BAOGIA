import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { BorderBeam } from "border-beam";
import BackButton from "../../shared/BackButton";

export default function TherapyPanelShell({ method, onBack, children }) {
  if (!method) return children;

  const title = method.name || method.title || "Bài Tập Thư Giãn";
  const desc = method.desc || method.description || "";
  const duration = method.duration || "5–15 phút";
  const category = method.category || "Thư giãn & tự chăm sóc";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="p-3 sm:p-6 space-y-4 max-w-4xl mx-auto pb-24 text-left"
    >
      {/* Header Bar */}
      <BorderBeam size="sm" colorVariant="ocean" strength={0.7} borderRadius={22} className="w-full">
        <div className="swiftui-liquid-glass rounded-[22px] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <BackButton onClick={onBack} iconOnly />
            <div className="min-w-0">
              <h3 className="text-sm font-black text-foreground truncate leading-tight">{title}</h3>
              <p className="text-[12px] font-bold text-muted-foreground truncate mt-0.5">{desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:flex items-center gap-1 text-[12px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
            <span className="text-[12px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
              {category}
            </span>
          </div>
        </div>
      </BorderBeam>

      {/* Main Content Area */}
      <BorderBeam size="md" colorVariant="colorful" strength={0.75} borderRadius={26} className="w-full">
        <div className="swiftui-liquid-glass rounded-[26px] p-4 sm:p-6 min-h-[300px] shadow-sm">
          {children}
        </div>
      </BorderBeam>
    </motion.div>
  );
}
