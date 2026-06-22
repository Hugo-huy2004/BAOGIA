import React, { useState } from "react";
import DifficultySelector from "./DifficultySelector";
import GameResultOverlay from "./GameResultOverlay";
import { submitScore } from "../../../services/arcadeApi";
import { useJoyStore } from "../../../stores/joyStore";
import { HOW_TO_PLAY } from "./arcadeConstants";

// Owns the select -> playing -> result stage machine shared by all 3 arcade
// games, so each game component only needs to know how to play, not how to
// report. Renders the actual game via a render-prop so this stays game-agnostic.
export default function ArcadeGameFrame({ game, bio, children }) {
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
    <div className="rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-[#12111a] p-5 md:p-6 shadow-sm w-full">
      {stage === "select" && (
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 p-4 md:p-5">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">Cách chơi</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">{HOW_TO_PLAY[game]?.rule}</p>
          </div>
          <DifficultySelector game={game} onSelect={handleSelectDifficulty} />
        </div>
      )}

      {stage === "playing" && (
        <div key={playKey} className="flex justify-center">
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
