import React, { useState, useEffect } from "react";
import SubUtilityHeader from "../SubUtilityHeader";
import ArcadeLeaderboard from "./ArcadeLeaderboard";
import ArcadeGameFrame from "./ArcadeGameFrame";
import Game2048 from "./Game2048";
import GameCaro from "./GameCaro";
import GameWordGuess from "./GameWordGuess";
import { fetchProfile } from "../../../services/arcadeApi";
import { HOW_TO_PLAY } from "./arcadeConstants";

const GAMES = [
  { id: "2048", icon: "grid_view", name: "2048" },
  { id: "caro", icon: "grid_3x3", name: "Caro" },
  { id: "wordguess", icon: "spellcheck", name: "Đoán Từ" }
];

const GAME_COMPONENTS = { "2048": Game2048, caro: GameCaro, wordguess: GameWordGuess };

export default function HugoArcadeTab({ onBack, bio }) {
  const [activeGame, setActiveGame] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!activeGame && bio?.email) fetchProfile(bio.email).then(setProfile);
  }, [activeGame, bio?.email]);

  if (!activeGame) {
    return (
      <div>
        <SubUtilityHeader title="HugoArcade" icon="stadium" colorClass="text-violet-500" onBack={onBack} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {GAMES.map((g) => {
            const best = profile?.[g.id]?.bestScore || 0;
            return (
              <button
                key={g.id}
                onClick={() => setActiveGame(g.id)}
                className="text-left p-5 md:p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-[#12111a] hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex flex-col gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">{g.icon}</span>
                </div>
                <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">{g.name}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{HOW_TO_PLAY[g.id]?.rule}</p>
                {best > 0 && (
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500">Điểm cao nhất: {best}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const gameInfo = GAMES.find((g) => g.id === activeGame);
  const GameComponent = GAME_COMPONENTS[activeGame];

  return (
    <div>
      <SubUtilityHeader title={gameInfo.name} icon={gameInfo.icon} colorClass="text-violet-500" onBack={() => setActiveGame(null)} />
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <ArcadeGameFrame game={activeGame} bio={bio}>
          {(difficulty, onGameOver) => (
            <GameComponent difficulty={difficulty} onGameOver={onGameOver} />
          )}
        </ArcadeGameFrame>
        <ArcadeLeaderboard game={activeGame} active={true} />
      </div>
    </div>
  );
}
