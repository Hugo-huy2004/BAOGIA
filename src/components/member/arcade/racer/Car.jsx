import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useBox } from "@react-three/cannon";
import { nearestSampleIndex } from "./trackData";

const CAR_SIZE = [1.6, 0.9, 3.2];
const MAX_SPEED = 22;
const STEER_RATE = 2.2; // rad/s at full lock, scaled by current speed below

// Shared arcade-style driving model for both the player and the AI bots.
// Both velocity AND yaw are set directly each frame rather than driven via
// forces/angularVelocity — force/angularVelocity application depends on
// cannon's per-step damping and worker round-trip timing lining up just
// right, which is exactly the kind of thing that silently ends up doing
// nothing (car drives but won't turn, etc.). Setting the actual target
// values every frame is deterministic: press a direction, that's what
// happens, full stop. The body stays a real dynamic rigid body for
// collisions (cannon still resolves overlaps with walls/other cars), it's
// just not what's driving the steering input.
function applyDriving(ref, api, velRef, yawRef, throttle, steer, dt) {
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(ref.current.quaternion);
  const current = velRef.current;
  const targetX = forward.x * throttle * MAX_SPEED;
  const targetZ = forward.z * throttle * MAX_SPEED;
  const blend = throttle === 0 ? 0.12 : 0.18; // coast-to-stop is slower than accelerating
  const nextX = THREE.MathUtils.lerp(current[0], targetX, blend);
  const nextZ = THREE.MathUtils.lerp(current[2], targetZ, blend);
  api.velocity.set(nextX, current[1], nextZ);

  const speed = Math.hypot(current[0], current[2]);
  const speedFactor = THREE.MathUtils.clamp(speed / MAX_SPEED, 0, 1);
  // Steering authority fades in at low speed (no in-place spinning) and is
  // gently reduced at very high speed so the car doesn't snap-turn into walls.
  const turnRate = STEER_RATE * (0.35 + 0.65 * speedFactor);
  yawRef.current += -steer * turnRate * dt;
  api.rotation.set(0, yawRef.current, 0);
}

export default function Car({
  id, color, isPlayer, samples, controlsRef, difficultySpeed = 1,
  startPosition, startAngle, onUpdate, raceActive
}) {
  const [ref, api] = useBox(() => ({
    mass: 140,
    args: CAR_SIZE,
    position: startPosition,
    rotation: [0, startAngle, 0],
    angularDamping: 0.9,
    linearDamping: 0.4,
  }));

  const velRef = useRef([0, 0, 0]);
  const yawRef = useRef(startAngle);
  const lapRef = useRef({ lastIdx: 0, laps: 0, finished: false });
  const aiTargetRef = useRef(0);

  useEffect(() => {
    const unsub = api.velocity.subscribe((v) => { velRef.current = v; });
    return unsub;
  }, [api]);

  useFrame((_, dt) => {
    if (!ref.current) return;
    const pos = ref.current.position;

    if (!raceActive) return;

    let throttle = 0;
    let steer = 0;

    if (isPlayer) {
      const c = controlsRef.current;
      throttle = c.forward ? 1 : c.back ? -1 : 0;
      steer = c.left ? 1 : c.right ? -1 : 0;
    } else {
      const idx = nearestSampleIndex(samples, pos);
      const lookAhead = 10;
      const target = samples[(idx + lookAhead) % samples.length];
      const desired = new THREE.Vector3().subVectors(target, pos);
      const desiredAngle = Math.atan2(desired.x, desired.z);
      // Use the authoritative yaw we're driving directly (see applyDriving)
      // rather than reading it back off the synced quaternion, which can lag
      // a frame behind whatever we just set.
      let diff = desiredAngle - yawRef.current;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      steer = THREE.MathUtils.clamp(diff * 2.2, -1, 1);
      throttle = difficultySpeed;
      aiTargetRef.current = idx;
    }

    applyDriving(ref, api, velRef, yawRef, throttle, steer, Math.min(dt, 0.05));

    // Lap tracking: project onto the track's sample index and detect the
    // wrap from "near the end" back to "near the start" as one lap.
    const idx = nearestSampleIndex(samples, pos);
    const prev = lapRef.current.lastIdx;
    if (prev > samples.length * 0.7 && idx < samples.length * 0.15) {
      lapRef.current.laps += 1;
    }
    lapRef.current.lastIdx = idx;

    const speed = Math.hypot(velRef.current[0], velRef.current[2]);
    onUpdate?.(id, {
      position: pos.clone(),
      quaternion: ref.current.quaternion.clone(),
      laps: lapRef.current.laps,
      speed,
    });
  });

  return (
    <group ref={ref}>
      {/* Chassis */}
      <mesh castShadow position={[0, 0, 0]}>
        <boxGeometry args={CAR_SIZE} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh castShadow position={[0, 0.65, -0.3]}>
        <boxGeometry args={[1.1, 0.5, 1.4]} />
        <meshStandardMaterial color="#111827" roughness={0.2} />
      </mesh>
      {/* Headlights */}
      <mesh position={[0.5, 0.1, 1.55]}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.5, 0.1, 1.55]}>
        <boxGeometry args={[0.25, 0.15, 0.05]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={2} />
      </mesh>
      {/* Wheels */}
      {[[-0.85, -0.3, 1.05], [0.85, -0.3, 1.05], [-0.85, -0.3, -1.05], [0.85, -0.3, -1.05]].map((p, i) => (
        <mesh key={i} position={p} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
          <meshStandardMaterial color="#18181b" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
