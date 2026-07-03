import React, { useState } from 'react';
import { DecoRoomScene, cozinessScore, isNightRoom } from '../member/deco/decoAssets';
import { isMemberAuthenticated } from '../../services/authSession';

const API = import.meta.env.VITE_API_URL || '/api';
const TIP_PRESETS = [10, 20, 50, 100];

// Public-facing dorm room shown on a member's Bio. Visitors can knock (public)
// and tip JOY (requires login). Renders the exact same DecoRoomScene the owner
// designed in DecoStudioTab, so what you build is what guests see.
export default function BioDecoRoom({ bio, showToast }) {
  const [knocking, setKnocking] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(50);
  const [tipping, setTipping] = useState(false);
  const isVisitor = isMemberAuthenticated();

  const [visitedRooms, setVisitedRooms] = useState([]);
  const [visitorEmail, setVisitorEmail] = useState(null);
  const [loadingVisit, setLoadingVisit] = useState(true);
  const [buyingTicket, setBuyingTicket] = useState(false);

  React.useEffect(() => {
    if (isVisitor) {
      fetch(`${API}/deco/store`)
        .then(res => res.json())
        .then(data => {
          setVisitedRooms(data.visitedRooms || []);
          setVisitorEmail(data.email || null);
        })
        .catch(() => {})
        .finally(() => setLoadingVisit(false));
    } else {
      setLoadingVisit(false);
    }
  }, [isVisitor]);

  if (!bio?.decoRoom?.enabled) return null;
  const room = bio.decoRoom;
  const cozy = cozinessScore(room.items || {});
  const night = isNightRoom(room.items || {});

  const isLocked = isVisitor && visitorEmail !== bio.email && !visitedRooms.includes(bio.slug);

  const handleKnock = async () => {
    if (knocking) return;
    setKnocking(true);
    try {
      await fetch(`${API}/deco/knock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSlug: bio.slug }),
      });
      showToast?.('Cốc cốc! Chủ phòng đã nghe thấy bạn 👋', 'success');
    } catch {
      showToast?.('Gõ cửa thất bại', 'error');
    } finally {
      setTimeout(() => setKnocking(false), 5000);
    }
  };

  const handleBuyTicket = async () => {
    if (buyingTicket) return;
    setBuyingTicket(true);
    try {
      const res = await fetch(`${API}/deco/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSlug: bio.slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast?.('Đã mua vé tham quan thành công! Chào mừng bạn 🔑', 'success');
      setVisitedRooms(data.visitedRooms || []);
    } catch (err) {
      showToast?.(err.message || 'Lỗi mua vé', 'error');
    } finally {
      setBuyingTicket(false);
    }
  };

  const openTip = () => {
    if (!isVisitor) { showToast?.('Đăng nhập Hugo Studio để thả Tip JOY nhé!', 'error'); return; }
    if (isLocked) { showToast?.('Vui lòng mua vé vào phòng trước khi thả Tip.', 'warning'); return; }
    setTipOpen(true);
  };

  const sendTip = async () => {
    const amount = Number(tipAmount);
    if (!Number.isInteger(amount) || amount < 10 || amount > 100) { 
      showToast?.('Số tiền Tip (bonus) phải nằm trong khoảng từ 10 - 100 JOY', 'error'); 
      return; 
    }
    setTipping(true);
    try {
      const res = await fetch(`${API}/deco/tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetSlug: bio.slug, amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast?.(`Đã tip ${amount} JOY cho ${bio.displayName}! Cảm ơn bạn 💛`, 'success');
      setTipOpen(false);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setTipping(false);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-black/5 mt-6 mb-6">
      <div className="relative w-full h-[260px] md:h-[320px] bg-zinc-100 dark:bg-zinc-900">
        <DecoRoomScene room={room} interactive={!isLocked} lastCleanedAt={room.lastCleanedAt} className={isLocked ? "blur-md pointer-events-none" : ""} />

        {/* Room title */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-bold tracking-widest uppercase border border-white/10 z-40">
          Ký Túc Xá {bio.displayName}
        </div>

        {/* Coziness + day/night badge */}
        {!isLocked && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-40">
            <span className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/10">
              <span className="material-symbols-outlined text-[12px]">favorite</span>{cozy}%
            </span>
            <span className="px-2 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1 border border-white/10">
              <span className="material-symbols-outlined text-[12px]">{night ? 'dark_mode' : 'light_mode'}</span>
            </span>
          </div>
        )}

        {isLocked ? (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-35 gap-3">
            <span className="material-symbols-outlined text-4xl text-zinc-300 animate-bounce">lock</span>
            <div>
              <p className="text-white text-sm font-black tracking-wide">Phòng đang đóng cửa 🔑</p>
              <p className="text-white/80 text-[11px] font-medium mt-1">Vé vào cửa: 10 JOY (Chuyển thẳng cho chủ phòng)</p>
            </div>
            {isVisitor ? (
              <button 
                onClick={handleBuyTicket} 
                disabled={buyingTicket}
                className="mt-1 px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 text-xs font-black rounded-xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                {buyingTicket ? 'Đang mở khóa...' : 'Mua vé & Ghé thăm (10 JOY)'}
              </button>
            ) : (
              <div className="mt-1 text-[10px] text-yellow-300 font-bold">Đăng nhập để mua vé & tham quan phòng</div>
            )}
          </div>
        ) : (
          /* Visitor controls */
          <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-40">
            <button onClick={handleKnock} disabled={knocking}
              className={`flex items-center justify-center w-11 h-11 rounded-full shadow-xl bg-white text-zinc-800 transition-all ${knocking ? 'opacity-50 scale-95' : 'hover:scale-110 active:scale-95'}`}
              title="Gõ cửa">
              <span className="material-symbols-outlined text-[20px]">front_hand</span>
            </button>
            <button onClick={openTip}
              className="flex items-center justify-center w-11 h-11 rounded-full shadow-xl bg-yellow-400 text-yellow-900 transition-all hover:scale-110 active:scale-95 hover:bg-yellow-300"
              title="Thả Tip JOY">
              <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
            </button>
          </div>
        )}
      </div>

      {/* Tip modal */}
      {tipOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setTipOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-xs shadow-2xl border border-zinc-200 dark:border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 text-center">Thả Tip cho {bio.displayName} 💛</p>
            <p className="text-xs text-zinc-500 text-center mt-1">Cảm ơn chủ phòng vì căn phòng xinh xắn!</p>
            <div className="grid grid-cols-4 gap-2 mt-4">
              {TIP_PRESETS.map((v) => (
                <button key={v} onClick={() => setTipAmount(v)}
                  className={`py-2 rounded-xl text-xs font-black border-2 transition-all ${Number(tipAmount) === v ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                  {v}
                </button>
              ))}
            </div>
            <input type="number" min="10" value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="mt-3 w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm font-bold text-center text-zinc-800 dark:text-zinc-100 outline-none" />
            <div className="mt-4 flex gap-2">
              <button onClick={() => setTipOpen(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold">Huỷ</button>
              <button onClick={sendTip} disabled={tipping}
                className="flex-1 py-2.5 rounded-xl bg-yellow-400 text-yellow-950 text-xs font-black disabled:opacity-50">
                {tipping ? 'Đang gửi…' : `Tip ${tipAmount} JOY`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
