import React, { useState } from "react";
import { BorderBeam } from "border-beam";
import { sensory } from "../../../lib/sensory";
import useDarkScheme from "../os/useDarkScheme";

/**
 * Ô nhập kiểu app chat. BorderBeam chỉ chạy khi có chuyện đang xảy ra — đang gõ
 * (focus) hoặc nhân vật đang soạn trả lời (busy) — nên viền sáng mang nghĩa
 * "đang nghe / đang nghĩ", không phải trang trí thường trực.
 * Memoized so typing a keystroke never re-renders the message list above.
 */
function ChatInputBar({
  inputRef,
  value,
  onChange,
  onSend,
  disabled,
  busy = false,
  placeholder,
  quickReplies = [],
  onQuickReply,
  coachOpen = false,
  onToggleCoach,
  coachLabel,
}) {
  const [focused, setFocused] = useState(false);
  const dark = useDarkScheme();
  const hasText = value.trim().length > 0;

  const handleSend = () => {
    try { sensory.pop(); sensory.vibrate("light"); } catch { /* ignore */ }
    onSend?.();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const autoResize = (e) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const iconButton = "grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-90 disabled:opacity-40";

  return (
    <div className="space-y-2">
      {quickReplies.length > 0 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {quickReplies.map((qr, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                try { sensory.tap(); } catch { /* ignore */ }
                onQuickReply?.(qr);
              }}
              className="min-h-[40px] shrink-0 whitespace-nowrap rounded-full border border-border bg-card px-4 text-[15px] text-foreground transition active:scale-95"
            >
              {qr.label || qr}
            </button>
          ))}
        </div>
      )}

      <BorderBeam
        size="md"
        colorVariant="ocean"
        theme={dark ? "dark" : "light"}
        strength={0.8}
        active={focused || busy}
        borderRadius={26}
        className="w-full"
      >
        <div className={`flex items-end gap-1 rounded-[26px] border border-border bg-card p-1 ${disabled && !busy ? "opacity-60" : ""}`}>

          {/* 16px: iOS tự phóng to trang khi ô nhập có chữ nhỏ hơn mức này. */}
          <textarea
            ref={inputRef}
            value={value}
            onChange={e => { onChange(e.target.value); autoResize(e); }}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="min-w-0 flex-1 resize-none self-center bg-transparent pl-3 pr-2 py-2.5 text-[16px] leading-snug text-foreground outline-none placeholder:text-muted-foreground placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis max-h-[120px] overflow-y-auto"
            style={{ height: "44px" }}
          />

          {hasText ? (
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled}
              aria-label="Gửi"
              className={`${iconButton} text-white`}
              style={{ background: "var(--ax, #0A84FF)" }}
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleCoach}
              aria-label={coachLabel}
              aria-expanded={coachOpen}
              className={`${iconButton} ${coachOpen ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              <span className="material-symbols-outlined text-[22px]">{coachOpen ? "close" : "auto_awesome"}</span>
            </button>
          )}
        </div>
      </BorderBeam>
    </div>
  );
}

export default React.memo(ChatInputBar);
