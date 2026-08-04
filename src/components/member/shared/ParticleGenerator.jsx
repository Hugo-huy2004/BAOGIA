import { useEffect, useRef } from "react";
import {
  PCC_SLOT_SITES,
  PCC_RING_LAYOUT,
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

// PALETTE — one hue ramp per surface instead of a multi-hue mix. A code reads as
// jewellery when every dot belongs to the same family and only its *depth*
// changes with the ring; three competing hues read as noise.
//
// Bright surface (dark disc): platinum cores, champagne halo — matches the gold
// sigil frame the seal sits in.
const LUME_CORE = [255, 253, 246];
const LUME_GLOW = [214, 178, 106];

// Dark surface (light card): a single indigo→ink ramp, deepest on the inner ring.
const INK_RING = [
  [30, 27, 75],   // ink
  [49, 46, 129],
  [67, 56, 202],
  [79, 70, 229],  // indigo
];
const INK_GLOW = [67, 56, 202];

const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;

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

      // Global "breathing" pulse (anti-spoof flavor). It modulates GLOW ONLY —
      // the dot radii stay fixed, which both looks calmer and keeps the blob
      // areas the decoder measures perfectly stable.
      const pulse = 0.85 + 0.15 * Math.sin(frame * 0.04);

      // Dots sized relative to scale so they stay large & well-separated at any
      // render size; anchors are clearly bigger (≈3.5× area) so the decoder can
      // always pick them as the 3 biggest blobs.
      const dotR = Math.max(2.5, scale * 0.04);
      const markerR = Math.max(5, scale * 0.075);

      ctx.clearRect(0, 0, size, size);

      // Background disc: fill with the requested color (blends into the card),
      // or fall back to the self-contained deep-space gradient.
      ctx.beginPath();
      ctx.arc(center, center, disc, 0, Math.PI * 2);
      if (hasBg) {
        ctx.fillStyle = background;
      } else {
        const bg = ctx.createRadialGradient(center, center * 0.88, size * 0.04, center, center, disc);
        bg.addColorStop(0, "#191636");
        bg.addColorStop(0.6, "#0b0a1c");
        bg.addColorStop(1, "#050409");
        ctx.fillStyle = bg;
      }
      ctx.fill();

      const coreRgb = lightBg ? null : LUME_CORE;
      const glowRgb = lightBg ? INK_GLOW : LUME_GLOW;

      // Hairline guilloché: the ring radii drawn as engraved circles, plus the
      // anchor ring. Kept far below the scanner's mean±2σ threshold (it only
      // sees statistical outliers), so it never becomes a blob — it just makes
      // the layout read as designed rather than scattered.
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(glowRgb, lightBg ? 0.07 : 0.1);
      [...PCC_RING_LAYOUT.map(r => r.frac), PCC_MARKER_RADIUS_FRAC].forEach(frac => {
        ctx.beginPath();
        ctx.arc(center, center, frac * scale, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Ambient dust in the empty core (inside the innermost data ring, so the
      // decoder — which samples ring radii ≥ 0.4 — never sees it). Monochrome
      // and slow: a faint shimmer, not confetti.
      for (let i = 0; i < 14; i++) {
        const seedAngle = (i * 137.5 + rotation * 0.4) % 360;
        const r = scale * 0.2 * Math.sqrt(((i * 61) % 100) / 100);
        const a = (seedAngle * Math.PI) / 180;
        const twinkle = 0.1 + 0.22 * Math.abs(Math.sin(((rotation + i * 20) * Math.PI) / 180));
        ctx.beginPath();
        ctx.arc(center + r * Math.cos(a), center + r * Math.sin(a), 0.9, 0, Math.PI * 2);
        ctx.fillStyle = rgba(glowRgb, twinkle);
        ctx.fill();
      }

      // One dot: a soft halo, an opaque core, and an off-centre specular
      // highlight — the core stays fully opaque out to ~85% of the radius so the
      // blob the scanner measures is exactly the same size as a flat disc.
      const paintDot = (x, y, radius, rgb, glowAlpha, glowSpread) => {
        const halo = ctx.createRadialGradient(x, y, radius * 0.7, x, y, radius * glowSpread);
        halo.addColorStop(0, rgba(glowRgb, glowAlpha * pulse));
        halo.addColorStop(1, rgba(glowRgb, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, radius * glowSpread, 0, Math.PI * 2);
        ctx.fill();

        const body = ctx.createRadialGradient(
          x - radius * 0.32, y - radius * 0.38, radius * 0.05, x, y, radius
        );
        body.addColorStop(0, rgba(rgb.map(c => Math.min(255, c + (lightBg ? 70 : 0))), 1));
        body.addColorStop(0.85, rgba(rgb, 1));
        body.addColorStop(1, rgba(rgb, 0.82));
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      };

      // Data dots — present iff the corresponding bit is 1. Sites carry their
      // own ring index & slot count (variable density) so we iterate the flat list.
      const bits = bitsRef.current;
      if (bits) {
        for (let k = 0; k < PCC_SLOT_SITES.length; k++) {
          if (!bits[k]) continue;
          const site = PCC_SLOT_SITES[k];
          const r = site.frac * scale;
          const a = (((360 / site.slots) * site.slot + rotation) * Math.PI) / 180;
          paintDot(
            center + r * Math.cos(a),
            center + r * Math.sin(a),
            dotR,
            coreRgb || INK_RING[site.ring % INK_RING.length],
            lightBg ? 0.3 : 0.45,
            1.9 // keep the halo inside half the outer ring's arc gap so
                // neighbouring dots never merge into one blob for the scanner
          );
        }
      }

      // Orientation anchors — bigger/stronger; drive the decoder's center, scale
      // and rotation fit. All the same (big) size: the decoder tells them apart
      // by their asymmetric angular spacing, not by size (blur-robust). The thin
      // outer ring is a setting around the stone — decorative, sub-threshold.
      PCC_MARKER_ANGLES.forEach(baseAngle => {
        const a = ((baseAngle + rotation) * Math.PI) / 180;
        const r = PCC_MARKER_RADIUS_FRAC * scale;
        const x = center + r * Math.cos(a);
        const y = center + r * Math.sin(a);
        paintDot(x, y, markerR, coreRgb || INK_RING[0], lightBg ? 0.34 : 0.65, 2.4);
        ctx.beginPath();
        ctx.arc(x, y, markerR * 1.55, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(glowRgb, (lightBg ? 0.16 : 0.24) * pulse);
        ctx.stroke();
      });

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
