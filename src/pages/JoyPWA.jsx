import React, { useState } from "react";
import Confetti from "react-confetti";
import "../styles/joy-pwa.css";
import JoyHeader from "../components/JoyHeader";
import JoyBalanceCard from "../components/JoyBalanceCard";
import JoyTransactions from "../components/JoyTransactions";
import JoyExchangeModal from "../components/member/shared/JoyExchangeModal";

const mockBalance = 1250;
const mockTx = [
  { id: 1, label: "Hoàn tiền dịch vụ", amount: 120, type: "credit", timestamp: "10 phút trước" },
  { id: 2, label: "Đổi lấy thiết kế", amount: -300, type: "debit", timestamp: "1 giờ trước" },
  { id: 3, label: "Thưởng nạp hồ sơ", amount: 80, type: "credit", timestamp: "Hôm qua" },
];

export default function JoyPWA() {
  const [openModal, setOpenModal] = useState(false);
  const [bio] = useState({ email: "user@example.com" });
  const [item] = useState("service:design");
  const [showConfetti, setShowConfetti] = useState(false);

  return (
    <div className="joy-pwa-app">
      <JoyHeader />

      <main className="joy-pwa-main">
        <JoyBalanceCard balance={mockBalance} onExchange={() => setOpenModal(true)} />

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
