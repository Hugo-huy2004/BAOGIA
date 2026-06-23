import React, { useMemo } from "react";
import * as THREE from "three";
import { useBox, usePlane } from "@react-three/cannon";
import { TRACK_WIDTH } from "./trackData";

// Builds a flat ribbon of triangles following `samples`, `TRACK_WIDTH` wide —
// this is the actual drivable road surface (visual only, the ground plane
// below carries the real collision so cars never clip through gaps between
// segments).
function useRoadGeometry(samples) {
  return useMemo(() => {
    const positions = [];
    const uvs = [];
    const indices = [];
    const half = TRACK_WIDTH / 2;

    for (let i = 0; i < samples.length; i++) {
      const curr = samples[i];
      const next = samples[(i + 1) % samples.length];
      const dir = new THREE.Vector3().subVectors(next, curr).normalize();
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      const left = new THREE.Vector3().copy(curr).addScaledVector(perp, half);
      const right = new THREE.Vector3().copy(curr).addScaledVector(perp, -half);
      positions.push(left.x, 0.01, left.z, right.x, 0.01, right.z);
      uvs.push(0, i / 8, 1, i / 8);
    }

    const vertsPerRing = 2;
    for (let i = 0; i < samples.length; i++) {
      const a = i * vertsPerRing;
      const b = ((i + 1) % samples.length) * vertsPerRing;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [samples]);
}

// Thin static wall colliders + low visual barriers along both track edges —
// downsampled to every 4th sample so we're not spawning ~500 static cannon
// bodies for a barrier nobody needs millimeter precision on.
function TrackWalls({ samples }) {
  const stride = 4;
  const half = TRACK_WIDTH / 2 + 0.6;
  const segments = [];
  for (let i = 0; i < samples.length; i += stride) {
    const curr = samples[i];
    const next = samples[(i + stride) % samples.length];
    const dir = new THREE.Vector3().subVectors(next, curr).normalize();
    const perp = new THREE.Vector3(-dir.z, 0, dir.x);
    const mid = new THREE.Vector3().addVectors(curr, next).multiplyScalar(0.5);
    const len = curr.distanceTo(next) * 1.05;
    const angle = Math.atan2(dir.x, dir.z);
    segments.push({ pos: mid.clone().addScaledVector(perp, half), len, angle });
    segments.push({ pos: mid.clone().addScaledVector(perp, -half), len, angle });
  }
  return segments.map((s, i) => <WallSegment key={i} {...s} />);
}

function WallSegment({ pos, len, angle }) {
  const [ref] = useBox(() => ({
    type: "Static",
    args: [0.6, 1.6, len],
    position: [pos.x, 0.8, pos.z],
    rotation: [0, angle, 0],
  }));
  return (
    <mesh ref={ref} castShadow>
      <boxGeometry args={[0.6, 1.6, len]} />
      <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.3} />
    </mesh>
  );
}

export default function TrackMesh({ samples }) {
  const roadGeo = useRoadGeometry(samples);
  const [groundRef] = usePlane(() => ({ type: "Static", rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }));

  return (
    <>
      {/* Invisible ground collider — the real driving surface physically */}
      <mesh ref={groundRef} receiveShadow visible={false}>
        <planeGeometry args={[1000, 1000]} />
      </mesh>

      {/* Grass backdrop, purely visual */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1f4d2e" />
      </mesh>

      {/* The actual road ribbon */}
      <mesh geometry={roadGeo} receiveShadow>
        <meshStandardMaterial color="#2b2b33" roughness={0.95} />
      </mesh>

      <TrackWalls samples={samples} />
    </>
  );
}
