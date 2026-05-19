import React from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";

export default function Footer() {
  const { data } = useData();

  const playPopSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio pop effect failed:", e);
    }
  };

  const brandLetters = [
    { char: "H", color: "#EF4444" },
    { char: "u", color: "#F97316" },
    { char: "g", color: "#EAB308" },
    { char: "o", color: "#22C55E" },
    { char: " ", color: "transparent" },
    { char: "S", color: "#3B82F6" },
    { char: "t", color: "#6366F1" },
    { char: "u", color: "#A855F7" },
    { char: "d", color: "#EC4899" },
    { char: "i", color: "#06B6D4" },
    { char: "o", color: "#0EA5E9" }
  ];

  return (
    <footer className="mt-12 md:mt-16 border-t border-slate-200/80 bg-white/80 py-10 text-slate-600 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#0d0a13]/90 dark:text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.3fr_0.9fr_0.8fr] lg:items-start">
        <div className="space-y-4 text-center lg:text-left">
          <Link
            to="/introduction"
            onClick={playPopSound}
            className="inline-flex items-center gap-3 transition-opacity duration-200 hover:opacity-85"
          >
            <span className="font-display text-[20px] font-black tracking-tight sm:text-[22px]">
              {brandLetters.map(({ char, color }) => (
                <span key={`${char}-${color}`} style={{ color }}>
                  {char}
                </span>
              ))}
            </span>
          </Link>
          <p className="mx-auto max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400 lg:mx-0">
            Trang cung cấp Bio và dịch vụ thiết kế website.
          </p>
        </div>

        <div className="text-center lg:text-left">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-500">
            Điều hướng
          </div>
          <ul className="space-y-2 text-sm font-medium">
            <li>
              <a href="/" onClick={playPopSound} className="transition-colors hover:text-slate-950 dark:hover:text-white">Giới Thiệu</a>
            </li>
            <li>
              <a href="/services" onClick={playPopSound} className="transition-colors hover:text-slate-950 dark:hover:text-white">Dịch Vụ</a>
            </li>
            <li>
              <a href="/booking" onClick={playPopSound} className="transition-colors hover:text-slate-950 dark:hover:text-white">Đặt Lịch</a>
            </li>
            <li>
              <a href="/login" onClick={playPopSound} className="transition-colors hover:text-slate-950 dark:hover:text-white">Đăng Nhập</a>
            </li>
          </ul>
        </div>

        <div className="space-y-4 text-center lg:text-right flex flex-col justify-between h-full">
          <div className="text-sm text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} {data.profile.shortName}. All rights reserved.
          </div>
          <div className="mt-auto pt-4 lg:pt-0">
            <Link to="/privacy-policy" className="text-[10px] text-slate-400/40 dark:text-slate-600/30 hover:text-slate-400 dark:hover:text-slate-500 transition-colors duration-300">
              Chính sách bảo mật & Quyền lợi khách hàng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
