import React, { Suspense, lazy, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isMemberAuthenticated } from "../../services/authSession";
import { useFeatureGate } from "../../hooks/useFeatureGate";
import JoyExchangeModal from "../../components/member/shared/JoyExchangeModal";
import { useJoyStore } from "../../stores/joyStore";

const ChessLobby = lazy(() => import("../../components/chess/ChessLobby"));
const ChessGame = lazy(() => import("../../components/chess/ChessGame"));

// `embedded` + `initialRoomId` let HugoArcadeTab mount this as one of its
// games (Chess now lives inside Arcade, not as its own top-level utility) —
// room deep-links resolve to /member/utilities/arcade?game=chess&room=<id>
// instead of the old standalone /chess/:roomId path, and "back" returns to
// the Arcade lobby.
export default function ChessPage({ embedded = false, initialRoomId = null, onBack: onExitArcade, bio, onBioUpdate } = {}) {
  const { roomId, psychTab } = useParams();
  const activeRoom = roomId || psychTab || initialRoomId;
  const navigate = useNavigate();

  const { active: chessSubscribed } = useFeatureGate(bio, "hugoChess");
  const [showChessInvoice, setShowChessInvoice] = useState(false);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);

  const [screen, setScreen] = useState(activeRoom ? "game" : "lobby");
  const [boardTheme, setBoardTheme] = useState(() => localStorage.getItem("chess_board_theme") || "blue");
  const [myPieceTheme, setMyPieceTheme] = useState(() => localStorage.getItem("chess_my_piece_theme") || "maestro");
  const [oppPieceTheme, setOppPieceTheme] = useState(() => localStorage.getItem("chess_opp_piece_theme") || "maestro");

  // Decoupled personalization settings
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem("chess_app_theme") || "midnight");
  const [highlightTheme, setHighlightTheme] = useState(() => localStorage.getItem("chess_highlight_theme") || "yellow");
  const [soundPack, setSoundPack] = useState(() => localStorage.getItem("chess_sound_pack") || "classic");
  const [boardBorder, setBoardBorder] = useState(() => localStorage.getItem("chess_board_border") || "glow");
  const [boardShadow, setBoardShadow] = useState(() => localStorage.getItem("chess_board_shadow") || "3d");

  const [gameConfig, setGameConfig] = useState(
    activeRoom ? { mode: "friend", timeControl: 300 } : null
  );
  const [activeRoomId, setActiveRoomId] = useState(activeRoom || null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (isMemberAuthenticated()) {
      try {
        const s = JSON.parse(localStorage.getItem("price-doc-member-session") || "{}");
        if (s.email) {
          const defaultName = s.displayName || s.name || s.email.split("@")[0];
          setUserInfo({
            email: s.email,
            displayName: defaultName,
            rating: 1500,
            avatarUrl: s.avatarUrl || ""
          });

          const apiBase = import.meta.env.VITE_API_URL || '/api';

          // Initialize/persist user in the database (defaults to 1500 ELO if not existing)
          fetch(`${apiBase}/chess/rating/init`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: s.email,
              displayName: defaultName,
              avatarUrl: s.avatarUrl || ""
            })
          })
            .then(() => fetch(`${apiBase}/chess/stats?email=${encodeURIComponent(s.email)}`))
            .then(r => r.ok ? r.json() : null)
            .then(d => {
              if (d?.stats) {
                setUserInfo(p => ({
                  ...p,
                  rating: d.stats.rating ?? 1500,
                  avatarUrl: d.stats.avatar || p.avatarUrl || ""
                }));
              }
            })
            .catch(() => {});
        }
      } catch { /* ignore */ }
    } else {
      const gid = localStorage.getItem("chess_guest_id") || crypto.randomUUID();
      localStorage.setItem("chess_guest_id", gid);
      const storedGuestRating = localStorage.getItem("chess_guest_rating");
      const guestRating = storedGuestRating === null ? 1500 : Number(storedGuestRating);
      setUserInfo({ displayName: "Khách " + gid.slice(0, 4).toUpperCase(), guestId: gid, rating: guestRating });
    }
  }, []);

  function handleStartGame(cfg) {
    setGameConfig({ ...cfg });
    setScreen("game");
  }

  function handleJoinRoom(rid) {
    setActiveRoomId(rid);
    setGameConfig({
      mode: "friend",
      timeControl: 300
    });
    setScreen("game");
    if (embedded) {
      navigate(`/member/utilities/arcade?game=chess&room=${rid}`, { replace: true });
    } else {
      navigate(`/chess/${rid}`, { replace: true });
    }
  }

  function handleBack() {
    setScreen("lobby");
    setGameConfig(null);
    setActiveRoomId(null);
    // Restore user settings
    setBoardTheme(localStorage.getItem("chess_board_theme") || "blue");
    setAppTheme(localStorage.getItem("chess_app_theme") || "midnight");
    if (embedded) {
      navigate("/member/utilities/arcade?game=chess", { replace: true });
    } else {
      navigate("/chess", { replace: true });
    }
  }

  return (
    <div className={`chess-container${embedded ? " embedded" : ""} app-theme-${appTheme}`}>
      {/* Chess subscription paywall — only shown when launched from Arcade with
          a logged-in bio that has not yet subscribed to hugoChess. */}
      {embedded && bio && !chessSubscribed && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 120,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(160deg, #0f0f1a 0%, #1a1040 100%)",
          padding: "24px 20px",
        }}>
          {/* Decorative glow blobs */}
          <div style={{ position: "absolute", top: "10%", left: "20%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "15%", right: "15%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,.15) 0%, transparent 70%)", filter: "blur(24px)", pointerEvents: "none" }} />

          <div style={{ position: "relative", maxWidth: 420, width: "100%", textAlign: "center" }}>
            {/* Icon */}
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", boxShadow: "0 0 40px rgba(99,102,241,.4)",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#fff", fontVariationSettings: "'FILL' 1" }}>
                chess
              </span>
            </div>

            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#8b5cf6", marginBottom: 8 }}>
              Tính năng cao cấp
            </p>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>
              HugoChess
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginBottom: 24, lineHeight: 1.6 }}>
              Cờ vua đỉnh cao — chơi với AI, thách đấu bạn bè theo thời gian thực và leo bảng xếp hạng ELO.
            </p>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left" }}>
              {[
                ["psychology", "Đấu AI nhiều cấp độ — từ mới bắt đầu đến Grandmaster"],
                ["group", "Phòng đấu online — thách đấu bạn bè qua link"],
                ["leaderboard", "Bảng xếp hạng ELO — theo dõi tiến bộ thực sự"],
                ["palette", "Giao diện bàn cờ & quân cờ tuỳ chỉnh đầy đủ"],
              ].map(([icon, text]) => (
                <div key={icon} style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 12,
                  background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.15)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#6366f1", fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>
                    {icon}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,.8)", lineHeight: 1.4 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: "#f59e0b" }}>299</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>JOY</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>mỗi tháng</div>
              </div>
            </div>

            <button
              onClick={() => setShowChessInvoice(true)}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontSize: 14, fontWeight: 800, letterSpacing: ".04em",
                boxShadow: "0 4px 24px rgba(99,102,241,.4)", transition: "transform .15s, box-shadow .15s",
              }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(.97)"}
              onMouseUp={e => e.currentTarget.style.transform = ""}
            >
              Mở khóa HugoChess
            </button>

            <button
              onClick={onExitArcade}
              style={{
                marginTop: 14, background: "none", border: "none", cursor: "pointer",
                color: "rgba(255,255,255,.35)", fontSize: 12, fontWeight: 600,
              }}
            >
              ← Về HugoArcade
            </button>
          </div>
        </div>
      )}

      <JoyExchangeModal
        open={showChessInvoice}
        bio={bio}
        item="hugoChess"
        onClose={() => setShowChessInvoice(false)}
        onConfirm={async () => {
          const apiBase = import.meta.env.VITE_API_URL || "/api";
          const res = await fetch(`${apiBase}/joy/subscribe-feature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: bio.email, featureKey: "hugoChess" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Lỗi trao đổi JOY.");
          return data;
        }}
        onSuccess={(result) => {
          if (bio?.email) fetchJoyBalance(bio.email);
          onBioUpdate?.({ ...bio, featureSubscriptions: { ...bio?.featureSubscriptions, hugoChess: { expiresAt: result.expiresAt, active: true } } });
        }}
      />

      {/* When in game screen (not lobby), show a floating quit button since
          ChessLobby's header handles the ← HugoArcade affordance on the lobby screen. */}
      {embedded && screen === "game" && (
        <button
          onClick={handleBack}
          className="fixed top-3 left-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-400/20 text-white text-[11px] font-bold backdrop-blur-md transition-all active:scale-95 shadow-lg"
          style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}
        >
          ✕ Thoát
        </button>
      )}
      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
        {screen === "lobby" && (
          <ChessLobby
            onStartGame={handleStartGame}
            onJoinRoom={handleJoinRoom}
            userInfo={userInfo}
            boardTheme={boardTheme}
            myPieceTheme={myPieceTheme}
            oppPieceTheme={oppPieceTheme}
            embedded={embedded}
            onBack={onExitArcade}
          />
        )}
        {screen === "game" && gameConfig && (
          <ChessGame
            config={gameConfig}
            roomId={activeRoomId}
            onBack={handleBack}
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            onRoomCreated={(id) => {
              setActiveRoomId(id);
              if (embedded) {
                // Only update the search params — navigating to a new path would
                // trigger the /chess/:roomId → arcade redirect in App.jsx, which
                // unmounts and remounts ChessGame and severs the WebSocket.
                const sp = new URLSearchParams(window.location.search);
                sp.set("room", id);
                navigate({ search: sp.toString() }, { replace: true });
              } else if (window.location.pathname.includes("/member/utilities/chess")) {
                navigate(`/member/utilities/chess/${id}`, { replace: true });
              } else {
                navigate(`/chess/${id}`, { replace: true });
              }
            }}
            boardTheme={boardTheme}
            setBoardTheme={setBoardTheme}
            myPieceTheme={myPieceTheme}
            setMyPieceTheme={setMyPieceTheme}
            oppPieceTheme={oppPieceTheme}
            setOppPieceTheme={setOppPieceTheme}
            appTheme={appTheme}
            setAppTheme={setAppTheme}
            highlightTheme={highlightTheme}
            setHighlightTheme={setHighlightTheme}
            soundPack={soundPack}
            setSoundPack={setSoundPack}
            boardBorder={boardBorder}
            setBoardBorder={setBoardBorder}
            boardShadow={boardShadow}
            setBoardShadow={setBoardShadow}
          />
        )}
      </Suspense>
    </div>
  );
}
