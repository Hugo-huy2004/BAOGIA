import { useState, useEffect, useRef } from 'react';
import adminBrainApi from '../../services/api/AdminBrainApi';
import { notify } from '../../lib/notify';

export default function AdminBrainTab() {
  const [diagnosing, setDiagnosing] = useState(true);
  const [diagnosisData, setDiagnosisData] = useState(null);

  // Chat Console States
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Chào Quản trị viên! Tôi là BỘ NÃO MÁY TÍNH ADMIN. Tôi đã sẵn sàng hỗ trợ bạn phân tích an ninh, quản lý người dùng, tự động soạn email và đưa ra các quyết định điều hành.'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [sendingPrompt, setSendingPrompt] = useState(false);

  // Quick Ticket Reply Assistant State
  const [ticketIdInput, setTicketIdInput] = useState('');
  const [draftingReply, setDraftingReply] = useState(false);
  const [draftResult, setDraftResult] = useState(null);

  const chatEndRef = useRef(null);

  const fetchDiagnosis = async () => {
    setDiagnosing(true);
    try {
      const res = await adminBrainApi.getDiagnosis();
      setDiagnosisData(res);
    } catch (err) {
      console.error('Error fetching diagnosis:', err);
    } finally {
      setDiagnosing(false);
    }
  };

  useEffect(() => {
    fetchDiagnosis();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendPrompt = async (e) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || sendingPrompt) return;

    const userText = inputPrompt;
    setInputPrompt('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setSendingPrompt(true);

    try {
      const res = await adminBrainApi.sendPrompt(userText);
      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      notify.error(err.message || 'Lỗi xử lý câu lệnh AI Brain');
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '❌ Rất tiếc, đã xảy ra lỗi kết nối với mô hình AI Brain. Vui lòng thử lại.' }
      ]);
    } finally {
      setSendingPrompt(false);
    }
  };

  const handleQuickDraft = async (e) => {
    e.preventDefault();
    if (!ticketIdInput.trim()) return;
    setDraftingReply(true);
    setDraftResult(null);
    try {
      const res = await adminBrainApi.draftTicketReply(ticketIdInput.trim());
      setDraftResult(res);
      notify.success('Đã tự động soạn câu trả lời ticket!');
    } catch (err) {
      notify.error(err.message || 'Lỗi soạn dự thảo phản hồi ticket');
    } finally {
      setDraftingReply(false);
    }
  };

  const metrics = diagnosisData?.metrics || {};

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 dark:from-[#141829] dark:via-[#101426] dark:to-[#0c0e1a] border border-blue-500/30 dark:border-blue-500/20 shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/25 text-blue-300 border border-blue-400/30 text-xs font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Autonomous AI Executive Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-wide">
              ADMIN BỘ NÃO MÁY TÍNH
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Hệ thống trợ lý điều hành tự động cao cấp: Chẩn đoán an toàn thời gian thực, ra quyết định hỗ trợ người dùng, tự động gửi email và quản trị hệ sinh thái JOY.
            </p>
          </div>

          <button
            onClick={fetchDiagnosis}
            disabled={diagnosing}
            className="px-5 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 shrink-0 disabled:opacity-50 active:scale-95"
          >
            <span className={`material-symbols-outlined text-base ${diagnosing ? 'animate-spin' : ''}`}>sync</span>
            <span>{diagnosing ? 'Đang phân tích...' : 'Cập nhật Chẩn đoán'}</span>
          </button>
        </div>
      </div>

      {/* System Health Diagnostic Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Metrics & AI Analysis */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Metrics Overview Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-md">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tổng người dùng</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{(metrics.totalUsers ?? 0).toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-md">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tài khoản bị khóa</div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">{(metrics.lockedUsers ?? 0).toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-md">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Lệnh chặn an ninh</div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{(metrics.activeSecurityBlocks ?? 0).toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-md">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ticket chờ hỗ trợ</div>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">{(metrics.pendingSupportTickets ?? 0).toLocaleString()}</div>
            </div>
          </div>

          {/* AI Executive Analysis Box */}
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">psychology</span> Báo cáo Chẩn đoán AI Thời gian thực
              </h3>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Hệ thống An toàn
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-black/40 border border-slate-200/80 dark:border-white/5 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {diagnosing ? (
                <div className="py-8 text-center text-slate-500 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  <span>Bộ Não AI đang thu thập và phân tích dữ liệu toàn hệ thống...</span>
                </div>
              ) : (
                diagnosisData?.analysis || 'Không có dữ liệu phân tích.'
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Quick Tools */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-500">auto_fix_high</span> Trợ lý Tự động trả lời Ticket
            </h3>
            <form onSubmit={handleQuickDraft} className="space-y-3">
              <input
                type="text"
                placeholder="Nhập ID Ticket hỗ trợ..."
                value={ticketIdInput}
                onChange={(e) => setTicketIdInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                disabled={draftingReply}
                className="w-full py-2.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {draftingReply && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                <span>Soạn Dự Thảo Phản Hồi</span>
              </button>
            </form>

            {draftResult && (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-2 animate-fadeIn">
                <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">Dự thảo phản hồi cho {draftResult.userEmail}:</div>
                <div className="text-xs text-slate-800 dark:text-slate-200 bg-white/80 dark:bg-black/50 p-3 rounded-xl max-h-40 overflow-y-auto whitespace-pre-wrap border border-slate-200 dark:border-white/5">
                  {draftResult.draftReply}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI Executive Chat Console */}
      <div className="p-6 rounded-3xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-500">terminal</span> Executive AI Command Console
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Gemini 2.5 Flash Autonomous Engine</span>
        </div>

        {/* Chat History Messages */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">smart_toy</span>
                </div>
              )}

              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-md'
                    : 'bg-slate-100/90 dark:bg-black/50 text-slate-900 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 rounded-tl-none whitespace-pre-wrap shadow-sm'
                }`}
              >
                {msg.text}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-600/20 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base">person</span>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendPrompt} className="flex gap-3 pt-2">
          <input
            type="text"
            placeholder="Nhập câu hỏi hoặc chỉ thị cho Bộ Não Máy Tính (Ví dụ: 'Phân tích hệ thống hôm nay' hoặc 'Soạn email chào mừng')..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-grow px-5 py-3 rounded-full bg-slate-100/80 dark:bg-black/60 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={sendingPrompt || !inputPrompt.trim()}
            className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {sendingPrompt ? (
              <span className="material-symbols-outlined animate-spin text-base">sync</span>
            ) : (
              <span className="material-symbols-outlined text-base">send</span>
            )}
            <span>Gửi Lệnh</span>
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => setInputPrompt('Phân tích tổng thể sức khỏe hệ thống và an ninh hôm nay')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-[10px] text-slate-700 dark:text-slate-300 font-bold transition-all"
          >
            🔍 Phân tích an ninh hôm nay
          </button>
          <button
            type="button"
            onClick={() => setInputPrompt('Đưa ra đề xuất hạn mức và quy định quản lý ví JOY')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-[10px] text-slate-700 dark:text-slate-300 font-bold transition-all"
          >
            💰 Đề xuất quy định Ví JOY
          </button>
          <button
            type="button"
            onClick={() => setInputPrompt('Kiểm tra danh sách các tài khoản đang chờ phê duyệt')}
            className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-[10px] text-slate-700 dark:text-slate-300 font-bold transition-all"
          >
            📋 Kiểm tra tài khoản chờ duyệt
          </button>
        </div>

      </div>

    </div>
  );
}
