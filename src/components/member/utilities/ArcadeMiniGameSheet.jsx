import React, { Suspense, lazy } from "react";
import { X, Play } from "lucide-react";

const Game2048 = lazy(() => import("../arcade/Game2048"));
const GameCaro = lazy(() => import("../arcade/GameCaro"));
const GameWordGuess = lazy(() => import("../arcade/GameWordGuess"));
const GameTetris = lazy(() => import("../arcade/GameTetris"));
const GameSnake = lazy(() => import("../arcade/GameSnake"));
const GameSpaceSurvivor = lazy(() => import("../arcade/GameSpaceSurvivor"));
const GameFlappyCyber = lazy(() => import("../arcade/GameFlappyCyber"));
const ChessGame = lazy(() => import("../arcade/GameChess3D"));

const GAME_COMPONENTS = {
  arcade_chess: ChessGame,
  arcade_2048: Game2048,
  arcade_caro: GameCaro,
  arcade_wordguess: GameWordGuess,
  arcade_tetris: GameTetris,
  arcade_snake: GameSnake,
  arcade_survivor: GameSpaceSurvivor,
  arcade_flappy: GameFlappyCyber,
};

const GAME_TITLES = {
  arcade_chess: "HugoChess Table 3D",
  arcade_2048: "2048 Mega Fusion",
  arcade_caro: "Caro 3×3 Arena",
  arcade_wordguess: "Mật Mã Từ 3D",
  arcade_tetris: "Hugo Tetris Neon",
  arcade_snake: "Hugo Snake 3D",
  arcade_survivor: "Space Survivor",
  arcade_flappy: "Hugo Flappy Cyber",
};

export default function ArcadeMiniGameSheet({ gameId, onClose }) {
  if (!gameId || !GAME_COMPONENTS[gameId]) return null;

  const GameComp = GAME_COMPONENTS[gameId];
  const title = GAME_TITLES[gameId] || "Hugo Arcade Mini Game";

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-4xl h-[92vh] max-h-[820px] bg-zinc-950 border border-white/20 rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative text-white">
        
        {/* iOS Sheet Header */}
        <div className="px-5 py-3.5 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <h3 className="ml-2 font-black text-sm text-white tracking-wide truncate">
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white active:scale-95 transition-all"
            title="Đóng game"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Game Body Canvas Area */}
        <div className="flex-1 w-full h-full overflow-y-auto relative p-4 flex flex-col items-center justify-center">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center space-y-3 py-16">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  Đang khởi chạy Arcade Game...
                </p>
              </div>
            }
          >
            <GameComp onExit={onClose} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
