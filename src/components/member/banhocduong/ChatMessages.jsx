import React from "react";
import TypewriterText from "./TypewriterText";

export default function ChatMessages({
  messages,
  completedMessageIds,
  setCompletedMessageIds,
  onStartTest,
  onSelectDuration,
  loading
}) {
  return (
    <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none pb-4">
      {messages.map((msg) => {
        const isBot = msg.sender === "bot";
        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 w-full max-w-[90%] ${
              isBot ? "mr-auto" : "ml-auto flex-row-reverse"
            }`}
          >
            {isBot && (
              <div className="md:hidden w-7 h-7 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white shrink-0">
                <img src="/image/avt7.png" alt="Mascot" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="space-y-2 flex-1">
              <div
                className={`relative p-3.5 rounded-2xl border-2 text-xs leading-relaxed ${
                  isBot
                    ? "bg-white dark:bg-[#1a1924] border-zinc-950 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)]"
                    : "bg-[#0071e3] border-[#0051bb] text-white rounded-tr-none shadow-[3px_3px_0px_0px_rgba(0,0,0,0.15)]"
                }`}
              >
                {isBot && (
                  <div className="absolute left-[-8px] top-[1px] w-0 h-0 border-t-[8px] border-t-zinc-950 dark:border-t-zinc-800 border-l-[8px] border-l-transparent after:content-[''] after:absolute after:left-[2px] after:top-[-6px] after:w-0 after:h-0 after:border-t-[6px] after:border-t-white dark:after:border-t-[#1a1924] after:border-l-[6px] after:border-l-transparent" />
                )}
                
                {isBot && !completedMessageIds.has(msg.id) && msg.id !== "init" ? (
                  <TypewriterText
                    text={msg.text}
                    id={msg.id}
                    onComplete={() => {
                      setCompletedMessageIds((prev) => {
                        const next = new Set(prev);
                        next.add(msg.id);
                        return next;
                      });
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap font-semibold">{msg.text}</p>
                )}
                <span className="block text-[7.5px] font-black uppercase tracking-wider mt-1.5 opacity-60">
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {isBot && (msg.suggestPhq9 || msg.suggestGad7 || msg.suggestWho5 || msg.suggestBigFive) && (
                <div className="p-3.5 rounded-2xl border-2 border-zinc-950 dark:border-zinc-800 bg-amber-500/5 dark:bg-amber-500/10 space-y-2.5 max-w-xs shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] animate-scaleUp">
                  <div className="flex gap-1.5 text-amber-600 dark:text-amber-400 items-center">
                    <span className="material-symbols-outlined text-sm font-black">medical_services</span>
                    <span className="text-[9px] font-black uppercase tracking-wider">Chỉ định kiểm tra</span>
                  </div>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-350 leading-relaxed font-bold">
                    Tôi nhận thấy một số biểu hiện cho thấy em đang gặp căng thẳng hoặc áp lực. Em có muốn thực hiện bài đánh giá nhanh để tôi có thể đưa ra tư vấn chính xác hơn không?
                  </p>
                  <div className="flex flex-col gap-1 pt-1">
                    {msg.suggestPhq9 && (
                      <button
                        type="button"
                        onClick={() => onStartTest("phq9")}
                        className="w-full py-1.5 bg-red-500 hover:bg-red-650 text-white font-black text-[8.5px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        [PHQ-9] Trầm cảm (3 phút)
                      </button>
                    )}
                    {msg.suggestGad7 && (
                      <button
                        type="button"
                        onClick={() => onStartTest("gad7")}
                        className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-650 text-white font-black text-[8.5px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        [GAD-7] Lo âu (2 phút)
                      </button>
                    )}
                    {msg.suggestWho5 && (
                      <button
                        type="button"
                        onClick={() => onStartTest("who5")}
                        className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-650 text-white font-black text-[8.5px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        [WHO-5] Hạnh phúc (1 phút)
                      </button>
                    )}
                    {msg.suggestBigFive && (
                      <button
                        type="button"
                        onClick={() => onStartTest("bigfive")}
                        className="w-full py-1.5 bg-indigo-500 hover:bg-indigo-650 text-white font-black text-[8.5px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        [Big Five] Nhân cách
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isBot && msg.isCompanionSetup && !msg.selectedChoice && (
                <div className="p-3.5 rounded-2xl border-2 border-zinc-950 dark:border-zinc-800 bg-white dark:bg-[#1a1924] space-y-2.5 max-w-xs shadow-[3px_3px_0px_0px_rgba(9,9,11,1)] animate-scaleUp">
                  <div className="flex gap-1.5 text-indigo-600 dark:text-indigo-400 items-center">
                    <span className="material-symbols-outlined text-sm font-black">favorite</span>
                    <span className="text-[9px] font-black uppercase tracking-wider">Chọn số ngày đồng hành</span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectDuration(msg.id, msg.recommendedDays)}
                      className="w-full py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                    >
                      Đồng ý lộ trình ({msg.recommendedDays} ngày)
                    </button>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[7, 14, 30, 50, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => onSelectDuration(msg.id, d)}
                          className="py-1.5 bg-zinc-150 hover:bg-zinc-250 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black text-[8px] uppercase tracking-wider rounded-lg transition-all"
                        >
                          {d} ngày
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectDuration(msg.id, "cancel")}
                      className="w-full py-1.5 border border-zinc-300 dark:border-zinc-800 text-zinc-500 font-black text-[8.5px] uppercase tracking-wider rounded-lg transition-all"
                    >
                      Để sau, hiện tại em chưa cần
                    </button>
                  </div>
                </div>
              )}

              {msg.isCompanionSetup && msg.selectedChoice && (
                <div className="p-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 text-[9px] font-black uppercase tracking-wider text-center max-w-xs">
                  Đã chọn: {msg.selectedChoice === "cancel" ? "Từ chối" : `${msg.selectedChoice} ngày`}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="flex gap-2.5 max-w-[85%] mr-auto animate-pulse">
          <div className="p-3.5 bg-white dark:bg-[#1a1924] border-2 border-zinc-950 dark:border-zinc-850 rounded-2xl rounded-tl-none shadow-[2px_2px_0px_0px_rgba(9,9,11,1)] flex items-center gap-1">
            <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}
