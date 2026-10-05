import { useState, useEffect } from "react";
import { BotAvatar } from "bot-avatars";
import { BOT_TIERS } from "./game2048Logic";
import { fetchCollectionLeaderboard2048 } from "../../../../services/api/modules/arcadeApi";

export default function Game2048VaultModal({
  isOpen,
  onClose,
  unlockedVault = [],
}) {
  const [tab, setTab] = useState("vault"); // "vault" | "leaderboard"
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [hasFetchedLeaderboard, setHasFetchedLeaderboard] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (tab === "leaderboard" && !hasFetchedLeaderboard) {
      setLoadingLeaderboard(true);
      fetchCollectionLeaderboard2048()
        .then((list) => {
          setLeaderboard(Array.isArray(list) ? list : []);
          setHasFetchedLeaderboard(true);
        })
        .catch(() => {
          setLeaderboard([]);
        })
        .finally(() => {
          setLoadingLeaderboard(false);
        });
    }
  }, [isOpen, tab, hasFetchedLeaderboard]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-3 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Kho Nhân Vật Sưu Tầm"
    >
      <div className="max-w-[400px] w-full max-h-[92vh] bg-slate-900 border-2 border-cyan-400/60 rounded-3xl p-4 flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-cyan-400 text-lg">inventory_2</span>
            </div>
            <div>
              <h3 className="text-base font-black text-white leading-tight">Kho Nhân Vật Sưu Tầm</h3>
              <span className="text-[13px] text-cyan-300 font-bold">
                Đã mở: {unlockedVault.length}/20 nhân vật
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[13px] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Chuyển Tab */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <button
            type="button"
            onClick={() => setTab("vault")}
            className={`py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === "vault"
                ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-base">grid_view</span>
            Bộ Sưu Tập ({unlockedVault.length}/20)
          </button>
          <button
            type="button"
            onClick={() => setTab("leaderboard")}
            className={`py-2 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === "leaderboard"
                ? "bg-cyan-500 text-slate-950 shadow-md font-black"
                : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-base">leaderboard</span>
            Đua Top Sưu Tầm
          </button>
        </div>

        {/* Nội dung Tab */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
          {tab === "vault" ? (
            <div className="grid grid-cols-4 gap-2">
              {Object.values(BOT_TIERS).map((tItem) => {
                const isUnlocked = unlockedVault.includes(tItem.level);
                return (
                  <div
                    key={tItem.level}
                    className={`relative rounded-xl p-1.5 flex flex-col items-center justify-between text-center transition-all ${
                      isUnlocked
                        ? "bg-slate-950/80 border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                        : "bg-slate-950/40 border border-slate-800/50 opacity-40 grayscale"
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {isUnlocked ? (
                        <BotAvatar
                          type={tItem.type}
                          color={tItem.color}
                          face={tItem.face}
                          state="working"
                          shading={tItem.shading}
                          hat={tItem.hat}
                          glasses={tItem.glasses}
                          headphones={tItem.headphones}
                          bowTie={tItem.bowTie}
                          size={44}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-600 text-2xl">
                          lock
                        </span>
                      )}
                    </div>
                    <div className="w-full mt-1">
                      <div className="text-[13px] font-bold text-slate-200 truncate">
                        {isUnlocked ? tItem.name : `Cấp ${tItem.level}`}
                      </div>
                      <div className="text-[13px] text-cyan-400 font-mono font-bold">
                        {isUnlocked ? tItem.value.toLocaleString() : "???"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {loadingLeaderboard ? (
                <div className="py-8 text-center text-slate-400 text-[13px] flex flex-col items-center gap-2">
                  <span className="inline-block w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải bảng xếp hạng sưu tầm...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-[13px]">
                  Chưa có dữ liệu thi đấu sưu tầm
                </div>
              ) : (
                leaderboard.map((item, idx) => (
                  <div
                    key={item.userId || idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-[13px] ${
                      idx === 0
                        ? "bg-amber-500/10 border-amber-400/60"
                        : idx === 1
                        ? "bg-slate-300/10 border-slate-400/40"
                        : idx === 2
                        ? "bg-amber-700/10 border-amber-600/40"
                        : "bg-slate-950/60 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-black font-mono text-[13px] ${
                          idx === 0
                            ? "bg-amber-400 text-slate-950"
                            : idx === 1
                            ? "bg-slate-300 text-slate-950"
                            : idx === 2
                            ? "bg-amber-600 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white truncate max-w-[130px]">
                        {item.displayName || "Thành viên"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                        {item.collectionCount || 0}/20
                      </span>
                      <span className="font-mono text-slate-400">
                        {(item.bestScore || 0).toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
