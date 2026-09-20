import { Suspense, lazy, useState, useCallback, useTransition, useEffect, useMemo } from "react";
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
import AppFrame from "../os/AppFrame";
import LazyBoundary from "../os/LazyBoundary";
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

/**
 * Vỏ cho mọi phần nạp lazy của ví (nhiệm vụ, sổ ví, ưu đãi, chợ, vay, cây JOY).
 *
 * `LazyBoundary` bọc NGOÀI `Suspense`: Suspense lo lúc đang tải, boundary lo khi
 * tải thất bại. Thiếu nó thì một chunk 404 sau deploy làm trắng cả portal chứ
 * không chỉ riêng tấm panel đang mở.
 */
const Panel = ({ children }) => {
  const { t } = useTranslation();
  return (
    <LazyBoundary>
      <Suspense
        fallback={(
          <p className="wal-loading text-center py-8 text-muted-foreground font-medium animate-pulse">
            {t("memberPortal.walletApp.loadingPanel", "Đang tải nội dung…")}
          </p>
        )}
      >
        {children}
      </Suspense>
    </LazyBoundary>
  );
};

/** Ô vuông trong lưới lối tắt — icon trên nền thẻ, nhãn hai dòng, huy hiệu badge */
function Tile({ icon, label, badge, onClick }) {
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
}) {
  const { t } = useTranslation();
  const joy = useJoy();
  const [, startTransition] = useTransition();

  const storeBalance = useJoyStore((s) => s.balance);
  const setStoreBalance = useJoyStore((s) => s.setBalance);

  // URL search params sync (?tab=later, ?sub=perks, etc.)
  const [searchParams] = useSearchParams();
  const paramTab = searchParams.get("tab");
  const paramSub = searchParams.get("sub");
  const [tab, setTab] = useState(() => paramTab || "overview");
  const [sub, setSub] = useState(() => paramSub || null);

  useEffect(() => {
    if (paramTab) setTab(paramTab);
    if (paramSub) setSub(paramSub);
  }, [paramTab, paramSub]);

  const email = bio?.email || bio?.contactEmail || "";

  // SWR: Nạp dữ liệu ví hợp nhất trong 1 lượt gọi duy nhất (0ms perceived latency)
  const { data: overview, mutate, isValidating } = useSWR(
    "/joy/wallet/overview",
    (url) =>
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
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [loan, setLoan] = useState(null);
  const [hasPin, setHasPin] = useState(null);
  const [perksData, setPerksData] = useState(null);
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
  const [selectedCardTier, setSelectedCardTier] = useState(userTier);

  useEffect(() => {
    setSelectedCardTier(userTier);
  }, [userTier]);

  // Modals & UI Controls
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [txFilter, setTxFilter] = useState("all");

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
      .catch((error) => setPerksError(error.message || t("memberPortal.accountHub.perksLoadError", "Lỗi tải ưu đãi")))
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
    perksData?.vouchers?.filter((voucher) => !voucher.used)?.length ||
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
    } catch (err) {
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
    } catch (error) {
      if (/đã nhận/i.test(error.message)) setTreeBonusTaken(true);
      showToast?.(error.message || "Lỗi nhận thưởng cây", "error");
    } finally {
      setTreeBusy(false);
    }
  };

  const openSub = (subId) => {
    hapticSelect();
    if (subId === "perks" && !perksData) loadPerks();
    setSub(subId);
  };

  return (
    /*
     * Chuyển sang khung chung `AppFrame` (20/09/2026).
     *
     * Trước đây ví tự dựng HAI header (một `hidden md:flex` cho desktop kèm dải
     * phân đoạn, một `md:hidden` cho điện thoại) và MỘT thanh tab dưới cố định.
     * Thiết kế đó vốn đúng chuẩn Apple — nên `AppFrame` đã được bổ sung
     * `wideNav="segmented"` để GIỮ đúng dải phân đoạn ấy, thay vì ép ví sang
     * sidebar chỉ cho khớp tiêu chí. Cái đổi là: nay chỉ còn MỘT nơi định nghĩa
     * chrome cho mọi app, không phải ba khối trong file này.
     *
     * `tabs` truyền `undefined` khi đang ở màn con (`sub`) — giữ đúng hành vi cũ:
     * vào màn con thì ẩn điều hướng cấp trên để không có hai cấp tranh nhau.
     */
    <AppFrame
      appId="joy_wallet"
      title={t("memberPortal.walletApp.title", "Ví JOY")}
      subtitle="Hugo Studio"
      /* KHÔNG dùng tiêu đề lớn ở ví: nhân vật chính của màn này là tấm thẻ JOY
         ngay bên dưới, mà bản thân nó đã in "Hugo Studio" và số dư. Thêm một
         tiêu đề 34px + phụ đề nữa là lặp thông tin và đẩy thẻ xuống ~200px
         chrome. Thanh gọn + dải phân đoạn là đủ, và thẻ lên ngay đầu màn. */
      largeTitle={false}
      onBack={sub ? () => setSub(null) : onBack}
      tabs={sub ? undefined : TABS.map((item) => ({
        id: item.id,
        icon: item.icon,
        label: t(item.labelKey, item.fallback),
        badge: item.id === "missions" && pendingJoy > 0 ? pendingMissions.length : 0,
      }))}
      tab={tab}
      onTabChange={(next) => { hapticSelect(); setSub(null); setTab(next); }}
      wideNav="segmented"
      actions={(
        <span className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-[13px] font-bold text-muted-foreground">
          <span className={`h-1.5 w-1.5 rounded-full ${isValidating ? "bg-amber-400" : "bg-emerald-400"}`} />
          <span className="hidden sm:inline">
            {isValidating
              ? t("memberPortal.walletApp.syncing", "Đồng bộ…")
              : t("memberPortal.walletApp.online", "Trực tuyến")}
          </span>
        </span>
      )}
      scrollKey={sub || ""}
      wide
    >
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
                onPurchased={(next) => {
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
                    <span className="text-[13px] font-bold">
                      {perks?.canCheckin ? "Điểm danh" : "Đã nhận"}
                    </span>
                  </button>
                </section>

                {/* TỔNG KẾT SAO KÊ 30 NGÀY */}
                {overview?.summary && (
                  <section className="p-3.5 sm:p-4 rounded-2xl bg-card/70 border border-border/40 backdrop-blur-xl flex items-center justify-around text-center">
                    <div>
                      <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">Nhận vào (30d)</p>
                      <p className="text-sm sm:text-base font-extrabold text-emerald-500 font-mono mt-0.5">
                        +{joy.number(overview.summary.earned)} JOY
                      </p>
                    </div>
                    <div className="h-7 w-px bg-border/40" />
                    <div>
                      <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">Chi dùng (30d)</p>
                      <p className="text-sm sm:text-base font-extrabold text-foreground/80 font-mono mt-0.5">
                        −{joy.number(overview.summary.spent)} JOY
                      </p>
                    </div>
                    <div className="h-7 w-px bg-border/40" />
                    <div>
                      <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-wide">Chuỗi Streak</p>
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

                {/* ── GIAO DỊCH GẦN ĐÂY ──────────────────────────────────────
                    Chức năng CHÍNH của một cái ví, và comment bố cục ở đầu cột
                    này đã ghi "GIAO DỊCH" từ đầu — nhưng phần render chưa bao
                    giờ được dựng. Hệ quả: `/joy/wallet/overview` vẫn truy vấn 10
                    giao dịch mỗi lần mở ví, client vẫn tính `filteredTransactions`
                    và `setTxFilter` vẫn tồn tại, rồi tất cả bị bỏ đi; còn
                    `TransactionReceiptModal` thì không có đường nào mở ra được.
                    Dựng ở đây là dùng lại đúng dữ liệu đã tải — KHÔNG thêm một
                    lượt gọi mạng nào. */}
                <div className="pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="wal-title">{t("memberPortal.walletApp.recent", "Giao dịch gần đây")}</h2>
                    {transactions.length > 0 && (
                      <button
                        type="button"
                        className="text-[13px] font-semibold text-primary min-h-[44px] px-1"
                        onClick={() => { hapticSelect(); setTab("history"); }}
                      >
                        {t("memberPortal.walletApp.seeAll", "Xem tất cả")}
                      </button>
                    )}
                  </div>

                  {transactions.length > 0 && (
                    <div className="flex items-center gap-1.5 pb-2" role="group" aria-label={t("memberPortal.walletApp.filter", "Lọc giao dịch")}>
                      {[
                        { id: "all", label: t("memberPortal.walletApp.filterAll", "Tất cả") },
                        { id: "in", label: t("memberPortal.walletApp.filterIn", "Nhận vào") },
                        { id: "out", label: t("memberPortal.walletApp.filterOut", "Chi dùng") },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          aria-pressed={txFilter === chip.id}
                          onClick={() => { hapticSelect(); setTxFilter(chip.id); }}
                          className={`min-h-[44px] rounded-full px-3.5 text-[13px] font-bold transition-colors ${
                            txFilter === chip.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/60 text-muted-foreground border border-border/40"
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Trạng thái RỖNG — phân biệt "ví chưa có giao dịch nào" với
                      "bộ lọc này không có gì": hai câu khác nhau, vì cách xử lý
                      của người dùng cũng khác (một cái là đi dùng JOY, một cái
                      là đổi bộ lọc). */}
                  {transactions.length === 0 ? (
                    <section className="wal-group flex flex-col items-center gap-2 px-6 py-10 text-center">
                      <span className="material-symbols-outlined text-[32px] text-muted-foreground" aria-hidden="true">
                        receipt_long
                      </span>
                      <p className="text-[15px] text-muted-foreground m-0">
                        {t("memberPortal.walletApp.noTx", "Ví chưa có giao dịch nào. Nhận JOY từ nhiệm vụ hoặc điểm danh để bắt đầu.")}
                      </p>
                    </section>
                  ) : filteredTransactions.length === 0 ? (
                    <section className="wal-group px-6 py-8 text-center">
                      <p className="text-[15px] text-muted-foreground m-0">
                        {t("memberPortal.walletApp.noTxInFilter", "Không có giao dịch nào trong mục này.")}
                      </p>
                    </section>
                  ) : (
                    <section className="wal-group" aria-label={t("memberPortal.walletApp.recent", "Giao dịch gần đây")}>
                      {filteredTransactions.slice(0, 5).map((tx) => (
                        <Row
                          key={tx.id}
                          icon={tx.type === "in" ? "south_west" : "north_east"}
                          title={tx.title}
                          detail={new Date(tx.createdAt).toLocaleDateString(joy.locale)}
                          value={`${tx.amount >= 0 ? "+" : "−"}${joy.number(Math.abs(tx.amount))}`}
                          valueTone={tx.type}
                          onClick={() => { hapticSelect(); setSelectedTx(tx); }}
                        />
                      ))}
                    </section>
                  )}
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
                  onGoToWalletTab={(targetTab) => setTab(targetTab)}
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

      {/* ── MODAL 3: BIÊN LAI GIAO DỊCH (TRANSACTION RECEIPT MODAL) ────── */}
      {selectedTx && (
        <TransactionReceiptModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
          showToast={showToast}
        />
      )}
    </AppFrame>
  );
}
