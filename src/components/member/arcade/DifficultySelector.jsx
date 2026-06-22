import React from "react";
import { DIFFICULTIES, DIFFICULTY_STYLES, HOW_TO_PLAY } from "./arcadeConstants";

export default function DifficultySelector({ game, onSelect, title = "Chọn độ khó" }) {
  const objectives = HOW_TO_PLAY[game]?.objective || {};

  return (
    <div className="flex flex-col items-center gap-5 py-8">
      <p className="text-sm font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-xl">
        {DIFFICULTIES.map((d) => {
          const style = DIFFICULTY_STYLES[d.id];
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              className={`flex flex-col items-center gap-2 px-5 py-5 rounded-2xl border-2 transition-all active:scale-95 ${style.pillIdle}`}
            >
              <span className="text-lg font-black">{d.label}</span>
              {objectives[d.id] && (
                <span className="text-xs font-bold opacity-90 text-center leading-snug">{objectives[d.id]}</span>
              )}
              <span className="text-[11px] font-bold opacity-70">
                Thắng +{d.win} · Thua {d.lose} JOY
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
