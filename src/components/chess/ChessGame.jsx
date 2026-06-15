import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessground } from "chessground";
import "chessground/assets/chessground.base.css";
import "./chess-theme.css";
import {
  ArrowLeft, Flag, Handshake, Volume2, VolumeX,
  Copy, Check, Wifi, WifiOff, Lightbulb,
} from "lucide-react";

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
function Board({ chess, onMove, orientation = "white", disabled, lastMove, hintMove }) {
  const containerRef = useRef(null);
  const cgRef        = useRef(null);
  const onMoveRef    = useRef(onMove);
  useEffect(() => { onMoveRef.current = onMove; }, [onMove]);

  const myColor   = orientation === "white" ? "white" : "black";
  const turnColor = chess.turn() === "w" ? "white" : "black";
  const canMove   = !disabled;

  // Mount once
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
            cgRef.current?.setShapes([]); // clear hint on move
          },
        },
      },
      lastMove:   lastMove ? [lastMove.from, lastMove.to] : undefined,
      animation:  { enabled: true, duration: 200 },
      highlight:  { lastMove: true, check: chess.inCheck() },
      coordinates: true,
      premovable:  { enabled: false },
      draggable:   { showGhost: true },
      drawable:    { enabled: true, visible: true, eraseOnClick: false },
    });
    return () => { cgRef.current?.destroy(); cgRef.current = null; };
  }, []); // eslint-disable-line

  // Sync board state
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

  // Show/clear hint arrow
  useEffect(() => {
    if (!cgRef.current) return;
    if (hintMove) {
      cgRef.current.setShapes([
        { orig: hintMove.from, dest: hintMove.to, brush: "paleBlue" },
      ]);
    } else {
      cgRef.current.setShapes([]);
    }
  }, [hintMove]);

  return (
    <div
      className="w-full rounded-xl overflow-hidden shadow-2xl"
      style={{ aspectRatio: "1", position: "relative" }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

// ── Stockfish ─────────────────────────────────────────────────────────────────
const SF_SRC = "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js";

function useStockfish(enabled, level) {
  const workerRef = useRef(null);
  const cbRef     = useRef(null);
  const genRef    = useRef(0);
  const [ready, setReady] = useState(false);

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
        w.postMessage(`setoption name Skill Level value ${Math.min(20, Math.max(0, (level - 1) * 2))}`);
        w.postMessage("isready");
        w.onmessage = e => {
          const line = String(e.data);
          if (line.includes("readyok")) setReady(true);
          if (line.startsWith("bestmove ")) {
            const mv = line.split(" ")[1];
            if (cbRef.current && mv && mv !== "(none)") { cbRef.current(mv); cbRef.current = null; }
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

  return [ask, ready];
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
function playFx(type) {
  if (type === "move")    { beep(520, 0.07); beep(380, 0.06, 0.08, "sine", 0.05); }
  if (type === "capture") { beep(200, 0.14, 0.18, "sawtooth"); beep(120, 0.1, 0.1, "sawtooth", 0.1); }
  if (type === "check")   { beep(880, 0.18, 0.09, "square"); }
  if (type === "win")     { [320,420,520,660].forEach((f,i) => beep(f, 0.2, 0.1, "sine", i*0.11)); }
  if (type === "lose")    { [400,300,200].forEach((f,i) => beep(f, 0.22, 0.1, "sine", i*0.17)); }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

// ── Player card ───────────────────────────────────────────────────────────────
function PlayerCard({ name, rating, color, isMe, active, ms, thinking }) {
  const danger = active && ms < 10000 && ms > 0;
  return (
    <div className={`flex items-center gap-3 transition-all duration-150 ${active ? "opacity-100" : "opacity-55"}`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 border-2 select-none ${
        isMe
          ? "bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/40"
          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
      }`}>
        {color === "white" ? "♔" : "♚"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm leading-tight truncate">{name}</p>
        {thinking ? (
          <p className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1.5 leading-tight">
            <span className="inline-flex gap-0.5 items-end">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            đang suy nghĩ...
          </p>
        ) : rating != null ? (
          <p className="text-[11px] text-zinc-400 font-mono leading-tight">{rating} ELO</p>
        ) : null}
      </div>
      <div className={`font-mono font-black tabular-nums rounded-xl border-2 px-3 py-1.5 min-w-[72px] text-center text-lg transition-all ${
        danger
          ? "bg-red-50 dark:bg-red-500/10 border-red-400 dark:border-red-500 text-red-600 dark:text-red-400 animate-pulse"
          : active
            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30"
            : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"
      }`}>
        {fmt(ms)}
      </div>
    </div>
  );
}

// ── Move list ─────────────────────────────────────────────────────────────────
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
              ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-bold"
              : "text-zinc-500 dark:text-zinc-400"
          }`}>
            <span className="text-zinc-300 dark:text-zinc-600">{p.n}.</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-200">{p.w}</span>
            {p.b && <span>{p.b}</span>}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const REASON = {
  checkmate: "Chiếu hết", resign: "Đầu hàng", timeout: "Hết giờ",
  stalemate: "Bất động",  draw: "Hòa cờ",     abort: "Hủy ván",
};

export default function ChessGame({ config, roomId: propRoomId, onBack, userInfo }) {
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
  const [whiteMs,     setWhiteMs]     = useState(timeControl * 1000);
  const [blackMs,     setBlackMs]     = useState(timeControl * 1000);
  const [status,      setStatus]      = useState("waiting");
  const [result,      setResult]      = useState(null);
  const [roomId,      setRoomId]      = useState(propRoomId || null);
  const [wsStatus,    setWsStatus]    = useState("disconnected");
  const [opponent,    setOpponent]    = useState(null);
  const [lastMove,    setLastMove]    = useState(null);
  const [soundOn,     setSoundOn]     = useState(true);
  const [drawOffer,   setDrawOffer]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [thinking,    setThinking]    = useState(false);
  const [hintMove,    setHintMove]    = useState(null);
  const [hintLoading, setHintLoading] = useState(false);

  const statusRef = useRef("waiting");
  const colorRef  = useRef(playerColor);
  const soundRef  = useRef(true);
  const wsRef     = useRef(null);
  const clockRef  = useRef(null);
  const clk       = useRef({ turn:"w", wMs: timeControl*1000, bMs: timeControl*1000, last:0 });
  const genRef    = useRef(0);

  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  useEffect(() => { colorRef.current = playerColor; }, [playerColor]);

  const snd = useCallback(t => { if (soundRef.current) playFx(t); }, []);
  const [getBotMove, sfReady] = useStockfish(mode === "bot", botLevel);

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
        clk.current.wMs = Math.max(0, clk.current.wMs - elapsed);
        setWhiteMs(clk.current.wMs);
        if (clk.current.wMs === 0) endGame({ winner:"black", reason:"timeout" });
      } else {
        clk.current.bMs = Math.max(0, clk.current.bMs - elapsed);
        setBlackMs(clk.current.bMs);
        if (clk.current.bMs === 0) endGame({ winner:"white", reason:"timeout" });
      }
    }, 100);
  }, [stopClock]); // eslint-disable-line

  const endGame = useCallback(res => {
    if (statusRef.current === "finished") return;
    stopClock();
    statusRef.current = "finished";
    setStatus("finished");
    setResult(res);
    setThinking(false);
    if (soundRef.current) {
      if (!res.winner) playFx("move");
      else if (res.winner === colorRef.current) playFx("win");
      else playFx("lose");
    }
  }, [stopClock]);

  const applyMove = useCallback((mv, newChess) => {
    const nt = newChess.turn();
    setChess(newChess);
    setMoves(prev => [...prev, mv.san]);
    setTurn(nt);
    setLastMove({ from: mv.from, to: mv.to });
    setHintMove(null);
    clk.current.turn = nt;
    clk.current.last = Date.now();
    snd(mv.flags.includes("c") || mv.flags.includes("e") ? "capture" : "move");
    if (newChess.inCheck()) snd("check");
    if (newChess.isGameOver()) {
      let winner = null, reason = "draw";
      if (newChess.isCheckmate()) { winner = mv.color === "w" ? "white" : "black"; reason = "checkmate"; }
      else if (newChess.isStalemate()) reason = "stalemate";
      endGame({ winner, reason });
    }
  }, [snd, endGame]);

  // Bot init
  useEffect(() => {
    if (mode !== "bot") return;
    statusRef.current = "active"; setStatus("active");
    clk.current = { turn:"w", wMs: timeControl*1000, bMs: timeControl*1000, last: Date.now() };
    startClock("w");
    return stopClock;
  }, []); // eslint-disable-line

  // Bot move with thinking delay
  useEffect(() => {
    if (mode !== "bot" || status !== "active" || !sfReady) return;
    const botClr = colorRef.current === "white" ? "b" : "w";
    if (turn !== botClr) return;

    const depth   = Math.min(15, botLevel * 2);
    const gen     = ++genRef.current;
    const fenNow  = chess.fen();
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

  // WebSocket
  useEffect(() => {
    if (mode === "bot") return;
    const wsUrl = import.meta.env.VITE_WS_URL
      ? import.meta.env.VITE_WS_URL.replace(/\/ws$/, "") + "/ws/chess"
      : import.meta.env.DEV
        ? "ws://127.0.0.1:8081/ws/chess"
        : `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws/chess`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    setWsStatus("connecting");

    ws.onopen = () => {
      setWsStatus("connected");
      const gid = localStorage.getItem("chess_guest_id") || crypto.randomUUID();
      localStorage.setItem("chess_guest_id", gid);
      ws.send(JSON.stringify({ type:"auth", email: userInfo?.email||null, displayName: userInfo?.displayName||"Khách", rating: userInfo?.rating||1200, guestId: gid }));
      if (propRoomId)             ws.send(JSON.stringify({ type:"join_room", roomId: propRoomId }));
      else if (mode === "friend") ws.send(JSON.stringify({ type:"create_room", timeControl, mode:"friend", color: preferColor||"random" }));
      else                        ws.send(JSON.stringify({ type:"create_room", timeControl, mode:"random" }));
    };

    ws.onmessage = e => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      switch (msg.type) {
        case "room_created":
          setRoomId(msg.roomId); setStatus("waiting");
          if (msg.color) { colorRef.current = msg.color; setPlayerColor(msg.color); }
          break;
        case "game_start":
        case "joined": {
          const myClr = msg.color || colorRef.current || "white";
          colorRef.current = myClr; setPlayerColor(myClr);
          setOpponent(myClr === "white" ? msg.black : msg.white);
          const ms = (msg.timeControl || timeControl) * 1000;
          clk.current = { turn:"w", wMs:ms, bMs:ms, last: Date.now() };
          setWhiteMs(ms); setBlackMs(ms);
          statusRef.current = "active"; setStatus("active");
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
          snd(msg.san.includes("x") ? "capture" : "move");
          if (msg.isCheck) snd("check");
          break;
        }
        case "game_over":
          endGame({ winner: msg.result==="1-0"?"white": msg.result==="0-1"?"black":null, reason:msg.reason, ratingChange:msg.ratingChange });
          break;
        case "draw_offer":            setDrawOffer(true);  break;
        case "draw_declined":         setDrawOffer(false); break;
        case "opponent_disconnected": setWsStatus("disconnected"); break;
        case "opponent_reconnected":  setWsStatus("connected");    break;
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
    const c = new Chess(chess.fen());
    let mv; try { mv = c.move({ from, to, promotion: isPromo ? "q" : undefined }); } catch { return; }
    if (!mv) return;
    applyMove(mv, c);
    if (mode !== "bot") wsRef.current?.send(JSON.stringify({ type:"move", from, to, promotion: isPromo ? "q" : undefined }));
  }

  async function requestHint() {
    if (hintLoading || status !== "active" || !sfReady) return;
    const myClr = playerColor === "white" ? "w" : "b";
    if (chess.turn() !== myClr) return;
    setHintLoading(true);
    const gen = ++genRef.current;
    const uci = await getBotMove(chess.fen(), 15, gen);
    setHintLoading(false);
    if (uci && uci !== "(none)") {
      setHintMove({ from: uci.slice(0,2), to: uci.slice(2,4) });
      setTimeout(() => setHintMove(null), 4000);
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
  function playAgain() {
    genRef.current++;
    const c = new Chess();
    setChess(c); setMoves([]); setTurn("w"); setLastMove(null);
    setResult(null); setHintMove(null);
    setWhiteMs(timeControl*1000); setBlackMs(timeControl*1000);
    clk.current = { turn:"w", wMs:timeControl*1000, bMs:timeControl*1000, last:Date.now() };
    statusRef.current = "active"; setStatus("active");
    startClock("w");
  }

  const oppColor      = playerColor === "white" ? "black" : "white";
  const myMs          = playerColor === "white" ? whiteMs : blackMs;
  const oppMs         = oppColor    === "white" ? whiteMs : blackMs;
  const myTurn        = turn === (playerColor === "white" ? "w" : "b");
  const boardDisabled = status !== "active" || !myTurn;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm truncate leading-tight">
              {mode === "bot" ? `Bot Lv${botLevel}` : mode === "friend" ? "Đấu bạn bè" : "Đấu ngẫu nhiên"}
            </p>
            {mode !== "bot" ? (
              <p className={`text-[10px] font-semibold flex items-center gap-1 leading-tight ${
                wsStatus === "connected" ? "text-emerald-500" : wsStatus === "connecting" ? "text-amber-500" : "text-red-500"
              }`}>
                {wsStatus === "connected" ? <Wifi className="w-2.5 h-2.5 shrink-0" /> : <WifiOff className="w-2.5 h-2.5 shrink-0" />}
                {wsStatus === "connected" ? "Đã kết nối" : wsStatus === "connecting" ? "Đang kết nối..." : "Mất kết nối"}
              </p>
            ) : !sfReady ? (
              <p className="text-[10px] font-semibold flex items-center gap-1 text-amber-500 leading-tight">
                <span className="w-2 h-2 border border-amber-500 border-t-transparent rounded-full animate-spin inline-block shrink-0" />
                Đang tải engine...
              </p>
            ) : (
              <p className="text-[10px] text-emerald-500 font-semibold leading-tight">Stockfish sẵn sàng</p>
            )}
          </div>
          <button onClick={() => setSoundOn(v => !v)} className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Game area */}
      <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3">

        <PlayerCard
          name={mode === "bot" ? `Stockfish Lv${botLevel}` : (opponent?.displayName || "Đang chờ...")}
          rating={mode !== "bot" ? opponent?.rating : undefined}
          color={oppColor} isMe={false}
          active={status === "active" && !myTurn}
          ms={oppMs}
          thinking={thinking}
        />

        <div className="relative">
          {status === "waiting" && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-xl gap-5">
              {mode === "friend" ? (
                <div className="text-center px-6 space-y-4">
                  <p className="font-black text-lg">Đang chờ đối thủ...</p>
                  <p className="text-sm text-zinc-500">Chia sẻ mã phòng cho bạn bè</p>
                  {roomId && (
                    <>
                      <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl inline-block">
                        <span className="font-mono text-3xl font-black tracking-[0.3em] text-indigo-700 dark:text-indigo-300">{roomId}</span>
                      </div>
                      <br />
                      <button onClick={copyLink} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Đã sao chép!" : "Sao chép link"}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="font-black">Đang tìm đối thủ...</p>
                  <p className="text-xs text-zinc-400">Ghép cặp theo ELO</p>
                </div>
              )}
            </div>
          )}
          <Board
            chess={chess}
            onMove={handleMove}
            orientation={playerColor}
            disabled={boardDisabled}
            lastMove={lastMove}
            hintMove={hintMove}
          />
        </div>

        <PlayerCard
          name={userInfo?.displayName || "Bạn"} rating={userInfo?.rating}
          color={playerColor} isMe
          active={status === "active" && myTurn}
          ms={myMs}
        />

        {status === "active" && (
          <div className="flex gap-2 pt-1">
            {sfReady && myTurn && (
              <button
                onClick={requestHint}
                disabled={hintLoading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-500 dark:hover:border-indigo-500 dark:hover:text-indigo-400 text-zinc-500 text-sm font-bold transition-all disabled:opacity-50"
              >
                {hintLoading
                  ? <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  : <Lightbulb className="w-4 h-4" />
                }
                Gợi ý
              </button>
            )}
            <button onClick={resign} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400 text-zinc-500 text-sm font-bold transition-all">
              <Flag className="w-4 h-4" /> Đầu hàng
            </button>
            <button onClick={offerDraw} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-400 hover:text-amber-500 dark:hover:border-amber-500 dark:hover:text-amber-400 text-zinc-500 text-sm font-bold transition-all">
              <Handshake className="w-4 h-4" /> Hòa
            </button>
          </div>
        )}

        {moves.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <p className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border">
              Lịch sử nước đi
            </p>
            <MoveList moves={moves} />
          </div>
        )}
      </div>

      {drawOffer && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center">
            <Handshake className="w-6 h-6 text-amber-500" />
          </div>
          <div className="text-center">
            <p className="font-black">Đề nghị hòa cờ</p>
            <p className="text-sm text-zinc-400 mt-0.5">Đối thủ muốn hòa ván này</p>
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={() => { setDrawOffer(false); wsRef.current?.send(JSON.stringify({ type:"draw_decline" })); }} className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-bold transition-all">
              Từ chối
            </button>
            <button onClick={() => { setDrawOffer(false); wsRef.current?.send(JSON.stringify({ type:"draw_accept" })); }} className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-all">
              Chấp nhận
            </button>
          </div>
        </div>
      )}

      {status === "finished" && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
            <div className="text-6xl mb-5 select-none">
              {!result.winner ? "🤝" : result.winner === playerColor ? "🏆" : "😔"}
            </div>
            <h2 className="text-2xl font-black mb-1">
              {!result.winner ? "Hòa cờ!" : result.winner === playerColor ? "Bạn thắng!" : "Bạn thua!"}
            </h2>
            <p className="text-sm text-zinc-400 font-medium">{REASON[result.reason] || result.reason}</p>
            {result.ratingChange != null && (
              <div className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-xl text-sm font-black ${
                result.ratingChange >= 0
                  ? "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400"
              }`}>
                {result.ratingChange >= 0 ? "+" : ""}{result.ratingChange} ELO
              </div>
            )}
            <div className="flex gap-3 mt-7">
              <button onClick={onBack} className="flex-1 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold transition-all">
                Về sảnh
              </button>
              {mode === "bot" && (
                <button onClick={playAgain} className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25">
                  Chơi lại
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
