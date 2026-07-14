import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function CustomerRequestsTab({ project }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const isCompleted = project.status === 'Hoàn tất';

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${project._id}/messages`, {
        credentials: 'include'
      });
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();
    // Polling every 10 seconds for new messages
    const interval = setInterval(() => {
      fetchMessages();
    }, 10000);
    return () => clearInterval(interval);
  }, [project._id]);

  const markMessagesAsRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${project._id}/messages/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'customer' })
      });
      // Fire an event to update badge immediately if possible
      window.dispatchEvent(new Event('messagesRead'));
    } catch (err) {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${project._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: newMessage })
      });
      const data = await res.json();
      setMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white dark:bg-background rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col h-[600px] max-w-4xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 relative">
            <span className="material-symbols-outlined">support_agent</span>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#12111a] rounded-full"></span>
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">{project.handlerName || t("customerPortal.requests.supportTitle")}</h3>
            <p className="text-[10px] text-slate-500">{t("customerPortal.requests.supportSubtitle")}</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-black/20">
        {loading ? (
          <div className="text-center text-xs text-slate-400 py-4">{t("customerPortal.requests.loading")}</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-slate-400 py-10 flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-4xl opacity-50">forum</span>
            {t("customerPortal.requests.empty")}
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender === 'customer';
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm border border-slate-100 dark:border-white/5'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.message}</div>
                  <div className={`text-[9px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-background shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isCompleted ? t("customerPortal.requests.placeholderCompleted") : t("customerPortal.requests.placeholderNormal")}
            className={`flex-1 px-4 py-3 rounded-full border border-border/50 bg-slate-50 dark:bg-black/25 text-foreground focus:outline-none focus:ring-1 text-sm ${isCompleted ? 'focus:ring-amber-500' : 'focus:ring-indigo-500'}`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className={`w-11 h-11 rounded-full text-white flex items-center justify-center transition-all shrink-0 ${isCompleted ? 'bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700'}`}
          >
            <span className="material-symbols-outlined text-[20px] ml-1">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
