// Self-check: rasterize a Particle Cloud Code with the SAME geometry constants
// ParticleGenerator.jsx draws with, then decode it back through the real CV
// pipeline. Guards the thing that visual restyling can silently break: dot
// radius / glow spread growing until neighbouring dots merge into one blob.
//
//   node scripts/check-particle-code.mjs
import {
  PCC_SLOT_SITES,
  PCC_MARKER_ANGLES,
  PCC_MARKER_RADIUS_FRAC,
  encodePayload,
  decodeParticleCloudFrame,
  bytesToBase64Url,
} from "../src/utils/particleCloudCode.js";
import assert from "node:assert";

// Must mirror ParticleGenerator.jsx.
const SIZE = 240, MARGIN = 20, GLOW_SPREAD = 1.9, MARKER_GLOW_SPREAD = 2.4;

function render({ lightBg }) {
  const w = SIZE, h = SIZE, px = new Uint8ClampedArray(w * h * 4);
  const bg = lightBg ? 255 : 8;
  px.fill(255);
  for (let i = 0; i < w * h; i++) { px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = bg; }

  const center = SIZE / 2;
  const scale = (SIZE / 2 - MARGIN) / PCC_MARKER_RADIUS_FRAC;
  const dotR = Math.max(2.5, scale * 0.04);
  const markerR = Math.max(5, scale * 0.075);
  const dot = lightBg ? 30 : 255;      // ink core vs platinum core
  const glow = lightBg ? 130 : 150;    // halo luminance at its brightest

  // Filled disc + a linearly-fading halo, matching paintDot().
  const blot = (cx, cy, r, spread) => {
    const outer = Math.ceil(r * spread) + 1;
    for (let y = Math.max(0, cy - outer | 0); y < Math.min(h, cy + outer); y++) {
      for (let x = Math.max(0, cx - outer | 0); x < Math.min(w, cx + outer); x++) {
        const d = Math.hypot(x - cx, y - cy);
        let v = null;
        if (d <= r) v = dot;
        else if (d <= r * spread) {
          const t = 1 - (d - r) / (r * spread - r);
          v = bg + (glow - bg) * t;
        }
        if (v == null) continue;
        const p = (y * w + x) * 4;
        px[p] = px[p + 1] = px[p + 2] = v;
      }
    }
  };

  const bits = encodePayload("HUGO2026");
  for (let k = 0; k < PCC_SLOT_SITES.length; k++) {
    if (!bits[k]) continue;
    const s = PCC_SLOT_SITES[k];
    const a = ((360 / s.slots) * s.slot * Math.PI) / 180;
    blot(center + s.frac * scale * Math.cos(a), center + s.frac * scale * Math.sin(a), dotR, GLOW_SPREAD);
  }
  for (const deg of PCC_MARKER_ANGLES) {
    const a = (deg * Math.PI) / 180;
    const r = PCC_MARKER_RADIUS_FRAC * scale;
    blot(center + r * Math.cos(a), center + r * Math.sin(a), markerR, MARKER_GLOW_SPREAD);
  }
  return { data: px, width: w, height: h };
}

const expected = bytesToBase64Url(
  (() => { const d = new Uint8Array(10); d[0] = 8; d.set(new TextEncoder().encode("HUGO2026"), 1); return d; })()
);
for (const lightBg of [true, false]) {
  const got = decodeParticleCloudFrame(render({ lightBg }));
  assert.strictEqual(got, expected, `decode failed on ${lightBg ? "light" : "dark"} background`);
  console.log(`✓ ${lightBg ? "light" : "dark"} background decodes cleanly`);
}
