import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminSession } from '../../services/authSession';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminPaymentsTab() {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ amount: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getHeaders = () => {
    const session = getAdminSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
    };
  };

  const fetchLinks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/payos/all`, {
        headers: getHeaders(),
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setLinks(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch links', err);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/payos/create`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(formData.amount),
          reason: formData.reason,
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(t('admin.payments.success_create') || 'Tạo link thành công!');
        setFormData({ amount: '', reason: '' });
        fetchLinks();
      } else {
        setError(data.error || 'Lỗi khi tạo link');
      }
    } catch (err) {
      console.error('Submit Error:', err);
      setError((t('admin.payments.error_server') || 'Lỗi kết nối server') + ': ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (linkId) => {
    const url = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(url);
    setSuccess(t('admin.payments.copied') || 'Đã copy link!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Grid: Form & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Creation Form Card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">payments</span>
            {t('admin.payments.form_title')}
          </h3>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-rose-500/10 border border-red-200 dark:border-rose-500/20 text-red-600 dark:text-rose-450 rounded-xl text-xs font-semibold animate-shake">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold animate-fadeIn">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('admin.payments.amount')}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₫</span>
                  <input
                    type="number"
                    required
                    min="2000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs focus:ring-1 focus:ring-primary focus:outline-none transition-all text-slate-800 dark:text-white"
                    placeholder={t('admin.payments.amount_placeholder')}
                  />
                </div>
              </div>

              {/* Description input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('admin.payments.reason')}
                </label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs focus:ring-1 focus:ring-primary focus:outline-none transition-all text-slate-800 dark:text-white"
                  placeholder={t('admin.payments.reason_placeholder')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{t('admin.payments.submit')}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info & Integration Card */}
        <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">info</span>
              Cổng Thanh Toán PayOS
            </h3>
            <ul className="space-y-3 text-[11px] text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span>
                <span>Tự động tạo link thanh toán VietQR chuyển khoản nhanh 24/7.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span>
                <span>Xác minh giao dịch realtime qua Webhook phản hồi tức thời.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5">check_circle</span>
                <span>Mã hóa bảo mật HMAC-SHA256 đầu cuối cực kỳ an toàn.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4 flex items-center justify-between opacity-80">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
            <img src="https://payos.vn/wp-content/uploads/sites/13/2023/07/logo-payos.svg" alt="PayOS" className="h-4 dark:brightness-125" />
          </div>
        </div>
      </div>

      {/* History Table Card */}
      <div className="bg-white dark:bg-[#12111a] rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">history</span>
          {t('admin.payments.history_title')}
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="p-4">{t('admin.payments.table_id')}</th>
                <th className="p-4">{t('admin.payments.table_amount')}</th>
                <th className="p-4">{t('admin.payments.table_reason')}</th>
                <th className="p-4">{t('admin.payments.table_status')}</th>
                <th className="p-4">{t('admin.payments.table_time')}</th>
                <th className="p-4 text-center">{t('admin.payments.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {links.map(link => (
                <tr key={link._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  <td className="p-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {link?.customLinkId || 'N/A'}
                  </td>
                  <td className="p-4 font-bold text-primary dark:text-indigo-400">
                    {(link?.amount || 0).toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                    {link?.reason || ''}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      link?.status === 'PAID' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-450 dark:border-emerald-500/20' 
                        : link?.status === 'CANCELLED' 
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-500/20' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                    }`}>
                      {link?.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-[10px]">
                    {link?.createdAt ? new Date(link.createdAt).toLocaleString('vi-VN') : ''}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => copyToClipboard(link.customLinkId)}
                      className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-lg transition-all"
                      title={t('admin.payments.copy_link')}
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900/40 mb-3 text-slate-400">
                      <span className="material-symbols-outlined text-2xl">inbox</span>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      {t('admin.payments.empty')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
