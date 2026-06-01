import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

const generateId = () => Math.random().toString(36).substr(2, 6);

export default function MemberSecretLinkTab({ bio, publicLink, showToast, onBack, setFormData, handleSave }) {
  const { t } = useTranslation();
  
  // Extract secretLinks from bio or fallback to empty array
  const secretLinks = bio?.secretLinks || [];

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({
    title: "",
    url: "",
    password: ""
  });

  const handleOpenForm = (link = null) => {
    if (link) {
      setForm({
        title: link.title,
        url: link.url,
        password: link.password
      });
      setEditingId(link.id);
    } else {
      if (secretLinks.length >= 5) {
        if (showToast) showToast("Bạn chỉ được tạo tối đa 5 link bảo mật!", "warning");
        return;
      }
      setForm({ title: "", url: "", password: "" });
      setEditingId(null);
    }
    setIsEditing(true);
  };

  const handleCloseForm = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSaveLink = () => {
    if (!form.url.trim() || !form.password.trim()) {
      if (showToast) showToast("Vui lòng nhập Link Đích và Mật Khẩu!", "warning");
      return;
    }
    
    // Auto add https:// if missing
    let finalUrl = form.url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    let updatedLinks = [...secretLinks];
    
    if (editingId) {
      updatedLinks = updatedLinks.map(link => 
        link.id === editingId ? { ...link, ...form, url: finalUrl } : link
      );
    } else {
      updatedLinks.push({
        id: generateId(),
        title: form.title.trim() || "Link Bí Mật",
        url: finalUrl,
        password: form.password.trim(),
        visits: 0
      });
    }

    const newData = { ...bio, secretLinks: updatedLinks };
    setFormData(newData);
    if (handleSave) handleSave(null, newData);

    handleCloseForm();
  };

  const handleDeleteLink = (id) => {
    const updatedLinks = secretLinks.filter(link => link.id !== id);
    const newData = { ...bio, secretLinks: updatedLinks };
    setFormData(newData);
    if (handleSave) handleSave(null, newData);
  };

  const copySecretLink = (id) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareLink = `${origin}/s/${bio?.slug}/${id}`;
    navigator.clipboard.writeText(shareLink);
    if (showToast) showToast("Đã sao chép Link Chia Sẻ!", "success");
  };

  return (
    <div className="bg-white dark:bg-[#12111a] rounded-[2rem] p-6 lg:p-8 border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-6">
      <SubUtilityHeader 
        title="Khóa Link Bảo Mật" 
        icon="lock" 
        colorClass="text-zinc-800 dark:text-zinc-200" 
        onBack={onBack}
      />
      
      {!isEditing ? (
        <div className="space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 border border-zinc-200/60 dark:border-zinc-800/80">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Về tính năng này
            </h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              Bạn có thể tạo một đường dẫn đặc biệt yêu cầu khách hàng nhập đúng mật khẩu mới được chuyển hướng tới trang đích (Google Drive, bộ ảnh riêng tư, tài liệu nội bộ). Giới hạn tối đa 5 link.
            </p>
          </div>

          <div className="space-y-3">
            {secretLinks.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <span className="material-symbols-outlined text-4xl text-zinc-300 dark:text-zinc-700 mb-2">lock_open</span>
                <p className="text-xs text-zinc-500 font-medium">Bạn chưa tạo Link Bảo Mật nào.</p>
              </div>
            ) : (
              secretLinks.map((link, index) => (
                <div key={link.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1824] gap-4 transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-zinc-600 dark:text-zinc-400">link</span>
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-zinc-800 dark:text-zinc-200 mb-0.5 flex items-center gap-2">
                        {link.title || `Secret Link #${index + 1}`}
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {link.visits || 0} lượt xem
                        </span>
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate max-w-[200px] sm:max-w-[300px]">Đích: {link.url}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button 
                      onClick={() => copySecretLink(link.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                      title="Copy Share Link"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <button 
                      onClick={() => handleOpenForm(link)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                      title="Sửa"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteLink(link.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 transition-colors"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button
            onClick={() => handleOpenForm()}
            disabled={secretLinks.length >= 5}
            className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              secretLinks.length >= 5 
                ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed" 
                : "bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black shadow-md active:scale-[0.98]"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Thêm Link Mới ({secretLinks.length}/5)
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider pl-1">Tên Nhãn (Hiển thị cho bạn)</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="VD: Kho ảnh hậu trường"
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider pl-1">Link Đích (Target URL) <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={form.url}
                onChange={(e) => setForm({...form, url: e.target.value})}
                placeholder="VD: https://drive.google.com/..."
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider pl-1">Mật Khẩu <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                placeholder="Nhập mật khẩu để mở khóa"
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all font-medium"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCloseForm}
              className="py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1824] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-black text-[11px] uppercase tracking-widest transition-colors"
            >
              Hủy Bỏ
            </button>
            <button
              onClick={handleSaveLink}
              className="py-4 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-black font-black text-[11px] uppercase tracking-widest shadow-md transition-transform active:scale-[0.98]"
            >
              {editingId ? "Cập Nhật" : "Tạo Mới"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
