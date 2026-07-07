import React, { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { useJoyStore } from "../../../stores/joyStore";

export default function TokenExchangeModal({ isOpen, onClose, email, onSuccess, showToast }) {
  const [tokenAmount, setTokenAmount] = useState(5);
  const [exchanging, setExchanging] = useState(false);
  const joyBalance = useJoyStore(s => s.balance);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);

  if (!isOpen) return null;

  const cost = tokenAmount * 25;

  const handleExchange = async () => {
    if (tokenAmount < 5 || tokenAmount > 50) {
      showToast?.("Số lượng token phải từ 5 đến 50", "warning");
      return;
    }
    if (joyBalance < cost) {
      showToast?.(`Bạn không đủ JOY. Cần ${cost} JOY.`, "error");
      return;
    }

    setExchanging(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/joy/exchange-chat-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tokenAmount })
      });
      const data = await res.json();
      if (res.ok) {
        showToast?.(`Đổi thành công ${tokenAmount} Token!`, "success");
        fetchJoyBalance(email);
        onSuccess?.();
        onClose();
      } else {
        showToast?.(data.error || "Giao dịch thất bại", "error");
      }
    } catch {
      showToast?.("Giao dịch thất bại do lỗi mạng", "error");
    } finally {
      setExchanging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#1a1a24] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative border border-white/10">
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors bg-black/5 rounded-full">
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Hết Token Trò Chuyện</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Bạn đã sử dụng hết Token miễn phí hôm nay. Dùng JOY để mua thêm Token trò chuyện cùng AI (1 Token = 25 JOY).
          </p>

          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left border border-border/60">
            <label className="block text-xs font-semibold text-muted-foreground mb-2">Số lượng Token muốn đổi (5 - 50)</label>
            <input 
              type="number"
              min={5}
              max={50}
              value={tokenAmount}
              onChange={(e) => setTokenAmount(Number(e.target.value))}
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
              <span className="text-sm font-medium text-muted-foreground">Tổng chi phí:</span>
              <span className="text-sm font-bold text-amber-500">{cost} JOY</span>
            </div>
          </div>

          <button
            onClick={handleExchange}
            disabled={exchanging || joyBalance < cost || tokenAmount < 5 || tokenAmount > 50}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center"
          >
            {exchanging ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
