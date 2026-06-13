import React from "react";
import TypewriterText from "./TypewriterText";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, ChevronDown, Stethoscope, Heart } from "lucide-react";

export default function ChatMessages({
  messages,
  completedMessageIds,
  setCompletedMessageIds,
  onStartTest,
  onSelectDuration,
  loading,
  onNavigateToTab,
  messagesEndRef
}) {
  const [playingId, setPlayingId] = React.useState(null);
  const [showScrollBtn, setShowScrollBtn] = React.useState(false);
  const containerRef = React.useRef(null);
  const userScrolledUpRef = React.useRef(false);

  const handlePlayVoice = (id, text) => {
    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    setPlayingId(id);
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
    utterance.lang = "vi-VN";
    utterance.onend = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
  };

  React.useEffect(() => () => window.speechSynthesis.cancel(), []);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isUp = distFromBottom > 80;
    userScrolledUpRef.current = isUp;
    setShowScrollBtn(isUp);
  };

  const scrollToBottom = (behavior = "smooth") => {
    const el = containerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  // Auto-scroll to bottom on new messages ONLY if user hasn't scrolled up
  React.useEffect(() => {
    if (!userScrolledUpRef.current) scrollToBottom("smooth");
  }, [messages, loading]);

  // Always scroll to bottom on mount
  React.useEffect(() => {
    scrollToBottom("instant");
  }, []);

  const formatText = (txt) => {
    if (!txt) return "";
    return txt.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i} className="font-bold text-[#0071e3] dark:text-sky-400">{part.slice(2, -2)}</strong>
        : part
    );
  };

  return (
    <div className="relative h-full">
      <div
        id="chat-messages-container"
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-200/60 dark:scrollbar-thumb-zinc-700/60 scrollbar-track-transparent"
      >
        {/* Date separator at top */}
        <div className="flex items-center gap-3 py-2 px-2">
          <div className="flex-1 h-px bg-zinc-200/60 dark:bg-zinc-700/40" />
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-600 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800/60">
            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "numeric" })}
          </span>
          <div className="flex-1 h-px bg-zinc-200/60 dark:bg-zinc-700/40" />
        </div>

        {messages.map((msg, index) => {
          const isBot = msg.sender === "bot";
          const isPrecedingBotTyping = messages.slice(0, index).some(
            m => m.sender === "bot" && m.id !== "init" && !completedMessageIds.has(m.id)
          );
          if (isPrecedingBotTyping) return null;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
              className={`flex items-end gap-2 ${isBot ? "justify-start" : "justify-end"}`}
            >
              {/* Bot avatar */}
              {isBot && (
                <div className="w-7 h-7 rounded-2xl overflow-hidden border border-zinc-200/60 dark:border-zinc-700/40 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 shrink-0 mb-0.5">
                  <img src="/image/avt7.png" alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className={`flex flex-col gap-1 max-w-[78%] ${isBot ? "items-start" : "items-end"}`}>
                {/* Message bubble */}
                <div
                  className={`relative px-4 py-2.5 text-[13px] leading-[1.55] ${
                    isBot
                      ? "bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-100 rounded-2xl rounded-tl-sm shadow-sm border border-zinc-100/80 dark:border-zinc-700/50"
                      : "bg-[#0071e3] text-white rounded-2xl rounded-tr-sm shadow-sm shadow-blue-500/15"
                  }`}
                >
                  {isBot && !completedMessageIds.has(msg.id) && msg.id !== "init" ? (
                    <TypewriterText
                      text={msg.text}
                      id={msg.id}
                      onComplete={() => setCompletedMessageIds(prev => {
                        const next = new Set(prev);
                        next.add(msg.id);
                        return next;
                      })}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap font-medium">{formatText(msg.text)}</p>
                  )}

                  {/* Therapy navigation button */}
                  {msg.showTherapyButton && (
                    <button
                      type="button"
                      onClick={() => onNavigateToTab?.("therapy")}
                      className="mt-2.5 flex items-center gap-1.5 w-full justify-center py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold rounded-xl transition-all active:scale-95"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      Mở Trị Liệu ngay
                    </button>
                  )}
                </div>

                {/* Meta row: time + voice */}
                <div className={`flex items-center gap-1.5 px-1 ${isBot ? "flex-row" : "flex-row-reverse"}`}>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-medium">
                    {new Date(msg.time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isBot && completedMessageIds.has(msg.id) && (
                    <button
                      onClick={() => handlePlayVoice(msg.id, msg.text)}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 hover:text-indigo-500 transition-colors"
                      title="Nghe"
                    >
                      {playingId === msg.id
                        ? <VolumeX className="w-3 h-3" />
                        : <Volume2 className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Test recommendation card */}
                {isBot && (msg.suggestPhq9 || msg.suggestGad7 || msg.suggestWho5 || msg.suggestBigFive) && (
                  <div className="mt-1 p-3 rounded-2xl rounded-tl-sm bg-amber-50 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-700/30 space-y-2 w-full max-w-[260px]">
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Đề xuất kiểm tra</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Cậu có muốn làm bài đánh giá nhanh để tớ tư vấn chính xác hơn không?
                    </p>
                    <div className="flex flex-col gap-1">
                      {msg.suggestPhq9 && (
                        <button type="button" onClick={() => onStartTest("phq9")}
                          className="w-full py-1.5 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-all active:scale-95">
                          PHQ-9 — Trầm cảm
                        </button>
                      )}
                      {msg.suggestGad7 && (
                        <button type="button" onClick={() => onStartTest("gad7")}
                          className="w-full py-1.5 text-[10px] font-bold bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all active:scale-95">
                          GAD-7 — Lo âu
                        </button>
                      )}
                      {msg.suggestWho5 && (
                        <button type="button" onClick={() => onStartTest("who5")}
                          className="w-full py-1.5 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all active:scale-95">
                          WHO-5 — Hạnh phúc
                        </button>
                      )}
                      {msg.suggestBigFive && (
                        <button type="button" onClick={() => onStartTest("bigfive")}
                          className="w-full py-1.5 text-[10px] font-bold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all active:scale-95">
                          Big Five — Nhân cách
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Journey duration picker */}
                {isBot && msg.isCompanionSetup && !msg.selectedChoice && (
                  <div className="mt-1 p-3 rounded-2xl rounded-tl-sm bg-indigo-50 dark:bg-indigo-950/25 border border-indigo-200/60 dark:border-indigo-700/30 space-y-2 w-full max-w-[260px]">
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Chọn lộ trình</span>
                    </div>
                    <button type="button" onClick={() => onSelectDuration(msg.id, msg.recommendedDays)}
                      className="w-full py-2 text-[11px] font-extrabold bg-[#0071e3] hover:bg-blue-600 text-white rounded-xl transition-all active:scale-95">
                      Đồng ý ({msg.recommendedDays} ngày)
                    </button>
                    <div className="grid grid-cols-3 gap-1">
                      {[7, 14, 30, 50, 90].map(d => (
                        <button key={d} type="button" onClick={() => onSelectDuration(msg.id, d)}
                          className="py-1.5 text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95">
                          {d} ngày
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => onSelectDuration(msg.id, "cancel")}
                      className="w-full py-1.5 text-[10px] font-medium text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                      Để sau
                    </button>
                  </div>
                )}

                {msg.isCompanionSetup && msg.selectedChoice && (
                  <div className="text-[9px] text-zinc-400 font-medium px-2">
                    Đã chọn: {msg.selectedChoice === "cancel" ? "Từ chối" : `${msg.selectedChoice} ngày`}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex items-end gap-2 justify-start"
            >
              <div className="w-7 h-7 rounded-2xl overflow-hidden border border-zinc-200/60 dark:border-zinc-700/40 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/40 dark:to-blue-900/40 shrink-0">
                <img src="/image/avt7.png" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="px-4 py-3 bg-white dark:bg-zinc-800/90 rounded-2xl rounded-tl-sm border border-zinc-100/80 dark:border-zinc-700/50 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            key="scrollbtn"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            type="button"
            onClick={() => { userScrolledUpRef.current = false; scrollToBottom(); }}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-90 transition-colors z-10"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
