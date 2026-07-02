import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Bot, Users, Link2, Hash, Clock,
  Shield, Zap, Flame, Timer, Swords, Crown,
  ChevronRight, Shuffle,
} from "lucide-react";

const TIME_CONTROLS = [
  { label: "1'",  value: 60,   tag: "Bullet",    Icon: Zap },
  { label: "3'",  value: 180,  tag: "Blitz",     Icon: Flame },
  { label: "5'",  value: 300,  tag: "Blitz",     Icon: Flame },
  { label: "10'", value: 600,  tag: "Rapid",     Icon: Timer },
  { label: "15'", value: 900,  tag: "Rapid",     Icon: Timer },
  { label: "30'", value: 1800, tag: "Classical",  Icon: Shield },
];

const MODES = [
  { id: "bot",    Icon: Bot,   title: "Đấu với Bot",       desc: "Luyện tập cùng Stockfish AI" },
  { id: "random", Icon: Users, title: "Đấu ngẫu nhiên",   desc: "Ghép đối thủ tự động theo ELO" },
  { id: "friend", Icon: Link2, title: "Tạo phòng riêng",  desc: "Tạo link mời & chia sẻ với bạn" },
  { id: "join",   Icon: Hash,  title: "Vào phòng bằng mã", desc: "Nhập mã 6 ký tự từ bạn bè" },
];

const BOT_LEVELS = [
  { id: 1, label: "Mới chơi",   elo: "~600",   reward: "+50 JOY" },
  { id: 2, label: "Cơ bản",     elo: "~1000",  reward: "+75 JOY" },
  { id: 3, label: "Nâng cao",   elo: "~1500",  reward: "+100 JOY" },
  { id: 4, label: "Trùm cuối",  elo: "2800+",  reward: "+200 JOY" },
];

const COLOR_OPTS = [
  { v: "white",  label: "Trắng",      sym: "♔", sub: "Đi trước" },
  { v: "random", label: "Ngẫu nhiên", sym: null, sub: "May rủi" },
  { v: "black",  label: "Đen",        sub: "Đi sau",  sym: "♚" },
];

function ratingTier(r) {
  if (r >= 2200) return { label: "Master",   color: "#facc15" };
  if (r >= 1800) return { label: "Expert",   color: "#a78bfa" };
  if (r >= 1600) return { label: "Advanced", color: "#60a5fa" };
  if (r >= 1500) return { label: "Inter",    color: "#34d399" };
  return               { label: "Beginner",  color: "#94a3b8" };
}

// ── Sub-components ─────────────────────────────────────────────────
function TimeGrid({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TIME_CONTROLS.map(t => {
        const sel = value === t.value;
        const TIcon = t.Icon;
        return (
          <button key={t.value} onClick={() => onChange(t.value)}
            className={`relative flex flex-col items-center py-3.5 rounded-2xl border-2 transition-all active:scale-95 select-none ${
              sel ? "border-foreground bg-foreground text-background shadow-lg" : "border-border bg-card text-foreground hover:border-foreground/40"
            }`}
          >
            <TIcon className={`w-4 h-4 mb-1.5 ${sel ? "text-background" : "text-muted-foreground"}`} strokeWidth={2} />
            <span className="font-black text-base leading-none">{t.label}</span>
            <span className={`text-[9px] font-bold mt-1 ${sel ? "text-background/60" : "text-muted-foreground"}`}>{t.tag}</span>
          </button>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p className="text-[9px] font-black uppercase tracking-[.18em] text-muted-foreground px-0.5 mb-2">{children}</p>
  );
}

// ── Main ───────────────────────────────────────────────────────────
export default function ChessLobby({
  onStartGame, onJoinRoom, userInfo,
  boardTheme, myPieceTheme, oppPieceTheme,
  embedded = false,
  onBack,
}) {
  const navigate = useNavigate();
  const [step,  setStep]  = useState("home");
  const [mode,  setMode]  = useState(null);
  const [tc,    setTc]    = useState(300);
  const [botLv, setBotLv] = useState(2);
  const [color, setColor] = useState("random");
  const [code,  setCode]  = useState("");

  function goBack()       { setStep("home"); setMode(null); }
  function selectMode(m)  { setMode(m); setStep("config"); }

  const tier = ratingTier(userInfo?.rating ?? 1500);

  // ── CONFIG SCREEN ─────────────────────────────────────────────────
  if (step === "config" && mode) {
    return (
      <div className="chess-app-shell text-foreground">
        <header className="chess-app-header sticky top-0 z-20 flex items-center px-4 pb-4 pt-[calc(max(16px,env(safe-area-inset-top))+8px)] border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="w-full flex items-center justify-between gap-3">
            <button onClick={goBack} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors active:scale-95">
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại
            </button>
            <span className="font-black text-base absolute left-1/2 -translate-x-1/2">
              {MODES.find(m2 => m2.id === mode)?.title}
            </span>
            <div className="w-14" />
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 py-5 space-y-4">

          {mode === "join" ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-card border border-border p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <Hash className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-black text-lg">Vào phòng bằng mã</h2>
                  <p className="text-xs text-muted-foreground mt-1">Nhập mã 6 ký tự do bạn bè chia sẻ</p>
                </div>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  onKeyDown={e => e.key === "Enter" && code.length === 6 && onJoinRoom(code)}
                  placeholder="ABCD12"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-center text-2xl font-mono font-black tracking-[.3em] placeholder:text-muted-foreground/25 focus:outline-none focus:border-foreground/50 text-foreground transition-all"
                />
                <button
                  onClick={() => code.length === 6 && onJoinRoom(code)}
                  disabled={code.length !== 6}
                  className="w-full py-3.5 rounded-2xl bg-foreground hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed text-background font-black text-sm transition-all active:scale-[.98]"
                >
                  Vào phòng đấu
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Time control */}
              <div>
                <SectionTitle>Thời gian mỗi bên</SectionTitle>
                <TimeGrid value={tc} onChange={setTc} />
              </div>

              {/* Bot level */}
              {mode === "bot" && (
                <div>
                  <SectionTitle>Độ khó Bot (Stockfish)</SectionTitle>
                  <div className="grid grid-cols-2 gap-2">
                    {BOT_LEVELS.map(b => {
                      const sel = botLv === b.id;
                      return (
                        <button key={b.id} onClick={() => setBotLv(b.id)}
                          className={`flex flex-col p-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                            sel ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:border-foreground/30"
                          }`}
                        >
                          <span className={`text-xs font-black leading-none ${sel ? "" : ""}`}>{b.label}</span>
                          <span className={`text-[9px] mt-1 font-mono font-bold ${sel ? "text-background/60" : "text-muted-foreground"}`}>ELO {b.elo}</span>
                          <span className={`text-[9px] mt-2 font-bold ${sel ? "text-background/50" : "text-muted-foreground/60"}`}>{b.reward}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color */}
              {(mode === "bot" || mode === "friend") && (
                <div>
                  <SectionTitle>Màu quân của bạn</SectionTitle>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_OPTS.map(c => {
                      const sel = color === c.v;
                      return (
                        <button key={c.v} onClick={() => setColor(c.v)}
                          className={`flex flex-col items-center py-4 rounded-2xl border-2 transition-all active:scale-95 ${
                            sel ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {c.sym
                            ? <span className="text-2xl mb-1 leading-none">{c.sym}</span>
                            : <Shuffle className={`w-5 h-5 mb-1 ${sel ? "text-background" : "text-muted-foreground"}`} />
                          }
                          <span className={`text-[10px] font-black ${sel ? "text-background" : ""}`}>{c.label}</span>
                          <span className={`text-[9px] mt-0.5 ${sel ? "text-background/60" : "text-muted-foreground"}`}>{c.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => onStartGame({ mode, timeControl: tc, botLevel: botLv, color, boardTheme, myPieceTheme, oppPieceTheme })}
                className="w-full py-4 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-black text-base transition-all active:scale-[.98] shadow-lg"
              >
                {mode === "bot" ? "Bắt đầu đấu" : mode === "random" ? "Tìm đối thủ" : "Tạo phòng & Mời bạn"}
              </button>

              {/* Summary pill */}
              <p className="text-center text-[10px] text-muted-foreground">
                {TIME_CONTROLS.find(t => t.value === tc)?.label} · {TIME_CONTROLS.find(t => t.value === tc)?.tag}
                {mode === "bot" && ` · Bot ${BOT_LEVELS.find(b => b.id === botLv)?.label}`}
                {(mode === "bot" || mode === "friend") && ` · ${COLOR_OPTS.find(c => c.v === color)?.label}`}
              </p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── HOME SCREEN ───────────────────────────────────────────────────
  return (
    <div className="chess-app-shell text-foreground">
      {/* Header */}
      <header className="chess-app-header sticky top-0 z-20 flex items-center px-4 pb-4 pt-[calc(max(16px,env(safe-area-inset-top))+8px)] border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="w-full flex items-center justify-between gap-3">

          {/* Left: back */}
          {embedded ? (
            <button onClick={onBack}
              className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              HugoArcade
            </button>
          ) : (
            <button onClick={() => navigate("/member/utilities")}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Center: title */}
          <span className="font-black text-base tracking-tight absolute left-1/2 -translate-x-1/2">
            ♟ HugoChess
          </span>

          {/* Right: ELO + tier */}
          {userInfo ? (
            <div className="flex flex-col items-end shrink-0">
              <p className="text-[10px] font-black leading-none" style={{ color: tier.color }}>{(userInfo.rating ?? 1500).toLocaleString()}</p>
              <p className="text-[8px] text-muted-foreground font-bold mt-0.5">{tier.label}</p>
            </div>
          ) : <div className="w-8" />}

        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-5">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden border border-border bg-card p-5">
          {/* Decorative chess symbols */}
          <span className="pointer-events-none select-none absolute -right-3 top-1/2 -translate-y-1/2 text-[120px] leading-none text-foreground/[.04] font-bold">♛</span>
          <span className="pointer-events-none select-none absolute right-12 -bottom-4 text-[80px] leading-none text-foreground/[.03] font-bold">♞</span>

          <div className="relative">
            <p className="text-[9px] font-black uppercase tracking-[.2em] text-primary mb-2">Cờ vua trực tuyến</p>
            <h1 className="font-black text-2xl leading-[1.15] mb-2">
              Sẵn sàng<br />
              <span className="text-primary">thách đấu?</span>
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Đấu AI, ghép đối thủ, hoặc mời bạn bè vào phòng riêng.
            </p>

            {userInfo && (
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2.5">
                  {userInfo.avatarUrl
                    ? <img src={userInfo.avatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
                    : <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center text-sm font-black">{(userInfo.displayName?.[0] || "?").toUpperCase()}</div>
                  }
                  <div>
                    <p className="text-xs font-black leading-tight truncate max-w-[120px]">{userInfo.displayName}</p>
                    <p className="text-[9px] font-bold mt-0.5" style={{ color: tier.color }}>{tier.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <Crown className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                  <span className="font-mono font-black text-sm text-yellow-500">{(userInfo.rating ?? 1500).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick play */}
        <div>
          <SectionTitle>Chơi nhanh</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "1'", sub: "Bullet", tc: 60,  mode: "random", Icon: Zap },
              { label: "5'", sub: "Blitz",  tc: 300, mode: "random", Icon: Flame },
              { label: "Bot", sub: "AI",    tc: 300, mode: "bot",    Icon: Bot },
            ].map(q => (
              <button key={q.label}
                onClick={() => onStartGame({ mode: q.mode, timeControl: q.tc, botLevel: 2, color: "random", boardTheme, myPieceTheme, oppPieceTheme })}
                className="group flex flex-col items-center gap-1 py-4 rounded-2xl bg-card border border-border hover:border-foreground/30 hover:bg-muted/40 active:scale-95 transition-all"
              >
                <q.Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.75} />
                <span className="font-black text-sm mt-1 leading-none">{q.label}</span>
                <span className="text-[9px] text-muted-foreground">{q.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modes */}
        <div>
          <SectionTitle>Chế độ chơi</SectionTitle>
          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {MODES.map(({ id, Icon, title, desc }) => (
              <button key={id} onClick={() => selectMode(id)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-foreground/10 transition-colors">
                  <Icon className="w-4 h-4 text-foreground" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight">{title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-foreground/50 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
