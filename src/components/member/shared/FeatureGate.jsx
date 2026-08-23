import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useJoyStore } from "../../../stores/joyStore";
import JoyExchangeModal from "./JoyExchangeModal";
import BackButton from "./BackButton";
import { joyText } from "../../../lib/joyDisplay";
import { API_BASE } from "../../../config/apiBase";

// Reusable monthly-subscription paywall. Wraps gated content; renders a
// "trao đổi JOY" unlock card instead when the subscription isn't active.
// Used by LessonView (whole tab), MemberRadioTab (whole tab), and
// MemberAuraTab (Lofi section only — Pomodoro and Account themes stay outside).
export default function FeatureGate({ bio, featureKey, priceJoy, icon, title, description, onBioUpdate, onBack, className = "", children }) {
  const { active } = useFeatureGate(bio, featureKey);
  const [showInvoice, setShowInvoice] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = !bio?.email;
  const returnTo = `${location.pathname}${location.search}${location.hash}`;

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

  const openGoogleLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div className={`relative overflow-hidden flex flex-col items-center justify-center text-center py-16 px-6 rounded-[2rem] border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-accent/10 shadow-xl shadow-primary/10 ${className}`}>
      <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      {onBack && <BackButton onClick={onBack} className="absolute left-2 top-2" />}
      <div className="relative w-16 h-16 rounded-2xl bg-card/80 border border-primary/20 text-primary flex items-center justify-center mb-5 shadow-lg">
        <span className="material-symbols-outlined text-3xl">{icon || "lock"}</span>
      </div>
      <h3 className="relative text-lg font-black text-foreground mb-2">{isGuest ? "Xác thực để mở trải nghiệm đầy đủ" : title}</h3>
      <p className="relative max-w-xl text-sm text-muted-foreground mb-6 leading-relaxed">
        {isGuest
          ? "Đăng nhập nhanh bằng Google để lưu dữ liệu, đồng bộ tiến độ và sử dụng các tính năng dành riêng cho thành viên."
          : description}
      </p>

      {isGuest ? (
        <>
          <div className="relative grid w-full max-w-md grid-cols-2 gap-3 mb-6 text-left">
            <div className="rounded-2xl border border-border/70 bg-card/75 p-3 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tài khoản thường</p>
              <p className="mt-1 text-lg font-black text-foreground">30 ngày miễn phí</p>
            </div>
            <div className="rounded-2xl border border-primary/25 bg-primary/10 p-3 backdrop-blur">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Học sinh · Sinh viên</p>
              <p className="mt-1 text-lg font-black text-foreground">365 ngày miễn phí</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openGoogleLogin}
            className="relative flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-sm shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-base">verified_user</span>
            Xác thực hoặc đăng ký bằng Google
          </button>
          <p className="relative text-[10px] text-muted-foreground mt-4">Không cần thẻ thanh toán · Email giáo dục được nhận diện tự động.</p>
        </>
      ) : (
        <>
          <button
            onClick={() => setShowInvoice(true)}
            className="relative flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">bolt</span>
            Trao đổi {joyText(priceJoy)}/tháng
          </button>
          <p className="relative text-[10px] text-muted-foreground mt-4">JOY là đồng tích góp phi lợi nhuận — không thể nạp bằng tiền.</p>

          <JoyExchangeModal
            open={showInvoice}
            bio={bio}
            item={featureKey}
            onClose={() => setShowInvoice(false)}
            onConfirm={handleConfirmCharge}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  );
}
