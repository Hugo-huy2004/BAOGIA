import React, { useEffect, useRef } from "react";

const THEME_COLORS = {
  default: [
    "rgba(99, 102, 241, 0.08)",   // Indigo
    "rgba(168, 85, 247, 0.08)",   // Purple
    "rgba(236, 72, 153, 0.06)",   // Pink
    "rgba(6, 182, 212, 0.06)"     // Cyan
  ],
  sunset: [
    "rgba(251, 146, 60, 0.09)",   // Peach Orange
    "rgba(244, 63, 94, 0.09)",    // Soft Coral
    "rgba(253, 224, 71, 0.07)",   // Amber Yellow
    "rgba(239, 68, 68, 0.06)"     // Soft Red
  ],
  cyberpunk: [
    "rgba(6, 182, 212, 0.09)",    // Cyber Cyan
    "rgba(236, 72, 153, 0.09)",   // Neon Pink
    "rgba(168, 85, 247, 0.07)",   // Electric Purple
    "rgba(219, 39, 119, 0.07)"    // Hot Magenta
  ],
  emerald: [
    "rgba(52, 211, 153, 0.08)",   // Mint
    "rgba(16, 185, 129, 0.08)",   // Sage Green
    "rgba(4, 120, 87, 0.06)",     // Forest Emerald
    "rgba(234, 179, 8, 0.06)"     // Soft Gold
  ],
  obsidian: [
    "rgba(30, 41, 59, 0.25)",     // Slate Black
    "rgba(15, 23, 42, 0.3)",      // Charcoal
    "rgba(71, 85, 105, 0.15)",    // Cool Grey
    "rgba(241, 245, 249, 0.04)"   // Mist White
  ]
};

export default function AuraBackground({ theme = "default" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = THEME_COLORS[theme] || THEME_COLORS.default;

    // Large slow moving gradient blobs for the animated aura backdrop
    const blobs = [
      { x: width * 0.25, y: height * 0.3, radius: Math.min(width, height) * 0.5, vx: 0.15, vy: 0.12, color: colors[0] }, // Color 1
      { x: width * 0.75, y: height * 0.6, radius: Math.min(width, height) * 0.55, vx: -0.10, vy: -0.15, color: colors[1] }, // Color 2
      { x: width * 0.5, y: height * 0.2, radius: Math.min(width, height) * 0.45, vx: 0.08, vy: -0.08, color: colors[2] }, // Color 3
      { x: width * 0.3, y: height * 0.8, radius: Math.min(width, height) * 0.6, vx: -0.08, vy: 0.08, color: colors[3] }    // Color 4
    ];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      blobs.forEach((blob, idx) => {
        blob.radius = Math.min(width, height) * (0.45 + (idx % 3) * 0.05);
      });
    };

    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      blobs.forEach((blob) => {
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce back inside bounds (+ padding)
        if (blob.x < -blob.radius || blob.x > width + blob.radius) blob.vx *= -1;
        if (blob.y < -blob.radius || blob.y > height + blob.radius) blob.vy *= -1;

        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, blob.radius
        );
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-90 dark:opacity-65"
      style={{ filter: "blur(60px)" }}
    />
  );
}
