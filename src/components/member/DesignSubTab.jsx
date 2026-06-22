import React, { useState } from "react";
import JoyExchangeModal from "./shared/JoyExchangeModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";
const RENTAL_PRICE = 150;
const EXCHANGE_ITEM_BY_TEMPLATE = { brutalism: "bioThemeBrutalism", flat: "bioThemeFlat" };

function daysRemaining(expiresAt) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function DesignSubTab({
  formData,
  setFormData,
  t,
  bio,
  onBioUpdate,
  showToast
}) {
  const [invoiceTemplate, setInvoiceTemplate] = useState(null); // 'brutalism' | 'flat' | null

  const rental = bio?.bioThemeRental;
  const rentalActive = rental?.expiresAt && new Date(rental.expiresAt).getTime() > Date.now();

  const selectDefault = () => {
    setFormData(prev => ({ ...prev, theme: { ...prev.theme, template: 'default' } }));
  };

  // Brutalism/Flat are paid (150 JOY/tháng) — switch immediately via the
  // dedicated endpoint rather than staging in formData, since this needs its
  // own JOY charge (with invoice confirmation) separate from the generic
  // profile Save.
  const selectPaidTemplate = (template) => {
    if (!bio?.email) return;

    // Already actively rented for this exact template — just re-select, free.
    if (rentalActive && rental.template === template) {
      setFormData(prev => ({ ...prev, theme: { ...prev.theme, template } }));
      return;
    }

    setInvoiceTemplate(template);
  };

  const handleConfirmCharge = async () => {
    const res = await fetch(`${API_BASE}/joy/subscribe-bio-theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: bio.email, template: invoiceTemplate })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi trao đổi JOY.');
    return data;
  };

  const handleSuccess = (data) => {
    onBioUpdate?.(data.bio);
    setFormData(prev => ({ ...prev, theme: { ...prev.theme, template: invoiceTemplate } }));
    showToast?.(`Đã trao đổi JOY diện giao diện ${invoiceTemplate === 'brutalism' ? 'Brutalism' : 'Flat'}!`, 'success');
  };

  const isClassic = formData.theme?.template !== 'brutalism' && formData.theme?.template !== 'flat';

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Section: Select Template Style */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">
          {t("memberPortal.design.title")}
        </h3>
        <p className="text-[9px] text-zinc-450 dark:text-zinc-500 pl-4 -mt-1">
          JOY là đồng tích góp phi lợi nhuận — Brutalism &amp; Flat trao đổi {RENTAL_PRICE} JOY/tháng, hết hạn sẽ tự trả về Classic.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={selectDefault}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              isClassic
                ? 'bg-primary/10 border-primary text-black dark:text-white ring-1 ring-[#0071e3]'
                : 'bg-white dark:bg-card border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-lg">view_carousel</span>
              {isClassic && (
                <span className="material-symbols-outlined text-primary text-xs font-bold">check_circle</span>
              )}
            </div>
            <h4 className="text-[11px] font-bold mt-2">{t("memberPortal.design.classicTitle")}</h4>
            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.classicDesc")}</p>
            <span className="inline-block mt-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30">Miễn phí</span>
          </button>

          <button
            type="button"
            onClick={() => selectPaidTemplate('brutalism')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              formData.theme?.template === 'brutalism'
                ? 'bg-primary/10 border-primary text-black dark:text-white ring-1 ring-[#0071e3]'
                : 'bg-white dark:bg-card border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-lg">token</span>
              {formData.theme?.template === 'brutalism' && (
                <span className="material-symbols-outlined text-primary text-xs font-bold">check_circle</span>
              )}
            </div>
            <h4 className="text-[11px] font-bold mt-2 text-red-500 dark:text-red-400">Brutalism</h4>
            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.brutalismDesc")}</p>
            {rentalActive && rental.template === 'brutalism' ? (
              <span className="inline-block mt-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30">Còn {daysRemaining(rental.expiresAt)} ngày</span>
            ) : (
              <span className="inline-block mt-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 dark:bg-amber-950/30">{RENTAL_PRICE} JOY/tháng</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => selectPaidTemplate('flat')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              formData.theme?.template === 'flat'
                ? 'bg-primary/10 border-primary text-black dark:text-white ring-1 ring-[#0071e3]'
                : 'bg-white dark:bg-card border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-lg">grid_view</span>
              {formData.theme?.template === 'flat' && (
                <span className="material-symbols-outlined text-primary text-xs font-bold">check_circle</span>
              )}
            </div>
            <h4 className="text-[11px] font-bold mt-2 text-teal-650 dark:text-teal-400">{t("memberPortal.design.flatTitle")}</h4>
            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.flatDesc")}</p>
            {rentalActive && rental.template === 'flat' ? (
              <span className="inline-block mt-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30">Còn {daysRemaining(rental.expiresAt)} ngày</span>
            ) : (
              <span className="inline-block mt-2 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 dark:bg-amber-950/30">{RENTAL_PRICE} JOY/tháng</span>
            )}
          </button>
        </div>
      </div>

      <JoyExchangeModal
        open={!!invoiceTemplate}
        bio={bio}
        item={invoiceTemplate ? EXCHANGE_ITEM_BY_TEMPLATE[invoiceTemplate] : null}
        onClose={() => setInvoiceTemplate(null)}
        onConfirm={handleConfirmCharge}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
