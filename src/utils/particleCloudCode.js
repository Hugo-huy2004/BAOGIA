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
export const PCC_MAX_PAYLOAD_BYTES = PCC_TOTAL_BYTES - 3; // 8 (length byte + 2 CRC-16 bytes reserved)

// Anchor angles are intentionally asymmetric so orientation is unambiguous no
// matter how the phone is rotated. They sit at the outermost radius, clearly
// outside every data ring, so the "3 biggest blobs" heuristic can isolate them.
// Chosen so the counter-clockwise gaps between anchors are {200,60,100} — very
// unevenly spaced, so the reference anchor (the one starting the largest gap)
// is identified from geometry alone, independent of size (which camera blur
// tends to equalize).
export const PCC_MARKER_ANGLES = [0, 200, 260]; // degrees
export const PCC_MARKER_RADIUS_FRAC = 1.0;

// ─── Integrity ──────────────────────────────────────────────────────────────
// CRC-16/CCITT-FALSE. A 16-bit checksum makes a random bit pattern pass with
// probability ~1/65536 (vs 1/256 for CRC-8), so a single decoded frame is
// already trustworthy — which lets the scanner accept faster.
function crc16(bytes) {
  let crc = 0xffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc & 0xffff;
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
  const crc = crc16(bytes.subarray(0, PCC_TOTAL_BYTES - 2));
  bytes[PCC_TOTAL_BYTES - 2] = (crc >> 8) & 0xff;
  bytes[PCC_TOTAL_BYTES - 1] = crc & 0xff;

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
  const stored = (bytes[PCC_TOTAL_BYTES - 2] << 8) | bytes[PCC_TOTAL_BYTES - 1];
  if (crc16(bytes.subarray(0, PCC_TOTAL_BYTES - 2)) !== stored) return null;
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

  const payload = decodeBits(bits);
  if (payload == null) return null;
  return { payload, rotationDeg, center, scale };
}

// ─── Frame analysis (full CV pipeline) ───────────────────────────────────────
// Decodes one camera frame (a canvas ImageData). Returns a rich result:
//   { payload, rotationDeg, center: {x,y}, scale }   on success
//   null                                             if nothing valid this frame
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

// Back-compat convenience: same pipeline, but returns just the string (or null).
// Existing callers (e.g. the inline scanner in JoyTransferModal) keep working.
export function decodeParticleCloudFrame(imageData, opts = {}) {
  const result = analyzeParticleCloudFrame(imageData, opts);
  return result ? result.payload : null;
}
