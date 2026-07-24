import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bot, Users, Link2, Hash, Zap, Flame, Timer,
  Swords, Crown, ChevronRight, Shuffle, Sparkles, Trophy
} from "lucide-react";

const TIME_CONTROLS = [
  { label: "3 Phút", value: 180, tag: "Blitz", Icon: Flame },
  { label: "5 Phút", value: 300, tag: "Blitz", Icon: Flame },
  { label: "10 Phút", value: 600, tag: "Rapid", Icon: Timer },
];

const MODES = [
  { id: "bot", Icon: Bot, title: "Hugo AI Master (ELO 2500)", desc: "Luyện tập cùng AI Stockfish 4 Cấp Độ", kicker: "Chế Độ Phổ Biến", color: "from-purple-500/20 to-indigo-950/40 border-purple-500/30" },
  { id: "random", Icon: Swords, title: "Đấu Ngẫu Nhiên PvP", desc: "Ghép đối thủ trực tuyến theo trình độ ELO", kicker: "X2 JOY Thắng", color: "from-amber-500/20 to-orange-950/40 border-amber-500/30" },
  { id: "friend", Icon: Link2, title: "Tạo Phòng Mời Bạn Bè", desc: "Tạo liên kết phòng đấu riêng tư tức thì", kicker: "PvP Riêng Tư", color: "from-cyan-500/20 to-blue-950/40 border-cyan-500/30" },
  { id: "join", Icon: Hash, title: "Nhập Mã Vào Phòng", desc: "Tham gia bàn cờ bằng mã phòng 6 ký tự", kicker: "Vào Nhanh", color: "from-emerald-500/20 to-teal-950/40 border-emerald-500/30" },
];

const BOT_LEVELS = [
  { id: 1, label: "Tập Sự", elo: "~600", reward: "+30 JOY" },
  { id: 2, label: "Chiến Thuật", elo: "~1200", reward: "+50 JOY" },
  { id: 3, label: "Cao Thủ", elo: "~1800", reward: "+100 JOY" },
  { id: 4, label: "Đại Sư ELO 2500", elo: "2500+", reward: "+200 JOY" },
];

const COLOR_OPTS = [
  { v: "white", label: "Quân Trắng", sym: "♔", sub: "Đi trước" },
  { v: "random", label: "Ngẫu Nhiên", sym: "🎲", sub: "May rủi" },
  { v: "black", label: "Quân Đen", sym: "♚", sub: "Đi sau" },
];

function ratingTier(r) {
  if (r >= 2200) return { label: "Đại Sư ELO", color: "#facc15" };
  if (r >= 1800) return { label: "Cao Thủ", color: "#c084fc" };
  if (r >= 1600) return { label: "Kỳ Thủ Nâng Cao", color: "#60a5fa" };
  if (r >= 1500) return { label: "Trung Cấp", color: "#34d399" };
  return { label: "Tập Sự", color: "#94a3b8" };
}

export default function ChessLobby({
  onStartGame, onJoinRoom, userInfo,
  boardTheme, myPieceTheme, oppPieceTheme,
  embedded = false, onBack,
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState("home");
  const [mode, setMode] = useState(null);
  const [tc, setTc] = useState(300);
  const [botLv, setBotLv] = useState(2);
  const [color, setColor] = useState("random");
  const [code, setCode] = useState("");

  function goBack() { setStep("home"); setMode(null); }
  function selectMode(m) { setMode(m); setStep("config"); }

  const tier = ratingTier(userInfo?.rating ?? 1500);

  // ── CONFIG SCREEN ───────────────────────────────────────────────────
  if (step === "config" && mode) {
    return (
      <div className="chess-app-shell text-white bg-[#0a0a0f] min-h-screen">
        <header className="sticky top-0 z-20 flex items-center px-4 py-4 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-2xl">
          <div className="w-full max-w-md mx-auto flex items-center justify-between">
            <button onClick={goBack} className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors active:scale-95">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <span className="font-black text-sm tracking-wide text-white uppercase font-sans">
              {MODES.find(m2 => m2.id === mode)?.title}
            </span>
            <div className="w-12" />
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-6 space-y-5">
          {mode === "join" ? (
            <div className="p-6 rounded-3xl bg-[#141522]/90 border border-white/15 backdrop-blur-2xl text-center space-y-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Hash className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-black text-lg text-white">Nhập Mã Phòng 6 Ký Tự</h2>
                <p className="text-xs text-zinc-400 mt-1">Nhập mã phòng đấu riêng tư do bạn bè gửi cho bạn</p>
              </div>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                onKeyDown={e => e.key === "Enter" && code.length === 6 && onJoinRoom(code)}
                placeholder="ABCD12"
                className="w-full bg-[#0a0a0f] border border-white/20 rounded-2xl px-4 py-4 text-center text-3xl font-mono font-black tracking-[0.3em] placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 text-white transition-all shadow-inner"
              />
              <button
                onClick={() => code.length === 6 && onJoinRoom(code)}
                disabled={code.length !== 6}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg"
              >
                Vào Bàn Đấu Nhanh
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Time Control */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2 px-1">THỜI GIAN MỖI BÊN</span>
                <div className="grid grid-cols-3 gap-2.5">
                  {TIME_CONTROLS.map(t => {
                    const sel = tc === t.value;
                    const TIcon = t.Icon;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setTc(t.value)}
                        className={`flex flex-col items-center py-3.5 rounded-2xl border transition-all active:scale-95 ${
                          sel ? "border-amber-400 bg-amber-500/20 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "border-white/10 bg-[#141522]/80 text-zinc-300 hover:border-white/30"
                        }`}
                      >
                        <TIcon className={`w-4 h-4 mb-1 ${sel ? "text-amber-400" : "text-zinc-500"}`} />
                        <span className="font-black text-sm leading-none">{t.label}</span>
                        <span className="text-[9px] font-bold mt-1 text-zinc-400">{t.tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bot Level Selector */}
              {mode === "bot" && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2 px-1">CẤP ĐỘ HUGO AI</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {BOT_LEVELS.map(b => {
                      const sel = botLv === b.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => setBotLv(b.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 ${
                            sel ? "border-purple-400 bg-purple-500/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]" : "border-white/10 bg-[#141522]/80 text-zinc-300 hover:border-white/30"
                          }`}
                        >
                          <span className="text-xs font-black block text-white">{b.label}</span>
                          <span className="text-[10px] font-mono font-bold text-purple-300 block mt-0.5">ELO {b.elo}</span>
                          <span className="text-[9px] font-bold text-amber-400 block mt-1">{b.reward}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {(mode === "bot" || mode === "friend") && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2 px-1">MÀU QUÂN CỦA BẠN</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {COLOR_OPTS.map(c => {
                      const sel = color === c.v;
                      return (
                        <button
                          key={c.v}
                          onClick={() => setColor(c.v)}
                          className={`flex flex-col items-center py-3.5 rounded-2xl border transition-all active:scale-95 ${
                            sel ? "border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_20px_rgba(6,182,212,0.2)]" : "border-white/10 bg-[#141522]/80 text-zinc-300 hover:border-white/30"
                          }`}
                        >
                          <span className="text-2xl mb-1">{c.sym}</span>
                          <span className="text-[11px] font-black">{c.label}</span>
                          <span className="text-[9px] text-zinc-400 mt-0.5">{c.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA Start Game */}
              <button
                onClick={() => onStartGame({ mode, timeControl: tc, botLevel: botLv, color, boardTheme, myPieceTheme, oppPieceTheme })}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-[0_10px_30px_rgba(168,85,247,0.3)] mt-2"
              >
                {mode === "bot" ? "BẮT ĐẦU ĐẤU AI" : mode === "random" ? "GHÉP ĐỐI THỦ TỰ ĐỘNG" : "TẠO PHÒNG & MỜI BẠN BÈ"}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── HOME SCREEN ─────────────────────────────────────────────────────
  return (
    <div className="chess-app-shell text-white bg-[#0a0a0f] min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex items-center px-4 py-4 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-2xl">
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          {embedded ? (
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors active:scale-95">
              <ArrowLeft className="w-4 h-4" /> HugoArcade
            </button>
          ) : (
            <button onClick={() => navigate("/member/utilities")} className="p-1 rounded-lg text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xl">♟</span>
            <span className="font-black text-base tracking-tight font-sans bg-gradient-to-r from-white via-zinc-200 to-amber-300 bg-clip-text text-transparent">
              HugoChess AI 2500
            </span>
          </div>

          {userInfo ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono font-black text-xs">{(userInfo.rating ?? 1500).toLocaleString()}</span>
            </div>
          ) : <div className="w-12" />}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Apple Glass Hero Spotlight Banner */}
        <div className="relative rounded-[32px] overflow-hidden border border-white/15 bg-gradient-to-b from-[#1c1d2e]/90 via-[#141522]/90 to-[#0a0a0f]/90 p-6 shadow-2xl backdrop-blur-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-amber-400 to-cyan-400" />

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full inline-block mb-2">
                Apple Arcade Chess Engine
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
                Đỉnh Cao Trí Tuệ<br />
                <span className="bg-gradient-to-r from-purple-400 to-cyan-300 bg-clip-text text-transparent">Thách Đấu ELO 2500</span>
              </h1>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-4xl shadow-inner flex-shrink-0">
              ♚
            </div>
          </div>

          {/* User Profile Bar */}
          {userInfo && (
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-300 text-sm">
                  {(userInfo.displayName?.[0] || "?").toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black text-white truncate max-w-[140px]">{userInfo.displayName}</p>
                  <p className="text-[10px] font-bold" style={{ color: tier.color }}>{tier.label}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Xếp Hạng ELO</span>
                <span className="text-sm font-black text-amber-400 font-mono">{(userInfo.rating ?? 1500).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Apple Arcade Mode Cards */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1 block">CHỌN CHẾ ĐỘ CHƠI</span>
          {MODES.map((m) => {
            const MIcon = m.Icon;
            return (
              <motion.button
                key={m.id}
                whileHover={{ scale: 1.015, x: 3 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => selectMode(m.id)}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between bg-gradient-to-r ${m.color} backdrop-blur-xl transition-all shadow-lg group`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white flex-shrink-0">
                    <MIcon className="w-5.5 h-5.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white truncate font-sans">{m.title}</h3>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/20">
                        {m.kicker}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5 font-medium">{m.desc}</p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors flex-shrink-0 ml-2" />
              </motion.button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
