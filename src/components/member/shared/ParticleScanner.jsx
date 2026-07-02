import React, { useEffect, useRef, useState, useCallback } from "react";
import { analyzeParticleCloudFrame } from "../../../utils/particleCloudCode";

// <ParticleScanner onScanSuccess={(decoded) => ...} /> — a self-contained,
// fullscreen camera scanner for particle cloud codes.
//
// Pipeline, all inside one requestAnimationFrame loop:
//   getUserMedia -> hidden <video> -> draw center-crop into an offscreen canvas
//   -> getImageData -> analyzeParticleCloudFrame (threshold, blob detection,
//   anchor/geometry fit, bit sampling, CRC + UTF-8 decode) -> liveness gate ->
//   onScanSuccess(decoded) and a clean stream teardown.
//
// Two acceptance gates keep false positives out:
//   1) Agreement — the SAME payload must be decoded across several frames.
//   2) Liveness (anti-photo) — a real on-screen code spins, so its measured
//      rotation must actually advance over the window. A still photo holds the
//      rotation constant and is rejected. (This does not defend against a video
//      replay; full anti-replay is out of scope for a visual code.)
//
// Props:
//   onScanSuccess(decodedString)  required — called once, then the camera stops
//   onClose()                     optional — user tapped the close button
//   onError(errorLike)            optional — camera unavailable / permission denied
//   facingMode                    optional — default "environment" (rear camera)
//   scanBoxSize                   optional — offscreen decode resolution (px)

// Liveness / agreement tuning. The generator spins ~0.9°/frame (~54°/s), so a
// live code sweeps well past ROT_MIN_DEG within the time window, while camera
// angle noise on a static photo stays near zero net displacement.
// CRC-16 makes a single decoded frame already trustworthy (~1/65536 false
// positive), so we accept fast: just 2 agreeing frames over a short window with
// a hint of rotation (proves it's a live spinning code, not a still photo).
const AGREE_MIN_FRAMES = 2;    // consecutive frames that must decode identically
const AGREE_MIN_MS = 60;       // ...spanning at least this long
const ROT_MIN_DEG = 0.8;       // ...with at least this much net rotation (liveness)

// Blob-detection tuning passed to the decoder. Dots are rendered large; ignore
// single-pixel specks but allow generous blur growth. Thresholding is adaptive
// inside the decoder, so no fixed light levels here.
const DECODE_OPTS = { minDotArea: 3, maxDotArea: 2500, matchToleranceFrac: 0.5 };

function shortestAngleDelta(from, to) {
  // Smallest signed difference in degrees, wrapped into (-180, 180].
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export default function ParticleScanner({
  onScanSuccess,
  onClose,
  onError,
  facingMode = "environment",
  scanBoxSize = 360,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const doneRef = useRef(false); // guards against double-firing onScanSuccess

  // Derive "unsupported" at init so we never call setState synchronously inside
  // the acquire effect (which triggers cascading renders / lint errors). The
  // active/error transitions below happen in async promise callbacks, which is fine.
  const [status, setStatus] = useState(() =>
    navigator.mediaDevices?.getUserMedia ? "init" : "unsupported"
  ); // init | active | error | unsupported
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // Callback ref: attach the stream the moment <video> lands in the DOM (it may
  // mount before or after getUserMedia resolves).
  const videoCallbackRef = useCallback((el) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  // ── Acquire the camera ──────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      // status is already "unsupported" from the lazy initializer.
      onError?.(new Error("getUserMedia not supported"));
      return;
    }

    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() || {};
        if (caps.focusMode?.includes("continuous")) {
          track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {});
        }
        setTorchSupported(Boolean(caps.torch));
        setStatus("active");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        onError?.(err);
      });

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, onError, stopStream]);

  const toggleTorch = useCallback(() => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    const next = !torchOn;
    track
      .applyConstraints({ advanced: [{ torch: next }] })
      .then(() => setTorchOn(next))
      .catch(() => {});
  }, [torchOn]);

  // ── Decode loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== "active") return;
    let active = true;

    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = scanBoxSize;
    canvas.height = scanBoxSize;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Rolling window of agreeing decodes, used for both gates.
    let win = null; // { payload, frames, startMs, unwrapped, minU, maxU, lastRaw }

    const tick = () => {
      const video = videoRef.current;
      if (!active || !video || video.readyState < 2) {
        if (active) animRef.current = requestAnimationFrame(tick);
        return;
      }

      // Center-crop the square the circular viewfinder actually shows, scaled
      // down to a fixed small canvas so decoding stays at full frame rate.
      const side = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - side) / 2;
      const sy = (video.videoHeight - side) / 2;
      ctx.drawImage(video, sx, sy, side, side, 0, 0, scanBoxSize, scanBoxSize);
      const frame = ctx.getImageData(0, 0, scanBoxSize, scanBoxSize);

      const result = analyzeParticleCloudFrame(frame, DECODE_OPTS);

      if (result) {
        const now = performance.now();
        if (!win || win.payload !== result.payload) {
          // Start a fresh window for this payload.
          win = {
            payload: result.payload,
            frames: 1,
            startMs: now,
            unwrapped: 0,
            minU: 0,
            maxU: 0,
            lastRaw: result.rotationDeg,
          };
        } else {
          // Same payload again — accumulate rotation as a continuous (unwrapped)
          // value so we can measure true net angular travel across the window.
          win.frames++;
          win.unwrapped += shortestAngleDelta(win.lastRaw, result.rotationDeg);
          win.lastRaw = result.rotationDeg;
          win.minU = Math.min(win.minU, win.unwrapped);
          win.maxU = Math.max(win.maxU, win.unwrapped);

          const spanMs = now - win.startMs;
          const rotSpread = win.maxU - win.minU;      // total sweep (either direction)
          const rotNet = Math.abs(win.unwrapped);     // net directional travel

          const agrees = win.frames >= AGREE_MIN_FRAMES && spanMs >= AGREE_MIN_MS;
          const isLive = rotSpread >= ROT_MIN_DEG && rotNet >= ROT_MIN_DEG;

          if (agrees && isLive && !doneRef.current) {
            doneRef.current = true;
            active = false;
            stopStream();
            navigator.vibrate?.(60);
            onScanSuccess?.(result.payload);
            return;
          }
        }
      } else {
        // Lost the code this frame — don't reset immediately (a single dropped
        // frame is common); only reset if it's clearly gone.
        if (win) win.frames = Math.max(1, win.frames - 1);
      }

      if (active) animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [status, scanBoxSize, onScanSuccess, stopStream]);

  const handleClose = () => {
    stopStream();
    onClose?.();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500, background: "#000",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <button onClick={handleClose} style={{
        position: "absolute", top: 20, right: 20,
        background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%",
        width: 36, height: 36, cursor: "pointer", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
      </button>

      {torchSupported && status === "active" && (
        <button onClick={toggleTorch} style={{
          position: "absolute", top: 20, left: 20,
          background: torchOn ? "rgba(125,211,252,.9)" : "rgba(255,255,255,.1)",
          border: "none", borderRadius: "50%",
          width: 36, height: 36, cursor: "pointer", color: torchOn ? "#0a1230" : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {torchOn ? "flash_on" : "flash_off"}
          </span>
        </button>
      )}

      <p style={{
        color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700,
        letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 40,
      }}>
        Quét mã đám mây hạt
      </p>

      <div style={{
        position: "relative", width: 260, height: 260, borderRadius: "50%",
        overflow: "hidden", border: "2px solid rgba(56,189,248,.6)",
        boxShadow: "0 0 40px rgba(56,189,248,.4)",
      }}>
        <video
          ref={videoCallbackRef}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", display: status === "active" ? "block" : "none",
          }}
          playsInline
          muted
        />

        {status === "active" && (
          <div style={{
            position: "absolute", left: "5%", right: "5%", height: 2, top: "10%",
            background: "linear-gradient(90deg,transparent,#38bdf8,transparent)",
            boxShadow: "0 0 8px #38bdf8", zIndex: 2,
            animation: "pccScanLine 2s ease-in-out infinite",
          }} />
        )}

        {status === "init" && (
          <div style={{ position: "absolute", inset: 0, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#38bdf8", animation: "pccSpin 1s linear infinite" }}>progress_activity</span>
          </div>
        )}
        {(status === "error" || status === "unsupported") && (
          <div style={{ position: "absolute", inset: 0, background: "#111", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#ef4444", marginBottom: 8 }}>camera_off</span>
            <p style={{ color: "#fff", fontSize: 11, fontWeight: 600, lineHeight: 1.5 }}>
              {status === "unsupported" ? "Trình duyệt chưa hỗ trợ camera" : "Không truy cập được camera"}
            </p>
          </div>
        )}
      </div>

      <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 24, fontWeight: 600 }}>
        Hướng camera vào mã đám mây hạt
      </p>

      {/* Keyframes are scoped here so the component is fully standalone. */}
      <style>{`
        @keyframes pccSpin { to { transform: rotate(360deg); } }
        @keyframes pccScanLine { 0%,100% { top: 10%; } 50% { top: 85%; } }
      `}</style>
    </div>
  );
}
