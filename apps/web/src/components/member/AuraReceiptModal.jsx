import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { localeForLanguage } from "../../i18n/languages";
import { useJoy } from "../../lib/joyDisplay";

// Giá thuê 30 ngày — server tính lại, đây chỉ là con số hiện ra để đối chiếu.
const THIRTY_DAY_PRICE = 1200;

export default function AuraReceiptModal({ isOpen, theme, onConfirm, onCancel, isProcessing, isSuccess }) {
  const { t, i18n } = useTranslation();
  const [stampVisible, setStampVisible] = useState(false);
  const [duration, setDuration] = useState('day'); // 'day' or 'month'
  const language = i18n.resolvedLanguage || i18n.language || "vi";
  const locale = localeForLanguage(language);

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

  const joy = useJoy();

  if (!isOpen || !theme) return null;

  const themeName = t(`aura.theme${theme.id.charAt(0).toUpperCase() + theme.id.slice(1)}Name`);
  const basePrice = duration === 'month' ? THIRTY_DAY_PRICE : theme.price;
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
          className="relative w-full max-w-sm bg-[#faf9f6] dark:bg-zinc-900 text-foreground shadow-2xl overflow-hidden"
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
                <h2 className="text-xl font-black uppercase tracking-widest mb-2">{t("aura.receipt.paymentSuccessful")}</h2>
                <p className="text-zinc-500 text-sm font-medium">{t("aura.receipt.rentalSuccessful")}</p>
                <p className="font-bold text-lg mt-1">{themeName}</p>
                
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 font-mono font-black text-2xl text-destructive bg-destructive/10 dark:bg-destructive/20 px-6 py-3 rounded-full"
                >
                  - {joy.text(totalPrice)}
                </motion.div>
             </div>
          ) : (
            <>
              {/* Header */}
              <div className="pt-8 pb-4 px-6 text-center border-b border-border border-dashed">
                <h2 className="font-black text-2xl tracking-tighter uppercase mb-1">Hugo Personal Space</h2>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">{t("aura.receipt.title")}</p>
                <div className="mt-4 text-left">
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>{t("aura.receipt.date")}:</span> <span>{new Date().toLocaleDateString(locale)}</span>
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>{t("aura.receipt.time")}:</span> <span>{new Date().toLocaleTimeString(locale)}</span>
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>{t("aura.receipt.transaction")}:</span> <span>#{Math.floor(Math.random() * 900000) + 100000}</span>
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="py-4 px-6 font-mono text-sm space-y-4 min-h-[150px]">
                
                {/* Duration Toggle */}
                <div className="flex bg-muted rounded-lg p-1 mb-4">
                  <button 
                    onClick={() => setDuration('day')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all ${duration === 'day' ? 'bg-white dark:bg-zinc-600 shadow-sm' : 'text-zinc-500'}`}
                  >
                    {t("aura.receipt.oneDay")} ({joy.text(theme.price)})
                  </button>
                  <button 
                    onClick={() => setDuration('month')}
                    className={`flex-1 text-xs py-1.5 rounded-md font-bold transition-all ${duration === 'month' ? 'bg-white dark:bg-zinc-600 shadow-sm' : 'text-zinc-500'}`}
                  >
                    {t("aura.receipt.thirtyDays")} ({joy.text(THIRTY_DAY_PRICE)})
                  </button>
                </div>

                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <span className="font-bold block uppercase">{themeName}</span>
                    <span className="text-[10px] text-zinc-500 block">+ {t("aura.receipt.systemTheme")}</span>
                    <span className="text-[10px] text-zinc-500 block">+ {t("aura.receipt.originalPattern")}</span>
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      ({t("aura.receipt.duration", {
                        duration: duration === "month"
                          ? t("aura.receipt.thirtyDays")
                          : t("aura.receipt.oneDay"),
                      })})
                    </span>
                  </div>
                  <span className="font-bold">{joy.text(basePrice)}</span>
                </div>
                
                <div className="flex justify-between items-start pt-2">
                  <div className="max-w-[70%]">
                    <span className="font-bold block text-xs">{t("aura.receipt.creativeFee")}</span>
                    <span className="text-[10px] text-zinc-500 block">{t("aura.receipt.creativeFeeDescription")}</span>
                  </div>
                  <span className="font-bold">{joy.text(creativeFee)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="py-4 px-6 border-t border-border border-dashed font-mono bg-muted/50">
                <div className="flex justify-between items-center text-lg font-black">
                  <span>{t("aura.receipt.total")}</span>
                  <span>{joy.text(totalPrice)}</span>
                </div>
              </div>

              {/* PAID STAMP */}
              {stampVisible && (
                <motion.div 
                  initial={{ scale: 3, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-destructive text-destructive font-black text-4xl px-6 py-2 uppercase tracking-widest rounded-lg"
                  style={{ textShadow: "0 0 4px rgba(239,68,68,0.5)" }}
                >
                  {t("aura.receipt.paid")}
                </motion.div>
              )}

              {/* Actions */}
              <div className="p-6 bg-muted pb-10">
                {isProcessing ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-2 text-zinc-500 font-mono text-xs">
                    <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                    <span>{t("aura.receipt.processing")}</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={onCancel}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-white dark:bg-zinc-700 text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-600 transition-colors border border-border"
                    >
                      {t("aura.receipt.cancel")}
                    </button>
                    <button
                      onClick={() => onConfirm(theme.id, duration)}
                      className="flex-[2] py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-zinc-900 hover:bg-foreground dark:text-black dark:hover:bg-zinc-200 transition-colors shadow-lg"
                    >
                      {t("aura.receipt.pay")} {joy.text(totalPrice)}
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
