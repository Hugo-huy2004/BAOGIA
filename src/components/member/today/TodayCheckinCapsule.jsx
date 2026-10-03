import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { sensory } from "../../../lib/sensory";
import { useJoyStore } from "../../../stores/joyStore";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

/**
 * Thanh điểm danh & chuỗi ngày tinh tế dạng Capsule (Dynamic Island style)
 * Tinh gọn, sang trọng, không chiếm diện tích và không chen ngang luồng đọc tin tức.
 */
export default function TodayCheckinCapsule({ showToast, compact = false }) {
  const setStoreBalance = useJoyStore((s) => s.setBalance);
  const [walletData, setWalletData] = useState(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadStatus() {
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
        /* ignore */
      }
    }
    loadStatus();
    return () => {
      active = false;
    };
  }, [setStoreBalance]);

  const perks = walletData?.perks;
  const canCheckin = Boolean(perks?.canCheckin);
  const streakDays = perks?.streakDays || 0;
  const todayReward = perks?.todayReward || 240;

  const handleCheckin = async () => {
    if (!canCheckin || claiming) return;
    sensory.tap();
    setClaiming(true);

    try {
      const res = await fetch(`${API_BASE}/joy/wallet/claim-daily`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể điểm danh hôm nay.");

      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
        });
      } catch {
        /* ignore */
      }

      sensory.success();

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

      showToast?.(`+${data.reward || todayReward} JOY! Điểm danh chuỗi thành công.`, "success");
    } catch (err) {
      showToast?.(err.message, "error");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className={`today-checkin-capsule swiftui-liquid-glass ${compact ? "is-compact" : ""}`}>
      <div className="today-checkin-capsule-left">
        <span className="material-symbols-outlined today-capsule-flame" aria-hidden="true">
          local_fire_department
        </span>
        <span className="today-capsule-streak">
          {compact
            ? (streakDays > 0 ? `${streakDays}d` : "Chuỗi")
            : (streakDays > 0 ? `Chuỗi ${streakDays} ngày` : "Bắt đầu chuỗi")}
        </span>
      </div>

      <div className="today-checkin-capsule-right">
        {canCheckin ? (
          <button
            type="button"
            className="today-capsule-btn swiftui-btn-prominent"
            onClick={handleCheckin}
            disabled={claiming}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              {claiming ? "progress_activity" : "sparkles"}
            </span>
            <span>
              {claiming
                ? (compact ? "..." : "Đang nhận…")
                : compact
                ? `+${todayReward}`
                : `Điểm danh (+${todayReward} JOY)`}
            </span>
          </button>
        ) : (
          <span className="today-capsule-done">
            <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
            <span>{compact ? "Đã nhận" : "Đã nhận hôm nay"}</span>
          </span>
        )}
      </div>
    </div>
  );
}
