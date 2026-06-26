import React from "react";
import { Mic } from "lucide-react";

/**
 * The message composer, split out from ChatTab.jsx (which still owns
 * `inputText` state/handlers) so it can be memoized independently of the
 * message list — like real chat apps, typing a keystroke here should never
 * have to re-render the (potentially long) message history above it. See
 * ChatMessages.jsx, which got the same React.memo treatment for the same reason.
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
  showQuickActions,
  onToggleQuickActions,
}) {
  return (
    <div className="mx-3 sm:mx-4 mb-1.5 p-1.5 rounded-[28px] bg-white dark:bg-[#171720] border border-zinc-200/70 dark:border-zinc-800/80 shadow-sm flex items-end gap-1.5 transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/40">

      {/* "+" toggle for the quick actions sheet */}
      <button type="button" onClick={onToggleQuickActions}
        title="Thao tác nhanh"
        className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
          showQuickActions
            ? 'bg-blue-500/15 border border-blue-500/30 text-blue-500'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
        }`}>
        <span className={`material-symbols-outlined text-[20px] transition-transform ${showQuickActions ? 'rotate-45' : ''}`}>add</span>
      </button>

      {/* Voice to text (compact) */}
      <button type="button" onClick={onVoice}
        title="Nhận diện giọng nói"
        className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
          isListening
            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-500 animate-pulse'
            : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
        }`}>
        <Mic className="w-[16px] h-[16px]" />
      </button>

      {/* Auto-grow text input area */}
      <div className="flex-1 min-h-[36px] flex items-center rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/80 px-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={e => {
            onChange(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent text-[14px] text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none resize-none leading-snug py-2 max-h-24 overflow-y-auto"
          style={{ height: '22px' }}
        />
      </div>

      {/* Send button (always visible, disabled if empty/loading/no tokens) */}
      <button type="button" onClick={onSend}
        disabled={disabled || !value.trim()}
        className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
          value.trim() && !disabled
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 active:scale-90"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
        }`}>
        <span className="material-symbols-outlined text-[16px] font-bold">send</span>
      </button>
    </div>
  );
}

export default React.memo(ChatInputBar);
