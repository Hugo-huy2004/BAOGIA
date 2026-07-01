import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function AuraReceiptModal({ isOpen, theme, onConfirm, onCancel, isProcessing, isSuccess }) {
  const { t, i18n } = useTranslation();
  const [stampVisible, setStampVisible] = useState(false);
  const [duration, setDuration] = useState('day'); // 'day' or 'month'
  
  const isEn = i18n.language === 'en';

  // Play cash register sound when processing starts
  useEffect(() => {
    if (isProcessing && !isSuccess) {
      const audio = new Audio("https://www.soundjay.com/misc/sounds/cash-register-01.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
      
      // Show paid stamp slightly after processing starts for effect
      setTimeout(() => {
        setStampVisible(true);
      }, 500);
    } else if (!isProcessing && !isSuccess) {
      setStampVisible(false);
    }
  }, [isProcessing, isSuccess]);

  // Play success chime on success
  useEffect(() => {
    if (isSuccess) {
      const audio = new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }
  }, [isSuccess]);

  if (!isOpen || !theme) return null;

  const themeName = t(`aura.theme${theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}Name`);
  const basePrice = duration === 'month' ? 1200 : theme.price;
  const creativeFee = Math.round(basePrice * 0.09 * 10) / 10;
  const totalPrice = basePrice + creativeFee;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(!isProcessing && !isSuccess) ? onCancel : undefined}
          className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
        />

        {/* Receipt Paper */}
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-[#faf9f6] dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-2xl overflow-hidden"
          style={{
            clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))"
          }}
        >
          {isSuccess ? (
             <div className="p-10 flex flex-col items-center justify-center text-center pb-14 min-h-[400px]">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)] text-white"
                >
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </motion.div>
                <h2 className="text-xl font-black uppercase tracking-widest mb-2">{isEn ? "Payment Successful" : "Thanh Toán Thành Công"}</h2>
                <p className="text-zinc-500 text-sm font-medium">{isEn ? "You have successfully rented the theme" : "Bạn đã thuê thành công giao diện"}</p>
                <p className="font-bold text-lg mt-1">{themeName}</p>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 font-mono font-black text-2xl text-red-500 bg-red-500/10 dark:bg-red-500/20 px-6 py-3 rounded-full"
                >
                  - {totalPrice} JOY
                </motion.div>
             </div>
          ) : (
            <>
              {/* Header */}
              <div className="pt-8 pb-4 px-6 text-center border-b border-zinc-200 dark:border-zinc-800 border-dashed">
                <h2 className="font-black text-2xl tracking-tighter uppercase mb-1">Hugo Aura</h2>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">{isEn ? "Premium Theme Receipt" : "Hóa Đơn Thuê Giao Diện"}</p>
                <div className="mt-4 text-left">
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>{isEn ? "DATE" : "NGÀY"}:</span> <span>{new Date().toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}</span>
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>{isEn ? "TIME" : "GIỜ"}:</span> <span>{new Date().toLocaleTimeString(isEn ? 'en-US' : 'vi-VN')}</span>
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>{isEn ? "TXN" : "MÃ GD"}:</span> <span>#{Math.floor(Math.random() * 900000) + 100000}</span>
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="py-4 px-6 font-mono text-sm space-y-4 min-h-[150px]">
                
                {/* Duration Toggle */}
                <div className="flex bg-zinc-200 dark:bg-zinc-800 rounded-lg p-1 mb-4">
                  <button 
                    onClick={() => setDuration('day')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all ${duration === 'day' ? 'bg-white dark:bg-zinc-600 shadow-sm' : 'text-zinc-500'}`}
                  >
                    {isEn ? "1 Day" : "1 Ngày"} (50 JOY)
                  </button>
                  <button 
                    onClick={() => setDuration('month')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all ${duration === 'month' ? 'bg-white dark:bg-zinc-600 shadow-sm' : 'text-zinc-500'}`}
                  >
                    {isEn ? "30 Days" : "30 Ngày"} (1200 JOY)
                  </button>
                </div>

                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <span className="font-bold block uppercase">{themeName}</span>
                    <span className="text-[10px] text-zinc-500 block">+ {isEn ? "1 Exclusive Lofi Track" : "1 Nhạc Lofi độc quyền"}</span>
                    <span className="text-[10px] text-zinc-500 block">+ {isEn ? "Premium Visual Effects" : "Hiệu ứng hạt rơi VIP"}</span>
                    <span className="text-[10px] text-zinc-500 block mt-1">({isEn ? "Rent duration: " : "Thời hạn: "} {duration === 'month' ? '30 Days/Ngày' : '1 Day/Ngày'})</span>
                  </div>
                  <span className="font-bold">{basePrice} JOY</span>
                </div>
                
                <div className="flex justify-between items-start pt-2">
                  <div className="max-w-[70%]">
                    <span className="font-bold block text-xs">{isEn ? "Creative Fee (9%)" : "Phí sáng tạo (9%)"}</span>
                    <span className="text-[10px] text-zinc-500 block">{isEn ? "Platform maintenance & features" : "Bảo trì nền tảng & tính năng mới"}</span>
                  </div>
                  <span className="font-bold">{creativeFee} JOY</span>
                </div>
              </div>

              {/* Total */}
              <div className="py-4 px-6 border-t border-zinc-200 dark:border-zinc-800 border-dashed font-mono bg-zinc-50 dark:bg-zinc-800/20">
                <div className="flex justify-between items-center text-lg font-black">
                  <span>{isEn ? "TOTAL" : "TỔNG CỘNG"}</span>
                  <span>{totalPrice} JOY</span>
                </div>
              </div>

              {/* PAID STAMP */}
              {stampVisible && (
                <motion.div 
                  initial={{ scale: 3, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-500 text-red-500 font-black text-4xl px-6 py-2 uppercase tracking-widest rounded-lg"
                  style={{ textShadow: "0 0 4px rgba(239,68,68,0.5)" }}
                >
                  {isEn ? "PAID" : "ĐÃ THU"}
                </motion.div>
              )}

              {/* Actions */}
              <div className="p-6 bg-zinc-100 dark:bg-zinc-800/60 pb-10">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-2 text-zinc-500 font-mono text-xs">
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    <span>{isEn ? "Processing Transaction..." : "Đang xử lý giao dịch..."}</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={onCancel}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors border border-zinc-200 dark:border-zinc-600"
                    >
                      {isEn ? "Cancel" : "Hủy"}
                    </button>
                    <button
                      onClick={() => onConfirm(theme.id, duration)}
                      className="flex-[2] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                      {isEn ? "Pay" : "Thanh Toán"} {totalPrice} JOY
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
