import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAdminSession } from '../../services/authSession';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export default function AdminJoyGiftCardsTab() {
  const { t } = useTranslation();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ amount: '', note: '', count: 1 });
  const [creating, setCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState([]);

  const getHeaders = () => {
    const session = getAdminSession();
    return {
      'Content-Type': 'application/json',
      ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
    };
  };

  const fetchCards = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/joy-gift-cards`, { headers: getHeaders(), credentials: 'include' });
      const data = await r.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchCards(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.amount) return;
    setCreating(true);
    try {
      const r = await fetch(`${API_BASE_URL}/joy-gift-cards`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ amount: Number(form.amount), note: form.note, count: Number(form.count) || 1 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Lỗi tạo mã');
      setLastCreated(data);
      setCards(prev => [...data, ...prev]);
      toast.success(t('adminTabs.joyGiftCards.createSuccess', { count: data.length }));
      setForm({ amount: '', note: '', count: 1 });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    try {
      const r = await fetch(`${API_BASE_URL}/joy-gift-cards/${id}`, { method: 'DELETE', headers: getHeaders(), credentials: 'include' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Lỗi xoá mã');
      setCards(prev => prev.filter(c => c._id !== id));
      toast.success(t('adminTabs.joyGiftCards.deleteSuccess'));
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white dark:bg-background rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-base">redeem</span>
            {t('adminTabs.joyGiftCards.createTitle')}
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.joyGiftCards.amountLabel')}</label>
              <input
                type="number" required min="1"
                value={form.amount}
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.joyGiftCards.countLabel')}</label>
              <input
                type="number" min="1" max="500"
                value={form.count}
                onChange={e => setForm(p => ({ ...p, count: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('adminTabs.joyGiftCards.noteLabel')}</label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1f1929] text-xs p-3 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
              />
            </div>
            <button type="submit" disabled={creating} className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary hover:bg-indigo-650 text-white font-bold text-xs shadow-sm hover:scale-[1.01] active:scale-98 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              {creating ? '...' : t('adminTabs.joyGiftCards.createBtn')}
            </button>
          </form>
        </div>

        {lastCreated.length > 0 && (
          <div className="bg-white dark:bg-background rounded-xl p-6 border border-emerald-200 dark:border-emerald-900/40 shadow-sm space-y-3">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t('adminTabs.joyGiftCards.justCreated')}</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {lastCreated.map(c => (
                <div key={c._id} className="font-mono text-xs font-bold tracking-widest bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg">{c.code}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-7">
        <div className="bg-white dark:bg-background rounded-xl p-6 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="material-symbols-outlined text-muted-foreground text-base">list_alt</span>
            {t('adminTabs.joyGiftCards.listTitle')} ({cards.length})
          </h3>
          {loading ? (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('adminTabs.joyGiftCards.loading')}</p>
          ) : cards.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">{t('adminTabs.joyGiftCards.empty')}</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {cards.map(c => (
                <div key={c._id} className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-card rounded-xl border border-zinc-200/50 dark:border-zinc-800/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.redeemed ? 'bg-zinc-400' : 'bg-emerald-500'}`} />
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-bold tracking-widest text-slate-800 dark:text-slate-200 block truncate">{c.code}</span>
                      <span className="text-[9px] text-zinc-400">{c.amount} JOY{c.note ? ` · ${c.note}` : ''}{c.redeemed ? ` · ${t('adminTabs.joyGiftCards.redeemedBy')} ${c.redeemedBy}` : ''}</span>
                    </div>
                  </div>
                  {!c.redeemed && (
                    <button onClick={() => handleDelete(c._id)} className="text-zinc-400 hover:text-red-500 transition-colors shrink-0">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
