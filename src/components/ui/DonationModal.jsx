import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { m, AnimatePresence } from "framer-motion";
import { dataApi } from "../../services/dataApi";
import { getMemberSession } from "../../services/authSession";
import { notify } from "../../lib/notify";
import { isDonationWidgetVisible, setDonationWidgetVisible, DONATION_VISIBILITY_EVENT } from "../../utils/floatingWidgetPref";
import { useTranslation } from "react-i18next";

const VND_PACKS = [
  { amount: 10000, labelKey: "tea" },
  { amount: 30000, labelKey: "coffee" },
  { amount: 50000, labelKey: "server" },
  { amount: 100000, labelKey: "supporter" }
];

const MIN_DONATION = 5000;

export default function DonationModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = getMemberSession();
  
  const [loading, setLoading] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [visible, setVisible] = useState(() => isDonationWidgetVisible());
  const [selectedAmount, setSelectedAmount] = useState(30000);
  const [name, setName] = useState(() => session?.displayName || session?.name || "");
  const [email, setEmail] = useState(() => session?.email || "");

  useEffect(() => {
    const handleOpen = (event) => {
      if (event.detail?.name) setName(String(event.detail.name).slice(0, 80));
      if (event.detail?.email) setEmail(String(event.detail.email).slice(0, 254));
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
              className="relative w-14 h-14 bg-white dark:bg-zinc-800 rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-primary group overflow-hidden active:scale-90 transition-transform"
            >
              {/* Soft pulsing background effect */}
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-75"></div>
              <span className="material-symbols-outlined text-[24px] relative z-10 group-hover:animate-bounce">
                volunteer_activism
              </span>
            </button>
            {/* Dismiss — hides the donation widget if it's getting in the way; re-enable from Settings */}
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

      {/* The Chat Bubble */}
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
            className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] md:inset-x-auto md:bottom-24 md:right-6 z-[1000] w-auto md:w-[420px] max-w-[calc(100vw-24px)] shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-medium text-sm animate-pulse">{t("donationUI.creating")}</p>
                </div>
              </div>
            )}

          {/* Header */}
          <div className="bg-primary text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">volunteer_activism</span>
              <h3 id="donation-title" className="font-bold text-sm">{t("donationUI.title")}</h3>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              aria-label={t("donationUI.close")}
              className="p-1 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[min(72vh,620px)]">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mb-4 text-center">
              {t("donationUI.description")}
            </p>

            <div className="grid grid-cols-4 gap-2" aria-label={t("donationUI.suggestions")}>
              {VND_PACKS.map((pack) => (
                <button
                  key={pack.amount}
                  type="button"
                  aria-pressed={selectedAmount === pack.amount}
                  onClick={() => setSelectedAmount(pack.amount)}
                  disabled={loading}
                  className={`min-h-11 rounded-xl border px-2 text-center transition-all ${Number(selectedAmount) === pack.amount ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30' : 'border-border bg-muted/35 text-foreground hover:bg-muted'}`}
                >
                  <span className="block text-[10px] text-muted-foreground">{t(`donationUI.packs.${pack.labelKey}`)}</span>
                  <span className="block text-xs font-black">{`${(pack.amount / 1000).toLocaleString()}K`}</span>
                </button>
              ))}
            </div>

            <label className="mt-3 block text-xs font-bold text-foreground">
              {t("donationUI.amountLabel")}
              <div className="mt-1.5 flex min-h-12 items-center rounded-xl border border-border bg-background px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
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
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
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
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>
            </div>

            <p className="mt-3 flex items-start gap-2.5 rounded-xl bg-muted/45 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <span className="material-symbols-outlined mt-px text-[17px] text-primary" aria-hidden="true">favorite</span>
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

            <div className="mt-4 text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              {t("donationUI.securePayOS")}
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
