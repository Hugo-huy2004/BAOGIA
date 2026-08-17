import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import adminBrainApi from '../../services/api/AdminBrainApi';
import { notify } from '../../lib/notify';
import { formatJoyDual, formatJoyCompact } from '../../utils/joyFormatter';

const EMPTY_FORM = {
  name: '', description: '', priceJoy: '', category: 'general', stock: -1, imageUrl: '',
  productType: 'general', extendDays: '', tokenType: 'chat', tokenAmount: '', radioMinutes: ''
};

const PRODUCT_TYPE_META = {
  general: { icon: 'redeem', label: 'Thông thường', color: 'emerald' },
  system_validity: { icon: 'event_available', label: 'Gia hạn HSD', color: 'amber' },
  psy_study_tokens: { icon: 'psychology', label: 'Token Psy-Study', color: 'indigo' },
  radio_time: { icon: 'radio', label: 'Phút Radio', color: 'cyan' }
};

export default function AdminUtilityStoreTab() {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('products'); // products | orders
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [refundingId, setRefundingId] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pRes, oRes] = await Promise.all([
        adminBrainApi.getStoreProducts(),
        adminBrainApi.getStoreOrders(100)
      ]);
      setProducts(pRes.products || []);
      setOrders(oRes.orders || []);
    } catch (err) {
      notify.error(err.message || 'Lỗi khi tải dữ liệu Cửa hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.priceJoy) {
      return notify.error('Tên sản phẩm và Giá JOY là bắt buộc');
    }
    setSaving(true);
    try {
      if (editingId) {
        await adminBrainApi.updateStoreProduct(editingId, form);
        notify.success('Đã cập nhật sản phẩm thành công');
      } else {
        await adminBrainApi.createStoreProduct(form);
        notify.success('Đã tạo mới sản phẩm Store');
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
      fetchAllData();
    } catch (err) {
      notify.error(err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const startEditProduct = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name || '',
      description: p.description || '',
      priceJoy: p.priceJoy || '',
      category: p.category || 'general',
      stock: p.stock !== undefined ? p.stock : -1,
      imageUrl: p.imageUrl || '',
      productType: p.productType || 'general',
      extendDays: p.extendDays || '',
      tokenType: p.tokenType || 'chat',
      tokenAmount: p.tokenAmount || '',
      radioMinutes: p.radioMinutes || ''
    });
  };

  const handleToggleActive = async (p) => {
    try {
      const res = await adminBrainApi.toggleStoreProduct(p._id);
      notify.success(res.message || 'Đã đổi trạng thái sản phẩm');
      fetchAllData();
    } catch (err) {
      notify.error(err.message || 'Lỗi khi thao tác');
    }
  };

  const handleCancelAndRefund = async (orderId) => {
    setRefundingId(orderId);
    try {
      const res = await adminBrainApi.cancelAndRefundStoreOrder(orderId);
      notify.success(res.message || 'Đã hủy đơn hàng và hoàn tiền JOY');
      fetchAllData();
    } catch (err) {
      notify.error(err.message || 'Lỗi khi hủy đơn & hoàn tiền JOY');
    } finally {
      setRefundingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return (
      (o.purchaseCode && o.purchaseCode.toLowerCase().includes(q)) ||
      (o.email && o.email.toLowerCase().includes(q)) ||
      (o.productName && o.productName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Sub-tab Capsule */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-500">storefront</span>
            <span>Trung tâm Quản lý Cửa hàng Utility Store</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quản lý kho sản phẩm, định giá JOY và hủy đơn hoàn tiền 1-click cho thành viên.
          </p>
        </div>

        {/* Subtab Segmented Capsule */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('products')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeSubTab === 'products'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            <span>Danh mục Sản phẩm ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('orders')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
              activeSubTab === 'orders'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            <span>Đơn hàng &amp; Hoàn JOY ({orders.length})</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: PRODUCTS MANAGEMENT */}
      {activeSubTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Creator Column */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
            <form onSubmit={handleSubmitProduct} className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-500">{editingId ? 'edit' : 'add_circle'}</span>
                  <span>{editingId ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'}</span>
                </span>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}
                    className="text-[10px] text-rose-500 font-bold hover:underline"
                  >
                    Hủy sửa
                  </button>
                )}
              </h4>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Gói Gia hạn 30 Ngày"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Mô tả ngắn</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mở rộng thời gian sử dụng tài khoản"
                  value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Giá JOY cơ sở *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ví dụ: 1000"
                    value={form.priceJoy}
                    onChange={(e) => setForm(p => ({ ...p, priceJoy: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-amber-600 dark:text-amber-400 text-xs font-black outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {form.priceJoy && !isNaN(Number(form.priceJoy)) && (
                    <div className="text-[10px] text-amber-600 font-bold ml-2">
                      = {formatJoyDual(Number(form.priceJoy))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Số lượng kho (-1 vô hạn)</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Product Type Picker */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">Loại sản phẩm (Tính năng tự động)</label>
                <select
                  value={form.productType}
                  onChange={(e) => setForm(p => ({ ...p, productType: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="general">Thông thường (Quà tặng/Dịch vụ)</option>
                  <option value="system_validity">Gia hạn HSD Tài khoản (Bio.expiresAt)</option>
                  <option value="psy_study_tokens">Token Psy-Study (Chat/Call)</option>
                  <option value="radio_time">Phút phát Radio (Member Radio)</option>
                </select>
              </div>

              {form.productType === 'system_validity' && (
                <div className="space-y-1 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300">Số ngày gia hạn thêm (extendDays)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ví dụ: 30"
                    value={form.extendDays}
                    onChange={(e) => setForm(p => ({ ...p, extendDays: e.target.value }))}
                    className="w-full px-4 py-2 rounded-full bg-white dark:bg-black/40 border border-amber-500/30 text-xs font-bold outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {saving && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
                <span>{editingId ? 'Lưu thay đổi sản phẩm' : 'Tạo mới sản phẩm'}</span>
              </button>
            </form>
          </div>

          {/* Product Roster Grid Column */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Danh sách Sản phẩm Cửa hàng ({products.length})
            </h4>

            {loading ? (
              <div className="py-12 text-center text-slate-500 gap-2 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                <span>Đang tải danh sách sản phẩm...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="py-12 text-center text-slate-500 italic">Chưa có sản phẩm nào.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((p) => {
                  const meta = PRODUCT_TYPE_META[p.productType] || PRODUCT_TYPE_META.general;
                  return (
                    <div
                      key={p._id}
                      className={`p-5 rounded-3xl border transition-all space-y-3 shadow-sm ${
                        p.active
                          ? 'bg-white/70 dark:bg-white/5 border-slate-200/80 dark:border-white/10'
                          : 'bg-slate-100/40 dark:bg-white/[0.02] border-slate-200/40 dark:border-white/5 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-purple-500 text-xl">{meta.icon}</span>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white text-xs">{p.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{meta.label}</div>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.active ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-slate-500/20 text-slate-600 dark:text-slate-400'
                        }`}>
                          {p.active ? 'Bật' : 'Ẩn'}
                        </span>
                      </div>

                      {p.description && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{p.description}</p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-white/5 text-xs">
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {formatJoyDual(p.priceJoy)}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          Kho: {p.stock === -1 ? 'Vô hạn' : p.stock}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="flex-1 py-1.5 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white text-[10px] font-bold transition-all"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p)}
                          className={`flex-1 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                            p.active
                              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/30'
                          }`}
                        >
                          {p.active ? 'Ẩn sản phẩm' : 'Bật kích hoạt'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ORDERS & 1-CLICK JOY REFUND */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex items-center justify-between gap-4">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tra cứu Đơn hàng Mua sắm ({filteredOrders.length}/{orders.length})
            </div>
            <input
              type="text"
              placeholder="Tìm theo mã mua hàng, email..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="px-4 py-2 rounded-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 w-64"
            />
          </div>

          <div className="rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-slate-500 gap-2 flex items-center justify-center">
                <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                <span>Đang tải danh sách đơn hàng...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs italic">Chưa có đơn hàng nào phù hợp.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/60 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-white/10 font-black uppercase tracking-widest text-[9px]">
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4">Mã Mua Hàng</th>
                      <th className="px-6 py-4">Người dùng</th>
                      <th className="px-6 py-4">Sản phẩm</th>
                      <th className="px-6 py-4">Giá JOY</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 font-medium">
                    {filteredOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-[11px] text-slate-500 font-mono">
                          {new Date(o.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-white">
                          {o.purchaseCode}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {o.email}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                          {o.productName}
                        </td>
                        <td className="px-6 py-4 font-mono font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {formatJoyDual(o.priceJoy)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            o.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {o.status === 'cancelled' ? 'Đã hủy & Hoàn JOY' : 'Thành công'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {o.status !== 'cancelled' ? (
                            <button
                              type="button"
                              onClick={() => handleCancelAndRefund(o._id)}
                              disabled={refundingId === o._id}
                              className="px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                              {refundingId === o._id ? 'Đang hoàn tiền...' : 'Hủy đơn & Hoàn JOY'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Đã hoàn tiền</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
