import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { dataApi } from "../../services/dataApi";
import { getMemberSession } from "../../services/authSession";
import toast from "react-hot-toast";
import { isDonationWidgetVisible, setDonationWidgetVisible, DONATION_VISIBILITY_EVENT } from "../../utils/floatingWidgetPref";

const DONATION_PACKS = [
  { amount: 9999, label: "Trà Đá", icon: "emoji_food_beverage", color: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30" },
  { amount: 19999, label: "Bữa Sáng", icon: "breakfast_dining", color: "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30" },
  { amount: 29999, label: "Ly Cafe", icon: "local_cafe", color: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30", popular: true },
  { amount: 59999, label: "Server", icon: "dns", color: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" },
  { amount: 99999, label: "Fan Cứng", icon: "favorite", color: "bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-500/30" }
];

export default function DonationModal({ isOpen: propIsOpen, onClose: propOnClose }) {
  const navigate = useNavigate();
  const session = getMemberSession();
  
  const [loading, setLoading] = useState(false);
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

  if (!visible) return null;

  const handleDonate = async (amount) => {
    setLoading(true);
    try {
      const payload = {
        amount,
        name: session?.displayName || session?.name || session?.email?.split('@')[0] || "Khách"
      };
      const res = await dataApi.createDonationLink(payload);
      if (res.success && res.data?.customLinkId) {
        toast.success("Đang tạo mã thanh toán...");
        onClose();
        navigate(`/pay/${res.data.customLinkId}`);
      }
    } catch (err) {
      toast.error(err.message || "Không thể tạo mã, vui lòng thử lại sau.");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button when closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+10.5rem)] md:bottom-24 right-3 md:right-7 z-[999]"
          >
            <button
              onClick={() => setInternalIsOpen(true)}
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
              aria-label="Ẩn nút donate"
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-700 text-white border border-white/80 dark:border-zinc-900 flex items-center justify-center shadow-md active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-[12px] leading-none">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Chat Bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+14.5rem)] md:bottom-[160px] right-4 md:right-6 z-[1000] w-[340px] max-w-[calc(100vw-24px)] shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
          >
            {loading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-zinc-600 dark:text-zinc-300 font-medium text-sm animate-pulse">Đang tạo mã...</p>
                </div>
              </div>
            )}

          {/* Header */}
          <div className="bg-primary text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">volunteer_activism</span>
              <h3 className="font-bold text-sm">Buy Me A Coffee</h3>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed mb-4 text-center">
              Nếu thấy tiện ích hữu ích, hãy mời đội ngũ Hugo Studio một ly cafe để duy trì Server nhé!
            </p>

            <div className="space-y-2">
              {DONATION_PACKS.map((pack) => (
                <button
                  key={pack.amount}
                  onClick={() => handleDonate(pack.amount)}
                  disabled={loading}
                  className={`w-full relative flex items-center justify-between p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md ${pack.color} ${pack.popular ? 'border-primary dark:border-primary/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{pack.icon}</span>
                    <span className="font-bold text-sm">{pack.label}</span>
                  </div>
                  <div className="flex items-center gap-1 font-black text-sm">
                    {pack.amount.toLocaleString("vi-VN")} <span className="text-[10px] opacity-70">đ</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              Thanh toán an toàn qua Cổng VietQR nội địa 🇻🇳
            </div>
          </div>

          {/* Chat Bubble Tail */}
          <div className="absolute -bottom-3 right-8 w-6 h-6 bg-white dark:bg-zinc-900 border-b border-r border-zinc-200 dark:border-zinc-800 transform rotate-45 pointer-events-none shadow-[4px_4px_10px_rgba(0,0,0,0.05)] dark:shadow-[4px_4px_10px_rgba(0,0,0,0.3)]"></div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
