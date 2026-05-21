import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logoutAuth } from '../services/authSession';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AdminProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status and Note
  const [statusUpdate, setStatusUpdate] = useState('');
  const [noteUpdate, setNoteUpdate] = useState('');
  const [finalNoteUpdate, setFinalNoteUpdate] = useState('');

  // Messages
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Notifications
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showNotification = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    fetchProjectDetail();
    fetchMessages();
  }, [id]);

  const fetchProjectDetail = async () => {
    try {
      // First verify admin
      const adminRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/data/admin`, {
        credentials: 'include'
      });
      if (adminRes.status === 401 || adminRes.status === 403) {
        await logoutAuth();
        navigate('/login');
        return;
      }

      // Then fetch project
      // Wait, there's no GET /api/customer-projects/:id in backend yet. Let's fetch all and filter, or just use the list.
      // But we can just use GET /api/customer-projects and find by id for now, as it requires admin anyway.
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      const p = data.find(item => item._id === id);
      if (p) {
        setProject(p);
        setStatusUpdate(p.status);
        setNoteUpdate(localStorage.getItem(`draft_note_${p._id}`) || '');
        setFinalNoteUpdate(localStorage.getItem(`draft_final_note_${p._id}`) || p.finalNote || '');
      } else {
        showNotification('Không tìm thấy dự án', 'error');
        setTimeout(() => navigate('/admin/projects'), 1500);
      }
    } catch (err) {
      console.error(err);
      showNotification('Lỗi lấy dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${id}/messages`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNoteChange = (content) => {
    setNoteUpdate(content);
    if (project) localStorage.setItem(`draft_note_${project._id}`, content);
  };

  const handleFinalNoteChange = (content) => {
    setFinalNoteUpdate(content);
    if (project) localStorage.setItem(`draft_final_note_${project._id}`, content);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${project._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          status: statusUpdate, 
          note: noteUpdate,
          finalNote: finalNoteUpdate 
        })
      });
      if (res.ok) {
        showNotification('Cập nhật trạng thái thành công!');
        fetchProjectDetail(); // re-fetch to get updated project
        setNoteUpdate('');
        localStorage.removeItem(`draft_note_${project._id}`);
      }
    } catch (err) {
      showNotification('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${project._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sender: 'admin', message: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      showNotification('Lỗi gửi tin nhắn', 'error');
    }
  };

  const getShareLink = (code) => {
    return `${window.location.origin}/login?portalCode=${code}`;
  };

  const handleCopyLink = () => {
    if (project) {
      navigator.clipboard.writeText(getShareLink(project.loginCode));
      showNotification('Đã copy link Portal của khách!');
    }
  };

  // Custom CSS for Quill content in global index.css or inline
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0b0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0a0f] text-slate-800 dark:text-slate-100 p-4 md:p-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg font-bold text-sm animate-fadeInUp ${
          toastType === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/projects')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-indigo-200 dark:border-indigo-800/50">
                Chi Tiết Dự Án
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mt-1">{project.fullName}</h1>
            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-sm">vpn_key</span>
              Mã truy cập Khách Hàng: 
              <span className="font-mono font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 rounded-md border border-amber-200 dark:border-amber-800/50">
                {project.loginCode}
              </span>
              <button 
                onClick={handleCopyLink}
                className="p-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center"
                title="Copy link gửi khách hàng"
              >
                <span className="material-symbols-outlined text-[14px]">share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Status Updater & History) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Updater */}
          <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <form onSubmit={handleUpdateStatus} className="bg-slate-50 dark:bg-black/20 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Cập nhật tiến trình dự án</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Trạng Thái</label>
                <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-850 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="Đang liên hệ">Đang liên hệ</option>
                  <option value="Đang lên thiết kế">Đang lên thiết kế</option>
                  <option value="Đang thực hiện">Đang thực hiện</option>
                  <option value="Đang Kiểm tra">Đang Kiểm tra</option>
                  <option value="Hoàn tất">Hoàn tất</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-450 uppercase tracking-wider">Ghi chú tiến trình (Gửi cho khách hàng)</label>
              <div className="bg-white dark:bg-[#1f1929] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <ReactQuill theme="snow" value={noteUpdate} onChange={handleNoteChange} modules={quillModules} placeholder="Ghi chú cập nhật tiến độ cho khách hàng..." className="quill-editor" />
              </div>
            </div>

            {statusUpdate === 'Hoàn tất' && (
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Note Tổng Kết & Bảo Hành (Sẽ hiển thị vĩnh viễn trên portal khách)</label>
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800/50">
                  <ReactQuill theme="snow" value={finalNoteUpdate} onChange={handleFinalNoteChange} modules={quillModules} placeholder="Nội dung chi tiết toàn bộ dự án, thời gian bảo dưỡng, thời gian hoàn tất..." className="quill-editor" />
                </div>
              </div>
            )}

            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">update</span> Lưu Cập Nhật
            </button>
          </form>
        </div>

        {/* History Notes */}
        <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2">Lịch sử cập nhật tiến trình</h4>
          <div className="space-y-4 pl-2 max-h-[300px] overflow-y-auto">
            {project.progressNotes && project.progressNotes.length > 0 ? (
              [...project.progressNotes].reverse().map((note, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 pb-2 last:pb-0">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-400" />
                  <div className="text-[10px] text-slate-400 font-mono mb-1">
                    {new Date(note.createdAt).toLocaleString('vi-VN')}
                  </div>
                  <div className={`text-xs font-bold mb-0.5 ${note.status === 'Hoàn tất' ? 'text-amber-600 dark:text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    [{note.status === 'Hoàn tất' ? 'Bảo Trì' : note.status}]
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: note.note }} />
                </div>
              ))
            ) : (
              <div className="text-[11px] text-slate-400 italic">Chưa có lịch sử cập nhật.</div>
            )}
          </div>
        </div>
        </div>

        {/* Right Column (Chat) */}
        <div className="lg:col-span-7">
          {/* Chat/Messages */}
          <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col h-[600px]">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4 shrink-0">
            <span className="material-symbols-outlined text-indigo-500 text-base">forum</span>
            Tin nhắn yêu cầu từ khách hàng
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
            {messages.length === 0 ? (
              <div className="text-center text-xs text-slate-500 italic py-10">Chưa có tin nhắn nào</div>
            ) : (
              messages.map((msg, i) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                      <div className={`text-[9px] mt-1 text-right ${isAdmin ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(msg.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 shrink-0">
            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={project.status === 'Hoàn tất' ? "Nhắn lại bảo trì cho khách hàng..." : "Nhắn lại cho khách hàng..."} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1f1929] text-slate-850 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <button type="submit" disabled={!newMessage.trim()} className="px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all">Gửi</button>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
