import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import * as THREE from "three";
import TrackMesh from "./TrackMesh";
import Car from "./Car";
import MiniMap from "./MiniMap";
import { buildTrackCurve } from "./trackData";
import { useKeyboardControls } from "./useKeyboardControls";
import "./racer-theme.css";

const DIFFICULTY_CONFIG = {
  easy:   { aiCount: 1, aiSpeed: 0.55, laps: 2 },
  medium: { aiCount: 2, aiSpeed: 0.8,  laps: 3 },
  hard:   { aiCount: 3, aiSpeed: 1.05, laps: 3 },
};
const TIME_LIMIT_SEC = 180;
const PLAYER_COLOR = "#6366f1";
const AI_COLORS = ["#f97316", "#10b981", "#ec4899"];

const isMobileViewport = () => window.matchMedia("(max-width: 900px)").matches;

// A driving game is unplayable in portrait on a phone — request real
// fullscreen and lock to landscape automatically on mount, and reverse both
// on unmount so the rest of the app isn't left in a rotated/fullscreen state.
// Both Fullscreen and Orientation Lock are best-effort: iOS Safari doesn't
// support orientation.lock at all, and some browsers refuse fullscreen
// outside a direct user-gesture call stack — every call here is wrapped so a
// rejection just means "stay as-is," never a crash.
function useAutoLandscapeFullscreen(containerRef) {
  useEffect(() => {
    if (!isMobileViewport()) return;
    const el = containerRef.current;
    const requestFs = el?.requestFullscreen || el?.webkitRequestFullscreen;
    Promise.resolve(requestFs?.call(el)).catch(() => {});
    if (screen.orientation?.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }
    return () => {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen)?.call(document).catch(() => {});
      }
      screen.orientation?.unlock?.();
    };
  }, [containerRef]);
}

function FollowCamera({ carsRef }) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());

  useFrame(() => {
    const player = carsRef.current.player;
    if (!player?.position || !player?.quaternion) return;
    const back = new THREE.Vector3(0, 3.2, -7).applyQuaternion(player.quaternion);
    desired.current.copy(player.position).add(back);
    camera.position.lerp(desired.current, 0.08);
    const lookAt = player.position.clone().add(new THREE.Vector3(0, 1, 0));
    camera.lookAt(lookAt);
  });
  return null;
}

export default function HugoRacer({ difficulty, onGameOver }) {
  const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.medium;
  const { samples } = useMemo(() => buildTrackCurve(), []);
  const controlsRef = useKeyboardControls();
  const carsRef = useRef({});
  const startTimeRef = useRef(null);
  const finishedRef = useRef(false);
  const shellRef = useRef(null);
  useAutoLandscapeFullscreen(shellRef);

  const [phase, setPhase] = useState("countdown"); // countdown | racing | finished
  const [countdown, setCountdown] = useState(3);
  const [hud, setHud] = useState({ lap: 0, laps: config.laps, speed: 0 });

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("racing");
      startTimeRef.current = performance.now();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Bots/player finishing is detected from the per-frame onUpdate callback
  // below rather than its own clock — cheaper than a second interval, and
  // keeps lap state as the single source of truth for "who finished first."
  const handleCarUpdate = (id, data) => {
    carsRef.current[id] = { ...carsRef.current[id], ...data, isPlayer: id === "player", color: id === "player" ? PLAYER_COLOR : AI_COLORS[parseInt(id.replace("ai", ""), 10)] || "#999" };
    if (id === "player") setHud((h) => ({ ...h, lap: Math.min(data.laps, config.laps), speed: Math.round(data.speed * 3.2) }));

    if (finishedRef.current || phase !== "racing") return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    if (id === "player" && data.laps >= config.laps) {
      finishedRef.current = true;
      const score = Math.max(0, Math.round((TIME_LIMIT_SEC - elapsed) * 10));
      setPhase("finished");
      onGameOver?.(score, "win");
    } else if (id !== "player" && data.laps >= config.laps) {
      finishedRef.current = true;
      setPhase("finished");
      onGameOver?.(0, "lose");
    } else if (elapsed > TIME_LIMIT_SEC) {
      finishedRef.current = true;
      setPhase("finished");
      onGameOver?.(0, "lose");
    }
  };

  const startPos = samples[0];
  const nextPos = samples[5];
  const startAngle = Math.atan2(nextPos.x - startPos.x, nextPos.z - startPos.z);

  const press = (key, val) => (e) => { e.preventDefault(); controlsRef.current[key] = val; };

  return (
    <div className="racer-shell" ref={shellRef}>
      <Canvas shadows camera={{ fov: 60, near: 0.5, far: 500 }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[40, 60, 20]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        <fog attach="fog" args={["#0a0e1a", 60, 220]} />
        <Physics gravity={[0, -9.81, 0]} broadphase="SAP">
          <TrackMesh samples={samples} />
          <Car
            id="player" isPlayer color={PLAYER_COLOR} samples={samples}
            controlsRef={controlsRef} startPosition={[startPos.x, 0.6, startPos.z]} startAngle={startAngle}
            onUpdate={handleCarUpdate} raceActive={phase === "racing"}
          />
          {Array.from({ length: config.aiCount }).map((_, i) => {
            const offsetIdx = (i + 1) * 3;
            const p = samples[offsetIdx];
            return (
              <Car
                key={i} id={`ai${i}`} isPlayer={false} color={AI_COLORS[i]} samples={samples}
                controlsRef={controlsRef} difficultySpeed={config.aiSpeed}
                startPosition={[p.x, 0.6, p.z]} startAngle={startAngle}
                onUpdate={handleCarUpdate} raceActive={phase === "racing"}
              />
            );
          })}
        </Physics>
        <FollowCamera carsRef={carsRef} />
      </Canvas>

      <div className="racer-hud">
        <div className="racer-hud-top">
          <div className="racer-lap-badge">VÒNG {hud.lap}/{hud.laps}</div>
          <MiniMap samples={samples} carsRef={carsRef} />
        </div>
        <div className="racer-speed"><strong>{hud.speed}</strong><small>km/h</small></div>
      </div>

      {phase === "countdown" && (
        <div className="racer-countdown">{countdown > 0 ? countdown : "GO!"}</div>
      )}

      <div className="racer-touch">
        <div className="racer-touch-group">
          <button className="racer-touch-btn" onPointerDown={press("left", true)} onPointerUp={press("left", false)} onPointerLeave={press("left", false)}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="racer-touch-btn" onPointerDown={press("right", true)} onPointerUp={press("right", false)} onPointerLeave={press("right", false)}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
        <div className="racer-touch-group">
          <button className="racer-touch-btn" onPointerDown={press("back", true)} onPointerUp={press("back", false)} onPointerLeave={press("back", false)}>
            <span className="material-symbols-outlined">arrow_downward</span>
          </button>
          <button className="racer-touch-btn" onPointerDown={press("forward", true)} onPointerUp={press("forward", false)} onPointerLeave={press("forward", false)}>
            <span className="material-symbols-outlined">arrow_upward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
