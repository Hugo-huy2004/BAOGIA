// Particle Cloud Code — a custom circular, dot-based visual code (no QR).
//
// Data is laid out as small glowing dots on concentric rings around a center,
// plus 3 brighter "orientation markers" (anchors) on an outer ring used purely
// for locating the code, deriving its center/scale, and correcting for
// rotation. Because the anchors are re-derived from every camera frame, the
// code can spin continuously on screen and still decode — and that spin is
// itself the liveness signal a scanner uses to reject a still photo.
//
// Layout (88 bits / 11 bytes total capacity):
//   byte 0        : payload length L in bytes (1..9)
//   bytes 1..9    : UTF-8 payload bytes, zero-padded after L bytes
//   byte 10       : CRC-8 checksum over bytes 0..9
//
// Any string works: plain text, tokens, short URLs — it's all run through
// TextEncoder into raw UTF-8 bytes, so there are no "special character"
// concerns. The only limit is capacity (PCC_MAX_PAYLOAD_BYTES = 9).
//
// DENSITY IS DELIBERATELY LOW. Decoding a dot code off a phone screen with
// another phone's camera only works if adjacent dots stay clearly separated
// through blur; too many dots per ring merge into one blob and nothing
// decodes. So each ring carries its OWN slot count (inner rings, which have a
// small circumference, get few slots; outer rings get more), and dots are
// rendered large. Capacity is small on purpose — the JOY use case encodes an
// 8-char referral code, not arbitrary long data.
//
// This is a from-scratch format decoded with a small computer-vision pipeline
// (threshold -> connected-component blobs -> geometric fit), not an
// established barcode standard.

// Each ring: radius fraction (1.0 == the anchor ring) and its own slot count,
// tuned so the arc gap between adjacent dots stays wide enough to survive blur.
export const PCC_RING_LAYOUT = [
  { frac: 0.40, slots: 12 },
  { frac: 0.55, slots: 20 },
  { frac: 0.70, slots: 26 },
  { frac: 0.85, slots: 30 },
];

// Flat list of dot sites in bit order: bit k is drawn/read at PCC_SLOT_SITES[k].
export const PCC_SLOT_SITES = (() => {
  const sites = [];
  PCC_RING_LAYOUT.forEach((ring, ringIndex) => {
    for (let s = 0; s < ring.slots; s++) {
      sites.push({ ring: ringIndex, frac: ring.frac, slot: s, slots: ring.slots });
    }
  });
  return sites;
})();

export const PCC_TOTAL_BITS = PCC_SLOT_SITES.length;      // 88
export const PCC_TOTAL_BYTES = PCC_TOTAL_BITS / 8;        // 11
export const PCC_DATA_BYTES = PCC_TOTAL_BYTES - 1;        // 10 opaque payload bytes (+1 CRC-8)
export const PCC_MAX_PAYLOAD_BYTES = PCC_DATA_BYTES - 1;  // 9 (string mode: 1 length byte)

// Anchor angles are intentionally asymmetric so orientation is unambiguous no
// matter how the phone is rotated. They sit at the outermost radius, clearly
// outside every data ring, so the "3 biggest blobs" heuristic can isolate them.
// Chosen so the counter-clockwise gaps between anchors are {200,60,100} — very
// unevenly spaced, so the reference anchor (the one starting the largest gap)
// is identified from geometry alone, independent of size (which camera blur
// tends to equalize).
export const PCC_MARKER_ANGLES = [0, 200, 260]; // degrees
export const PCC_MARKER_RADIUS_FRAC = 1.0;

// ─── Integrity + obfuscation ─────────────────────────────────────────────────
// SECURITY MODEL: real authenticity ("only our system issues valid codes") is
// enforced by an HMAC the SERVER computes with a secret key and verifies on
// scan — see server/utils/joyQrToken.js. This codec only TRANSPORTS the opaque
// bytes the server produced. The two things here are:
//   • CRC-8  — a cheap "did I read all 88 dots cleanly?" check so the scanner
//              doesn't act on a half-read frame.
//   • scramble — a fixed permutation + keystream over the 88 bits so the raw
//              bytes aren't legible in the dot pattern. This is client-side, so
//              it's obfuscation (not a secret), but it stops casual copying and
//              spreads read errors so no single byte concentrates them.
function crc8(bytes) {
  let crc = 0x00;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let b = 0; b < 8; b++) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
  }
  return crc;
}

// Deterministic xorshift32 seeded by a constant -> fixed bit permutation +
// keystream. Identical on encode/decode, therefore invertible.
function makeScramble(seed) {
  let s = seed >>> 0;
  const next = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return s >>> 0; };
  const perm = Array.from({ length: PCC_TOTAL_BITS }, (_, i) => i);
  for (let i = perm.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  const key = new Uint8Array(PCC_TOTAL_BITS);
  for (let i = 0; i < key.length; i++) key[i] = next() & 1;
  return { perm, key };
}
const SCRAMBLE = makeScramble(0x9e3779b1);

function bytesToBits(bytes) {
  const bits = new Array(PCC_TOTAL_BITS).fill(0);
  for (let i = 0; i < PCC_TOTAL_BYTES; i++)
    for (let b = 0; b < 8; b++) bits[i * 8 + b] = (bytes[i] >> (7 - b)) & 1;
  return bits;
}
function bitsToBytes(bits) {
  const bytes = new Uint8Array(PCC_TOTAL_BYTES);
  for (let i = 0; i < PCC_TOTAL_BYTES; i++) {
    let v = 0;
    for (let b = 0; b < 8; b++) v = (v << 1) | (bits[i * 8 + b] ? 1 : 0);
    bytes[i] = v;
  }
  return bytes;
}

// ─── Encode: raw bytes -> scrambled bit array ────────────────────────────────
// `data` is ≤ PCC_DATA_BYTES (10), zero-padded; a CRC-8 over the 10 data bytes
// is appended, and the resulting 88 bits are scrambled.
export function encodeBytes(data) {
  const u8 = data instanceof Uint8Array ? data : Uint8Array.from(data || []);
  if (u8.length > PCC_DATA_BYTES) {
    throw new Error(`Particle Cloud Code payload too long (${u8.length} bytes, max ${PCC_DATA_BYTES})`);
  }
  const bytes = new Uint8Array(PCC_TOTAL_BYTES);
  bytes.set(u8, 0);
  bytes[PCC_TOTAL_BYTES - 1] = crc8(bytes.subarray(0, PCC_DATA_BYTES));
  const raw = bytesToBits(bytes);
  const out = new Array(PCC_TOTAL_BITS).fill(0);
  for (let i = 0; i < PCC_TOTAL_BITS; i++) out[SCRAMBLE.perm[i]] = raw[i] ^ SCRAMBLE.key[i];
  return out;
}

// ─── Decode: scrambled bit array -> raw bytes (Uint8Array(10)) | null ────────
export function decodeToBytes(bits) {
  if (!bits || bits.length !== PCC_TOTAL_BITS) return null;
  const raw = new Array(PCC_TOTAL_BITS).fill(0);
  for (let i = 0; i < PCC_TOTAL_BITS; i++) raw[i] = (bits[SCRAMBLE.perm[i]] ? 1 : 0) ^ SCRAMBLE.key[i];
  const bytes = bitsToBytes(raw);
  if (crc8(bytes.subarray(0, PCC_DATA_BYTES)) !== bytes[PCC_TOTAL_BYTES - 1]) return null;
  return bytes.slice(0, PCC_DATA_BYTES);
}

// ─── String convenience (generic use / tests) ────────────────────────────────
// Inside the 10 data bytes: [len][utf8 … zero-padded]. Cap = 9 bytes.
export function encodePayload(text) {
  const utf8 = new TextEncoder().encode(text == null ? "" : String(text));
  if (utf8.length > PCC_MAX_PAYLOAD_BYTES) {
    throw new Error(`Particle Cloud Code payload too long (${utf8.length} bytes, max ${PCC_MAX_PAYLOAD_BYTES})`);
  }
  const data = new Uint8Array(PCC_DATA_BYTES);
  data[0] = utf8.length;
  data.set(utf8, 1);
  return encodeBytes(data);
}
export function decodeBits(bits) {
  const data = decodeToBytes(bits);
  if (!data) return null;
  const len = data[0];
  if (len === 0 || len > PCC_MAX_PAYLOAD_BYTES) return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(data.subarray(1, 1 + len));
  } catch {
    return null;
  }
}

// ─── base64url <-> bytes (how the server token rides in/out of this codec) ────
export function bytesToBase64Url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa !== "undefined" ? btoa(bin) : Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function base64UrlToBytes(str) {
  let b64 = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const bin = typeof atob !== "undefined" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
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

// Expected pixel position of a dot site once we know the code's measured
// center, scale and rotation. Each site carries its own ring slot count.
function sitePosition(site, centerX, centerY, scale, rotationDeg) {
  const angle = ((360 / site.slots) * site.slot + rotationDeg) * (Math.PI / 180);
  const r = site.frac * scale;
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

  // Rotation: identify the reference anchor by the asymmetric angular gaps
  // between the three anchors (rotation-invariant, size-independent). By design
  // the reference (angle PCC_MARKER_ANGLES[0]) starts the largest CCW gap.
  const withAngle = markers
    .map(m => ({ ang: ((Math.atan2(m.y - center.y, m.x - center.x) * 180) / Math.PI + 360) % 360 }))
    .sort((a, b) => a.ang - b.ang);
  let refIdx = 0, maxGap = -1;
  for (let i = 0; i < 3; i++) {
    const next = withAngle[(i + 1) % 3].ang + (i === 2 ? 360 : 0);
    const gap = next - withAngle[i].ang;
    if (gap > maxGap) { maxGap = gap; refIdx = i; }
  }
  const rotationDeg = withAngle[refIdx].ang - PCC_MARKER_ANGLES[0];

  // Sample every dot site: bit = 1 iff a data blob sits within tolerance of the
  // expected position. Tolerance scales with the site's own ring circumference
  // (arc gap) so neighbours never bleed into each other.
  const bits = new Array(PCC_TOTAL_BITS).fill(0);
  for (let k = 0; k < PCC_SLOT_SITES.length; k++) {
    const site = PCC_SLOT_SITES[k];
    const r = site.frac * scale;
    const tolerance = Math.max(2, r * ((2 * Math.PI) / site.slots) * matchToleranceFrac);
    const expected = sitePosition(site, center.x, center.y, scale, rotationDeg);
    const hit = dataCandidates.some(
      b => Math.hypot(b.x - expected.x, b.y - expected.y) <= tolerance
    );
    bits[k] = hit ? 1 : 0;
  }

  const bytes = decodeToBytes(bits);
  if (bytes == null) return null;
  return { bytes, rotationDeg, center, scale };
}

// ─── Frame analysis (full CV pipeline) ───────────────────────────────────────
// Decodes one camera frame (a canvas ImageData). Returns a rich result:
//   { bytes: Uint8Array(10), rotationDeg, center: {x,y}, scale }   on success
//   null                                                           if nothing valid
//
// Polarity- AND exposure-agnostic. The dots may be BRIGHT on a dark background
// (the fullscreen "seal") or DARK on a light background (the card preview), and
// the camera's exposure is unknown. So rather than fixed cutoffs we threshold
// ADAPTIVELY from each frame's own luminance mean & standard deviation: dots are
// the statistical outliers. We try several sensitivities (k) and both
// polarities, returning the first read that survives the CRC — CRC-16 keeps
// every attempt trustworthy, so trying harder only increases sensitivity, never
// false positives. Attempts stop at the first success, so a clean frame is fast.
//
// `rotationDeg` is what the ParticleScanner uses for its anti-spoof liveness
// check: a live on-screen code is always spinning, so this angle advances frame
// to frame, whereas a still photo holds it constant.
export function analyzeParticleCloudFrame(imageData, opts = {}) {
  const {
    minDotArea = 1,
    maxDotArea = 2500,
    matchToleranceFrac = 0.55,
    kSensitivities = [2.0, 1.4, 2.8], // std multiples: medium, aggressive, strict
  } = opts;
  const { data, width, height } = imageData;
  const n = width * height;

  // Precompute luminance + running mean/variance in one pass.
  const lum = new Uint8ClampedArray(n);
  let sum = 0, sumSq = 0;
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lum[p] = v;
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / n;
  const std = Math.sqrt(Math.max(1, sumSq / n - mean * mean));

  const mask = new Uint8Array(n);
  const tryCut = (cut, bright) => {
    if (bright) {
      for (let p = 0; p < n; p++) mask[p] = lum[p] > cut ? 1 : 0;
    } else {
      for (let p = 0; p < n; p++) mask[p] = lum[p] < cut ? 1 : 0;
    }
    return decodeFromBlobs(
      findBlobs(mask, width, height, minDotArea, maxDotArea),
      minDotArea, matchToleranceFrac
    );
  };

  for (const k of kSensitivities) {
    // Bright dots: pixels well ABOVE the mean. Dark dots: well BELOW.
    const brightCut = Math.min(252, mean + k * std);
    const darkCut = Math.max(3, mean - k * std);
    let res = tryCut(brightCut, true);
    if (res) return res;
    res = tryCut(darkCut, false);
    if (res) return res;
  }
  return null;
}

// Convenience: same pipeline, but returns the payload as a base64url string
// (the opaque server token) or null.
export function decodeParticleCloudFrame(imageData, opts = {}) {
  const result = analyzeParticleCloudFrame(imageData, opts);
  return result ? bytesToBase64Url(result.bytes) : null;
}
