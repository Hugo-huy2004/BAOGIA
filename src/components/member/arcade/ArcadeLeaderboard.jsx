import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { fetchLeaderboard } from "../../../services/arcadeApi";

// Tên mặc định truyền từ ngoài vào: hàm này thuần xử lý chuỗi, không được
// giữ chữ của một ngôn ngữ cụ thể.
function fixUtf8(str, fallback) {
  if (!str) return fallback;
  let name = String(str);
  try {
    if (/[\u00C0-\u00FF]/.test(name)) {
      const decoded = decodeURIComponent(escape(name));
      if (decoded && !decoded.includes("�")) name = decoded;
    }
  } catch {}
  return name.replace(/[\uFFFD\u007F-\u009F]/g, "").trim() || fallback;
}

function Crown3DLuminescent() {
  return (
    <svg
      className="w-11 h-11 animate-bounce drop-shadow-[0_0_20px_rgba(251,191,36,0.95)]"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="crownLuminousSingle" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#FCD34D" />
          <stop offset="80%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <filter id="singleColorGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 3D Base Rim */}
      <path
        d="M 12 48 C 12 46, 52 46, 52 48 L 50 54 C 50 56, 14 56, 14 54 Z"
        fill="url(#crownLuminousSingle)"
        filter="url(#singleColorGlow)"
      />
      <ellipse cx="32" cy="48" rx="19" ry="2.5" fill="#FFFFFF" opacity="0.8" />

      {/* 3D Crown Faceted Peaks */}
      <path
        d="M 12 48 L 8 22 L 22 34 L 32 14 L 42 34 L 56 22 L 52 48 Z"
        fill="url(#crownLuminousSingle)"
        stroke="#FFFBEB"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#singleColorGlow)"
      />

      {/* 3D Center Facet Highlight */}
      <path
        d="M 32 14 L 22 34 L 32 48 L 42 34 Z"
        fill="#FFFFFF"
        opacity="0.35"
      />

      {/* Luminous Single Color Glowing Spheres */}
      <circle cx="8" cy="22" r="3.5" fill="#FFFFFF" />
      <circle cx="32" cy="14" r="4.5" fill="#FFFFFF" />
      <circle cx="56" cy="22" r="3.5" fill="#FFFFFF" />
    </svg>
  );
}

function AvatarInitials({ name, url, fallback, size = "w-10 h-10", border = "border border-white/20" }) {
  const cleanName = fixUtf8(name, fallback);
  if (url && (url.startsWith("http") || url.startsWith("/"))) {
    return (
      <div className={`${size} rounded-full ${border} overflow-hidden shrink-0 shadow-2xl bg-zinc-900 transition-transform duration-300 hover:scale-105`}>
        <img src={url} alt={cleanName} className="w-full h-full object-cover" />
      </div>
    );
  }
  const initials = cleanName.split(" ").slice(-2).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "HG";
  return (
    <div className={`${size} rounded-full bg-gradient-to-tr from-[#FF2D55] via-purple-600 to-indigo-600 ${border} font-black text-xs text-white flex items-center justify-center shrink-0 shadow-2xl transition-transform duration-300 hover:scale-105`}>
      {initials}
    </div>
  );
}

function getRankBadgeTitle(rank, score, t) {
  if (rank === 1) return { title: t("arcadeGame.rankSss"), bg: "bg-amber-400/15 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.2)]" };
  if (rank === 2) return { title: t("arcadeGame.rankSs"), bg: "bg-slate-300/15 border border-zinc-300/40 text-slate-200" };
  if (rank === 3) return { title: t("arcadeGame.rankS"), bg: "bg-amber-700/15 border border-amber-600/40 text-amber-400" };
  if (score >= 10000) return { title: t("arcadeGame.rankA"), bg: "bg-indigo-500/15 border border-indigo-400/40 text-indigo-300" };
  return { title: t("arcadeGame.rankB"), bg: "bg-zinc-800/50 border border-zinc-700/50 text-zinc-400" };
}

export default function ArcadeLeaderboard({ active = true }) {
  const { t } = useTranslation();
  const memberFallback = t("arcadeGame.hugoMember");
  const [lb, setLb]           = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef           = useRef(null);

  const fetchLb = useCallback(async () => {
    const list = await fetchLeaderboard("all", 20);
    setLb(list);
    setLoading(false);
  }, []);

  // Real-Time Polling every 5 seconds
  useEffect(() => {
    if (!active) { clearInterval(intervalRef.current); return; }
    setLoading(true);
    fetchLb();
    intervalRef.current = setInterval(fetchLb, 5000);
    return () => clearInterval(intervalRef.current);
  }, [active, fetchLb]);

  useEffect(() => {
    if (!active) return;
    const onVisible = () => { if (!document.hidden) fetchLb(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, fetchLb]);

  // Guaranteed 100% Unique Roster (Strict Top 10 Players)
  const uniqueRoster = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const item of lb) {
      const idKey = item._id ? String(item._id) : "";
      const emailKey = (item.email || "").toLowerCase().trim();
      const nameKey = fixUtf8(item.displayName || "", memberFallback).toLowerCase().trim();
      const primaryKey = idKey || emailKey || nameKey;
      if (primaryKey && !seen.has(primaryKey)) {
        seen.add(primaryKey);
        result.push(item);
      }
    }
    return result.slice(0, 10);
  }, [lb]);

  const top1 = uniqueRoster[0];
  const top2 = uniqueRoster[1];
  const top3 = uniqueRoster[2];

  const currentDateStr = new Date().toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="flex flex-col gap-6 text-white font-sans animate-fadeIn">

      {/* Dynamic Ambient Glassmorphism Mesh Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px]" />
      </div>

      {/* Apple Top 3 Hero Podium Stage (Real-Time, Fluid Bleeding Atmosphere) */}
      {top1 && (
        <div className="relative pt-14 pb-6 px-4 text-center [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)]">
          
          {/* Bleeding Radial Atmosphere Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#2e3373]/60 via-[#1d1f4a]/30 to-transparent -z-10 pointer-events-none blur-xl" />

          {/* 3-Player Podium Stage (Top 2 | Top 1 | Top 3) */}
          <div className="flex items-end justify-center gap-4 sm:gap-8 my-3 px-2">
            
            {/* Top 2 Player (Left Podium) */}
            {top2 ? (
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-slate-300 font-mono mb-1">
                  2<sup>ND</sup>
                </span>
                <AvatarInitials fallback={memberFallback}
                  name={top2.displayName}
                  url={top2.avatarUrl || top2.avatar}
                  size="w-16 h-16 sm:w-20 sm:h-20"
                  border="border-3 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.4)]"
                />
                <span className="text-xs font-bold text-slate-200 truncate max-w-[90px] mt-2">
                  {fixUtf8(top2.displayName, memberFallback)}
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-extrabold">
                  {(top2.bestScore || 0).toLocaleString("vi-VN")}
                </span>
              </div>
            ) : <div className="w-16 sm:w-20" />}

            {/* Top 1 Champion (Center High Podium) with 3D Luminescent Crown */}
            <div className="relative flex flex-col items-center -top-2">
              
              {/* 3D Single-Color Luminescent Crown */}
              <div className="absolute -top-10 z-20">
                <Crown3DLuminescent />
              </div>

              <span className="text-sm font-black text-amber-300 font-mono mb-1 tracking-tighter pt-2">
                1<sup>ST</sup>
              </span>
              <AvatarInitials fallback={memberFallback}
                name={top1.displayName}
                url={top1.avatarUrl || top1.avatar}
                size="w-24 h-24 sm:w-28 sm:h-28"
                border="border-4 border-[#7ce077] shadow-[0_0_40px_rgba(124,224,119,0.6)]"
              />
              <span className="text-sm font-black text-white truncate max-w-[120px] mt-2 drop-shadow-md">
                {fixUtf8(top1.displayName, memberFallback)}
              </span>
              <span className="text-xs font-mono font-black text-amber-300">
                {(top1.bestScore || 0).toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Top 3 Player (Right Podium) */}
            {top3 ? (
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-amber-500 font-mono mb-1">
                  3<sup>RD</sup>
                </span>
                <AvatarInitials fallback={memberFallback}
                  name={top3.displayName}
                  url={top3.avatarUrl || top3.avatar}
                  size="w-16 h-16 sm:w-20 sm:h-20"
                  border="border-3 border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.4)]"
                />
                <span className="text-xs font-bold text-slate-200 truncate max-w-[90px] mt-2">
                  {fixUtf8(top3.displayName, memberFallback)}
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-extrabold">
                  {(top3.bestScore || 0).toLocaleString("vi-VN")}
                </span>
              </div>
            ) : <div className="w-16 sm:w-20" />}
          </div>

          {/* Metallic Rank Badge Tag */}
          <div className={`inline-flex items-center gap-1.5 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 backdrop-blur-md ${getRankBadgeTitle(1, top1.bestScore, t).bg}`}>
            <span className="material-symbols-outlined text-xs">military_tech</span>
            <span>{getRankBadgeTitle(1, top1.bestScore, t).title}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 mb-0.5 drop-shadow-md">
            {t("arcadeGame.lbWinner", { name: fixUtf8(top1.displayName, memberFallback) })}
          </h2>

          <p className="text-xs text-indigo-200/90 font-medium">
            {t("arcadeGame.lbRealtime", { date: currentDateStr })}
          </p>
        </div>
      )}

      {/* Roster Header Bar */}
      <div className="flex items-center justify-between px-3 -mt-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF2D55] animate-pulse shadow-[0_0_12px_#FF2D55] shrink-0" />
          <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 truncate">
            {t("arcadeGame.lbBoard")}
          </span>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 pl-2">
          LIVE
        </span>
      </div>

      {/* Roster Table — Apple Glass Flat List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-400 text-xs">
          <span className="material-symbols-outlined animate-spin text-2xl mr-2 text-white">refresh</span>
          {t("arcadeGame.lbLoading")}
        </div>
      ) : uniqueRoster.length === 0 ? (
        <div className="text-center py-12 rounded-3xl bg-white/5 border border-white/10 text-zinc-400 text-xs">
          Chưa có điểm số nào. Hãy mở ván game đầu tiên!
        </div>
      ) : (
        <div className="rounded-[32px] bg-[#141633]/85 border border-white/10 overflow-hidden backdrop-blur-3xl shadow-2xl">
          {uniqueRoster.map((p, i) => {
            const cleanName = fixUtf8(p.displayName, memberFallback);
            const isRank1 = i === 0;
            const isRank2 = i === 1;
            const isRank3 = i === 2;
            const badge = getRankBadgeTitle(i + 1, p.bestScore, t);

            return (
              <div
                key={p._id ? `user_id_${p._id}` : p.email ? `user_email_${p.email}_${i}` : `user_rank_${i}`}
                className={`flex items-center justify-between px-5 py-4 border-b border-white/5 last:border-b-0 transition-colors ${
                  isRank1 ? "bg-amber-400/10" : isRank2 ? "bg-slate-300/5" : isRank3 ? "bg-amber-700/5" : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Rank Number */}
                  <span className={`font-mono text-base font-black w-6 text-center shrink-0 ${
                    isRank1 ? "text-amber-400 text-lg" : isRank2 ? "text-slate-300" : isRank3 ? "text-amber-600" : "text-zinc-500"
                  }`}>
                    {i + 1}
                  </span>

                  <AvatarInitials fallback={memberFallback} name={cleanName} url={p.avatarUrl || p.avatar} size="w-11 h-11" />

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black tracking-tight truncate text-white">
                        {cleanName}
                      </span>
                      {isRank1 && <span className="text-xs">👑</span>}
                    </div>
                    <span className="text-[10px] text-indigo-300/70 font-medium">
                      {badge.title} • {t("arcadeGame.lbMatches", { count: p.gamesPlayed || 1 })}
                    </span>
                  </div>
                </div>

                {/* Achievement Dots & Total Score */}
                <div className="flex items-center gap-3 shrink-0 pl-2 font-mono">
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className={isRank1 ? "text-amber-400" : "text-emerald-400"}>✓</span>
                    <span className={isRank1 ? "text-amber-400" : "text-emerald-400"}>✓</span>
                    <span className="text-indigo-400">●</span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className={`text-base font-black ${isRank1 ? "text-amber-300" : "text-white"}`}>
                      {(p.bestScore || 0).toLocaleString("vi-VN")}
                    </span>
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">
                      {t("arcadeGame.lbTotalScore")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
