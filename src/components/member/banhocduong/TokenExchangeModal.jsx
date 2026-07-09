import React, { useState } from "react";
import { Sparkles, X, Loader2, CheckCircle2, Ticket } from "lucide-react";
import { useJoyStore } from "../../../stores/joyStore";

export default function TokenExchangeModal({ isOpen, onClose, email, onSuccess, showToast }) {
  const [tokenAmount, setTokenAmount] = useState(5);
  const [exchanging, setExchanging] = useState(false);
  const [invoice, setInvoice] = useState(null);
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
        // Generate confirmation invoice details
        const txId = `TX-${Math.floor(100000 + Math.random() * 900000)}`;
        setInvoice({
          txId,
          email,
          tokens: tokenAmount,
          joyPaid: cost,
          date: new Date().toLocaleString("vi-VN"),
        });
        showToast?.(`Đổi thành công ${tokenAmount} Token!`, "success");
        fetchJoyBalance(email);
        onSuccess?.();
      } else {
        showToast?.(data.error || "Giao dịch thất bại", "error");
      }
    } catch {
      showToast?.("Giao dịch thất bại do lỗi mạng", "error");
    } finally {
      setExchanging(false);
    }
  };

  const handleClose = () => {
    setInvoice(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-[#1a1a24] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 relative">
        
        {/* Render invoice receipt if transaction is successful */}
        {invoice ? (
          <div className="p-6">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-lg font-black text-center text-foreground mb-1">GIAO DỊCH THÀNH CÔNG</h3>
            <p className="text-[11px] text-center text-muted-foreground mb-6">Mã hóa đơn xác nhận thanh toán JOY</p>

            {/* Ticket style invoice card */}
            <div className="relative bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800/80 mb-6 overflow-hidden">
              {/* Ticket left/right holes */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-[#1a1a24] border-r border-zinc-200 dark:border-zinc-800" />
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-[#1a1a24] border-l border-zinc-200 dark:border-zinc-800" />
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã hóa đơn:</span>
                  <span className="font-bold text-foreground font-mono">{invoice.txId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tài khoản:</span>
                  <span className="font-bold text-foreground break-all max-w-[160px] text-right">{invoice.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số lượng nhận:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">+{invoice.tokens} Token PSY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khấu trừ:</span>
                  <span className="font-bold text-amber-500">-{invoice.joyPaid} JOY</span>
                </div>
                
                <div className="border-t border-dashed border-zinc-300 dark:border-zinc-700/80 my-2 pt-2 flex justify-between">
                  <span className="text-muted-foreground">Thời gian:</span>
                  <span className="font-medium text-foreground">{invoice.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[9px] border border-emerald-500/20">THÀNH CÔNG</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Ticket className="w-4 h-4" />
              Hoàn thành
            </button>
          </div>
        ) : (
          <div>
            <button onClick={handleClose} className="absolute top-3.5 right-3.5 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors bg-black/5 dark:bg-white/5 rounded-full">
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-foreground mb-2">Hết Token Trò Chuyện</h3>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Bạn đã sử dụng hết Token miễn phí hôm nay. Dùng JOY để đổi thêm Token trò chuyện cùng AI (1 Token = 25 JOY).
              </p>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl p-4 mb-6 text-left border border-zinc-100 dark:border-zinc-800/80">
                <label className="block text-[11px] font-bold text-muted-foreground mb-2">Số lượng Token muốn đổi (5 - 50)</label>
                <input 
                  type="number"
                  min={5}
                  max={50}
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-bold"
                />
                <div className="flex justify-between items-center mt-3.5 pt-3.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
                  <span className="text-xs font-bold text-muted-foreground">Tổng chi phí:</span>
                  <span className="text-xs font-black text-amber-500">{cost} JOY</span>
                </div>
              </div>

              <button
                onClick={handleExchange}
                disabled={exchanging || joyBalance < cost || tokenAmount < 5 || tokenAmount > 50}
                className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center"
              >
                {exchanging ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận đổi"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
