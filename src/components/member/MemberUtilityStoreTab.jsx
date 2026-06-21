import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import JoyCoinBadge from "../shared/JoyCoinBadge";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export default function MemberUtilityStoreTab({ bio, balance, onPurchased, showToast }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);

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
      setProducts(prev => prev.map(p => p._id === product._id && p.stock !== -1 ? { ...p, stock: p.stock - 1 } : p));
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setBuyingId(null);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-xs text-zinc-400">{t("memberPortal.joy.store.loading")}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center bg-zinc-50/50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
        <span className="material-symbols-outlined text-3xl text-zinc-300 dark:text-zinc-700 mb-2">storefront</span>
        <p className="text-xs text-zinc-400">{t("memberPortal.joy.store.empty")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {products.map(product => {
        const insufficient = balance < product.priceJoy;
        const outOfStock = product.stock !== -1 && product.stock <= 0;
        return (
          <div key={product._id} className="flex flex-col gap-2.5 p-4 bg-white dark:bg-[#181622] rounded-2xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">{product.icon || "redeem"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-zinc-800 dark:text-white text-xs truncate">{product.name}</h5>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{product.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <JoyCoinBadge amount={product.priceJoy} size="sm" />
              <button
                onClick={() => handleBuy(product)}
                disabled={insufficient || outOfStock || buyingId === product._id}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
        );
      })}
    </div>
  );
}
