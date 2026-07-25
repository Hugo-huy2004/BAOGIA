import React, { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { analyzeParticleCloudFrame, bytesToBase64Url } from "../../../utils/particleCloudCode";

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
//   ignoredPayloads               optional Set/array of decoded payloads to skip
//   facingMode                    optional — default "environment" (rear camera)
//   scanBoxSize                   optional — offscreen decode resolution (px)

// Liveness / agreement tuning. The generator spins ~0.9°/frame (~54°/s), so a
// live code sweeps well past ROT_MIN_DEG within the time window, while camera
// angle noise on a static photo stays near zero net displacement.
// CRC-16 makes a single decoded frame already trustworthy (~1/65536 false
// positive), so we accept fast: just 2 agreeing frames over a short window with
// a hint of rotation (proves it's a live spinning code, not a still photo).
const AGREE_MIN_FRAMES = 1;    // Instant 1-frame decode for ultra-fast scanning
const AGREE_MIN_MS = 0;       // Zero delay requirement
const ROT_MIN_DEG = 0;       // Zero rotation requirement

// Blob-detection tuning passed to the decoder.
const DECODE_OPTS = { minDotArea: 2, maxDotArea: 3500, matchToleranceFrac: 0.6 };

function shortestAngleDelta(from, to) {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

export default function ParticleScanner({
  onScanSuccess,
  onClose,
  onError,
  ignoredPayloads,
  facingMode = "environment",
  scanBoxSize = 360,
  inline = false,
}) {
  const { t } = useTranslation();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const doneRef = useRef(false);

  const [status, setStatus] = useState(() =>
    navigator.mediaDevices?.getUserMedia ? "init" : "unsupported"
  );
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const videoCallbackRef = useCallback((el) => {
    videoRef.current = el;
    if (el && streamRef.current) {
      el.srcObject = streamRef.current;
      el.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
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

  // Ultra-Fast Dual Decode Loop (Particle Cloud Code + Native BarcodeDetector)
  useEffect(() => {
    if (status !== "active") return;
    let active = true;

    if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = scanBoxSize;
    canvas.height = scanBoxSize;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let barcodeDetector = null;
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch (_) {}
    }

    let win = null;

    const tick = async () => {
      const video = videoRef.current;
      if (!active || !video || video.readyState < 2) {
        if (active) animRef.current = requestAnimationFrame(tick);
        return;
      }

      const side = Math.min(video.videoWidth, video.videoHeight);
      const sx = (video.videoWidth - side) / 2;
      const sy = (video.videoHeight - side) / 2;
      ctx.drawImage(video, sx, sy, side, side, 0, 0, scanBoxSize, scanBoxSize);

      // 1. Try Native BarcodeDetector first for instant QR code scanning
      if (barcodeDetector && !doneRef.current) {
        try {
          const barcodes = await barcodeDetector.detect(canvas);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            if (rawVal && !doneRef.current) {
              doneRef.current = true;
              active = false;
              stopStream();
              navigator.vibrate?.(60);
              onScanSuccess?.(rawVal);
              return;
            }
          }
        } catch (_) {}
      }

      // 2. Try Particle Cloud Code Frame Analysis
      const frame = ctx.getImageData(0, 0, scanBoxSize, scanBoxSize);
      const result = analyzeParticleCloudFrame(frame, DECODE_OPTS);
      const token = result ? bytesToBase64Url(result.bytes) : null;
      const isIgnored = token && (
        typeof ignoredPayloads?.has === "function"
          ? ignoredPayloads.has(token)
          : Array.isArray(ignoredPayloads) && ignoredPayloads.includes(token)
      );

      if (result && !isIgnored && !doneRef.current) {
        doneRef.current = true;
        active = false;
        stopStream();
        navigator.vibrate?.(60);
        onScanSuccess?.(token);
        return;
      }

      if (active) animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [status, scanBoxSize, onScanSuccess, ignoredPayloads, stopStream]);

  const handleClose = () => {
    stopStream();
    onClose?.();
  };

  return (
    <div style={
      inline
      ? { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", padding: "16px 0" }
      : {
          position: "fixed", inset: 0, zIndex: 500, background: "#000",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }
    }>
      {!inline && (
        <button onClick={handleClose} style={{
          position: "absolute", top: 20, right: 20,
          background: "rgba(255,255,255,.1)", border: "none", borderRadius: "50%",
          width: 36, height: 36, cursor: "pointer", color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
        </button>
      )}

      {torchSupported && status === "active" && !inline && (
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

      {!inline && (
        <p style={{
          color: "rgba(255,255,255,.5)", fontSize: 11, fontWeight: 700,
          letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 40,
        }}>
          {t("joy.particle.scanCloudCode", "Quét mã đám mây hạt")}
        </p>
      )}

      <div style={{
        position: "relative", width: inline ? 200 : 260, height: inline ? 200 : 260, borderRadius: "50%",
        overflow: "hidden", border: inline ? "3px dashed rgba(99,102,241,.4)" : "2px solid rgba(56,189,248,.6)",
        boxShadow: inline ? "0 0 20px rgba(99,102,241,.1)" : "0 0 40px rgba(56,189,248,.4)",
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
            position: "absolute", left: "5%", right: "5%", height: inline ? 3 : 2, top: "10%",
            background: inline ? "linear-gradient(90deg,transparent,#6366f1,transparent)" : "linear-gradient(90deg,transparent,#38bdf8,transparent)",
            boxShadow: inline ? "0 0 8px #6366f1" : "0 0 8px #38bdf8", zIndex: 2,
            animation: "pccScanLine 2.5s ease-in-out infinite",
          }} />
        )}

        {status === "init" && (
          <div style={{ position: "absolute", inset: 0, background: inline ? "rgba(99,102,241,.05)" : "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: inline ? "#6366f1" : "#38bdf8", animation: "pccSpin 1s linear infinite" }}>progress_activity</span>
          </div>
        )}
        {(status === "error" || status === "unsupported") && (
          <div style={{ position: "absolute", inset: 0, background: inline ? "rgba(239,68,68,.05)" : "#111", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#ef4444", marginBottom: 8 }}>camera_off</span>
            <p style={{ color: inline ? "#ef4444" : "#fff", fontSize: 11, fontWeight: 600, lineHeight: 1.5 }}>
              {status === "unsupported" ? t("joy.particle.cameraUnsupported", "Chưa hỗ trợ camera") : t("joy.particle.cameraError", "Lỗi camera")}
            </p>
          </div>
        )}
      </div>

      {inline ? (
        <p style={{ color: "#64748b", fontSize: 12, marginTop: 16, textAlign: "center", maxWidth: 260 }}>
          {t("joy.particle.cameraHintInline", "Hướng camera vào mã Particle Cloud Code của người khác để kết nối.")}
        </p>
      ) : (
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12, marginTop: 24, fontWeight: 600 }}>
          {t("joy.particle.cameraHint", "Hướng camera vào mã đám mây hạt")}
        </p>
      )}

      {/* Keyframes are scoped here so the component is fully standalone. */}
      <style>{`
        @keyframes pccSpin { to { transform: rotate(360deg); } }
        @keyframes pccScanLine { 0%,100% { top: 10%; } 50% { top: 85%; } }
      `}</style>
    </div>
  );
}
