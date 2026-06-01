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
      setError('Lỗi kết nối server');
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
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Tạo Link Chuyển Khoản (PayOS)</h3>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-emerald-50 text-emerald-500 rounded-lg text-sm">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Số tiền (VNĐ)</label>
            <input
              type="number"
              required
              min="2000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="VD: 50000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lý do chuyển khoản</label>
            <input
              type="text"
              required
              maxLength={25}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Tối đa 25 ký tự"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang tạo...' : 'Tạo Link'}
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-lg font-bold mb-4">Danh sách Link đã tạo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="p-3">Mã Link</th>
                <th className="p-3">Số tiền</th>
                <th className="p-3">Lý do</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {links.map(link => (
                <tr key={link._id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="p-3 font-mono">{link.customLinkId}</td>
                  <td className="p-3 font-semibold">{link.amount.toLocaleString()} đ</td>
                  <td className="p-3">{link.reason}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      link.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                      link.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {link.status}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-500">{new Date(link.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <button
                      onClick={() => copyToClipboard(link.customLinkId)}
                      className="text-blue-500 hover:text-blue-700 font-medium"
                    >
                      Copy Link
                    </button>
                  </td>
                </tr>
              ))}
              {links.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-zinc-500">Chưa có link nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
