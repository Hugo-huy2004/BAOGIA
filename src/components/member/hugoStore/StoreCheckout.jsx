import { useState, useEffect } from "react";
import { useCartStore } from "../../../stores/cartStore";
import { orderTotals, money } from "./storeData";

/**
 * Trang thanh toán một màn hình.
 *
 * Cố ý không có bước "xem giỏ" rồi mới "thanh toán": chọn sản phẩm là sheet
 * này mở ra với đầy đủ số lượng, mã giảm giá, tổng tiền và một nút xác nhận.
 */
export default function StoreCheckout({ bio, showToast, onBioUpdate, onClose, onDone }) {
  const {
    items, promoCode, promoDiscount, loading,
    updateQuantity, removeItem, applyPromo, removePromo, checkout,
  } = useCartStore();

  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);

  const { subtotal, tax, discount, total } = orderTotals(items, promoDiscount);
  const balance = bio?.joyBalance || 0;
  const short = total - balance;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoBusy(true);
    try {
      const promo = await applyPromo(bio?.email, code);
      showToast?.(`Đã áp dụng mã ${promo.code}`, "success");
      setPromoInput("");
    } catch (e) {
      showToast?.(e.message || "Mã không dùng được", "error");
    } finally {
      setPromoBusy(false);
    }
  };

  const handlePay = async () => {
    try {
      const result = await checkout(bio?.email);
      if (result?.newBalance != null) onBioUpdate?.({ joyBalance: result.newBalance });
      showToast?.(`Thanh toán thành công · ${result?.orders?.length || 0} sản phẩm`, "success");
      onDone?.(result);
    } catch (e) {
      showToast?.(e.message || "Thanh toán thất bại", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center sm:items-center sm:p-4">
      <div className="hgs-scrim absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thanh toán"
        className="hgs hgs-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden sm:max-w-md"
      >
        {/* Tay nắm + tiêu đề */}
        <div className="shrink-0 px-4 pb-3 pt-2.5">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-black/15 dark:bg-white/20 sm:hidden" />
          <div className="flex items-center gap-3">
            <h2 className="hgs-ink min-w-0 flex-1 text-[19px] font-bold tracking-[-0.01em]">Thanh toán</h2>
            <button type="button" onClick={onClose} aria-label="Đóng" className="hgs-iconbtn">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <span className="material-symbols-outlined hgs-dim text-[40px]">shopping_bag</span>
            <p className="hgs-ink mt-2 text-[15px] font-semibold">Giỏ hàng trống</p>
            <p className="hgs-dim text-[13px]">Chọn một gói ở cửa hàng để bắt đầu.</p>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-3">
              {/* Sản phẩm */}
              <div className="hgs-card hgs-divide overflow-hidden">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 p-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--hgs-accent-soft)]">
                      <span className="material-symbols-outlined hgs-accent-text text-[20px]">
                        {item.icon || "redeem"}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="hgs-ink truncate text-[15px] font-semibold">{item.productName}</p>
                      <p className="hgs-dim text-[12.5px]">
                        {money(item.priceJoy)} JOY × {item.quantity}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
                      <button
                        type="button"
                        aria-label="Giảm số lượng"
                        onClick={() => updateQuantity(bio?.email, item.productId, item.quantity - 1)}
                        className="hgs-ink flex h-10 w-10 items-center justify-center rounded-full active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {item.quantity <= 1 ? "delete" : "remove"}
                        </span>
                      </button>
                      <span className="hgs-ink w-6 text-center text-[14px] font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Tăng số lượng"
                        onClick={() => updateQuantity(bio?.email, item.productId, item.quantity + 1)}
                        className="hgs-ink flex h-10 w-10 items-center justify-center rounded-full active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Bỏ ${item.productName}`}
                      onClick={() => removeItem(bio?.email, item.productId)}
                      className="hgs-dim flex h-10 w-7 shrink-0 items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Mã khuyến mãi */}
              {promoCode ? (
                <div className="flex items-center gap-2.5 rounded-[18px] bg-emerald-500/10 px-4 py-3.5">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400">
                    confirmation_number
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[14px] font-semibold text-emerald-700 dark:text-emerald-300">
                    {promoCode} · giảm {money(discount)} JOY
                  </p>
                  <button
                    type="button"
                    onClick={() => removePromo(bio?.email)}
                    className="shrink-0 text-[13.5px] font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-300"
                  >
                    Bỏ
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === "Enter" && handlePromo()}
                    placeholder="Mã khuyến mãi"
                    className="hgs-input min-w-0 flex-1 px-4 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
                  />
                  <button
                    type="button"
                    onClick={handlePromo}
                    disabled={promoBusy || !promoInput.trim()}
                    className="hgs-btn hgs-btn--soft h-[46px] shrink-0"
                  >
                    {promoBusy ? "..." : "Áp dụng"}
                  </button>
                </div>
              )}

              {/* Tổng kết */}
              <div className="hgs-card space-y-2.5 p-4">
                <div className="flex justify-between text-[14px]">
                  <span className="hgs-dim">Tạm tính</span>
                  <span className="hgs-ink font-semibold tabular-nums">{money(subtotal)} JOY</span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="hgs-dim">Phí dịch vụ (9%)</span>
                  <span className="hgs-ink font-semibold tabular-nums">{money(tax)} JOY</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[14px] text-emerald-600 dark:text-emerald-400">
                    <span>Giảm giá</span>
                    <span className="font-semibold tabular-nums">−{money(discount)} JOY</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[var(--hgs-line)] pt-3">
                  <span className="hgs-ink text-[15px] font-bold">Tổng cộng</span>
                  <span className="hgs-accent-text text-[19px] font-bold tabular-nums">
                    {money(total)} JOY
                  </span>
                </div>
                <p className="hgs-dim pt-0.5 text-[12px]">Số dư hiện có {money(balance)} JOY</p>
              </div>
            </div>

            {/* Nút xác nhận */}
            <div className="shrink-0 border-t border-[var(--hgs-line)] px-4 pt-3">
              {short > 0 && (
                <p className="mb-2 text-center text-[12.5px] font-semibold text-rose-500">
                  Thiếu {money(short)} JOY để hoàn tất đơn này.
                </p>
              )}
              <button
                type="button"
                onClick={handlePay}
                disabled={loading || short > 0}
                className="hgs-btn hgs-btn--primary h-[52px] w-full text-[16px]"
              >
                {loading ? "Đang xử lý…" : `Thanh toán ${money(total)} JOY`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
