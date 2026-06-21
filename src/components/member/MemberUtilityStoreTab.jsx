import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import JoyCoinBadge from "../shared/JoyCoinBadge";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function MemberUtilityStoreTab({ bio, balance, onPurchased, onBioUpdate, showToast }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [confirmProduct, setConfirmProduct] = useState(null);

  useEffect(() => {
    fetch(`${apiBase}/utility-store/products`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleBuy(product) {
    if (!bio?.email || buyingId) return;
    setBuyingId(product._id);
    try {
      const r = await fetch(`${apiBase}/utility-store/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: bio.email, productId: product._id }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || t("memberPortal.joy.store.purchaseError"));
      showToast?.(t("memberPortal.joy.store.purchaseSuccess", { code: data.order.purchaseCode }), "success");
      onPurchased?.(data.newBalance);
      if (data.bio) onBioUpdate?.(data.bio);
      setProducts(prev => prev.map(p => p._id === product._id && p.stock !== -1 ? { ...p, stock: p.stock - 1 } : p));
      setConfirmProduct(null);
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setBuyingId(null);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 animate-pulse">
            <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800/60" />
            <div className="p-3 space-y-2">
              <div className="h-2.5 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800/60" />
              <div className="h-2 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-700 mb-2">storefront</span>
        <p className="text-xs text-zinc-400">{t("memberPortal.joy.store.empty")}</p>
      </div>
    );
  }

  const perkLabel = (product) => {
    if (product.productType === "system_validity" && product.extendDays > 0) {
      return `+${product.extendDays} ${t("memberPortal.joy.store.daysUnit")}`;
    }
    if (product.productType === "psy_study_tokens" && product.tokenAmount > 0) {
      return `+${product.tokenAmount} ${product.tokenType === "call" ? t("memberPortal.joy.store.callTokens") : t("memberPortal.joy.store.chatTokens")}`;
    }
    return null;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map(product => {
        const insufficient = balance < product.priceJoy;
        const outOfStock = product.stock !== -1 && product.stock <= 0;
        const lowStock = product.stock !== -1 && product.stock > 0 && product.stock <= 5;
        const perk = perkLabel(product);
        const disabled = insufficient || outOfStock || buyingId === product._id;
        return (
          <div
            key={product._id}
            className={`group flex flex-col rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#181622] shadow-sm transition-all duration-200 ${outOfStock ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5'}`}
          >
            {/* Cover */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-500/10 dark:to-amber-500/5 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-amber-400 dark:text-amber-500/70">{product.icon || "redeem"}</span>
              )}
              {perk && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-indigo-600/90 text-white text-[8.5px] font-extrabold uppercase tracking-wide shadow-sm">
                  {perk}
                </span>
              )}
              {outOfStock ? (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-zinc-900/80 text-white text-[8.5px] font-extrabold uppercase tracking-wide">
                  {t("memberPortal.joy.store.outOfStock")}
                </span>
              ) : lowStock && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-[8.5px] font-extrabold uppercase tracking-wide">
                  {t("memberPortal.joy.store.lowStock", { count: product.stock })}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-3 gap-2">
              <div className="min-w-0">
                <h5 className="font-bold text-zinc-800 dark:text-white text-[11.5px] leading-snug line-clamp-1">{product.name}</h5>
                {product.description && (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">{product.description}</p>
                )}
              </div>
              <div className="mt-auto flex flex-col gap-2 pt-1">
                <JoyCoinBadge amount={product.priceJoy} size="sm" />
                <button
                  onClick={() => setConfirmProduct(product)}
                  disabled={disabled}
                  className="w-full py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {buyingId === product._id
                    ? "..."
                    : outOfStock
                      ? t("memberPortal.joy.store.outOfStock")
                      : insufficient
                        ? t("memberPortal.joy.store.insufficientBalance")
                        : t("memberPortal.joy.store.buyButton")}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Purchase confirmation modal — gives the user a deliberate second step
          before any JOY is spent, instead of a single-click buy. */}
      {confirmProduct && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget && buyingId !== confirmProduct._id) setConfirmProduct(null); }}
        >
          <div className="bg-white dark:bg-[#15141c] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">{confirmProduct.icon || "redeem"}</span>
              </div>
              <h3 className="font-black text-base text-zinc-900 dark:text-white">{t("memberPortal.joy.store.confirmTitle")}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("memberPortal.joy.store.confirmSubtitle")}</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.joy.store.confirmProduct")}</span>
                <span className="text-xs font-bold text-zinc-800 dark:text-white text-right">{confirmProduct.name}</span>
              </div>
              {perkLabel(confirmProduct) && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.joy.store.confirmPerk")}</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{perkLabel(confirmProduct)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.joy.store.confirmPrice")}</span>
                <JoyCoinBadge amount={confirmProduct.priceJoy} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.joy.store.confirmBalanceAfter")}</span>
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{(balance - confirmProduct.priceJoy).toLocaleString("vi-VN")} JOY</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmProduct(null)}
                disabled={buyingId === confirmProduct._id}
                className="flex-1 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {t("memberPortal.joy.store.confirmCancel")}
              </button>
              <button
                onClick={() => handleBuy(confirmProduct)}
                disabled={buyingId === confirmProduct._id}
                className="flex-1 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {buyingId === confirmProduct._id ? t("memberPortal.joy.store.confirmProcessing") : t("memberPortal.joy.store.confirmButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
