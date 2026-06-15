import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bot, Users, Link2, Clock, Trophy,
  Crown, ChevronRight, Swords, Hash, Shield,
  Timer, RefreshCw, Circle,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────
const TIME_CONTROLS = [
  { label: "1'",  value: 60,   tag: "Bullet" },
  { label: "3'",  value: 180,  tag: "Blitz" },
  { label: "5'",  value: 300,  tag: "Blitz" },
  { label: "10'", value: 600,  tag: "Rapid" },
  { label: "15'", value: 900,  tag: "Rapid" },
  { label: "30'", value: 1800, tag: "Classical" },
];

const MODES = [
  { id: "bot",    Icon: Bot,   title: "Đấu với Bot",      desc: "Luyện tập cùng Stockfish AI" },
  { id: "random", Icon: Users, title: "Đấu ngẫu nhiên",  desc: "Ghép đối thủ tự động theo ELO" },
  { id: "friend", Icon: Link2, title: "Tạo phòng riêng", desc: "Chia sẻ link mời bạn bè" },
];

const COLOR_OPTS = [
  { v: "white",  sym: "♔", label: "Trắng",      sub: "Đi trước" },
  { v: "random", sym: "⚡", label: "Ngẫu nhiên", sub: "May mắn" },
  { v: "black",  sym: "♚", label: "Đen",        sub: "Đi sau" },
];

function tier(r) {
  if (r >= 2000) return { label: "Master",   cls: "bg-muted text-foreground border-border" };
  if (r >= 1600) return { label: "Expert",   cls: "bg-muted text-foreground border-border" };
  if (r >= 1400) return { label: "Advanced", cls: "bg-muted text-foreground border-border" };
  if (r >= 1200) return { label: "Inter",    cls: "bg-muted text-foreground border-border" };
  return               { label: "Beginner",  cls: "bg-muted text-muted-foreground border-border" };
}

// ── Leaderboard with real-time polling ────────────────────────────────────────
function Leaderboard({ active }) {
  const [lb, setLb]           = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastAt,  setLastAt]  = useState(null);
  const [spinning, setSpinning] = useState(false);
  const intervalRef = useRef(null);

  const fetchLb = useCallback(async (manual = false) => {
    if (manual) setSpinning(true);
    try {
      const r = await fetch("/api/chess/leaderboard?limit=30");
      if (!r.ok) return;
      const d = await r.json();
      setLb(d.leaderboard || []);
      setLastAt(new Date());
    } catch (_) {}
    finally { setLoading(false); if (manual) setTimeout(() => setSpinning(false), 600); }
  }, []);

  // Poll every 8 s while tab is active
  useEffect(() => {
    if (!active) { clearInterval(intervalRef.current); return; }
    fetchLb();
    intervalRef.current = setInterval(fetchLb, 8000);
    return () => clearInterval(intervalRef.current);
  }, [active, fetchLb]);

  // Refresh on tab visibility restore
  useEffect(() => {
    if (!active) return;
    const onVisible = () => { if (!document.hidden) fetchLb(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, fetchLb]);

  const fmtTime = (d) => {
    if (!d) return null;
    const s = Math.floor((Date.now() - d.getTime()) / 1000);
    if (s < 5) return "vừa xong";
    if (s < 60) return `${s}s trước`;
    return `${Math.floor(s/60)}m trước`;
  };

  if (loading) return (
    <div className="py-16 flex justify-center">
      <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground/70 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Live bar */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/30 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground/60" />
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live</span>
          {lastAt && (
            <span className="text-[10px] text-muted-foreground/60">· cập nhật {fmtTime(lastAt)}</span>
          )}
        </div>
        <button
          onClick={() => fetchLb(true)}
          disabled={spinning}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Làm mới"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${spinning ? "animate-spin" : ""}`} />
        </button>
      </div>

      {lb.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm bg-card border border-border rounded-2xl">
          Chưa có người chơi nào
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {lb.map((p, i) => {
            const t = tier(p.rating);
            return (
              <div
                key={p.email || i}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
              >
                {/* Rank */}
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {i === 0
                    ? <Crown className="w-3.5 h-3.5 text-foreground" />
                    : <span className="text-[11px] font-black text-muted-foreground">{i + 1}</span>
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{p.displayName || "Ẩn danh"}</p>
                  <p className="text-[11px] text-muted-foreground font-mono leading-tight">
                    {p.gamesPlayed}V · {p.wins}T {p.losses}B {p.draws}H
                  </p>
                </div>
                {/* Rating + tier */}
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="font-black text-base leading-none text-foreground font-mono">{p.rating}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${t.cls}`}>
                    {t.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChessLobby({ onStartGame, onJoinRoom, userInfo }) {
  const navigate = useNavigate();
  const [step,   setStep]   = useState("home");   // home | config
  const [mode,   setMode]   = useState(null);
  const [tc,     setTc]     = useState(300);
  const [botLv,  setBotLv]  = useState(3);
  const [color,  setColor]  = useState("random");
  const [code,   setCode]   = useState("");
  const [tab,    setTab]    = useState("play");

  const selectedTc   = TIME_CONTROLS.find(t => t.value === tc);
  const selectedMode = MODES.find(m => m.id === mode);

  function selectMode(m) { setMode(m); setStep("config"); }
  function goBack()       { setStep("home"); setMode(null); }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-20 h-14 flex items-center border-b border-border bg-background/90 backdrop-blur-xl px-4">
        <div className="max-w-2xl mx-auto w-full flex items-center gap-3">
          <button
            onClick={step !== "home" ? goBack : () => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center shrink-0">
              <Swords className="w-4 h-4 text-background" />
            </div>
            <span className="font-display font-black text-base tracking-tight truncate">
              HugoChess
              {step === "config" && selectedMode && (
                <span className="font-normal text-muted-foreground"> / {selectedMode.title}</span>
              )}
            </span>
          </div>

          {/* Tab switcher — only on home */}
          {step === "home" && (
            <div className="flex gap-0.5 p-1 bg-muted rounded-xl shrink-0">
              {[{ id: "play", label: "Chơi" }, { id: "rank", label: "BXH" }].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tab === t.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-12">

        {/* ══ HOME — PLAY ════════════════════════════════════════════════════════ */}
        {step === "home" && tab === "play" && (
          <div className="pt-5 space-y-5 animate-fade-in">

            {/* Hero */}
            <div className="relative rounded-3xl overflow-hidden border border-border bg-card p-6">
              {/* Chess piece watermark */}
              <span className="pointer-events-none select-none absolute -right-3 -top-3 text-[120px] leading-none text-foreground/[0.04]">♛</span>
              <span className="pointer-events-none select-none absolute -left-4 -bottom-6 text-[100px] leading-none text-foreground/[0.03]">♞</span>

              <div className="relative space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Cờ vua trực tuyến</p>
                <h1 className="font-display font-black text-3xl text-foreground leading-tight">
                  Sẵn sàng<br />thách đấu?
                </h1>
                <p className="text-sm text-muted-foreground">
                  Chơi với AI hoặc ghép cặp với người thật theo ELO
                </p>
              </div>

              {/* User mini-card inline */}
              {userInfo && (
                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-base shrink-0 select-none">
                    ♟
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{userInfo.displayName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{userInfo.rating || 1200} ELO</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                    {tier(userInfo.rating || 1200).label}
                  </span>
                </div>
              )}
            </div>

            {/* Mode cards */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Chế độ chơi</p>
              {MODES.map(({ id, Icon, title, desc }) => (
                <button
                  key={id}
                  onClick={() => selectMode(id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                    <Icon className="w-4.5 h-4.5 text-foreground" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-border group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>

            {/* Join by code */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Hash className="w-3 h-3" strokeWidth={2.5} /> Nhập mã phòng
              </p>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  placeholder="ABCD12"
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all text-foreground"
                />
                <button
                  onClick={() => code.length === 6 && onJoinRoom(code)}
                  disabled={code.length !== 6}
                  className="px-5 py-2.5 rounded-xl bg-foreground hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed text-background text-sm font-bold transition-all"
                >
                  Vào
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ HOME — LEADERBOARD ══════════════════════════════════════════════════ */}
        {step === "home" && tab === "rank" && (
          <div className="pt-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 px-0.5">
              <Trophy className="w-4 h-4 text-foreground" strokeWidth={1.75} />
              <span className="font-display font-black text-base text-foreground">Bảng xếp hạng</span>
            </div>
            <Leaderboard active={tab === "rank"} />
          </div>
        )}

        {/* ══ CONFIG ═════════════════════════════════════════════════════════════ */}
        {step === "config" && mode && (
          <div className="pt-5 space-y-4 animate-fade-in">

            {/* Time control */}
            <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" strokeWidth={2.5} /> Thời gian mỗi bên
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_CONTROLS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTc(t.value)}
                    className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                      tc === t.value
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/30"
                    }`}
                  >
                    <span className="font-display font-black text-lg leading-tight">{t.label}</span>
                    <span className={`text-[9px] font-bold mt-0.5 ${tc === t.value ? "text-background/70" : "text-muted-foreground"}`}>
                      {t.tag}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Bot level */}
            {mode === "bot" && (
              <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Shield className="w-3 h-3" strokeWidth={2.5} /> Độ khó
                  </p>
                  <span className="text-xs font-black text-foreground font-mono">Lv {botLv} / 8</span>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {[1,2,3,4,5,6,7,8].map(lv => (
                    <button
                      key={lv}
                      onClick={() => setBotLv(lv)}
                      className={`aspect-square rounded-xl border-2 text-sm font-black transition-all ${
                        botLv === lv
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      }`}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Dễ nhất</span><span>Khó nhất</span>
                </div>
              </section>
            )}

            {/* Color pick */}
            {(mode === "bot" || mode === "friend") && (
              <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Màu quân</p>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTS.map(c => (
                    <button
                      key={c.v}
                      onClick={() => setColor(c.v)}
                      className={`py-4 px-2 rounded-xl border-2 text-center transition-all ${
                        color === c.v
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground hover:border-foreground/30"
                      }`}
                    >
                      <div className={`text-2xl mb-1 leading-none ${color === c.v ? "opacity-100" : "opacity-60"}`}>
                        {c.sym}
                      </div>
                      <div className={`text-[10px] font-bold ${color === c.v ? "text-background" : "text-foreground"}`}>
                        {c.label}
                      </div>
                      <div className={`text-[9px] mt-0.5 ${color === c.v ? "text-background/70" : "text-muted-foreground"}`}>
                        {c.sub}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Summary */}
            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">Cài đặt:</span>
              <span className="flex items-center gap-1 bg-background border border-border px-2 py-1 rounded-full text-xs font-semibold text-foreground">
                <Timer className="w-3 h-3 text-muted-foreground" /> {selectedTc?.label} · {selectedTc?.tag}
              </span>
              {mode === "bot" && (
                <span className="flex items-center gap-1 bg-background border border-border px-2 py-1 rounded-full text-xs font-semibold text-foreground">
                  <Bot className="w-3 h-3 text-muted-foreground" /> Stockfish Lv{botLv}
                </span>
              )}
              {(mode === "bot" || mode === "friend") && (
                <span className="bg-background border border-border px-2 py-1 rounded-full text-xs font-semibold text-foreground">
                  {color === "white" ? "♔ Trắng" : color === "black" ? "♚ Đen" : "⚡ Ngẫu nhiên"}
                </span>
              )}
            </div>

            {/* CTA */}
            <button
              onClick={() => onStartGame({ mode, timeControl: tc, botLevel: botLv, color })}
              className="w-full py-4 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-display font-black text-base transition-all active:scale-[0.98]"
            >
              {mode === "bot" ? "Bắt đầu đấu" : mode === "random" ? "Tìm đối thủ" : "Tạo phòng"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
