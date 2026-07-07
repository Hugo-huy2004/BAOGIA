import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DecoStudioSkeleton } from '../ui/SkeletonLayouts';
import JoyCoinBadge from '../shared/JoyCoinBadge';
import { DECO_ART, DECO_TYPE_META, DecoRoomScene, cozinessScore, isNightRoom } from './deco/decoAssets';

const API = import.meta.env.VITE_API_URL || '/api';

// Slot order shown in the customizer + which slots the room understands.
const SLOT_ORDER = ['desk', 'chair', 'computer', 'window', 'rug', 'plant', 'lamp', 'shelf', 'clock', 'poster', 'pet'];
const CLEARABLE = new Set(['pet', 'poster', 'rug', 'plant', 'lamp', 'shelf', 'clock']); // optional slots

const FLOOR_STYLES = [
  { id: 'wood_basic', label: 'Gỗ ấm', swatch: 'linear-gradient(180deg,#c98a4e,#a9713a)', price: 0 },
  { id: 'floor_wood_dark', label: 'Gỗ óc chó', swatch: 'linear-gradient(180deg,#6b4423,#4a2e17)', price: 200 },
  { id: 'floor_tile_white', label: 'Gạch trắng', swatch: 'linear-gradient(180deg,#e9ecf2,#cfd4de)', price: 100 },
  { id: 'floor_tile_checker', label: 'Caro', swatch: 'repeating-conic-gradient(#e5e7eb 0deg 90deg,#9ca3af 90deg 180deg)', price: 150 },
];

const WALL_COLORS = [
  { id: 'wall_white', label: 'Trắng kem', color: '#f4f4f5', price: 0 },
  { id: 'wall_pink', label: 'Hồng Pastel', color: '#fbcfe8', price: 100 },
  { id: 'wall_blue', label: 'Xanh Mint', color: '#ccfbf1', price: 120 },
  { id: 'wall_dark', label: 'Indigo Tối', color: '#1e1b4b', price: 200 },
  { id: 'wall_yellow', label: 'Vàng Chanh', color: '#fef08a', price: 150 },
];

export default function DecoStudioTab({ onBack, bio, showToast, onBioUpdate }) {
  const [activeTab, setActiveTab] = useState('my_room'); // 'my_room' | 'neighborhood'
  const [storeData, setStoreData] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [visitedRooms, setVisitedRooms] = useState([]);
  const [lastCleanedAt, setLastCleanedAt] = useState(null);
  const [isRenting, setIsRenting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buyTarget, setBuyTarget] = useState(null);   // { id, def } pending purchase
  const [reaction, setReaction] = useState('');       // ephemeral emoji on item click
  const [receipt, setReceipt] = useState(null);       // invoice for purchase
  const [petAction, setPetAction] = useState(null);   // null | 'feed' | 'revive'
  const [isPetInteracting, setIsPetInteracting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly'); // 'daily' | 'monthly' | 'long'
  const [dailyDays, setDailyDays] = useState(7);       // default to 7 days
  const [showInvoice, setShowInvoice] = useState(null); // null or { plan, days, base, fee, total }
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Neighborhood states
  const [neighbors, setNeighbors] = useState([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const isInitialized = useRef(false);

  const [roomState, setRoomState] = useState({
    enabled: false,
    wallColor: 'wall_white',
    floorStyle: 'wood_basic',
    items: { desk: 'desk_basic', chair: 'chair_basic', computer: 'laptop', window: 'window_day', poster: null, pet: null, rug: null, plant: null, lamp: null, shelf: null, clock: null },
    positions: {},
  });

  // Store category filter chips ('all' | 'wall' | 'floor' | slot type)
  const [storeFilter, setStoreFilter] = useState('all');

  // PWA install prompt (captured from the browser when installable)
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    // Swap the page manifest to the HugoRoom one while this tab is open so
    // "Add to Home Screen" installs HugoRoom as its own PWA.
    const link = document.querySelector('link[rel="manifest"]');
    const prevHref = link?.getAttribute('href');
    if (link) link.setAttribute('href', '/hugoroom-manifest.json');

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => {
      if (link && prevHref) link.setAttribute('href', prevHref);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) {
      showToast?.('Mở menu trình duyệt và chọn "Thêm vào màn hình chính" để cài HugoRoom.', 'info');
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') showToast?.('Đã cài HugoRoom vào màn hình chính! 🎉', 'success');
    setInstallPrompt(null);
  };

  const handleShareRoom = async () => {
    const slug = bio?.slug;
    if (!slug) {
      showToast?.('Bạn cần có Bio công khai để chia sẻ phòng.', 'error');
      return;
    }
    const url = `${window.location.origin}/bio/${slug}`;
    const shareData = {
      title: 'HugoRoom của tôi 🏠',
      text: 'Ghé thăm căn phòng ký túc xá ảo của mình trên Hugo Studio nhé!',
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        showToast?.('Đã sao chép liên kết phòng!', 'success');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          showToast?.('Đã sao chép liên kết phòng!', 'success');
        } catch { showToast?.('Không thể chia sẻ liên kết.', 'error'); }
      }
    }
  };

  useEffect(() => { fetchStore(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTab === 'neighborhood' && neighbors.length === 0) {
      fetchNeighbors();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!loading && storeData) {
      const timer = setTimeout(() => {
        isInitialized.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, storeData]);

  useEffect(() => {
    if (!isInitialized.current) return;

    setSaveStatus('saving');
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/deco/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(roomState),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        onBioUpdate?.({ decoRoom: data.decoRoom });
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [roomState]);

  const [stampVisible, setStampVisible] = useState(false);

  useEffect(() => {
    if (receipt) {
      const audio = new Audio("https://www.soundjay.com/misc/sounds/cash-register-01.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});
      
      const timer1 = setTimeout(() => {
        const bell = new Audio("https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3");
        bell.volume = 0.5;
        bell.play().catch(() => {});
      }, 300);

      const timer2 = setTimeout(() => {
        setStampVisible(true);
      }, 500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setStampVisible(false);
    }
  }, [receipt]);

  async function fetchStore() {
    try {
      // Auth (Bearer + cookie) is attached automatically by the global fetch
      // interceptor — do NOT add an Authorization header here.
      const res = await fetch(`${API}/deco/store`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được cửa hàng');
      setStoreData(data);
      setExpiresAt(data.expiresAt);
      setVisitedRooms(data.visitedRooms || []);
      setLastCleanedAt(data.lastCleanedAt || null);
      if (bio?.decoRoom) {
        setRoomState((prev) => ({
          ...prev,
          enabled: bio.decoRoom.enabled ?? false,
          wallColor: bio.decoRoom.wallColor === '#f4f4f5' ? 'wall_white' : (bio.decoRoom.wallColor || 'wall_white'),
          floorStyle: bio.decoRoom.floorStyle || 'wood_basic',
          items: { ...prev.items, ...(bio.decoRoom.items || {}) },
          positions: bio.decoRoom.positions || {},
          trashCount: data.trashCount ?? bio.decoRoom.trashCount ?? 6,
          petStatus: data.petStatus || bio.decoRoom.petStatus || 'alive',
          petFedAt: data.petFedAt || bio.decoRoom.petFedAt || null,
        }));
      }
    } catch (err) {
      showToast?.(err.message || 'Lỗi tải Deco Studio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRentClick = (planOverride) => {
    const targetPlan = typeof planOverride === 'string' ? planOverride : selectedPlan;
    let days = 30;
    let base = 299;
    let fee = 30;

    if (targetPlan === 'daily') {
      const numDays = Math.floor(Number(dailyDays));
      if (isNaN(numDays) || numDays < 1) {
        showToast?.('Vui lòng nhập số ngày thuê hợp lệ (tối thiểu 1 ngày)', 'error');
        return;
      }
      days = numDays;
      base = days * 15;
      fee = Math.ceil(base * 0.1);
    } else if (targetPlan === 'monthly') {
      days = 30;
      base = 299;
      fee = 30;
    } else if (targetPlan === 'long') {
      days = 180;
      base = 1500;
      fee = 150;
    }

    setShowInvoice({
      plan: targetPlan,
      days,
      base,
      fee,
      total: base + fee
    });
  };

  const confirmPayment = async () => {
    if (!showInvoice || isRenting) return;
    setIsRenting(true);
    try {
      const res = await fetch(`${API}/deco/rent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: showInvoice.plan,
          days: showInvoice.days
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setExpiresAt(data.expiresAt);
      setStoreData((prev) => ({ ...prev, balance: data.balance }));

      onBioUpdate?.({
        joyBalance: data.balance,
        decoRoom: {
          ...(bio?.decoRoom || {}),
          expiresAt: data.expiresAt
        }
      });

      setShowInvoice(null);
      setShowSuccessModal(true);
    } catch (err) {
      showToast?.(err.message || 'Thanh toán thuê bao thất bại.', 'error');
    } finally {
      setIsRenting(false);
    }
  };

  const getSubscriptionInfo = () => {
    if (!expiresAt) return { text: 'Chưa kích hoạt', status: 'none' };
    const diff = new Date(expiresAt).getTime() - Date.now();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    if (days > 0) {
      return { text: `Còn ${days} ngày thuê`, status: 'active', days };
    }
    const graceDiff = (new Date(expiresAt).getTime() + 7 * 24 * 60 * 60 * 1000) - Date.now();
    const graceDays = Math.ceil(graceDiff / (24 * 60 * 60 * 1000));
    if (graceDays > 0) {
      return { text: `Chờ gia hạn (${graceDays} ngày)`, status: 'grace', days: graceDays };
    }
    return { text: 'Hết hạn', status: 'expired' };
  };

  const handleEnabledChange = (checked) => {
    const sub = getSubscriptionInfo();
    if (checked && (sub.status === 'expired' || sub.status === 'none')) {
      showToast?.('Vui lòng thuê hoặc gia hạn tiện ích HugoHome (299 JOY) trước khi hiển thị trên Bio.', 'error');
      return;
    }
    setRoomState((p) => ({ ...p, enabled: checked }));
  };

  const fetchNeighbors = async () => {
    setLoadingNeighbors(true);
    try {
      const res = await fetch(`${API}/deco/neighborhood`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNeighbors(data.neighbors || []);
    } catch (err) {
      showToast?.(err.message || 'Lỗi tải danh sách hàng xóm', 'error');
    } finally {
      setLoadingNeighbors(false);
    }
  };

  const [isBuying, setIsBuying] = useState(false);

  const confirmBuy = async () => {
    if (isBuying) return;
    setIsBuying(true);
    const { id, def } = buyTarget;
    try {
      const res = await fetch(`${API}/deco/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast?.(`Đã mua ${def.name}!`, 'success');
      setStoreData((prev) => ({ ...prev, balance: data.balance, unlockedItems: data.unlockedItems }));
      
      if (def.type === 'wallColor') {
        setRoomState((prev) => ({ ...prev, wallColor: id }));
      } else if (def.type === 'floorStyle') {
        setRoomState((prev) => ({ ...prev, floorStyle: id }));
      } else {
        setItem(def.type, id); // auto-equip furniture
      }
      
      setReceipt({
        id,
        name: def.name,
        price: def.price,
        date: new Date().toLocaleString('vi-VN'),
        txCode: `INV-${Date.now().toString(36).toUpperCase()}`
      });
      setBuyTarget(null);
      onBioUpdate?.({ 
        joyBalance: data.balance, 
        decoRoom: { 
          ...(bio?.decoRoom || {}), 
          unlockedItems: data.unlockedItems 
        } 
      });
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setIsBuying(false);
    }
  };


  const setItem = (type, id) => setRoomState((p) => ({
    ...p,
    items: { ...p.items, [type]: id },
    // Swapping/removing the pet always starts the new one alive & fed —
    // mirrors the server reset in /deco/save.
    ...(type === 'pet' ? { petStatus: 'alive', petFedAt: new Date().toISOString() } : {}),
  }));

  const onSceneItemClick = (slot) => {
    if (slot === 'pet') {
      if (roomState.petStatus === 'dead') {
        setPetAction('revive');
      } else {
        setPetAction('feed');
      }
      return;
    }
    const emoji = '';
    setReaction(emoji);
    setTimeout(() => setReaction(''), 900);
  };

  const handleFeedPet = async () => {
    if (isPetInteracting) return;
    setIsPetInteracting(true);
    try {
      const res = await fetch(`${API}/deco/feed-pet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast?.('Cho thú cưng ăn thành công!', 'success');
      setRoomState(prev => ({
        ...prev,
        petFedAt: data.petFedAt
      }));
      setReaction('');
      setTimeout(() => setReaction(''), 900);
      setPetAction(null);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setIsPetInteracting(false);
    }
  };

  // Dead pet: the only two options are revive (99 JOY) or remove it entirely
  // and buy/equip a new one from scratch. Removing clears the slot; the server
  // resets petStatus/petFedAt whenever the pet slot changes.
  const handleDeletePet = () => {
    setRoomState((p) => ({
      ...p,
      items: { ...p.items, pet: null },
      petStatus: 'alive',
    }));
    setPetAction(null);
    showToast?.('Đã tiễn thú cưng về trời. Bạn có thể nuôi bé mới từ cửa hàng. 🕊️', 'success');
  };

  const handleRevivePet = async () => {
    if (isPetInteracting) return;
    setIsPetInteracting(true);
    try {
      const res = await fetch(`${API}/deco/revive-pet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast?.('Hồi sinh thú cưng thành công!', 'success');
      setStoreData(prev => ({ ...prev, balance: data.balance }));
      setRoomState(prev => ({
        ...prev,
        petStatus: data.petStatus,
        petFedAt: data.petFedAt
      }));
      onBioUpdate?.({ 
        joyBalance: data.balance, 
        decoRoom: { 
          ...(bio?.decoRoom || {}), 
          petStatus: data.petStatus,
          petFedAt: data.petFedAt
        } 
      });
      setPetAction(null);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setIsPetInteracting(false);
    }
  };

  const cozy = useMemo(() => cozinessScore(roomState.items), [roomState.items]);
  const night = isNightRoom(roomState.items);

  const itemsByType = useMemo(() => {
    const m = {};
    if (storeData?.store) {
      for (const [id, def] of Object.entries(storeData.store)) {
        (m[def.type] ||= []).push({ id, ...def });
      }
    }
    return m;
  }, [storeData]);

  if (loading || !storeData) {
    return <DecoStudioSkeleton />;
  }

  const sub = getSubscriptionInfo();
  const isLocked = sub.status !== 'active';

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl overflow-hidden shadow-sm border border-border animate-fadeIn">
      {/* ── Custom Header: HugoHome ─────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-border bg-card shrink-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <h2 className="text-lg md:text-xl font-black text-foreground flex items-center gap-1.5 tracking-tight">
              <span className="material-symbols-outlined text-zinc-500 text-[22px]">roofing</span>
              HugoHome
              {activeTab === 'my_room' && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-muted/50 border border-border text-zinc-500">
                  {saveStatus === 'saving' && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      <span>Đang lưu...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span>Đã lưu</span>
                    </>
                  )}
                  {saveStatus === 'error' && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-rose-500">Lỗi lưu</span>
                    </>
                  )}
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareRoom}
              title="Chia sẻ phòng"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">share</span>
            </button>
            <button
              onClick={handleInstallPWA}
              title="Cài HugoRoom vào màn hình chính"
              className="hidden sm:flex items-center gap-1 px-2.5 h-8 rounded-full bg-primary/10 dark:bg-primary/40 text-primary hover:bg-primary/15 dark:hover:bg-primary/50 transition-colors text-[10px] font-black uppercase"
            >
              <span className="material-symbols-outlined text-[15px]">install_mobile</span>
              App
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100/80 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-full text-[11px] font-black tracking-wide shadow-sm">
              <JoyCoinBadge hideAmount size="sm" />
              {storeData.balance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 md:px-6 gap-4">
          <button 
            onClick={() => setActiveTab('my_room')}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 text-[13px] font-bold transition-all ${activeTab === 'my_room' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-foreground/80 dark:hover:text-zinc-300'}`}
          >
            <span className="material-symbols-outlined text-[16px]">room_preferences</span>
            Phòng Của Tôi
          </button>
          <button 
            onClick={() => setActiveTab('neighborhood')}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 text-[13px] font-bold transition-all ${activeTab === 'neighborhood' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-foreground/80 dark:hover:text-zinc-300'}`}
          >
            <span className="material-symbols-outlined text-[16px]">holiday_village</span>
            Khu Phố Ảo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {isLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/50 text-center overflow-y-auto">
            <div className="w-full max-w-md p-6 bg-card border border-border rounded-3xl shadow-xl space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 dark:bg-primary/40 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-4xl animate-pulse">lock</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-foreground">Kích hoạt tiện ích HugoHome 🔑</h3>
                {sub.status === 'grace' ? (
                  <div className="p-3 bg-warning/10 dark:bg-warning/30 text-warning/20 dark:text-warning rounded-xl border border-warning/15 dark:border-warning/50 text-xs font-semibold">
                    ⚠️ Tiện ích đã hết hạn! Căn phòng của bạn được giữ trong <span className="font-black text-rose-500">{sub.days} ngày</span> nữa. Sau thời hạn này, toàn bộ thiết kế phòng sẽ bị xóa vĩnh viễn!
                  </div>
                ) : sub.status === 'expired' ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50 text-xs font-semibold">
                    🚨 Hạn gia hạn 7 ngày đã kết thúc! Toàn bộ nội thất phòng của bạn đã bị dọn dẹp. Hãy thuê gói mới để bắt đầu thiết kế lại phòng.
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">Thuê phòng Ký Túc Xá ảo để bắt đầu tùy biến không gian sống, mở khóa cửa hàng và nhận Joy tham quan từ bạn bè!</p>
                )}
              </div>

              {/* Plan selector grid */}
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'daily', title: 'Theo ngày', desc: '15 JOY / ngày' },
                  { id: 'monthly', title: '1 tháng', desc: '299 JOY' },
                  { id: 'long', title: '6 tháng', desc: '1500 JOY' },
                ].map(plan => (
                  <button 
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      selectedPlan === plan.id 
                        ? 'border-primary bg-primary/10 dark:bg-primary/40 text-primary/90 dark:text-primary font-bold shadow-sm' 
                        : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    <span className="text-xs font-black">{plan.title}</span>
                    <span className="text-[10px] opacity-80 mt-1">{plan.desc}</span>
                  </button>
                ))}
              </div>

              {/* Plan dynamic input for daily */}
              {selectedPlan === 'daily' && (
                <div className="space-y-1.5 text-left p-3.5 bg-muted/50 rounded-2xl border border-border">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Nhập số ngày muốn thuê:</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      value={dailyDays} 
                      onChange={e => setDailyDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 px-3 py-2 text-sm font-bold bg-card border border-border rounded-xl outline-none text-foreground"
                    />
                    <div className="flex items-center text-xs font-bold text-zinc-500 px-3">ngày</div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => handleRentClick(selectedPlan)}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/10 transition-colors"
              >
                Thuê KTX ngay
              </button>
            </div>
          </div>
        ) : activeTab === 'my_room' ? (
          <>
            {/* ── Live room preview ─────────────────────────────────────────────── */}
            <div className="relative w-full h-[280px] md:h-[420px] shrink-0 border-b border-border bg-muted/50">
              <DecoRoomScene 
                room={roomState} 
                interactive 
                lastCleanedAt={lastCleanedAt}
                onCleanSuccess={(newBalance, nextTrashCount) => {
                  setStoreData(prev => ({ ...prev, balance: newBalance }));
                  setRoomState(prev => ({ ...prev, trashCount: nextTrashCount }));
                  onBioUpdate?.({ 
                    joyBalance: newBalance, 
                    decoRoom: { 
                      ...(bio?.decoRoom || {}), 
                      trashCount: nextTrashCount 
                    } 
                  });
                }}
                onItemClick={onSceneItemClick} 
                onPositionChange={(slot, pos) => setRoomState(p => ({ ...p, positions: { ...(p.positions || {}), [slot]: pos } }))}
              />

              {reaction && (
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-3xl pointer-events-none animate-bounce">{reaction}</div>
              )}
            </div>

            {/* ── Room Control & Info Bar ─────────────────────────────────────────── */}
            <div className="px-4 md:px-6 py-3 bg-muted/50 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-zinc-500">HugoHome:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    getSubscriptionInfo().status === 'active' ? 'bg-success/15 text-success/20 dark:bg-success/40 dark:text-success' :
                    getSubscriptionInfo().status === 'grace' ? 'bg-warning/15 text-warning/20 dark:bg-warning/40 dark:text-warning' :
                    'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                  }`}>
                    {getSubscriptionInfo().text}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Coziness indicator */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">Độ ấm cúng:</span>
                  <div className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-950/30 px-2.5 py-1 rounded-full border border-pink-100 dark:border-pink-900/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                    <span className="font-black text-pink-600 dark:text-pink-400">{cozy}%</span>
                  </div>
                </div>

                {/* Day/Night indicator */}
                <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full border border-border text-muted-foreground">
                  <span className="material-symbols-outlined text-[13px]">{night ? 'dark_mode' : 'light_mode'}</span>
                  <span className="font-bold text-[10px]">{night ? 'Ban đêm' : 'Ban ngày'}</span>
                </div>
              </div>
            </div>

            {/* ── Compact category chip bar ─────────────────────────────────────── */}
            <div className="sticky top-0 z-40 px-4 md:px-6 py-2.5 bg-card/90 backdrop-blur-md border-b border-border flex gap-1.5 overflow-x-auto scrollbar-hide">
              {[
                { id: 'all', label: 'Tất cả', icon: 'apps' },
                { id: 'wall', label: 'Tường', icon: 'palette' },
                { id: 'floor', label: 'Sàn', icon: 'grid_on' },
                ...SLOT_ORDER.filter((t) => itemsByType[t]?.length).map((t) => ({
                  id: t,
                  label: (DECO_TYPE_META[t] || { label: t }).label,
                  icon: (DECO_TYPE_META[t] || { icon: 'category' }).icon,
                })),
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setStoreFilter(c.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap transition-colors ${
                    storeFilter === c.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[13px]">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* ── Cửa hàng nội thất — unified marketplace ───────────────────────── */}
            <div className="p-3 md:p-5 space-y-6">
              {[
                { id: 'wall', label: 'Màu tường', icon: 'palette', kind: 'wall', clearable: false, entries: WALL_COLORS },
                { id: 'floor', label: 'Sàn nhà', icon: 'grid_on', kind: 'floor', clearable: false, entries: FLOOR_STYLES },
                ...SLOT_ORDER.filter((t) => itemsByType[t]?.length).map((t) => {
                  const meta = DECO_TYPE_META[t] || { label: t, icon: 'category' };
                  return { id: t, label: meta.label, icon: meta.icon, kind: 'item', clearable: CLEARABLE.has(t), entries: itemsByType[t] };
                }),
              ].filter((sec) => storeFilter === 'all' || storeFilter === sec.id).map((sec) => {
                const isRow = storeFilter === 'all';
                const cardW = isRow ? 'w-[104px] md:w-[116px] shrink-0 snap-start' : '';
                return (
                  <section key={sec.id} className="space-y-2.5">
                    {/* Section header */}
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-[13px] font-black text-foreground">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-primary/40 text-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]">{sec.icon}</span>
                        </span>
                        {sec.label}
                        <span className="text-[10px] font-bold text-zinc-400">· {sec.entries.length} món</span>
                      </h3>
                      {isRow && (
                        <button onClick={() => setStoreFilter(sec.id)} className="text-[10px] font-black text-primary hover:text-primary uppercase tracking-wide">
                          Xem hết ›
                        </button>
                      )}
                    </div>

                    {/* Cards: horizontal snap row on "Tất cả", grid when filtered */}
                    <div className={isRow ? 'flex gap-2.5 overflow-x-auto scrollbar-hide snap-x pb-1' : 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5'}>
                      {sec.clearable && (
                        <button onClick={() => setItem(sec.id, null)}
                          className={`${cardW} flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border border-dashed transition-all ${roomState.items[sec.id] == null ? 'border-primary bg-primary/60 dark:bg-primary/10 text-primary' : 'border-border text-zinc-400 hover:border-primary/40 hover:text-primary'}`}>
                          <span className="material-symbols-outlined text-[20px]">block</span>
                          <span className="text-[10px] font-bold">Bỏ trống</span>
                        </button>
                      )}
                      {sec.entries.map((en) => {
                        const id = en.id;
                        const name = en.name || en.label;
                        const price = en.price;
                        const isOwned = price === 0 || storeData?.unlockedItems?.includes(id);
                        const isEquipped = sec.kind === 'wall' ? roomState.wallColor === id
                          : sec.kind === 'floor' ? roomState.floorStyle === id
                          : roomState.items[sec.id] === id;
                        const equip = () => {
                          if (sec.kind === 'wall') setRoomState((p) => ({ ...p, wallColor: id }));
                          else if (sec.kind === 'floor') setRoomState((p) => ({ ...p, floorStyle: id }));
                          else setItem(sec.id, id);
                        };
                        const buyDef = sec.kind === 'wall' ? { type: 'wallColor', price, name }
                          : sec.kind === 'floor' ? { type: 'floorStyle', price, name }
                          : en;
                        const Art = sec.kind === 'item' ? DECO_ART[id] : null;
                        return (
                          <div key={id}
                            onClick={() => isOwned && !isEquipped && equip()}
                            className={`${cardW} relative flex flex-col p-2 rounded-2xl border transition-all duration-200 ${isEquipped ? 'border-primary ring-2 ring-primary/20 bg-primary/60 dark:bg-primary/10' : isOwned ? 'border-border bg-card hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer' : 'border-border/70 bg-muted/50'}`}>
                            {/* Art / swatch */}
                            <div className="relative w-full aspect-square rounded-xl bg-gradient-to-br from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800/60 mb-1.5 p-1.5 flex items-center justify-center overflow-hidden">
                              {sec.kind === 'wall' && <div className="w-3/4 h-3/4 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: en.color }} />}
                              {sec.kind === 'floor' && <div className="w-3/4 h-3/4 rounded-lg border border-black/10 shadow-inner" style={{ backgroundImage: en.swatch, backgroundSize: id.includes('checker') ? '10px 10px' : undefined }} />}
                              {sec.kind === 'item' && Art && <Art />}
                              {!isOwned && (
                                <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center text-white rounded-xl">
                                  <span className="material-symbols-outlined text-[18px]">lock</span>
                                </div>
                              )}
                              {isEquipped && (
                                <span className="absolute top-1 right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full bg-primary text-white flex items-center justify-center shadow">
                                  <span className="material-symbols-outlined text-[12px]">check</span>
                                </span>
                              )}
                            </div>
                            {/* Name */}
                            <div className="text-[10px] font-bold text-foreground/80 line-clamp-2 leading-tight min-h-[26px]">{name}</div>
                            {/* Footer */}
                            <div className="mt-1">
                              {isOwned ? (
                                <span className={`block text-center text-[9px] font-black uppercase px-1.5 py-1 rounded-lg ${isEquipped ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                  {isEquipped ? 'Đang dùng' : 'Dùng ngay'}
                                </span>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); setBuyTarget({ id, def: buyDef }); }}
                                  className="w-full flex items-center justify-center gap-1 text-[9px] font-black uppercase px-1.5 py-1 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-950 transition-colors">
                                  <JoyCoinBadge hideAmount size="sm" />{price}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-4 md:p-6">
            {loadingNeighbors ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full h-[150px] bg-muted animate-pulse" />
                      <div className="p-3 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                           <div className="space-y-1">
                             <div className="w-20 h-3 bg-muted animate-pulse rounded" />
                             <div className="w-12 h-2 bg-muted animate-pulse rounded" />
                           </div>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            ) : neighbors.length === 0 ? (
              <div className="text-center py-10 text-zinc-400">Khu phố ảo hiện đang trống. Hãy là người đầu tiên trang trí!</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {neighbors.map(neighbor => {
                  const room = neighbor.decoRoom;
                  return (
                    <div key={neighbor.slug} className="flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Mini Preview */}
                      <div className="relative w-full h-[150px] overflow-hidden shrink-0 border-b border-border/60">
                        <DecoRoomScene room={room} zoom={0.4} />
                      </div>
                      
                      {/* Neighbor Info */}
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={neighbor.avatarUrl || '/image/avt-default.png'} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0 bg-zinc-100" />
                          <div className="truncate">
                            <h4 className="text-xs font-bold text-foreground truncate">{neighbor.displayName}</h4>
                            <p className="text-[10px] text-muted-foreground">@{neighbor.slug}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => window.open(`/bio/${neighbor.slug}`, '_blank')}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-muted dark:hover:bg-zinc-700 text-foreground/80 text-[10px] font-bold rounded-lg whitespace-nowrap transition-colors"
                        >
                          Ghé thăm
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Buy confirm modal ──────────────────────────────────────────────── */}
      {buyTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setBuyTarget(null)}>
          <div className="bg-card rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-border text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 mx-auto mb-3">{DECO_ART[buyTarget.id] && React.createElement(DECO_ART[buyTarget.id])}</div>
            <p className="text-sm font-black text-foreground">{buyTarget.def.name}</p>
            {storeData.balance < buyTarget.def.price ? (
              <p className="mt-2 text-xs font-semibold text-rose-500">Không đủ JOY (cần {buyTarget.def.price}, bạn có {storeData.balance}).</p>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-500">Mua với giá <span className="font-black text-yellow-600 dark:text-yellow-400">{buyTarget.def.price} JOY</span>?</p>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setBuyTarget(null)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">Huỷ</button>
              <button onClick={confirmBuy} disabled={storeData.balance < buyTarget.def.price || isBuying}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-40">
                {isBuying ? 'Đang xử lý...' : 'Mua ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pet Action confirm modal ────────────────────────────────────────── */}
      {petAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setPetAction(null)}>
          <div className="bg-card rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-border text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-zinc-500">
                {petAction === 'revive' ? 'heart_broken' : 'restaurant'}
              </span>
            </div>
            {petAction === 'revive' ? (
              <>
                <p className="text-sm font-black text-foreground">Thú cưng đã qua đời 🐾</p>
                <p className="mt-1.5 text-xs text-zinc-500">Bé đã qua đời vì đói. Bạn có thể <span className="font-bold text-primary">hồi sinh</span> với giá <span className="font-black text-yellow-600 dark:text-yellow-400">99 JOY</span>, hoặc <span className="font-bold text-rose-500">xóa luôn</span> và nuôi bé mới từ đầu.</p>
                {storeData.balance < 99 && (
                  <p className="mt-2 text-xs font-semibold text-rose-500">Không đủ JOY để hồi sinh (bạn có {storeData.balance}).</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-black text-foreground">Cho thú cưng ăn 🍖</p>
                <p className="mt-1.5 text-xs text-zinc-500">Đặt lại thời gian đói của thú cưng thêm 24 giờ (Hoàn toàn miễn phí!).</p>
              </>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setPetAction(null)} className="flex-1 py-2.5 rounded-xl bg-muted text-muted-foreground text-xs font-bold">Huỷ</button>
              {petAction === 'revive' ? (
                <>
                  <button onClick={handleDeletePet} disabled={isPetInteracting}
                    className="flex-1 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 text-xs font-bold disabled:opacity-40">
                    Xóa luôn
                  </button>
                  <button onClick={handleRevivePet} disabled={storeData.balance < 99 || isPetInteracting}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-40">
                    {isPetInteracting ? 'Đang xử lý...' : 'Hồi sinh'}
                  </button>
                </>
              ) : (
                <button onClick={handleFeedPet} disabled={isPetInteracting}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-40">
                  {isPetInteracting ? 'Đang xử lý...' : 'Cho ăn'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* ── Receipt Modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {receipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceipt(null)}
              className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
            />

            {/* Receipt Paper */}
            <motion.div
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#faf9f6] dark:bg-zinc-900 text-foreground shadow-2xl overflow-hidden"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))"
              }}
            >
              {/* Header */}
              <div className="pt-8 pb-4 px-6 text-center border-b border-border border-dashed">
                <h2 className="font-black text-2xl tracking-tighter uppercase mb-1">Hugo Studio</h2>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Hóa Đơn Mua Sắm Nội Thất</p>
                <div className="mt-4 text-left">
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>NGÀY:</span> <span>{receipt.date.split(' ')[1] || new Date().toLocaleDateString('vi-VN')}</span>
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>GIỜ:</span> <span>{receipt.date.split(' ')[0] || new Date().toLocaleTimeString('vi-VN')}</span>
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                    <span>MÃ GD:</span> <span className="font-bold">#{receipt.txCode}</span>
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="py-6 px-6 font-mono text-sm space-y-4 min-h-[120px]">
                <div className="flex justify-between items-start">
                  <div className="max-w-[70%]">
                    <span className="font-bold block uppercase">{receipt.name}</span>
                    <span className="text-[10px] text-zinc-500 block">Nội thất HugoHome Virtual Diorama</span>
                  </div>
                  <span className="font-bold">{receipt.price} JOY</span>
                </div>
                
                <div className="flex justify-between items-start pt-2">
                  <div className="max-w-[70%]">
                    <span className="font-bold block text-xs">Thuế & Phí (Cố định)</span>
                    <span className="text-[10px] text-zinc-500 block">Miễn phí dịch vụ Hugo Studio</span>
                  </div>
                  <span className="font-bold text-success">FREE</span>
                </div>
              </div>

              {/* Total */}
              <div className="py-4 px-6 border-t border-border border-dashed font-mono bg-muted/50">
                <div className="flex justify-between items-center text-lg font-black">
                  <span>TỔNG CỘNG</span>
                  <span className="text-pink-500">{receipt.price} JOY</span>
                </div>
              </div>

              {/* PAID STAMP */}
              {stampVisible && (
                <motion.div 
                  initial={{ scale: 3, opacity: 0, rotate: -15 }}
                  animate={{ scale: 1, opacity: 1, rotate: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-destructive text-destructive font-black text-4xl px-6 py-2 uppercase tracking-widest rounded-lg"
                  style={{ textShadow: "0 0 4px rgba(239,68,68,0.5)", pointerEvents: "none" }}
                >
                  ĐÃ THU
                </motion.div>
              )}

              {/* Actions */}
              <div className="p-6 bg-muted pb-10">
                <button
                  onClick={() => setReceipt(null)}
                  className="w-full py-3.5 bg-zinc-900 hover:bg-foreground dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-lg"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Rent Invoice Modal ────────────────────────────────────────────── */}
      {showInvoice && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowInvoice(null)}>
          <div className="bg-[#faf9f6] dark:bg-zinc-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-border text-foreground animate-scaleIn" onClick={(e) => e.stopPropagation()}
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))"
            }}
          >
            {/* Header */}
            <div className="pt-8 pb-4 px-6 text-center border-b border-border border-dashed">
              <h2 className="font-black text-2xl tracking-tighter uppercase mb-1">HUGO STUDIO</h2>
              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Hóa Đơn Thuê Tiện Ích KTX</p>
              <div className="mt-4 text-left">
                <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>DỊCH VỤ:</span> <span className="font-bold text-foreground">HugoHome Virtual Dorm</span>
                </p>
                <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>THỜI HẠN:</span> <span className="font-bold text-foreground">{showInvoice.days} ngày</span>
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="py-5 px-6 font-mono text-xs space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Giá thuê gốc:</span>
                <span className="font-bold text-foreground">{showInvoice.base} JOY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Phí Sáng Tạo (10%):</span>
                <span className="font-bold text-primary">+{showInvoice.fee} JOY</span>
              </div>
              <div className="h-px bg-muted border-dashed border-b" />
              <div className="flex justify-between items-center text-sm font-black">
                <span>TỔNG CỘNG:</span>
                <span className="text-pink-500">{showInvoice.total} JOY</span>
              </div>
            </div>

            {/* Balance check */}
            <div className="px-6 py-3 bg-muted text-center text-[10px] font-mono text-zinc-500">
              <div className="flex justify-between">
                <span>SỐ DƯ HIỆN CÓ:</span>
                <span className="font-bold">{storeData.balance} JOY</span>
              </div>
              {storeData.balance < showInvoice.total ? (
                <p className="text-rose-500 font-bold mt-1 text-[9px] uppercase">🚨 Không đủ JOY để thanh toán</p>
              ) : (
                <div className="flex justify-between mt-1 text-[9px] text-success font-bold">
                  <span>SỐ DƯ SAU THUÊ:</span>
                  <span>{storeData.balance - showInvoice.total} JOY</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 bg-muted pb-10 flex gap-2">
              <button 
                onClick={() => setShowInvoice(null)} 
                className="flex-1 py-3 bg-muted text-foreground/80 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={confirmPayment} 
                disabled={storeData.balance < showInvoice.total || isRenting}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {isRenting ? 'Đang thanh toán...' : 'Xác nhận & Thuê'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ────────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-border text-center space-y-4 animate-scaleIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-success/10 dark:bg-success/40 flex items-center justify-center text-success">
              <span className="material-symbols-outlined text-4xl animate-bounce">check_circle</span>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-foreground">Kích hoạt KTX thành công! 🎉</h3>
              <p className="text-xs text-zinc-500">Cảm ơn bạn đã đồng hành cùng Hugo Studio. Tiện ích HugoHome của bạn đã hoạt động trở lại!</p>
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-success hover:bg-success/90 text-white rounded-2xl text-xs font-black transition-colors"
            >
              Vào Ký Túc Xá 🚪
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
