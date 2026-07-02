import React, { useEffect, useRef } from "react";
import {
  PCC_SLOT_SITES,
  PCC_MARKER_ANGLES,
  PCC_MARKER_RADIUS_FRAC,
  PCC_DATA_BYTES,
  encodeBytes,
  encodePayload,
} from "../../../utils/particleCloudCode";

// <ParticleGenerator data="..." background="#fff" /> — renders an arbitrary
// string as a continuously spinning "particle cloud code": glowing dots on
// concentric rings plus 3 brighter anchor dots.
//
// Why raw canvas inside useEffect (and refs, not state):
//   The whole animation runs in one requestAnimationFrame loop that mutates the
//   canvas directly. React never re-renders per frame, so it's smooth even on
//   low-end phones. The encoded bits are the ONLY thing driving which dots are
//   lit; rotation and the glow pulse never move a dot, so the ParticleScanner
//   always decodes it.
//
// Theming — the `background` prop makes the code blend into its surroundings:
//   • omitted            → self-contained deep-space disc with bright neon dots
//                          (the ornate "seal" look).
//   • a light color      → the disc is filled with that color and the dots turn
//                          dark & saturated (indigo/violet/pink) so they read on
//                          a light card.
//   • a dark color       → filled with that color, bright dots (like the disc).
//   Either way the ParticleScanner reads it (it detects dots by contrast in
//   both polarities), so blending in never breaks scanning.

// Bright palette (dots pop on a dark surface): near-white cores, neon halos.
const BRIGHT_CORE = "#f0fbff";
const BRIGHT_RING_GLOW = [
  "rgba(34,211,238,.95)",  // cyan
  "rgba(96,165,250,.95)",  // blue
  "rgba(244,114,182,.95)", // pink
];

// Dark palette (dots pop on a light surface): saturated colored cores.
const DARK_RING_CORE = ["#4338ca", "#7c3aed", "#db2777"]; // indigo / violet / pink
const DARK_RING_GLOW = [
  "rgba(79,70,229,.55)",
  "rgba(124,58,237,.55)",
  "rgba(219,39,119,.55)",
];

function colorLuminance(color) {
  if (!color || color === "transparent") return null;
  let r, g, b;
  if (color[0] === "#") {
    let h = color.slice(1);
    if (h.length === 3) h = h.split("").map(c => c + c).join("");
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else {
    const m = color.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m) return null;
    r = +m[1]; g = +m[2]; b = +m[3];
  }
  if ([r, g, b].some(v => Number.isNaN(v))) return null;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Accepts EITHER `bytes` (Uint8Array — the opaque server token, preferred for
// the secure JOY flow) or `data` (a plain string, generic use). `bytes` wins.
export default function ParticleGenerator({ bytes = null, data = "", size = 190, background, onEncodeError }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);
  const animRef = useRef(null);
  const bitsRef = useRef(null);

  // Encode -> bit layout whenever the input changes. Kept in a ref so the draw
  // loop reads the latest value without being torn down/restarted.
  useEffect(() => {
    try {
      bitsRef.current = bytes ? encodeBytes(bytes) : encodePayload(data ?? "");
    } catch (err) {
      bitsRef.current = null;
      onEncodeError?.(err);
      if (import.meta.env.DEV) {
        console.warn(`[ParticleGenerator] ${err.message} — data capacity is ${PCC_DATA_BYTES} bytes.`);
      }
    }
  }, [bytes, data, onEncodeError]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const disc = size / 2;                     // background disc fills the canvas
    // Dots are fixed-pixel (core up to ~6px + up to ~10px glow), so reserve a
    // margin and place ALL content — including the outermost anchors at
    // PCC_MARKER_RADIUS_FRAC — inside it. Otherwise the outer dots/anchors get
    // clipped by the round canvas edge. Shrinking is safe: the scanner recovers
    // scale from the anchors and samples rings by fraction, so it's relative.
    const margin = 20;
    const scale = (disc - margin) / PCC_MARKER_RADIUS_FRAC;

    // Resolve the theme once per (size/background) change.
    const bgLum = colorLuminance(background);
    const hasBg = bgLum != null;          // an explicit background color was given
    const lightBg = hasBg && bgLum > 140; // dots must be dark to show on it

    let active = true;
    let frame = 0;

    const draw = () => {
      if (!active) return;
      frame++;
      // ~0.35°/frame ≈ a full turn every ~17s at 60fps. Slow enough to keep
      // motion blur low for the camera (blur was killing decodes), but still
      // advancing so the scanner's liveness check sees real rotation.
      rotationRef.current = (rotationRef.current + 0.35) % 360;
      const rotation = rotationRef.current;

      // Global "breathing" pulse (anti-spoof flavor) — modulates glow/size only.
      const pulse = 0.9 + 0.1 * Math.sin(frame * 0.05);

      // Dots sized relative to scale so they stay large & well-separated at any
      // render size; anchors are clearly bigger (≈3.5× area) so the decoder can
      // always pick them as the 3 biggest blobs.
      const dotR = Math.max(2.5, scale * 0.04) * pulse;
      const markerR = Math.max(5, scale * 0.075) * pulse;

      ctx.clearRect(0, 0, size, size);

      // Background disc: fill with the requested color (blends into the card),
      // or fall back to the self-contained deep-space gradient.
      ctx.beginPath();
      ctx.arc(center, center, disc, 0, Math.PI * 2);
      if (hasBg) {
        ctx.fillStyle = background;
      } else {
        const bg = ctx.createRadialGradient(center, center * 0.9, size * 0.05, center, center, disc);
        bg.addColorStop(0, "#122046");
        bg.addColorStop(0.55, "#0a1230");
        bg.addColorStop(1, "#05060f");
        ctx.fillStyle = bg;
      }
      ctx.fill();

      // Ambient sparkle in the empty core (inside the innermost data ring, so
      // the decoder — which samples ring radii ≥ 0.3 — never sees them).
      for (let i = 0; i < 22; i++) {
        const seedAngle = (i * 137.5 + rotation * 0.4) % 360;
        const rNorm = ((i * 61) % 100) / 100;
        const r = scale * 0.2 * Math.sqrt(rNorm);
        const a = (seedAngle * Math.PI) / 180;
        const x = center + r * Math.cos(a);
        const y = center + r * Math.sin(a);
        const twinkle = 0.18 + 0.45 * Math.abs(Math.sin(((rotation + i * 20) * Math.PI) / 180));
        ctx.beginPath();
        ctx.arc(x, y, 1 + (i % 3) * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = lightBg
          ? `rgba(129,140,248,${twinkle * 0.7})`
          : `rgba(186,230,253,${twinkle})`;
        ctx.fill();
      }

      // Data dots — present iff the corresponding bit is 1. Sites carry their
      // own ring index & slot count (variable density) so we iterate the flat list.
      const bits = bitsRef.current;
      if (bits) {
        for (let k = 0; k < PCC_SLOT_SITES.length; k++) {
          if (!bits[k]) continue;
          const site = PCC_SLOT_SITES[k];
          const r = site.frac * scale;
          const a = (((360 / site.slots) * site.slot + rotation) * Math.PI) / 180;
          const x = center + r * Math.cos(a);
          const y = center + r * Math.sin(a);
          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = lightBg ? DARK_RING_CORE[site.ring % DARK_RING_CORE.length] : BRIGHT_CORE;
          ctx.shadowColor = lightBg
            ? DARK_RING_GLOW[site.ring % DARK_RING_GLOW.length]
            : BRIGHT_RING_GLOW[site.ring % BRIGHT_RING_GLOW.length];
          ctx.shadowBlur = lightBg ? 4 : 6;
          ctx.fill();
        }
      }

      // Orientation anchors — bigger/stronger; drive the decoder's center, scale
      // and rotation fit. Index 0 is largest = the reference.
      PCC_MARKER_ANGLES.forEach((baseAngle, idx) => {
        const a = ((baseAngle + rotation) * Math.PI) / 180;
        const r = PCC_MARKER_RADIUS_FRAC * scale;
        const x = center + r * Math.cos(a);
        const y = center + r * Math.sin(a);
        ctx.beginPath();
        // All anchors the same (big) size — the decoder tells them apart by
        // their asymmetric angular spacing, not by size (blur-robust).
        ctx.arc(x, y, markerR, 0, Math.PI * 2);
        if (lightBg) {
          ctx.fillStyle = idx === 0 ? "#312e81" : "#6d28d9"; // deep indigo / violet
          ctx.shadowColor = idx === 0 ? "rgba(49,46,129,.5)" : "rgba(109,40,217,.5)";
          ctx.shadowBlur = 5;
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = idx === 0 ? "rgba(125,211,252,.95)" : "rgba(244,114,182,.9)";
          ctx.shadowBlur = 10;
        }
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [size, background]);

  return <canvas ref={canvasRef} style={{ borderRadius: "50%", display: "block" }} />;
}
