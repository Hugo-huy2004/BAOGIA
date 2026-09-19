import React, { Suspense, lazy, useState, useCallback, useTransition, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { useJoyStore } from "../../../stores/joyStore";
import { useJoy } from "../../../lib/joyDisplay";
import { hapticSelect, hapticSuccess } from "../../../utils/haptics";
import {
  fetchJoyPerks,
  fetchChallengeStatus,
  checkHasPin,
  getJoyLaterStatus,
  claimTreeBonus,
} from "../../../services/joyApi";
import MetalCard3D from "./MetalCard3D";
import TierPrivilegesSection from "./TierPrivilegesSection";
import { memberTier } from "../../../lib/memberTier";
import TransactionReceiptModal from "./TransactionReceiptModal";
                                                                                       
import "./wallet-app.css";

// Lazy-loaded Panels for Instant 0ms Paint & Smooth Apple-standard UX
const JoyMissions = lazy(() => import("../joy/JoyMissions"));
const JoyHistory = lazy(() => import("../joy/JoyHistory"));
const JoyRewardsHub = lazy(() => import("../joy/JoyRewardsHub"));
const MemberUtilityStoreTab = lazy(() => import("../MemberUtilityStoreTab"));
const JoyLaterSheet = lazy(() => import("../account/JoyLaterSheet"));
const JoyTree = lazy(() => import("./JoyTree"));

                             
            
                      
                                                                                     
                                     
                                                    
                      
                                         
 

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// 4 Tab chuẩn App rõ ràng, không trùng lặp (Thẻ 3D 2 mặt nằm ngay trong Tổng quan)
const TABS = [
  { id: "overview", icon: "account_balance_wallet", labelKey: "memberPortal.walletApp.tabOverview", fallback: "Tổng quan" },
  { id: "later", icon: "schedule_send", labelKey: "memberPortal.walletApp.tabLater", fallback: "Vay JOY" },
  { id: "missions", icon: "task_alt", labelKey: "memberPortal.walletApp.tabMissions", fallback: "Nhiệm vụ" },
  { id: "history", icon: "receipt_long", labelKey: "memberPortal.walletApp.tabHistory", fallback: "Sổ ví" },
];

const Panel = ({ children }                               ) => (
  <Suspense fallback={<p className="wal-loading text-center py-8 text-muted-foreground font-medium animate-pulse">Đang tải nội dung...</p>}>
    {children}
  </Suspense>
);

/** Ô vuông trong lưới lối tắt — icon trên nền thẻ, nhãn hai dòng, huy hiệu badge */
function Tile({ icon, label, badge, onClick }                                                                      ) {
  return (
    <button type="button" className="wal-tile active:scale-95 transition-all" onClick={onClick}>
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <small>{label}</small>
      {badge !== undefined && badge > 0 && <b className="wal-tile__badge">{badge}</b>}
    </button>
  );
}

/** Một hàng trong danh sách nhóm iOS chuẩn */
function Row({
  icon,
  title,
  detail,
  value,
  valueTone,
  badge,
  onClick,
}   
               
                
                  
                 
                           
                 
                       
 ) {
  return (
    <button type="button" className="wal-row active:scale-[0.99] transition-all" onClick={onClick}>
      <span className="wal-row__icon material-symbols-outlined" aria-hidden="true">{icon}</span>
      <span className="wal-row__body">
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
      {value && <span className={`wal-row__value${valueTone ? ` is-${valueTone}` : ""}`}>{value}</span>}
      {badge !== undefined && badge > 0 && <b className="wal-row__badge">{badge}</b>}
      <span className="wal-row__chevron material-symbols-outlined" aria-hidden="true">chevron_right</span>
    </button>
  );
}

export default function JoyWalletApp({
  bio,
  onBack,
  showToast,
  onBioUpdate,
  onOpenParticleModal,
  onSelectUtility,
}                   ) {
  const { t } = useTranslation();
  const joy = useJoy();
  const [, startTransition] = useTransition();

  const storeBalance = useJoyStore((s     ) => s.balance);
  const setStoreBalance = useJoyStore((s     ) => s.setBalance);

  // URL search params sync (?tab=later, ?sub=perks, etc.)
  const [searchParams] = useSearchParams();
  const paramTab = searchParams.get("tab");
  const paramSub = searchParams.get("sub");
  const [tab, setTab] = useState        (() => paramTab || "overview");
  const [sub, setSub] = useState               (() => paramSub || null);

  useEffect(() => {
    if (paramTab) setTab(paramTab);
    if (paramSub) setSub(paramSub);
  }, [paramTab, paramSub]);

  const email = bio?.email || bio?.contactEmail || "";

  // SWR: Nạp dữ liệu ví hợp nhất trong 1 lượt gọi duy nhất (0ms perceived latency)
  const { data: overview, mutate, isValidating } = useSWR                           (
    "/joy/wallet/overview",
    (url        ) =>
      fetch(`${API_BASE}${url}`, { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed to fetch wallet overview");
        return r.json();
      }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 12000,
    }
  );

  const activeBalance = overview?.balance ?? storeBalance ?? bio?.joyBalance ?? 0;
  const card = overview?.card;
  const perks = overview?.perks;
  const transactions = overview?.recentTransactions || [];
  const referralCode = card?.referralCode || bio?.referralCode || "JOY-MEMBER";
  const cardholderName = card?.cardholderName || bio?.displayName || "Thành viên Hugo Studio";

  // State hỗ trợ tính năng cũ tích hợp 100%
  const [challenges, setChallenges] = useState       ([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [loan, setLoan] = useState     (null);
  const [hasPin, setHasPin] = useState                (null);
  const [perksData, setPerksData] = useState     (null);
  const [perksLoading, setPerksLoading] = useState(false);
  const [perksError, setPerksError] = useState("");
  const [treeBonusTaken, setTreeBonusTaken] = useState(false);
  const [treeBusy, setTreeBusy] = useState(false);

  // Phân loại hạng thành viên và đồng bộ thẻ 3D + bảng đặc quyền
  const userTier = useMemo(() => {
    const t = memberTier(bio);
    if (t === "star18" || t === "star14" || t === "starVip") return t;
    return "eco";
  }, [bio]);
  const [selectedCardTier, setSelectedCardTier] = useState        (userTier);

  useEffect(() => {
    setSelectedCardTier(userTier);
  }, [userTier]);

  // Modals & UI Controls
  const [selectedTx, setSelectedTx] = useState                       (null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [txFilter, setTxFilter] = useState                      ("all");

  // Load challenges (Nhiệm vụ hàng ngày)
  const loadChallenges = useCallback(() => {
    if (!email) return;
    setChallengesLoading(true);
    fetchChallengeStatus(email)
      .then(setChallenges)
      .catch(() => {})
      .finally(() => setChallengesLoading(false));
  }, [email]);

  // Load JOYlater status (Khoản mở trước trả sau)
  const loadLoan = useCallback(() => {
    getJoyLaterStatus()
      .then((data) => setLoan(data?.loan || null))
      .catch(() => setLoan(null));
  }, []);

  // Load Perks (Ưu đãi & Vouchers)
  const loadPerks = useCallback(() => {
    if (!email) return;
    setPerksError("");
    setPerksLoading(true);
    fetchJoyPerks(bio)
      .then(setPerksData)
      .catch((error     ) => setPerksError(error.message || t("memberPortal.accountHub.perksLoadError", "Lỗi tải ưu đãi")))
      .finally(() => setPerksLoading(false));
  }, [bio, email, t]);

  useEffect(() => {
    if (!email) return;
    loadChallenges();
    loadLoan();
    checkHasPin()
      .then((data) => setHasPin(Boolean(data?.hasPin)))
      .catch(() => {});
  }, [email, loadChallenges, loadLoan]);

  useEffect(() => {
    if (sub === "perks" && !perksData) loadPerks();
    if (tab === "missions" && challenges.length === 0) loadChallenges();
    if (tab === "later" && !loan) loadLoan();
  }, [sub, tab, perksData, challenges.length, loan, loadPerks, loadChallenges, loadLoan]);

  // Lắng nghe sự kiện cập nhật ví
  useEffect(() => {
    const refresh = () => {
      mutate();
      loadLoan();
      loadChallenges();
    };
    window.addEventListener("hugo:notification", refresh);
    return () => window.removeEventListener("hugo:notification", refresh);
  }, [mutate, loadLoan, loadChallenges]);

  // Lọc lịch sử giao dịch
  const filteredTransactions = useMemo(() => {
    if (txFilter === "all") return transactions;
    if (txFilter === "in") return transactions.filter((tx) => (tx.amount ?? 0) >= 0);
    return transactions.filter((tx) => (tx.amount ?? 0) < 0);
  }, [transactions, txFilter]);

  // Tính toán số nhiệm vụ đang chờ nhận
  const pendingMissions = challenges.filter((item) => item.completed && !item.claimed);
  const claimedCount = challenges.filter((item) => item.claimed).length;
  const pendingJoy = pendingMissions.reduce((sum, item) => sum + (item.amount || 0), 0);
  const activeVoucherCount =
    perksData?.vouchers?.filter((voucher     ) => !voucher.used)?.length ||
    perks?.activeVouchersCount ||
    0;
  const spinAvailable = Boolean(perksData?.spin?.available ?? perks?.spinAvailable);

  // Sao chép Mã thẻ JOY 1 chạm
  const copyCardId = useCallback(async () => {
    hapticSelect();
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedId(true);
      showToast?.(`Đã sao chép mã thẻ: ${referralCode}`, "success");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      showToast?.("Không thể sao chép mã", "error");
    }
  }, [referralCode, showToast]);

  // Sao chép Link Nhận JOY
  const copyReceiveLink = useCallback(async () => {
    hapticSelect();
    const receiveUrl = `${window.location.origin}/member/account?ref=${encodeURIComponent(referralCode)}`;
    try {
      await navigator.clipboard.writeText(receiveUrl);
      setCopiedLink(true);
      showToast?.("Đã sao chép liên kết nhận JOY!", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast?.("Không thể sao chép liên kết", "error");
    }
  }, [referralCode, showToast]);

  // 1-Chạm Điểm Danh Nhận JOY tức thì
  const handleDailyCheckin = async () => {
    if (!perks?.canCheckin || claiming) return;
    hapticSelect();
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

      hapticSuccess();
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast?.(data.message || `+${data.reward} JOY! Điểm danh thành công.`, "success");

      if (typeof data.balance === "number") {
        setStoreBalance(data.balance);
      }

      startTransition(() => {
        mutate();
        loadChallenges();
      });
    } catch (err     ) {
      showToast?.(err.message || "Lỗi điểm danh", "error");
    } finally {
      setClaiming(false);
    }
  };

  // Thưởng Cây Nhiệm Vụ Hoàn Thành
  const handleClaimTreeBonus = async () => {
    setTreeBusy(true);
    try {
      const result = await claimTreeBonus();
      setTreeBonusTaken(true);
      if (typeof result.balance === "number") {
        setStoreBalance(result.balance);
      }
      mutate();
      showToast?.(t("memberPortal.walletApp.tree.bonusTaken", { amount: result.awarded || 50 }), "success");
    } catch (error     ) {
      if (/đã nhận/i.test(error.message)) setTreeBonusTaken(true);
      showToast?.(error.message || "Lỗi nhận thưởng cây", "error");
    } finally {
      setTreeBusy(false);
    }
  };

  const openSub = (subId        ) => {
    hapticSelect();
    if (subId === "perks" && !perksData) loadPerks();
    setSub(subId);
  };

  return (
    <div className="w-full selection:bg-amber-500/20 pb-24 md:pb-6">
      {/* ── 1. HEADER CHUẨN DESKTOP (CHỈ HIỂN THỊ TRÊN WEB DESKTOP MD+) ── */}
      <div className="hidden md:flex items-center justify-between border-b border-border/40 pb-4 mb-6">
        <div className="flex items-center gap-3">
          {sub && (
            <button
              type="button"
              onClick={() => setSub(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 active:scale-95 text-xs font-bold text-foreground transition-all"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Quay lại</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground tracking-tight m-0">Ví JOY</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10.5px] font-bold">
                1 JOY DUY NHẤT
              </span>
            </div>
            <p className="text-xs text-muted-foreground m-0 mt-0.5">
              Hệ sinh thái tài sản & quyền năng số Hugo Studio
            </p>
          </div>
        </div>

        {/* Thanh Tabs chuẩn Apple macOS / iPadOS Segmented Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/60 border border-border/40">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  hapticSelect();
                  setSub(null);
                  setTab(item.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tab === item.id && !sub
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                <span>{item.fallback}</span>
                {item.id === "missions" && pendingJoy > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                )}
                {item.id === "later" && loan && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-xs font-bold text-muted-foreground border border-border/40">
            <span className={`w-2 h-2 rounded-full ${isValidating ? "bg-amber-400 animate-spin" : "bg-emerald-400"}`} />
            <span>{isValidating ? "Đồng bộ..." : "Trực tuyến"}</span>
          </div>
        </div>
      </div>

      {/* ── 2. HEADER APP CHO WEB ĐIỆN THOẠI & PWA (CHỈ HIỂN THỊ TRÊN MOBILE) ── */}
      <div className="md:hidden w-full mb-3">
        <header className="px-4 py-3 rounded-2xl border border-border/40 bg-card/70 backdrop-blur-xl flex items-center justify-between z-20 shrink-0">
          {sub ? (
            <button
              type="button"
              onClick={() => setSub(null)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/70 hover:bg-muted active:scale-95 transition-all text-xs font-bold text-foreground"
              title="Quay lại"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Quay lại</span>
            </button>
          ) : (
            <div className="w-4" />
          )}

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <h1 className="text-xs font-black uppercase tracking-wider text-foreground m-0">
                VÍ JOY
              </h1>
            </div>
            <p className="text-[9.5px] font-semibold text-muted-foreground m-0">
              Hugo Studio
            </p>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 text-[10.5px] font-bold text-muted-foreground border border-border/40 mr-10">
            <span className={`w-1.5 h-1.5 rounded-full ${isValidating ? "bg-amber-400 animate-spin" : "bg-emerald-400"}`} />
            <span>{isValidating ? "Đồng bộ..." : "Trực tuyến"}</span>
          </div>
        </header>
      </div>

      {/* ── 3. VÙNG NỘI DUNG CHÍNH (TỰ ĐỘNG THÍCH ỨNG DESKTOP & MOBILE) ── */}
      <main className="space-y-5">
          
          {(sub === "rewards" || sub === "redeem") && (
            <Panel>
              <JoyRewardsHub
                perks={perksData}
                loading={perksLoading}
                error={perksError}
                onReload={loadPerks}
                email={email}
                bio={bio}
                onBioUpdate={onBioUpdate}
                onSelectUtility={onSelectUtility}
              />
            </Panel>
          )}

          {sub === "store" && (
            <Panel>
              <MemberUtilityStoreTab
                bio={bio}
                balance={activeBalance}
                onPurchased={(next        ) => {
                  setStoreBalance(next);
                  loadPerks();
                  mutate();
                }}
                onBioUpdate={onBioUpdate}
                showToast={showToast}
              />
            </Panel>
          )}

          {/* ── TAB 1: TỔNG QUAN (OVERVIEW) — BỐ CỤC CHUẨN DESKTOP & MOBILE ── */}
          {!sub && tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT TRÁI (DESKTOP 5 PHẦN / MOBILE 100%): THẺ 3D + NÚT THAO TÁC + SAO KÊ */}
              <div className="lg:col-span-5 space-y-4">
                {/* THẺ THÀNH VIÊN 3D 2 MẶT CHUẨN THIẾT KẾ & ĐỦ MÀU THEO CHÍNH SÁCH */}
                <MetalCard3D
                  balance={activeBalance}
                  cardholderName={cardholderName}
                  referralCode={referralCode}
                  bio={bio}
                  activeTier={selectedCardTier}
                  onTierChange={setSelectedCardTier}
                  onCopyCode={copyCardId}
                  copied={copiedId}
                />

                {/* THANH HÀNH ĐỘNG 1 CHẠM (QUICK ACTIONS) */}
                <section className="grid grid-cols-1 gap-3">
                  {/* Điểm danh 1 chạm */}
                  <button
                    type="button"
                    onClick={handleDailyCheckin}
                    disabled={!perks?.canCheckin || claiming}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 group shadow-sm text-center ${
                      perks?.canCheckin
                        ? "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20 text-amber-500"
                        : "bg-card border-border/30 opacity-70 cursor-not-allowed text-muted-foreground"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                      perks?.canCheckin ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground"
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {perks?.canCheckin ? "sparkles" : "task_alt"}
                      </span>
                    </div>
                    <span className="text-[11.5px] font-bold">
                      {perks?.canCheckin ? "Điểm danh" : "Đã nhận"}
                    </span>
                  </button>
                </section>

                {/* TỔNG KẾT SAO KÊ 30 NGÀY */}
                {overview?.summary && (
                  <section className="p-3.5 sm:p-4 rounded-2xl bg-card/70 border border-border/40 backdrop-blur-xl flex items-center justify-around text-center">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Nhận vào (30d)</p>
                      <p className="text-sm sm:text-base font-extrabold text-emerald-500 font-mono mt-0.5">
                        +{joy.number(overview.summary.earned)} JOY
                      </p>
                    </div>
                    <div className="h-7 w-px bg-border/40" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Chi dùng (30d)</p>
                      <p className="text-sm sm:text-base font-extrabold text-foreground/80 font-mono mt-0.5">
                        −{joy.number(overview.summary.spent)} JOY
                      </p>
                    </div>
                    <div className="h-7 w-px bg-border/40" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Chuỗi Streak</p>
                      <p className="text-sm sm:text-base font-extrabold text-amber-500 font-mono mt-0.5 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-sm">local_fire_department</span>
                        {perks?.streakDays || 0} ngày
                      </p>
                    </div>
                  </section>
                )}
              </div>

              {/* CỘT PHẢI (DESKTOP 7 PHẦN / MOBILE 100%): NHIỆM VỤ, LỐI TẮT, GIAO DỊCH, ĐẶC QUYỀN */}
              <div className="lg:col-span-7 space-y-5">
                {/* VIỆC ĐANG CHỜ (NEEDS-YOU ALERTS) */}
                {(pendingJoy > 0 || loan || hasPin === false) && (
                  <section className="wal-group" aria-label="Việc đang chờ">
                    {pendingJoy > 0 && (
                      <Row
                        icon="redeem"
                        title="Sẵn sàng nhận thưởng nhiệm vụ"
                        detail={`${pendingMissions.length} nhiệm vụ đã hoàn tất`}
                        value={`+${joy.number(pendingJoy)} JOY`}
                        valueTone="in"
                        onClick={() => {
                          hapticSelect();
                          setTab("missions");
                        }}
                      />
                    )}
                    {loan && (
                      <Row
                        icon="schedule_send"
                        title="Khoản mở trước JOYlater cần hoàn"
                        detail={`Còn ${loan.remainingDays} ngày hạn định`}
                        value={`−${joy.number(loan.outstanding)} JOY`}
                        valueTone="out"
                        onClick={() => {
                          hapticSelect();
                          setTab("later");
                        }}
                      />
                    )}
                    {hasPin === false && (
                      <Row
                        icon="lock_open"
                        title="Chưa kích hoạt mã PIN ví"
                        detail="Bảo vệ tài sản và giao dịch của bạn"
                        onClick={() => {
                          hapticSelect();
                          onOpenParticleModal?.("setup-pin");
                        }}
                      />
                    )}
                  </section>
                )}

                {/* LỐI TẮT DỊCH VỤ: KHO ƯU ĐÃI, CHỢ TIỆN ÍCH */}
                <div className="pt-0.5">
                  <h2 className="wal-title">{t("memberPortal.walletApp.more", "Khám phá & Tiện ích")}</h2>
                  <section className="wal-grid">
                    <Tile
                      icon="featured_seasonal_and_gifts"
                      label={t("memberPortal.walletApp.rewards.tile", "Trung tâm Quà tặng")}
                      badge={(spinAvailable ? 1 : 0) + activeVoucherCount}
                      onClick={() => openSub("rewards")}
                    />
                    <Tile
                      icon="storefront"
                      label={t("memberPortal.walletApp.storeTile", "Chợ tiện ích")}
                      onClick={() => openSub("store")}
                    />
                  </section>
                </div>



                {/* BẢNG ĐẶC QUYỀN HỆ SINH THÁI THEO HẠNG THÀNH VIÊN */}
                <div className="pt-2">
                  <TierPrivilegesSection
                    activeTier={selectedCardTier}
                    userTier={userTier}
                    onSelectTier={setSelectedCardTier}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: VAY JOY (JOYLATER: MỞ TRƯỚC TRẢ SAU) ──────────────── */}
          {!sub && tab === "later" && (
            <Panel>
              <JoyLaterSheet
                onBalanceChange={() => {
                  loadPerks();
                  loadLoan();
                  mutate();
                }}
              />
            </Panel>
          )}

          {/* ── TAB 3: NHIỆM VỤ & CÂY JOY ────────────────────────────────── */}
          {!sub && tab === "missions" && (
            <Panel>
              {/* Cây Lớn 3D Theo Tiến Độ Nhiệm Vụ */}
              <JoyTree
                claimed={claimedCount}
                total={challenges.length}
                bonusClaimed={treeBonusTaken}
                busy={treeBusy}
                onClaimBonus={handleClaimTreeBonus}
              />
              <div className="mt-4">
                <JoyMissions
                  email={email}
                  showToast={showToast}
                  challenges={challenges}
                  loading={challengesLoading}
                  onReload={() => {
                    loadChallenges();
                    mutate();
                  }}
                  onSelectUtility={onSelectUtility}
                  onGoToWalletTab={(targetTab        ) => setTab(targetTab)}
                />
              </div>
            </Panel>
          )}

          {/* ── TAB 4: SỔ VÍ TOÀN DIỆN (HISTORY) ─────────────────────────── */}
          {!sub && tab === "history" && (
            <Panel>
              <JoyHistory />
            </Panel>
          )}
        </main>

        {/* ── 4. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY CHỈ DÀNH CHO WEB ĐIỆN THOẠI & PWA (md:hidden) ─── */}
        {!sub && (
          <nav
            className="md:hidden fixed bottom-0 left-0 right-0 px-3 py-2 border-t border-border/40 bg-card/95 backdrop-blur-2xl grid grid-cols-4 gap-1 z-40 shadow-lg"
            aria-label="Điều hướng ví"
          >
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`relative py-1.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                  tab === item.id
                    ? "text-amber-500 font-bold bg-amber-500/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={tab === item.id ? "page" : undefined}
                onClick={() => {
                  hapticSelect();
                  setTab(item.id);
                }}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ fontVariationSettings: tab === item.id ? "'FILL' 1" : "" }}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <small className="text-[10px] tracking-tight">{item.fallback}</small>
                {item.id === "missions" && pendingJoy > 0 && (
                  <b className="absolute top-1 right-5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-background animate-pulse" />
                )}
                {item.id === "later" && loan && (
                  <b className="absolute top-1 right-5 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-background" />
                )}
              </button>
            ))}
          </nav>
        )}



      {/* ── MODAL 3: BIÊN LAI GIAO DỊCH (TRANSACTION RECEIPT MODAL) ────── */}
      {selectedTx && (
        <TransactionReceiptModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
