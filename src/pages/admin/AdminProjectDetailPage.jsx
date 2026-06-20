import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { logoutAuth } from '../../services/authSession';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function AdminProjectDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status and Note
  const [statusUpdate, setStatusUpdate] = useState('');
  const [noteUpdate, setNoteUpdate] = useState('');
  const [finalNoteUpdate, setFinalNoteUpdate] = useState('');

  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDateStr, setEndDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [warrantyDays, setWarrantyDays] = useState(30);
  const [developerName, setDeveloperName] = useState('');

  // Status Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

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

  const lastGeneratedTemplateRef = React.useRef('');
  const prevStatusRef = React.useRef('');

  const regenerateTemplate = (start, end, warranty, devName, force = false) => {
    if (!project) return;
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    const diffTime = Math.max(0, endDateObj.getTime() - startDateObj.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 0;
    const totalHours = totalDays * 8; // 8 working hours/day
    
    const formatDate = (dateObj) => {
      if (isNaN(dateObj.getTime())) return '......';
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    
    const startFormatted = formatDate(startDateObj);
    const endFormatted = formatDate(endDateObj);
    
    const warrantyEndDateObj = new Date(endDateObj);
    if (!isNaN(warrantyEndDateObj.getTime())) {
      warrantyEndDateObj.setDate(warrantyEndDateObj.getDate() + Number(warranty));
    }
    const warrantyEndFormatted = formatDate(warrantyEndDateObj);
    
    const handler = devName || project.handlerName || 'Nguyễn Văn A';
    const pkg = project.servicePackage || 'Signature Portfolio';
    
    const logoHtml = `<span style="font-size: 18px; font-family: sans-serif; font-weight: 900; letter-spacing: -0.5px; white-space: nowrap;"><strong style="color: #EF4444;">H</strong><strong style="color: #F97316;">u</strong><strong style="color: #EAB308;">g</strong><strong style="color: #22C55E;">o</strong> <strong style="color: #3B82F6;">S</strong><strong style="color: #6366F1;">t</strong><strong style="color: #A855F7;">u</strong><strong style="color: #EC4899;">d</strong><strong style="color: #06B6D4;">i</strong><strong style="color: #0ea5e9;">o</strong></span>`;

    const template = `<h3><strong>TỔNG KẾT DỰ ÁN</strong></h3>
<p>Dự án <strong>${project.fullName}</strong> được triển khai từ <strong>${startFormatted}</strong> đến <strong>${endFormatted}</strong> với tổng thời gian <strong>${totalHours} giờ (${totalDays} ngày)</strong> do hỗ trợ/lập trình viên <strong>${handler}</strong> đã thực hiện dự án <strong>${project.fullName}</strong> theo yêu cầu.</p>
<br>
<h3><strong>BẢO TRÌ VÀ HỖ TRỢ</strong></h3>
<h4><strong>1. THÔNG TIN BẢO TRÌ:</strong></h4>
<ul>
  <li>Tên gói: <strong>${pkg}</strong></li>
  <li>Thời gian hoàn tất: <strong>${endFormatted}</strong></li>
  <li>Thời gian bảo trì: <strong>${warranty}</strong> ngày từ <strong>${endFormatted}</strong> đến <strong>${warrantyEndFormatted}</strong></li>
  <li>Gồm:
    <ul>
      <li>Sửa lỗi phát sinh trong quá trình vận hành</li>
      <li>Tối ưu hóa hiệu năng và tốc độ tải trang</li>
      <li>Cập nhật bảo mật hệ thống</li>
    </ul>
  </li>
</ul>
<br>
<h4><strong>2. CÁC TRƯỜNG HỢP KHÔNG ĐƯỢC HỖ TRỢ TRONG GÓI</strong></h4>
<ul>
  <li>Tự ý chỉnh sửa mã nguồn cốt lõi làm hỏng cấu trúc hệ thống</li>
  <li>Các yêu cầu thay đổi thiết kế hoặc tính năng mới ngoài thỏa thuận</li>
  <li>Lỗi do máy chủ hoặc nhà cung cấp dịch vụ thứ ba của khách hàng</li>
  <li>Mất dữ liệu do lỗi từ phía người dùng</li>
</ul>
<br>
<h4><strong>3. CÁC MỤC THÊM</strong></h4>
<ul>
  <li>Hỗ trợ hướng dẫn quản trị trực tuyến 1-1</li>
</ul>
<br>
<h4><strong>4. GHI CHÚ VỀ VIỆC HỖ TRỢ VÀ BẢO HÀNH</strong></h4>
<p>Mọi yêu cầu hỗ trợ vui lòng gửi qua phần Yêu Cầu của trang thành viên để được xử lý nhanh nhất.</p>
<br>
<p><strong>Đại Diện Phụ Trách</strong></p>
<p>${logoHtml}</p>
<p><strong>${handler}</strong></p>`;

    if (force || !finalNoteUpdate || finalNoteUpdate === '<p><br></p>' || finalNoteUpdate.trim() === '' || finalNoteUpdate === lastGeneratedTemplateRef.current) {
      setFinalNoteUpdate(template);
      lastGeneratedTemplateRef.current = template;
      localStorage.setItem(`draft_final_note_${project._id}`, template);
    }
  };

  useEffect(() => {
    if (!project) return;

    if (statusUpdate === 'Hoàn tất' && prevStatusRef.current !== 'Hoàn tất' && prevStatusRef.current !== '') {
      regenerateTemplate(startDateStr, endDateStr, warrantyDays, developerName, true);
    }
    else if (statusUpdate === 'Hoàn tất' && prevStatusRef.current === 'Hoàn tất') {
      regenerateTemplate(startDateStr, endDateStr, warrantyDays, developerName, false);
    }

    if (statusUpdate) {
      prevStatusRef.current = statusUpdate;
    }
  }, [statusUpdate, project, startDateStr, endDateStr, warrantyDays, developerName]);

  useEffect(() => {
    fetchProjectDetail();
    fetchMessages();
    markMessagesAsRead();
  }, [id]);

  const markMessagesAsRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${id}/messages/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: 'admin' })
      });
    } catch (err) {
      console.error(err);
    }
  };

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
        setDeveloperName(p.handlerName || '');
      } else {
        showNotification(t("adminProjectDetail.notFound"), 'error');
        setTimeout(() => navigate('/admin/projects'), 1500);
      }
    } catch (err) {
      console.error(err);
      showNotification(t("adminProjectDetail.fetchError"), 'error');
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

  const handleOpenStatusModal = (e) => {
    e.preventDefault();
    if (statusUpdate === project?.status && !noteUpdate && !finalNoteUpdate) {
      showNotification(t("adminProjectDetail.missingUpdate"), 'error');
      return;
    }
    setModalStep(1);
    setPasswordError('');
    setAdminPassword('');
    setShowStatusModal(true);
  };

  const handleConfirmStatus = async () => {
    setIsVerifying(true);
    setPasswordError('');
    try {
      const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/admin/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: adminPassword })
      });
      
      if (!verifyRes.ok) {
        setPasswordError(t("adminProjectDetail.wrongPassword"));
        setIsVerifying(false);
        return;
      }

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
        setModalStep(5);
        fetchProjectDetail(); 
        setNoteUpdate('');
        localStorage.removeItem(`draft_note_${project._id}`);
        setTimeout(() => {
          setShowStatusModal(false);
          showNotification(t("adminProjectDetail.updateSuccess"));
        }, 3000);
      } else {
        setPasswordError(t("adminProjectDetail.updateError"));
      }
    } catch (err) {
      setPasswordError(t("adminProjectDetail.connError"));
    } finally {
      setIsVerifying(false);
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
      showNotification(t("adminProjectDetail.msgError"), 'error');
    }
  };

  const getShareLink = (code) => {
    return `${window.location.origin}/login?portalCode=${code}`;
  };

  const handleCopyLink = () => {
    if (project) {
      navigator.clipboard.writeText(getShareLink(project.loginCode));
      showNotification(t("adminProjectDetail.copySuccess"));
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

  const getHtmlContent = (text) => {
    if (!text) return '';
    if (!/<[a-z][\s\S]*>/i.test(text)) {
      return text.replace(/\n/g, '<br />');
    }
    return text;
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
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-md shadow-lg font-bold text-sm animate-fadeInUp ${
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
            className="w-10 h-10 flex items-center justify-center rounded-md bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-indigo-200 dark:border-indigo-800/50">
                Chi Tiết Dự Án
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white mt-1 leading-tight">{project.fullName}</h1>
            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 mt-1.5">
              <span className="material-symbols-outlined text-sm">vpn_key</span>
              <span className="hidden sm:inline">{t("adminProjectDetail.accessCodeFull")}</span>
              <span className="sm:hidden">{t("adminProjectDetail.accessCodeShort")}</span>
              <span className="font-mono font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/50 flex items-center">
                {project.loginCode}
              </span>
              <button 
                onClick={handleCopyLink}
                className="p-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center"
                title={t("adminProjectDetail.copyTooltip")}
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
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
          <div className="bg-white dark:bg-[#12111a] rounded-md p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <form onSubmit={handleOpenStatusModal} className="bg-slate-50 dark:bg-black/20 p-5 rounded-md border border-slate-200 dark:border-white/5 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("adminProjectDetail.updateProcessTitle")}</h4>
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("adminProjectDetail.newStatusLabel")}</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select value={statusUpdate} onChange={e => setStatusUpdate(e.target.value)} className="w-full sm:flex-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-sm p-3 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="Đang liên hệ">{t("adminProjectDetail.statusOptions.contacting")}</option>
                    <option value="Đang lên thiết kế">{t("adminProjectDetail.statusOptions.designing")}</option>
                    <option value="Đang thực hiện">{t("adminProjectDetail.statusOptions.implementing")}</option>
                    <option value="Đang Kiểm tra">{t("adminProjectDetail.statusOptions.testing")}</option>
                    <option value="Hoàn tất">{t("adminProjectDetail.statusOptions.completed")}</option>
                  </select>
                  <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px]">update</span> {t("adminProjectDetail.updateBtn")}
                  </button>
                </div>
              </div>
            </form>
        </div>

        {/* History Notes */}
        <div className="bg-white dark:bg-[#12111a] rounded-md p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2">{t("adminProjectDetail.historyTitle")}</h4>
          <div className="space-y-4 pl-2 max-h-[300px] overflow-y-auto">
            {project.progressNotes && project.progressNotes.length > 0 ? (
              [...project.progressNotes].reverse().map((note, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 pb-2 last:pb-0">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-400" />
                  <div className="text-[10px] text-slate-400 font-mono mb-1">
                    {new Date(note.createdAt).toLocaleString('vi-VN')}
                  </div>
                  <div className={`text-xs font-bold mb-0.5 ${note.status === 'Hoàn tất' || note.status === 'Hỗ trợ và bảo trì' ? 'text-amber-600 dark:text-amber-500' : 'text-slate-800 dark:text-slate-200'}`}>
                    [{note.status === 'Hoàn tất' || note.status === 'Hỗ trợ và bảo trì' ? 'HỖ TRỢ VÀ BẢO TRÌ' : note.status}]
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: getHtmlContent(note.note) }} />
                </div>
              ))
            ) : (
              <div className="text-[11px] text-slate-400 italic">{t("adminProjectDetail.emptyHistory")}</div>
            )}
          </div>
        </div>
        </div>

        {/* Right Column (Chat) */}
        <div className="lg:col-span-7">
          {/* Chat/Messages */}
          <div className="bg-white dark:bg-[#12111a] rounded-md p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col h-[600px]">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4 shrink-0">
            <span className="material-symbols-outlined text-indigo-500 text-base">forum</span>
              {t("adminProjectDetail.msgTitle")}
            </h3>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 bg-slate-50 dark:bg-black/20 p-4 rounded-md border border-slate-100 dark:border-white/5">
            {messages.length === 0 ? (
              <div className="text-center text-xs text-slate-500 italic py-10">{t("adminProjectDetail.emptyMsg")}</div>
            ) : (
              messages.map((msg, i) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-md text-xs ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'}`}>
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
            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={project.status === 'Hoàn tất' ? t("adminProjectDetail.msgPlaceholderCompleted") : t("adminProjectDetail.msgPlaceholderNormal")} className="flex-1 px-4 py-3 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1f1929] text-slate-800 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <button type="submit" disabled={!newMessage.trim()} className="px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-md transition-all">{t("adminProjectDetail.sendBtn")}</button>
          </form>
          </div>
        </div>
      </div>

      {/* Multi-step Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#12111a] border border-slate-200 dark:border-slate-800 rounded-md w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-black/20 shrink-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-indigo-500 text-[20px]">security_update_good</span>
                  {t("adminProjectDetail.modal.title")}
                </h3>
              {modalStep !== 5 && (
                <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              {modalStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-md">
                    <h4 className="font-bold text-amber-700 dark:text-amber-500 mb-2 flex items-center gap-1 text-sm">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      {t("adminProjectDetail.modal.noticeTitle")}
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {project.status === statusUpdate ? (
                        <>{t("adminProjectDetail.modal.keepStatus")} <strong>{t("adminProjectDetail.modal.keepStatusStrong")}</strong> {project.fullName} {t("adminProjectDetail.modal.keepStatusAnd")}</>
                      ) : (
                        <>{t("adminProjectDetail.modal.changeStatusFrom")} <strong>{project.fullName}</strong> {t("adminProjectDetail.modal.changeStatusTo")} <strong className="text-rose-500">{project.status}</strong> {t("adminProjectDetail.modal.changeStatusInto")} <strong className="text-emerald-500">{statusUpdate}</strong>.</>
                      )}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2">
                      {t("adminProjectDetail.modal.confirmPrompt")}
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowStatusModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">{t("adminProjectDetail.modal.cancelBtn")}</button>
                    <button onClick={() => setModalStep(2)} className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md">{t("adminProjectDetail.modal.confirmBtn")}</button>
                  </div>
                </div>
              )}

              {modalStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t("adminProjectDetail.modal.noteLabel")}</label>
                    <p className="text-xs text-slate-400 mb-2">{t("adminProjectDetail.modal.noteDesc")}</p>
                    <div className="bg-white dark:bg-[#1f1929] rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 [&_.ql-editor]:min-h-[120px]">
                      <ReactQuill theme="snow" value={noteUpdate} onChange={handleNoteChange} modules={quillModules} placeholder={t("adminProjectDetail.modal.notePlaceholder")} className="quill-editor" />
                    </div>
                  </div>
                  
                  {statusUpdate === 'Hoàn tất' && (
                    <div className="space-y-2 mt-4">
                      <label className="block text-xs font-bold text-emerald-500 uppercase tracking-wider">{t("adminProjectDetail.modal.finalNoteLabel")}</label>
                      
                      {/* Configuration Panel for Automation */}
                      <div className="bg-slate-50 dark:bg-[#1a1523] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3 mb-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Cấu Hình Thông Tin Mẫu Bảo Hành & Tổng Kết</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Triển khai từ ngày</label>
                            <input 
                              type="date" 
                              value={startDateStr} 
                              onChange={e => setStartDateStr(e.target.value)} 
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#12111a] text-xs p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Đến ngày (Hoàn tất)</label>
                            <input 
                              type="date" 
                              value={endDateStr} 
                              onChange={e => setEndDateStr(e.target.value)} 
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#12111a] text-xs p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Số ngày bảo trì</label>
                            <input 
                              type="number" 
                              min="1"
                              value={warrantyDays} 
                              onChange={e => setWarrantyDays(Number(e.target.value))} 
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#12111a] text-xs p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Lập trình viên phụ trách</label>
                            <input 
                              type="text" 
                              value={developerName} 
                              onChange={e => setDeveloperName(e.target.value)} 
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-[#12111a] text-xs p-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                              placeholder="Tên lập trình viên"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                          <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold">★ Thay đổi các trường trên sẽ tự động tính toán lại mẫu văn bản bên dưới.</span>
                          <button 
                            type="button"
                            onClick={() => regenerateTemplate(startDateStr, endDateStr, warrantyDays, developerName, true)} 
                            className="text-[9.5px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-lg transition-all active:scale-95 shadow-sm"
                          >
                            Tạo lại mẫu
                          </button>
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-md overflow-hidden border border-emerald-200 dark:border-emerald-800/50 [&_.ql-editor]:min-h-[120px]">
                        <ReactQuill theme="snow" value={finalNoteUpdate} onChange={handleFinalNoteChange} modules={quillModules} placeholder={t("adminProjectDetail.modal.finalNotePlaceholder")} className="quill-editor" />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <button onClick={() => setModalStep(1)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">{t("adminProjectDetail.modal.backBtn")}</button>
                    <button onClick={() => setModalStep(3)} className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-md">{t("adminProjectDetail.modal.checkInfoBtn")}</button>
                  </div>
                </div>
              )}

              {modalStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2">{t("adminProjectDetail.modal.confirmInfoTitle")}</h4>
                  <div className="space-y-4">
                    <div className="py-3 px-4 bg-slate-50 dark:bg-[#1f1929] rounded-md border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-1.5">{t("adminProjectDetail.modal.projectStatusLabel")}</span>
                      {project.status === statusUpdate ? (
                        <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{t("adminProjectDetail.modal.keepSame")} <strong className="text-indigo-500">{project.status}</strong></span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
                          <strong className="text-rose-500">{project.status}</strong>
                          <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_forward</span>
                          <strong className="text-emerald-500">{statusUpdate}</strong>
                        </span>
                      )}
                    </div>
                    <div className="py-3 px-4 bg-slate-50 dark:bg-[#1f1929] rounded-md border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider mb-2">{t("adminProjectDetail.modal.attachedNoteLabel")}</span>
                      {noteUpdate && noteUpdate !== '<p><br></p>' ? (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 bg-white dark:bg-black/20 p-3 rounded border border-slate-100 dark:border-white/5" dangerouslySetInnerHTML={{ __html: getHtmlContent(noteUpdate) }} />
                      ) : (
                        <span className="text-slate-400 italic text-sm">{t("adminProjectDetail.modal.noNote")}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                    <button onClick={() => setModalStep(2)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">{t("adminProjectDetail.modal.editBtn")}</button>
                    <button onClick={() => setModalStep(4)} className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-md flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      {t("adminProjectDetail.modal.confirmCorrectBtn")}
                    </button>
                  </div>
                </div>
              )}

              {modalStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-200 dark:border-indigo-800/50">
                      <span className="material-symbols-outlined text-3xl text-indigo-600 dark:text-indigo-400">admin_panel_settings</span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{t("adminProjectDetail.modal.securityTitle")}</h4>
                    <p className="text-xs text-slate-500 mt-1">{t("adminProjectDetail.modal.securityDesc")}</p>
                  </div>
                  
                  <div className="space-y-2 max-w-xs mx-auto">
                    <input 
                      type="password" 
                      value={adminPassword}
                      onChange={e => {setAdminPassword(e.target.value); setPasswordError('');}}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && adminPassword && !isVerifying) {
                          e.preventDefault();
                          handleConfirmStatus();
                        }
                      }}
                      placeholder={t("adminProjectDetail.modal.passwordPlaceholder")} 
                      className="w-full px-4 py-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1f1929] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-widest"
                      autoFocus
                    />
                    {passwordError && <p className="text-rose-500 text-xs font-bold text-center mt-1">{passwordError}</p>}
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <button onClick={() => setModalStep(3)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md" disabled={isVerifying}>{t("adminProjectDetail.modal.backBtn")}</button>
                    <button onClick={handleConfirmStatus} disabled={!adminPassword || isVerifying} className="px-6 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-md shadow-md flex items-center gap-2">
                      {isVerifying ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">lock_open</span>
                      )}
                      {t("admin.texts.txt_224")}
                    </button>
                  </div>
                </div>
              )}

              {modalStep === 5 && (
                <div className="space-y-4 text-center py-8 animate-fadeIn">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce border border-emerald-200 dark:border-emerald-800/50">
                    <span className="material-symbols-outlined text-4xl text-emerald-600 dark:text-emerald-400">task_alt</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white">{t("adminProjectDetail.modal.successTitle")}</h4>
                  <p className="text-sm text-slate-500">{t("adminProjectDetail.modal.successDesc")}</p>
                  <p className="text-xs text-slate-400 mt-4 italic">{t("adminProjectDetail.modal.autoClose")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
