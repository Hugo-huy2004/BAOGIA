import React, { useState } from "react";
import Confetti from "react-confetti";
import "../styles/joy-pwa.css";
import JoyHeader from "../components/JoyHeader";
import JoyBalanceCard from "../components/JoyBalanceCard";
import JoyTransactions from "../components/JoyTransactions";
import JoyExchangeModal from "../components/member/shared/JoyExchangeModal";
import { getMemberSession } from "../services/authSession";

const mockBalance = 1250;
const mockTx = [
  { id: 1, label: "Hoàn tiền dịch vụ", amount: 120, type: "credit", timestamp: "10 phút trước" },
  { id: 2, label: "Đổi lấy thiết kế", amount: -300, type: "debit", timestamp: "1 giờ trước" },
  { id: 3, label: "Thưởng nạp hồ sơ", amount: 80, type: "credit", timestamp: "Hôm qua" },
];

// Mock VVIP Developer packages (tính từ service packages)
const VVIP_PACKAGES = [
  { id: "fix", name: "Sửa web", days: 30 },
  { id: "seo", name: "Tối ưu", days: 60 },
  { id: "landing", name: "Landing", days: 180 },
  { id: "website", name: "Website", days: 365 },
  { id: "system", name: "Web App", days: 730 },
];

// Component hiển thị membership progress
function VVIPMembershipCard({ activeDays = 365 }) {
  const session = getMemberSession();
  if (!session?.email) return null;

  const now = new Date();
  const expireDate = new Date(now.getTime() + activeDays * 24 * 60 * 60 * 1000);
  const totalDays = activeDays;
  const elapsedDays = 0; // Mock: tính từ ngày hôm nay
  const progress = Math.min(100, (elapsedDays / totalDays) * 100);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-500/10 border border-purple-500/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-purple-600 dark:text-purple-400">workspace_premium</span>
          <div>
            <p className="font-bold text-foreground">VVIP Developer Member</p>
            <p className="text-xs text-muted-foreground">Cấp: {activeDays} ngày</p>
          </div>
        </div>
        <span className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">VVIP</span>
      </div>

      {/* Membership expiry progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground">Hết hạn vào: {expireDate.toLocaleDateString("vi-VN")}</span>
          <span className="text-xs text-muted-foreground">{elapsedDays}/{totalDays} ngày</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden border border-border/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Component chọn package để xem preview ngày
function VVIPPackageSelector() {
  const [selected, setSelected] = useState("website");
  const selectedPkg = VVIP_PACKAGES.find((p) => p.id === selected);

  return (
    <div className="p-4 rounded-2xl border border-border/50 bg-card/50 space-y-4">
      <div>
        <p className="text-sm font-bold text-foreground mb-3">Các gói Developer (cộng dồn ngày):</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VVIP_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelected(pkg.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                selected === pkg.id
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {pkg.name}
              <span className="block text-[10px] mt-0.5 opacity-80">+{pkg.days}d</span>
            </button>
          ))}
        </div>
      </div>

      {selectedPkg && (
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <p className="text-xs text-muted-foreground mb-1">Nếu chọn gói "<strong>{selectedPkg.name}</strong>":</p>
          <p className="text-sm font-bold text-foreground">+{selectedPkg.days} ngày membership</p>
        </div>
      )}
    </div>
  );
}

export default function JoyPWA() {
  const [openModal, setOpenModal] = useState(false);
  const [bio] = useState({ email: "user@example.com" });
  const [item] = useState("service:design");
  const [showConfetti, setShowConfetti] = useState(false);

  const session = getMemberSession();
  const isVVIPDeveloper = !!session?.email; // Mock: kiểm tra nếu là dev

  return (
    <div className="joy-pwa-app">
      <JoyHeader />

      <main className="joy-pwa-main">
        {/* VVIP Developer Membership Card */}
        {isVVIPDeveloper && <VVIPMembershipCard activeDays={365} />}

        <JoyBalanceCard balance={mockBalance} onExchange={() => setOpenModal(true)} />

        {/* Package selector */}
        {isVVIPDeveloper && <VVIPPackageSelector />}

        <div className="joy-pwa-panel">
          <h3 className="panel-title">Giao dịch gần đây</h3>
          <JoyTransactions items={mockTx} />
        </div>
      </main>

      <footer className="joy-pwa-footer">© Hugo Studio — JOY Wallet</footer>

      <JoyExchangeModal
        open={openModal}
        bio={bio}
        item={item}
        onClose={() => setOpenModal(false)}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 800));
          return { ok: true };
        }}
        onSuccess={() => {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        }}
      />

      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={140}
          gravity={0.22}
          style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none" }}
        />
      )}
    </div>
  );
}
