import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import AppFrame from "../os/AppFrame";
import JoyCoinBadge from "../../shared/JoyCoinBadge";
import JoyExchangeModal from "../shared/JoyExchangeModal";
import { useJoyStore } from "../../../stores/joyStore";
import StoreHome from "./StoreHome";
import StoreAppDetail from "./StoreAppDetail";
import GiftSheet from "./GiftSheet";
import { useStorePlans } from "./hooks/useStorePlans";
import { useTapGuard } from "./hooks/useTapGuard";
import { useAppInstall } from "../../../hooks/useAppInstall";
import { appInstallationPolicy } from "../../../../shared/appInstallationPolicy";
import { STORE_ITEMS, exchangeItemKey, storeName } from "./storeData";

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

const recipientField = (handle) => (
  handle.includes("@") ? { toEmail: handle }
    : /^[0-9+\s.-]{8,}$/.test(handle) ? { toPhone: handle }
      : { toReferralCode: handle }
);

const StoreSkeleton = () => (
  <div className="space-y-7 px-4 pt-1" aria-hidden="true">
    <div className="h-11 animate-pulse rounded-xl bg-muted" />
    {[0, 1].map((group) => (
      <div key={group}>
        <div className="mb-2 h-5 w-28 animate-pulse rounded-md bg-muted" />
        <div className="space-y-px overflow-hidden rounded-2xl border border-border/60 bg-card">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3 px-4 py-3">
              <div className="h-12 w-12 animate-pulse rounded-[22.5%] bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default function HugoStoreTab({ bio, showToast, onBioUpdate, onBack, onOpenUtility, route, onRouteChange }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  /*
   * Màn chi tiết app đọc từ ĐỊA CHỈ (/member/utilities/store/<appId>) chứ không
   * giữ trong state: dán link cho người khác là họ mở đúng app đó, tải lại trang
   * không rơi về danh sách, và nút back của máy lùi đúng một cấp.
   */
  const routed = typeof onRouteChange === "function";
  const [localDetailId, setLocalDetailId] = useState(null);
  const detailId = routed ? (route || null) : localDetailId;
  const setDetailId = (id) => (routed ? onRouteChange(id || "home") : setLocalDetailId(id));
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

  const overlayOpen = Boolean(exchange || giftAppId);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: overlayOpen } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [overlayOpen]);

  const planIndex = useMemo(() => new Map(plans.map(p => [p.appId, p])), [plans]);

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

  const afterExchange = useCallback((result) => {
    if (result?.balance != null) {
      useJoyStore.getState().setBalance(result.balance);
      onBioUpdate?.({ joyBalance: result.balance });
    }
    reloadPlans();
    loadOrders();
  }, [onBioUpdate, reloadPlans, loadOrders]);

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

  const handleGiftContinue = useCallback(({ appId, tier, handle, message }) => {
    const plan = planIndex.get(appId);
    if (!plan) return;
    setGiftAppId(null);
    setExchange({
      item: tier === "own" ? exchangeItemKey.own(appId) : exchangeItemKey.rent(plan.featureKey),
      confirm: () => postJson("/store/plans/gift", { appId, tier, message, ...recipientField(handle) }),
    });
  }, [planIndex]);

  const handleInstall = useCallback((entry) => {
    install(entry.app.id, {
      onDone: () => showToast?.(t("utilities.store.app.installedToast", { app: entry.app.label }), "success"),
    });
  }, [install, showToast, t]);

  const handleOpen = useCallback((entry) => {
    if (entry.app.game) {
      navigate(`/member/utilities/arcade?game=${entry.app.id.replace("arcade_", "")}&from=store`, {
        state: { from: "/member/utilities" },
      });
      return;
    }
    onOpenUtility?.(entry.app.id);
  }, [navigate, onOpenUtility]);

  const openDetail = useCallback((appId) => {
    setDetailId(appId);
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  const leaveDetail = useCallback(() => {
    setDetailId(null);
    scrollRef.current?.scrollTo({ top: 0 });
  }, []);

  return (
    /*
     * Chuyển sang khung chung `AppFrame` (20/09/2026).
     *
     * Header cũ tự dựng: thanh `absolute` có blur, nút quay lại với chữ "Cửa
     * hàng" VIẾT CỨNG tiếng Việt (không qua i18n dù app có 3 ngôn ngữ), tiêu đề
     * ẩn/hiện theo `scrolled` — đúng thứ khung đã làm sẵn — và `mr-12` đoán tay
     * để né nút X. Nay chỉ còn khai báo phần riêng: số dư JOY ở khe `actions`.
     *
     * Ở màn chi tiết, `onBack` lùi về danh sách; ở danh sách nó đóng app.
     */
    <AppFrame
      appId="store"
      title={detail ? detail.app.label : storeName()}
      largeTitle={!detail}
      onBack={detail ? leaveDetail : onBack}
      backLabel={detail ? storeName() : undefined}
      actions={<JoyCoinBadge amount={balance ?? bio?.joyBalance} size="sm" />}
      scrollKey={detailId || ""}
      contentClassName=""
      contentMaxWidth="720px"
    >
      {/* SCROLLABLE CONTENT */}
      <div className="pb-20" {...tapGuard}>
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

      <JoyExchangeModal
        open={Boolean(exchange)}
        bio={bio}
        item={exchange?.item}
        onClose={() => setExchange(null)}
        onConfirm={exchange?.confirm}
        onSuccess={afterExchange}
      />
    </AppFrame>
  );
}
