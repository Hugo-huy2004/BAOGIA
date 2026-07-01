// Particle Cloud Code — a custom circular, dot-based visual code (no QR).
//
// Data is laid out as small glowing dots on concentric rings around a center,
// plus 3 brighter "orientation markers" (anchors) on an outer ring used purely
// for locating the code, deriving its center/scale, and correcting for
// rotation. Because the anchors are re-derived from every camera frame, the
// code can spin continuously on screen and still decode — and that spin is
// itself the liveness signal a scanner uses to reject a still photo.
//
// Layout (288 bits / 36 bytes total capacity):
//   byte 0        : payload length L in bytes (0..34)
//   bytes 1..34   : UTF-8 payload bytes, zero-padded after L bytes
//   byte 35       : CRC-8 checksum over bytes 0..34
//
// Any string works: plain text, URLs, tokens, JSON — it's all run through
// TextEncoder into raw UTF-8 bytes, so there are no "special character"
// concerns. The only limit is capacity (PCC_MAX_PAYLOAD_BYTES).
//
// This is a from-scratch format decoded with a small computer-vision pipeline
// (threshold -> connected-component blobs -> geometric fit), not an
// established barcode standard — it trades some real-world robustness (motion
// blur, glare, extreme angles, very long payloads) for a fully custom look.

export const PCC_RINGS = 6;
export const PCC_SLOTS_PER_RING = 48;
export const PCC_TOTAL_BITS = PCC_RINGS * PCC_SLOTS_PER_RING; // 288
export const PCC_TOTAL_BYTES = PCC_TOTAL_BITS / 8; // 36
export const PCC_MAX_PAYLOAD_BYTES = PCC_TOTAL_BYTES - 2; // 34 (length byte + CRC byte reserved)

// Anchor angles are intentionally asymmetric so orientation is unambiguous no
// matter how the phone is rotated. They sit on their own radius, clearly
// outside every data ring, so the "3 biggest blobs" heuristic can isolate them.
export const PCC_MARKER_ANGLES = [0, 130, 250]; // degrees
export const PCC_MARKER_RADIUS_FRAC = 0.95;
export const PCC_RING_RADIUS_FRACS = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

// ─── Integrity ──────────────────────────────────────────────────────────────
function crc8(bytes) {
  let crc = 0x00;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}

// ─── Encode: string -> bit array ─────────────────────────────────────────────
// Turns any input string into the 288-bit layout described above. Throws a
// clear error if the UTF-8 payload exceeds capacity so callers can surface it.
export function encodePayload(text) {
  const utf8 = new TextEncoder().encode(text == null ? "" : String(text));
  if (utf8.length > PCC_MAX_PAYLOAD_BYTES) {
    throw new Error(
      `Particle Cloud Code payload too long (${utf8.length} bytes, max ${PCC_MAX_PAYLOAD_BYTES})`
    );
  }
  const bytes = new Uint8Array(PCC_TOTAL_BYTES);
  bytes[0] = utf8.length;
  bytes.set(utf8, 1);
  bytes[PCC_TOTAL_BYTES - 1] = crc8(bytes.subarray(0, PCC_TOTAL_BYTES - 1));

  const bits = new Array(PCC_TOTAL_BITS).fill(0);
  for (let byteIdx = 0; byteIdx < PCC_TOTAL_BYTES; byteIdx++) {
    const byte = bytes[byteIdx];
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      bits[byteIdx * 8 + bitIdx] = (byte >> (7 - bitIdx)) & 1;
    }
  }
  return bits;
}

// ─── Decode: bit array -> string | null ──────────────────────────────────────
// Returns null on any structural failure (wrong length, bad CRC, invalid
// UTF-8), which is exactly what we want when reading noisy camera frames.
export function decodeBits(bits) {
  if (!bits || bits.length !== PCC_TOTAL_BITS) return null;
  const bytes = new Uint8Array(PCC_TOTAL_BYTES);
  for (let byteIdx = 0; byteIdx < PCC_TOTAL_BYTES; byteIdx++) {
    let byte = 0;
    for (let bitIdx = 0; bitIdx < 8; bitIdx++) {
      byte = (byte << 1) | (bits[byteIdx * 8 + bitIdx] ? 1 : 0);
    }
    bytes[byteIdx] = byte;
  }
  const len = bytes[0];
  if (len === 0 || len > PCC_MAX_PAYLOAD_BYTES) return null;
  if (crc8(bytes.subarray(0, PCC_TOTAL_BYTES - 1)) !== bytes[PCC_TOTAL_BYTES - 1]) return null;
  try {
    // fatal: true rejects malformed byte sequences instead of inserting U+FFFD,
    // giving us another cheap false-positive filter.
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(1, 1 + len));
  } catch {
    return null;
  }
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────
// Unique circle through 3 points (used to recover the code's center from the
// 3 anchors, which are all equidistant from it).
function circumcenter(a, b, c) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-6) return null;
  const aa = a.x * a.x + a.y * a.y;
  const bb = b.x * b.x + b.y * b.y;
  const cc = c.x * c.x + c.y * c.y;
  const ux = (aa * (b.y - c.y) + bb * (c.y - a.y) + cc * (a.y - b.y)) / d;
  const uy = (aa * (c.x - b.x) + bb * (a.x - c.x) + cc * (b.x - a.x)) / d;
  return { x: ux, y: uy };
}

// Iterative (stack-based) 4-connectivity flood fill over a binary mask.
// Returns centroids + areas of blobs whose size falls in [minArea, maxArea].
function findBlobs(mask, width, height, minArea, maxArea) {
  const visited = new Uint8Array(width * height);
  const blobs = [];
  const stack = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const start = y * width + x;
      if (!mask[start] || visited[start]) continue;

      stack.length = 0;
      stack.push(start);
      visited[start] = 1;
      let sumX = 0, sumY = 0, count = 0;

      while (stack.length) {
        const cur = stack.pop();
        const cx = cur % width;
        const cy = (cur / width) | 0;
        sumX += cx; sumY += cy; count++;

        if (cx > 0 && mask[cur - 1] && !visited[cur - 1]) { visited[cur - 1] = 1; stack.push(cur - 1); }
        if (cx < width - 1 && mask[cur + 1] && !visited[cur + 1]) { visited[cur + 1] = 1; stack.push(cur + 1); }
        if (cy > 0 && mask[cur - width] && !visited[cur - width]) { visited[cur - width] = 1; stack.push(cur - width); }
        if (cy < height - 1 && mask[cur + width] && !visited[cur + width]) { visited[cur + width] = 1; stack.push(cur + width); }
      }

      if (count >= minArea && count <= maxArea) {
        blobs.push({ x: sumX / count, y: sumY / count, area: count });
      }
    }
  }
  return blobs;
}

// Expected pixel position of a given (ring, slot) once we know the code's
// measured center, scale and rotation.
function slotPosition(ring, slot, centerX, centerY, scale, rotationDeg) {
  const angle = ((360 / PCC_SLOTS_PER_RING) * slot + rotationDeg) * (Math.PI / 180);
  const r = PCC_RING_RADIUS_FRACS[ring] * scale;
  return { x: centerX + r * Math.cos(angle), y: centerY + r * Math.sin(angle) };
}

// Given a set of candidate dot blobs, fit the geometry and read out a payload.
// Returns { payload, rotationDeg, center, scale } or null.
function decodeFromBlobs(blobs, minDotArea, matchToleranceFrac) {
  if (blobs.length < 3) return null;

  // Anchors are rendered noticeably larger than data dots -> the 3 biggest
  // blobs are our orientation markers.
  const sorted = [...blobs].sort((a, b) => b.area - a.area);
  const markers = sorted.slice(0, 3);
  const dataCandidates = sorted.slice(3);
  if (markers.some(m => m.area < minDotArea * 2.2)) return null;

  // Center from the 3 anchors (they're equidistant from it).
  const center = circumcenter(markers[0], markers[1], markers[2]);
  if (!center) return null;

  // Scale = mean anchor distance / anchor radius fraction.
  const scale =
    markers.reduce((sum, m) => sum + Math.hypot(m.x - center.x, m.y - center.y), 0) /
    3 / PCC_MARKER_RADIUS_FRAC;
  if (!isFinite(scale) || scale < 8) return null;

  // Rotation: the reference anchor (index 0) is rendered biggest of the three.
  const refMarker = markers.reduce((a, b) => (b.area > a.area ? b : a));
  const refAngleMeasured = (Math.atan2(refMarker.y - center.y, refMarker.x - center.x) * 180) / Math.PI;
  const rotationDeg = refAngleMeasured - PCC_MARKER_ANGLES[0];

  // Sample every slot: bit = 1 iff a data blob sits within tolerance of the
  // expected position. Tolerance is ~half a slot arc so neighbours don't bleed.
  const tolerance = Math.max(3, scale * ((2 * Math.PI) / PCC_SLOTS_PER_RING) * matchToleranceFrac);
  const bits = new Array(PCC_TOTAL_BITS).fill(0);
  for (let ring = 0; ring < PCC_RINGS; ring++) {
    for (let slot = 0; slot < PCC_SLOTS_PER_RING; slot++) {
      const expected = slotPosition(ring, slot, center.x, center.y, scale, rotationDeg);
      const hit = dataCandidates.some(
        b => Math.hypot(b.x - expected.x, b.y - expected.y) <= tolerance
      );
      bits[ring * PCC_SLOTS_PER_RING + slot] = hit ? 1 : 0;
    }
  }

  const payload = decodeBits(bits);
  if (payload == null) return null;
  return { payload, rotationDeg, center, scale };
}

// ─── Frame analysis (full CV pipeline) ───────────────────────────────────────
// Decodes one camera frame (a canvas ImageData). Returns a rich result:
//   { payload, rotationDeg, center: {x,y}, scale }   on success
//   null                                             if nothing valid this frame
//
// Polarity-agnostic: the dots may be BRIGHT on a dark background (the fullscreen
// "seal" presentation) or DARK on a light background (the card-matching preview).
// We try the bright polarity first (the historical default), then the dark one,
// and accept the first that survives the CRC — so a single scanner reads both.
//
// `rotationDeg` is what the ParticleScanner uses for its anti-spoof liveness
// check: a live on-screen code is always spinning, so this angle advances frame
// to frame, whereas a still photo holds it constant.
export function analyzeParticleCloudFrame(imageData, opts = {}) {
  const {
    brightThreshold = 140, // lum above this = a glowing dot on a dark background
    darkThreshold = 110,   // lum below this = a dark dot on a light background
    minDotArea = 2,
    maxDotArea = 600,
    matchToleranceFrac = 0.42,
  } = opts;
  const { data, width, height } = imageData;
  const n = width * height;

  // Precompute luminance once; reuse it for both polarity passes.
  const lum = new Uint8ClampedArray(n);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    lum[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  // Pass 1 — bright dots on dark background.
  const brightMask = new Uint8Array(n);
  for (let p = 0; p < n; p++) brightMask[p] = lum[p] > brightThreshold ? 1 : 0;
  let res = decodeFromBlobs(
    findBlobs(brightMask, width, height, minDotArea, maxDotArea),
    minDotArea, matchToleranceFrac
  );
  if (res) return res;

  // Pass 2 — dark dots on light background (blob detection only runs when the
  // first polarity failed, so the common case stays single-pass).
  const darkMask = new Uint8Array(n);
  for (let p = 0; p < n; p++) darkMask[p] = lum[p] < darkThreshold ? 1 : 0;
  return decodeFromBlobs(
    findBlobs(darkMask, width, height, minDotArea, maxDotArea),
    minDotArea, matchToleranceFrac
  );
}

// Back-compat convenience: same pipeline, but returns just the string (or null).
// Existing callers (e.g. the inline scanner in JoyTransferModal) keep working.
export function decodeParticleCloudFrame(imageData, opts = {}) {
  const result = analyzeParticleCloudFrame(imageData, opts);
  return result ? result.payload : null;
}
