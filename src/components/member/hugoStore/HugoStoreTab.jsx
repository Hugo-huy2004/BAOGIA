import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import BackButton from "../shared/BackButton";
import JoyCoinBadge from "../../shared/JoyCoinBadge";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import { useJoyStore } from "../../../stores/joyStore";
import StoreFeedView from "./StoreFeedView";
import GiftSheet from "./GiftSheet";
import { StoreFeed } from "./storeFeed";
import { useStorePlans } from "./hooks/useStorePlans";
import { useTapGuard } from "./hooks/useTapGuard";
import { exchangeItemKey } from "./storeData";
import "./hugo-store.css";

const API = import.meta.env.VITE_API_URL || "/api";

const postJson = async (path, body) => {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Giao dịch không thành công.");
  return data;
};

/** Đoán cách tra người nhận từ một chuỗi người dùng gõ vào. */
const recipientField = (handle) => (
  handle.includes("@") ? { toEmail: handle }
    : /^[0-9+\s.-]{8,}$/.test(handle) ? { toPhone: handle }
      : { toReferralCode: handle }
);

/**
 * Khung chờ trong lúc bảng giá về. Trước đây trang vẽ ngay bằng dữ liệu rỗng
 * nên tâm điểm hiện một app miễn phí rồi nhảy sang app khác khi giá tới.
 */
const StoreSkeleton = () => (
  <div className="space-y-3 px-4" aria-hidden="true">
    <div className="hgs-skeleton h-[188px] rounded-[24px]" />
    <div className="hgs-skeleton h-[96px] rounded-[22px]" />
    <div className="hgs-skeleton h-[96px] rounded-[22px]" />
  </div>
);

/**
 * Hugo Store — ứng dụng độc lập, chiếm trọn màn hình, lối ra là nút quay lại.
 *
 * Không có giỏ hàng và KHÔNG tự dựng màn thanh toán: mọi thứ có phí đều mở
 * `JoyExchangeModal` (phiếu trao đổi JOY dùng chung toàn hệ thống) với một khoá
 * `item`, còn giá thì `/api/joy/exchange-quote` báo. Client không tính tiền.
 *
 * Nội dung trang do `StoreFeed` quyết định — xem storeFeed.js.
 */
export default function HugoStoreTab({ bio, showToast, onBioUpdate, onBack, onOpenUtility }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [giftPlan, setGiftPlan] = useState(null);
  // App người dùng đang muốn xem gói — cả trang xoay về app này (xem
  // SpotlightSection.pick). Không có nó thì chỉ app tâm điểm của ngày mới có
  // bảng bậc, những app khác không có đường nào để mua.
  const [focus, setFocus] = useState(null);
  const sentinelRef = useRef(null);
  const tapGuard = useTapGuard();

  const { plans, balance, loading, reload: reloadPlans } = useStorePlans(bio?.email);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/utility-store/products`)
      .then(r => r.json())
      .then(d => { if (alive) setProducts(Array.isArray(d) ? d : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const loadOrders = useCallback(() => {
    if (!bio?.email) return;
    fetch(`${API}/store/orders?email=${encodeURIComponent(bio.email)}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setOrders(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [bio?.email]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Header chỉ kẻ viền dưới khi nội dung đã trượt lên.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Sheet/phiếu mở thì giấu mọi thanh điều hướng còn sót của portal.
  const overlayOpen = Boolean(exchange || giftPlan);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: overlayOpen } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [overlayOpen]);

  const feed = useMemo(
    () => new StoreFeed({
      products,
      plans,
      orders,
      query: search.trim().toLowerCase(),
      balance: balance ?? bio?.joyBalance ?? 0,
      focus,
    }),
    [products, plans, orders, search, balance, bio?.joyBalance, focus]
  );
  const sections = useMemo(() => feed.compose(), [feed]);

  /** Sau mỗi giao dịch: đồng bộ số dư, bảng bậc và lịch sử. */
  const afterExchange = useCallback((result) => {
    if (result?.balance != null) {
      useJoyStore.getState().setBalance(result.balance);
      onBioUpdate?.({ joyBalance: result.balance });
    }
    reloadPlans();
    loadOrders();
  }, [onBioUpdate, reloadPlans, loadOrders]);

  // ── Bốn hành động mua, dùng chung một phiếu ──────────────────────────────

  const handleTrial = useCallback(async (appId) => {
    try {
      const result = await postJson("/store/plans/trial", { appId });
      showToast?.(`Đã mở ${result.days} ngày dùng thử`, "success");
      reloadPlans();
    } catch (e) {
      showToast?.(e.message, "error");
    }
  }, [showToast, reloadPlans]);

  const handleRent = useCallback((appId) => {
    const plan = feed.planOf(appId);
    if (!plan) return;
    setExchange({
      item: exchangeItemKey.rent(plan.featureKey),
      confirm: () => postJson("/joy/subscribe-feature", { featureKey: plan.featureKey, months: 1 }),
    });
  }, [feed]);

  const handleOwn = useCallback((appId) => {
    setExchange({
      item: exchangeItemKey.own(appId),
      confirm: () => postJson("/store/plans/own", { appId }),
    });
  }, []);

  const handleBuyPack = useCallback((pack) => {
    setExchange({
      item: exchangeItemKey.pack(pack._id),
      confirm: () => postJson("/utility-store/purchase", { email: bio?.email, productId: pack._id }),
    });
  }, [bio?.email]);

  const handleGift = useCallback((appId) => {
    const plan = feed.planOf(appId);
    if (plan) setGiftPlan(plan);
  }, [feed]);

  /** Chọn xong người nhận → đóng sheet, mở đúng phiếu trao đổi của bậc đó. */
  const handleGiftContinue = useCallback(({ appId, tier, handle, message }) => {
    const plan = feed.planOf(appId);
    if (!plan) return;
    setGiftPlan(null);
    setExchange({
      item: tier === "own" ? exchangeItemKey.own(appId) : exchangeItemKey.rent(plan.featureKey),
      confirm: () => postJson("/store/plans/gift", {
        appId,
        tier,
        message,
        ...recipientField(handle),
      }),
    });
  }, [feed]);

  /** App đang khoá: xoay cả trang về app đó rồi cuộn tới bảng bậc. */
  const handlePlans = useCallback((appId) => {
    if (!feed.planOf(appId)) { onOpenUtility?.(appId); return; }
    setSearch("");
    setFocus(appId);
  }, [feed, onOpenUtility]);

  // Cuộn sau khi bảng bậc đã được vẽ. Chỉ bám `focus`: mua xong bảng giá tải
  // lại, không có lý do gì để trang tự nhảy thêm lần nữa.
  useEffect(() => {
    if (!focus) return;
    document.getElementById("hgs-ladder")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);

  const handlers = {
    onOpenUtility,
    onPlans: handlePlans,
    onTrial: handleTrial,
    onRent: handleRent,
    onOwn: handleOwn,
    onBuyPack: handleBuyPack,
    onGift: handleGift,
    balance: balance ?? bio?.joyBalance ?? 0,
  };

  return (
    <div className="hgs flex h-full min-h-0 flex-col text-left">
      {/* ── Header ứng dụng ──────────────────────────────────────────────── */}
      <header data-scrolled={scrolled} className="hgs-header shrink-0 px-4 pb-3">
        <div className="flex items-center gap-3">
          <BackButton
            onClick={onBack}
            iconOnly
            className="rounded-[14px] border border-[var(--hgs-line)] bg-[var(--hgs-surface)]"
          />
          <h1 className="hgs-ink min-w-0 flex-1 truncate text-[19px] font-bold tracking-[-0.01em]">
            {t("store.title", "Hugo Store")}
          </h1>
          {/* JOY giữ đồng xu vàng làm dấu hiệu ngữ nghĩa, chỉ bọc lại bằng
              viên nang phẳng cho khớp phần còn lại. */}
          <span className="hgs-card flex h-10 shrink-0 items-center rounded-full px-3">
            <JoyCoinBadge amount={balance ?? bio?.joyBalance} size="sm" />
          </span>
        </div>

        <div className="relative mt-3">
          <span className="material-symbols-outlined hgs-dim pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]">
            search
          </span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("store.shop.search", "Tìm ứng dụng và vật phẩm")}
            className="hgs-input pl-11 pr-11"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Xoá tìm kiếm"
              className="hgs-dim absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Dòng nội dung ────────────────────────────────────────────────────
          `tapGuard` gắn ở đây vì mọi nút của cửa hàng đều nằm trong vùng cuộn
          này: vuốt để cuộn xong nhả tay sẽ không mở nhầm app hay phiếu mua. */}
      <div className="hgs-scroll min-h-0 flex-1 overflow-y-auto pt-4" {...tapGuard}>
        <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
        {loading && plans.length === 0
          ? <StoreSkeleton />
          : <StoreFeedView sections={sections} {...handlers} />}
      </div>

      {giftPlan && (
        <GiftSheet
          plan={giftPlan}
          onClose={() => setGiftPlan(null)}
          onContinue={handleGiftContinue}
        />
      )}

      {/* Phiếu trao đổi JOY dùng chung — cửa hàng không có hoá đơn riêng. */}
      <JoyExchangeModal
        open={Boolean(exchange)}
        bio={bio}
        item={exchange?.item}
        onClose={() => setExchange(null)}
        onConfirm={exchange?.confirm}
        onSuccess={afterExchange}
      />
    </div>
  );
}
