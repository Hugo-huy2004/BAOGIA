import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft, Bot, Users, Link2, Clock, Trophy,
  Crown, ChevronRight, Swords, Hash, Shield,
  Timer, RefreshCw, Circle, Smile, Flame, Shuffle,
  Volume2, VolumeX, Eye, EyeOff, Zap, Settings,
  Check, ChevronDown,
} from "lucide-react";

// ── Sound packs player in Lobby ────────────────────────────────────────────────
let _ctx = null;
function beep(hz, dur, vol = 0.1, shape = "sine", delay = 0) {
  try {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (_ctx.state === "suspended") _ctx.resume();
    const o = _ctx.createOscillator(), g = _ctx.createGain();
    o.type = shape; o.connect(g); g.connect(_ctx.destination);
    const t = _ctx.currentTime + delay;
    o.frequency.setValueAtTime(hz, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.05);
  } catch (_) {}
}
function playFx(type, pack) {
  if (pack === "mute") return;
  if (pack === "synth") {
    if (type === "move")    { beep(440, 0.08, 0.08, "square"); }
    if (type === "capture") { beep(587, 0.06, 0.1, "sawtooth"); beep(880, 0.12, 0.08, "sawtooth", 0.05); }
    if (type === "check")   { beep(987, 0.15, 0.1, "sine"); beep(1318, 0.2, 0.08, "sine", 0.05); }
  } else if (pack === "modern") {
    if (type === "move")    { beep(600, 0.03, 0.12, "sine"); }
    if (type === "capture") { beep(800, 0.04, 0.15, "triangle"); beep(400, 0.04, 0.12, "triangle", 0.02); }
    if (type === "check")   { beep(900, 0.1, 0.1, "square"); }
  } else { // classic
    if (type === "move")    { beep(520, 0.07); beep(380, 0.06, 0.08, "sine", 0.05); }
    if (type === "capture") { beep(200, 0.14, 0.18, "sawtooth"); beep(120, 0.1, 0.1, "sawtooth", 0.1); }
    if (type === "check")   { beep(880, 0.18, 0.09, "square"); }
  }
}

// ── Constants ──────────────────────────────────────────────────────────────────
const TIME_CONTROLS = [
  { label: "1'",  value: 60,   tag: "Bullet",    icon: Zap },
  { label: "3'",  value: 180,  tag: "Blitz",     icon: Flame },
  { label: "5'",  value: 300,  tag: "Blitz",     icon: Flame },
  { label: "10'", value: 600,  tag: "Rapid",     icon: Timer },
  { label: "15'", value: 900,  tag: "Rapid",     icon: Timer },
  { label: "30'", value: 1800, tag: "Classical",  icon: Shield },
];

const MODES = [
  { id: "bot",    Icon: Bot,   title: "Đấu với Bot",       desc: "Luyện tập cùng Stockfish AI" },
  { id: "random", Icon: Users, title: "Đấu ngẫu nhiên",   desc: "Ghép đối thủ tự động theo JOY" },
  { id: "friend", Icon: Link2, title: "Tạo phòng riêng",  desc: "Tạo phòng riêng & chia sẻ link mời" },
  { id: "join",   Icon: Hash,  title: "Vào phòng bằng mã", desc: "Nhập mã phòng từ bạn bè để tham gia" },
];

const COLOR_OPTS = [
  { v: "white",  sym: "♔", label: "Trắng",      sub: "Đi trước" },
  { v: "random", sym: "shuffle", label: "Ngẫu nhiên", sub: "May mắn" },
  { v: "black",  sym: "♚", label: "Đen",        sub: "Đi sau" },
];

function tier(r) {
  if (r >= 2200) return { label: "Master",   cls: "bg-foreground text-background border-foreground" };
  if (r >= 1800) return { label: "Expert",   cls: "bg-foreground/75 text-background border-foreground/75" };
  if (r >= 1600) return { label: "Advanced", cls: "bg-foreground/50 text-background border-foreground/50" };
  if (r >= 1500) return { label: "Inter",    cls: "bg-muted text-foreground border-border" };
  return               { label: "Beginner",  cls: "bg-muted text-muted-foreground border-border" };
}

const BOARD_THEMES = [
  { id: "blue",  label: "Classic Blue",      previewLight: "#dde4ff", previewDark: "#4338ca" },
  { id: "green", label: "Green Tournament",  previewLight: "#eeeed2", previewDark: "#769656" },
  { id: "wood",  label: "Warm Wood",         previewLight: "#f0d9b5", previewDark: "#b58863" },
  { id: "dark",  label: "Charcoal Dark",     previewLight: "#e2e4e6", previewDark: "#3b3f43" },
  { id: "pink",  label: "Cute Pink",         previewLight: "#ffe5ec", previewDark: "#ff85a1" },
  { id: "neon",  label: "Cyber Neon",        previewLight: "#93c5fd", previewDark: "#381a5a" },
];

const PIECE_THEMES = [
  { id: "maestro",    label: "Maestro",    desc: "Cổ điển & thanh lịch" },
  { id: "cburnett",   label: "CBurnett",   desc: "Hiện đại, phổ biến nhất" },
  { id: "merida",     label: "Merida",     desc: "Phong cách nghệ thuật" },
  { id: "california", label: "California", desc: "Thời trang & hiện đại" },
];

const BOT_MODES = [
  { id: 1, label: "Mới chơi",  desc: "+50 JOY mỗi thắng",  Icon: Smile, detail: "Dành cho người mới" },
  { id: 2, label: "Basic",     desc: "+75 JOY mỗi thắng",  Icon: Bot,   detail: "Thử thách nhẹ nhàng" },
  { id: 3, label: "Phẫn nộ",  desc: "+100 JOY mỗi thắng",  Icon: Flame, detail: "Bot đủ mạnh" },
  { id: 4, label: "Trùm cuối", desc: "+200 JOY mỗi thắng",  Icon: Crown, detail: "Thử thách tối đa" },
];

const APP_THEMES = [
  { id: "midnight",   label: "Obsidian Tối" },
  { id: "cyber",      label: "Cyberpunk Neon" },
  { id: "forest",     label: "Xanh lục bảo" },
  { id: "paper",      label: "Giấy ấm (Sáng)" },
  { id: "rose",       label: "Pastel Hồng (Sáng)" },
  { id: "minimalist", label: "Tối giản (Sáng)" },
];

const HIGHLIGHT_THEMES = [
  { id: "yellow", label: "Vàng Neon" },
  { id: "green",  label: "Xanh Laser" },
  { id: "blue",   label: "Xanh Dương" },
  { id: "purple", label: "Tím Điện" },
  { id: "red",    label: "Đỏ Thẫm" },
  { id: "none",   label: "Không bóng" },
];

const SOUND_PACKS = [
  { id: "classic",    label: "Gỗ cổ điển" },
  { id: "modern",     label: "Modern Click" },
  { id: "synth",      label: "Sci-Fi Synth" },
  { id: "mute",       label: "Tắt âm" },
];

const BORDER_STYLES = [
  { id: "none", label: "Không viền" },
  { id: "thin", label: "Viền mảnh" },
  { id: "glow", label: "Viền phát sáng" },
];

const SHADOW_STYLES = [
  { id: "none", label: "Không bóng" },
  { id: "soft", label: "Bóng nhẹ" },
  { id: "3d",   label: "Nổi khối 3D" },
];

// ── Piece Preview ─────────────────────────────────────────────────────────────
const PREVIEW_PIECES = [
  { type: "K", label: "Vua" },
  { type: "Q", label: "Hậu" },
  { type: "R", label: "Xe" },
  { type: "B", label: "Tượng" },
  { type: "N", label: "Mã" },
  { type: "P", label: "Tốt" },
];

function PiecePreview({ theme, colorLetter, size = 36 }) {
  const base = `https://lichess1.org/assets/piece/${theme}/`;
  return (
    <div className="flex items-center gap-1.5">
      {PREVIEW_PIECES.map(p => (
        <div
          key={p.type}
          title={p.label}
          style={{
            width: size,
            height: size,
            backgroundImage: `url('${base}${colorLetter}${p.type}.svg')`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
function Leaderboard({ active }) {
  const [lb, setLb]           = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastAt,  setLastAt]  = useState(null);
  const [spinning, setSpinning] = useState(false);
  const intervalRef = useRef(null);

  const fetchLb = useCallback(async (manual = false) => {
    if (manual) setSpinning(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const r = await fetch(`${apiBase}/chess/leaderboard?limit=30`);
      if (!r.ok) return;
      const d = await r.json();
      setLb(d.leaderboard || []);
      setLastAt(new Date());
    } catch (_) {}
    finally { setLoading(false); if (manual) setTimeout(() => setSpinning(false), 600); }
  }, []);

  useEffect(() => {
    if (!active) { clearInterval(intervalRef.current); return; }
    fetchLb();
    intervalRef.current = setInterval(fetchLb, 8000);
    return () => clearInterval(intervalRef.current);
  }, [active, fetchLb]);

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
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/30 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground/60" />
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Live</span>
          {lastAt && <span className="text-[10px] text-muted-foreground/60">· cập nhật {fmtTime(lastAt)}</span>}
        </div>
        <button onClick={() => fetchLb(true)} disabled={spinning}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Làm mới">
          <RefreshCw className={`w-3.5 h-3.5 ${spinning ? "animate-spin" : ""}`} />
        </button>
      </div>

      {lb.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm bg-card border border-border rounded-2xl">Chưa có người chơi nào</div>
      ) : (
        <div className="space-y-4">
          {/* Visual Podium for Top 3 */}
          <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-2 select-none">
            {/* 2nd Place */}
            {lb[1] ? (
              <div className="podium-second rounded-2xl p-3 flex flex-col items-center text-center space-y-2 relative h-36 justify-end animate-fadeIn">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black flex items-center justify-center shadow-sm">2</span>
                <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {lb[1].avatar ? <img src={lb[1].avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(lb[1].displayName ? lb[1].displayName[0].toUpperCase() : "A")}</span>}
                </div>
                <div className="w-full min-w-0">
                  <p className="text-[11px] font-bold text-foreground truncate">{lb[1].displayName || "Ẩn danh"}</p>
                  <p className="text-[11px] font-extrabold text-foreground/80 font-mono mt-0.5">{lb[1].rating}</p>
                </div>
              </div>
            ) : (
              <div className="invisible h-36" />
            )}

            {/* 1st Place */}
            {lb[0] ? (
              <div className="podium-first rounded-2xl p-3.5 flex flex-col items-center text-center space-y-2 relative h-40 justify-end z-10 scale-105 animate-fadeIn">
                <Crown className="w-5 h-5 text-yellow-500 fill-current absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow animate-bounce-gentle" />
                <div className="w-12 h-12 rounded-full border-2 border-yellow-400 overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-md">
                  {lb[0].avatar ? <img src={lb[0].avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{(lb[0].displayName ? lb[0].displayName[0].toUpperCase() : "A")}</span>}
                </div>
                <div className="w-full min-w-0">
                  <p className="text-xs font-black text-foreground truncate">{lb[0].displayName || "Ẩn danh"}</p>
                  <p className="text-xs font-black text-yellow-600 dark:text-yellow-400 font-mono mt-0.5">{lb[0].rating}</p>
                </div>
              </div>
            ) : (
              <div className="invisible h-40" />
            )}

            {/* 3rd Place */}
            {lb[2] ? (
              <div className="podium-third rounded-2xl p-3 flex flex-col items-center text-center space-y-2 relative h-32 justify-end animate-fadeIn">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-orange-200 dark:bg-orange-900 border border-orange-300 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-[10px] font-black flex items-center justify-center shadow-sm">3</span>
                <div className="w-10 h-10 rounded-full border border-orange-200 dark:border-orange-850 overflow-hidden bg-muted flex items-center justify-center shrink-0">
                  {lb[2].avatar ? <img src={lb[2].avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold">{(lb[2].displayName ? lb[2].displayName[0].toUpperCase() : "A")}</span>}
                </div>
                <div className="w-full min-w-0">
                  <p className="text-[11px] font-bold text-foreground truncate">{lb[2].displayName || "Ẩn danh"}</p>
                  <p className="text-[11px] font-extrabold text-foreground/80 font-mono mt-0.5">{lb[2].rating}</p>
                </div>
              </div>
            ) : (
              <div className="invisible h-32" />
            )}
          </div>

          {/* Rest of the ranks */}
          {lb.length > 3 && (
            <div className="chess-glass-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60">
              {lb.slice(3).map((p, i) => {
                const t = tier(p.rating);
                const rank = i + 4;
                return (
                  <div key={p.email || i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors table-row-floating">
                    <div className="w-6 text-center shrink-0">
                      <span className="text-xs font-black text-muted-foreground">{rank}</span>
                    </div>
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden text-[11px] font-bold select-none">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.displayName} className="w-full h-full object-cover" />
                      ) : (
                        (p.displayName ? p.displayName[0].toUpperCase() : "A")
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{p.displayName || "Ẩn danh"}</p>
                      <p className="text-[11px] text-muted-foreground font-mono leading-tight">{p.gamesPlayed}V · {p.wins}T {p.losses}B {p.draws}H</p>
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="font-black text-sm leading-none text-foreground font-mono">{p.rating}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${t.cls}`}>{t.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ChessLobby({
  onStartGame, onJoinRoom, userInfo,
  boardTheme, setBoardTheme,
  myPieceTheme, setMyPieceTheme,
  oppPieceTheme, setOppPieceTheme,
  appTheme, setAppTheme,
  highlightTheme, setHighlightTheme,
  soundPack, setSoundPack,
  boardBorder, setBoardBorder,
  boardShadow, setBoardShadow,
  embedded = false
}) {
  const navigate = useNavigate();
  const [step,  setStep]  = useState("home");
  const [mode,  setMode]  = useState(null);
  const [tc,    setTc]    = useState(300);
  const [botLv, setBotLv] = useState(2);
  const [color, setColor] = useState("random");
  const [code,  setCode]  = useState("");
  const [tab,   setTab]   = useState("play");

  // Appearance local state
  const [localBoardTheme,    setLocalBoardTheme]    = useState(boardTheme);
  const [localMyPiece,       setLocalMyPiece]       = useState(myPieceTheme);
  const [localOppPiece,      setLocalOppPiece]      = useState(oppPieceTheme);
  const [localAppTheme,      setLocalAppTheme]      = useState(appTheme);
  const [localHighlight,     setLocalHighlight]     = useState(highlightTheme);
  const [localSoundPack,     setLocalSoundPack]     = useState(soundPack);
  const [localBorder,        setLocalBorder]        = useState(boardBorder);
  const [localShadow,        setLocalShadow]        = useState(boardShadow);
  const [previewMyPiece,     setPreviewMyPiece]     = useState(null);
  const [previewOppPiece,    setPreviewOppPiece]    = useState(null);

  // Extra settings
  const [showCoords,   setShowCoords]   = useState(() => localStorage.getItem("chess_show_coords") !== "false");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("chess_sound") !== "false");
  const [autoQueen,    setAutoQueen]    = useState(() => localStorage.getItem("chess_auto_queen") !== "false");
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    setLocalBoardTheme(boardTheme);
    setLocalMyPiece(myPieceTheme);
    setLocalOppPiece(oppPieceTheme);
    setLocalAppTheme(appTheme);
    setLocalHighlight(highlightTheme);
    setLocalSoundPack(soundPack);
    setLocalBorder(boardBorder);
    setLocalShadow(boardShadow);
  }, [boardTheme, myPieceTheme, oppPieceTheme, appTheme, highlightTheme, soundPack, boardBorder, boardShadow]);

  // Real-time styling synchronization to parent
  useEffect(() => { setAppTheme(localAppTheme); }, [localAppTheme, setAppTheme]);
  useEffect(() => { setBoardTheme(localBoardTheme); }, [localBoardTheme, setBoardTheme]);
  useEffect(() => { setMyPieceTheme(localMyPiece); }, [localMyPiece, setMyPieceTheme]);
  useEffect(() => { setOppPieceTheme(localOppPiece); }, [localOppPiece, setOppPieceTheme]);
  useEffect(() => { setHighlightTheme(localHighlight); }, [localHighlight, setHighlightTheme]);
  useEffect(() => { setSoundPack(localSoundPack); }, [localSoundPack, setSoundPack]);
  useEffect(() => { setBoardBorder(localBorder); }, [localBorder, setBoardBorder]);
  useEffect(() => { setBoardShadow(localShadow); }, [localShadow, setBoardShadow]);

  function handleSaveAppearance() {
    localStorage.setItem("chess_board_theme",    localBoardTheme);
    localStorage.setItem("chess_my_piece_theme", localMyPiece);
    localStorage.setItem("chess_opp_piece_theme", localOppPiece);
    localStorage.setItem("chess_app_theme",      localAppTheme);
    localStorage.setItem("chess_highlight_theme", localHighlight);
    localStorage.setItem("chess_sound_pack",     localSoundPack);
    localStorage.setItem("chess_board_border",   localBorder);
    localStorage.setItem("chess_board_shadow",   localShadow);
    localStorage.setItem("chess_show_coords",    String(showCoords));
    localStorage.setItem("chess_sound",          String(soundEnabled));
    localStorage.setItem("chess_auto_queen",     String(autoQueen));

    setBoardTheme(localBoardTheme);
    setMyPieceTheme(localMyPiece);
    setOppPieceTheme(localOppPiece);
    setAppTheme(localAppTheme);
    setHighlightTheme(localHighlight);
    setSoundPack(localSoundPack);
    setBoardBorder(localBorder);
    setBoardShadow(localShadow);

    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
    toast.success("Đã lưu cài đặt!");
  }

  const selectedTc   = TIME_CONTROLS.find(t => t.value === tc);
  const selectedMode = MODES.find(m => m.id === mode);

  function selectMode(m) { setMode(m); setStep("config"); }
  function goBack()       { setStep("home"); setMode(null); }

  const activePieceTheme = (which) => which === "my" ? localMyPiece : localOppPiece;
  const setActivePieceTheme = (which, val) => which === "my" ? setLocalMyPiece(val) : setLocalOppPiece(val);

  return (
    <div className="chess-app-shell min-h-screen text-foreground transition-all duration-300">

      {/* ── Nav ── */}
      <header className="chess-app-header sticky top-0 z-20 h-14 flex items-center border-b border-border bg-background/90 backdrop-blur-xl px-4">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* On the home step while embedded, the floating "← HugoArcade" pill
                from ChessPage already covers "leave chess" — showing this button
                too just doubles up the same action right next to it. */}
            {!(embedded && step === "home") && (
              <button
                onClick={step !== "home" ? goBack : () => navigate("/member/utilities")}
                className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center shrink-0">
                <Swords className="w-4 h-4 text-background" />
              </div>
              <span className="font-display font-black text-base tracking-tight truncate text-foreground">
                HugoChess
                {step === "config" && selectedMode && (
                  <span className="font-normal text-muted-foreground"> / {selectedMode.title}</span>
                )}
              </span>
            </div>
          </div>

          {step === "home" && (
            <div className="flex gap-0.5 p-1 bg-muted rounded-xl shrink-0">
              {[
                { id: "play",      label: "Chơi" },
                { id: "rank",      label: "BXH" },
                { id: "customize", label: "Cài đặt" },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    tab === t.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  } ${t.id === "play" ? "lg:hidden" : ""}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="chess-lobby-main max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">

          {/* Left Column: Play Lobby / Configuration Setup */}
          <div className={`lg:col-span-7 space-y-6 ${step === "home" && tab !== "play" ? "hidden lg:block" : "block"}`}>
            {step === "home" && (
              <div className="space-y-6">
                {/* Hero Box */}
                <div className="relative rounded-3xl overflow-hidden p-6 chess-glass-card border border-white/10 shadow-xl bg-gradient-to-br from-card/85 to-card/45 animate-fadeIn">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full blur-xl pointer-events-none" />
                  <span className="pointer-events-none select-none absolute -right-3 -top-3 text-[120px] leading-none text-foreground/[0.05] font-display">♛</span>
                  <span className="pointer-events-none select-none absolute -left-4 -bottom-6 text-[100px] leading-none text-foreground/[0.04] font-display">♞</span>
                  <div className="relative space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Cờ vua trực tuyến</p>
                    <h1 className="font-display font-black text-3xl text-gradient leading-tight">Sẵn sàng<br />thách đấu?</h1>
                    <p className="text-sm text-muted-foreground">Chơi với AI hoặc ghép cặp đấu trí trực tuyến</p>
                  </div>
                  {userInfo && (
                    <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-muted border border-border/80 flex items-center justify-center shrink-0 select-none overflow-hidden font-bold relative group">
                          {userInfo.avatarUrl ? (
                            <img src={userInfo.avatarUrl} alt={userInfo.displayName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <span className="text-sm">{(userInfo.displayName ? userInfo.displayName[0].toUpperCase() : "P")}</span>
                          )}
                          <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{userInfo.displayName}</p>
                          <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border mt-0.5 ${tier(userInfo.rating ?? 1500).cls}`}>
                            {tier(userInfo.rating ?? 1500).label}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Tài khoản</span>
                        <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/25 px-3 py-1 rounded-2xl text-yellow-600 dark:text-yellow-400 font-mono font-black text-sm shadow-sm">
                          <Crown className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>{userInfo.rating ?? 1500} JOY</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick time buttons */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Chơi nhanh</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "1 phút", tc: 60, mode: "random", text: "Bullet", icon: Zap, borderClass: "hover:border-yellow-500/40" },
                      { label: "5 phút", tc: 300, mode: "random", text: "Blitz", icon: Flame, borderClass: "hover:border-red-500/40" },
                      { label: "vs Bot",  tc: 300, mode: "bot", text: "Stockfish", icon: Bot, borderClass: "hover:border-primary/40" },
                    ].map(q => {
                      const QIcon = q.icon;
                      return (
                        <button key={q.label} onClick={() => onStartGame({ mode: q.mode, timeControl: q.tc, botLevel: 2, color: "random", boardTheme, myPieceTheme, oppPieceTheme })}
                          className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl chess-glass-card chess-glass-card-hover border border-border active:scale-95 transition-all ${q.borderClass}`}>
                          <QIcon className="w-6 h-6 text-foreground" strokeWidth={1.75} />
                          <span className="text-xs font-bold text-foreground mt-1">{q.label}</span>
                          <span className="text-[9px] text-muted-foreground font-semibold leading-none">{q.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mode cards */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-0.5">Chế độ chơi</p>
                  {MODES.map(({ id, Icon, title, desc }) => (
                    <button key={id} onClick={() => selectMode(id)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl chess-glass-card chess-glass-card-hover border border-border hover:bg-card/45 transition-all text-left group">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
                        <Icon className="w-4.5 h-4.5 text-foreground" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-foreground">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Join by code */}
                <div className="chess-glass-card border border-border rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Hash className="w-3 h-3" strokeWidth={2.5} /> Nhập mã phòng
                  </p>
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))}
                      onKeyDown={e => { if (e.key === "Enter" && code.length === 6) onJoinRoom(code); }}
                      placeholder="ABCD12"
                      className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/45 focus:ring-2 focus:ring-foreground/10 transition-all text-foreground"
                    />
                    <button onClick={() => code.length === 6 && onJoinRoom(code)} disabled={code.length !== 6}
                      className="px-5 py-2.5 rounded-xl bg-foreground hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed text-background text-sm font-bold transition-all shadow-sm">
                      Vào
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "config" && mode && (
              <div className="space-y-4">
                {mode === "join" ? (
                  <section className="bg-card border border-border rounded-3xl p-6 space-y-5 text-center shadow-md animate-fadeIn">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground border border-border">
                      <Hash className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display font-black text-base uppercase tracking-wider">Vào phòng bằng mã</h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">Nhập mã phòng 6 ký tự viết hoa được chia sẻ từ bạn bè.</p>
                    </div>
                    <div className="max-w-xs mx-auto flex flex-col gap-3 pt-2">
                      <input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))}
                        onKeyDown={e => { if (e.key==="Enter" && code.length===6) onJoinRoom(code); }}
                        placeholder="MÃ PHÒNG (VD: ABCDEF)"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-center text-lg font-mono font-black tracking-[0.25em] placeholder:text-muted-foreground/30 focus:outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 transition-all text-foreground" />
                      <button onClick={() => code.length===6 && onJoinRoom(code)} disabled={code.length!==6}
                        className="w-full py-3 bg-foreground hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed text-background rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]">
                        Vào phòng đấu
                      </button>
                    </div>
                  </section>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Time control */}
                    <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3" strokeWidth={2.5} /> Thời gian mỗi bên
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_CONTROLS.map(t => {
                          const TIcon = t.icon;
                          return (
                            <button key={t.value} onClick={() => setTc(t.value)}
                              className={`flex flex-col items-center py-3.5 rounded-xl border-2 transition-all active:scale-95 ${
                                tc === t.value
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-background text-foreground hover:border-foreground/30"
                              }`}>
                              <TIcon className="w-4 h-4 mb-1" strokeWidth={2.5} />
                              <span className="font-display font-black text-lg leading-tight">{t.label}</span>
                              <span className={`text-[9px] font-bold mt-0.5 ${tc===t.value ? "text-background/70" : "text-muted-foreground"}`}>{t.tag}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    {/* Bot level */}
                    {mode === "bot" && (
                      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Shield className="w-3 h-3" strokeWidth={2.5} /> Chế độ Bot
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {BOT_MODES.map(b => {
                            const BIcon = b.Icon;
                            return (
                              <button key={b.id} type="button" onClick={() => setBotLv(b.id)}
                                className={`flex flex-col items-start p-3.5 rounded-xl border-2 transition-all active:scale-95 ${
                                  botLv === b.id
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border bg-background text-foreground hover:border-foreground/30"
                                }`}>
                                <BIcon className={`w-5 h-5 mb-2 shrink-0 ${botLv===b.id ? "text-background" : "text-muted-foreground"}`} strokeWidth={2.5} />
                                <span className="text-xs font-black leading-tight">{b.label}</span>
                                <span className={`text-[9px] font-semibold mt-0.5 leading-tight ${botLv===b.id ? "text-background/70" : "text-muted-foreground"}`}>{b.detail}</span>
                                <span className={`text-[9px] font-bold mt-1 ${botLv===b.id ? "text-background/60" : "text-muted-foreground"}`}>{b.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Color pick */}
                    {(mode === "bot" || mode === "friend") && (
                      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Màu quân</p>
                        <div className="grid grid-cols-3 gap-2">
                          {COLOR_OPTS.map(c => (
                            <button key={c.v} onClick={() => setColor(c.v)}
                              className={`py-4 px-2 rounded-xl border-2 text-center transition-all active:scale-95 ${
                                color===c.v
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-background text-foreground hover:border-foreground/30"
                              }`}>
                              <div className={`flex justify-center items-center h-8 mb-1 leading-none ${color===c.v ? "opacity-100" : "opacity-60"}`}>
                                {c.sym === "shuffle" ? <Shuffle className="w-5 h-5 text-current" strokeWidth={2.5} /> : <span className="text-2xl">{c.sym}</span>}
                              </div>
                              <div className={`text-[10px] font-bold ${color===c.v ? "text-background" : "text-foreground"}`}>{c.label}</div>
                              <div className={`text-[9px] mt-0.5 ${color===c.v ? "text-background/70" : "text-muted-foreground"}`}>{c.sub}</div>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Summary */}
                    <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">Cài đặt:</span>
                      <span className="flex items-center gap-1 bg-background border border-border px-2 py-1 rounded-full text-xs font-semibold text-foreground">
                        <Timer className="w-3.5 h-3.5 text-muted-foreground" /> {selectedTc?.label} · {selectedTc?.tag}
                      </span>
                      {mode === "bot" && (
                        <span className="flex items-center gap-1 bg-background border border-border px-2 py-1 rounded-full text-xs font-semibold text-foreground">
                          <Bot className="w-3.5 h-3.5 text-muted-foreground" /> {BOT_MODES.find(b=>b.id===botLv)?.label || "Bot"}
                        </span>
                      )}
                      {(mode === "bot" || mode === "friend") && (
                        <span className="flex items-center gap-1 bg-background border border-border px-2 py-1 rounded-full text-xs font-semibold text-foreground">
                          {color === "white" ? "♔ Trắng" : color === "black" ? "♚ Đen" : <><Shuffle className="w-3.5 h-3.5 text-muted-foreground" /> Ngẫu nhiên</>}
                        </span>
                      )}
                    </div>

                    {/* CTA button */}
                    <div className="pt-2">
                      <button
                        onClick={() => onStartGame({ mode, timeControl: tc, botLevel: botLv, color, boardTheme, myPieceTheme, oppPieceTheme })}
                        className="w-full py-4 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-display font-black text-base transition-all active:scale-[0.98] shadow-xl"
                      >
                        {mode === "bot" ? "Bắt đầu đấu" : mode === "random" ? "Tìm đối thủ" : "Tạo phòng"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Tabbed Leaderboard and Advanced Personalization settings */}
          <div className={`lg:col-span-5 space-y-6 ${step === "home" && tab === "play" ? "hidden lg:block" : step === "config" ? "hidden lg:block" : "block"}`}>
            <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
              
              {/* Tabs selector */}
              <div className="flex p-1 bg-muted rounded-xl">
                {[
                  { id: "rank",      label: "Bảng xếp hạng", icon: Trophy },
                  { id: "customize", label: "Cá nhân hóa",   icon: Settings },
                ].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-grow py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      (tab === t.id) || (tab === "play" && t.id === "rank")
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}>
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Leaderboard content */}
              {(tab === "rank" || tab === "play") && (
                <div>
                  <div className="flex items-center gap-2 mb-3 px-0.5">
                    <Trophy className="w-4 h-4 text-foreground animate-pulse" />
                    <span className="font-display font-black text-sm text-foreground uppercase tracking-wider">Top Kỳ Thủ</span>
                  </div>
                  <Leaderboard active={tab === "rank" || tab === "play"} />
                </div>
              )}

              {/* Personalization settings */}
              {tab === "customize" && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Interactive Demo Board */}
                  <LobbyDemoBoard
                    boardTheme={localBoardTheme}
                    pieceTheme={localMyPiece}
                    oppPieceTheme={localOppPiece}
                    highlightTheme={localHighlight}
                    boardBorder={localBorder}
                    boardShadow={localShadow}
                    soundPack={localSoundPack}
                    showCoords={showCoords}
                  />

                  {/* App theme selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-0.5">Chủ đề giao diện</label>
                    <div className="grid grid-cols-2 gap-2">
                      {APP_THEMES.map(theme => (
                        <button key={theme.id} onClick={() => setLocalAppTheme(theme.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            localAppTheme === theme.id
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background border-border text-foreground hover:border-foreground/45"
                          }`}>
                          {theme.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Board color selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-0.5">Màu sắc bàn cờ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {BOARD_THEMES.map(b => (
                        <button key={b.id} type="button" onClick={() => setLocalBoardTheme(b.id)}
                          className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                            localBoardTheme === b.id
                              ? "border-foreground bg-foreground/5 shadow-sm"
                              : "border-border bg-background hover:border-foreground/30"
                          }`}>
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-border flex transform rotate-45 mb-1.5 shrink-0">
                            <div className="w-1/2 h-full" style={{ backgroundColor: b.previewLight }} />
                            <div className="w-1/2 h-full" style={{ backgroundColor: b.previewDark }} />
                          </div>
                          <span className="text-[9px] font-bold text-center leading-tight truncate w-full text-foreground">{b.label.split(" ")[0]}</span>
                          {localBoardTheme === b.id && <Check className="w-3 h-3 text-foreground mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Highlight theme selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-0.5">Chỉ hướng nước đi (Highlight)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {HIGHLIGHT_THEMES.map(hl => (
                        <button key={hl.id} onClick={() => setLocalHighlight(hl.id)}
                          className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all ${
                            localHighlight === hl.id
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background border-border text-foreground hover:border-foreground/45"
                          }`}>
                          {hl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sound Pack selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-0.5">Bộ âm thanh nước đi</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SOUND_PACKS.map(sp => (
                        <button key={sp.id} onClick={() => setLocalSoundPack(sp.id)}
                          className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold transition-all ${
                            localSoundPack === sp.id
                              ? "bg-foreground text-background border-foreground"
                              : "bg-background border-border text-foreground hover:border-foreground/45"
                          }`}>
                          {sp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Piece selections */}
                  <div className="space-y-4 pt-3 border-t border-border">
                    <PieceThemeSelector
                      label="Quân cờ của bạn (Trắng)"
                      colorLetter="w"
                      value={localMyPiece}
                      preview={previewMyPiece}
                      onHover={setPreviewMyPiece}
                      onLeave={() => setPreviewMyPiece(null)}
                      onChange={setLocalMyPiece}
                    />
                    <PieceThemeSelector
                      label="Quân cờ đối đối thủ (Đen)"
                      colorLetter="b"
                      value={localOppPiece}
                      preview={previewOppPiece}
                      onHover={setPreviewOppPiece}
                      onLeave={() => setPreviewOppPiece(null)}
                      onChange={setLocalOppPiece}
                    />
                  </div>

                  {/* Visual decorations */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block px-0.5">Viền & Bóng bàn cờ</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-muted-foreground font-bold">Kiểu viền</span>
                        <select value={localBorder} onChange={e => setLocalBorder(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-xs text-foreground focus:outline-none">
                          {BORDER_STYLES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-muted-foreground font-bold">Kiểu bóng</span>
                        <select value={localShadow} onChange={e => setLocalShadow(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-2 py-1.5 text-xs text-foreground focus:outline-none">
                          {SHADOW_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Toggle options */}
                  <div className="space-y-1 pt-3 border-t border-border">
                    <ToggleSetting
                      label="Âm thanh di chuyển"
                      desc="Bật âm báo khi nước đi được thực hiện"
                      icon={soundEnabled ? Volume2 : VolumeX}
                      value={soundEnabled}
                      onChange={setSoundEnabled}
                    />
                    <ToggleSetting
                      label="Tọa độ bàn cờ"
                      desc="Hiển thị ký hiệu tọa độ a-h, 1-8"
                      icon={showCoords ? Eye : EyeOff}
                      value={showCoords}
                      onChange={setShowCoords}
                    />
                    <ToggleSetting
                      label="Tự động phong Hậu"
                      desc="Tự động đổi tốt thành Hậu ở hàng cuối"
                      icon={Zap}
                      value={autoQueen}
                      onChange={setAutoQueen}
                    />
                  </div>

                  {/* Save button */}
                  <button onClick={handleSaveAppearance}
                    className={`w-full py-3.5 rounded-2xl font-display font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 ${
                      settingsSaved
                        ? "bg-muted text-foreground border border-border"
                        : "bg-foreground hover:bg-foreground/90 text-background shadow-md"
                    }`}>
                    {settingsSaved ? <><Check className="w-5 h-5" /> Đã lưu!</> : "Lưu cài đặt"}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Interactive Lobby Demo Board ───────────────────────────────────────────────
function LobbyDemoBoard({ boardTheme, pieceTheme, oppPieceTheme, highlightTheme, boardBorder, boardShadow, soundPack, showCoords }) {
  const [knightPos, setKnightPos] = useState("g1");
  const [pawnPos, setPawnPos] = useState("e5");
  const [selectedSq, setSelectedSq] = useState(null);
  const [lastMv, setLastMv] = useState(null);

  const playDemoSound = (type) => {
    playFx(type, soundPack);
  };

  const handleSquareClick = (sq) => {
    if (sq === knightPos) {
      setSelectedSq(sq);
    } else if (knightPos === "g1" && selectedSq === "g1" && sq === "f3") {
      setKnightPos("f3");
      setSelectedSq(null);
      setLastMv({ from: "g1", to: "f3" });
      playDemoSound("move");
    } else if (knightPos === "f3" && selectedSq === "f3" && sq === "e5") {
      setKnightPos("e5");
      setPawnPos(null); // Captured!
      setSelectedSq(null);
      setLastMv({ from: "f3", to: "e5" });
      playDemoSound("capture");
    } else {
      setSelectedSq(null);
    }
  };

  const resetDemo = () => {
    setKnightPos("g1");
    setPawnPos("e5");
    setSelectedSq(null);
    setLastMv(null);
  };

  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  const getPiece = (file, rank) => {
    const sq = file + rank;
    if (knightPos === sq) return { type: "N", color: "w", theme: pieceTheme };
    if (pawnPos === sq) return { type: "P", color: "b", theme: oppPieceTheme };
    return null;
  };

  return (
    <div className="space-y-2 pb-2">
      <div className="flex justify-between items-center px-0.5">
        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block font-bold">Thử nghiệm (Demo)</label>
        <button type="button" onClick={resetDemo} className="text-[9px] font-bold text-muted-foreground hover:text-foreground">
          Đặt lại
        </button>
      </div>

      <div className={`mx-auto w-44 aspect-square select-none relative rounded-xl overflow-hidden border-glow-${boardBorder} shadow-style-${boardShadow} board-${boardTheme}`}>
        <cg-board className="w-full h-full grid grid-cols-8 grid-rows-8 relative">
          {ranks.map(rank => (
            files.map(file => {
              const sq = file + rank;
              const piece = getPiece(file, rank);
              const isLastMove = lastMv && (lastMv.from === sq || lastMv.to === sq);
              const isSelected = selectedSq === sq;
              const isPossibleDest = (selectedSq === "g1" && sq === "f3" && knightPos === "g1") || 
                                     (selectedSq === "f3" && sq === "e5" && knightPos === "f3");

              return (
                <div
                  key={sq}
                  onClick={() => handleSquareClick(sq)}
                  className="relative flex items-center justify-center cursor-pointer transition-all duration-150"
                  style={{
                    backgroundColor: isSelected 
                      ? "rgba(255,255,255,0.35)" 
                      : isLastMove 
                        ? (highlightTheme === "yellow" ? "rgba(250, 204, 21, 0.35)" : 
                           highlightTheme === "green" ? "rgba(34, 197, 94, 0.35)" :
                           highlightTheme === "blue" ? "rgba(59, 130, 246, 0.35)" :
                           highlightTheme === "purple" ? "rgba(168, 85, 247, 0.35)" :
                           highlightTheme === "red" ? "rgba(239, 68, 68, 0.35)" : "transparent")
                        : "transparent"
                  }}
                >
                  {/* Coordinates */}
                  {showCoords && (
                    <>
                      {file === "a" && <span className="absolute left-0.5 top-0.5 text-[5px] text-muted-foreground opacity-60 font-mono leading-none">{rank}</span>}
                      {rank === "1" && <span className="absolute right-0.5 bottom-0.5 text-[5px] text-muted-foreground opacity-60 font-mono leading-none">{file}</span>}
                    </>
                  )}

                  {/* Piece */}
                  {piece && (
                    <div
                      style={{
                        width: "80%",
                        height: "80%",
                        backgroundImage: `url('https://lichess1.org/assets/piece/${piece.theme}/${piece.color}${piece.type}.svg')`,
                        backgroundSize: "contain",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                      }}
                      className="transition-transform duration-200 transform scale-100 hover:scale-110 z-10"
                    />
                  )}

                  {/* Move destination hint dot */}
                  {isPossibleDest && (
                    <div className="w-2.5 h-2.5 rounded-full bg-foreground/25 absolute" />
                  )}
                </div>
              );
            })
          ))}
        </cg-board>
      </div>
    </div>
  );
}

// ── Piece Theme Selector with Live Preview ─────────────────────────────────────
function PieceThemeSelector({ label, colorLetter, value, preview, onHover, onLeave, onChange }) {
  const activeTheme = preview || value;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground leading-none">{label}</p>
      </div>

      {/* Live preview frame */}
      <div className="rounded-2xl border border-border bg-muted/20 p-3 flex flex-col items-center gap-2">
        {/* Full set of 6 pieces */}
        <PiecePreview theme={activeTheme} colorLetter={colorLetter} size={30} />
        {/* Mini board preview */}
        <div className="flex gap-0.5">
          {[{p:"K",bg:"rgba(0,0,0,0.1)"},{p:"Q",bg:"rgba(255,255,255,0.05)"},{p:"R",bg:"rgba(0,0,0,0.1)"},{p:"B",bg:"rgba(255,255,255,0.05)"},{p:"N",bg:"rgba(0,0,0,0.1)"},{p:"P",bg:"rgba(255,255,255,0.05)"}].map(({p,bg}) => (
            <div key={p} className="w-6.5 h-6.5 flex items-center justify-center rounded-sm" style={{ backgroundColor: bg }}>
              <div style={{
                width: 22, height: 22,
                backgroundImage: `url('https://lichess1.org/assets/piece/${activeTheme}/${colorLetter}${p}.svg')`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }} />
            </div>
          ))}
        </div>
      </div>

      {/* Theme selector buttons */}
      <div className="grid grid-cols-2 gap-2">
        {PIECE_THEMES.map(t => (
          <button key={t.id} type="button"
            onClick={() => onChange(t.id)}
            onMouseEnter={() => onHover(t.id)}
            onMouseLeave={onLeave}
            onTouchStart={() => onHover(t.id)}
            onTouchEnd={onLeave}
            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all active:scale-95 ${
              value === t.id
                ? "border-foreground bg-foreground/5 shadow-sm"
                : "border-border bg-background hover:border-foreground/25"
            }`}>
            {/* Mini piece icon */}
            <div style={{
              width: 24, height: 24, flexShrink: 0,
              backgroundImage: `url('https://lichess1.org/assets/piece/${t.id}/${colorLetter}K.svg')`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black leading-tight truncate">{t.label}</p>
            </div>
            {value === t.id && <Check className="w-3 h-3 text-foreground shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Toggle Setting Row ─────────────────────────────────────────────────────────
function ToggleSetting({ label, desc, icon: Icon, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(v => !v)}
      className="w-full flex items-center gap-3 py-2 text-left hover:bg-muted/40 rounded-xl px-1.5 transition-colors"
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
        <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
      </div>
      {/* Toggle switch */}
      <div className={`w-9 h-5 rounded-full transition-all shrink-0 relative ${value ? "bg-foreground" : "bg-muted border border-border"}`}>
        <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full shadow-sm transition-all ${value ? "left-5 bg-background" : "left-0.5 bg-foreground/40"}`} />
      </div>
    </button>
  );
}
