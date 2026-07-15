import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import "../styles/joy-pwa.css";
import JoyHeader from "../components/JoyHeader";
import JoyBalanceCard from "../components/JoyBalanceCard";
import JoyTransactions from "../components/JoyTransactions";
import JoyExchangeModal from "../components/member/shared/JoyExchangeModal";
import TokenExchangeModal from "../components/member/banhocduong/TokenExchangeModal";
import ParticleConnectModal from "../components/member/shared/ParticleConnectModal";
import { getMemberSession, isMemberAuthenticated } from "../services/authSession";
import { useJoyStore } from "../stores/joyStore";
import { memberService } from "../services/classes/MemberService";
import { checkHasPin } from "../services/joyApi";
import { notify } from "../lib/notify";
import { Link } from "react-router-dom";

// VVIP Developer packages (tính từ service packages)
const VVIP_PACKAGES = [
  { id: "fix", name: "Sửa web", days: 30 },
  { id: "seo", name: "Tối ưu", days: 60 },
  { id: "landing", name: "Landing", days: 180 },
  { id: "website", name: "Website", days: 365 },
  { id: "system", name: "Web App", days: 730 },
];

function VVIPMembershipCard({ activeDays = 365 }) {
  const session = getMemberSession();
  if (!session?.email) return null;

  const now = new Date();
  const expireDate = new Date(now.getTime() + activeDays * 24 * 60 * 60 * 1000);
  const totalDays = activeDays;
  const elapsedDays = 0; // Tính từ ngày hôm nay
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
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Real balance & history state
  const balance = useJoyStore((s) => s.balance);
  const fetchBalance = useJoyStore((s) => s.fetchBalance);
  
  const [bio, setBio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  // Active modal control: null | 'select' | 'token' | 'aura'
  const [activeModal, setActiveModal] = useState(null);

  // ParticleConnectModal controls
  const [particleOpen, setParticleOpen] = useState(false);
  const [initialMode, setInitialMode] = useState("search");

  const session = getMemberSession();
  const isAuthenticated = isMemberAuthenticated();
  const isVVIPDeveloper = !!session?.email;

  // Load real bio & transaction PIN status
  const loadProfileInfo = () => {
    if (session?.email) {
      memberService.getMemberBio(session.email, session.displayName, session.avatarUrl)
        .then(setBio)
        .catch(err => console.error("Error loading bio:", err));
      
      checkHasPin()
        .then(d => setHasPin(d.hasPin))
        .catch(() => setHasPin(false));
    }
  };

  useEffect(() => {
    loadProfileInfo();
  }, [session?.email]);

  // Load transactions and sync balance
  const syncWallet = () => {
    if (!session?.email) return;
    fetchBalance(session.email);
    setLoadingTx(true);
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    fetch(`${apiBase}/joy/history?email=${encodeURIComponent(session.email)}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        if (d.transactions) {
          setTransactions(d.transactions.map((tx, idx) => ({
            id: tx._id || idx,
            label: tx.description,
            amount: tx.amount,
            type: tx.amount < 0 ? "debit" : "credit",
            when: new Date(tx.createdAt).toLocaleDateString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit"
            })
          })));
        }
      })
      .catch(err => console.error("Error loading transactions:", err))
      .finally(() => setLoadingTx(false));
  };

  useEffect(() => {
    if (session?.email) {
      syncWallet();
    }
  }, [session?.email, fetchBalance]);

  const showToast = (msg, type) => {
    if (type === "success") notify.success(msg);
    else if (type === "error") notify.error(msg);
    else notify.success(msg);
  };

  const playBeep = () => {
    try {
      const audio = new Audio("/sounds/beep.mp3");
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <div className="joy-pwa-app flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-6">
        <JoyHeader />
        <div className="p-8 rounded-2xl bg-card border border-border/50 max-w-md space-y-4 shadow-xl">
          <span className="material-symbols-outlined text-5xl text-[#5ec8ff]">lock</span>
          <h2 className="text-xl font-black">Truy Cập Bị Giới Hạn</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vui lòng đăng nhập bằng tài khoản thành viên để xem số dư, thực hiện giao dịch chuyển nhận JOY và quản lý ví của bạn.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-bold text-white transition hover:scale-105 active:scale-95"
          >
            Đăng Nhập Ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="joy-pwa-app">
      <JoyHeader />

      <main className="joy-pwa-main">
        <div className="space-y-4">
          {/* VVIP Developer Membership Card */}
          {isVVIPDeveloper && <VVIPMembershipCard activeDays={365} />}

          {/* Real Balance Card */}
          <JoyBalanceCard balance={balance} onExchange={() => setActiveModal("select")} />

          {/* Quick Actions for P2P Transfers & QR */}
          <div className="pwa-wallet-actions">
            <button
              onClick={() => {
                setInitialMode("search");
                setParticleOpen(true);
              }}
              className="pwa-action-btn"
            >
              <span className="pwa-action-icon material-symbols-outlined">send</span>
              <span className="pwa-action-label">Gửi JOY</span>
            </button>
            <button
              onClick={() => {
                setInitialMode("myqr");
                setParticleOpen(true);
              }}
              className="pwa-action-btn"
            >
              <span className="pwa-action-icon material-symbols-outlined">qr_code</span>
              <span className="pwa-action-label">Nhận JOY</span>
            </button>
            <button
              onClick={() => {
                setInitialMode("scan");
                setParticleOpen(true);
              }}
              className="pwa-action-btn"
            >
              <span className="pwa-action-icon material-symbols-outlined">qr_code_scanner</span>
              <span className="pwa-action-label">Quét Mã</span>
            </button>
          </div>

          {/* AI Tokens Info Card */}
          <div className="p-4 rounded-2xl border border-border/50 bg-[#0e1624]/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-blue-400">chat_bubble</span>
              <div>
                <p className="text-xs text-[#94a3b8]">Lượt chat AI (HugoPsy)</p>
                <p className="text-sm font-black text-white">{bio?.bonusChatTokens || 0} Token khả dụng</p>
              </div>
            </div>
            <button
              onClick={() => {
                playBeep();
                setActiveModal("token");
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#5ec8ff]/10 hover:bg-[#5ec8ff]/20 text-[#5ec8ff] transition-all"
            >
              Đổi thêm
            </button>
          </div>

          {/* Security Status Card */}
          <div className="p-4 rounded-2xl border border-border/50 bg-[#0e1624]/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined text-2xl ${hasPin ? 'text-emerald-400' : 'text-amber-500'}`}>
                {hasPin ? 'lock' : 'lock_open'}
              </span>
              <div>
                <p className="text-xs text-[#94a3b8]">Mã PIN Giao Dịch</p>
                <p className="text-sm font-black text-white">{hasPin ? "Đã bật bảo vệ 6 số" : "Chưa thiết lập mã PIN"}</p>
              </div>
            </div>
            {!hasPin ? (
              <button
                onClick={() => {
                  playBeep();
                  setInitialMode("search");
                  setParticleOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition-all"
              >
                Kích hoạt
              </button>
            ) : (
              <button
                onClick={() => {
                  playBeep();
                  setInitialMode("search");
                  setParticleOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#94a3b8]/10 text-[#94a3b8] transition-all cursor-pointer"
              >
                Đổi PIN
              </button>
            )}
          </div>

          {/* CSS local override */}
          <style>{`
            .pwa-wallet-actions {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              margin-top: 4px;
            }
            .pwa-action-btn {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 6px;
              background: rgba(255, 255, 255, 0.02);
              border: 1px solid rgba(255, 255, 255, 0.04);
              border-radius: 12px;
              padding: 14px 8px;
              color: #e6eef8;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .pwa-action-btn:hover {
              background: rgba(255, 255, 255, 0.05);
              transform: translateY(-2px);
              border-color: #5ec8ff;
            }
            .pwa-action-icon {
              font-size: 24px;
              color: #5ec8ff;
            }
            .pwa-action-label {
              font-size: 11px;
              font-weight: 800;
            }
          `}</style>

          {/* Package selector */}
          {isVVIPDeveloper && <VVIPPackageSelector />}
        </div>

        <div className="joy-pwa-panel">
          <h3 className="panel-title">Giao dịch gần đây</h3>
          {loadingTx ? (
            <p className="text-xs text-muted-foreground p-3">Đang tải lịch sử giao dịch...</p>
          ) : transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3">Chưa có giao dịch nào được thực hiện.</p>
          ) : (
            <JoyTransactions items={transactions} />
          )}
        </div>
      </main>

      <footer className="joy-pwa-footer">© Hugo Studio — JOY Wallet</footer>

      {/* Exchange Selection Sheet */}
      {activeModal === "select" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0e1624] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-zinc-800 p-6 relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-3.5 right-3.5 p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors bg-white/5 rounded-full"
            >
              <span className="material-symbols-outlined text-[16px] text-white">close</span>
            </button>
            <div className="text-center mb-6">
              <span className="material-symbols-outlined text-4xl text-amber-400 mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>currency_exchange</span>
              <h3 className="text-lg font-black text-white">Cửa Hàng Trao Đổi JOY</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Lựa chọn dịch vụ bạn mong muốn quy đổi từ số dư JOY tích lũy.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  playBeep();
                  setActiveModal("token");
                }}
                className="w-full p-4 rounded-2xl border border-zinc-800 bg-[#162032]/40 hover:bg-[#162032]/80 hover:border-amber-400/50 transition-all text-left flex items-center gap-3 active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">Lượt chat HugoPsy</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tỷ lệ: 25 JOY / 1 Token AI. Không giới hạn.</p>
                </div>
                <span className="material-symbols-outlined text-muted-foreground text-[18px]">chevron_right</span>
              </button>

              <button
                onClick={() => {
                  playBeep();
                  setActiveModal("aura");
                }}
                className="w-full p-4 rounded-2xl border border-zinc-800 bg-[#162032]/40 hover:bg-[#162032]/80 hover:border-purple-400/50 transition-all text-left flex items-center gap-3 active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">Đăng ký HugoAura</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Giá: 250 JOY. Kích hoạt tiện ích & Theme premium.</p>
                </div>
                <span className="material-symbols-outlined text-muted-foreground text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Token Modal */}
      <TokenExchangeModal
        isOpen={activeModal === "token"}
        onClose={() => {
          setActiveModal(null);
          loadProfileInfo();
          syncWallet();
        }}
        email={session?.email}
        showToast={showToast}
        onSuccess={() => {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }}
      />

      {/* Exchange HugoAura Subscription Modal */}
      <JoyExchangeModal
        open={activeModal === "aura"}
        bio={bio}
        item="service:design"
        onClose={() => {
          setActiveModal(null);
          loadProfileInfo();
          syncWallet();
        }}
        onConfirm={async () => {
          const apiBase = import.meta.env.VITE_API_URL || "/api";
          const res = await fetch(`${apiBase}/joy/subscribe-feature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ featureKey: "hugoAura" })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Giao dịch không thành công.");
          }
          const data = await res.json();
          syncWallet();
          return { ok: true, balance: data.balance };
        }}
        onSuccess={() => {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }}
      />

      {/* P2P Transfer & QR Modal */}
      <ParticleConnectModal
        open={particleOpen}
        bio={bio}
        initialMode={initialMode}
        onClose={() => {
          setParticleOpen(false);
          loadProfileInfo();
        }}
        onSuccess={() => {
          syncWallet();
          loadProfileInfo();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
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
