import React, { useState } from "react";
import DifficultySelector from "./DifficultySelector";
import GameResultOverlay from "./GameResultOverlay";
import { submitScore } from "../../../services/arcadeApi";
import { useJoyStore } from "../../../stores/joyStore";
import { HOW_TO_PLAY } from "./arcadeConstants";

// Owns the select -> playing -> result stage machine shared by all 3 arcade
// games, so each game component only needs to know how to play, not how to
// report. Renders the actual game via a render-prop so this stays game-agnostic.
export default function ArcadeGameFrame({ game, bio, onBioUpdate, children }) {
  const [stage, setStage] = useState("select"); // select | playing | result
  const [difficulty, setDifficulty] = useState(null);
  const [resultData, setResultData] = useState(null);
  // Bumped on every "Chơi lại" to force the game component to remount with fresh state.
  const [playKey, setPlayKey] = useState(0);

  const handleSelectDifficulty = (id) => {
    setDifficulty(id);
    setStage("playing");
  };

  const handleGameOver = async (score, result) => {
    const res = await submitScore(game, { score, difficulty, result }, bio);
    setResultData({
      score,
      result,
      joyDelta: res?.joyDelta ?? 0,
      joyAwarded: res?.joyAwarded ?? false,
      dailyCapReached: res?.dailyCapReached ?? false
    });
    setStage("result");
    // The result overlay above already reflects the JOY delta from this match's
    // response — this just refreshes the global JOY badge (header, etc.) that
    // reads from useJoyStore, same as ChessGame.jsx does after a match.
    if (res && bio?.email) useJoyStore.getState().fetchBalance(bio.email);
  };

  const handleReplay = () => {
    setPlayKey((k) => k + 1);
    setStage("playing");
    setResultData(null);
  };

  const handleChangeDifficulty = () => {
    setDifficulty(null);
    setResultData(null);
    setStage("select");
  };

  return (
    <div className="arcade-panel w-full">
      {stage === "select" && (
        <div className="flex flex-col gap-4">
          <div className="arcade-instruction">
            <span className="arcade-instruction-icon"><span className="material-symbols-outlined">lightbulb</span></span>
            <div><strong>Cách chơi</strong><p>{HOW_TO_PLAY[game]?.rule}</p></div>
          </div>
          <DifficultySelector game={game} bio={bio} onBioUpdate={onBioUpdate} onSelect={handleSelectDifficulty} />
        </div>
      )}

      {stage === "playing" && (
        <div key={playKey} className="flex justify-center min-w-0">
          {children(difficulty, handleGameOver)}
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
}
