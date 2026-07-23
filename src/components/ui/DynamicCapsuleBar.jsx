/**
 * DynamicCapsuleBar.jsx
 * Thanh thông báo viên thuốc Dynamic Capsule / Dynamic Island đỉnh cao chuẩn Apple iOS.
 */

import { motion, AnimatePresence } from "framer-motion";

export default function DynamicCapsuleBar({ activeStatus, onDismiss }) {
  if (!activeStatus) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, scale: 0.85, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -60, scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.y < -20) onDismiss?.();
        }}
        className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] cursor-grab active:cursor-grabbing select-none"
      >
        <div className="h-10 px-4 bg-zinc-950/90 text-white rounded-full border border-zinc-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl flex items-center gap-3">
          {/* Animated pulse dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />

          {/* Status text */}
          <span className="text-[11.5px] font-bold tracking-wide leading-none">
            {activeStatus.title || "Hugo Studio Active"}
          </span>

          {/* Icon */}
          <span className="material-symbols-outlined text-[16px] text-zinc-400 shrink-0">
            {activeStatus.icon || "bolt"}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
