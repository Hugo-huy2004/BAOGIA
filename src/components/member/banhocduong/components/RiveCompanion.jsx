import React, { useState } from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";

/**
 * RiveCompanion: Vivid interactive companion component for HugoPSY v2.0.0.
 * Includes a fallback layer with premium, GPU-accelerated CSS/SVG animations
 * representing the characters (Aura, Spark, Shadow) to ensure 100% runtime safety
 * and immediate artistic wow-factor.
 */
export default function RiveCompanion({ companion = "aura", state = "idle", className = "" }) {
  const [loadError, setLoadError] = useState(false);

  // Configure Rive runtime with local path. Fallbacks to artistic SVGs if loading fails.
  const { rive, RiveComponent } = useRive({
    src: `/assets/rive/${companion}.riv`,
    stateMachines: "State Machine 1",
    autoplay: true,
    onLoadError: () => setLoadError(true),
  });

  // Dynamic input trigger for Rive State Machines (e.g. change animation state based on props)
  const stateInput = useStateMachineInput(rive, "State Machine 1", "state");
  if (stateInput) {
    switch (state) {
      case "breath":
        stateInput.value = 1;
        break;
      case "happy":
        stateInput.value = 2;
        break;
      case "sad":
        stateInput.value = 3;
        break;
      default:
        stateInput.value = 0; // idle
    }
  }

  // Beautiful SVG Fallback when Rive files are missing, ensuring premium aesthetics
  const renderFallback = () => {
    switch (companion) {
      case "spark":
        return (
          <div className="relative w-full h-full flex items-center justify-center animate-pulse">
            {/* Soft background glow */}
            <div className="absolute w-[180px] h-[180px] bg-amber-400/20 rounded-full blur-[40px] animate-ping" style={{ animationDuration: "3s" }} />
            <svg viewBox="0 0 100 100" className="w-40 h-40 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <defs>
                <radialGradient id="sparkGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="60%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </radialGradient>
              </defs>
              <g className="animate-bounce" style={{ animationDuration: "2s" }}>
                {/* Flame / spark vector shape */}
                <path
                  d="M50,15 C55,35 75,50 75,65 C75,80 60,90 50,90 C40,90 25,80 25,65 C25,50 45,35 50,15 Z"
                  fill="url(#sparkGrad)"
                />
                <circle cx="50" cy="65" r="10" fill="#fff" className="opacity-80 blur-[2px]" />
              </g>
            </svg>
          </div>
        );
      case "shadow":
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Soft dark wisp glow */}
            <div className="absolute w-[160px] h-[160px] bg-purple-500/10 dark:bg-purple-900/20 rounded-full blur-[45px] animate-pulse" style={{ animationDuration: "4s" }} />
            <svg viewBox="0 0 100 100" className="w-36 h-36 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <defs>
                <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4c1d95" />
                  <stop offset="50%" stopColor="#1e1b4b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>
              <g className="animate-pulse" style={{ animationDuration: "3.5s" }}>
                {/* Rounded wisp body */}
                <ellipse cx="50" cy="55" rx="28" ry="24" fill="url(#shadowGrad)" />
                {/* Tail floating effect */}
                <path d="M50,79 C42,79 38,70 50,90 C62,70 58,79 50,79 Z" fill="#1e1b4b" />
                
                {/* Glowing violet anime-style eyes */}
                <ellipse cx="40" cy="52" rx="4" ry="6" fill="#a78bfa" className="animate-pulse" />
                <ellipse cx="60" cy="52" rx="4" ry="6" fill="#a78bfa" className="animate-pulse" />
                <circle cx="41" cy="50" r="1.5" fill="#fff" />
                <circle cx="61" cy="50" r="1.5" fill="#fff" />
              </g>
            </svg>
          </div>
        );
      case "aura":
      default:
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Glowing morphing cloud wisp */}
            <div className="absolute w-[190px] h-[190px] bg-sky-400/20 rounded-full blur-[50px] animate-pulse" />
            <svg viewBox="0 0 100 100" className="w-40 h-40 drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]">
              <defs>
                <radialGradient id="auraGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#e0f2fe" />
                  <stop offset="40%" stopColor="#38bdf8" />
                  <stop offset="85%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Soft morphing wisp circles */}
              <g className="animate-pulse" style={{ animationDuration: "5s" }}>
                <circle cx="50" cy="50" r="32" fill="url(#auraGrad)" />
                <circle cx="42" cy="45" r="15" fill="#e0f2fe" className="opacity-20 blur-[3px]" />
                <circle cx="58" cy="55" r="18" fill="#bae6fd" className="opacity-30 blur-[2px]" />
              </g>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      {loadError || !RiveComponent ? (
        renderFallback()
      ) : (
        <RiveComponent className="w-full h-full object-contain" />
      )}
    </div>
  );
}
