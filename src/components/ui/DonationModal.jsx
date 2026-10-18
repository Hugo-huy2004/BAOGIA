import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { isDonationWidgetVisible, setDonationWidgetVisible, DONATION_VISIBILITY_EVENT } from "../../utils/floatingWidgetPref";
import { useTranslation } from "react-i18next";
import { DONATION_CONFIG } from "../../config/donationConfig";

/**
 * Global Patron & Coffee Lounge Modal
 * Thiết kế phong cách Warm Studio Lounge: Dễ thương, tinh tế, chuẩn hóa quốc tế 100%.
 */
export default function DonationModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const { t } = useTranslation();
  
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [visible, setVisible] = useState(() => isDonationWidgetVisible());
  const [activeTreat, setActiveTreat] = useState(null);

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

  const treats = [
    { id: 'coffee', emoji: '☕', label: t('donationUI.treats.coffee', 'Ly Cà Phê ($3)'), url: DONATION_CONFIG.buyMeACoffeeUrl },
    { id: 'boba', emoji: '🧋', label: t('donationUI.treats.boba', 'Trà Sữa Topping ($5)'), url: DONATION_CONFIG.kofiUrl },
    { id: 'pastry', emoji: '🥐', label: t('donationUI.treats.pastry', 'Bánh Ngọt Sáng ($10)'), url: DONATION_CONFIG.buyMeACoffeeUrl },
    { id: 'server', emoji: '🚀', label: t('donationUI.treats.server', 'Nuôi Server Tháng ($25)'), url: DONATION_CONFIG.githubSponsorsUrl },
  ];

  return (
    <>
      {/* Floating Cute Coffee Widget Button when closed */}
      <AnimatePresence>
        {visible && !isOpen && (
          <m.div
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+10.5rem)] md:bottom-24 right-3 md:right-7 z-[999] flex items-center"
          >
            <div className="relative group">
              <button
                onClick={() => setInternalIsOpen(true)}
                aria-label={t("donationUI.open", "Mời cà phê & ủng hộ studio")}
                className="relative flex items-center gap-2 pl-3.5 pr-4 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-full shadow-[0_8px_25px_rgba(245,158,11,0.38)] border border-amber-200/60 hover:shadow-[0_12px_30px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all"
              >
                <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-950/10 text-base">
                  <span className="animate-bounce">☕</span>
                </span>
                <span className="tracking-tight">{t("donationUI.title", "Mời Cà Phê")}</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              </button>

              <button
                type="button"
                onClick={handleHide}
                aria-label={t("donationUI.hide", "Ẩn")}
                title={t("donationUI.hide", "Ẩn")}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 text-white/90 hover:text-white border border-white/60 flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-[11px] leading-none">close</span>
              </button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Global Patron Lounge Modal */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="donation-title"
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:inset-x-auto md:bottom-24 md:right-7 z-[1000] w-auto md:w-[450px] max-w-[calc(100vw-24px)] shadow-[0_25px_70px_rgba(0,0,0,0.35)] rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-amber-200/40 dark:border-zinc-800 overflow-hidden flex flex-col"
          >
            {/* Cute Lounge Header */}
            <div className="relative bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 dark:from-amber-600 dark:via-amber-500 dark:to-yellow-600 text-slate-950 p-4.5 px-5 flex items-center justify-between shadow-sm overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute -right-4 -bottom-4 text-6xl opacity-15 select-none pointer-events-none">☕</div>

              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-slate-950/10 flex items-center justify-center backdrop-blur-md shadow-inner text-xl">
                  <span>☕</span>
                </div>
                <div>
                  <h3 id="donation-title" className="font-black text-sm tracking-tight leading-snug">
                    {t("donationUI.title", "Mời Cà Phê & Bảo Trợ Hugo")}
                  </h3>
                  <p className="text-[10px] font-bold tracking-wider uppercase opacity-85">
                    {t("donationUI.subTitle", "Global Patron & Open-Source Studio")}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                aria-label={t("donationUI.close", "Đóng")}
                className="relative z-10 w-8 h-8 rounded-full bg-slate-950/10 hover:bg-slate-950/20 active:scale-90 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base font-bold">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[min(72vh,600px)] space-y-4.5">
              {/* Warm Welcome Message */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 text-center">
                <p className="text-xs font-medium text-amber-950 dark:text-amber-100 leading-relaxed">
                  {t(
                    "donationUI.intro",
                    "Hugo Wishpax Studio vận hành như một phòng nghiên cứu công nghệ độc lập. Sự đồng hành tự nguyện của Quý vị giúp studio duy trì các công cụ mã nguồn mở hữu ích cho cộng đồng."
                  )}
                </p>
              </div>

              {/* Quick Treats Selector (Cute Pickers) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span>✨</span> {t("donationUI.quickTreats", "Chọn nhanh tặng phẩm gửi Hugo")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {treats.map((treat) => (
                    <a
                      key={treat.id}
                      href={treat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => setActiveTreat(treat.id)}
                      onMouseLeave={() => setActiveTreat(null)}
                      className={`group flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        activeTreat === treat.id
                          ? "bg-amber-100/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 scale-[1.02] shadow-sm"
                          : "bg-muted/40 hover:bg-muted/70 border-border/80"
                      }`}
                    >
                      <span className="text-base group-hover:scale-125 transition-transform">{treat.emoji}</span>
                      <span className="truncate">{treat.label}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Divider / Channels Label */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {t("donationUI.channelsTitle", "Cổng bảo trợ toàn cầu")}
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>

              {/* Channels List */}
              <div className="space-y-2.5">
                {/* 1. Buy Me a Coffee Primary Action Card */}
                <a
                  href={DONATION_CONFIG.buyMeACoffeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center justify-between p-3.5 rounded-2xl bg-[#FFDD00] text-slate-950 font-bold shadow-sm hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0 shadow-inner">
                      {/* Buy Me a Coffee Official Logo Vector */}
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-slate-950" aria-hidden="true">
                        <path d="M20.216 6.415l-.132-.666c-.119-.597-.387-1.127-.775-1.536-.39-.41-1.002-.638-1.771-.645H4.629c-.77.007-1.382.235-1.77.645-.39.41-.657.94-.776 1.536l-.132.666C1.38 7.026 1 8.243 1 9.531c0 2.228 1.107 4.197 2.805 5.372.482 1.488 1.624 2.668 3.12 3.151L6.16 20.5h11.68l-.765-2.446c1.496-.483 2.638-1.663 3.12-3.151 1.698-1.175 2.805-3.144 2.805-5.372 0-1.288-.38-2.505-.784-3.116zm-2.68 5.742c0 1.947-1.42 3.535-3.23 3.738l.635 2.03h-5.88l.635-2.03c-1.81-.203-3.23-1.79-3.23-3.738V6.075h11.07v6.082z"/>
                      </svg>
                    </div>
                    <div>
                      <span className="block text-xs font-black tracking-tight">{t("donationUI.bmacTitle", "Buy Me a Coffee")}</span>
                      <span className="block text-[10px] opacity-80 font-medium">
                        {t("donationUI.bmacDesc", "Mời ly cà phê $3, $5, $10 · Visa, Mastercard, Apple Pay")}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </a>

                {/* 2. Ko-fi Patron Action Card */}
                <a
                  href={DONATION_CONFIG.kofiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#13C3FF]/10 dark:bg-[#13C3FF]/15 hover:bg-[#13C3FF]/20 border border-[#13C3FF]/30 text-foreground font-bold hover:scale-[1.01] active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#13C3FF] text-white flex items-center justify-center shrink-0 shadow-sm">
                      {/* Official Ko-fi Cup with Heart Logo */}
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.016 2.935-2.086 2.935-2.086s3.882.269 5.568-2.616c1.688-2.887.804-5.948.804-5.948zm-4.76 4.792c-.672 1.151-1.745 1.168-1.745 1.168V7.327s1.391-.082 2.115.655c.725.738.302 2.417-.37 3.758zm-7.697.587c-2.316 2.196-4.305.617-4.305.617s-.828-.66-1.527-1.46c-.7-1.02-.68-1.921-.68-1.921s.032-1.282 1.341-1.63c1.31-.347 2.052.548 2.052.548s.579-.909 1.947-.643c1.368.267 1.796 1.488 1.796 1.488s.24 1.258-.624 2.158v.843z"/>
                      </svg>
                    </div>
                    <div>
                      <span className="block text-xs font-black text-[#0092c4] dark:text-[#52d3ff]">
                        {t("donationUI.kofiTitle", "Ko-fi Patron (0% Phí sàn)")}
                      </span>
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {t("donationUI.kofiDesc", "Tài trợ trực tiếp · Visa, Mastercard, PayPal")}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-base text-[#13C3FF] group-hover:translate-x-1 transition-transform">
                    open_in_new
                  </span>
                </a>

                {/* 3. GitHub Sponsors Official Action Card */}
                <div className="p-3.5 rounded-2xl bg-muted/60 hover:bg-muted border border-border transition-all flex items-center justify-between gap-3">
                  <a
                    href={DONATION_CONFIG.githubSponsorsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-85 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shrink-0 shadow-sm">
                      {/* GitHub Sponsors Double Heart Vector */}
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" aria-hidden="true">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div className="truncate">
                      <span className="block text-xs font-black text-rose-600 dark:text-rose-400">
                        {t("donationUI.githubTitle", "GitHub Sponsors")}
                      </span>
                      <span className="block text-[10px] text-muted-foreground font-normal truncate">
                        {t("donationUI.githubDesc", "Bảo trợ chính thức cho lập trình viên mã nguồn mở")}
                      </span>
                    </div>
                  </a>
                  <div className="shrink-0 flex items-center">
                    <iframe
                      src="https://github.com/sponsors/Hugo-huy2004/button"
                      title="Sponsor Hugo-huy2004"
                      height="32"
                      width="114"
                      className="border-0 rounded-md overflow-hidden"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* 4. PayPal Hosted Checkout Action Card */}
                {DONATION_CONFIG.paypalUrl && (
                  <a
                    href={DONATION_CONFIG.paypalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3.5 rounded-2xl bg-[#003087]/10 hover:bg-[#003087]/15 border border-[#003087]/25 text-foreground font-bold hover:scale-[1.01] active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#003087] to-[#0079C1] text-white flex items-center justify-center shrink-0 shadow-sm font-black text-base">
                        <span className="text-[#0079C1] font-black italic -mr-0.5 drop-shadow">P</span>
                        <span className="text-white font-black italic drop-shadow">P</span>
                      </div>
                      <div>
                        <span className="block text-xs font-black text-[#003087] dark:text-[#5c9dff]">
                          {t("donationUI.paypalTitle", "PayPal Checkout")}
                        </span>
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          {t("donationUI.paypalDesc", "Thanh toán an toàn quốc tế qua thẻ hoặc tài khoản PayPal")}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-base text-[#0079C1] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </a>
                )}
              </div>

              {/* Security & Non-commercial Disclaimer */}
              <div className="pt-2 border-t border-border/60 space-y-1.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined text-[13px]">verified_user</span>
                  <span>{t("donationUI.secureNotice", "Kết nối trực tiếp 256-bit SSL · Không lưu trữ thẻ · 100% bảo mật")}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {t(
                    "donationUI.disclaimer",
                    "Mọi khoản tài trợ hoàn toàn tự nguyện nhằm duy trì hạ tầng kỹ thuật và lan tỏa tri thức. Không áp dụng mua bán hàng hoá thương mại điện tử tại Việt Nam."
                  )}
                </p>
              </div>
            </div>

            {/* Chat Bubble Tail Decor */}
            <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white/95 dark:bg-zinc-900/95 border-b border-r border-amber-200/40 dark:border-zinc-800 transform rotate-45 pointer-events-none shadow-[4px_4px_10px_rgba(0,0,0,0.06)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3)]"></div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
