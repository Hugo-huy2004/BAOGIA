import React, { useState } from 'react';

export default function CustomerProfileTab({ project, setProject }) {
  const [formData, setFormData] = useState({
    fullName: project.fullName || '',
    phone: project.phone || '',
    birthday: project.customerProfile?.birthday || '',
    email: project.customerProfile?.email || '',
    address: project.customerProfile?.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isCompleted = project.status === 'Hoàn tất';

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isCompleted) return;
    
    setLoading(true);
    setSuccess(false);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/customer-projects/${project._id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const updatedProject = await res.json();
      setProject(updatedProject);
      sessionStorage.setItem('customerProject', JSON.stringify(updatedProject));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#12111a] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800/80 shadow-sm max-w-2xl mx-auto">
      <div className="mb-6 space-y-1">
        <h2 className="text-lg font-bold text-slate-850 dark:text-white">Thông tin cá nhân</h2>
        <p className="text-xs text-slate-500">Cập nhật thông tin liên hệ để chúng tôi hỗ trợ tốt nhất.</p>
        {isCompleted && (
          <div className="mt-2 text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg font-medium">
            Dự án đã hoàn tất, không thể thay đổi thông tin.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Họ và Tên</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/25 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Số điện thoại</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/25 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Email liên hệ</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/25 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Ngày sinh</label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              disabled={isCompleted}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/25 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">Địa chỉ</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={isCompleted}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/25 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs disabled:opacity-50"
          />
        </div>

        {!isCompleted && (
          <div className="pt-4 flex items-center justify-between">
            {success && <span className="text-xs font-bold text-emerald-500">Đã cập nhật thành công!</span>}
            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center gap-2"
            >
              {loading ? 'Đang lưu...' : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Lưu Thông Tin
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
