import { useEffect, useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "../../../utils/haptics";
import { useJoyStore } from "../../../stores/joyStore";
import { getTodayInsight } from "./dailyInsightsData";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function TodayDailyRitual({ bio, onNavigate, showToast }) {
  const setStoreBalance = useJoyStore((s) => s.setBalance);
  const [walletData, setWalletData] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [copiedTip, setCopiedTip] = useState(false);

  // Mẹo công nghệ và AI thực chiến hôm nay
  const todayInsight = useMemo(() => getTodayInsight(), []);

  // Nạp trạng thái điểm danh và chuỗi ngày
  useEffect(() => {
    let active = true;
    async function loadWalletStatus() {
      try {
        const res = await fetch(`${API_BASE}/joy/wallet/overview`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.success) {
          setWalletData(data);
          if (typeof data.balance === "number") {
            setStoreBalance(data.balance);
          }
        }
      } catch {
        // im lặng nếu offline hoặc chưa đăng nhập
      }
    }

    loadWalletStatus();
    return () => {
      active = false;
    };
  }, [setStoreBalance]);

  const perks = walletData?.perks;
  const canCheckin = Boolean(perks?.canCheckin);
  const streakDays = perks?.streakDays || 0;
  const todayReward = perks?.todayReward || 240;

  // Xử lý điểm danh 1 chạm
  const handleCheckin = async () => {
    if (!canCheckin || claiming) return;
    triggerHaptic(15);
    setClaiming(true);

    try {
      const res = await fetch(`${API_BASE}/joy/wallet/claim-daily`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể điểm danh hôm nay.");
      }

      // Pháo giấy rực rỡ mừng điểm danh
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch {
        /* ignore */
      }

      triggerHaptic([10, 20, 10]);

      if (typeof data.balance === "number") {
        setStoreBalance(data.balance);
      }

      setWalletData((prev) => ({
        ...prev,
        perks: {
          ...prev?.perks,
          canCheckin: false,
          streakDays: data.streak || streakDays + 1,
        },
      }));

      showToast?.(data.message || `+${data.reward || todayReward} JOY! Điểm danh thành công.`, "success");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setClaiming(false);
    }
  };

  // Sao chép mẹo công nghệ
  const handleCopyTip = async () => {
    try {
      await navigator.clipboard.writeText(`${todayInsight.title}: ${todayInsight.takeaway}`);
      triggerHaptic(10);
      setCopiedTip(true);
      showToast?.("Đã sao chép mẹo công nghệ hôm nay!", "success");
      setTimeout(() => setCopiedTip(false), 2200);
    } catch {
      showToast?.("Không thể sao chép văn bản", "error");
    }
  };

  return (
    <div className="today-ritual-deck">
      {/* ── CARD 1: ĐIỂM DANH HÀNG NGÀY & CHUỖI STREAK ── */}
      <div className="today-checkin-card swiftui-liquid-glass">
        <div className="today-checkin-top">
          <div className="today-streak-badge">
            <span className="material-symbols-outlined today-streak-flame" aria-hidden="true">
              local_fire_department
            </span>
            <span className="today-streak-text">
              {streakDays > 0 ? `Chuỗi ${streakDays} ngày` : "Khởi đầu chuỗi mới"}
            </span>
          </div>
          <span className="today-reward-pill">
            +{todayReward} JOY
          </span>
        </div>

        <div className="today-checkin-body">
          <h4 className="today-checkin-heading">
            {canCheckin ? "Điểm danh nhận quà hôm nay" : "Đã hoàn thành điểm danh"}
          </h4>
          <p className="today-checkin-sub">
            {canCheckin
              ? `Tích lũy ${todayReward} JOY vào ví để mở khóa các tiện ích và học lập trình.`
              : "Bạn đã giữ vững chuỗi hôm nay. Hãy quay lại vào 09:00 sáng mai để nhận thêm!"}
          </p>
        </div>

        <div className="today-checkin-action">
          {canCheckin ? (
            <button
              type="button"
              className="swiftui-btn-prominent today-checkin-btn"
              onClick={handleCheckin}
              disabled={claiming}
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {claiming ? "progress_activity" : "sparkles"}
              </span>
              <span>{claiming ? "Đang ghi nhận…" : `Điểm danh (+${todayReward} JOY)`}</span>
            </button>
          ) : (
            <div className="today-checkin-done-pill">
              <span className="material-symbols-outlined" aria-hidden="true">
                check_circle
              </span>
              <span>Đã nhận hôm nay</span>
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 2: MỖI NGÀY 1 MẸO CÔNG NGHỆ / AI THỰC CHIẾN ── */}
      <div className="today-insight-card swiftui-liquid-glass">
        <div className="today-insight-header">
          <div className="today-insight-badge" style={{ background: todayInsight.gradient }}>
            <span className="material-symbols-outlined" aria-hidden="true">
              {todayInsight.icon}
            </span>
            <span>{todayInsight.category}</span>
          </div>

          <button
            type="button"
            className="today-copy-btn"
            onClick={handleCopyTip}
            aria-label="Sao chép mẹo này"
            title="Sao chép nội dung"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {copiedTip ? "done" : "content_copy"}
            </span>
            <span className="text-[13px]">{copiedTip ? "Đã chép" : "Sao chép"}</span>
          </button>
        </div>

        <div className="today-insight-content">
          <h4 className="today-insight-title">{todayInsight.title}</h4>
          <p className="today-insight-takeaway">{todayInsight.takeaway}</p>
        </div>

        <div className="today-insight-footer">
          <span className="today-insight-label">
            <span className="material-symbols-outlined" aria-hidden="true">tips_and_updates</span>
            {todayInsight.actionLabel}
          </span>
        </div>
      </div>

      {/* ── CARD 3: TIỆN ÍCH HỆ SINH THÁI NHANH ── */}
      <div className="today-quick-strip">
        <button
          type="button"
          className="today-quick-pill swiftui-glass"
          onClick={() => onNavigate?.("/member/wallet")}
        >
          <span className="material-symbols-outlined text-amber-500" aria-hidden="true">
            account_balance_wallet
          </span>
          <span>Ví JOY</span>
        </button>

        <button
          type="button"
          className="today-quick-pill swiftui-glass"
          onClick={() => onNavigate?.("/member/utilities?app=arcade")}
        >
          <span className="material-symbols-outlined text-purple-500" aria-hidden="true">
            sports_esports
          </span>
          <span>Hugo Arcade</span>
        </button>

        <button
          type="button"
          className="today-quick-pill swiftui-glass"
          onClick={() => onNavigate?.("/member/utilities?app=aura")}
        >
          <span className="material-symbols-outlined text-sky-500" aria-hidden="true">
            headphones
          </span>
          <span>Lofi Focus</span>
        </button>

        <button
          type="button"
          className="today-quick-pill swiftui-glass"
          onClick={() => onNavigate?.("/member/utilities")}
        >
          <span className="material-symbols-outlined text-emerald-500" aria-hidden="true">
            apps
          </span>
          <span>Tiện ích</span>
        </button>
      </div>
    </div>
  );
}
