import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminSession } from '../../services/authSession';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminPaymentsTab() {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ amount: '', reason: '' });
  const [displayAmount, setDisplayAmount] = useState(''); // Handles formatted dots display
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState('');

  const generateRandomCode = (prefix = 'HUGO') => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomPart}`;
  };

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
    // Fill in a default unique code on mount
    setFormData(prev => ({ ...prev, reason: generateRandomCode() }));
    fetchLinks();
  }, []);

  const formatAmount = (value) => {
    if (!value) return '';
    const cleanNumber = value.replace(/\D/g, '');
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const cleanValue = rawValue.replace(/\D/g, '');
    
    // Limits max digits to 12 to prevent input overflow
    if (cleanValue.length > 12) return;
    
    const formatted = formatAmount(cleanValue);
    setDisplayAmount(formatted);
    setFormData(prev => ({ ...prev, amount: cleanValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const numericAmount = Number(formData.amount);
    if (!numericAmount || numericAmount < 2000) {
      setError('Số tiền tối thiểu phải là 2.000 đ');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payos/create`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          amount: numericAmount,
          reason: formData.reason.toUpperCase(),
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(t('admin.payments.success_create') || 'Tạo link thành công!');
        setFormData({ amount: '', reason: generateRandomCode() }); // Reset with a new code
        setDisplayAmount(''); // Clear display amount
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
    setCopiedLinkId(linkId);
    toast.success(t('admin.payments.copied') || 'Đã copy link!', {
      style: {
        background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
        borderRadius: '12px',
        border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
      }
    });
    setTimeout(() => {
      setCopiedLinkId('');
    }, 2000);
  };

  const handleDeleteLink = async (customLinkId) => {
    const loadId = toast.loading('Đang xử lý hủy giao dịch...');
    try {
      const response = await fetch(`${API_BASE_URL}/payos/cancel/${customLinkId}`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Hủy và xóa giao dịch thành công!', {
          id: loadId,
          style: {
            background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
            borderRadius: '12px',
            border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
          }
        });
        fetchLinks();
      } else {
        toast.error(data.error || 'Lỗi khi hủy giao dịch', {
          id: loadId,
          style: {
            background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
            borderRadius: '12px',
            border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
          }
        });
      }
    } catch (err) {
      console.error('Delete Link Error:', err);
      toast.error('Lỗi kết nối khi hủy giao dịch: ' + (err.message || ''), {
        id: loadId,
        style: {
          background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
          borderRadius: '12px',
          border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
        }
      });
    }
  };

  const confirmDeleteLink = (customLinkId) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-rose-555 dark:text-rose-400 text-lg mt-0.5 animate-pulse">warning</span>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">Xác Nhận Hủy</h4>
            <p className="text-[10.5px] font-semibold text-slate-500 dark:text-zinc-450 mt-0.5 leading-relaxed whitespace-normal">
              Bạn có chắc chắn muốn hủy và xóa hoàn toàn link thanh toán này khỏi hệ thống không? Khách hàng sẽ không thể thanh toán được nữa.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-zinc-800/80 pt-2.5">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            Bỏ qua
          </button>
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              handleDeleteLink(customLinkId);
            }}
            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all"
          >
            Xác nhận Hủy
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
      style: {
        background: document.documentElement.classList.contains('dark') ? '#12111a' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#e4e4e7' : '#1f2937',
        borderRadius: '16px',
        border: '1px solid ' + (document.documentElement.classList.contains('dark') ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
        maxWidth: '350px',
        padding: '12px'
      }
    });
  };

  const suggestions = [
    { label: 'Thanh toán Profile', prefix: 'PROFILE' },
    { label: 'Dịch vụ thiết kế', prefix: 'THIETKE' },
    { label: 'Gia hạn gói', prefix: 'GIAHAN' },
    { label: 'Mã mặc định', prefix: 'HUGO' }
  ];

  const applySuggestion = (prefix) => {
    setFormData(prev => ({ ...prev, reason: generateRandomCode(prefix) }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Grid: Form & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Creation Form Card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#12111a] rounded-[22px] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-5">
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
                    type="text"
                    required
                    value={displayAmount}
                    onChange={handleAmountChange}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs focus:outline-none input-premium-focus transition-all text-slate-800 dark:text-white font-bold"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs focus:outline-none input-premium-focus transition-all text-slate-800 dark:text-white font-mono uppercase font-bold"
                  placeholder={t('admin.payments.reason_placeholder')}
                />
                {/* Suggested quick tags */}
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applySuggestion(item.prefix)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-700/60 text-[8px] sm:text-[9px] font-bold text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200/40 dark:border-slate-750/30 transition-colors uppercase tracking-tight"
                    >
                      + {item.label}
                    </button>
                  ))}
                </div>
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
        <div className="bg-white dark:bg-[#12111a] rounded-[22px] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">info</span>
              Cổng Thanh Toán PayOS
            </h3>
            <ul className="space-y-3 text-[11px] text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5 animate-pulse-soft">check_circle</span>
                <span>Tự động tạo link thanh toán VietQR chuyển khoản nhanh 24/7.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5 animate-pulse-soft">check_circle</span>
                <span>Xác minh giao dịch realtime qua Webhook phản hồi tức thời.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-emerald-500 text-sm mt-0.5 animate-pulse-soft">check_circle</span>
                <span>Mã hóa bảo mật HMAC-SHA256 đầu cuối cực kỳ an toàn.</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-800/60 pt-4 flex items-center justify-between opacity-80">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Powered by</span>
            <img src="https://payos.vn/wp-content/uploads/2025/06/Casso-payOSLogo-1.svg" alt="PayOS" className="h-4 dark:brightness-125" />
          </div>
        </div>
      </div>

      {/* History Table Card */}
      <div className="bg-white dark:bg-[#12111a] rounded-[22px] border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">history</span>
          {t('admin.payments.history_title')}
        </h3>

        <div className="overflow-x-auto rounded-[18px] border border-slate-100 dark:border-slate-800/80">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80">
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
                <tr key={link._id} className="table-row-floating hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-all">
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
                    {link?.status === 'PAID' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse-dot-green"></span>
                        {link?.status}
                      </span>
                    ) : link?.status === 'CANCELLED' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-red-50 text-red-700 border-red-200 dark:bg-rose-500/10 dark:text-rose-455 dark:border-rose-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-550 mr-1.5"></span>
                        {link?.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse-dot-amber"></span>
                        {link?.status}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 text-[10px]">
                    {link?.createdAt ? new Date(link.createdAt).toLocaleString('vi-VN') : ''}
                  </td>
                  <td className="p-4 text-center flex items-center justify-center gap-1">
                    <button
                      onClick={() => copyToClipboard(link.customLinkId)}
                      className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-lg transition-all"
                      title={t('admin.payments.copy_link')}
                    >
                      <span className="material-symbols-outlined text-base">
                        {copiedLinkId === link.customLinkId ? 'check' : 'content_copy'}
                      </span>
                    </button>
                    <button
                      onClick={() => confirmDeleteLink(link.customLinkId)}
                      className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-550 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-lg transition-all"
                      title="Hủy & Xóa giao dịch khỏi hệ thống"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
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
