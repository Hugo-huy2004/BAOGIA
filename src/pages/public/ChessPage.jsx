import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isMemberAuthenticated } from "../../services/authSession";
import ChessLobby from "../../components/chess/ChessLobby";
import ChessGame from "../../components/chess/ChessGame";

export default function ChessPage() {
  const { roomId, psychTab } = useParams();
  const activeRoom = roomId || psychTab;
  const navigate = useNavigate();

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
      } catch (_) {}
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
    if (window.location.pathname.includes("/member/utilities/chess")) {
      navigate(`/member/utilities/chess/${rid}`, { replace: true });
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
    if (window.location.pathname.includes("/member/utilities/chess")) {
      navigate("/member/utilities/chess", { replace: true });
    } else {
      navigate("/chess", { replace: true });
    }
  }

  return (
    <div className={`chess-container min-h-screen app-theme-${appTheme}`}>
      {screen === "lobby" && (
        <ChessLobby
          onStartGame={handleStartGame}
          onJoinRoom={handleJoinRoom}
          userInfo={userInfo}
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
      {screen === "game" && gameConfig && (
        <ChessGame
          config={gameConfig}
          roomId={activeRoomId}
          onBack={handleBack}
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          onRoomCreated={(id) => {
            setActiveRoomId(id);
            if (window.location.pathname.includes("/member/utilities/chess")) {
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
    </div>
  );
}
