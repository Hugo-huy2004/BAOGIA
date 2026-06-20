import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Chess } from "chess.js";
import { Chessground } from "chessground";
import "chessground/assets/chessground.base.css";
import "./chess-theme.css";
import toast from "react-hot-toast";
import {
  ArrowLeft, Flag, Handshake, Volume2, VolumeX,
  Copy, Check, Wifi, WifiOff, Lightbulb, ChevronDown,
  X, BarChart2, RotateCcw, Home, Share2,
  Frown, Trophy, Crown, Clock, Settings, Eye, EyeOff
} from "lucide-react";

// ── Captured-piece utilities ──────────────────────────────────────────────────
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const PIECE_SYMS   = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛" };
const START_COUNTS = { P: 8, N: 2, B: 2, R: 2, Q: 1, p: 8, n: 2, b: 2, r: 2, q: 1 };

function getCapturedFromFen(fen) {
  const board = fen.split(" ")[0];
  const curr = { P:0, N:0, B:0, R:0, Q:0, p:0, n:0, b:0, r:0, q:0 };
  for (const ch of board) { if (ch in curr) curr[ch]++; }
  const byWhite = [], byBlack = [];
  ["p","n","b","r","q"].forEach(p => {
    for (let i = 0; i < START_COUNTS[p] - curr[p]; i++) byWhite.push(p);
  });
  ["P","N","B","R","Q"].forEach(p => {
    for (let i = 0; i < START_COUNTS[p] - curr[p]; i++) byBlack.push(p.toLowerCase());
  });
  const wScore = byWhite.reduce((s,p) => s + PIECE_VALUES[p], 0);
  const bScore = byBlack.reduce((s,p) => s + PIECE_VALUES[p], 0);
  return { byWhite, byBlack, advantage: wScore - bScore };
}

// ── Legal move destinations ───────────────────────────────────────────────────
const ALL_SQUARES = "abcdefgh".split("").flatMap(f =>
  "12345678".split("").map(r => f + r)
);
function getLegalDests(chess) {
  const dests = new Map();
  for (const sq of ALL_SQUARES) {
    const mvs = chess.moves({ square: sq, verbose: true });
    if (mvs.length > 0) dests.set(sq, mvs.map(m => m.to));
  }
  return dests;
}

// ── Chessground wrapper ───────────────────────────────────────────────────────
function Board({ chess, onMove, orientation = "white", disabled, lastMove, hintMove, boardTheme, whitePieceTheme, blackPieceTheme, showCoords = true, highlightTheme, boardBorder, boardShadow }) {
  const containerRef = useRef(null);
  const cgRef        = useRef(null);
  const onMoveRef    = useRef(onMove);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  const myColor   = orientation === "white" ? "white" : "black";
  const turnColor = chess.turn() === "w" ? "white" : "black";
  const canMove   = !disabled;

  useEffect(() => {
    if (!containerRef.current) return;
    cgRef.current = Chessground(containerRef.current, {
      fen:         chess.fen(),
      orientation: myColor,
      turnColor,
      movable: {
        color:  canMove ? myColor : undefined,
        free:   false,
        dests:  canMove ? getLegalDests(chess) : new Map(),
        events: {
          after: (orig, dest) => {
            onMoveRef.current(orig, dest);
            cgRef.current?.setShapes([]);
          },
        },
      },
      lastMove:   lastMove ? [lastMove.from, lastMove.to] : undefined,
      animation:  { enabled: true, duration: 200 },
      highlight:  { lastMove: true, check: chess.inCheck() },
      coordinates: showCoords,
      premovable:  { enabled: false },
      draggable:   { showGhost: true },
      drawable:    { enabled: true, visible: true, eraseOnClick: false },
    });
    return () => { cgRef.current?.destroy(); cgRef.current = null; };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!cgRef.current) return;
    cgRef.current.set({
      fen:         chess.fen(),
      orientation: myColor,
      turnColor,
      movable: {
        color: canMove ? myColor : undefined,
        free:  false,
        dests: canMove ? getLegalDests(chess) : new Map(),
      },
      lastMove:  lastMove ? [lastMove.from, lastMove.to] : undefined,
      highlight: { lastMove: true, check: chess.inCheck() },
    });
  }, [chess.fen(), myColor, turnColor, canMove, lastMove?.from, lastMove?.to]);

  useEffect(() => {
    if (!cgRef.current) return;
    if (hintMove) {
      cgRef.current.setShapes([{ orig: hintMove.from, dest: hintMove.to, brush: "paleBlue" }]);
    } else {
      cgRef.current.setShapes([]);
    }
  }, [hintMove]);

  return (
    <div
      className={`w-full h-full rounded-xl overflow-hidden board-${boardTheme || "blue"} piece-white-${whitePieceTheme || "maestro"} piece-black-${blackPieceTheme || "maestro"} highlight-${highlightTheme || "yellow"} border-glow-${boardBorder || "glow"} shadow-style-${boardShadow || "3d"}`}
      style={{ position: "relative" }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

// ── Stockfish ─────────────────────────────────────────────────────────────────
const SF_SRC = "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js";

function useStockfish(enabled, level, onEvalUpdate) {
  const workerRef = useRef(null);
  const cbRef     = useRef(null);
  const genRef    = useRef(0);
  const [ready, setReady] = useState(false);
  const onEvalUpdateRef = useRef(onEvalUpdate);
  useEffect(() => { onEvalUpdateRef.current = onEvalUpdate; }, [onEvalUpdate]);

  useEffect(() => {
    if (!enabled) return;
    setReady(false);
    let blobUrl = null, alive = true;
    fetch(SF_SRC)
      .then(r => r.blob())
      .then(blob => {
        if (!alive) return;
        blobUrl = URL.createObjectURL(blob);
        const w = new Worker(blobUrl);
        workerRef.current = w;
        w.postMessage("uci");
        w.postMessage(`setoption name Skill Level value ${Math.min(20, Math.max(0, level))}`);
        w.postMessage("isready");
        w.onmessage = e => {
          const line = String(e.data);
          if (line.includes("readyok")) setReady(true);
          if (line.includes("score cp ")) {
            const parts = line.split(" ");
            const cpIdx = parts.indexOf("cp");
            if (cpIdx !== -1 && parts[cpIdx + 1]) {
              onEvalUpdateRef.current?.({ type: "cp", value: parseInt(parts[cpIdx + 1], 10) });
            }
          } else if (line.includes("score mate ")) {
            const parts = line.split(" ");
            const mateIdx = parts.indexOf("mate");
            if (mateIdx !== -1 && parts[mateIdx + 1]) {
              onEvalUpdateRef.current?.({ type: "mate", value: parseInt(parts[mateIdx + 1], 10) });
            }
          }
          if (line.startsWith("bestmove ")) {
            const mv = line.split(" ")[1];
            if (cbRef.current) {
              if (mv && mv !== "(none)") { cbRef.current(mv); cbRef.current = null; }
            } else {
              if (mv && mv !== "(none)") onEvalUpdateRef.current?.({ type: "bestmove", value: mv });
            }
          }
        };
      }).catch(() => {});
    return () => {
      alive = false;
      workerRef.current?.terminate(); workerRef.current = null;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setReady(false);
    };
  }, [enabled, level]);

  const ask = useCallback((fen, depth, gen) => new Promise(resolve => {
    if (!workerRef.current) return resolve(null);
    cbRef.current = mv => (gen === genRef.current ? resolve(mv) : resolve(null));
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${depth}`);
    genRef.current = gen;
  }), []);

  const analyze = useCallback((fen, depth = 10) => {
    if (!workerRef.current) return;
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${depth}`);
  }, []);

  return [ask, ready, analyze];
}

// ── Sound ─────────────────────────────────────────────────────────────────────
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
    if (type === "win")     { [523,659,784,1046].forEach((f,i) => beep(f, 0.25, 0.08, "sine", i*0.08)); }
    if (type === "lose")    { [392,311,246,196].forEach((f,i) => beep(f, 0.3, 0.08, "sawtooth", i*0.12)); }
  } else if (pack === "modern") {
    if (type === "move")    { beep(600, 0.03, 0.12, "sine"); }
    if (type === "capture") { beep(800, 0.04, 0.15, "triangle"); beep(400, 0.04, 0.12, "triangle", 0.02); }
    if (type === "check")   { beep(900, 0.1, 0.1, "square"); }
    if (type === "win")     { beep(520, 0.1, 0.08); beep(660, 0.1, 0.08, "sine", 0.08); beep(780, 0.2, 0.08, "sine", 0.16); }
    if (type === "lose")    { beep(300, 0.15, 0.1, "sine"); beep(220, 0.2, 0.1, "sine", 0.1); }
  } else { // classic
    if (type === "move")    { beep(520, 0.07); beep(380, 0.06, 0.08, "sine", 0.05); }
    if (type === "capture") { beep(200, 0.14, 0.18, "sawtooth"); beep(120, 0.1, 0.1, "sawtooth", 0.1); }
    if (type === "check")   { beep(880, 0.18, 0.09, "square"); }
    if (type === "win")     { [320,420,520,660].forEach((f,i) => beep(f, 0.2, 0.1, "sine", i*0.11)); }
    if (type === "lose")    { [400,300,200].forEach((f,i) => beep(f, 0.22, 0.1, "sine", i*0.17)); }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function vibrate(pattern) {
  try { navigator.vibrate?.(pattern); } catch (_) {}
}

// ── Desktop/Mobile Player Card ────────────────────────────────────────────────
function PlayerCard({ name, rating, color, isMe, active, ms, thinking, captures = [], materialAdv = 0, avatarUrl }) {
  const danger = active && ms < 15000 && ms > 0;
  const sorted = [...captures].sort((a,b) => (PIECE_VALUES[b]||0) - (PIECE_VALUES[a]||0));

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 bg-card/45 backdrop-blur-md border border-border/80 rounded-2xl shadow-sm transition-all duration-150 ${active ? "opacity-100 ring-1 ring-foreground/20" : "opacity-65"}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xl shrink-0 select-none overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            color === "white" ? "♔" : "♚"
          )}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="font-bold text-sm truncate">{name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 min-h-[14px]">
            {sorted.length > 0 ? (
              <span className="text-[12px] text-muted-foreground flex items-center gap-0.5">
                {sorted.map((p,i) => <span key={i}>{PIECE_SYMS[p]}</span>)}
              </span>
            ) : thinking ? (
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            ) : rating != null ? (
              <span className="text-[10px] text-muted-foreground font-mono">{rating} JOY</span>
            ) : null}
            {materialAdv > 0 && (
              <span className="text-[10px] font-black text-foreground bg-foreground/10 px-1.5 py-0.5 rounded leading-none">
                +{materialAdv}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={`font-mono font-black tabular-nums rounded-xl border-2 px-3 py-1.5 min-w-[72px] text-center text-lg transition-all ${
        danger ? "timer-danger" : active ? "timer-active" : "bg-muted border-border text-muted-foreground"
      }`}>
        {fmt(ms)}
      </div>
    </div>
  );
}

// ── Mobile Player Card ────────────────────────────────────────────────────────
function MobilePlayerCard({ name, rating, color, isMe, active, ms, thinking, captures = [], materialAdv = 0, avatarUrl }) {
  const danger = active && ms < 15000 && ms > 0;
  const sorted = [...captures].sort((a,b) => (PIECE_VALUES[b]||0) - (PIECE_VALUES[a]||0));

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 select-none transition-all duration-150 ${active ? "opacity-100" : "opacity-55"}`}>
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center text-xl overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            color === "white" ? "♔" : "♚"
          )}
        </div>
        {active && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-foreground rounded-full border-2 border-background turn-dot" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 leading-tight">
          <p className="font-bold text-sm truncate">{name}</p>
          {materialAdv > 0 && (
            <span className="text-[10px] font-black text-foreground shrink-0">+{materialAdv}</span>
          )}
        </div>
        <div className="flex items-center min-h-[15px] mt-0.5">
          {sorted.length > 0 ? (
            <span className="text-[13px] leading-none text-muted-foreground">
              {sorted.map((p,i) => <span key={i}>{PIECE_SYMS[p]}</span>)}
            </span>
          ) : thinking ? (
            <div className="flex items-center gap-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-foreground/40 animate-bounce"
                  style={{ animationDelay: `${i*0.15}s` }} />
              ))}
              <span className="text-[10px] text-muted-foreground font-semibold ml-1">đang nghĩ...</span>
            </div>
          ) : rating != null ? (
            <span className="text-[10px] text-muted-foreground font-mono">{rating} JOY</span>
          ) : null}
        </div>
      </div>

      <div className={`font-mono font-black tabular-nums text-base min-w-[68px] text-center rounded-xl border-2 px-2.5 py-1.5 transition-all ${
        danger ? "timer-danger" : active ? "timer-active" : "bg-muted border-border text-muted-foreground"
      }`}>
        {fmt(ms)}
      </div>
    </div>
  );
}

// ── Desktop Move List ─────────────────────────────────────────────────────────
function MoveList({ moves }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [moves.length]);
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2)
    pairs.push({ n: i / 2 + 1, w: moves[i], b: moves[i + 1] });
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-1 p-2">
        {pairs.map((p, i) => (
          <div key={p.n} className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono ${
            i === pairs.length - 1
              ? "bg-muted text-foreground font-bold"
              : "text-muted-foreground"
          }`}>
            <span className="text-muted-foreground/50 text-[9px]">{p.n}.</span>
            <span className="font-semibold">{p.w}</span>
            {p.b && <span>{p.b}</span>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Mobile Horizontal Move List ───────────────────────────────────────────────
function HorizontalMoveList({ moves }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", inline: "end", block: "nearest" });
  }, [moves.length]);
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2)
    pairs.push({ n: i / 2 + 1, w: moves[i], b: moves[i + 1] });
  return (
    <div className="h-moves-scroll bg-background border-b border-border" style={{ height: 36 }}>
      <div className="flex items-center gap-0.5 px-2 min-w-max h-full">
        {pairs.length === 0 && (
          <span className="text-[10px] text-muted-foreground/40 px-1 italic">Chưa có nước đi...</span>
        )}
        {pairs.map((p, i) => (
          <div key={p.n} className={`flex items-center gap-0.5 text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
            i === pairs.length - 1
              ? "bg-muted text-foreground font-bold"
              : "text-muted-foreground"
          }`}>
            <span className="text-muted-foreground/40 text-[9px]">{p.n}.</span>
            <span className="font-semibold">{p.w}</span>
            {p.b && <span>{p.b}</span>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Mobile Action Button ──────────────────────────────────────────────────────
function MobileBtn({ icon: Icon, label, onClick, disabled, active, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {loading
        ? <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : <Icon className="w-5 h-5" strokeWidth={1.75} />
      }
      <span className="text-[9px] font-bold leading-none mt-0.5">{label}</span>
    </button>
  );
}

// ── Result constants ──────────────────────────────────────────────────────────
const REASON = {
  checkmate: "Chiếu hết", resign: "Đầu hàng", timeout: "Hết giờ",
  stalemate: "Bất động",  draw: "Hòa cờ",     abort: "Hủy ván",
};

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

const INSIGHT_CLASSES = {
  best: "border border-foreground bg-foreground text-background font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider",
  brilliant: "border-2 border-foreground bg-foreground text-background font-black px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider animate-pulse",
  good: "border border-foreground text-foreground font-semibold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider",
  mistake: "border border-muted-foreground/45 text-muted-foreground px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider",
  blunder: "border border-foreground/80 text-foreground bg-foreground/15 font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider",
};

// ── WS Status indicator ───────────────────────────────────────────────────────
function WsStatusBadge({ wsStatus }) {
  if (wsStatus === "connected") {
    return (
      <span className="text-[9px] font-semibold flex items-center gap-0.5 text-foreground">
        <Wifi className="w-2.5 h-2.5" /> Đã kết nối
      </span>
    );
  }
  if (wsStatus === "connecting") {
    return (
      <span className="text-[9px] font-semibold flex items-center gap-0.5 text-muted-foreground animate-pulse">
        <Wifi className="w-2.5 h-2.5" /> Đang kết nối...
      </span>
    );
  }
  return (
    <span className="text-[9px] font-semibold flex items-center gap-0.5 text-muted-foreground">
      <WifiOff className="w-2.5 h-2.5" /> Mất kết nối
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChessGame({
  config, roomId: propRoomId, onBack, userInfo, setUserInfo, onRoomCreated,
  boardTheme, setBoardTheme,
  myPieceTheme, setMyPieceTheme,
  oppPieceTheme, setOppPieceTheme,
  appTheme, setAppTheme,
  highlightTheme, setHighlightTheme,
  soundPack, setSoundPack,
  boardBorder, setBoardBorder,
  boardShadow, setBoardShadow
}) {
  const { mode, timeControl = 300, botLevel = 3, color: preferColor } = config || {};

  const initColor = () => {
    if (preferColor === "white") return "white";
    if (preferColor === "black") return "black";
    return Math.random() < 0.5 ? "white" : "black";
  };

  const [chess,       setChess]       = useState(() => new Chess());
  const [moves,       setMoves]       = useState([]);
  const [playerColor, setPlayerColor] = useState(initColor);
  const [turn,        setTurn]        = useState("w");
  const myTurn = turn === (playerColor === "white" ? "w" : "b");
  const [whiteMs,     setWhiteMs]     = useState(timeControl * 1000);
  const [blackMs,     setBlackMs]     = useState(timeControl * 1000);
  const [status,      setStatus]      = useState("waiting");
  const [result,      setResult]      = useState(null);
  const [roomId,      setRoomId]      = useState(propRoomId || null);
  const [wsStatus,    setWsStatus]    = useState("disconnected");
  const [opponent,    setOpponent]    = useState(null);
  const [lastMove,    setLastMove]    = useState(null);
  const [soundOn,     setSoundOn]     = useState(() => localStorage.getItem("chess_sound") !== "false");
  const [showCoords,  setShowCoords]  = useState(() => localStorage.getItem("chess_show_coords") !== "false");
  const [pendingPromo, setPendingPromo] = useState(null);
  const [drawOffer,   setDrawOffer]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [thinking,    setThinking]    = useState(false);
  const [hintMove,    setHintMove]    = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [rematchOffered,   setRematchOffered]   = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [waitingTime, setWaitingTime] = useState(180);
  const [showHistory, setShowHistory] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [sidebarTab, setSidebarTab] = useState("game");
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [autoQueen, setAutoQueen] = useState(() => localStorage.getItem("chess_auto_queen") !== "false");
  const [noOpponentWaiting, setNoOpponentWaiting] = useState(false);
  const [exitCountdown, setExitCountdown] = useState(5);

  const changeAppTheme = (t) => { setAppTheme(t); localStorage.setItem("chess_app_theme", t); };
  const changeBoardTheme = (t) => { setBoardTheme(t); localStorage.setItem("chess_board_theme", t); };
  const changeMyPieceTheme = (t) => { setMyPieceTheme(t); localStorage.setItem("chess_my_piece_theme", t); };
  const changeOppPieceTheme = (t) => { setOppPieceTheme(t); localStorage.setItem("chess_opp_piece_theme", t); };
  const changeHighlightTheme = (t) => { setHighlightTheme(t); localStorage.setItem("chess_highlight_theme", t); };
  const changeSoundPack = (t) => { setSoundPack(t); localStorage.setItem("chess_sound_pack", t); };
  const changeBoardBorder = (t) => { setBoardBorder(t); localStorage.setItem("chess_board_border", t); };
  const changeBoardShadow = (t) => { setBoardShadow(t); localStorage.setItem("chess_board_shadow", t); };
  const changeAutoQueen = (val) => { setAutoQueen(val); localStorage.setItem("chess_auto_queen", String(val)); };
  const changeShowCoords = (val) => { setShowCoords(val); localStorage.setItem("chess_show_coords", String(val)); };
  const changeSoundOn = (val) => { setSoundOn(val); localStorage.setItem("chess_sound", String(val)); };

  // Decoupled piece themes computed from props
  const whitePieceTheme = playerColor === "white" ? myPieceTheme : oppPieceTheme;
  const blackPieceTheme = playerColor === "black" ? myPieceTheme : oppPieceTheme;

  const statusRef = useRef("waiting");
  const colorRef  = useRef(playerColor);
  const soundRef  = useRef(true);
  const soundPackRef = useRef(soundPack);
  const wsRef     = useRef(null);
  const clockRef  = useRef(null);
  const clk       = useRef({ turn:"w", wMs: timeControl*1000, bMs: timeControl*1000, last:0 });
  const genRef    = useRef(0);

  useEffect(() => { soundPackRef.current = soundPack; }, [soundPack]);

  const [aiAssistant, setAiAssistant] = useState(() => mode === "bot" && botLevel === 1);
  const [evalData, setEvalData] = useState({ score: 0, bestMove: null, isMate: false });
  const [moveInsight, setMoveInsight] = useState(null);
  const prevEvalScoreRef = useRef(0);
  const pendingInsightRef = useRef(null);

  const captured = useMemo(() => getCapturedFromFen(chess.fen()), [chess.fen()]);

  const handleEvalUpdate = useCallback((update) => {
    const activeTurn = chess.turn();
    setEvalData(prev => {
      let nextScore = prev.score, nextIsMate = prev.isMate, nextBestMove = prev.bestMove;
      if (update.type === "cp") {
        nextScore = activeTurn === "w" ? update.value / 100 : -(update.value / 100);
        nextIsMate = false;
      } else if (update.type === "mate") {
        nextScore = activeTurn === "w" ? update.value : -update.value;
        nextIsMate = true;
      } else if (update.type === "bestmove") {
        nextBestMove = update.value;
      }

      if (pendingInsightRef.current && (update.type === "cp" || update.type === "mate")) {
        const p = pendingInsightRef.current;
        pendingInsightRef.current = null;
        const diff = p.mover === "white" ? nextScore - p.scoreBefore : p.scoreBefore - nextScore;
        const isBestMove = p.bestMoveBefore && p.lastMoveUci === p.bestMoveBefore;
        const isTutorial = mode === "bot" && botLevel === 1;
        let insightText, insightType;
        if (isTutorial) {
          if (isBestMove || diff >= 0.2)  { insightText = "Nước hay"; insightType = "best"; }
          else if (diff <= -0.8)           { insightText = "Nước không tốt"; insightType = "blunder"; }
          else                             { insightText = "Nước trung bình"; insightType = "mistake"; }
        } else {
          if (isBestMove)        { insightText = "Chính xác nhất"; insightType = "best"; }
          else if (diff <= -1.5) { insightText = "Sai lầm nghiêm trọng"; insightType = "blunder"; }
          else if (diff <= -0.8) { insightText = "Sai sót"; insightType = "mistake"; }
          else if (diff >= 0.2)  { insightText = "Tuyệt vời"; insightType = "brilliant"; }
          else                   { insightText = "Nước đi tốt"; insightType = "good"; }
        }
        setMoveInsight({ mover: p.mover === "white" ? "Trắng" : "Đen", move: p.move, text: insightText, type: insightType, diff });
      }

      return { score: nextScore, isMate: nextIsMate, bestMove: nextBestMove };
    });
  }, [chess, mode, botLevel]);

  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  useEffect(() => { colorRef.current = playerColor; }, [playerColor]);

  const snd = useCallback(t => { if (soundRef.current) playFx(t, soundPackRef.current); }, []);
  const sfLevelValue = (() => {
    if (mode !== "bot") return 10;
    if (botLevel === 1) return 0;
    if (botLevel === 2) return 6;
    if (botLevel === 3) return 12;
    if (botLevel === 4) return 20;
    return 10;
  })();
  const sfEnabled = mode === "bot" || aiAssistant;
  const [getBotMove, sfReady, analyze] = useStockfish(sfEnabled, sfLevelValue, handleEvalUpdate);

  const getWhitePercentage = useCallback(() => {
    if (evalData.isMate) return evalData.score > 0 ? 100 : 0;
    return ((Math.max(-8, Math.min(8, evalData.score)) + 8) / 16) * 100;
  }, [evalData.isMate, evalData.score]);

  // ── Clock ──
  const stopClock = useCallback(() => {
    if (clockRef.current) { clearInterval(clockRef.current); clockRef.current = null; }
  }, []);

  const startClock = useCallback(startTurn => {
    stopClock();
    clk.current.turn = startTurn;
    clk.current.last = Date.now();
    clockRef.current = setInterval(() => {
      if (statusRef.current !== "active") return;
      const now = Date.now(), elapsed = now - clk.current.last;
      clk.current.last = now;
      if (clk.current.turn === "w") {
        const prev = Math.floor(clk.current.wMs / 1000);
        clk.current.wMs = Math.max(0, clk.current.wMs - elapsed);
        const next = Math.floor(clk.current.wMs / 1000);
        setWhiteMs(clk.current.wMs);
        if (clk.current.wMs === 0) endGame({ winner:"black", reason:"timeout" });
        else if (clk.current.wMs < 15000 && next < prev && soundRef.current) beep(600, 0.03, 0.05);
      } else {
        const prev = Math.floor(clk.current.bMs / 1000);
        clk.current.bMs = Math.max(0, clk.current.bMs - elapsed);
        const next = Math.floor(clk.current.bMs / 1000);
        setBlackMs(clk.current.bMs);
        if (clk.current.bMs === 0) endGame({ winner:"white", reason:"timeout" });
        else if (clk.current.bMs < 15000 && next < prev && soundRef.current) beep(600, 0.03, 0.05);
      }
    }, 100);
  }, [stopClock]); // eslint-disable-line

  const endGame = useCallback(res => {
    if (statusRef.current === "finished") return;
    stopClock();
    statusRef.current = "finished";
    setStatus("finished");
    setThinking(false);
    let change = res.ratingChange || 0;
    if (mode === "bot") {
      const isWin  = res.winner === colorRef.current;
      const isLoss = res.winner && res.winner !== colorRef.current;
      const cnt    = moves.length;
      if (isWin) {
        change = botLevel === 1 ? 10 : botLevel === 2 ? 15 : botLevel === 3 ? 20 : 40;
      } else if (isLoss) {
        let base = botLevel === 2 ? -12 : botLevel === 3 ? -10 : botLevel === 4 ? -8 : -15;
        change = cnt < 10 ? base - 5 : cnt > 50 ? Math.min(-2, base + 6) : cnt > 30 ? Math.min(-4, base + 3) : base;
      }
      res.ratingChange = change;
      if (change !== 0 && userInfo?.email) {
        const apiBase = import.meta.env.VITE_API_URL || '/api';
        fetch(`${apiBase}/chess/rating/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userInfo.email,
            ratingChange: change,
            win: isWin,
            loss: isLoss,
            draw: !isWin && !isLoss,
            avatarUrl: userInfo.avatarUrl || ""
          }),
        }).catch(() => {});
      }
    }
    if (change !== 0) {
      const newRating = (userInfo?.rating || 1500) + change;
      if (setUserInfo) setUserInfo(prev => prev ? { ...prev, rating: newRating } : prev);
      if (!userInfo?.email) localStorage.setItem("chess_guest_rating", newRating.toString());
    }
    setResult(res);
    if (soundRef.current) {
      if (!res.winner) playFx("move");
      else if (res.winner === colorRef.current) playFx("win");
      else playFx("lose");
    }
    vibrate(res.winner === colorRef.current ? [80,40,80,40,150] : [200]);
  }, [stopClock, mode, botLevel, moves.length, userInfo, setUserInfo]);

  const applyMove = useCallback((mv, newChess) => {
    const nt = newChess.turn();
    setChess(newChess);
    setMoves(prev => [...prev, mv.san]);
    setTurn(nt);
    setLastMove({ from: mv.from, to: mv.to });
    setHintMove(null);
    clk.current.turn = nt;
    clk.current.last = Date.now();
    const isCapture = mv.flags.includes("c") || mv.flags.includes("e");
    snd(isCapture ? "capture" : "move");
    vibrate(isCapture ? [30, 10, 30] : 15);
    if (newChess.inCheck()) { snd("check"); vibrate([60, 30, 60]); }
    if (newChess.isGameOver()) {
      let winner = null, reason = "draw";
      if (newChess.isCheckmate()) { winner = mv.color === "w" ? "white" : "black"; reason = "checkmate"; }
      else if (newChess.isStalemate()) reason = "stalemate";
      endGame({ winner, reason });
    }
  }, [snd, endGame]);

  useEffect(() => {
    if (!aiAssistant || status !== "active" || !sfReady) return;
    if (lastMove) {
      pendingInsightRef.current = {
        mover: chess.turn() === "w" ? "black" : "white",
        move: lastMove.from.toUpperCase() + " → " + lastMove.to.toUpperCase(),
        lastMoveUci: lastMove.from + lastMove.to,
        scoreBefore: evalData.score,
        bestMoveBefore: evalData.bestMove,
      };
    }
    analyze(chess.fen(), 10);
  }, [chess.fen(), aiAssistant, sfReady]); // eslint-disable-line

  useEffect(() => {
    if (mode === "bot" && botLevel === 1 && status === "active" && myTurn && sfReady) {
      const timer = setTimeout(() => requestHint(), 500);
      return () => clearTimeout(timer);
    }
  }, [myTurn, status, sfReady, mode, botLevel]); // eslint-disable-line

  useEffect(() => {
    if (mode !== "bot") return;
    statusRef.current = "active"; setStatus("active");
    clk.current = { turn:"w", wMs: timeControl*1000, bMs: timeControl*1000, last: Date.now() };
    startClock("w");
    return stopClock;
  }, []); // eslint-disable-line

  useEffect(() => {
    if (mode !== "bot" || status !== "active" || !sfReady) return;
    const botClr = colorRef.current === "white" ? "b" : "w";
    if (turn !== botClr) return;
    const sfDepths = { 1: 4, 2: 8, 3: 12, 4: 16 };
    const depth = sfDepths[botLevel] || 8;
    const gen = ++genRef.current;
    const fenNow = chess.fen();
    const thinkMs = 800 + Math.random() * (botLevel * 250);
    setThinking(true);
    const timer = setTimeout(() => {
      if (genRef.current !== gen) return;
      getBotMove(fenNow, depth, gen).then(uci => {
        setThinking(false);
        if (!uci || statusRef.current !== "active") return;
        const c = new Chess(fenNow);
        const from = uci.slice(0,2), to = uci.slice(2,4), promo = uci[4];
        let mv; try { mv = c.move({ from, to, promotion: promo||"q" }); } catch { return; }
        if (mv) applyMove(mv, c);
      });
    }, thinkMs);
    return () => { clearTimeout(timer); setThinking(false); };
  }, [turn, status, sfReady]); // eslint-disable-line

  useEffect(() => {
    if (status !== "waiting" || !roomId || mode !== "friend") return;
    setWaitingTime(180);
    const interval = setInterval(() => {
      setWaitingTime(prev => {
        if (prev <= 1) { clearInterval(interval); setStatus("timeout"); wsRef.current?.close(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, roomId, mode]);

  useEffect(() => {
    if (!noOpponentWaiting) return;
    const interval = setInterval(() => {
      setExitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [noOpponentWaiting, onBack]);

  useEffect(() => {
    if (mode === "bot") return;
    const wsUrl = import.meta.env.VITE_WS_URL
      ? import.meta.env.VITE_WS_URL.replace(/\/ws$/, "") + "/ws/chess"
      : `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/chess`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setWsStatus("connecting");
    ws.onopen = () => {
      setWsStatus("connected");
      const gid = localStorage.getItem("chess_guest_id") || crypto.randomUUID();
      localStorage.setItem("chess_guest_id", gid);
      ws.send(JSON.stringify({
        type: "auth",
        email: userInfo?.email || null,
        displayName: userInfo?.displayName || "Khách",
        rating: userInfo?.rating || 1500,
        guestId: gid,
        avatarUrl: userInfo?.avatarUrl || ""
      }));
      if (propRoomId)             ws.send(JSON.stringify({ type:"join_room", roomId: propRoomId }));
      else if (mode === "friend") ws.send(JSON.stringify({ type:"create_room", timeControl, mode:"friend", color: preferColor||"random", boardTheme: config?.boardTheme||"blue", myPieceTheme: config?.myPieceTheme||"maestro", oppPieceTheme: config?.oppPieceTheme||"maestro" }));
      else                        ws.send(JSON.stringify({ type:"create_room", timeControl, mode:"random" }));
    };
    ws.onmessage = e => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      switch (msg.type) {
        case "room_created":
          setRoomId(msg.roomId); setStatus("waiting");
          if (msg.color) { colorRef.current = msg.color; setPlayerColor(msg.color); }
          if (onRoomCreated) onRoomCreated(msg.roomId);
          break;
        case "rematch_offer":
          setRematchOffered(true);
          break;
        case "queue_position":
          if (msg.position === 1) {
            setNoOpponentWaiting(true);
            setExitCountdown(5);
          }
          break;
        case "game_start":
        case "joined": {
          setNoOpponentWaiting(false);
          const myClr = msg.color || colorRef.current || "white";
          colorRef.current = myClr; setPlayerColor(myClr);
          setOpponent(myClr === "white" ? msg.black : msg.white);
          if (msg.boardTheme) { setBoardTheme(msg.boardTheme); }
          const ms = (msg.timeControl || timeControl) * 1000;
          clk.current = { turn:"w", wMs:ms, bMs:ms, last: Date.now() };
          setWhiteMs(ms); setBlackMs(ms);
          statusRef.current = "active"; setStatus("active");
          setChess(new Chess()); setMoves([]); setTurn("w"); setLastMove(null);
          setResult(null); setHintMove(null);
          setEvalData({ score: 0, bestMove: null, isMate: false });
          setMoveInsight(null); pendingInsightRef.current = null;
          setRematchOffered(false); setRematchRequested(false);
          startClock("w"); break;
        }
        case "move": {
          const c = new Chess(msg.fen);
          setChess(c); setMoves(prev => [...prev, msg.san]);
          setTurn(msg.turn); setLastMove({ from:msg.from, to:msg.to });
          setHintMove(null);
          clk.current.wMs = msg.whiteTime; clk.current.bMs = msg.blackTime;
          setWhiteMs(msg.whiteTime); setBlackMs(msg.blackTime);
          clk.current.turn = msg.turn; clk.current.last = Date.now();
          const isCapture = msg.san.includes("x");
          snd(isCapture ? "capture" : "move");
          vibrate(isCapture ? [30,10,30] : 15);
          if (msg.isCheck) { snd("check"); vibrate([60,30,60]); }
          break;
        }
        case "game_over":
          endGame({ winner: msg.result==="1-0"?"white": msg.result==="0-1"?"black":null, reason:msg.reason, ratingChange:msg.ratingChange });
          break;
        case "draw_offer":            setDrawOffer(true);  break;
        case "draw_declined":         setDrawOffer(false); break;
        case "opponent_disconnected": setWsStatus("disconnected"); break;
        case "opponent_reconnected":  setWsStatus("connected");    break;
        case "error":
          toast.error(msg.message || "Đã xảy ra lỗi kết nối");
          setTimeout(() => onBack(), 1500);
          break;
        case "reconnected": {
          setNoOpponentWaiting(false);
          const myClr = msg.color || colorRef.current || "white";
          colorRef.current = myClr; setPlayerColor(myClr);
          setOpponent(myClr === "white" ? msg.black : msg.white);
          if (msg.boardTheme) { setBoardTheme(msg.boardTheme); }
          
          const c = new Chess(msg.fen);
          setChess(c);
          setMoves(msg.moves || []);
          setTurn(msg.turn);
          setLastMove(null);
          
          clk.current = { turn: msg.turn, wMs: msg.whiteTime, bMs: msg.blackTime, last: Date.now() };
          setWhiteMs(msg.whiteTime);
          setBlackMs(msg.blackTime);
          
          statusRef.current = "active";
          setStatus("active");
          
          setResult(null);
          setHintMove(null);
          setRematchOffered(false);
          setRematchRequested(false);
          
          startClock(msg.turn);
          break;
        }
        default: break;
      }
    };
    ws.onclose = () => setWsStatus("disconnected");
    ws.onerror = () => setWsStatus("error");
    return () => { ws.close(); stopClock(); };
  }, []); // eslint-disable-line

  function handleMove(from, to) {
    if (statusRef.current !== "active") return;
    const myClr = colorRef.current === "white" ? "w" : "b";
    if (chess.turn() !== myClr) return;
    const isPromo = chess.get(from)?.type === "p" &&
      ((myClr === "w" && to[1] === "8") || (myClr === "b" && to[1] === "1"));
    if (isPromo && !autoQueen) {
      setPendingPromo({ from, to });
      return;
    }
    const c = new Chess(chess.fen());
    let mv; try { mv = c.move({ from, to, promotion: isPromo ? "q" : undefined }); } catch { return; }
    if (!mv) return;
    applyMove(mv, c);
    if (mode !== "bot") wsRef.current?.send(JSON.stringify({ type:"move", from, to, promotion: isPromo ? "q" : undefined }));
  }

  function doPromo(piece) {
    if (!pendingPromo) return;
    const { from, to } = pendingPromo;
    setPendingPromo(null);
    const c = new Chess(chess.fen());
    let mv; try { mv = c.move({ from, to, promotion: piece }); } catch { return; }
    if (!mv) return;
    applyMove(mv, c);
    if (mode !== "bot") wsRef.current?.send(JSON.stringify({ type:"move", from, to, promotion: piece }));
  }

  async function requestHint() {
    if (hintLoading || status !== "active" || !sfReady) return;
    const myClr = playerColor === "white" ? "w" : "b";
    if (chess.turn() !== myClr) return;
    setHintLoading(true);
    const gen = ++genRef.current;
    const uci = await getBotMove(chess.fen(), mode === "bot" && botLevel === 1 ? 10 : 15, gen);
    setHintLoading(false);
    if (uci && uci !== "(none)") {
      setHintMove({ from: uci.slice(0,2), to: uci.slice(2,4) });
      if (mode !== "bot" || botLevel !== 1) setTimeout(() => setHintMove(null), 4000);
    }
  }

  function resign() {
    if (mode === "bot") endGame({ winner: playerColor==="white"?"black":"white", reason:"resign" });
    else wsRef.current?.send(JSON.stringify({ type:"resign" }));
  }
  function offerDraw() {
    if (mode === "bot") endGame({ winner:null, reason:"draw" });
    else wsRef.current?.send(JSON.stringify({ type:"draw_offer" }));
  }
  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/chess/${roomId}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  function requestRematch() {
    if (mode === "bot") {
      genRef.current++;
      const c = new Chess();
      setChess(c); setMoves([]); setTurn("w"); setLastMove(null);
      setResult(null); setHintMove(null);
      setEvalData({ score: 0, bestMove: null, isMate: false });
      setMoveInsight(null); pendingInsightRef.current = null;
      setWhiteMs(timeControl*1000); setBlackMs(timeControl*1000);
      clk.current = { turn:"w", wMs:timeControl*1000, bMs:timeControl*1000, last:Date.now() };
      statusRef.current = "active"; setStatus("active");
      startClock("w");
    } else {
      setRematchRequested(true);
      wsRef.current?.send(JSON.stringify({ type:"rematch", roomId }));
    }
  }

  function copyPGN() {
    const white = playerColor === "white" ? (userInfo?.displayName || "Bạn") : (opponent?.displayName || "Stockfish");
    const black = playerColor === "black" ? (userInfo?.displayName || "Bạn") : (opponent?.displayName || "Stockfish");
    const res = !result?.winner ? "1/2-1/2" : result.winner === "white" ? "1-0" : "0-1";
    let pgn = `[Event "HugoChess"]\n[White "${white}"]\n[Black "${black}"]\n[Result "${res}"]\n\n`;
    for (let i = 0; i < moves.length; i++) {
      if (i % 2 === 0) pgn += `${Math.floor(i/2)+1}. `;
      pgn += `${moves[i]} `;
    }
    pgn += res;
    navigator.clipboard.writeText(pgn).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  // ── Derived ──
  const oppColor   = playerColor === "white" ? "black" : "white";
  const myMs       = playerColor === "white" ? whiteMs : blackMs;
  const oppMs      = oppColor    === "white" ? whiteMs : blackMs;
  const boardDisabled = status !== "active" || !myTurn;

  const myCaptures  = playerColor === "white" ? captured.byWhite : captured.byBlack;
  const oppCaptures = playerColor === "white" ? captured.byBlack : captured.byWhite;
  const myAdv  = playerColor === "white" ? Math.max(0,  captured.advantage) : Math.max(0, -captured.advantage);
  const oppAdv = playerColor === "white" ? Math.max(0, -captured.advantage) : Math.max(0,  captured.advantage);

  const evalLabel = evalData.isMate
    ? `Chiếu bí sau ${Math.abs(evalData.score)} nước`
    : evalData.score > 0
      ? `Ưu thế Trắng (+${evalData.score.toFixed(1)})`
      : evalData.score < 0
        ? `Ưu thế Đen (${evalData.score.toFixed(1)})`
        : "Cân bằng (0.0)";

  // ── Waiting: timeout ──
  if (status === "timeout") {
    return (
      <div className="min-h-screen text-foreground flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl border border-border mx-auto">⏰</div>
          <div className="space-y-1">
            <h2 className="font-bold text-xl">Hết thời gian chờ</h2>
            <p className="text-xs text-muted-foreground">Không có đối thủ tham gia trong 3 phút.</p>
          </div>
          <button onClick={onBack} className="w-full py-3 bg-foreground hover:bg-foreground/90 text-background rounded-xl text-xs font-black uppercase tracking-wider transition-all">
            Quay lại sảnh
          </button>
        </div>
      </div>
    );
  }

  // ── Waiting: friend room ──
  if (status === "waiting" && mode === "friend") {
    return (
      <div className="min-h-screen text-foreground flex flex-col justify-between py-8">
        <header className="px-4">
          <div className="max-w-md mx-auto w-full flex items-center justify-between">
            <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground flex items-center gap-1.5 text-sm font-semibold">
              <ArrowLeft className="w-4 h-4" /> Quay lại sảnh
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">HugoCHESS</span>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full space-y-6 shadow-xl text-center">
            {!roomId ? (
              <div className="space-y-4 py-8">
                {wsStatus === "connecting" || wsStatus === "connected" ? (
                  <>
                    <div className="w-10 h-10 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
                      {wsStatus === "connecting" ? "Đang kết nối máy chủ..." : "Đang thiết lập phòng đấu..."}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground mx-auto">
                      <WifiOff className="w-5 h-5" />
                    </div>
                    <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Mất kết nối máy chủ</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold transition-all">Tải lại trang</button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto text-muted-foreground">
                    <Crown className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-xl">Phòng đấu riêng</h3>
                  <p className="text-xs text-muted-foreground">Chia sẻ mã phòng hoặc đường dẫn mời chơi.</p>
                </div>
                <div className="py-2.5 bg-muted border border-border rounded-2xl inline-flex items-center gap-2 px-5 mx-auto">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/30 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-foreground/60" /></span>
                  <span className="text-xs font-mono font-bold text-foreground">
                    Chờ: {Math.floor(waitingTime/60)}:{(waitingTime%60).toString().padStart(2,"0")}
                  </span>
                </div>
                <div className="space-y-2 border-t border-border pt-4 text-left">
                  <div className="flex items-center justify-between bg-muted border border-border rounded-xl px-4 py-3">
                    <span className="font-mono text-2xl font-black tracking-[0.2em] select-all">{roomId}</span>
                    <button onClick={() => { navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                      className="p-2 bg-foreground hover:bg-foreground/90 text-background rounded-lg transition-all shrink-0">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input readOnly value={`${window.location.origin}/chess/${roomId}`}
                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-mono text-muted-foreground focus:outline-none truncate" />
                  <button onClick={copyLink} className="px-4 py-2.5 bg-muted text-foreground border border-border rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Sao chép
                  </button>
                </div>
                {navigator.share && (
                  <button onClick={() => navigator.share({ title:"Thách đấu Cờ Vua trên HugoChess", text:`Mã phòng: ${roomId}`, url:`${window.location.origin}/chess/${roomId}` }).catch(()=>{})}
                    className="w-full py-3 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <Share2 className="w-4 h-4" /> Chia sẻ qua App
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ── GAME SCREEN ──────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ══ MOBILE LAYOUT ══════════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col bg-background text-foreground" style={{ height: "100dvh", overflow: "hidden" }}>

        {/* Mobile Header — 44px */}
        <header className="shrink-0 h-11 flex items-center justify-between px-3 border-b border-border bg-background/95 backdrop-blur-xl z-10">
          <button onClick={onBack} className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[11px] font-black text-foreground">
              {mode === "bot" ? `Bot Lv${botLevel}` : mode === "friend" ? "Đấu bạn bè" : "Đấu ngẫu nhiên"}
            </span>
            {mode !== "bot" ? (
              <WsStatusBadge wsStatus={wsStatus} />
            ) : !sfReady ? (
              <span className="text-[9px] text-muted-foreground font-semibold flex items-center gap-0.5 animate-pulse">
                <span className="w-1.5 h-1.5 border border-muted-foreground border-t-transparent rounded-full animate-spin inline-block" />
                Đang tải engine...
              </span>
            ) : (
              <span className="text-[9px] text-foreground font-semibold">Stockfish sẵn sàng</span>
            )}
          </div>
          <button onClick={() => changeSoundOn(!soundOn)} className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </header>

        {/* Opponent card — 54px */}
        <div className="shrink-0 border-b border-border">
          <MobilePlayerCard
            name={mode === "bot" ? `Stockfish Lv${botLevel}` : (opponent?.displayName || "Đang chờ...")}
            rating={mode !== "bot" ? opponent?.rating : undefined}
            color={oppColor} isMe={false}
            active={status === "active" && !myTurn}
            ms={oppMs} thinking={thinking}
            captures={oppCaptures} materialAdv={oppAdv}
            avatarUrl={mode === "bot" ? undefined : opponent?.avatarUrl}
          />
        </div>

        {/* Board area — flex-1 */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-3 py-1 relative">
          {status === "waiting" && mode !== "friend" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-4 text-center">
              {noOpponentWaiting ? (
                <>
                  <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-3">
                    <WifiOff className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="font-bold text-sm text-foreground">Hiện tại không có ai đang chờ...</p>
                  <p className="text-xs text-muted-foreground mt-1">Tự động quay lại sảnh sau {exitCountdown} giây...</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-bold text-sm">Đang tìm đối thủ...</p>
                  <p className="text-xs text-muted-foreground mt-1">Ghép cặp theo JOY</p>
                </>
              )}
            </div>
          )}

          <div className="chess-board-mobile-sq">
            {aiAssistant && status === "active" && (mode !== "bot" || botLevel !== 2) && (
              <div className="ai-eval-bar" style={{ position:"absolute", left:-20, top:0, bottom:0, width:14 }}>
                <div className="ai-eval-fill" style={{ height:`${getWhitePercentage()}%` }} />
                <div className="ai-eval-midline" />
                {getWhitePercentage() > 50
                  ? <span className="ai-eval-text pos-bottom">{evalData.isMate ? `M${Math.abs(evalData.score)}` : evalData.score > 0 ? `+${evalData.score.toFixed(1)}` : "0.0"}</span>
                  : <span className="ai-eval-text pos-top">{evalData.isMate ? `M${Math.abs(evalData.score)}` : evalData.score.toFixed(1)}</span>
                }
              </div>
            )}
            <div className={`w-full h-full rounded-xl overflow-hidden ${chess.inCheck() ? "board-in-check" : ""}`}>
              <Board
                chess={chess} onMove={handleMove} orientation={playerColor}
                disabled={boardDisabled} lastMove={lastMove} hintMove={hintMove}
                boardTheme={boardTheme} whitePieceTheme={whitePieceTheme} blackPieceTheme={blackPieceTheme}
                showCoords={showCoords}
                highlightTheme={highlightTheme} boardBorder={boardBorder} boardShadow={boardShadow}
              />
            </div>
          </div>
        </div>

        {/* My card — 54px */}
        <div className="shrink-0 border-t border-border">
          <MobilePlayerCard
            name={userInfo?.displayName || "Bạn"} rating={userInfo?.rating}
            color={playerColor} isMe
            active={status === "active" && myTurn}
            ms={myMs}
            captures={myCaptures} materialAdv={myAdv}
            avatarUrl={userInfo?.avatarUrl}
          />
        </div>

        {/* Horizontal move list — 36px */}
        <HorizontalMoveList moves={moves} />

        {/* Bottom action bar — 52px */}
        <div className="shrink-0 flex items-center px-2 py-1 gap-0.5 border-t border-border bg-background" style={{ height: 52 }}>
          <MobileBtn icon={Flag} label="Đầu hàng" onClick={resign} disabled={status !== "active"} />
          <MobileBtn icon={Handshake} label="Hòa cờ" onClick={offerDraw} disabled={status !== "active"} />
          <MobileBtn icon={Lightbulb} label="Gợi ý" onClick={requestHint}
            disabled={!sfReady || !myTurn || status !== "active"} loading={hintLoading} />
          <MobileBtn icon={BarChart2} label="AI" onClick={() => setShowAIDrawer(v => !v)}
            active={showAIDrawer || aiAssistant}
            disabled={mode === "bot" && botLevel === 2} />
          <MobileBtn icon={Settings} label="Cài đặt" onClick={() => setShowSettingsModal(true)} />
          {status === "finished" && <MobileBtn icon={RotateCcw} label="Lại" onClick={requestRematch} />}
          {status === "finished" && <MobileBtn icon={Home} label="Sảnh" onClick={onBack} />}
        </div>
      </div>

      {/* ══ DESKTOP LAYOUT ══════════════════════════════════════════════════════ */}
      <div className="hidden md:block min-h-screen text-foreground transition-colors duration-200">

        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-1 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate leading-tight">
                {mode === "bot" ? `Bot Lv${botLevel}` : mode === "friend" ? "Đấu bạn bè" : "Đấu ngẫu nhiên"}
              </p>
              {mode !== "bot" ? (
                <div className="leading-tight"><WsStatusBadge wsStatus={wsStatus} /></div>
              ) : !sfReady ? (
                <p className="text-[10px] font-semibold flex items-center gap-1 text-muted-foreground leading-tight animate-pulse">
                  <span className="w-2 h-2 border border-muted-foreground border-t-transparent rounded-full animate-spin inline-block shrink-0" />
                  Đang tải engine...
                </p>
              ) : (
                <p className="text-[10px] text-foreground font-semibold leading-tight">Stockfish sẵn sàng</p>
              )}
            </div>
            <button onClick={() => changeSoundOn(!soundOn)} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
              {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            {/* Left Column: Board Arena */}
            <div className="md:col-span-7 lg:col-span-8 space-y-4">
              <PlayerCard
                name={mode === "bot" ? `Stockfish Lv${botLevel}` : (opponent?.displayName || "Đang chờ...")}
                rating={mode !== "bot" ? opponent?.rating : undefined}
                color={oppColor} isMe={false}
                active={status === "active" && !myTurn}
                ms={oppMs} thinking={thinking}
                captures={oppCaptures} materialAdv={oppAdv}
                avatarUrl={mode === "bot" ? undefined : opponent?.avatarUrl}
              />

              <div className={`relative bg-card border border-border rounded-2xl overflow-hidden p-2 shadow-lg ${chess.inCheck() ? "board-in-check" : ""}`}>
                {status === "waiting" && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md rounded-xl p-6">
                    {mode !== "friend" ? (
                      noOpponentWaiting ? (
                        <div className="text-center space-y-4 py-8">
                          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                            <WifiOff className="w-6 h-6 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-sm text-foreground">Hiện tại không có ai đang chờ...</p>
                            <p className="text-xs text-muted-foreground">Tự động quay lại sảnh sau {exitCountdown} giây...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 py-8">
                          <div className="w-10 h-10 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
                          <div className="space-y-1">
                            <p className="font-bold text-sm">Đang tìm đối thủ...</p>
                            <p className="text-xs text-muted-foreground">Ghép cặp tự động dựa trên JOY</p>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="text-center w-full max-w-sm space-y-5 py-4">
                        {!roomId ? (
                          <div className="space-y-4 py-8">
                            <div className="w-10 h-10 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="font-bold text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
                              {wsStatus === "connecting" ? "Đang kết nối máy chủ..." : "Đang thiết lập phòng đấu..."}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">Phòng đấu riêng</p>
                            <h3 className="font-bold text-lg">Đang chờ đối thủ tham gia...</h3>
                            <div className="flex items-center justify-between bg-muted border border-border rounded-2xl px-6 py-4">
                              <span className="font-mono text-3xl font-black tracking-[0.25em] select-all">{roomId}</span>
                              <button onClick={() => { navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                                className="p-2 bg-foreground hover:bg-foreground/90 text-background rounded-xl transition-all shrink-0">
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <input readOnly value={`${window.location.origin}/chess/${roomId}`}
                                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono text-muted-foreground focus:outline-none truncate" />
                              <button onClick={copyLink} className="px-4 py-2 bg-muted text-foreground border border-border rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5">
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Sao chép
                              </button>
                            </div>
                            {navigator.share && (
                              <button onClick={()=>navigator.share({title:"Thách đấu Cờ Vua",text:`Mã phòng: ${roomId}`,url:`${window.location.origin}/chess/${roomId}`}).catch(()=>{})}
                                className="w-full py-3 bg-foreground text-background rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                <Share2 className="w-4 h-4" /> Chia sẻ trực tiếp qua App
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="chess-board-wrapper">
                  {aiAssistant && status === "active" && (mode !== "bot" || botLevel !== 2) && (
                    <div className="ai-eval-bar">
                      <div className="ai-eval-fill" style={{ height:`${getWhitePercentage()}%` }} />
                      <div className="ai-eval-midline" />
                      {getWhitePercentage() > 50
                        ? <span className="ai-eval-text pos-bottom">{evalData.isMate ? `M${Math.abs(evalData.score)}` : evalData.score > 0 ? `+${evalData.score.toFixed(1)}` : "0.0"}</span>
                        : <span className="ai-eval-text pos-top">{evalData.isMate ? `M${Math.abs(evalData.score)}` : evalData.score.toFixed(1)}</span>
                      }
                    </div>
                  )}
                  <div style={{ flex: 1, aspectRatio: "1", position: "relative" }}>
                    <Board chess={chess} onMove={handleMove} orientation={playerColor}
                      disabled={boardDisabled} lastMove={lastMove} hintMove={hintMove}
                      boardTheme={boardTheme} whitePieceTheme={whitePieceTheme} blackPieceTheme={blackPieceTheme}
                      showCoords={showCoords}
                      highlightTheme={highlightTheme}
                      boardBorder={boardBorder}
                      boardShadow={boardShadow} />
                  </div>
                </div>
              </div>

              <PlayerCard
                name={userInfo?.displayName || "Bạn"} rating={userInfo?.rating}
                color={playerColor} isMe
                active={status === "active" && myTurn}
                ms={myMs}
                captures={myCaptures} materialAdv={myAdv}
                avatarUrl={userInfo?.avatarUrl}
              />
            </div>

            {/* Right Column: Unified Command Sidebar */}
            <div className="md:col-span-5 lg:col-span-4 bg-card border border-border rounded-2xl overflow-hidden shadow-md flex flex-col">
              {/* Sidebar Tabs Header */}
              <div className="flex border-b border-border bg-muted/30 shrink-0">
                <button
                  onClick={() => setSidebarTab("game")}
                  className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 text-center ${
                    sidebarTab === "game"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Trận đấu
                </button>
                {(mode !== "bot" || botLevel !== 2) && (
                  <button
                    onClick={() => setSidebarTab("ai")}
                    className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 text-center ${
                      sidebarTab === "ai"
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Trợ lý AI
                  </button>
                )}
                <button
                  onClick={() => setSidebarTab("settings")}
                  className={`flex-1 py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 text-center ${
                    sidebarTab === "settings"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Giao diện
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 min-h-[400px] flex flex-col justify-between">
                {/* GAME TAB */}
                {sidebarTab === "game" && (
                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                      {status === "finished" && result && (
                        <div className="border border-border rounded-2xl p-4 text-center space-y-3 bg-muted/20">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Trận đấu kết thúc</span>
                            <h3 className="font-bold text-base">
                              {!result.winner ? "Hòa cờ" : result.winner === playerColor ? "Bạn đã chiến thắng!" : "Bạn đã thất bại"}
                            </h3>
                            <p className="text-xs text-muted-foreground">Lý do: {REASON[result.reason] || result.reason}</p>
                            {result.ratingChange != null && (
                              <div className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-xl text-xs font-black border ${
                                result.ratingChange >= 0
                                  ? "bg-foreground text-background border-foreground"
                                  : "bg-muted text-foreground border-border"
                              }`}>
                                {result.ratingChange >= 0 ? "+" : ""}{result.ratingChange} JOY
                              </div>
                            )}
                          </div>
                          {moves.length > 0 && (
                            <button onClick={copyPGN}
                              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-[10px] font-semibold text-muted-foreground border border-border transition-all">
                              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {copied ? "Đã sao chép PGN!" : "Sao chép PGN ván đấu"}
                            </button>
                          )}
                        </div>
                      )}

                      {moves.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Lịch sử nước đi ({moves.length})</span>
                          <div className="border border-border rounded-xl bg-muted/10 max-h-[200px] overflow-y-auto">
                            <MoveList moves={moves} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-xs italic">
                          Chưa có nước đi nào. Bắt đầu di chuyển các quân cờ!
                        </div>
                      )}
                    </div>

                    {status === "active" && (
                      <div className="pt-3 border-t border-border/60 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Thao tác</span>
                        <div className="flex gap-2">
                          <button onClick={resign}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold transition-all border border-border">
                            <Flag className="w-3.5 h-3.5" /> Đầu hàng
                          </button>
                          <button onClick={offerDraw}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold transition-all border border-border">
                            <Handshake className="w-3.5 h-3.5" /> Hòa cờ
                          </button>
                        </div>
                      </div>
                    )}

                    {status === "finished" && (
                      <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
                        {rematchOffered ? (
                          <button onClick={requestRematch} className="w-full py-2.5 bg-foreground hover:bg-foreground/90 text-background rounded-xl text-xs font-black uppercase tracking-widest transition-all animate-pulse">Chấp nhận đấu lại</button>
                        ) : rematchRequested ? (
                          <div className="py-2.5 text-center text-xs font-semibold text-muted-foreground bg-muted/50 border border-border rounded-xl">Đang chờ đối thủ chấp nhận...</div>
                        ) : (
                          <button onClick={requestRematch} className="w-full py-2.5 bg-foreground hover:bg-foreground/90 text-background rounded-xl text-xs font-black uppercase tracking-widest transition-all">Yêu cầu đấu lại</button>
                        )}
                        <button onClick={onBack} className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-xs font-bold transition-all">Quay lại sảnh</button>
                      </div>
                    )}
                  </div>
                )}

                {/* AI COMPANION TAB */}
                {sidebarTab === "ai" && (
                  <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold font-black uppercase tracking-wide">Trợ lý AI</h4>
                          <span className="text-[10px] text-muted-foreground">Phân tích bằng Stockfish</span>
                        </div>
                        {mode === "bot" && botLevel === 1 ? (
                          <span className="px-2 py-0.5 bg-muted text-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-wider">Hướng dẫn</span>
                        ) : (
                          <button onClick={() => { const next=!aiAssistant; setAiAssistant(next); if(!next){setMoveInsight(null);setHintMove(null);} }}
                            className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                              aiAssistant ? "bg-foreground text-background" : "bg-muted text-muted-foreground border border-border"
                            }`}>
                            {aiAssistant ? "Bật" : "Tắt"}
                          </button>
                        )}
                      </div>

                      {aiAssistant ? (
                        <div className="space-y-3 pt-2">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground font-semibold">Đánh giá thế cờ:</span>
                              <span className="font-mono font-bold text-foreground">{evalLabel}</span>
                            </div>
                            <div className="h-3 rounded-full overflow-hidden bg-muted border border-border flex relative">
                              <div className="h-full bg-foreground transition-all duration-500"
                                style={{ width: `${getWhitePercentage()}%` }} />
                              <div className="absolute top-0 bottom-0 left-1/2 -ml-px w-0.5 bg-border/40" />
                            </div>
                            <div className="flex justify-between text-[9px] text-muted-foreground font-mono leading-none">
                              <span>Đen</span>
                              <span>Trắng</span>
                            </div>
                          </div>

                          {moveInsight ? (
                            <div className="p-3 rounded-xl border border-border bg-muted/40 text-xs space-y-1.5">
                              <div className="flex justify-between font-bold">
                                <span className="text-muted-foreground">Nước đi cuối ({moveInsight.mover}):</span>
                                <span className="font-mono text-foreground">{moveInsight.move}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground font-medium">Đánh giá:</span>
                                <span className={INSIGHT_CLASSES[moveInsight.type] || ""}>
                                  {moveInsight.text}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground text-xs italic">
                              Chưa có phân tích nước đi.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="text-xs font-semibold">Công cụ hỗ trợ học tập</p>
                          <p className="text-[10px] mt-1">Bật phân tích để xem Stockfish đánh giá từng nước đi.</p>
                        </div>
                      )}
                    </div>

                    {aiAssistant && sfReady && myTurn && status === "active" && (
                      <div className="pt-3 border-t border-border/60">
                        <button onClick={requestHint} disabled={hintLoading}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all disabled:opacity-50 border border-border">
                          {hintLoading ? <span className="w-3.5 h-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
                          Gợi ý nước đi tốt nhất
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* LIVE PERSONALIZATION STYLING TAB */}
                {sidebarTab === "settings" && (
                  <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    <div className="space-y-3.5">
                      {/* App Theme */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Giao diện ứng dụng</label>
                        <select
                          value={appTheme}
                          onChange={(e) => changeAppTheme(e.target.value)}
                          className="w-full text-xs rounded-xl px-3 py-2 border border-border bg-background focus:outline-none"
                        >
                          {APP_THEMES.map(theme => (
                            <option key={theme.id} value={theme.id}>{theme.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Board Theme */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Giao diện bàn cờ</label>
                        <select
                          value={boardTheme}
                          onChange={(e) => changeBoardTheme(e.target.value)}
                          className="w-full text-xs rounded-xl px-3 py-2 border border-border bg-background focus:outline-none"
                        >
                          {BOARD_THEMES.map(b => (
                            <option key={b.id} value={b.id}>{b.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Piece Themes */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Quân của tôi</label>
                          <select
                            value={myPieceTheme}
                            onChange={(e) => changeMyPieceTheme(e.target.value)}
                            className="w-full text-xs rounded-xl px-3 py-2 border border-border bg-background focus:outline-none"
                          >
                            {PIECE_THEMES.map(p => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Quân đối thủ</label>
                          <select
                            value={oppPieceTheme}
                            onChange={(e) => changeOppPieceTheme(e.target.value)}
                            className="w-full text-xs rounded-xl px-3 py-2 border border-border bg-background focus:outline-none"
                          >
                            {PIECE_THEMES.map(p => (
                              <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Move Highlight */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Màu nước đi cuối</label>
                        <select
                          value={highlightTheme}
                          onChange={(e) => changeHighlightTheme(e.target.value)}
                          className="w-full text-xs rounded-xl px-3 py-2 border border-border bg-background focus:outline-none"
                        >
                          {HIGHLIGHT_THEMES.map(hl => (
                            <option key={hl.id} value={hl.id}>{hl.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Sound Pack */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Gói âm thanh</label>
                        <select
                          value={soundPack}
                          onChange={(e) => changeSoundPack(e.target.value)}
                          className="w-full text-xs rounded-xl px-3 py-2 border border-border bg-background focus:outline-none"
                        >
                          {SOUND_PACKS.map(sp => (
                            <option key={sp.id} value={sp.id}>{sp.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Border & Shadow */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Khung viền</label>
                          <select
                            value={boardBorder}
                            onChange={(e) => changeBoardBorder(e.target.value)}
                            className="w-full text-xs rounded-xl px-3 py-2 border border-border bg-background focus:outline-none"
                          >
                            {BORDER_STYLES.map(b => (
                              <option key={b.id} value={b.id}>{b.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">Đổ bóng</label>
                          <select
                            value={boardShadow}
                            onChange={(e) => changeBoardShadow(e.target.value)}
                            className="w-full text-xs rounded-xl px-3 py-2 border border-border bg-background focus:outline-none"
                          >
                            {SHADOW_STYLES.map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Coordinates & Auto Queen */}
                      <div className="pt-2 space-y-2 border-t border-border/40">
                        <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                          <span className="text-muted-foreground font-semibold">Hiện tọa độ (A-H, 1-8)</span>
                          <input
                            type="checkbox"
                            checked={showCoords}
                            onChange={(e) => changeShowCoords(e.target.checked)}
                            className="rounded border-border focus:ring-0 w-4 h-4 accent-foreground"
                          />
                        </label>

                        <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                          <span className="text-muted-foreground font-semibold">Tự động phong Hậu</span>
                          <input
                            type="checkbox"
                            checked={autoQueen}
                            onChange={(e) => changeAutoQueen(e.target.checked)}
                            className="rounded border-border focus:ring-0 w-4 h-4 accent-foreground"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MOBILE SETTINGS DRAWER ═════════════════════════════════════════════ */}
      {showSettingsModal && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowSettingsModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 bg-background border-t border-border rounded-t-3xl shadow-2xl transition-all duration-200"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: "75vh" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-bold leading-none">Cá nhân hóa</p>
                  <p className="text-[10px] text-muted-foreground">Tùy chỉnh giao diện & âm thanh</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4 text-left" style={{ maxHeight: "calc(75vh - 70px)" }}>
              {/* App Theme */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Giao diện ứng dụng</label>
                <div className="grid grid-cols-2 gap-2">
                  {APP_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => changeAppTheme(theme.id)}
                      className={`px-3 py-2 text-xs rounded-xl border font-medium transition-all ${
                        appTheme === theme.id
                          ? "bg-foreground text-background border-foreground font-bold"
                          : "bg-muted text-foreground border-border"
                      }`}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Board Theme */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Giao diện bàn cờ</label>
                <div className="grid grid-cols-2 gap-2">
                  {BOARD_THEMES.map(b => (
                    <button
                      key={b.id}
                      onClick={() => changeBoardTheme(b.id)}
                      className={`px-3 py-2 text-xs rounded-xl border font-medium transition-all ${
                        boardTheme === b.id
                          ? "bg-foreground text-background border-foreground font-bold"
                          : "bg-muted text-foreground border-border"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Piece Theme */}
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quân cờ của tôi</label>
                  <select
                    value={myPieceTheme}
                    onChange={(e) => changeMyPieceTheme(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2.5 border border-border bg-background focus:outline-none"
                  >
                    {PIECE_THEMES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quân cờ đối thủ</label>
                  <select
                    value={oppPieceTheme}
                    onChange={(e) => changeOppPieceTheme(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2.5 border border-border bg-background focus:outline-none"
                  >
                    {PIECE_THEMES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Move Highlight */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Màu nước đi cuối</label>
                <select
                  value={highlightTheme}
                  onChange={(e) => changeHighlightTheme(e.target.value)}
                  className="w-full text-xs rounded-xl px-3 py-2.5 border border-border bg-background focus:outline-none"
                >
                  {HIGHLIGHT_THEMES.map(hl => (
                    <option key={hl.id} value={hl.id}>{hl.label}</option>
                  ))}
                </select>
              </div>

              {/* Sound Pack */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Âm thanh</label>
                <select
                  value={soundPack}
                  onChange={(e) => changeSoundPack(e.target.value)}
                  className="w-full text-xs rounded-xl px-3 py-2.5 border border-border bg-background focus:outline-none"
                >
                  {SOUND_PACKS.map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.label}</option>
                  ))}
                </select>
              </div>

              {/* Border & Shadow */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Khung bàn cờ</label>
                  <select
                    value={boardBorder}
                    onChange={(e) => changeBoardBorder(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2.5 border border-border bg-background focus:outline-none"
                  >
                    {BORDER_STYLES.map(b => (
                      <option key={b.id} value={b.id}>{b.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Đổ bóng bàn cờ</label>
                  <select
                    value={boardShadow}
                    onChange={(e) => changeBoardShadow(e.target.value)}
                    className="w-full text-xs rounded-xl px-3 py-2.5 border border-border bg-background focus:outline-none"
                  >
                    {SHADOW_STYLES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="pt-3 border-t border-border space-y-3">
                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-muted-foreground font-semibold">Hiện tọa độ (A-H, 1-8)</span>
                  <input
                    type="checkbox"
                    checked={showCoords}
                    onChange={(e) => changeShowCoords(e.target.checked)}
                    className="rounded border-border focus:ring-0 w-4.5 h-4.5 accent-foreground"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-muted-foreground font-semibold">Tự động phong Hậu</span>
                  <input
                    type="checkbox"
                    checked={autoQueen}
                    onChange={(e) => changeAutoQueen(e.target.checked)}
                    className="rounded border-border focus:ring-0 w-4.5 h-4.5 accent-foreground"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE AI DRAWER ════════════════════════════════════════════════════ */}
      {showAIDrawer && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setShowAIDrawer(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 bg-background border-t border-border rounded-t-3xl shadow-2xl transition-all duration-200"
            onClick={e => e.stopPropagation()}
            style={{ maxHeight: "65vh" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">Trợ lý AI</p>
                  <p className="text-[10px] text-muted-foreground">Stockfish phân tích thời gian thực</p>
                </div>
              </div>
              {mode !== "bot" || botLevel !== 1 ? (
                <button onClick={() => { const n=!aiAssistant; setAiAssistant(n); if(!n){setMoveInsight(null);setHintMove(null);} }}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    aiAssistant ? "bg-foreground text-background" : "bg-muted text-muted-foreground border border-border"
                  }`}>
                  {aiAssistant ? "Bật" : "Tắt"}
                </button>
              ) : (
                <span className="px-2.5 py-1 bg-muted text-foreground border border-border rounded-lg text-[9px] font-black uppercase tracking-wider">Tutorial</span>
              )}
            </div>

            <div className="overflow-y-auto p-5 space-y-4 text-left" style={{ maxHeight: "calc(65vh - 100px)" }}>
              {aiAssistant && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Đánh giá vị thế</span>
                      <span className="font-mono font-bold text-foreground text-[11px]">{evalLabel}</span>
                    </div>
                    <div className="h-4 rounded-full overflow-hidden bg-muted border border-border flex relative">
                      <div className="h-full bg-foreground transition-all duration-500 rounded-l-full"
                        style={{ width: `${getWhitePercentage()}%` }} />
                      <div className="absolute top-0 bottom-0 left-1/2 -ml-px w-0.5 bg-border/40" />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>Đen</span><span>Trắng</span>
                    </div>
                  </div>

                  {moveInsight && (
                    <div className="p-3 rounded-2xl border border-border bg-muted/40 text-sm space-y-1.5">
                      <div className="flex justify-between font-bold text-xs">
                        <span className="text-muted-foreground">Nước của {moveInsight.mover}</span>
                        <span className="font-mono text-foreground">{moveInsight.move}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Đánh giá:</span>
                        <span className={INSIGHT_CLASSES[moveInsight.type] || ""}>
                          {moveInsight.text}
                        </span>
                      </div>
                    </div>
                  )}

                  {sfReady && myTurn && status === "active" && (
                    <button onClick={() => { requestHint(); setShowAIDrawer(false); }} disabled={hintLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-foreground hover:bg-foreground/90 text-background text-sm font-bold transition-all disabled:opacity-50">
                      {hintLoading ? <span className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                      Gợi ý nước đi tốt nhất
                    </button>
                  )}
                </>
              )}

              {!aiAssistant && (
                <div className="text-center py-6 text-muted-foreground">
                  <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Bật AI để xem phân tích</p>
                  <p className="text-xs mt-1">Stockfish sẽ đánh giá từng nước đi</p>
                </div>
              )}

              {moves.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lịch sử nước đi</p>
                  <MoveList moves={moves} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ DRAW OFFER MODAL ════════════════════════════════════════════════════ */}
      {drawOffer && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-80 bg-background border border-border rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground border border-border">
            <Handshake className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="font-bold text-base">Đề nghị hòa cờ</p>
            <p className="text-xs text-muted-foreground mt-0.5">Đối thủ của bạn đang đề nghị hòa cờ.</p>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={() => { setDrawOffer(false); wsRef.current?.send(JSON.stringify({type:"draw_decline"})); }}
              className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold transition-all">Từ chối</button>
            <button onClick={() => { setDrawOffer(false); wsRef.current?.send(JSON.stringify({type:"draw_accept"})); }}
              className="flex-1 py-3 rounded-xl bg-foreground hover:bg-foreground/90 text-background text-xs font-bold transition-all">Đồng ý</button>
          </div>
        </div>
      )}

      {/* ══ PROMOTION DIALOG ════════════════════════════════════════════════════ */}
      {pendingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <p className="text-xs font-black text-center uppercase tracking-widest text-muted-foreground">Phong quân thành</p>
            <div className="flex gap-2">
              {["q","r","b","n"].map(p => (
                <button key={p} onClick={() => doPromo(p)}
                  className="w-16 h-16 bg-muted hover:bg-foreground hover:text-background border border-border rounded-2xl flex items-center justify-center transition-all active:scale-95">
                  <div style={{
                    width: 44, height: 44,
                    backgroundImage: `url('https://lichess1.org/assets/piece/${whitePieceTheme}/${playerColor === "white" ? "w" : "b"}${p.toUpperCase()}.svg')`,
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center",
                  }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ RESULT MODAL ════════════════════════════════════════════════════════ */}
      {status === "finished" && result && !rematchRequested && !rematchOffered && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-card border border-border rounded-t-3xl md:rounded-3xl w-full md:max-w-sm shadow-2xl overflow-hidden animate-in fade-in-50 slide-in-from-bottom-10 duration-200">
            <div className={`h-1.5 w-full ${
              !result.winner ? "bg-foreground/30" : result.winner === playerColor ? "bg-foreground" : "bg-muted-foreground/40"
            }`} />

            <div className="p-8 text-center space-y-5">
              <div className="flex justify-center items-center select-none text-muted-foreground">
                {!result.winner ? (
                  <Handshake className="w-16 h-16" strokeWidth={1.5} />
                ) : result.winner === playerColor ? (
                  <Trophy className="w-16 h-16 text-foreground" strokeWidth={1.5} />
                ) : (
                  <Frown className="w-16 h-16" strokeWidth={1.5} />
                )}
              </div>
              <div className="space-y-1">
                <h2 className="font-black text-2xl">
                  {!result.winner ? "Hòa cờ!" : result.winner === playerColor ? "Bạn thắng!" : "Bạn thua!"}
                </h2>
                <p className="text-sm text-muted-foreground">{REASON[result.reason] || result.reason}</p>
                {result.ratingChange != null && (
                  <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-xl text-sm font-black border ${
                    result.ratingChange >= 0
                      ? "bg-foreground text-background border-foreground"
                      : "bg-muted text-foreground border-border"
                  }`}>
                    {result.ratingChange >= 0 ? "+" : ""}{result.ratingChange} JOY
                  </div>
                )}
              </div>

              {moves.length > 0 && (
                <button onClick={copyPGN}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold text-muted-foreground border border-border transition-all">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Đã sao chép PGN!" : "Sao chép ván đấu (PGN)"}
                </button>
              )}

              <div className="flex gap-3">
                <button onClick={onBack} className="flex-1 py-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-all border border-border">Về sảnh</button>
                <button onClick={requestRematch} className="flex-1 py-3.5 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-bold text-xs transition-all">Đấu lại</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
