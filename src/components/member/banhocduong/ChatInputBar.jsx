import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sensory } from "../../../lib/sensory";

/**
 * Modern iMessage-style composer with BorderBeam glow and sensory feedback.
 * Memoized so typing a keystroke never re-renders the message list above.
 */
function ChatInputBar({
  inputRef,
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
  quickReplies = [],
  onQuickReply,
  onUploadReport,
}) {
  const hasText = value.trim().length > 0;

  const handleSend = () => {
    try {
      sensory.pop();
      sensory.vibrate('light');
    } catch {
      // Ignore
    }
    onSend?.();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const autoResize = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 88) + "px";
  };

  return (
    <div className="px-3 sm:px-4 pb-1 pt-1 space-y-1.5">
      {/* Quick-reply chips — float above input */}
      <AnimatePresence>
        {quickReplies.length > 0 && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5"
          >
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  try { sensory.tap(); sensory.vibrate('light'); } catch {}
                  onQuickReply?.(qr);
                }}
                className="shrink-0 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-card/60 backdrop-blur-md border border-border/80/[0.08] text-foreground/80 hover:bg-white/80 dark:hover:bg-zinc-800/60 active:scale-95 transition-all shadow-sm whitespace-nowrap"
              >
                {qr.label || qr}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer pill — clean iMessage-style */}
      <div className={`relative flex items-end gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-[24px] bg-white/80 dark:bg-[#161624]/85 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-200 ${
          disabled
            ? "opacity-60"
            : "focus-within:border-blue-500/40 focus-within:shadow-[0_4px_25px_rgba(59,130,246,0.18)]"
        }`}>
        {onUploadReport && (
          <button
            type="button"
            onClick={onUploadReport}
            disabled={disabled}
            aria-label="Đọc phiếu kết quả"
            title="Đọc phiếu kết quả"
            className="mb-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground active:scale-90 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[17px]">attach_file</span>
          </button>
        )}

        <textarea
          ref={inputRef}
          value={value}
          onChange={e => { onChange(e.target.value); autoResize(e); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder-zinc-500 dark:placeholder-zinc-400 outline-none resize-none leading-snug py-1.5 max-h-[80px] overflow-y-auto"
          style={{ height: "30px" }}
        />

        {/* Send / pulse button */}
        <AnimatePresence mode="wait">
          {hasText ? (
            <motion.button
              key="send"
              type="button"
              onClick={handleSend}
              disabled={disabled}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="w-11 h-11 shrink-0 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-90 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[15px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
            </motion.button>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-400/20"
            >
              <span className="material-symbols-outlined text-[15px] text-indigo-500 dark:text-indigo-400 animate-pulse">auto_awesome</span>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
    </div>
  );
}

export default React.memo(ChatInputBar);
