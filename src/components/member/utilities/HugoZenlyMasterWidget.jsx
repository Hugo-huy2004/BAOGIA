import { useState, useEffect } from "react";
import { Zap, CloudSun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getMemberSession } from "../../../services/authSession";

export default function HugoZenlyMasterWidget({ bio }) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(new Date());

  // Real logged-in identity — bio first (has joyBalance), member session as
  // fallback for name/avatar. Never the old hardcoded dev defaults, which every
  // member saw because `data.member` is never populated.
  const session = getMemberSession();
  const userAvatar = bio?.avatarUrl || session?.avatarUrl || "/image/avt1.png";
  const userName = bio?.displayName || session?.displayName || session?.email?.split("@")[0] || t("utilities.library.memberFallback");
  const joyBalance = bio?.joyBalance ?? 0;
  const locale = i18n.resolvedLanguage === "en" ? "en-US" : "vi-VN";

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const dateStr = now.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "numeric"
  });

  return (
    <div className="apps-spectrum-hero relative w-full h-[150px] rounded-3xl p-4 sm:p-5 text-white overflow-hidden transition-transform duration-200 active:scale-[0.99] cursor-pointer flex flex-col justify-between text-left select-none">

      {/* ── TOP ROW: CLEAN AVATAR, USER NAME & WEATHER PILL ───────────────── */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Clean Avatar with Live Online Dot */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full border-2 border-white/90 overflow-hidden bg-white/20">
              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          </div>

          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">
              {userName}
            </h3>
            <p className="text-xs text-white/85 truncate -mt-0.5">
              {bio?.schoolName || bio?.location}
            </p>
          </div>
        </div>

        {/* Zenly Weather Capsule */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 backdrop-blur-md text-white text-xs font-medium shrink-0">
          <CloudSun className="w-3.5 h-3.5 text-amber-200" />
          <span>28°C · {t("utilities.library.weatherMildSun")}</span>
        </div>
      </div>

      {/* ── BOTTOM ROW: LIVE TIME & JOY BALANCE CHIP ─────────────────────── */}
      <div className="relative z-10 flex items-end justify-between gap-3">
        {/* Live Digital Clock & Date */}
        <div>
          <div className="text-3xl sm:text-4xl font-semibold font-mono tracking-tight text-white leading-none">
            {timeStr}
          </div>
          <span className="text-xs text-white/85 capitalize block mt-1">
            {dateStr}
          </span>
        </div>

        {/* Right JOY Balance Chip */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-black font-semibold text-xs shadow-sm active:scale-95 transition-all shrink-0">
          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{(joyBalance ?? 0).toLocaleString(locale)} JOY</span>
        </div>
      </div>

    </div>
  );
}
