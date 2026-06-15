import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bot, Users, Link2, Clock, Trophy, Crown, ChevronRight, Swords } from "lucide-react";

const TIME_CONTROLS = [
  { label:"1 phút",  value:60,   tag:"Bullet",    tagCls:"text-red-600 bg-red-500/10 dark:text-red-400" },
  { label:"3 phút",  value:180,  tag:"Blitz",     tagCls:"text-orange-600 bg-orange-500/10 dark:text-orange-400" },
  { label:"5 phút",  value:300,  tag:"Blitz",     tagCls:"text-orange-600 bg-orange-500/10 dark:text-orange-400" },
  { label:"10 phút", value:600,  tag:"Rapid",     tagCls:"text-emerald-700 bg-emerald-500/10 dark:text-emerald-400" },
  { label:"15 phút", value:900,  tag:"Rapid",     tagCls:"text-emerald-700 bg-emerald-500/10 dark:text-emerald-400" },
  { label:"30 phút", value:1800, tag:"Classical", tagCls:"text-blue-700 bg-blue-500/10 dark:text-blue-400" },
];

const MODES = [
  { id:"bot",    Icon:Bot,   title:"Chơi với Bot",     desc:"Luyện tập cùng Stockfish AI" },
  { id:"random", Icon:Users, title:"Đấu ngẫu nhiên",  desc:"Ghép đối thủ tự động theo ELO" },
  { id:"friend", Icon:Link2, title:"Tạo phòng riêng", desc:"Chia sẻ link mời bạn bè" },
];

function tier(r) {
  if (r >= 2000) return { label:"Master",   cls:"text-violet-700 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" };
  if (r >= 1600) return { label:"Expert",   cls:"text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20" };
  if (r >= 1400) return { label:"Advanced", cls:"text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
  if (r >= 1200) return { label:"Inter",    cls:"text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" };
  return               { label:"Beginner",  cls:"text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20" };
}

export default function ChessLobby({ onStartGame, onJoinRoom }) {
  const navigate = useNavigate();
  const [mode, setMode]       = useState(null);
  const [tc, setTc]           = useState(300);
  const [botLv, setBotLv]     = useState(3);
  const [color, setColor]     = useState("random");
  const [code, setCode]       = useState("");
  const [tab, setTab]         = useState("play");
  const [lb, setLb]           = useState([]);
  const [loadingLb, setLoadingLb] = useState(true);

  useEffect(() => {
    fetch("/api/chess/leaderboard?limit=20")
      .then(r => r.json())
      .then(d => setLb(d.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoadingLb(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f0ede6] dark:bg-[#0b0a0f] text-zinc-900 dark:text-zinc-100">

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 dark:bg-[#111019]/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Swords className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-base">HugoChess</span>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            {[{id:"play",label:"Chơi"},{id:"rank",label:"BXH"}].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === t.id
                    ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* ── Play tab ── */}
        {tab === "play" && (
          <>
            {!mode ? (
              <>
                {/* Mode selection */}
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">Chế độ chơi</p>
                <div className="space-y-2">
                  {MODES.map(({ id, Icon, title, desc }) => (
                    <button
                      key={id}
                      onClick={() => setMode(id)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#111019] border-2 border-transparent hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-md transition-all text-left group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{title}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>

                {/* Join by code */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#111019] shadow-sm space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nhập mã phòng</p>
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6))}
                      placeholder="ABCD12"
                      className="flex-1 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                    />
                    <button
                      onClick={() => code.length === 6 && onJoinRoom(code)}
                      disabled={code.length !== 6}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold transition-all shadow-md shadow-indigo-500/20"
                    >
                      Vào
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setMode(null)}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Quay lại
                </button>

                {/* Time control */}
                <div className="p-4 rounded-2xl bg-white dark:bg-[#111019] shadow-sm space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Thời gian mỗi bên
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_CONTROLS.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setTc(t.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          tc === t.value
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15"
                            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-600"
                        }`}
                      >
                        <p className={`font-bold text-sm ${tc === t.value ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                          {t.label}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${t.tagCls}`}>
                          {t.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bot level */}
                {mode === "bot" && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111019] shadow-sm space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                      <Bot className="w-3 h-3" /> Độ khó Stockfish
                    </p>
                    <div className="grid grid-cols-8 gap-1.5">
                      {[1,2,3,4,5,6,7,8].map(lv => (
                        <button
                          key={lv}
                          onClick={() => setBotLv(lv)}
                          className={`aspect-square rounded-xl border-2 text-sm font-black transition-all ${
                            botLv === lv
                              ? "border-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                              : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          {lv}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-400">1 = rất dễ · 8 = toàn lực</p>
                  </div>
                )}

                {/* Color pick */}
                {(mode === "bot" || mode === "friend") && (
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#111019] shadow-sm space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Màu quân</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v:"white",  label:"Trắng",     sym:"♔" },
                        { v:"random", label:"Ngẫu nhiên", sym:"⚡" },
                        { v:"black",  label:"Đen",        sym:"♚" },
                      ].map(c => (
                        <button
                          key={c.v}
                          onClick={() => setColor(c.v)}
                          className={`py-4 rounded-2xl border-2 text-center transition-all ${
                            color === c.v
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15"
                              : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          <div className="text-2xl mb-1 leading-none">{c.sym}</div>
                          <div className={`text-[10px] font-bold ${color === c.v ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-500"}`}>
                            {c.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Start button */}
                <button
                  onClick={() => onStartGame({ mode, timeControl: tc, botLevel: botLv, color })}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base shadow-xl shadow-indigo-500/25 transition-all active:scale-[0.98]"
                >
                  {mode === "bot" ? "Bắt đầu" : mode === "random" ? "Tìm đối thủ" : "Tạo phòng"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Leaderboard tab ── */}
        {tab === "rank" && (
          <div className="rounded-2xl bg-white dark:bg-[#111019] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-black text-sm">Bảng xếp hạng</span>
            </div>
            {loadingLb ? (
              <div className="py-16 flex justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : lb.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 text-sm">Chưa có người chơi nào</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {lb.map((p, i) => {
                  const t = tier(p.rating);
                  return (
                    <div key={p.email || i} className="flex items-center gap-3 px-4 py-3.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        i === 0 ? "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                        i === 1 ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-500" :
                        i === 2 ? "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400" :
                        "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}>
                        {i === 0 ? <Crown className="w-4 h-4" /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.displayName || "Ẩn danh"}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {p.gamesPlayed} ván · {p.wins}T {p.losses}B {p.draws}H
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-lg leading-tight">{p.rating}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${t.cls}`}>
                          {t.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
