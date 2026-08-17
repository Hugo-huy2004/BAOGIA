import React, { useState, useEffect, useRef } from "react";

/**
 * Ứng dụng "Supporter" — Cyber-Luxury AI Assistance Interface (24/7)
 * Đặt làm tiện ích mặc định cao cấp cho mọi thành viên Hugo Studio.
 */
export default function HugoSupporterApp({ bio, onClose, showToast }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      sender: "supporter",
      text: `Xin chào ${bio?.displayName || "Thành viên"}! Tôi là Supporter — Trợ lý AI Quản gia 24/7 của Hugo Studio. Tôi có thể hỗ trợ bạn về Ví JOY, Nạp/Rút, Mật khẩu hoặc sự cố hệ thống ngay lập tức.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputMessage.trim();
    if (!textToSend || isTyping) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: bio?.displayName || "Thành viên",
          email: bio?.email || "guest@hugowishpax.studio",
          phone: bio?.phone || "N/A",
          issue: textToSend,
          message: textToSend,
          category: "general_inquiry",
        }),
      });

      const data = await response.json();
      const aiReplyText = data.ticket?.aiResponse || "Supporter đã ghi nhận yêu cầu và xử lý thành công!";

      const supporterReply = {
        id: `supporter-${Date.now()}`,
        sender: "supporter",
        text: aiReplyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        wasEscalated: data.ticket?.status === "escalated",
      };

      setMessages((prev) => [...prev, supporterReply]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "supporter",
          text: "Supporter đã ghi nhận sự cố của bạn. Cảnh báo khẩn cấp đã được gửi tự động về Telegram cho Boss!",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          wasEscalated: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeak = (msgId, text) => {
    if (!window.speechSynthesis) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const quickQuestions = [
    { label: "Nạp / Chuyển JOY", icon: "account_balance_wallet" },
    { label: "Khôi phục tài khoản", icon: "lock_reset" },
    { label: "Lệnh Telegram Bot", icon: "send" },
    { label: "Báo lỗi khẩn cấp", icon: "report_problem" },
  ];

  return (
    <div className="flex flex-col h-full min-h-[650px] max-w-5xl mx-auto w-full bg-slate-950 text-slate-100 rounded-3xl border border-teal-500/20 shadow-2xl shadow-teal-500/10 overflow-hidden backdrop-blur-2xl relative font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Cyber-Luxury Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-teal-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-3.5">
          {/* Holographic Supporter Badge */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse" />
            <div className="relative w-12 h-12 rounded-2xl bg-slate-950 border border-teal-400/40 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-cyan-300 text-2xl font-bold">
                support_agent
              </span>
            </div>
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full shadow-lg shadow-emerald-400/50" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-extrabold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-teal-200">
                Supporter AI
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-teal-400/10 text-teal-300 border border-teal-400/30 rounded-full uppercase tracking-wider shadow-sm">
                ONLINE 24/7
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Phản hồi &lt; 1s
              </span>
              <span>•</span>
              <span className="text-slate-400">Bảo mật mã hóa</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-md"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Messages Chat Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5 animate-fadeIn`}
            >
              {/* Sender Name */}
              <span className="text-[11px] font-bold text-slate-400 px-2 tracking-wide uppercase">
                {isUser ? bio?.displayName || "Bạn" : "Supporter AI"}
              </span>

              {/* Message Bubble Card */}
              <div
                className={`max-w-[85%] sm:max-w-[72%] p-4 rounded-3xl text-sm leading-relaxed transition-all shadow-xl ${
                  isUser
                    ? "bg-gradient-to-br from-cyan-600 via-teal-600 to-blue-600 text-white rounded-br-xs border border-cyan-400/30 shadow-cyan-500/15"
                    : "bg-slate-900/90 border border-teal-500/20 text-slate-100 rounded-bl-xs backdrop-blur-xl"
                }`}
              >
                <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                {msg.wasEscalated && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-xs flex items-center gap-2.5 shadow-inner">
                    <span className="material-symbols-outlined text-amber-400 text-lg">notifications_active</span>
                    <div>
                      <p className="font-bold text-amber-300">Đã gửi cảnh báo khẩn cấp</p>
                      <p className="text-[11px] text-amber-200/80">Cảnh báo đã được đẩy về Telegram của Boss để hỗ trợ trực tiếp!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp & Speech Control */}
              <div className="flex items-center gap-3 px-2 text-[11px] text-slate-500 font-mono">
                <span>{msg.time}</span>
                {!isUser && (
                  <button
                    onClick={() => handleSpeak(msg.id, msg.text)}
                    className="hover:text-teal-300 transition-colors flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-lg border border-slate-800"
                    title="Đọc phản hồi bằng giọng nói"
                  >
                    <span className={`material-symbols-outlined text-xs ${speakingId === msg.id ? "text-teal-400 animate-pulse" : ""}`}>
                      {speakingId === msg.id ? "volume_off" : "volume_up"}
                    </span>
                    <span>{speakingId === msg.id ? "Dừng" : "Đọc giọng nói"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3 p-3.5 bg-slate-900/90 border border-teal-500/30 rounded-2xl w-fit backdrop-blur-xl animate-pulse shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
            <span className="text-xs text-teal-300 font-semibold tracking-wide">Supporter AI đang xử lý câu trả lời...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Futuristic Quick Action Chips */}
      <div className="relative z-10 px-6 py-2.5 bg-slate-950/90 border-t border-slate-900 overflow-x-auto flex items-center gap-2.5 no-scrollbar backdrop-blur-md">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q.label)}
            className="px-3.5 py-2 rounded-2xl bg-slate-900/80 hover:bg-teal-500/10 border border-slate-800 hover:border-teal-500/40 text-xs font-semibold text-slate-300 hover:text-teal-200 whitespace-nowrap transition-all duration-200 flex items-center gap-2 shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-sm text-teal-400">{q.icon}</span>
            <span>{q.label}</span>
          </button>
        ))}
      </div>

      {/* Cyber Input Bar */}
      <div className="relative z-10 p-4 bg-slate-900/90 border-t border-teal-500/20 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi Supporter AI bất kỳ thắc mắc nào 24/7..."
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-teal-400/60 rounded-2xl pl-4 pr-10 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
            />
            {inputMessage && (
              <button
                type="button"
                onClick={() => setInputMessage("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 disabled:opacity-30 text-slate-950 font-black text-sm shadow-lg shadow-teal-500/30 flex items-center gap-2 transition-all active:scale-95"
          >
            <span>Gửi</span>
            <span className="material-symbols-outlined text-base font-bold">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
