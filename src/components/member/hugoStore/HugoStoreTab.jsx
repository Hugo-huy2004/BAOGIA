import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import BackButton from "../shared/BackButton";
import JoyCoinBadge from "../../shared/JoyCoinBadge";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import { useJoyStore } from "../../../stores/joyStore";
import StoreHome from "./StoreHome";
import StoreAppDetail from "./StoreAppDetail";
import GiftSheet from "./GiftSheet";
import { ArtDefs } from "./ui/AppArt";
import { useStorePlans } from "./hooks/useStorePlans";
import { useTapGuard } from "./hooks/useTapGuard";
import { useAppInstall } from "../../../hooks/useAppInstall";
import { appInstallationPolicy } from "../../../../shared/appInstallationPolicy";
import { STORE_ITEMS, exchangeItemKey, storeName } from "./storeData";
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
  if (!r.ok) throw new Error(data.error || "");
  return data;
};

/** Đoán cách tra người nhận từ một chuỗi người dùng gõ vào. */
const recipientField = (handle) => (
  handle.includes("@") ? { toEmail: handle }
    : /^[0-9+\s.-]{8,}$/.test(handle) ? { toPhone: handle }
      : { toReferralCode: handle }
);

/**
 * Khung chờ trong lúc bảng giá về. Vẽ ngay bằng dữ liệu rỗng thì lưới hiện một
 * loạt app "miễn phí" rồi mới nhảy sang có giá khi bảng giá tới.
 */
const StoreSkeleton = () => (
  <div className="hgs-grid px-3" aria-hidden="true">
    {Array.from({ length: 9 }, (_, i) => (
      <div key={i} className="hgs-skeleton h-[96px] rounded-[14px]" />
    ))}
  </div>
);

/**
 * Hugo Chợ — ứng dụng độc lập, chiếm trọn màn hình, lối ra là nút quay lại.
 *
 * Hai màn: lưới ứng dụng (StoreHome) và trang một ứng dụng (StoreAppDetail).
 * Không có tab, không có giỏ hàng, và KHÔNG tự dựng màn thanh toán: mọi thứ có
 * phí đều mở `JoyExchangeModal` (phiếu trao đổi JOY dùng chung toàn hệ thống)
 * với một khoá `item`, còn giá thì `/api/joy/exchange-quote` báo. Client không
 * tính tiền.
 */
export default function HugoStoreTab({ bio, showToast, onBioUpdate, onBack, onOpenUtility }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [exchange, setExchange] = useState(null);
  const [giftAppId, setGiftAppId] = useState(null);
  const scrollRef = useRef(null);
  const tapGuard = useTapGuard();

  const navigate = useNavigate();
  const { plans, balance, loading, reload: reloadPlans } = useStorePlans(bio?.email);
  const { installed, progress, install } = useAppInstall({ bio, onBioUpdate });

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

  // Large title cuộn khuất thì thanh nav mới kẻ viền và hiện tiêu đề nhỏ.
  // Ngưỡng đo bằng scrollTop chứ không bằng IntersectionObserver: mốc quan sát
  // sẽ phải nằm trong StoreHome/StoreAppDetail, mà hai màn đó tháo lắp liên
  // tục nên ref lúc có lúc không.
  const handleScroll = useCallback((e) => {
    setScrolled(e.currentTarget.scrollTop > 34);
  }, []);

  // Sheet/phiếu mở thì giấu mọi thanh điều hướng còn sót của portal.
  const overlayOpen = Boolean(exchange || giftAppId);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: overlayOpen } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [overlayOpen]);

  const planIndex = useMemo(() => new Map(plans.map(p => [p.appId, p])), [plans]);

  /**
   * App/game tĩnh + bậc giá động + trạng thái cài đặt, gộp thành một đơn vị cho
   * lớp vẽ. `ladder` tra theo `planId` chứ không theo `id`: game Cờ Caro mở
   * bằng gói Trò Chơi nên bảng giá của nó chính là bảng giá Trò Chơi.
   */
  const entries = useMemo(
    () => STORE_ITEMS.map(app => {
      const plan = app.planId ? planIndex.get(app.planId) || null : null;
      return {
        app,
        ladder: plan,
        state: plan?.state || null,
        installed: installed.includes(app.id),
        installable: appInstallationPolicy.canInstall(app.id),
        progress: progress[app.id],
      };
    }),
    [planIndex, installed, progress]
  );

  const entryOf = useCallback(
    (appId) => entries.find(e => e.app.id === appId) || null,
    [entries]
  );

  const detail = detailId ? entryOf(detailId) : null;
  const giftPlan = giftAppId ? planIndex.get(giftAppId) : null;

  /** Sau mỗi giao dịch: đồng bộ số dư, bảng bậc và lịch sử. */
  const afterExchange = useCallback((result) => {
    if (result?.balance != null) {
      useJoyStore.getState().setBalance(result.balance);
      onBioUpdate?.({ joyBalance: result.balance });
    }
    reloadPlans();
    loadOrders();
  }, [onBioUpdate, reloadPlans, loadOrders]);

  // ── Mua bằng JOY: bốn hành động, dùng chung một phiếu ────────────────────
  // Nhận thẳng đối tượng bảng bậc (`ladder`) chứ không nhận id của ô người dùng
  // vừa bấm: game Cờ Caro mở bằng gói Trò Chơi, nên id trên ô và id của gói
  // KHÁC nhau, và tra ngược lại bằng id ô là mua nhầm thứ.

  const handleTrial = useCallback(async (ladder) => {
    try {
      const result = await postJson("/store/plans/trial", { appId: ladder.appId });
      showToast?.(t("utilities.store.tier.trialStarted", { count: result.days }), "success");
      reloadPlans();
    } catch (e) {
      showToast?.(e.message || t("utilities.store.error"), "error");
    }
  }, [showToast, reloadPlans, t]);

  const handleRent = useCallback((ladder) => {
    setExchange({
      item: exchangeItemKey.rent(ladder.featureKey),
      confirm: () => postJson("/joy/subscribe-feature", { featureKey: ladder.featureKey, months: 1 }),
    });
  }, []);

  const handleOwn = useCallback((ladder) => {
    setExchange({
      item: exchangeItemKey.own(ladder.appId),
      confirm: () => postJson("/store/plans/own", { appId: ladder.appId }),
    });
  }, []);

  const handleBuyPack = useCallback((pack) => {
    setExchange({
      item: exchangeItemKey.pack(pack._id),
      confirm: () => postJson("/utility-store/purchase", { email: bio?.email, productId: pack._id }),
    });
  }, [bio?.email]);

  /** Chọn xong người nhận → đóng sheet, mở đúng phiếu trao đổi của bậc đó. */
  const handleGiftContinue = useCallback(({ appId, tier, handle, message }) => {
    const plan = planIndex.get(appId);
    if (!plan) return;
    setGiftAppId(null);
    setExchange({
      item: tier === "own" ? exchangeItemKey.own(appId) : exchangeItemKey.rent(plan.featureKey),
      confirm: () => postJson("/store/plans/gift", { appId, tier, message, ...recipientField(handle) }),
    });
  }, [planIndex]);

  /** Tải: cùng một cơ chế với Thư viện và Arcade (xem hooks/useAppInstall). */
  const handleInstall = useCallback((entry) => {
    install(entry.app.id, {
      onDone: () => showToast?.(t("utilities.store.app.installedToast", { app: entry.app.label }), "success"),
    });
  }, [install, showToast, t]);

  /** Mở: game đi qua Arcade — đó là nơi quản lý và chạy chúng. */
  const handleOpen = useCallback((entry) => {
    if (entry.app.game) {
      navigate(`/member/utilities/arcade?game=${entry.app.id.replace("arcade_", "")}&from=store`, {
        state: { from: "/member/utilities" },
      });
      return;
    }
    onOpenUtility?.(entry.app.id);
  }, [navigate, onOpenUtility]);

  /** Mở trang một app — luôn về đầu trang, không thừa hưởng chỗ cuộn của lưới. */
  const openDetail = useCallback((appId) => {
    setDetailId(appId);
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const leaveDetail = useCallback(() => {
    setDetailId(null);
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="hgs flex h-full min-h-0 flex-col text-left">
      {/* Gradient dùng chung cho mọi hình minh hoạ — xem ui/AppArt.jsx */}
      <ArtDefs />

      {/* ── Thanh nav ────────────────────────────────────────────────────────
          Chỉ giữ nút quay lại, số dư và một tiêu đề nhỏ hiện ra khi large
          title đã cuộn khuất — đúng cách UINavigationController làm. Large
          title nằm trong vùng cuộn ở dưới, không ở đây. */}
      <header data-scrolled={scrolled} className="hgs-nav shrink-0 px-4 pb-2">
        <div className="flex h-11 items-center gap-2">
          <BackButton onClick={detail ? leaveDetail : onBack} iconOnly className="hgs-iconbtn" />
          <span className="hgs-nav-title hgs-ink min-w-0 flex-1 truncate text-center">
            {detail ? detail.app.label : storeName()}
          </span>
          {/* JOY giữ đồng xu vàng làm dấu hiệu ngữ nghĩa, chỉ bọc lại bằng
              viên nang xám cho khớp phần còn lại. */}
          <span className="flex h-8 shrink-0 items-center rounded-full bg-[var(--hgs-fill)] px-2.5">
            <JoyCoinBadge amount={balance ?? bio?.joyBalance} size="sm" />
          </span>
        </div>
      </header>

      {/* ── Dòng nội dung ────────────────────────────────────────────────────
          `tapGuard` gắn ở đây vì mọi nút của cửa hàng đều nằm trong vùng cuộn
          này: vuốt để cuộn xong nhả tay sẽ không mở nhầm app hay phiếu mua. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="hgs-scroll min-h-0 flex-1 overflow-y-auto"
        {...tapGuard}
      >
        {loading && plans.length === 0 ? (
          <StoreSkeleton />
        ) : detail ? (
          <StoreAppDetail
            key={detail.app.id}
            entry={detail}
            balance={balance ?? bio?.joyBalance ?? 0}
            onOpen={handleOpen}
            onInstall={handleInstall}
            onTrial={handleTrial}
            onRent={handleRent}
            onOwn={handleOwn}
            onGift={setGiftAppId}
          />
        ) : (
          <StoreHome
            entries={entries}
            packs={products}
            orders={orders}
            balance={balance ?? bio?.joyBalance ?? 0}
            title={storeName()}
            search={search}
            onSearch={setSearch}
            onOpenApp={openDetail}
            onOpen={handleOpen}
            onInstall={handleInstall}
            onBuyPack={handleBuyPack}
          />
        )}
      </div>

      {giftPlan && (
        <GiftSheet
          plan={giftPlan}
          appLabel={entryOf(giftAppId)?.app.label}
          onClose={() => setGiftAppId(null)}
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
