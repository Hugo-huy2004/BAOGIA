import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Modern iMessage-style composer.
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
}) {
  const hasText = value.trim().length > 0;

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
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
                onClick={() => onQuickReply?.(qr)}
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-card/60 backdrop-blur-md border border-border/80/[0.08] text-foreground/80 hover:bg-white/80 dark:hover:bg-zinc-800/60 active:scale-95 transition-all shadow-sm whitespace-nowrap"
              >
                {qr.label || qr}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer pill */}
      <div className={`flex items-end gap-1.5 pl-3.5 pr-1.5 py-1.5 rounded-[22px] bg-card/80 backdrop-blur-xl border transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] ${
        disabled
          ? "border-border/50/[0.04] opacity-60"
          : "border-border/60/[0.1] focus-within:border-blue-500/50 dark:focus-within:border-blue-500/30 focus-within:shadow-[0_4px_20px_rgba(59,130,246,0.15)]"
      }`}>

        <textarea
          ref={inputRef}
          value={value}
          onChange={e => { onChange(e.target.value); autoResize(e); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none leading-snug py-1.5 max-h-[80px] overflow-y-auto"
          style={{ height: "30px" }}
        />

        {/* Send / pulse button */}
        <AnimatePresence mode="wait">
          {hasText ? (
            <motion.button
              key="send"
              type="button"
              onClick={onSend}
              disabled={disabled}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="w-[30px] h-[30px] shrink-0 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-90 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition-colors disabled:opacity-40"
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
              className="w-[30px] h-[30px] shrink-0 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center border border-indigo-500/20 dark:border-indigo-400/20"
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
