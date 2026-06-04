import React, { useState, useEffect, useRef } from "react";
import psychologyService from "../../../services/classes/PsychologyService";

export default function ChatTab({ onNavigateToTab }) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "bot",
      text: "Chào cậu thương mến, mình là Bạn Học Đường - góc lắng nghe và đồng hành sẻ chia áp lực học đường của cậu. Ở đây chúng mình hoàn toàn bảo mật và không phán xét. Dạo gần đây việc học tập, thi cử hay cuộc sống của cậu thế nào? Cậu có muốn trút bỏ bớt gánh nặng lòng mình với tớ không?",
      time: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  useEffect(() => {
    const pendingRaw = localStorage.getItem("banhocduong_pending_report");
    if (pendingRaw) {
      try {
        const data = JSON.parse(pendingRaw);
        let reportText = "";
        let recommendedDays = 20;
        let recommendedName = "Hành trình Vun đắp Bình yên";

        if (data.test === "dass42") {
          const { D, A, S } = data.scores;
          const devInterp = data.severities.D;
          const anxInterp = data.severities.A;
          const strInterp = data.severities.S;

          reportText = `Tớ đã ghi nhận kết quả trắc nghiệm lâm sàng DASS-42 của cậu:\n` +
            `• Trầm cảm: ${D}/42 điểm (Mức độ: ${devInterp})\n` +
            `• Lo âu: ${A}/42 điểm (Mức độ: ${anxInterp})\n` +
            `• Căng thẳng: ${S}/42 điểm (Mức độ: ${strInterp})\n\n` +
            `Dựa trên các chỉ số này, Bạn Học Đường đề xuất lộ trình chăm sóc thích ứng khoa học nhất dành riêng cho tình trạng hiện tại của cậu.`;

          const isExtremelySevere = D >= 28 || A >= 20 || S >= 34;
          const isSevere = D >= 21 || A >= 15 || S >= 26;
          const isModerate = D >= 14 || A >= 10 || S >= 19;

          if (isExtremelySevere) {
            recommendedDays = 90;
            recommendedName = "Hành trình Đồng hành Chuyên sâu (Intensive Companion)";
          } else if (isSevere) {
            recommendedDays = 50;
            recommendedName = "Hành trình Phục hồi Thấu cảm (Compassionate Recovery)";
          } else if (isModerate) {
            recommendedDays = 30;
            recommendedName = "Hành trình Tái tạo Cân bằng (Balance Program)";
          }
        } else if (data.test === "mmpi30") {
          const elevatedCount = data.clinical.filter(c => c.score >= 65).length;
          reportText = `Tớ đã ghi nhận báo cáo nhân cách lâm sàng Mini-MMPI của cậu:\n` +
            `• Độ tin cậy kiểm định L-F-K: ${data.isReliable ? "Đạt chuẩn tin cậy" : "Chưa đạt chuẩn tin cậy"}\n` +
            `• Số chỉ số nhạy cảm vượt ngưỡng cảnh báo: ${elevatedCount}/10 thang đo\n\n` +
            `Dựa trên bản đồ nhân cách này, Bạn Học Đường đề xuất lộ trình chăm sóc thích ứng khoa học nhất dành riêng cho tình trạng hiện tại của cậu.`;

          if (elevatedCount >= 5) {
            recommendedDays = 90;
            recommendedName = "Hành trình Đồng hành Chuyên sâu (Intensive Companion)";
          } else if (elevatedCount >= 3) {
            recommendedDays = 50;
            recommendedName = "Hành trình Phục hồi Thấu cảm (Compassionate Recovery)";
          } else if (elevatedCount >= 1) {
            recommendedDays = 30;
            recommendedName = "Hành trình Tái tạo Cân bằng (Balance Program)";
          }
        }

        const analysisMsg = {
          id: `bot-report-${Date.now()}`,
          sender: "bot",
          text: reportText,
          time: new Date()
        };

        const proposalMsg = {
          id: `bot-proposal-${Date.now()}`,
          sender: "bot",
          text: `Để đồng hành cùng cậu tốt nhất, tớ khuyên chúng mình nên bật chế độ Chăm sóc Tinh thần. Tớ đề xuất **${recommendedName} (${recommendedDays} ngày)** để cùng cậu phục hồi. Cậu thấy thời gian này có phù hợp không, hay cậu mong muốn tự chọn số ngày đồng hành?`,
          time: new Date(),
          isCompanionSetup: true,
          recommendedDays
        };

        setMessages(prev => [...prev, analysisMsg, proposalMsg]);
        localStorage.removeItem("banhocduong_pending_report");
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSelectDuration = (msgId, duration) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, selectedChoice: duration };
      }
      return m;
    }));

    if (typeof duration === "number") {
      localStorage.setItem("banhocduong_healing_mode", "active");
      localStorage.setItem("banhocduong_healing_duration", duration.toString());
      localStorage.setItem("banhocduong_healing_start_date", new Date().toISOString());
      localStorage.setItem("banhocduong_last_checkin_date", "");
      
      const userMsg = {
        id: `user-select-${Date.now()}`,
        sender: "user",
        text: `Tớ chọn kích hoạt lộ trình đồng hành ${duration} ngày.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: `Tuyệt vời! Tớ đã thiết lập lộ trình **${duration} ngày** cho cậu. Kể từ lần đăng nhập sau, Bạn Học Đường sẽ luôn đồng hành nhắc nhở cậu check-in cảm xúc và hướng dẫn các liệu pháp điều hòa thích hợp nhé. Cố lên cậu nha! 💖`,
        time: new Date()
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
    } else {
      const userMsg = {
        id: `user-select-${Date.now()}`,
        sender: "user",
        text: `Tớ chọn không kích hoạt chế độ đồng hành lúc này.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: `Tớ hiểu rồi. Cậu có thể tự do trải nghiệm các tiện ích như hít thở, giải tỏa hay tâm sự bất cứ lúc nào cậu cần nhé. Chúc cậu một ngày thật nhẹ nhàng! ✨`,
        time: new Date()
      };
      setMessages(prev => [...prev, userMsg, botMsg]);
    }
  };

  const suggestions = [
    "Áp lực chạy deadline đồ án quá tải",
    "Cảm giác mệt mỏi, mất ngủ liên miên",
    "Bất đồng với bố mẹ và gia đình",
    "Cảm thấy cô đơn, lạc lõng ở giảng đường"
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      time: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await psychologyService.sendChatMessage(text.trim(), historyPayload);
      
      if (response.suggestDass || response.suggestMmpi) {
        const currentCount = parseInt(localStorage.getItem("banhocduong_chat_distress_count") || "0", 10);
        localStorage.setItem("banhocduong_chat_distress_count", (currentCount + 1).toString());

        // Log chat anomaly to history
        try {
          const raw = localStorage.getItem("banhocduong_history");
          const historyLogs = raw ? JSON.parse(raw) : [];
          
          const matchedTriggers = [];
          const words = text.toLowerCase();
          psychologyService.dassIndicators.forEach(ind => {
            if (words.includes(ind)) matchedTriggers.push(ind);
          });
          psychologyService.mmpiIndicators.forEach(ind => {
            if (words.includes(ind)) matchedTriggers.push(ind);
          });

          historyLogs.push({
            date: new Date().toISOString(),
            type: "chat_anomaly",
            text: text.trim().substring(0, 60) + (text.length > 60 ? "..." : ""),
            triggers: matchedTriggers.length > 0 ? matchedTriggers : ["mệt mỏi / bất ổn"]
          });
          localStorage.setItem("banhocduong_history", JSON.stringify(historyLogs));
        } catch (e) {
          console.error(e);
        }
      }

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: response.reply,
        time: new Date(),
        suggestDass: response.suggestDass,
        suggestMmpi: response.suggestMmpi
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        sender: "bot",
        text: "Có chút gián đoạn kết nối, cậu nói lại được không?",
        time: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSend(suggestion);
  };

  return (
    <div className="flex flex-col h-[520px] justify-between animate-fadeIn">
      {/* Welcomer banner */}
      <div className="px-5 py-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-b border-zinc-200/40 dark:border-zinc-800/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg animate-pulse">psychology</span>
          </div>
          <div>
            <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-150 uppercase tracking-wider">Trợ Lý Bạn Học Đường</h4>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Lắng nghe & chẩn đoán học đường</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Kết nối bảo mật
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0 scrollbar-none bg-[#fbfbfd]/30 dark:bg-black/5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 max-w-[85%] sm:max-w-[75%] ${
              msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {msg.sender === "bot" && (
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 text-sm">
                <span className="material-symbols-outlined text-[16px]">psychology</span>
              </div>
            )}
            
            <div className="space-y-2">
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  msg.sender === "user"
                    ? "bg-[#0071e3] text-white rounded-tr-none font-medium"
                    : "bg-white dark:bg-[#1c1b22] text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-800/40 rounded-tl-none font-medium"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className={`block text-[8px] mt-1 select-none font-bold uppercase tracking-wider ${
                  msg.sender === "user" ? "text-white/60 text-right" : "text-zinc-400"
                }`}>
                  {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Inline Distress Recommendation Cards */}
              {msg.sender === "bot" && (msg.suggestDass || msg.suggestMmpi) && (
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3 shadow-sm max-w-sm animate-scaleUp">
                  <div className="flex gap-2 text-amber-600 dark:text-amber-400">
                    <span className="material-symbols-outlined text-sm font-black">warning</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">Bạn Học Đường ghi nhận dấu hiệu</span>
                  </div>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-350 leading-relaxed font-semibold">
                    Mình nhận thấy những dấu hiệu mỏi mệt hoặc áp lực trong chia sẻ vừa rồi của cậu. Hãy thử làm nhanh trắc nghiệm lâm sàng để có góc nhìn khoa học nhất nhé:
                  </p>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {msg.suggestDass && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab("tests", "dass")}
                        className="w-full py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        Làm trắc nghiệm DASS-21 (3 phút)
                      </button>
                    )}
                    {msg.suggestMmpi && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab("tests", "mmpi")}
                        className="w-full py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                      >
                        Khảo sát Mini-MMPI (2 phút)
                      </button>
                    )}
                  </div>
                </div>
              )}

              {msg.isCompanionSetup && !msg.selectedChoice && (
                <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 space-y-3 shadow-sm max-w-sm animate-scaleUp">
                  <div className="flex gap-2 text-indigo-600 dark:text-indigo-400">
                    <span className="material-symbols-outlined text-sm font-black">favorite</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">Kích hoạt lộ trình đồng hành</span>
                  </div>
                  <p className="text-[10px] text-zinc-650 dark:text-zinc-350 leading-relaxed font-semibold">
                    Hãy lựa chọn thời gian đồng hành mà cậu cảm thấy phù hợp nhất dưới đây để Bạn Học Đường bắt đầu chế độ hỗ trợ:
                  </p>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectDuration(msg.id, msg.recommendedDays)}
                      className="w-full py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                    >
                      Đồng ý lộ trình đề xuất ({msg.recommendedDays} ngày)
                    </button>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[20, 30, 50, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleSelectDuration(msg.id, d)}
                          className="py-1.5 bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-black text-[8.5px] uppercase tracking-wider rounded-lg transition-all"
                        >
                          Lộ trình {d} ngày
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectDuration(msg.id, "cancel")}
                      className="w-full py-1.5 border border-zinc-300 dark:border-zinc-850 text-zinc-550 dark:text-zinc-450 font-black text-[8.5px] uppercase tracking-wider rounded-lg transition-all"
                    >
                      Để sau, chưa muốn đồng hành lúc này
                    </button>
                  </div>
                </div>
              )}
              
              {msg.isCompanionSetup && msg.selectedChoice && (
                <div className="p-3.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 bg-zinc-55/30 dark:bg-zinc-950/20 text-zinc-450 dark:text-zinc-500 text-[9px] font-black uppercase tracking-wider text-center">
                  Đã ghi nhận lựa chọn: {msg.selectedChoice === "cancel" ? "Không kích hoạt" : `${msg.selectedChoice} ngày`}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto animate-pulse">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 text-sm">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
            </div>
            <div className="p-3.5 bg-white dark:bg-[#1c1b22] border border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && !loading && (
        <div className="px-4 py-3 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-250/20 dark:border-zinc-800/20 flex flex-wrap gap-2 shrink-0 select-none">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#0071e3] text-[9.5px] font-black text-zinc-550 dark:text-zinc-400 hover:text-[#0071e3] transition-all active:scale-95 shadow-sm uppercase tracking-wide"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border-t border-zinc-200/50 dark:border-zinc-800/50 flex gap-2.5 items-center shrink-0"
      >
        <input
          type="text"
          placeholder="Chia sẻ lo toan, bài tập, gia đình hay bất cứ điều gì khiến cậu mệt mỏi..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#16151c] text-xs text-zinc-850 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder-zinc-400 font-semibold"
        />
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="w-10 h-10 rounded-2xl bg-[#0071e3] hover:bg-[#0077ed] text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95 shrink-0"
        >
          <span className="material-symbols-outlined text-sm font-black">send</span>
        </button>
      </form>
    </div>
  );
}
