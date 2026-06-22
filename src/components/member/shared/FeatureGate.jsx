import React, { useState } from "react";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import JoyExchangeModal from "./JoyExchangeModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

// Reusable monthly-subscription paywall. Wraps gated content; renders a
// "trao đổi JOY" unlock card instead when the subscription isn't active.
// Used by MemberIdeTab (whole tab), MemberRadioTab (whole tab), and
// MemberAuraTab (Lofi + Theme Shop section only — Pomodoro stays outside).
export default function FeatureGate({ bio, featureKey, priceJoy, icon, title, description, onBioUpdate, onBack, className = "", children }) {
  const { active } = useFeatureGate(bio, featureKey);
  const [showInvoice, setShowInvoice] = useState(false);

  if (active) {
    return (
      <>
        {children}
      </>
    );
  }

  const handleConfirmCharge = async () => {
    const res = await fetch(`${API_BASE}/joy/subscribe-feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: bio.email, featureKey })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi trao đổi JOY.");
    return data;
  };

  const handleSuccess = (data) => {
    useJoyStore.getState().setBalance(data.balance);
    onBioUpdate?.({
      ...bio,
      featureSubscriptions: {
        ...(bio.featureSubscriptions || {}),
        [featureKey]: { active: true, expiresAt: data.expiresAt }
      }
    });
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 rounded-3xl border border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 relative ${className}`}>
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span> Quay lại
        </button>
      )}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-3xl">{icon || "lock"}</span>
      </div>
      <h3 className="text-lg font-black text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>
      <button
        onClick={() => setShowInvoice(true)}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-base">bolt</span>
        Trao đổi {priceJoy} JOY/tháng
      </button>
      <p className="text-[10px] text-muted-foreground mt-4">JOY là đồng tích góp phi lợi nhuận — không thể nạp bằng tiền.</p>

      <JoyExchangeModal
        open={showInvoice}
        bio={bio}
        item={featureKey}
        onClose={() => setShowInvoice(false)}
        onConfirm={handleConfirmCharge}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
