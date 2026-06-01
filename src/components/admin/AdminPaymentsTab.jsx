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
        headers: getHeaders()
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
        body: JSON.stringify({
          amount: Number(formData.amount),
          reason: formData.reason,
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess('Tạo link thành công!');
        setFormData({ amount: '', reason: '' });
        fetchLinks();
      } else {
        setError(data.error || 'Lỗi khi tạo link');
      }
    } catch (err) {
      console.error('Submit Error:', err);
      setError('Lỗi kết nối server: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (linkId) => {
    const url = `${window.location.origin}/pay/${linkId}`;
    navigator.clipboard.writeText(url);
    setSuccess('Đã copy link!');
    setTimeout(() => setSuccess(''), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header / Form Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-8 sm:p-12 shadow-2xl text-white">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-6 shadow-inner ring-1 ring-white/20">
            <span className="material-icons-round text-4xl text-blue-100">payments</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight">{t('admin.payments.form_title')}</h2>
          <p className="text-blue-100/80 mb-10 text-lg">{t('admin.payments.reason_placeholder')}</p>

          {error && <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white rounded-xl text-sm font-medium animate-shake">{error}</div>}
          {success && <div className="mb-6 p-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-white rounded-xl text-sm font-medium animate-fade-in">{success}</div>}

          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-inner ring-1 ring-white/20 text-left space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-50">{t('admin.payments.amount')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200 font-medium">₫</span>
                  <input
                    type="number"
                    required
                    min="2000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all outline-none"
                    placeholder={t('admin.payments.amount_placeholder')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-blue-50">{t('admin.payments.reason')}</label>
                <input
                  type="text"
                  required
                  maxLength={25}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all outline-none"
                  placeholder={t('admin.payments.reason_placeholder')}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-blue-600 hover:bg-blue-50 hover:shadow-lg rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.99] shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{t('admin.payments.submit')}</span>
                  <span className="material-icons-round text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="material-icons-round text-blue-500">history</span>
            {t('admin.payments.history_title')}
          </h3>
        </div>
        <div className="overflow-x-auto rounded-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50/80 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 font-medium">
              <tr>
                <th className="p-4">{t('admin.payments.table_id')}</th>
                <th className="p-4">{t('admin.payments.table_amount')}</th>
                <th className="p-4">{t('admin.payments.table_reason')}</th>
                <th className="p-4">{t('admin.payments.table_status')}</th>
                <th className="p-4">{t('admin.payments.table_time')}</th>
                <th className="p-4 text-center">{t('admin.payments.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {links.map(link => (
                <tr key={link._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4 font-mono text-xs">{link?.customLinkId || 'N/A'}</td>
                  <td className="p-4 font-bold text-blue-600 dark:text-blue-400">{(link?.amount || 0).toLocaleString()} ₫</td>
                  <td className="p-4">{link?.reason || ''}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                      link?.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      link?.status === 'CANCELLED' ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400' :
                      'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                      {link?.status || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-4 text-zinc-500 dark:text-zinc-400 text-xs">
                    {link?.createdAt ? new Date(link.createdAt).toLocaleString() : ''}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => copyToClipboard(link.customLinkId)}
                      className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all group"
                      title={t('admin.payments.copy_link')}
                    >
                      <span className="material-icons-round text-lg group-active:scale-90 transition-transform">content_copy</span>
                    </button>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 text-zinc-400">
                      <span className="material-icons-round text-3xl">inbox</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t('admin.payments.empty')}</p>
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
