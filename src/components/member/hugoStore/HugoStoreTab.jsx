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
  <div className="flex flex-col space-y-10 px-5 py-4 w-full" aria-hidden="true">
    <div className="flex overflow-hidden gap-4">
      <div className="animate-pulse bg-muted/60 rounded-[20px] shrink-0 w-[85vw] max-w-[320px] aspect-[16/9]" />
      <div className="animate-pulse bg-muted/60 rounded-[20px] shrink-0 w-[85vw] max-w-[320px] aspect-[16/9]" />
    </div>
    <div>
      <div className="animate-pulse bg-muted/60 rounded-md w-32 h-6 mb-4" />
      <div className="flex overflow-hidden gap-4">
        <div className="animate-pulse bg-muted/60 rounded-[16px] shrink-0 w-[140px] aspect-square" />
        <div className="animate-pulse bg-muted/60 rounded-[16px] shrink-0 w-[140px] aspect-square" />
        <div className="animate-pulse bg-muted/60 rounded-[16px] shrink-0 w-[140px] aspect-square" />
      </div>
    </div>
  </div>
);

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

  const handleScroll = useCallback((e) => {
    setScrolled(e.currentTarget.scrollTop > 34);
  }, []);

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
    <div className="flex flex-col h-[100dvh] lg:h-full w-full bg-background relative overflow-hidden">
      {/* FIXED HEADER WITH BLUR */}
      <header
        className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 transition-all duration-300 ${
          scrolled || detail ? "bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {detail && (
            <button
              type="button"
              onClick={leaveDetail}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground py-1 px-2.5 rounded-full bg-muted/60 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Cửa hàng</span>
            </button>
          )}
          <span className={`font-semibold text-[16px] text-foreground transition-opacity duration-300 ${scrolled || detail ? "opacity-100" : "opacity-0"}`}>
            {detail ? detail.app.label : storeName()}
          </span>
        </div>
        <div className="flex items-center bg-muted/60 px-3 py-1.5 rounded-full border border-border/50 shadow-sm backdrop-blur-md mr-12">
          <JoyCoinBadge amount={balance ?? bio?.joyBalance} size="sm" />
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto pb-20 pt-14 hide-scrollbar"
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
