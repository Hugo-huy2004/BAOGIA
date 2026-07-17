import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import JoyCoinBadge from "../shared/JoyCoinBadge";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const CATEGORY_LABELS = {
  all: "Tất cả",
  general: "Chung",
  joy: "JOY",
};

export default function MemberUtilityStoreTab({ bio, balance, onPurchased, onBioUpdate, showToast }) {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    fetch(`${apiBase}/utility-store/products`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category || "general"));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(p => {
      const matchesCategory = category === "all" || (p.category || "general") === category;
      const matchesSearch = !q || p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, category]);

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
          <div key={i} className="rounded-2xl overflow-hidden border border-border animate-pulse">
            <div className="aspect-[4/3] bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-2.5 w-3/4 rounded bg-muted" />
              <div className="h-2 w-1/2 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-12 text-center bg-muted/50 rounded-2xl border border-dashed border-border">
        <span className="material-symbols-outlined text-3xl text-muted-foreground/70 mb-2">storefront</span>
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
    <div className="space-y-4">
      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-base">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-white dark:bg-[#181622] text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-warning/40"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border whitespace-nowrap shrink-0 transition-all ${
                category === c ? "bg-warning border-warning text-white shadow-sm" : "bg-white dark:bg-[#181622] border-border text-muted-foreground"
              }`}
            >
              {CATEGORY_LABELS[c] || c}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="py-12 text-center bg-muted/50 rounded-2xl border border-dashed border-border">
          <span className="material-symbols-outlined text-3xl text-muted-foreground/70 mb-2">search_off</span>
          <p className="text-xs text-zinc-400">Không tìm thấy sản phẩm phù hợp.</p>
        </div>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {filteredProducts.map(product => {
        const insufficient = balance < (product.priceJoy + Math.floor(product.priceJoy * 0.09));
        const outOfStock = product.stock !== -1 && product.stock <= 0;
        const lowStock = product.stock !== -1 && product.stock > 0 && product.stock <= 5;
        const perk = perkLabel(product);
        const disabled = insufficient || outOfStock || buyingId === product._id;
        return (
          <div
            key={product._id}
            className={`group flex flex-col rounded-2xl overflow-hidden border border-border bg-white dark:bg-[#181622] shadow-sm transition-all duration-200 ${outOfStock ? 'opacity-60' : 'hover:shadow-md hover:-translate-y-0.5'}`}
          >
            {/* Cover */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-warning/10 to-warning/60 dark:from-warning/10 dark:to-warning/5 flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <span className="material-symbols-outlined text-4xl text-warning/70">{product.icon || "redeem"}</span>
              )}
              {perk && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-white text-[8.5px] font-extrabold uppercase tracking-wide shadow-sm">
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
                <h5 className="font-bold text-foreground text-[11.5px] leading-snug line-clamp-1">{product.name}</h5>
                {product.description && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{product.description}</p>
                )}
              </div>
              <div className="mt-auto flex flex-col gap-2 pt-1">
                <JoyCoinBadge amount={product.priceJoy} size="sm" />
                <button
                  onClick={() => setConfirmProduct(product)}
                  disabled={disabled}
                  className="w-full py-1.5 rounded-lg bg-foreground text-background text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
      </div>
      )}

      {/* Purchase confirmation modal — gives the user a deliberate second step
          before any JOY is spent, instead of a single-click buy. */}
      {confirmProduct && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget && buyingId !== confirmProduct._id) setConfirmProduct(null); }}
        >
          <div className="bg-white dark:bg-[#15141c] border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">{confirmProduct.icon || "redeem"}</span>
              </div>
              <h3 className="font-black text-base text-foreground">{t("memberPortal.joy.store.confirmTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("memberPortal.joy.store.confirmSubtitle")}</p>
            </div>

            <div className="bg-muted/50 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.joy.store.confirmProduct")}</span>
                <span className="text-xs font-bold text-foreground text-right">{confirmProduct.name}</span>
              </div>
              {perkLabel(confirmProduct) && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.joy.store.confirmPerk")}</span>
                  <span className="text-xs font-bold text-primary">{perkLabel(confirmProduct)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.joy.store.confirmPrice", "Giá gốc")}</span>
                <JoyCoinBadge amount={confirmProduct.priceJoy} size="sm" />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-medium text-zinc-500">Phí cấp hàng (2%)</span>
                <span className="text-xs font-medium text-foreground/80">+{Math.floor(confirmProduct.priceJoy * 0.02)} JOY</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-medium text-zinc-500">Phí hỗ trợ (5%)</span>
                <span className="text-xs font-medium text-foreground/80">+{Math.floor(confirmProduct.priceJoy * 0.05)} JOY</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-medium text-zinc-500">Phí bảo dưỡng (2%)</span>
                <span className="text-xs font-medium text-foreground/80">+{Math.floor(confirmProduct.priceJoy * 0.02)} JOY</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-border">
                <span className="text-[10px] font-black text-foreground/80 uppercase tracking-wider">Tổng thanh toán</span>
                <span className="text-sm font-black text-foreground">
                  {confirmProduct.priceJoy + Math.floor(confirmProduct.priceJoy * 0.09)} JOY
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t("memberPortal.joy.store.confirmBalanceAfter", "Số dư sau mua")}</span>
                <span className="text-xs font-bold text-muted-foreground">{(balance - (confirmProduct.priceJoy + Math.floor(confirmProduct.priceJoy * 0.09))).toLocaleString("vi-VN")} JOY</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmProduct(null)}
                disabled={buyingId === confirmProduct._id}
                className="flex-1 py-3 rounded-xl bg-muted text-foreground/80 text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {t("memberPortal.joy.store.confirmCancel")}
              </button>
              <button
                onClick={() => handleBuy(confirmProduct)}
                disabled={buyingId === confirmProduct._id}
                className="flex-1 py-3 rounded-xl bg-foreground text-background text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
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
