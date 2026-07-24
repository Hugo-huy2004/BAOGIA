import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import DifficultySelector from "./DifficultySelector";
import GameResultOverlay from "./GameResultOverlay";
import { submitScore } from "../../../services/arcadeApi";
import { useJoyStore } from "../../../stores/joyStore";
import { HOW_TO_PLAY } from "./arcadeConstants";
import { useArcadeSound } from "../../../hooks/useArcadeSound";

// Owns the select -> playing -> result stage machine shared by all 3 arcade
// games, so each game component only needs to know how to play, not how to
// report. Renders the actual game via a render-prop so this stays game-agnostic.
// Exposes a `quit` imperative handle and an `onStageChange` callback so the
// parent (HugoArcadeTab) can switch the whole page into a locked fullscreen
// layout during "playing" — without that, swipe gestures meant for the game
// end up scrolling the page instead, which makes touch games unplayable.
const ArcadeGameFrame = forwardRef(function ArcadeGameFrame({ game, bio, onBioUpdate, children, onStageChange, onClose }, ref) {
  const [stage, setStage] = useState("select"); // select | playing | result
  const [difficulty, setDifficulty] = useState(null);
  const [resultData, setResultData] = useState(null);
  // Bumped on every "Chơi lại" to force the game component to remount with fresh state.
  const [playKey, setPlayKey] = useState(0);
  const sound = useArcadeSound();

  useEffect(() => { onStageChange?.(stage); }, [stage]);

  const handleSelectDifficulty = (id) => {
    sound.playBeep();
    setDifficulty(id);
    setStage("playing");
  };

  const handleGameOver = async (score, result) => {
    if (result === "win") {
      sound.playWin();
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      });
    } else {
      sound.playLose();
      const wrapper = document.querySelector(".arc-frame-wrapper");
      if (wrapper) {
        wrapper.animate([{ transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(-10px)" }, { transform: "translateX(10px)" }, { transform: "translateX(0)" }], { duration: 400 });
      }
    }

    const res = await submitScore(game, { score, difficulty, result }, bio);
    setResultData({
      score,
      result,
      joyDelta: res?.joyDelta ?? 0,
      joyAwarded: res?.joyAwarded ?? false,
      dailyCapReached: res?.dailyCapReached ?? false
    });
    setStage("result");
    if (res && bio?.email) useJoyStore.getState().fetchBalance(bio.email);
  };

  const handleReplay = () => {
    sound.playBeep();
    setPlayKey((k) => k + 1);
    setStage("playing");
    setResultData(null);
  };

  const handleChangeDifficulty = () => {
    sound.playBeep();
    setDifficulty(null);
    setResultData(null);
    setStage("select");
  };

  useImperativeHandle(ref, () => ({ quit: handleChangeDifficulty }));

  return (
    <div className="arc-frame-wrapper" style={{ width: "100%", maxWidth: stage === "playing" ? 640 : "100%", margin: "0 auto" }}>
      {stage === "select" && (
        <div className="arc-modal-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", padding: 16 }}>
           <div className="arc-modal-content" onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, padding: 0, animation: "arcModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
             <DifficultySelector game={game} bio={bio} onBioUpdate={onBioUpdate} onSelect={handleSelectDifficulty} />
           </div>
        </div>
      )}

      {stage === "playing" && (
        <div key={playKey} style={{ display: "flex", justifyContent: "center", minWidth: 0 }}>
          {children(difficulty, handleGameOver, sound)}
        </div>
      )}

      {stage === "result" && resultData && (
        <GameResultOverlay
          {...resultData}
          difficulty={difficulty}
          onReplay={handleReplay}
          onChangeDifficulty={handleChangeDifficulty}
        />
      )}
    </div>
  );
});

export default ArcadeGameFrame;
