import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { isDonationWidgetVisible, setDonationWidgetVisible, DONATION_VISIBILITY_EVENT } from "../../utils/floatingWidgetPref";
import { useTranslation } from "react-i18next";
import { DONATION_CONFIG } from "../../config/donationConfig";

export default function DonationModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const { t } = useTranslation();
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [visible, setVisible] = useState(() => isDonationWidgetVisible());

  useEffect(() => {
    const handleOpen = () => setInternalIsOpen(true);
    window.addEventListener('open-donation', handleOpen);
    return () => window.removeEventListener('open-donation', handleOpen);
  }, []);

  useEffect(() => {
    const onVisibilityChange = (e) => setVisible(e.detail.visible);
    window.addEventListener(DONATION_VISIBILITY_EVENT, onVisibilityChange);
    return () => window.removeEventListener(DONATION_VISIBILITY_EVENT, onVisibilityChange);
  }, []);

  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const onClose = propOnClose || (() => setInternalIsOpen(false));

  const handleHide = (e) => {
    e.stopPropagation();
    setVisible(false);
    setDonationWidgetVisible(false);
  };

  return (
    <>
      {/* Floating Action Button when closed */}
      <AnimatePresence>
        {visible && !isOpen && (
          <m.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+10.5rem)] md:bottom-24 right-3 md:right-7 z-[999]"
          >
            <button
              onClick={() => setInternalIsOpen(true)}
              aria-label={t("donationUI.open", "Mở cổng tài trợ")}
              title="Buy me a coffee / Support Open-Source"
              className="relative w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-400 dark:from-amber-600 dark:to-yellow-500 text-slate-950 rounded-full shadow-[0_8px_30px_rgba(245,158,11,0.35)] border border-amber-200/50 flex items-center justify-center group overflow-hidden active:scale-90 transition-transform"
            >
              <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-30"></div>
              <span className="material-symbols-outlined text-[24px] relative z-10 group-hover:scale-110 transition-transform">
                coffee
              </span>
            </button>
            <button
              type="button"
              onClick={handleHide}
              aria-label={t("donationUI.hide", "Ẩn")}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-700 text-white border border-white/80 dark:border-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[12px] leading-none">close</span>
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* Global Patron Hub Modal */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-title"
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:inset-x-auto md:bottom-24 md:right-6 z-[1000] w-auto md:w-[440px] max-w-[calc(100vw-24px)] shadow-[0_24px_60px_rgba(0,0,0,0.3)] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 dark:from-amber-600 dark:to-amber-500 text-slate-950 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950/10 flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-xl">coffee</span>
                </div>
                <div>
                  <h3 id="donation-title" className="font-black text-sm leading-tight">
                    {t("donationUI.title", "Tài Trợ & Đồng Hành Cùng Hugo")}
                  </h3>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Global Patron & Open Source Lab</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={t("donationUI.close", "Đóng")}
                className="p-1.5 rounded-full hover:bg-slate-950/10 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto max-h-[min(70vh,580px)] space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                  Hugo Wishpax Studio hoạt động như một phòng nghiên cứu mã nguồn mở độc lập quốc tế. Chúng tôi tiếp nhận tài trợ tự nguyện toàn cầu qua các nền tảng bảo trợ uy tín.
                </p>
              </div>

              {/* Buy Me a Coffee Primary Action Card */}
              <a
                href={DONATION_CONFIG.buyMeACoffeeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-[#FFDD00] text-slate-950 font-bold shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-black/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black" aria-hidden="true">
                      <path d="M20.216 6.415l-.132-.666c-.119-.597-.387-1.127-.775-1.536-.39-.41-1.002-.638-1.771-.645H4.629c-.77.007-1.382.235-1.77.645-.39.41-.657.94-.776 1.536l-.132.666C1.38 7.026 1 8.243 1 9.531c0 2.228 1.107 4.197 2.805 5.372.482 1.488 1.624 2.668 3.12 3.151L6.16 20.5h11.68l-.765-2.446c1.496-.483 2.638-1.663 3.12-3.151 1.698-1.175 2.805-3.144 2.805-5.372 0-1.288-.38-2.505-.784-3.116zm-2.68 5.742c0 1.947-1.42 3.535-3.23 3.738l.635 2.03h-5.88l.635-2.03c-1.81-.203-3.23-1.79-3.23-3.738V6.075h11.07v6.082z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="block text-sm font-black">Buy Me a Coffee</span>
                    <span className="block text-[11px] opacity-80 font-medium">Mời ly cà phê $3, $5, $10 · Visa, Mastercard, Apple Pay</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </a>
              {/* Ko-fi Action Card */}
              <a
                href={DONATION_CONFIG.kofiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#72a4f2]/10 hover:bg-[#72a4f2]/20 border border-[#72a4f2]/30 text-foreground font-bold hover:scale-[1.01] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#72a4f2] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-lg">local_cafe</span>
                  </div>
                  <div>
                    <span className="block text-xs font-black text-[#2e69bf] dark:text-[#9bc2ff]">Ko-fi Patron (0% Phí)</span>
                    <span className="block text-[10px] text-muted-foreground font-normal">Ủng hộ qua Ko-fi trực tiếp · Visa, Mastercard, PayPal</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-base text-[#72a4f2] group-hover:translate-x-1 transition-transform">
                  open_in_new
                </span>
              </a>

              {/* GitHub Sponsors Action Card */}
              <a
                href={DONATION_CONFIG.githubSponsorsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-foreground font-bold hover:scale-[1.01] active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                  <div>
                    <span className="block text-xs font-black">GitHub Sponsors</span>
                    <span className="block text-[10px] text-muted-foreground font-normal">Tài trợ mã nguồn mở & dự án độc lập</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-base text-muted-foreground group-hover:translate-x-1 transition-transform">
                  open_in_new
                </span>
              </a>

              {/* PayPal / International Card */}
              {DONATION_CONFIG.paypalUrl && (
                <a
                  href={DONATION_CONFIG.paypalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-foreground font-bold hover:scale-[1.01] active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 font-black text-sm">
                      P
                    </div>
                    <div>
                      <span className="block text-xs font-black">PayPal Global</span>
                      <span className="block text-[10px] text-muted-foreground font-normal">Chuyển tiền tài trợ trực tiếp qua PayPal</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-base text-muted-foreground group-hover:translate-x-1 transition-transform">
                    open_in_new
                  </span>
                </a>
              )}

              <div className="pt-2 text-center text-[10px] text-muted-foreground leading-relaxed">
                Mọi đóng góp hoàn toàn mang tính tự nguyện nhằm duy trì hạ tầng máy chủ và nghiên cứu kỹ thuật. Không áp dụng mua bán hàng hoá thương mại điện tử.
              </div>
            </div>

            {/* Chat Bubble Tail */}
            <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white dark:bg-zinc-900 border-b border-r border-zinc-200 dark:border-zinc-800 transform rotate-45 pointer-events-none shadow-[4px_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3)]"></div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
