import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminSession } from '../../services/authSession';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const EMPTY_FORM = {
  name: '', description: '', priceJoy: '', icon: 'redeem', category: 'general', stock: -1, imageUrl: '',
  productType: 'general', extendDays: '', tokenType: 'chat', tokenAmount: ''
};

export default function AdminUtilityStoreTab() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const getHeaders = () => {
    const session = getAdminSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
    };
  };

  const fetchAll = async () => {
    try {
      const [pRes, oRes] = await Promise.all([
        fetch(`${API_BASE_URL}/utility-store/admin/products`, { headers: getHeaders(), credentials: 'include' }),
        fetch(`${API_BASE_URL}/utility-store/admin/orders`, { headers: getHeaders(), credentials: 'include' }),
      ]);
      setProducts(await pRes.json());
      setOrders(await oRes.json());
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.priceJoy) return;
    setSaving(true);
    try {
      const url = editingId ? `${API_BASE_URL}/utility-store/admin/products/${editingId}` : `${API_BASE_URL}/utility-store/admin/products`;
      const r = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ...form, priceJoy: Number(form.priceJoy), stock: Number(form.stock) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Lỗi lưu sản phẩm');
      if (editingId) {
        setProducts(prev => prev.map(p => p._id === editingId ? data : p));
      } else {
        setProducts(prev => [data, ...prev]);
      }
      toast.success(t('adminTabs.utilityStore.saveSuccess'));
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p) {
    setEditingId(p._id);
    setForm({
      name: p.name, description: p.description, priceJoy: p.priceJoy, icon: p.icon, category: p.category, stock: p.stock, imageUrl: p.imageUrl || '',
      productType: p.productType || 'general', extendDays: p.extendDays || '', tokenType: p.tokenType || 'chat', tokenAmount: p.tokenAmount || ''
    });
  }

  async function toggleActive(p) {
    try {
      const r = await fetch(`${API_BASE_URL}/utility-store/admin/products/${p._id}`, {
        method: 'PUT', headers: getHeaders(), credentials: 'include',
        body: JSON.stringify({ active: !p.active }),
      });
      const data = await r.json();
      setProducts(prev => prev.map(x => x._id === p._id ? data : x));
    } catch (_) {}
  }

  async function handleDelete(id) {
    try {
      const r = await fetch(`${API_BASE_URL}/utility-store/admin/products/${id}`, { method: 'DELETE', headers: getHeaders(), credentials: 'include' });
      if (!r.ok) throw new Error('Lỗi xoá sản phẩm');
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success(t('adminTabs.utilityStore.deleteSuccess'));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-base">{editingId ? 'edit' : 'add_box'}</span>
            {editingId ? t('adminTabs.utilityStore.editTitle') : t('adminTabs.utilityStore.createTitle')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.utilityStore.nameLabel')}</label>
              <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.utilityStore.descLabel')}</label>
              <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.utilityStore.priceLabel')}</label>
                <input type="number" required min="1" value={form.priceJoy} onChange={e => setForm(p => ({ ...p, priceJoy: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.utilityStore.stockLabel')}</label>
                <input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.utilityStore.iconLabel')}</label>
              <input type="text" value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                placeholder="material-symbols name"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
            </div>

            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.utilityStore.productTypeLabel')}</label>
              <select value={form.productType} onChange={e => setForm(p => ({ ...p, productType: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold">
                <option value="general">{t('adminTabs.utilityStore.typeGeneral')}</option>
                <option value="system_validity">{t('adminTabs.utilityStore.typeSystemValidity')}</option>
                <option value="psy_study_tokens">{t('adminTabs.utilityStore.typePsyStudy')}</option>
              </select>
            </div>

            {form.productType === 'system_validity' && (
              <div className="space-y-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200/60 dark:border-amber-500/20">
                <label className="block text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('adminTabs.utilityStore.extendDaysLabel')}</label>
                <input type="number" required min="1" value={form.extendDays} onChange={e => setForm(p => ({ ...p, extendDays: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
              </div>
            )}

            {form.productType === 'psy_study_tokens' && (
              <div className="space-y-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200/60 dark:border-indigo-500/20">
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{t('adminTabs.utilityStore.tokenTypeLabel')}</label>
                  <select value={form.tokenType} onChange={e => setForm(p => ({ ...p, tokenType: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold">
                    <option value="chat">{t('adminTabs.utilityStore.tokenTypeChat')}</option>
                    <option value="call">{t('adminTabs.utilityStore.tokenTypeCall')}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{t('adminTabs.utilityStore.tokenAmountLabel')}</label>
                  <input type="number" required min="1" value={form.tokenAmount} onChange={e => setForm(p => ({ ...p, tokenAmount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary hover:bg-indigo-650 text-white font-bold text-xs shadow-sm hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50">
                <span className="material-symbols-outlined text-sm">save</span>
                {saving ? '...' : (editingId ? t('adminTabs.utilityStore.saveBtn') : t('adminTabs.utilityStore.createBtn'))}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }} className="px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-xs">
                  {t('adminTabs.utilityStore.cancelBtn')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base">storefront</span>
            {t('adminTabs.utilityStore.listTitle')} ({products.length})
          </h3>
          {loading ? (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('adminTabs.utilityStore.loading')}</p>
          ) : products.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('adminTabs.utilityStore.empty')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map(p => (
                <div key={p._id} className="rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-amber-500 text-base shrink-0">{p.icon || 'redeem'}</span>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white truncate">{p.name}</h4>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800'}`}>
                      {p.active ? t('adminTabs.utilityStore.active') : t('adminTabs.utilityStore.inactive')}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 truncate">{p.description}</p>
                  {p.productType === 'system_validity' && (
                    <span className="inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 dark:bg-amber-950/30">+{p.extendDays} {t('adminTabs.utilityStore.typeSystemValidity')}</span>
                  )}
                  {p.productType === 'psy_study_tokens' && (
                    <span className="inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30">+{p.tokenAmount} {p.tokenType === 'call' ? t('adminTabs.utilityStore.tokenTypeCall') : t('adminTabs.utilityStore.tokenTypeChat')}</span>
                  )}
                  <div className="flex justify-between text-[10px]">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{p.priceJoy} JOY</span>
                    <span className="text-zinc-400">{p.stock === -1 ? t('adminTabs.utilityStore.unlimited') : `${t('adminTabs.utilityStore.stockLabel')}: ${p.stock}`}</span>
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button onClick={() => startEdit(p)} className="flex-1 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[9px] font-bold uppercase">{t('adminTabs.utilityStore.editBtn')}</button>
                    <button onClick={() => toggleActive(p)} className="flex-1 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold uppercase">{p.active ? t('adminTabs.utilityStore.disableBtn') : t('adminTabs.utilityStore.enableBtn')}</button>
                    <button onClick={() => handleDelete(p._id)} className="px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#12111a] rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-base">receipt_long</span>
            {t('adminTabs.utilityStore.ordersTitle')} ({orders.length})
          </h3>
          {orders.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('adminTabs.utilityStore.noOrders')}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders.map(o => (
                <div key={o._id} className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-[#1c1c1e] rounded-xl border border-zinc-200/50 dark:border-zinc-800/60">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block truncate">{o.productName}</span>
                    <span className="text-[9px] text-zinc-400">{o.email} · {o.purchaseCode}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">{o.priceJoy} JOY</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
