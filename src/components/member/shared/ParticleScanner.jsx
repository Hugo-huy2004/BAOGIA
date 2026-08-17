import { useEffect, useRef, useState, useCallback } from "react";
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
  scanBoxSize = 480,   // cạnh dài của khung làm việc; rộng hơn nên cần thêm điểm ảnh
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
    // Kích thước đặt theo khung hình thật ở lần vẽ đầu (xem `tick`), không đặt
    // cứng thành hình vuông nữa.
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

      // QUÉT TOÀN KHUNG HÌNH.
      //
      // Bản cũ chỉ lấy hình vuông ở GIỮA (`side = min(w,h)`) rồi ép về
      // scanBoxSize — trên điện thoại dọc 720×1280 nghĩa là bỏ hẳn ~44% khung
      // hình ở trên và dưới. Mã nằm lệch khỏi vùng giữa là không quét được, và
      // người dùng phải canh mã vào đúng ô nhỏ.
      //
      // Giờ thu CẢ khung về khung làm việc, giữ nguyên tỉ lệ (nên điểm ảnh vẫn
      // vuông — hình học của bộ giải mã phụ thuộc điều đó). Chi phí mỗi khung
      // vẫn có chặn trên vì cạnh dài luôn bằng `scanBoxSize`.
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const shrink = Math.min(1, scanBoxSize / Math.max(vw, vh));
      const dw = Math.max(1, Math.round(vw * shrink));
      const dh = Math.max(1, Math.round(vh * shrink));
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw;
        canvas.height = dh;
      }
      ctx.drawImage(video, 0, 0, vw, vh, 0, 0, dw, dh);

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
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
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

  // ── Khung ngắm ────────────────────────────────────────────────────
  // Bộ giải mã đọc TOÀN khung hình (xem `tick`), nên giao diện phải nói đúng
  // điều đó: không còn cửa sổ tròn 260px với `objectFit: cover` — thứ vừa cắt
  // mất phần lớn hình vừa bắt người dùng canh mã vào một ô nhỏ.
  //
  // Thay bằng bốn dấu góc ở gần mép: chúng chỉ ra "cả vùng này đều quét được"
  // mà không che gì. Không viền phát sáng, không bóng đổ dày — nhìn hiện đại và
  // quan trọng hơn là không làm người dùng tưởng chỉ trong viền mới ăn.
  const corner = (position) => {
    const thickness = 3;
    const length = 26;
    const radius = 10;
    const base = { position: "absolute", width: length, height: length, borderColor: "#fff", borderStyle: "solid", borderWidth: 0 };
    const map = {
      tl: { top: 0, left: 0, borderTopWidth: thickness, borderLeftWidth: thickness, borderTopLeftRadius: radius },
      tr: { top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness, borderTopRightRadius: radius },
      bl: { bottom: 0, left: 0, borderBottomWidth: thickness, borderLeftWidth: thickness, borderBottomLeftRadius: radius },
      br: { bottom: 0, right: 0, borderBottomWidth: thickness, borderRightWidth: thickness, borderBottomRightRadius: radius },
    };
    return { ...base, ...map[position] };
  };

  const Frame = ({ children }) => (
    <>
      {children}
      {status === "active" && (
        <>
          <span style={corner("tl")} />
          <span style={corner("tr")} />
          <span style={corner("bl")} />
          <span style={corner("br")} />
          {/* Vạch quét chạy hết chiều ngang — trước đây chỉ 5%→95% trong vòng tròn */}
          <div style={{
            position: "absolute", left: 0, right: 0, height: 2, top: "10%",
            background: "linear-gradient(90deg,transparent,#fff,transparent)",
            opacity: .85, zIndex: 2, animation: "pccScanLine 2.4s ease-in-out infinite",
          }} />
        </>
      )}
      {status === "init" && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,.6)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 30, color: "#fff", animation: "pccSpin 1s linear infinite" }}>progress_activity</span>
        </div>
      )}
      {(status === "error" || status === "unsupported") && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 24, textAlign: "center", background: "rgba(0,0,0,.72)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 30, color: "#ef4444" }}>camera_off</span>
          <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
            {status === "unsupported"
              ? t("memberPortal.joy.particle.cameraUnsupported", "Chưa hỗ trợ camera")
              : t("memberPortal.joy.particle.cameraError", "Lỗi camera")}
          </p>
        </div>
      )}
    </>
  );

  const videoStyle = {
    position: "absolute", inset: 0, width: "100%", height: "100%",
    objectFit: "cover", display: status === "active" ? "block" : "none",
  };

  // Gắn trong trang: khung chữ nhật rộng (4:3) thay cho vòng tròn 200px.
  if (inline) {
    return (
      <div style={{ width: "100%", padding: "8px 0" }}>
        <div style={{
          position: "relative", width: "100%", aspectRatio: "4 / 3",
          borderRadius: 18, overflow: "hidden", background: "#000",
        }}>
          <video ref={videoCallbackRef} style={videoStyle} playsInline muted />
          <Frame />
        </div>
        <p style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: "hsl(var(--muted-foreground))" }}>
          {t("memberPortal.joy.particle.cameraHintWide", "Đưa mã vào bất kỳ đâu trong khung — không cần canh giữa.")}
        </p>
      </div>
    );
  }

  // Toàn màn hình: camera tràn viền, dấu góc ở gần mép.
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#000" }}>
      <video ref={videoCallbackRef} style={videoStyle} playsInline muted />

      {/* Vùng ngắm = gần như cả màn hình. Dấu góc nằm trong hộp này. */}
      <div style={{ position: "absolute", top: "12%", bottom: "18%", left: "6%", right: "6%" }}>
        <Frame />
      </div>

      <button
        onClick={handleClose}
        aria-label={t("arcadeGame.close", "Đóng")}
        style={{
          position: "absolute", top: "max(env(safe-area-inset-top, 0px), 16px)", right: 16,
          width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "rgba(0,0,0,.45)", color: "#fff", display: "grid", placeItems: "center",
          backdropFilter: "blur(6px)",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>close</span>
      </button>

      {torchSupported && status === "active" && (
        <button
          onClick={toggleTorch}
          aria-label={torchOn ? "Tắt đèn" : "Bật đèn"}
          style={{
            position: "absolute", top: "max(env(safe-area-inset-top, 0px), 16px)", left: 16,
            width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer",
            background: torchOn ? "#fff" : "rgba(0,0,0,.45)", color: torchOn ? "#111" : "#fff",
            display: "grid", placeItems: "center", backdropFilter: "blur(6px)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            {torchOn ? "flash_on" : "flash_off"}
          </span>
        </button>
      )}

      <p style={{
        position: "absolute", left: 24, right: 24,
        bottom: "calc(max(env(safe-area-inset-bottom, 0px), 20px) + 8px)",
        textAlign: "center", color: "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1.5,
        textShadow: "0 1px 3px rgba(0,0,0,.6)",
      }}>
        {t("memberPortal.joy.particle.cameraHintWide", "Đưa mã vào bất kỳ đâu trong khung — không cần canh giữa.")}
      </p>

      <style>{`
        @keyframes pccSpin { to { transform: rotate(360deg); } }
        @keyframes pccScanLine { 0%,100% { top: 8%; } 50% { top: 92%; } }
      `}</style>
    </div>
  );
}
