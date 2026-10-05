import { useState, useEffect } from "react";
import RegionNote from "../public/RegionNote";
import { useNavigate } from "react-router-dom";
import { m, AnimatePresence } from "framer-motion";
import { dataApi } from "../../services/api/modules/dataApi";
import { getMemberSession } from "../../services/api/core/authSession";
import { notify } from "../../lib/notify";
import { isDonationWidgetVisible, setDonationWidgetVisible, DONATION_VISIBILITY_EVENT } from "../../utils/floatingWidgetPref";
import { useTranslation } from "react-i18next";
import { DONATION_CONFIG } from "../../config/donationConfig";

const VND_PACKS = [
  { amount: 10000, labelKey: "tea" },
  { amount: 30000, labelKey: "coffee" },
  { amount: 50000, labelKey: "server" },
  { amount: 100000, labelKey: "supporter" }
];

const MIN_DONATION = 5000;

export default function DonationModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const session = getMemberSession();
  
  const [loading, setLoading] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [visible, setVisible] = useState(() => isDonationWidgetVisible());
  
  // Default to global tab if language is not Vietnamese
  const isVi = (i18n.resolvedLanguage || i18n.language || "vi").startsWith("vi");
  const [activeChannel, setActiveChannel] = useState(isVi ? "local" : "global");
  
  const [selectedAmount, setSelectedAmount] = useState(30000);
  const [name, setName] = useState(() => session?.displayName || session?.name || "");
  const [email, setEmail] = useState(() => session?.email || "");

  useEffect(() => {
    const handleOpen = (event) => {
      if (event.detail?.name) setName(String(event.detail.name).slice(0, 80));
      if (event.detail?.email) setEmail(String(event.detail.email).slice(0, 254));
      if (event.detail?.channel) setActiveChannel(event.detail.channel);
      setInternalIsOpen(true);
    };
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

  const payableAmount = Number(selectedAmount);

  const handleDonate = async () => {
    const validAmount = Number.isSafeInteger(payableAmount) && payableAmount >= MIN_DONATION;
    if (!validAmount) {
      notify.error(t("donationUI.minimumError"));
      return;
    }
    if (!name.trim() || !email.trim()) {
      notify.error(t("donationUI.identityError"));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        amount: payableAmount,
        name: name.trim(),
        email: email.trim(),
        termsAccepted: true,
      };
      const res = await dataApi.createDonationLink(payload);
      if (res.success && res.data?.customLinkId) {
        notify.success(t("donationUI.creating"));
        onClose();
        navigate(`/pay/${res.data.customLinkId}`);
        return;
      }
      throw new Error(t("donationUI.error"));
    } catch (err) {
      notify.error(err.message || t("donationUI.error"));
      setLoading(false);
    }
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
              aria-label={t("donationUI.open")}
              title="Buy me a coffee / Donate"
              className="relative w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-400 dark:from-amber-600 dark:to-yellow-500 text-slate-950 rounded-full shadow-[0_8px_30px_rgba(245,158,11,0.35)] border border-amber-200/50 flex items-center justify-center group overflow-hidden active:scale-90 transition-transform"
            >
              {/* Soft pulsing background effect */}
              <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-30"></div>
              <span className="material-symbols-outlined text-[24px] relative z-10 group-hover:scale-110 transition-transform">
                coffee
              </span>
            </button>
            {/* Dismiss */}
            <button
              type="button"
              onClick={handleHide}
              aria-label={t("donationUI.hide")}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-700 text-white border border-white/80 dark:border-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[12px] leading-none">close</span>
            </button>
          </m.div>
        )}
      </AnimatePresence>

      {/* The Global Donation & Patron Modal */}
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
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:inset-x-auto md:bottom-24 md:right-6 z-[1000] w-auto md:w-[440px] max-w-[calc(100vw-24px)] shadow-[0_20px_50px_rgba(0,0,0,0.25)] rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-medium text-sm animate-pulse">{t("donationUI.creating")}</p>
                </div>
              </div>
            )}

            {/* Header with Warm Coffee Theme */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 dark:from-amber-600 dark:to-amber-500 text-slate-950 p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950/10 flex items-center justify-center backdrop-blur-sm">
                  <span className="material-symbols-outlined text-xl">coffee</span>
                </div>
                <div>
                  <h3 id="donation-title" className="font-extrabold text-sm leading-tight">
                    {t("donationUI.title", "Mời Cà Phê & Tài Trợ Hugo")}
                  </h3>
                  <p className="text-[10px] font-semibold opacity-85">Global Patron & Open-Source Supporter</p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                aria-label={t("donationUI.close")}
                className="p-1.5 rounded-full hover:bg-slate-950/10 transition-colors flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Navigation Channel Tabs */}
            <div className="flex border-b border-border bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setActiveChannel("global")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeChannel === "global"
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-sm text-amber-500">public</span>
                <span>Toàn cầu (Buy Me a Coffee)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChannel("local")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeChannel === "local"
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-sm text-emerald-500">qr_code_2</span>
                <span>Việt Nam (VietQR)</span>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto max-h-[min(70vh,580px)]">
              {activeChannel === "global" ? (
                /* GLOBAL CHANNEL: BUY ME A COFFEE & GITHUB SPONSORS */
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-200 leading-relaxed">
                      Ủng hộ tác giả qua nền tảng thanh toán quốc tế — chấp nhận mọi loại thẻ <strong>Visa, Mastercard, Apple Pay, Google Pay & PayPal</strong>.
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
                      <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black" aria-hidden="true">
                          <path d="M20.216 6.415l-.132-.666c-.119-.597-.387-1.127-.775-1.536-.39-.41-1.002-.638-1.771-.645H4.629c-.77.007-1.382.235-1.77.645-.39.41-.657.94-.776 1.536l-.132.666C1.38 7.026 1 8.243 1 9.531c0 2.228 1.107 4.197 2.805 5.372.482 1.488 1.624 2.668 3.12 3.151L6.16 20.5h11.68l-.765-2.446c1.496-.483 2.638-1.663 3.12-3.151 1.698-1.175 2.805-3.144 2.805-5.372 0-1.288-.38-2.505-.784-3.116zm-2.68 5.742c0 1.947-1.42 3.535-3.23 3.738l.635 2.03h-5.88l.635-2.03c-1.81-.203-3.23-1.79-3.23-3.738V6.075h11.07v6.082z"/>
                        </svg>
                      </div>
                      <div>
                        <span className="block text-sm font-black">Buy Me a Coffee</span>
                        <span className="block text-[11px] opacity-80 font-medium">Mời ly cà phê $3, $5 hoặc $10</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </a>

                  {/* GitHub Sponsors Secondary Action Card */}
                  <a
                    href={DONATION_CONFIG.githubSponsorsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3.5 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-foreground font-bold hover:scale-[1.01] active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </div>
                      <div>
                        <span className="block text-xs font-extrabold">GitHub Sponsors</span>
                        <span className="block text-[10px] text-muted-foreground font-normal">Tài trợ mã nguồn mở & dự án Indie</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-base text-muted-foreground group-hover:translate-x-1 transition-transform">
                      open_in_new
                    </span>
                  </a>

                  <p className="text-[10px] text-center text-muted-foreground leading-relaxed pt-2">
                    Khoản tài trợ tự nguyện giúp duy trì hạ tầng máy chủ và nghiên cứu công nghệ của Hugo Wishpax Studio.
                  </p>
                </div>
              ) : (
                /* LOCAL VIETNAM CHANNEL: VIETQR / PAYOS */
                <div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mb-4 text-center">
                    Ủng hộ tự nguyện qua chuyển khoản nhanh 24/7 (VietQR) tại Việt Nam.
                  </p>

                  <div className="grid grid-cols-4 gap-2" aria-label={t("donationUI.suggestions")}>
                    {VND_PACKS.map((pack) => (
                      <button
                        key={pack.amount}
                        type="button"
                        aria-pressed={selectedAmount === pack.amount}
                        onClick={() => setSelectedAmount(pack.amount)}
                        disabled={loading}
                        className={`min-h-11 rounded-xl border px-2 text-center transition-all ${
                          Number(selectedAmount) === pack.amount
                            ? 'border-amber-500 bg-amber-500/10 text-foreground ring-1 ring-amber-500/30'
                            : 'border-border bg-muted/35 text-foreground hover:bg-muted'
                        }`}
                      >
                        <span className="block text-[10px] text-muted-foreground">{t(`donationUI.packs.${pack.labelKey}`)}</span>
                        <span className="block text-xs font-black">{`${(pack.amount / 1000).toLocaleString()}K`}</span>
                      </button>
                    ))}
                  </div>

                  <label className="mt-3 block text-xs font-bold text-foreground">
                    {t("donationUI.amountLabel")}
                    <div className="mt-1.5 flex min-h-12 items-center rounded-xl border border-border bg-background px-3 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15">
                      <input
                        type="number"
                        min={MIN_DONATION}
                        step="1000"
                        inputMode="numeric"
                        value={selectedAmount}
                        onChange={(event) => setSelectedAmount(event.target.value === "" ? "" : Number(event.target.value))}
                        className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none"
                        aria-describedby="donation-minimum"
                      />
                      <span className="text-xs font-bold text-muted-foreground">VNĐ</span>
                    </div>
                    <span id="donation-minimum" className="mt-1 block text-[10px] font-normal text-muted-foreground">{t("donationUI.minimum")}</span>
                    <RegionNote scope="donate" />
                  </label>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-foreground">
                      {t("donationUI.nameLabel")}
                      <input
                        type="text"
                        autoComplete="name"
                        maxLength={80}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                      />
                    </label>
                    <label className="text-xs font-bold text-foreground">
                      {t("donationUI.emailLabel")}
                      <input
                        type="email"
                        autoComplete="email"
                        maxLength={254}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                      />
                    </label>
                  </div>

                  <p className="mt-3 flex items-start gap-2.5 rounded-xl bg-muted/45 p-3 text-[11px] leading-relaxed text-muted-foreground">
                    <span className="material-symbols-outlined mt-px text-[17px] text-amber-500" aria-hidden="true">favorite</span>
                    <span>{t("donationUI.recognitionNotice")}</span>
                  </p>

                  <button
                    type="button"
                    onClick={handleDonate}
                    disabled={loading}
                    className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[19px]" aria-hidden="true">qr_code_2</span>
                    {t("donationUI.continuePayOS", { amount: payableAmount.toLocaleString("vi-VN") })}
                  </button>

                  <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
                    {t("donationUI.terms")}
                  </p>
                </div>
              )}
            </div>

            {/* Chat Bubble Tail */}
            <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white dark:bg-zinc-900 border-b border-r border-zinc-200 dark:border-zinc-800 transform rotate-45 pointer-events-none shadow-[4px_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3)]"></div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
