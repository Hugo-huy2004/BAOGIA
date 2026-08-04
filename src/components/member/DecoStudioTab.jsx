import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DecoStudioSkeleton } from '../ui/SkeletonLayouts';
import JoyCoinBadge from '../shared/JoyCoinBadge';
import { useJoyStore } from '../../stores/joyStore';
import { DECO_ART, DECO_TYPE_META, DecoRoomScene, cozinessScore, isNightRoom } from './deco/decoAssets';
import useDecoAudio, { DECO_SOUNDTRACKS } from './deco/useDecoAudio';
import { chapterMeta, withLocalStoryProgress } from './deco/decoStory';
import { describeCondition, fetchWeather } from '../../utils/weather';
import './deco/deco-studio.css';

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

const DECO_NPCS = Object.freeze([
  { id: 'may', name: 'Mây', role: 'Người giữ phòng 27', avatar: '✦' },
  { id: 'kai', name: 'Kai', role: 'Chủ kho nội thất', avatar: 'K' },
  { id: 'an', name: 'An', role: 'Hướng dẫn khu phố', avatar: 'A' },
  { id: 'pet', name: 'Bắp', role: 'Người bạn nhỏ', avatar: '🐾' },
]);

export default function DecoStudioTab({ onBack, bio, showToast, onBioUpdate }) {
  const [activeTab, setActiveTab] = useState('my_room'); // 'my_room' | 'neighborhood'
  const [storeData, setStoreData] = useState(null);
  const setJoyBalance = useJoyStore((s) => s.setBalance);
  const [expiresAt, setExpiresAt] = useState(null);
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
  const [soundPanelOpen, setSoundPanelOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantThinking, setAssistantThinking] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState('Chạm một món đồ để chỉnh kích thước, hoặc nói cho Mây biết bạn muốn căn phòng mang cảm giác gì.');
  const [assistantToast, setAssistantToast] = useState('');
  const [story, setStory] = useState(null);
  const [storyOpen, setStoryOpen] = useState(false);
  const [claimingStory, setClaimingStory] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [storyReveal, setStoryReveal] = useState(null);
  const [activeNpc, setActiveNpc] = useState(null);
  const assistantTimerRef = useRef(null);
  const assistantToastTimerRef = useRef(null);
  const { enabled: audioEnabled, soundtrack, toggle: toggleAudio, setSoundtrack, playCue } = useDecoAudio();
  
  // Neighborhood states
  const [neighbors, setNeighbors] = useState([]);
  const [visitedRooms, setVisitedRooms] = useState([]);
  const [loadingNeighbors, setLoadingNeighbors] = useState(false);
  const [touringNeighbor, setTouringNeighbor] = useState(null);
  const [buyingTicketSlug, setBuyingTicketSlug] = useState('');
  const [tipAmount, setTipAmount] = useState(25);
  const [isTipping, setIsTipping] = useState(false);
  const [isKnocking, setIsKnocking] = useState(false);
  const [tourWeather, setTourWeather] = useState(null);
  const tourWeatherPoint = touringNeighbor?.environment?.weatherPoint;

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

  const announce = useCallback((message, cue = 'select') => {
    setAssistantToast(message);
    playCue(cue);
    window.clearTimeout(assistantToastTimerRef.current);
    assistantToastTimerRef.current = window.setTimeout(() => setAssistantToast(''), 2600);
  }, [playCue]);

  useEffect(() => () => {
    window.clearTimeout(assistantTimerRef.current);
    window.clearTimeout(assistantToastTimerRef.current);
  }, []);

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
    const point = tourWeatherPoint;
    if (!point) {
      setTourWeather(null);
      return undefined;
    }
    let active = true;
    setTourWeather(null);
    fetchWeather(point.lat, point.lon)
      .then((weather) => { if (active) setTourWeather(weather); })
      .catch(() => { if (active) setTourWeather(null); });
    return () => { active = false; };
  }, [tourWeatherPoint]);

  // Mọi phản hồi của API KTX đều kèm số dư mới. Đẩy nó về joyStore để ví ở
  // tab khác không hiển thị số cũ — trước đây KTX giữ bản sao riêng.
  useEffect(() => {
    if (typeof storeData?.balance === 'number') setJoyBalance(storeData.balance);
  }, [storeData?.balance, setJoyBalance]);

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
      playCue('purchase');
      const timer2 = setTimeout(() => {
        setStampVisible(true);
      }, 500);

      return () => {
        clearTimeout(timer2);
      };
    } else {
      setStampVisible(false);
    }
  }, [receipt, playCue]);

  async function fetchStore() {
    try {
      // Auth (Bearer + cookie) is attached automatically by the global fetch
      // interceptor — do NOT add an Authorization header here.
      const res = await fetch(`${API}/deco/store`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được cửa hàng');
      setStoreData(data);
      setExpiresAt(data.expiresAt);
      setLastCleanedAt(data.lastCleanedAt || null);
      setVisitedRooms(data.visitedRooms || []);
      setStory(data.story || null);
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

  const enterNeighborRoom = async (neighbor) => {
    if (neighbor.hasAccess && neighbor.decoRoom) {
      setTouringNeighbor(neighbor);
      playCue('open');
      return;
    }
    if (buyingTicketSlug) return;
    if (storeData.balance < 10) {
      showToast?.('Bạn cần 10 JOY để mua vé tham quan căn phòng này.', 'error');
      return;
    }

    setBuyingTicketSlug(neighbor.slug);
    try {
      const response = await fetch(`${API}/deco/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSlug: neighbor.slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không mua được vé tham quan.');

      setVisitedRooms(data.visitedRooms || []);
      setStoreData((previous) => ({ ...previous, balance: data.balance }));
      setNeighbors((previous) => previous.map((entry) => (
        entry.slug === neighbor.slug ? { ...entry, ...data.neighbor, hasAccess: true } : entry
      )));
      onBioUpdate?.({ joyBalance: data.balance });
      setTouringNeighbor(data.neighbor);
      announce(
        data.alreadyOwned ? `Chào mừng bạn quay lại phòng của ${neighbor.displayName}.` : `Đã mua vé 10 JOY · Mời vào phòng của ${neighbor.displayName}.`,
        'purchase'
      );
    } catch (error) {
      showToast?.(error.message, 'error');
    } finally {
      setBuyingTicketSlug('');
    }
  };

  const knockNeighborDoor = async () => {
    if (!touringNeighbor || isKnocking) return;
    setIsKnocking(true);
    try {
      const response = await fetch(`${API}/deco/knock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSlug: touringNeighbor.slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa thể gõ cửa.');
      announce(`Bạn đã gõ cửa phòng ${touringNeighbor.displayName}.`, 'place');
    } catch (error) {
      showToast?.(error.message, 'error');
    } finally {
      setIsKnocking(false);
    }
  };

  const sendNeighborBonus = async () => {
    if (!touringNeighbor || isTipping) return;
    const amount = Number(tipAmount);
    if (![10, 25, 50, 100].includes(amount)) return;
    if (storeData.balance < amount) {
      showToast?.(`Bạn không đủ ${amount} JOY để gửi bonus.`, 'error');
      return;
    }

    setIsTipping(true);
    try {
      const response = await fetch(`${API}/deco/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSlug: touringNeighbor.slug, amount }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa gửi được bonus.');
      setStoreData((previous) => ({ ...previous, balance: data.balance }));
      onBioUpdate?.({ joyBalance: data.balance });
      announce(`Đã gửi ${amount} JOY bonus cho ${touringNeighbor.displayName}.`, 'purchase');
    } catch (error) {
      showToast?.(error.message, 'error');
    } finally {
      setIsTipping(false);
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


  const setItem = (type, id, label) => {
    setRoomState((p) => ({
      ...p,
      items: { ...p.items, [type]: id },
      // Swapping/removing the pet always starts the new one alive & fed —
      // mirrors the server reset in /deco/save.
      ...(type === 'pet' ? { petStatus: 'alive', petFedAt: new Date().toISOString() } : {}),
    }));
    announce(id ? `${label || DECO_TYPE_META[type]?.label || 'Nội thất'} đã vào phòng.` : `Đã để trống ${DECO_TYPE_META[type]?.label?.toLowerCase() || 'vị trí này'}.`, 'place');
  };

  const onSceneItemClick = (slot) => {
    if (slot === 'pet') {
      playCue('pet');
      if (roomState.petStatus === 'dead') {
        setPetAction('revive');
      } else {
        setPetAction('feed');
      }
      return;
    }
    const itemResponses = {
      computer: ['💻', 'Góc làm việc đã sẵn sàng. Chạm lại để chỉnh bố cục.'],
      desk: ['✨', 'Chiếc bàn đang là tâm điểm của căn phòng.'],
      chair: ['🪑', 'Góc ngồi trông khá thoải mái đấy.'],
      window: ['🌤️', 'Ánh sáng từ cửa sổ làm căn phòng có chiều sâu hơn.'],
      plant: ['🌿', 'Một chút màu xanh khiến không gian dễ thở hơn.'],
      lamp: ['💡', 'Ánh sáng điểm đang tạo bầu không khí rất đẹp.'],
      clock: ['⏱️', 'Chiếc đồng hồ đang giữ nhịp cho căn phòng.'],
      poster: ['🖼️', 'Bức tường giờ có cá tính riêng.'],
      rug: ['🫧', 'Tấm thảm giúp bố cục ấm và liền mạch hơn.'],
      shelf: ['📚', 'Kệ đồ tạo thêm nhiều lớp cho không gian.'],
    };
    const [emoji, message] = itemResponses[slot] || ['✨', 'Bạn có thể kéo, phóng to hoặc lật món đồ này.'];
    setReaction(emoji);
    setAssistantMessage(message);
    announce(message);
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
      if (data.story) setStory(data.story);
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
  const liveStory = useMemo(
    () => withLocalStoryProgress(story, { ...roomState, lastCleanedAt }),
    [story, roomState, lastCleanedAt]
  );
  const activeStoryMeta = liveStory?.activeChapter ? chapterMeta(liveStory.activeChapter.chapter) : null;
  const tourWeatherMeta = tourWeather ? describeCondition(tourWeather.condition, tourWeather.isDay) : null;
  const storyReady = Boolean(
    liveStory?.activeChapter?.requirements?.length
    && liveStory.activeChapter.requirements.every((requirement) => requirement.complete)
  );

  const itemsByType = useMemo(() => {
    const m = {};
    if (storeData?.store) {
      for (const [id, def] of Object.entries(storeData.store)) {
        (m[def.type] ||= []).push({ id, ...def });
      }
    }
    return m;
  }, [storeData]);

  const isOwned = useCallback((id) => {
    if (!id) return false;
    const definition = storeData?.store?.[id];
    return !definition || definition.price === 0 || storeData?.unlockedItems?.includes(id);
  }, [storeData]);

  const applyAssistantRequest = useCallback((rawRequest) => {
    const request = rawRequest.trim().toLocaleLowerCase('vi');
    if (!request) return;

    setAssistantThinking(true);
    setAssistantMessage('Mây đang nhìn bố cục và ánh sáng trong phòng…');
    window.clearTimeout(assistantTimerRef.current);
    assistantTimerRef.current = window.setTimeout(() => {
      let reply = '';
      let cue = 'success';

      if (request.includes('nhiệm vụ') || request.includes('cốt truyện') || request.includes('chương')) {
        setStoryOpen(true);
        const remaining = liveStory?.activeChapter?.requirements?.filter((requirement) => !requirement.complete) || [];
        reply = liveStory?.completed
          ? 'Bạn đã hoàn tất câu chuyện chính của phòng 27. Giờ căn phòng thuộc hoàn toàn về bạn.'
          : remaining.length
            ? `Chương “${activeStoryMeta?.title}” còn ${remaining.length} việc. Mình đã mở bảng nhiệm vụ để bạn xem.`
            : 'Mọi nhiệm vụ của chương đã xong. Hãy khép lại chương để nhận phần thưởng.';
        cue = 'open';
      } else if (request.includes('nhạc') || request.includes('music') || request.includes('âm thanh')) {
        if (!audioEnabled) toggleAudio();
        reply = audioEnabled
          ? 'Nhạc đang phát rồi. Bạn có thể đổi chất nhạc ở nút âm thanh phía trên.'
          : 'Đã bật nhạc nền nhẹ. Mình giữ âm lượng thấp để không lấn át trải nghiệm.';
        cue = 'open';
      } else if (request.includes('ấm') || request.includes('cozy') || request.includes('thư giãn')) {
        setRoomState((previous) => ({
          ...previous,
          wallColor: isOwned('wall_pink') ? 'wall_pink' : previous.wallColor,
          items: {
            ...previous.items,
            ...(isOwned('lamp_floor') ? { lamp: 'lamp_floor' } : {}),
            ...(isOwned('rug_round') ? { rug: 'rug_round' } : {}),
            ...(isOwned('plant_monstera') ? { plant: 'plant_monstera' } : {}),
          },
        }));
        reply = isOwned('wall_pink')
          ? 'Mình đã phối nền ấm và thêm các lớp ánh sáng, thảm, cây mà bạn đang sở hữu.'
          : 'Mình đã tận dụng những món bạn sở hữu. Mở khóa thêm tường pastel để hiệu ứng ấm rõ hơn.';
      } else if (request.includes('đêm') || request.includes('tối') || request.includes('midnight')) {
        setRoomState((previous) => ({
          ...previous,
          wallColor: isOwned('wall_dark') ? 'wall_dark' : previous.wallColor,
          items: {
            ...previous.items,
            ...(isOwned('window_night') ? { window: 'window_night' } : {}),
            ...(isOwned('lamp_neon') ? { lamp: 'lamp_neon' } : {}),
          },
        }));
        if (isOwned('wall_dark')) setSoundtrack('night');
        reply = 'Mình đã hạ ánh sáng và ưu tiên các món có sắc độ đêm mà bạn sở hữu.';
      } else if (request.includes('sáng') || request.includes('ban ngày')) {
        setRoomState((previous) => ({
          ...previous,
          wallColor: 'wall_white',
          items: {
            ...previous.items,
            ...(isOwned('window_day') ? { window: 'window_day' } : {}),
          },
        }));
        reply = 'Đã chuyển về nền sáng, thoáng và giữ độ tương phản để nội thất nổi rõ.';
      } else if (request.includes('tối giản') || request.includes('dọn gọn')) {
        setRoomState((previous) => ({
          ...previous,
          items: {
            ...previous.items,
            poster: null,
            rug: null,
            plant: null,
            lamp: null,
            shelf: null,
            clock: null,
          },
        }));
        reply = 'Đã giữ lại bộ nội thất thiết yếu. Mọi món đã mua vẫn nằm nguyên trong kho.';
      } else if (request.includes('dọn') || request.includes('rác')) {
        reply = 'Chạm trực tiếp vào túi rác trong phòng để quét. Mỗi lần dọn xong bạn còn nhận thêm JOY.';
        cue = 'sweep';
      } else {
        reply = `Mình hiểu bạn muốn “${rawRequest.trim()}”. Hãy chọn một nhóm nội thất bên phải; món đã sở hữu dùng ngay, món khóa sẽ hiện giá rõ ràng.`;
        cue = 'select';
      }

      setAssistantThinking(false);
      setAssistantMessage(reply);
      announce(reply, cue);
    }, 420);
  }, [activeStoryMeta?.title, announce, audioEnabled, isOwned, liveStory, setSoundtrack, toggleAudio]);

  const submitAssistant = (event) => {
    event?.preventDefault();
    const request = assistantInput;
    if (!request.trim() || assistantThinking) return;
    setAssistantInput('');
    applyAssistantRequest(request);
  };

  const focusStoryRequirement = (requirementId) => {
    const categoryByRequirement = {
      wall: 'wall',
      green: 'plant',
      cozy50: 'rug',
      poster: 'poster',
      lamp: 'lamp',
      pet: 'pet',
      night: 'window',
      cozy70: 'all',
      daily_cozy: 'all',
    };
    if (requirementId === 'public' || requirementId === 'daily_public') {
      handleEnabledChange(true);
      announce('Phòng 27 đã được bật trưng bày trên Bio.', 'success');
      return;
    }
    const category = categoryByRequirement[requirementId];
    if (category) setStoreFilter(category);
    setStoryOpen(false);
    announce(
      requirementId === 'clean' || requirementId === 'daily_clean' ? 'Hãy chạm vào các đống rác cho đến khi phòng còn tối đa 2 đống.'
        : requirementId === 'daily_pet' ? 'Hãy chạm vào thú cưng trong phòng và chọn cho ăn.'
        : requirementId === 'move' ? 'Giữ và kéo một món đồ đến vị trí mới.'
          : 'Mình đã mở đúng nhóm nội thất cho nhiệm vụ này.',
      'select'
    );
  };

  const claimStoryChapter = async () => {
    const chapter = liveStory?.activeChapter;
    if (!chapter || !storyReady || claimingStory) return;
    if (saveStatus !== 'saved') {
      announce('Đợi căn phòng lưu xong rồi nhận phần thưởng nhé.', 'select');
      return;
    }

    setClaimingStory(true);
    try {
      const response = await fetch(`${API}/deco/story/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapter: chapter.chapter }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.story) setStory(data.story);
        throw new Error(data.error || 'Chưa thể hoàn thành chương.');
      }

      const finishedMeta = chapterMeta(chapter.chapter);
      setStory(data.story);
      setStoreData((previous) => ({
        ...previous,
        balance: data.balance ?? previous.balance,
        unlockedItems: data.unlockedItems || previous.unlockedItems,
      }));
      onBioUpdate?.({ joyBalance: data.balance });
      setStoryReveal({
        chapter: chapter.chapter,
        title: finishedMeta.title,
        reward: data.reward || finishedMeta.reward,
        unlocked: finishedMeta.unlockLabels,
        completed: Boolean(data.story?.completed),
      });
      playCue('purchase');
    } catch (error) {
      showToast?.(error.message, 'error');
    } finally {
      setClaimingStory(false);
    }
  };

  const claimDailyRoomReward = async () => {
    if (!liveStory?.daily?.ready || liveStory.daily.claimedToday || claimingDaily) return;
    if (saveStatus !== 'saved') {
      announce('Đợi căn phòng đồng bộ xong rồi nhận 50 JOY nhé.', 'select');
      return;
    }

    setClaimingDaily(true);
    try {
      const response = await fetch(`${API}/deco/story/daily-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.story) setStory(data.story);
        throw new Error(data.error || 'Chưa thể nhận thưởng hôm nay.');
      }
      setStory(data.story);
      setStoreData((previous) => ({ ...previous, balance: data.balance ?? previous.balance }));
      onBioUpdate?.({ joyBalance: data.balance });
      setStoryReveal({
        type: 'daily',
        title: 'Nhịp sống phòng 27',
        reward: 50,
        unlocked: [`Chuỗi duy trì ${data.story?.daily?.streak || 1} ngày`],
      });
      playCue('purchase');
    } catch (error) {
      showToast?.(error.message, 'error');
    } finally {
      setClaimingDaily(false);
    }
  };

  const talkToNpc = (npcId) => {
    const npc = DECO_NPCS.find((entry) => entry.id === npcId);
    if (!npc) return;
    const nextRequirement = liveStory?.activeChapter?.requirements?.find((requirement) => !requirement.complete);
    const conversations = {
      may: liveStory?.completed
        ? {
            message: liveStory.daily?.claimedToday
              ? `Phòng 27 đã hoàn thành nhịp sống hôm nay. Chuỗi của chúng ta đang là ${liveStory.daily?.streak || 0} ngày.`
              : `Hôm nay còn ${liveStory.daily?.requirements?.filter((item) => !item.complete).length || 0} việc để giữ ánh đèn phòng 27 và nhận 50 JOY.`,
            action: 'story',
            actionLabel: 'Xem nhịp sống',
          }
        : {
            message: nextRequirement
              ? `Để đi tiếp chương “${activeStoryMeta?.title}”, việc gần nhất là: ${nextRequirement.label}.`
              : 'Mọi dấu vết đã khớp. Cậu có thể khép lại chương này ngay bây giờ.',
            action: 'story',
            actionLabel: 'Mở nhiệm vụ',
          },
      kai: {
        message: nextRequirement
          ? 'Tôi đã đánh dấu đúng kệ đồ có thể giúp cậu hoàn thành nhiệm vụ. Vật phẩm cốt truyện được mở miễn phí theo chương.'
          : 'Kho vẫn mở. Hãy chọn món khiến căn phòng kể đúng câu chuyện của cậu.',
        action: 'shop',
        actionLabel: 'Đến kệ gợi ý',
      },
      an: {
        message: 'Ngoài hành lang có những căn phòng đang sáng đèn. Vé chỉ mua một lần với 10 JOY; chủ phòng nhận toàn bộ tiền vé.',
        action: 'neighborhood',
        actionLabel: 'Ra khu phố',
      },
      pet: roomState.items.pet
        ? {
            message: roomState.petStatus === 'dead'
              ? 'Bắp đang rất yếu. Hãy giúp người bạn nhỏ trở lại căn phòng.'
              : 'Bắp nghiêng đầu nhìn chiếc bát rồi dụi vào chân bạn. Có vẻ đã đến giờ chăm sóc.',
            action: 'pet',
            actionLabel: roomState.petStatus === 'dead' ? 'Chăm sóc Bắp' : 'Cho Bắp ăn',
          }
        : {
            message: 'Bạn nghe tiếng chân nhỏ ngoài cửa. Câu chuyện này sẽ xuất hiện khi phòng 27 đủ ấm để đón một người bạn.',
            action: 'story',
            actionLabel: 'Xem cốt truyện',
          },
    };
    setActiveNpc({ ...npc, ...conversations[npcId] });
    playCue(npcId === 'pet' ? 'pet' : 'open');
  };

  const runNpcAction = () => {
    if (!activeNpc) return;
    if (activeNpc.action === 'story') {
      setStoryOpen(true);
    } else if (activeNpc.action === 'neighborhood') {
      setActiveTab('neighborhood');
    } else if (activeNpc.action === 'pet') {
      setPetAction(roomState.petStatus === 'dead' ? 'revive' : 'feed');
    } else if (activeNpc.action === 'shop') {
      const requirementId = liveStory?.activeChapter?.requirements?.find((requirement) => !requirement.complete)?.id;
      focusStoryRequirement(requirementId || 'cozy70');
    }
    setActiveNpc(null);
  };

  if (loading || !storeData) {
    return <DecoStudioSkeleton />;
  }

  const sub = getSubscriptionInfo();
  const isLocked = sub.status !== 'active';

  return (
    <div className="deco-os animate-fadeIn">
      <header className="deco-os__header">
        <div className="deco-os__topbar">
          <div className="deco-os__brand">
            <button
              onClick={onBack}
              className="deco-os__icon-button"
              aria-label="Quay lại thư viện"
            >
              <span className="material-symbols-outlined text-[19px]">arrow_back</span>
            </button>
            <div className="deco-os__title">
              <strong>HugoRoom Studio</strong>
              <small>
                {activeTab === 'my_room' ? (
                  <>
                    <span className="deco-save-dot" data-state={saveStatus} />
                    {saveStatus === 'saving' ? 'Đang đồng bộ thiết kế' : saveStatus === 'error' ? 'Chưa lưu được thay đổi' : 'Mọi thay đổi đã được lưu'}
                  </>
                ) : 'Khám phá không gian của cộng đồng'}
              </small>
            </div>
          </div>

          <div className="deco-os__actions">
            <button
              onClick={handleShareRoom}
              title="Chia sẻ phòng"
              className="deco-os__icon-button"
            >
              <span className="material-symbols-outlined text-[18px]">ios_share</span>
            </button>
            <button
              onClick={() => {
                setSoundPanelOpen((open) => !open);
                playCue('open');
              }}
              title={audioEnabled ? 'Nhạc đang phát' : 'Bật không gian âm thanh'}
              className="deco-os__icon-button"
            >
              <span className="material-symbols-outlined text-[19px]">{audioEnabled ? 'graphic_eq' : 'volume_off'}</span>
            </button>
            <div className="deco-wallet" aria-label={`${storeData.balance} JOY`}>
              <JoyCoinBadge size="sm" />
            </div>

            <AnimatePresence>
              {soundPanelOpen && (
                <motion.div
                  className="deco-sound-panel"
                  initial={{ opacity: 0, y: -6, scale: .97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: .97 }}
                >
                  <div className="deco-sound-panel__title">
                    <span>Không gian âm thanh</span>
                    <button type="button" onClick={toggleAudio} className="text-[9px] text-violet-300">
                      {audioEnabled ? 'Tắt nhạc' : 'Bật nhạc'}
                    </button>
                  </div>
                  {DECO_SOUNDTRACKS.map((track) => (
                    <button
                      type="button"
                      key={track.id}
                      className="deco-track"
                      data-active={audioEnabled && soundtrack === track.id}
                      onClick={() => {
                        setSoundtrack(track.id);
                        announce(`Đang phát ${track.label}.`, 'open');
                      }}
                    >
                      <span className="material-symbols-outlined">album</span>
                      <span className="flex-1">
                        <strong>{track.label}</strong>
                        <small>{track.detail}</small>
                      </span>
                      <span className="deco-wave" data-playing={audioEnabled && soundtrack === track.id}>
                        <i /><i /><i /><i />
                      </span>
                    </button>
                  ))}
                  <button type="button" onClick={handleInstallPWA} className="deco-track mt-1">
                    <span className="material-symbols-outlined">install_mobile</span>
                    <span>
                      <strong>Cài HugoRoom</strong>
                      <small>Mở nhanh như một ứng dụng riêng</small>
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <nav className="deco-os__tabs" aria-label="Điều hướng HugoRoom">
          <button 
            onClick={() => setActiveTab('my_room')}
            className="deco-os__tab"
            data-active={activeTab === 'my_room'}
          >
            <span className="material-symbols-outlined text-[16px]">room_preferences</span>
            Studio của tôi
          </button>
          <button 
            onClick={() => setActiveTab('neighborhood')}
            className="deco-os__tab"
            data-active={activeTab === 'neighborhood'}
          >
            <span className="material-symbols-outlined text-[16px]">holiday_village</span>
            Khu phố sáng tạo
          </button>
        </nav>
      </header>

      <main className="deco-os__scroll" data-layout={!isLocked && activeTab === 'my_room' ? 'studio' : 'feed'}>
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
            <section className="deco-stage">
              <DecoRoomScene 
                room={roomState} 
                interactive 
                lastCleanedAt={lastCleanedAt}
                onCleanSuccess={(newBalance, nextTrashCount, nextStory) => {
                  setStoreData(prev => ({ ...prev, balance: newBalance }));
                  setRoomState(prev => ({ ...prev, trashCount: nextTrashCount }));
                  setLastCleanedAt(new Date().toISOString());
                  if (nextStory) setStory(nextStory);
                  onBioUpdate?.({ 
                    joyBalance: newBalance, 
                    decoRoom: { 
                      ...(bio?.decoRoom || {}), 
                      trashCount: nextTrashCount 
                    } 
                  });
                }}
                onItemClick={onSceneItemClick} 
                onPositionChange={(slot, pos) => {
                  setRoomState(p => ({ ...p, positions: { ...(p.positions || {}), [slot]: pos } }));
                  playCue('place');
                }}
                onSound={playCue}
              />

              <div className="deco-stage__live">Live room</div>
              <button
                type="button"
                className="deco-story-trigger"
                onClick={() => {
                  setStoryOpen((open) => !open);
                  playCue('open');
                }}
                style={{ '--story-accent': activeStoryMeta?.accent || '#63b8ff' }}
              >
                <span className="material-symbols-outlined">auto_stories</span>
                <span>
                  <small>{liveStory?.completed ? `Chuỗi ${liveStory?.daily?.streak || 0} ngày · 50 JOY/ngày` : `Chương ${liveStory?.activeChapter?.chapter || 1}/${liveStory?.totalChapters || 5}`}</small>
                  <strong>{liveStory?.completed ? 'Nhịp sống phòng 27' : activeStoryMeta?.title || 'Phòng 27'}</strong>
                </span>
              </button>
              <div className="deco-stage__hint">Kéo đồ · Chạm để chỉnh</div>

              <AnimatePresence>
                {storyOpen && liveStory && (
                  <motion.aside
                    className="deco-story-panel"
                    style={{ '--story-accent': activeStoryMeta?.accent || '#63b8ff' }}
                    initial={{ opacity: 0, x: -16, scale: .97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -12, scale: .98 }}
                    aria-label="Cốt truyện HugoRoom"
                  >
                    <div className="deco-story-panel__head">
                      <div>
                        <small>{liveStory.completed ? 'HugoRoom · Ngoại truyện' : activeStoryMeta?.kicker}</small>
                        <strong>{liveStory.completed ? 'Người giữ ánh sáng' : activeStoryMeta?.title}</strong>
                      </div>
                      <button type="button" onClick={() => setStoryOpen(false)} aria-label="Đóng cốt truyện">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    {liveStory.completed ? (
                      <>
                        <div className="deco-story-ending deco-story-ending--daily">
                          <span className="material-symbols-outlined">routine</span>
                          <p>Chiến dịch chính đã hoàn tất. Từ bây giờ, hãy duy trì nhịp sống của phòng 27 mỗi ngày.</p>
                          <b>Chuỗi hiện tại · {liveStory.daily?.streak || 0} ngày</b>
                        </div>
                        <div className="deco-story-objectives">
                          <div className="deco-story-objectives__title">
                            <span>Nhịp sống hôm nay</span>
                            <b>+50 JOY</b>
                          </div>
                          {liveStory.daily?.requirements?.map((requirement) => (
                            <button
                              type="button"
                              key={requirement.id}
                              data-complete={requirement.complete}
                              onClick={() => !requirement.complete && focusStoryRequirement(requirement.id)}
                            >
                              <span className="material-symbols-outlined">
                                {requirement.complete ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              <span>{requirement.label}</span>
                              {!requirement.complete && <span className="material-symbols-outlined">chevron_right</span>}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="deco-story-claim"
                          disabled={!liveStory.daily?.ready || liveStory.daily?.claimedToday || claimingDaily || saveStatus !== 'saved'}
                          onClick={claimDailyRoomReward}
                        >
                          {claimingDaily ? 'Đang xác nhận…'
                            : liveStory.daily?.claimedToday ? 'Đã nhận 50 JOY hôm nay'
                              : liveStory.daily?.ready ? 'Nhận 50 JOY hôm nay' : 'Hoàn thành nhịp sống'}
                          <span className="material-symbols-outlined">
                            {liveStory.daily?.claimedToday ? 'check' : 'redeem'}
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="deco-story-panel__scene">{activeStoryMeta?.scene}</div>
                        <p className="deco-story-panel__summary">{activeStoryMeta?.summary}</p>
                        <blockquote>
                          {activeStoryMeta?.dialogue}
                          <cite>— {activeStoryMeta?.narrator}</cite>
                        </blockquote>

                        <div className="deco-story-objectives">
                          <div className="deco-story-objectives__title">
                            <span>Nhiệm vụ chương</span>
                            <b>
                              {liveStory.activeChapter.requirements.filter((requirement) => requirement.complete).length}/
                              {liveStory.activeChapter.requirements.length}
                            </b>
                          </div>
                          {liveStory.activeChapter.requirements.map((requirement) => (
                            <button
                              type="button"
                              key={requirement.id}
                              data-complete={requirement.complete}
                              onClick={() => !requirement.complete && focusStoryRequirement(requirement.id)}
                            >
                              <span className="material-symbols-outlined">
                                {requirement.complete ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              <span>{requirement.label}</span>
                              {!requirement.complete && <span className="material-symbols-outlined">chevron_right</span>}
                            </button>
                          ))}
                        </div>

                        <div className="deco-story-reward">
                          <span className="material-symbols-outlined">redeem</span>
                          <span>
                            <small>Phần thưởng chương</small>
                            <strong>+{activeStoryMeta?.reward} JOY · {activeStoryMeta?.unlockLabels.join(', ')}</strong>
                          </span>
                        </div>

                        <button
                          type="button"
                          className="deco-story-claim"
                          disabled={!storyReady || claimingStory || saveStatus !== 'saved'}
                          onClick={claimStoryChapter}
                        >
                          {claimingStory ? 'Đang xác nhận…'
                            : storyReady
                              ? saveStatus === 'saved' ? 'Khép lại chương này' : 'Đang lưu căn phòng…'
                              : 'Hoàn thành các nhiệm vụ'}
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </>
                    )}
                  </motion.aside>
                )}
              </AnimatePresence>

              <div className="deco-npc-dock" aria-label="Nhân vật trong phòng 27">
                {DECO_NPCS.map((npc) => (
                  <button
                    type="button"
                    key={npc.id}
                    data-active={activeNpc?.id === npc.id}
                    onClick={() => talkToNpc(npc.id)}
                    title={`${npc.name} · ${npc.role}`}
                  >
                    <span>{npc.avatar}</span>
                    <small>{npc.name}</small>
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {activeNpc && (
                  <motion.div
                    className="deco-npc-dialogue"
                    initial={{ opacity: 0, y: 8, scale: .97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: .98 }}
                  >
                    <div className="deco-npc-dialogue__avatar">{activeNpc.avatar}</div>
                    <div>
                      <small>{activeNpc.role}</small>
                      <strong>{activeNpc.name}</strong>
                      <p>{activeNpc.message}</p>
                      <button type="button" onClick={runNpcAction}>
                        {activeNpc.actionLabel}
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    </div>
                    <button type="button" onClick={() => setActiveNpc(null)} aria-label="Đóng hội thoại">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {reaction && (
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-3xl pointer-events-none animate-bounce">{reaction}</div>
              )}

              <AnimatePresence>
                {assistantToast && (
                  <motion.div
                    className="deco-assistant-toast"
                    initial={{ opacity: 0, y: -9, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -7, x: '-50%' }}
                  >
                    <span className="material-symbols-outlined text-[16px] text-violet-300">auto_awesome</span>
                    <span className="truncate">{assistantToast}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {assistantOpen && (
                  <motion.aside
                    className="deco-assistant"
                    initial={{ opacity: 0, y: 14, scale: .96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: .97 }}
                    aria-label="Mây, trợ lý trang trí phòng"
                  >
                    <div className="deco-assistant__head">
                      <div className="deco-assistant__identity">
                        <div className="deco-assistant__avatar">
                          <span className="material-symbols-outlined text-[19px]">auto_awesome</span>
                        </div>
                        <span>
                          <strong>Mây · Room Stylist</strong>
                          <small>{assistantThinking ? 'Đang phối không gian…' : 'Sẵn sàng trò chuyện'}</small>
                        </span>
                      </div>
                      <button type="button" onClick={() => setAssistantOpen(false)} className="deco-os__icon-button !w-8 !h-8 !rounded-[10px]">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                    <div className="deco-assistant__message">
                      {assistantThinking ? 'Đang quan sát ánh sáng, màu tường và các món bạn đã sở hữu…' : assistantMessage}
                    </div>
                    <div className="deco-assistant__quick">
                      {['Nhiệm vụ hiện tại', 'Ấm cúng hơn', 'Chế độ đêm', 'Bật nhạc'].map((command) => (
                        <button type="button" key={command} onClick={() => applyAssistantRequest(command)}>{command}</button>
                      ))}
                    </div>
                    <form className="deco-assistant__composer" onSubmit={submitAssistant}>
                      <input
                        value={assistantInput}
                        onChange={(event) => setAssistantInput(event.target.value)}
                        placeholder="Ví dụ: Làm phòng sáng và thoáng hơn"
                        aria-label="Yêu cầu Mây trang trí phòng"
                      />
                      <button type="submit" disabled={assistantThinking} aria-label="Gửi yêu cầu">
                        <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                      </button>
                    </form>
                  </motion.aside>
                )}
              </AnimatePresence>

              <button
                type="button"
                className="deco-assistant-button"
                onClick={() => {
                  setAssistantOpen((open) => !open);
                  playCue('open');
                }}
                aria-label="Mở trợ lý trang trí Mây"
              >
                <span className="material-symbols-outlined">{assistantOpen ? 'close' : 'auto_awesome'}</span>
              </button>
            </section>

            {/* ── Room Control & Info Bar ─────────────────────────────────────────── */}
            <section className="deco-room-info">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="deco-stat">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                  <span>{getSubscriptionInfo().text}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="deco-stat">
                  <span className="material-symbols-outlined text-[16px] text-pink-300">favorite</span>
                  <span>Ấm cúng <b>{cozy}%</b></span>
                </div>
                <div className="deco-stat">
                  <span className="material-symbols-outlined text-[16px] text-violet-300">{night ? 'dark_mode' : 'light_mode'}</span>
                  <span>{night ? 'Ban đêm' : 'Ban ngày'}</span>
                </div>
              </div>
            </section>

            {/* ── Compact category chip bar ─────────────────────────────────────── */}
            <nav className="deco-categories" aria-label="Danh mục nội thất">
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
                  onClick={() => {
                    setStoreFilter(c.id);
                    playCue('select');
                  }}
                  className="deco-category"
                  data-active={storeFilter === c.id}
                >
                  <span className="material-symbols-outlined text-[13px]">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </nav>

            {/* ── Cửa hàng nội thất — unified marketplace ───────────────────────── */}
            <div className="deco-marketplace">
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
                          className={`${cardW} deco-item-card flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border border-dashed transition-all ${roomState.items[sec.id] == null ? 'text-violet-300' : 'text-zinc-400 hover:text-violet-300'}`}>
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
                          else setItem(sec.id, id, name);
                          if (sec.kind !== 'item') announce(`${name} đã được áp dụng.`, 'place');
                        };
                        const buyDef = sec.kind === 'wall' ? { type: 'wallColor', price, name }
                          : sec.kind === 'floor' ? { type: 'floorStyle', price, name }
                          : en;
                        const Art = sec.kind === 'item' ? DECO_ART[id] : null;
                        return (
                          <div key={id}
                            onClick={() => isOwned && !isEquipped && equip()}
                            className={`${cardW} deco-item-card relative flex flex-col p-2 rounded-2xl border transition-all duration-200 ${isOwned && !isEquipped ? 'hover:-translate-y-0.5 cursor-pointer' : ''}`}
                            data-equipped={isEquipped}
                          >
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
                            <div className="text-[10px] font-bold text-white/85 line-clamp-2 leading-tight min-h-[26px]">{name}</div>
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
          <div className="deco-neighborhood">
            <section className="deco-neighborhood__hero">
              <div>
                <small>Khu phố sáng tạo · Bán kính 50 km</small>
                <h3>Ghé một căn phòng.<br />Gặp một câu chuyện.</h3>
                <p>Mỗi vé tham quan có giá 10 JOY và chỉ mua một lần. Chủ phòng nhận toàn bộ tiền vé.</p>
              </div>
              <div className="deco-neighborhood__passport">
                <span className="material-symbols-outlined">confirmation_number</span>
                <strong>{visitedRooms.length}</strong>
                <small>phòng đã mở</small>
              </div>
            </section>

            {loadingNeighbors ? (
              <div className="deco-neighborhood__grid">
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="deco-neighbor-card deco-neighbor-card--loading">
                      <div className="deco-neighbor-card__preview animate-pulse" />
                      <div className="deco-neighbor-card__footer animate-pulse" />
                   </div>
                 ))}
              </div>
            ) : neighbors.length === 0 ? (
              <div className="deco-neighborhood__empty">
                <span className="material-symbols-outlined">holiday_village</span>
                <strong>Hành lang vẫn đang yên tĩnh</strong>
                <p>Chưa có phòng công khai nào gần bạn. Hãy bật trưng bày phòng 27 để mở ngọn đèn đầu tiên.</p>
                <button type="button" onClick={() => setActiveTab('my_room')}>Trở về phòng của tôi</button>
              </div>
            ) : (
              <div className="deco-neighborhood__grid">
                {neighbors.map(neighbor => {
                  const hasTicket = neighbor.hasAccess || visitedRooms.includes(neighbor.slug);
                  return (
                    <article key={neighbor.slug} className="deco-neighbor-card" data-locked={!hasTicket}>
                      <div className="deco-neighbor-card__preview">
                        {hasTicket && neighbor.decoRoom ? (
                          <DecoRoomScene room={neighbor.decoRoom} zoom={0.4} />
                        ) : (
                          <div className="deco-neighbor-teaser" data-night={neighbor.teaser?.night}>
                            <span className="deco-neighbor-teaser__door">
                              <i />
                              <b>27</b>
                            </span>
                            <span className="deco-neighbor-teaser__light" />
                            <span className="material-symbols-outlined deco-neighbor-teaser__lock">lock</span>
                          </div>
                        )}
                        <span className="deco-neighbor-card__mood">
                          <span className="material-symbols-outlined">{neighbor.teaser?.night ? 'dark_mode' : 'light_mode'}</span>
                          {neighbor.teaser?.coziness || 0}% ấm cúng
                        </span>
                      </div>

                      <div className="deco-neighbor-card__footer">
                        <div className="deco-neighbor-card__identity">
                          <img src={neighbor.avatarUrl || '/image/avt-default.png'} alt="" />
                          <div>
                            <strong>{neighbor.displayName}</strong>
                            <small>@{neighbor.slug}</small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="deco-neighbor-card__enter"
                          data-owned={hasTicket}
                          disabled={buyingTicketSlug === neighbor.slug}
                          onClick={() => enterNeighborRoom(neighbor)}
                        >
                          <span className="material-symbols-outlined">{hasTicket ? 'door_open' : 'confirmation_number'}</span>
                          {buyingTicketSlug === neighbor.slug ? 'Đang mở…' : hasTicket ? 'Vào phòng' : '10 JOY'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {touringNeighbor?.decoRoom && (
          <motion.div
            className="deco-tour"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="deco-tour__room">
              <DecoRoomScene room={touringNeighbor.decoRoom} onSound={playCue} />
              <div className="deco-tour__shade" />
            </div>

            <header className="deco-tour__header">
              <button type="button" onClick={() => setTouringNeighbor(null)} aria-label="Rời căn phòng">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="deco-tour__owner">
                <img src={touringNeighbor.avatarUrl || '/image/avt-default.png'} alt="" />
                <span>
                  <small>Bạn đang ở phòng của</small>
                  <strong>{touringNeighbor.displayName}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => window.open(`/bio/${touringNeighbor.slug}`, '_blank', 'noopener,noreferrer')}
                aria-label="Xem Bio của chủ phòng"
              >
                <span className="material-symbols-outlined">person</span>
              </button>
            </header>

            <div className="deco-tour__context">
              <div>
                <span className="material-symbols-outlined">location_on</span>
                <span>
                  <small>Đang sống tại</small>
                  <strong>{touringNeighbor.environment?.area || 'Khu vực lân cận'}</strong>
                </span>
              </div>
              <div>
                <span className="material-symbols-outlined">{tourWeatherMeta?.icon || 'device_thermostat'}</span>
                <span>
                  <small>Thời tiết bên ngoài</small>
                  <strong>{tourWeather ? `${tourWeather.tempC}°C · ${tourWeatherMeta?.label}` : 'Đang cập nhật…'}</strong>
                </span>
              </div>
              <p>
                Căn phòng đã đi qua {touringNeighbor.decoRoom?.story?.claimedChapters?.length || 0}/5 chương
                {tourWeatherMeta ? ` · ${tourWeatherMeta.label} đang trở thành bối cảnh thật ngoài cửa sổ.` : '.'}
              </p>
            </div>

            <aside className="deco-tour__social">
              <div className="deco-tour__welcome">
                <span className="material-symbols-outlined">waving_hand</span>
                <span>
                  <small>Vé đã được xác nhận</small>
                  <strong>Chào mừng đến không gian của {touringNeighbor.displayName}</strong>
                </span>
              </div>

              <button type="button" className="deco-tour__knock" onClick={knockNeighborDoor} disabled={isKnocking}>
                <span className="material-symbols-outlined">doorbell</span>
                {isKnocking ? 'Đang gõ…' : 'Gõ cửa'}
              </button>

              <div className="deco-tour__bonus">
                <div>
                  <small>Gửi bonus cho chủ phòng</small>
                  <strong>Một lời cảm ơn bằng JOY</strong>
                </div>
                <div className="deco-tour__amounts">
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      type="button"
                      key={amount}
                      data-active={tipAmount === amount}
                      onClick={() => setTipAmount(amount)}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="deco-tour__send"
                  onClick={sendNeighborBonus}
                  disabled={isTipping || storeData.balance < tipAmount}
                >
                  <JoyCoinBadge hideAmount size="sm" />
                  {isTipping ? 'Đang gửi…' : `Gửi ${tipAmount} JOY`}
                </button>
                <small className="deco-tour__balance">Số dư của bạn: {storeData.balance.toLocaleString("vi-VN")} JOY</small>
              </div>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {storyReveal && (
          <motion.div
            className="deco-story-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="deco-story-reveal__card"
              initial={{ opacity: 0, y: 26, scale: .94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            >
              <span className="deco-story-reveal__halo" />
              <span className="material-symbols-outlined deco-story-reveal__icon">
                {storyReveal.type === 'daily' ? 'routine' : storyReveal.completed ? 'hotel_class' : 'auto_stories'}
              </span>
              <small>{storyReveal.type === 'daily' ? 'Nhịp sống hôm nay hoàn tất' : storyReveal.completed ? 'Chiến dịch hoàn tất' : `Chương ${storyReveal.chapter} hoàn thành`}</small>
              <h3>{storyReveal.title}</h3>
              <p>+{storyReveal.reward} JOY</p>
              <div>
                {storyReveal.unlocked.map((label) => (
                  <span key={label}><span className="material-symbols-outlined">lock_open</span>{label}</span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setStoryReveal(null);
                  setStoryOpen(true);
                }}
              >
                {storyReveal.type === 'daily' ? 'Tiếp tục sống trong phòng 27' : storyReveal.completed ? 'Trở lại căn phòng 27' : 'Mở chương tiếp theo'}
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Buy confirm modal ──────────────────────────────────────────────── */}
      {buyTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setBuyTarget(null)}>
          <div className="bg-card rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-border text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 mx-auto mb-3">{DECO_ART[buyTarget.id] && React.createElement(DECO_ART[buyTarget.id])}</div>
            <p className="text-sm font-black text-foreground">{buyTarget.def.name}</p>
            {storeData.balance < buyTarget.def.price ? (
              <p className="mt-2 text-xs font-semibold text-rose-500">Không đủ JOY (cần {buyTarget.def.price.toLocaleString("vi-VN")}, bạn có {storeData.balance.toLocaleString("vi-VN")}).</p>
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
                  <p className="mt-2 text-xs font-semibold text-rose-500">Không đủ JOY để hồi sinh (bạn có {storeData.balance.toLocaleString("vi-VN")}).</p>
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
                <span className="font-bold">{storeData.balance.toLocaleString("vi-VN")} JOY</span>
              </div>
              {storeData.balance < showInvoice.total ? (
                <p className="text-rose-500 font-bold mt-1 text-[9px] uppercase">🚨 Không đủ JOY để thanh toán</p>
              ) : (
                <div className="flex justify-between mt-1 text-[9px] text-success font-bold">
                  <span>SỐ DƯ SAU THUÊ:</span>
                  <span>{(storeData.balance - showInvoice.total).toLocaleString("vi-VN")} JOY</span>
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
