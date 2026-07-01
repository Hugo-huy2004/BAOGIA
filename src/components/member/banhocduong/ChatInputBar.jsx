import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";

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
  isListening,
  onVoice,
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
                className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white dark:bg-[#1e1d2c] border border-zinc-200 dark:border-white/[0.1] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-[#27263a] active:scale-95 transition-all shadow-sm whitespace-nowrap"
              >
                {qr.label || qr}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer pill */}
      <div className={`flex items-end gap-2 px-2 py-2 rounded-[22px] bg-white dark:bg-[#1a1928] border transition-all duration-200 shadow-sm ${
        disabled
          ? "border-zinc-100 dark:border-zinc-800/50 opacity-60"
          : "border-zinc-200 dark:border-white/[0.09] focus-within:border-blue-500/50 dark:focus-within:border-blue-500/30 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
      }`}>

        {/* Voice button */}
        <button
          type="button"
          onClick={onVoice}
          disabled={disabled}
          title="Nhận diện giọng nói"
          className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 ${
            isListening
              ? "bg-rose-500/15 text-rose-500 border border-rose-500/30 animate-pulse"
              : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Auto-grow textarea */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={e => { onChange(e.target.value); autoResize(e); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[13.5px] text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none leading-snug py-1 max-h-[88px] overflow-y-auto"
          style={{ height: "24px" }}
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
              className="w-8 h-8 shrink-0 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-90 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[16px] font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
            </motion.button>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="w-8 h-8 shrink-0 rounded-full bg-zinc-100 dark:bg-white/[0.06] flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[15px] text-zinc-400">edit</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default React.memo(ChatInputBar);
