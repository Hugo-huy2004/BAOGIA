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
  { id: 'wood_basic', label: 'Gỗ ấm', swatch: 'linear-gradient(180deg,#c98a4e,#a9713a)' },
  { id: 'wood_dark', label: 'Gỗ óc chó', swatch: 'linear-gradient(180deg,#6b4423,#4a2e17)' },
  { id: 'tile_white', label: 'Gạch trắng', swatch: 'linear-gradient(180deg,#e9ecf2,#cfd4de)' },
  { id: 'tile_checker', label: 'Caro', swatch: 'repeating-conic-gradient(#e5e7eb 0deg 90deg,#9ca3af 90deg 180deg)' },
];

export default function DecoStudioTab({ onBack, bio, showToast, onBioUpdate }) {
  const [activeTab, setActiveTab] = useState('my_room'); // 'my_room' | 'neighborhood'
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyTarget, setBuyTarget] = useState(null);   // { id, def } pending purchase
  const [reaction, setReaction] = useState('');       // ephemeral emoji on item click
  const [receipt, setReceipt] = useState(null);       // invoice for purchase
  
  // Neighborhood states
  const [neighbors, setNeighbors] = useState([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);

  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const isInitialized = useRef(false);

  const [roomState, setRoomState] = useState({
    enabled: false,
    wallColor: '#f4f4f5',
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
      if (bio?.decoRoom) {
        setRoomState((prev) => ({
          ...prev,
          enabled: bio.decoRoom.enabled ?? false,
          wallColor: bio.decoRoom.wallColor || '#f4f4f5',
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
      setItem(def.type, id); // auto-equip
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
              <span className="material-symbols-outlined text-indigo-500 text-[22px]">roofing</span>
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

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'my_room' ? (
          <>
            {/* ── Live room preview ─────────────────────────────────────────────── */}
            <div className="relative w-full h-[260px] md:h-[360px] shrink-0 border-b border-zinc-200 dark:border-zinc-800">
              <DecoRoomScene 
                room={roomState} 
                interactive 
                onItemClick={onSceneItemClick} 
                onPositionChange={(slot, pos) => setRoomState(p => ({ ...p, positions: { ...(p.positions || {}), [slot]: pos } }))}
              />

              {reaction && (
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-3xl pointer-events-none animate-bounce">{reaction}</div>
              )}

              {/* Top-left: display toggle + wall color */}
              <div className="absolute top-3 left-3 p-2.5 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md rounded-xl border border-black/5 flex flex-col gap-2 z-40 shadow-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600"
                    checked={roomState.enabled} onChange={(e) => setRoomState((p) => ({ ...p, enabled: e.target.checked }))} />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200">Hiện trên Bio</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-500">Tường</span>
                  <input type="color" value={roomState.wallColor}
                    onChange={(e) => setRoomState((p) => ({ ...p, wallColor: e.target.value }))}
                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent" />
                </div>
              </div>

              {/* Top-right: coziness meter + day/night badge */}
              <div className="absolute top-3 right-3 z-40 flex flex-col items-end gap-2">
                <div className="px-2.5 py-1.5 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md rounded-xl border border-black/5 shadow-sm w-[132px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wide text-pink-500">Độ ấm cúng</span>
                    <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-200">{cozy}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-500" style={{ width: `${cozy}%` }} />
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-black/5">
                  <span className="material-symbols-outlined text-[13px]">{night ? 'dark_mode' : 'light_mode'}</span>
                  {night ? 'Ban đêm' : 'Ban ngày'}
                </span>
              </div>
            </div>

            {/* ── Floor picker ──────────────────────────────────────────────────── */}
            <div className="px-4 md:px-6 pt-4">
              <h3 className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Sàn nhà</h3>
              <div className="flex gap-2 flex-wrap">
                {FLOOR_STYLES.map((f) => (
                  <button key={f.id} onClick={() => setRoomState((p) => ({ ...p, floorStyle: f.id }))}
                    className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border-2 transition-all ${roomState.floorStyle === f.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'}`}>
                    <span className="w-6 h-6 rounded-lg border border-black/10" style={{ backgroundImage: f.swatch, backgroundSize: f.id === 'tile_checker' ? '10px 10px' : undefined }} />
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Store / customizer grouped by slot ────────────────────────────── */}
            <div className="p-4 md:p-6 space-y-7">
              {SLOT_ORDER.filter((t) => itemsByType[t]?.length).map((type) => {
                const meta = DECO_TYPE_META[type] || { label: type, icon: 'category' };
                return (
                  <div key={type} className="space-y-3">
                    <h3 className="flex items-center gap-1.5 text-sm font-black text-zinc-800 dark:text-zinc-100">
                      <span className="material-symbols-outlined text-[16px] text-indigo-500">{meta.icon}</span>
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
                            <div className={`w-16 h-16 mx-auto mb-1.5 ${isOwned ? '' : 'opacity-40 grayscale'}`}>{Art && <Art />}</div>
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

    </div>
  );
}
