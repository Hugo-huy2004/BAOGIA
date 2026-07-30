import { useState, useEffect, useRef } from "react";
import { money } from "./storeData";

const API = import.meta.env.VITE_API_URL || "/api";

/**
 * Chọn người nhận + bậc quà. KHÔNG tự vẽ hoá đơn — bấm "Tiếp tục" là trả về
 * cho shell mở `JoyExchangeModal` (phiếu trao đổi JOY dùng chung toàn hệ thống).
 *
 * Người nhận được xác minh ở server trước khi tiêu JOY, và chỉ trả về tên +
 * ảnh — không lộ email/số điện thoại của người khác.
 */
export default function GiftSheet({ plan, onClose, onContinue }) {
  const [handle, setHandle] = useState("");
  const [tier, setTier] = useState("rent");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [error, setError] = useState("");
  const debounce = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Tra người nhận khi ngừng gõ — tránh gọi API mỗi ký tự.
  useEffect(() => {
    const value = handle.trim();
    setRecipient(null);
    setError("");
    if (value.length < 3) return;

    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setChecking(true);
      try {
        const r = await fetch(`${API}/store/plans/lookup?handle=${encodeURIComponent(value)}`, {
          credentials: "include",
        });
        const data = await r.json();
        if (data.found) setRecipient(data.recipient);
        else setError(data.error || "Không tìm thấy ai với thông tin này.");
      } catch {
        setError("Không tra được người nhận.");
      } finally {
        setChecking(false);
      }
    }, 450);

    return () => clearTimeout(debounce.current);
  }, [handle]);

  const chosen = tier === "own" ? plan.own : plan.rent;

  return (
    <div className="fixed inset-0 z-[520] flex items-end justify-center sm:items-center sm:p-4">
      <div className="hgs-scrim absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tặng ${plan.label}`}
        className="hgs hgs-sheet relative flex max-h-[92dvh] w-full flex-col overflow-hidden sm:max-w-md"
      >
        <div className="shrink-0 px-4 pb-3 pt-2.5">
          <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-black/15 dark:bg-white/20 sm:hidden" />
          <div className="flex items-center gap-3">
            <h2 className="hgs-ink min-w-0 flex-1 text-[19px] font-bold tracking-[-0.01em]">
              Tặng {plan.label}
            </h2>
            <button type="button" onClick={onClose} aria-label="Đóng" className="hgs-iconbtn">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-3">
          {/* Người nhận */}
          <div>
            <label className="hgs-dim mb-1.5 block text-[13px] font-semibold" htmlFor="gift-handle">
              Gửi tới
            </label>
            <input
              id="gift-handle"
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="Mã giới thiệu, email hoặc số điện thoại"
              className="hgs-input px-4"
              autoComplete="off"
            />

            {checking && <p className="hgs-dim mt-2 text-[13.5px]">Đang tìm…</p>}
            {error && <p className="mt-2 text-[13.5px] font-semibold text-rose-500">{error}</p>}
            {recipient && (
              <div className="hgs-card mt-2 flex items-center gap-3 p-3">
                {recipient.avatarUrl ? (
                  <img src={recipient.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hgs-accent-soft)]">
                    <span className="material-symbols-outlined hgs-accent-text text-[22px]">person</span>
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="hgs-ink truncate text-[15px] font-semibold">{recipient.displayName}</p>
                  <p className="hgs-dim truncate text-[13.5px]">
                    {recipient.referralCode ? `Mã ${recipient.referralCode}` : "Thành viên Hugo"}
                  </p>
                </div>
                <span className="material-symbols-outlined shrink-0 text-[22px] text-emerald-500">
                  check_circle
                </span>
              </div>
            )}
          </div>

          {/* Bậc quà */}
          <div>
            <p className="hgs-dim mb-1.5 text-[13px] font-semibold">Bậc quà tặng</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "rent", title: "Thuê 1 tháng", price: plan.rent.total, note: "Dùng 30 ngày" },
                { id: "own", title: "Sở hữu", price: plan.own.total, note: `Tiết kiệm ${plan.own.savePercent}%` },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTier(opt.id)}
                  aria-pressed={tier === opt.id}
                  className={`rounded-[16px] border p-3 text-left transition-colors ${
                    tier === opt.id
                      ? "border-transparent bg-[var(--hgs-accent)] text-white"
                      : "border-[var(--hgs-line)] bg-[var(--hgs-surface)]"
                  }`}
                >
                  <p className={`text-[14px] font-bold ${tier === opt.id ? "" : "hgs-ink"}`}>{opt.title}</p>
                  <p className={`mt-0.5 text-[15px] font-bold tabular-nums ${tier === opt.id ? "" : "hgs-ink"}`}>
                    {money(opt.price)} JOY
                  </p>
                  <p className={`text-[12.5px] ${tier === opt.id ? "text-white/75" : "hgs-dim"}`}>{opt.note}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Lời nhắn */}
          <div>
            <label className="hgs-dim mb-1.5 block text-[13px] font-semibold" htmlFor="gift-note">
              Lời nhắn <span className="font-normal">(tuỳ chọn)</span>
            </label>
            <textarea
              id="gift-note"
              rows={2}
              maxLength={200}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Chúc cậu học vui nhé!"
              className="hgs-input h-auto resize-none px-4 py-3"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-[var(--hgs-line)] px-4 pt-3">
          <button
            type="button"
            disabled={!recipient}
            onClick={() => onContinue?.({ appId: plan.appId, tier, handle: handle.trim(), message, recipient })}
            className="hgs-btn hgs-btn--primary h-[52px] w-full text-[16px]"
          >
            {recipient ? `Tiếp tục · ${money(chosen.total)} JOY` : "Chọn người nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
