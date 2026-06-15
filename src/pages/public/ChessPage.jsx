import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isMemberAuthenticated } from "../../services/authSession";
import ChessLobby from "../../components/chess/ChessLobby";
import ChessGame from "../../components/chess/ChessGame";

export default function ChessPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [screen, setScreen] = useState(roomId ? "game" : "lobby");
  const [gameConfig, setGameConfig] = useState(
    roomId ? { mode: "friend", timeControl: 300 } : null
  );
  const [activeRoomId, setActiveRoomId] = useState(roomId || null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (isMemberAuthenticated()) {
      try {
        const s = JSON.parse(localStorage.getItem("price-doc-member-session") || "{}");
        if (s.email) {
          setUserInfo({ email: s.email, displayName: s.name || s.email.split("@")[0], rating: 1200 });
          fetch(`/api/chess/stats?email=${encodeURIComponent(s.email)}`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d?.stats?.rating) setUserInfo(p => ({ ...p, rating: d.stats.rating })); })
            .catch(() => {});
        }
      } catch (_) {}
    } else {
      const gid = localStorage.getItem("chess_guest_id") || crypto.randomUUID();
      localStorage.setItem("chess_guest_id", gid);
      setUserInfo({ displayName: "Khách " + gid.slice(0, 4).toUpperCase(), guestId: gid });
    }
  }, []);

  function handleStartGame(cfg) { setGameConfig(cfg); setScreen("game"); }

  function handleJoinRoom(rid) {
    setActiveRoomId(rid);
    setGameConfig({ mode: "friend", timeControl: 300 });
    setScreen("game");
    navigate(`/chess/${rid}`, { replace: true });
  }

  function handleBack() {
    setScreen("lobby"); setGameConfig(null); setActiveRoomId(null);
    navigate("/chess", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {screen === "lobby" && (
        <ChessLobby onStartGame={handleStartGame} onJoinRoom={handleJoinRoom} userInfo={userInfo} />
      )}
      {screen === "game" && gameConfig && (
        <ChessGame config={gameConfig} roomId={activeRoomId} onBack={handleBack} userInfo={userInfo} />
      )}
    </div>
  );
}
