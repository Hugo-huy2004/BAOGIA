import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const HBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! Tôi là H-Bot, trợ lý hỗ trợ trực tuyến của Hugo Studio. Bạn cần tôi giải đáp thắc mắc gì về việc tạo Bio Link, đặt lịch chụp ảnh, gói dịch vụ hay tích hợp đối tác không?',
      time: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(true);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Only show H-Bot in MemberPortal
  const isMemberPage = location.pathname.startsWith('/member');

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  if (!isMemberPage) return null;

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      time: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Keep up to 10 latest messages for context history
      const historyContext = messages
        .slice(-10)
        .map(msg => ({ sender: msg.sender, text: msg.text }));

      const res = await fetch(`${import.meta.env.VITE_API_URL}/support/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMsg.text,
          history: historyContext
        })
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      
      let botReply = data.reply || 'Xin lỗi bạn, hệ thống của tôi đang bận xử lý. Bạn vui lòng thử lại sau nhé.';
      const shouldRedirect = botReply.includes('[REDIRECT_TO_SUPPORT]');

      // Clean the redirect tag from visible response
      if (shouldRedirect) {
        botReply = botReply.replace('[REDIRECT_TO_SUPPORT]', '').trim();
        if (!botReply) {
          botReply = 'Tôi hiểu bạn muốn gặp nhân viên hỗ trợ trực tiếp. Tôi sẽ chuyển bạn đến trang điền yêu cầu hỗ trợ ngay lập tức.';
        }
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botReply,
        time: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

      if (shouldRedirect) {
        setIsLoading(false);
        setTimeout(() => {
          setIsOpen(false);
          navigate('/support-request');
        }, 1800);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'Rất tiếc, đã xảy ra lỗi kết nối với máy chủ AI. Bạn hãy thử bấm nút "Hỗ trợ 1-1" bên dưới để gửi yêu cầu trực tiếp cho đội ngũ kỹ thuật nhé!',
          time: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowBadge(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end">
      {/* Floating Chat Box */}
      {isOpen && (
        <div className="mb-4 w-[360px] max-w-[calc(100vw-32px)] h-[500px] max-h-[calc(100vh-120px)] bg-white/90 dark:bg-[#12111a]/95 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl overflow-hidden flex flex-col animate-fadeIn select-none">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl overflow-hidden flex items-center justify-center backdrop-blur-sm relative border border-white/10">
                <img src="/image/avt5.png" alt="H-Bot" className="w-full h-full object-cover" />
                {/* Active Indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-indigo-600 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">H-Bot Studio</h4>
                <p className="text-[10px] text-indigo-100 flex items-center gap-1">
                  Trợ lý ảo hỗ trợ 24/7
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/10">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/40 dark:border-slate-800/40">
                    <img src="/image/avt5.png" alt="H-Bot" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {/* AI Loading indicator */}
            {isLoading && (
              <div className="flex gap-2 max-w-[85%] mr-auto">
                <div className="w-7 h-7 bg-slate-100 dark:bg-slate-800/50 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/40 dark:border-slate-800/40">
                  <img src="/image/avt5.png" alt="H-Bot" className="w-full h-full object-cover" />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/50 bg-white/60 dark:bg-slate-950/20 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/support-request');
              }}
              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-100/60 dark:border-indigo-900/60 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 rounded-full shrink-0 flex items-center gap-1 transition-all"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              <span className="material-symbols-outlined text-xs">support_agent</span>
              Hỗ trợ 1-1 (Zalo)
            </button>
            
            <button
              onClick={() => {
                setInputText("Cách tạo Bio Link như thế nào?");
              }}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300 rounded-full shrink-0 transition-all"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              Cách tạo Bio Link?
            </button>
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950 flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl text-xs focus:outline-none focus:border-indigo-500/80 dark:focus:border-indigo-500/80 transition-colors text-slate-800 dark:text-slate-100 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="w-9 h-9 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:opacity-40 shadow-md shadow-indigo-600/20 shrink-0"
              style={{ minWidth: 0, minHeight: 0 }}
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="group relative w-14 h-14 rounded-full overflow-visible transition-all duration-300 hover:-translate-y-0.5 select-none hover:scale-105 active:scale-95"
          style={{ minWidth: 0, minHeight: 0 }}
        >
          {/* Inner Avatar Container (No border, transparent background, simple shadow) */}
          <div className="w-full h-full rounded-full overflow-hidden shadow-lg border-0 bg-transparent relative">
            <img src="/image/avt5.png" alt="H-Bot" className="w-full h-full object-cover" />
          </div>
          
          {/* Notification Badge */}
          {showBadge && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white dark:border-[#12111a] animate-pulse" />
          )}
        </button>
      )}
    </div>
  );
};

export default HBot;
