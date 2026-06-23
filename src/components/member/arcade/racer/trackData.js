import * as THREE from "three";

// One closed-loop track, hand-placed waypoints (X/Z plane, Y is up). Kept as
// a single track for now — easy/medium/hard tune AI count/speed instead of
// swapping geometry, so there's one well-tuned loop instead of three rushed
// ones.
const WAYPOINTS = [
  [0, -70], [35, -68], [62, -50], [72, -15], [60, 18], [30, 32],
  [5, 28], [-22, 45], [-55, 35], [-70, 5], [-62, -30], [-35, -55],
];

export const TRACK_WIDTH = 14;
const SAMPLE_COUNT = 240;

export function buildTrackCurve() {
  const points = WAYPOINTS.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.5);
  const samples = curve.getSpacedPoints(SAMPLE_COUNT);
  return { curve, samples };
}

// Index of the sample nearest to `pos` — used both for AI "look ahead" steering
// and for player/AI lap-progress tracking (passing sample index 0 after being
// near the end counts as a completed lap).
export function nearestSampleIndex(samples, pos) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < samples.length; i++) {
    const d = samples[i].distanceToSquared(pos);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return bestIdx;
}
