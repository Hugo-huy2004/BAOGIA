import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminSession } from '../../services/authSession';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const EMPTY_FORM = {
  name: '', description: '', priceJoy: '', category: 'general', stock: -1, imageUrl: '',
  productType: 'general', extendDays: '', tokenType: 'chat', tokenAmount: ''
};

// Icon + badge + color are fully derived from productType — admins never pick an icon manually.
const PRODUCT_TYPE_META = {
  general: { icon: 'redeem', badgeKey: 'badgeGeneral', color: 'emerald' },
  system_validity: { icon: 'event_available', badgeKey: 'badgeSystemValidity', color: 'amber' },
  psy_study_tokens: { icon: 'psychology', badgeKey: 'badgePsyStudy', color: 'indigo' }
};

const COLOR_CLASSES = {
  emerald: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: 'text-emerald-500', glow: 'from-emerald-400/15 to-emerald-600/5', border: 'border-emerald-400' },
  amber: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: 'text-amber-500', glow: 'from-amber-400/15 to-amber-600/5', border: 'border-amber-400' },
  indigo: { badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400', icon: 'text-indigo-500', glow: 'from-indigo-400/15 to-indigo-600/5', border: 'border-indigo-400' }
};

function getTypeMeta(productType) {
  return PRODUCT_TYPE_META[productType] || PRODUCT_TYPE_META.general;
}

export default function AdminUtilityStoreTab() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      const typeMeta = getTypeMeta(form.productType);
      const url = editingId ? `${API_BASE_URL}/utility-store/admin/products/${editingId}` : `${API_BASE_URL}/utility-store/admin/products`;
      const r = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ ...form, icon: typeMeta.icon, priceJoy: Number(form.priceJoy), stock: Number(form.stock) }),
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
      name: p.name, description: p.description, priceJoy: p.priceJoy, category: p.category, stock: p.stock, imageUrl: p.imageUrl || '',
      productType: p.productType || 'general', extendDays: p.extendDays || '', tokenType: p.tokenType || 'chat', tokenAmount: p.tokenAmount || ''
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error(t('adminTabs.settings.adImage') + ' không hợp lệ');

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/utility-store/admin/upload-image`, {
          method: 'POST',
          headers: getHeaders(),
          credentials: 'include',
          body: JSON.stringify({ base64Str: reader.result, oldUrl: form.imageUrl }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Lỗi tải ảnh');
        setForm(p => ({ ...p, imageUrl: data.url }));
      } catch (err) {
        toast.error(err.message);
      } finally {
        setUploadingImage(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
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

  const formTypeMeta = getTypeMeta(form.productType);
  const formColors = COLOR_CLASSES[formTypeMeta.color];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
        <div className="bg-white dark:bg-background rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-base">{editingId ? 'edit' : 'add_box'}</span>
            {editingId ? t('adminTabs.utilityStore.editTitle') : t('adminTabs.utilityStore.createTitle')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Image upload */}
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.utilityStore.imageLabel')}</label>
              <div className="flex items-center gap-3">
                <div className={`relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-gradient-to-br ${formColors.glow} flex items-center justify-center`}>
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className={`material-symbols-outlined text-3xl ${formColors.icon}`}>{formTypeMeta.icon}</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <span className="material-symbols-outlined text-sm">{uploadingImage ? 'progress_activity' : 'upload_file'}</span>
                    {uploadingImage ? t('adminTabs.utilityStore.imageUploading') : t('adminTabs.utilityStore.imageUpload')}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  {form.imageUrl && (
                    <button type="button" onClick={() => setForm(p => ({ ...p, imageUrl: '' }))} className="text-[9px] font-bold uppercase text-rose-500 hover:text-rose-600 py-1">
                      {t('adminTabs.utilityStore.imageRemove')}
                    </button>
                  )}
                </div>
              </div>
            </div>

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

            {/* Product type — drives icon + badge automatically */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.utilityStore.productTypeLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(PRODUCT_TYPE_META).map(([key, meta]) => {
                  const colors = COLOR_CLASSES[meta.color];
                  const isActive = form.productType === key;
                  const labelKey = key === 'general' ? 'typeGeneral' : key === 'system_validity' ? 'typeSystemValidity' : 'typePsyStudy';
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setForm(p => ({ ...p, productType: key }))}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${
                        isActive ? `${colors.border} ${colors.badge}` : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-lg ${isActive ? colors.icon : ''}`}>{meta.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-wide text-center leading-tight px-1">{t(`adminTabs.utilityStore.${labelKey}`)}</span>
                    </button>
                  );
                })}
              </div>
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
                <button type="button" onClick={cancelEdit} className="px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-xs">
                  {t('adminTabs.utilityStore.cancelBtn')}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white dark:bg-background rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-muted-foreground text-base">storefront</span>
            {t('adminTabs.utilityStore.listTitle')} ({products.length})
          </h3>
          {loading ? (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('adminTabs.utilityStore.loading')}</p>
          ) : products.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('adminTabs.utilityStore.empty')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(p => {
                const meta = getTypeMeta(p.productType);
                const colors = COLOR_CLASSES[meta.color];
                return (
                  <div key={p._id} className="rounded-2xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className={`relative h-28 bg-gradient-to-br ${colors.glow} flex items-center justify-center overflow-hidden`}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className={`material-symbols-outlined text-5xl ${colors.icon}`}>{meta.icon}</span>
                      )}
                      <span className={`absolute top-2 left-2 text-[8px] font-black uppercase px-2 py-1 rounded-full ${colors.badge} flex items-center gap-1 shadow-sm`}>
                        <span className="material-symbols-outlined text-[11px]">{meta.icon}</span>
                        {t(`adminTabs.utilityStore.${meta.badgeKey}`)}
                      </span>
                      <span className={`absolute top-2 right-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.active ? 'bg-emerald-500 text-white' : 'bg-zinc-500 text-white'}`}>
                        {p.active ? t('adminTabs.utilityStore.active') : t('adminTabs.utilityStore.inactive')}
                      </span>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-xs text-foreground truncate">{p.name}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{p.description}</p>
                      {p.productType === 'system_validity' && (
                        <span className="inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 dark:bg-amber-950/30">+{p.extendDays} ngày HSD</span>
                      )}
                      {p.productType === 'psy_study_tokens' && (
                        <span className="inline-block text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30">+{p.tokenAmount} {p.tokenType === 'call' ? t('adminTabs.utilityStore.tokenTypeCall') : t('adminTabs.utilityStore.tokenTypeChat')}</span>
                      )}
                      <div className="flex justify-between text-[10px] pt-1">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{p.priceJoy} JOY</span>
                        <span className="text-zinc-400">{p.stock === -1 ? t('adminTabs.utilityStore.unlimited') : `${t('adminTabs.utilityStore.stockLabel')}: ${p.stock}`}</span>
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <button onClick={() => startEdit(p)} className="flex-1 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[9px] font-bold uppercase">{t('adminTabs.utilityStore.editBtn')}</button>
                        <button onClick={() => toggleActive(p)} className="flex-1 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold uppercase">{p.active ? t('adminTabs.utilityStore.disableBtn') : t('adminTabs.utilityStore.enableBtn')}</button>
                        <button onClick={() => handleDelete(p._id)} className="px-2.5 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500"><span className="material-symbols-outlined text-[14px]">delete</span></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-background rounded-2xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-muted-foreground text-base">receipt_long</span>
            {t('adminTabs.utilityStore.ordersTitle')} ({orders.length})
          </h3>
          {orders.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('adminTabs.utilityStore.noOrders')}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orders.map(o => (
                <div key={o._id} className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-card rounded-xl border border-zinc-200/50 dark:border-zinc-800/60">
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
