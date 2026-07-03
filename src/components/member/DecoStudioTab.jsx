import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DecoStudioSkeleton } from '../ui/SkeletonLayouts';
import JoyCoinBadge from '../shared/JoyCoinBadge';
import { DECO_ART, DECO_TYPE_META, DecoRoomScene, cozinessScore, isNightRoom } from './deco/decoAssets';

const API = import.meta.env.VITE_API_URL || '/api';

// Slot order shown in the customizer + which slots the room understands.
const SLOT_ORDER = ['desk', 'chair', 'computer', 'window', 'rug', 'plant', 'lamp', 'poster', 'pet'];
const CLEARABLE = new Set(['pet', 'poster', 'rug', 'plant', 'lamp']); // optional slots

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
    items: { desk: 'desk_basic', chair: 'chair_basic', computer: 'laptop', window: 'window_day', poster: null, pet: null, rug: null, plant: null, lamp: null },
    positions: {},
  });

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
      showToast?.(`Đã mua ${def.name}! 🎉`, 'success');
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


  const setItem = (type, id) => setRoomState((p) => ({ ...p, items: { ...p.items, [type]: id } }));
  const owns = (id, def) => def.price === 0 || storeData?.unlockedItems?.includes(id);

  const onSceneItemClick = (slot) => {
    const emoji = slot === 'pet' ? ['🐾', '❤️', '😻'][Math.floor(Math.random() * 3)] : '💻';
    setReaction(emoji);
    setTimeout(() => setReaction(''), 900);
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
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 animate-fadeIn">
      {/* ── Custom Header: HugoHome ─────────────────────────────────────────── */}
      <div className="flex flex-col border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <h2 className="text-lg md:text-xl font-black text-zinc-900 dark:text-white flex items-center gap-1.5 tracking-tight">
              <span className="material-symbols-outlined text-zinc-500 text-[22px]">roofing</span>
              HugoHome
              {activeTab === 'my_room' && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500">
                  {saveStatus === 'saving' && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>Đang lưu...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 text-[13px] font-bold transition-all ${activeTab === 'my_room' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
          >
            <span className="material-symbols-outlined text-[16px]">room_preferences</span>
            Phòng Của Tôi
          </button>
          <button 
            onClick={() => setActiveTab('neighborhood')}
            className={`flex items-center gap-1.5 pb-2.5 border-b-2 text-[13px] font-bold transition-all ${activeTab === 'neighborhood' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'}`}
          >
            <span className="material-symbols-outlined text-[16px]">holiday_village</span>
            Khu Phố Ảo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col">
        {isLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950/40 text-center overflow-y-auto">
            <div className="w-full max-w-md p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <span className="material-symbols-outlined text-4xl animate-pulse">lock</span>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Kích hoạt tiện ích HugoHome 🔑</h3>
                {sub.status === 'grace' ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/50 text-xs font-semibold">
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
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm' 
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-xs font-black">{plan.title}</span>
                    <span className="text-[10px] opacity-80 mt-1">{plan.desc}</span>
                  </button>
                ))}
              </div>

              {/* Plan dynamic input for daily */}
              {selectedPlan === 'daily' && (
                <div className="space-y-1.5 text-left p-3.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Nhập số ngày muốn thuê:</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min="1" 
                      value={dailyDays} 
                      onChange={e => setDailyDays(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 px-3 py-2 text-sm font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none text-zinc-800 dark:text-zinc-100"
                    />
                    <div className="flex items-center text-xs font-bold text-zinc-500 px-3">ngày</div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => handleRentClick(selectedPlan)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/10 transition-colors"
              >
                Thuê KTX ngay
              </button>
            </div>
          </div>
        ) : activeTab === 'my_room' ? (
          <>
            {/* ── Live room preview ─────────────────────────────────────────────── */}
            <div className="relative w-full h-[280px] md:h-[420px] shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <DecoRoomScene 
                room={roomState} 
                interactive 
                lastCleanedAt={lastCleanedAt}
                onCleanSuccess={(newBalance, newCleanedAt) => {
                  setStoreData(prev => ({ ...prev, balance: newBalance }));
                  setLastCleanedAt(newCleanedAt);
                }}
                onItemClick={onSceneItemClick} 
                onPositionChange={(slot, pos) => setRoomState(p => ({ ...p, positions: { ...(p.positions || {}), [slot]: pos } }))}
              />

              {reaction && (
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-3xl pointer-events-none animate-bounce">{reaction}</div>
              )}
            </div>

            {/* ── Room Control & Info Bar ─────────────────────────────────────────── */}
            <div className="px-4 md:px-6 py-3 bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-zinc-500">HugoHome:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    getSubscriptionInfo().status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                    getSubscriptionInfo().status === 'grace' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
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
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                  <span className="material-symbols-outlined text-[13px]">{night ? 'dark_mode' : 'light_mode'}</span>
                  <span className="font-bold text-[10px]">{night ? 'Ban đêm' : 'Ban ngày'}</span>
                </div>
              </div>
            </div>

            {/* ── Store / customizer grouped by slot ────────────────────────────── */}
            <div className="p-4 md:p-6 space-y-7">
              {/* Màu Tường (Wall Color) Customizer */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-1.5 text-sm font-black text-zinc-800 dark:text-zinc-100">
                  <span className="material-symbols-outlined text-[16px] text-zinc-500">palette</span>
                  Màu tường
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {WALL_COLORS.map((w) => {
                    const isOwned = w.price === 0 || storeData?.unlockedItems?.includes(w.id);
                    const isEquipped = roomState.wallColor === w.id;
                    return (
                      <div key={w.id}
                        onClick={() => isOwned && setRoomState(p => ({ ...p, wallColor: w.id }))}
                        className={`relative flex flex-col p-3 rounded-xl border-2 transition-all ${isEquipped ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' : isOwned ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-indigo-300 cursor-pointer' : 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/40'}`}
                      >
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full border border-black/10 flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: w.color }}>
                          {!isOwned && (
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-white">
                              <span className="material-symbols-outlined text-[16px]">lock</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center mt-auto">
                          <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 line-clamp-1">{w.label}</div>
                          <div className="mt-1.5 flex justify-center">
                            {isOwned ? (
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isEquipped ? 'bg-indigo-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                                {isEquipped ? 'Đang dùng' : 'Đã có'}
                              </span>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setBuyTarget({ id: w.id, def: { type: 'wallColor', price: w.price, name: w.label } }); }}
                                className="flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-yellow-400 hover:bg-yellow-500 text-yellow-950 transition-colors">
                                <JoyCoinBadge hideAmount size="sm" />{w.price}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sàn Nhà (Floor Style) Customizer */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-1.5 text-sm font-black text-zinc-800 dark:text-zinc-100">
                  <span className="material-symbols-outlined text-[16px] text-zinc-500">grid_on</span>
                  Sàn nhà
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FLOOR_STYLES.map((f) => {
                    const isOwned = f.price === 0 || storeData?.unlockedItems?.includes(f.id);
                    const isEquipped = roomState.floorStyle === f.id;
                    return (
                      <div key={f.id}
                        onClick={() => isOwned && setRoomState(p => ({ ...p, floorStyle: f.id }))}
                        className={`relative flex flex-col p-3 rounded-xl border-2 transition-all ${isEquipped ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' : isOwned ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-indigo-300 cursor-pointer' : 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/40'}`}
                      >
                        <div className="w-12 h-12 mx-auto mb-2 rounded-lg border border-black/10 flex items-center justify-center relative overflow-hidden" style={{ backgroundImage: f.swatch, backgroundSize: f.id.includes('checker') ? '10px 10px' : undefined }}>
                          {!isOwned && (
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-white">
                              <span className="material-symbols-outlined text-[16px]">lock</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center mt-auto">
                          <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 line-clamp-1">{f.label}</div>
                          <div className="mt-1.5 flex justify-center">
                            {isOwned ? (
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isEquipped ? 'bg-indigo-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                                {isEquipped ? 'Đang dùng' : 'Đã có'}
                              </span>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); setBuyTarget({ id: f.id, def: { type: 'floorStyle', price: f.price, name: f.label } }); }}
                                className="flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-yellow-400 hover:bg-yellow-500 text-yellow-950 transition-colors">
                                <JoyCoinBadge hideAmount size="sm" />{f.price}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {SLOT_ORDER.filter((t) => itemsByType[t]?.length).map((type) => {
                const meta = DECO_TYPE_META[type] || { label: type, icon: 'category' };
                return (
                  <div key={type} className="space-y-3">
                    <h3 className="flex items-center gap-1.5 text-sm font-black text-zinc-800 dark:text-zinc-100">
                      <span className="material-symbols-outlined text-[16px] text-zinc-500">{meta.icon}</span>
                      {meta.label}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CLEARABLE.has(type) && (
                        <button onClick={() => setItem(type, null)}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${roomState.items[type] == null ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 opacity-60 hover:opacity-100'}`}>
                          <span className="material-symbols-outlined text-zinc-400 mb-1">block</span>
                          <span className="text-[11px] font-semibold text-zinc-500">Bỏ trống</span>
                        </button>
                      )}
                      {itemsByType[type].map((item) => {
                        const isOwned = owns(item.id, item);
                        const isEquipped = roomState.items[type] === item.id;
                        const Art = DECO_ART[item.id];
                        return (
                          <div key={item.id}
                            onClick={() => isOwned && setItem(type, item.id)}
                            className={`relative flex flex-col p-3 rounded-xl border-2 transition-all ${isEquipped ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-sm' : isOwned ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-indigo-300 cursor-pointer' : 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/40'}`}>
                            <div className="w-16 h-16 mx-auto mb-1.5">{Art && <Art />}</div>
                            <div className="text-center mt-auto">
                              <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 line-clamp-1">{item.name}</div>
                              <div className="mt-1.5 flex justify-center">
                                {isOwned ? (
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isEquipped ? 'bg-indigo-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                                    {isEquipped ? 'Đang dùng' : 'Đã có'}
                                  </span>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); setBuyTarget({ id: item.id, def: item }); }}
                                    className="flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-yellow-400 hover:bg-yellow-500 text-yellow-950 transition-colors">
                                    <JoyCoinBadge hideAmount size="sm" />{item.price}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-4 md:p-6">
            {loadingNeighbors ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="w-full h-[150px] bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                      <div className="p-3 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                           <div className="space-y-1">
                             <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" />
                             <div className="w-12 h-2 bg-zinc-200 dark:bg-zinc-700 animate-pulse rounded" />
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
                    <div key={neighbor.slug} className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Mini Preview */}
                      <div className="relative w-full h-[150px] overflow-hidden shrink-0 border-b border-zinc-100 dark:border-zinc-800">
                        <DecoRoomScene room={room} zoom={0.4} />
                      </div>
                      
                      {/* Neighbor Info */}
                      <div className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={neighbor.avatarUrl || '/image/avt-default.png'} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0 bg-zinc-100" />
                          <div className="truncate">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{neighbor.displayName}</h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400">@{neighbor.slug}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => window.open(`/bio/${neighbor.slug}`, '_blank')}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg whitespace-nowrap transition-colors"
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
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 mx-auto mb-3">{DECO_ART[buyTarget.id] && React.createElement(DECO_ART[buyTarget.id])}</div>
            <p className="text-sm font-black text-zinc-800 dark:text-zinc-100">{buyTarget.def.name}</p>
            {storeData.balance < buyTarget.def.price ? (
              <p className="mt-2 text-xs font-semibold text-rose-500">Không đủ JOY (cần {buyTarget.def.price}, bạn có {storeData.balance}).</p>
            ) : (
              <p className="mt-1.5 text-xs text-zinc-500">Mua với giá <span className="font-black text-yellow-600 dark:text-yellow-400">{buyTarget.def.price} JOY</span>?</p>
            )}
            <div className="mt-4 flex gap-2">
              <button onClick={() => setBuyTarget(null)} className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold">Huỷ</button>
              <button onClick={confirmBuy} disabled={storeData.balance < buyTarget.def.price || isBuying}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-40">
                {isBuying ? 'Đang xử lý...' : 'Mua ngay'}
              </button>
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
              className="relative w-full max-w-sm bg-[#faf9f6] dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-2xl overflow-hidden"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))"
              }}
            >
              {/* Header */}
              <div className="pt-8 pb-4 px-6 text-center border-b border-zinc-200 dark:border-zinc-800 border-dashed">
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
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">FREE</span>
                </div>
              </div>

              {/* Total */}
              <div className="py-4 px-6 border-t border-zinc-200 dark:border-zinc-800 border-dashed font-mono bg-zinc-50 dark:bg-zinc-800/20">
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
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-500 text-red-500 font-black text-4xl px-6 py-2 uppercase tracking-widest rounded-lg"
                  style={{ textShadow: "0 0 4px rgba(239,68,68,0.5)", pointerEvents: "none" }}
                >
                  ĐÃ THU
                </motion.div>
              )}

              {/* Actions */}
              <div className="p-6 bg-zinc-100 dark:bg-zinc-800/60 pb-10">
                <button
                  onClick={() => setReceipt(null)}
                  className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-colors shadow-lg"
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
          <div className="bg-[#faf9f6] dark:bg-zinc-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 animate-scaleIn" onClick={(e) => e.stopPropagation()}
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), 95% 100%, 90% calc(100% - 10px), 85% 100%, 80% calc(100% - 10px), 75% 100%, 70% calc(100% - 10px), 65% 100%, 60% calc(100% - 10px), 55% 100%, 50% calc(100% - 10px), 45% 100%, 40% calc(100% - 10px), 35% 100%, 30% calc(100% - 10px), 25% 100%, 20% calc(100% - 10px), 15% 100%, 10% calc(100% - 10px), 5% 100%, 0 calc(100% - 10px))"
            }}
          >
            {/* Header */}
            <div className="pt-8 pb-4 px-6 text-center border-b border-zinc-200 dark:border-zinc-800 border-dashed">
              <h2 className="font-black text-2xl tracking-tighter uppercase mb-1">HUGO STUDIO</h2>
              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Hóa Đơn Thuê Tiện Ích KTX</p>
              <div className="mt-4 text-left">
                <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>DỊCH VỤ:</span> <span className="font-bold text-zinc-800 dark:text-zinc-200">HugoHome Virtual Dorm</span>
                </p>
                <p className="text-[10px] font-mono text-zinc-500 flex justify-between">
                  <span>THỜI HẠN:</span> <span className="font-bold text-zinc-800 dark:text-zinc-200">{showInvoice.days} ngày</span>
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="py-5 px-6 font-mono text-xs space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Giá thuê gốc:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{showInvoice.base} JOY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Phí Sáng Tạo (10%):</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">+{showInvoice.fee} JOY</span>
              </div>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 border-dashed border-b" />
              <div className="flex justify-between items-center text-sm font-black">
                <span>TỔNG CỘNG:</span>
                <span className="text-pink-500">{showInvoice.total} JOY</span>
              </div>
            </div>

            {/* Balance check */}
            <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/40 text-center text-[10px] font-mono text-zinc-500">
              <div className="flex justify-between">
                <span>SỐ DƯ HIỆN CÓ:</span>
                <span className="font-bold">{storeData.balance} JOY</span>
              </div>
              {storeData.balance < showInvoice.total ? (
                <p className="text-rose-500 font-bold mt-1 text-[9px] uppercase">🚨 Không đủ JOY để thanh toán</p>
              ) : (
                <div className="flex justify-between mt-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>SỐ DƯ SAU THUÊ:</span>
                  <span>{storeData.balance - showInvoice.total} JOY</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 bg-zinc-100 dark:bg-zinc-800/60 pb-10 flex gap-2">
              <button 
                onClick={() => setShowInvoice(null)} 
                className="flex-1 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={confirmPayment} 
                disabled={storeData.balance < showInvoice.total || isRenting}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
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
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center space-y-4 animate-scaleIn">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-4xl animate-bounce">check_circle</span>
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Kích hoạt KTX thành công! 🎉</h3>
              <p className="text-xs text-zinc-500">Cảm ơn bạn đã đồng hành cùng Hugo Studio. Tiện ích HugoHome của bạn đã hoạt động trở lại!</p>
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-colors"
            >
              Vào Ký Túc Xá 🚪
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
