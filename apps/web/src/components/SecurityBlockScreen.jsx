import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "hugo_security_block";

function readStoredBlock() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || parsed.error !== "ACCESS_BLOCKED") return null;
    if (!parsed.permanent && parsed.blockedUntil && new Date(parsed.blockedUntil).getTime() <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Kháng nghị mở khoá TỰ NGUYỆN: người dùng TỰ bấm, trình duyệt xin quyền camera
// + vị trí rõ ràng, rồi gửi ảnh chính chủ về cho quản trị xem xét. Không có gì
// chạy ngầm — không bấm "Bắt đầu" thì camera không hề bật.
function AppealFlow({ caseId }) {
  const [phase, setPhase] = useState("intro"); // intro | camera | review | sending | done | error
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState("");
  const [coords, setCoords] = useState(null);
  const [msg, setMsg] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  useEffect(() => stopCamera, []);

  const startCamera = async () => {
    setMsg("");
    if (!email.includes("@")) { setMsg("Vui lòng nhập đúng email tài khoản bị khoá."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setPhase("camera");
      // Chờ React gắn <video> rồi mới nối luồng.
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play?.(); } }, 50);
      // Vị trí là TUỲ CHỌN: từ chối vẫn gửi kháng nghị được.
      navigator.geolocation?.getCurrentPosition(
        (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        () => setCoords(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    } catch {
      setMsg("Không mở được camera. Bạn cần cấp quyền camera cho trang này.");
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 640;
    canvas.height = v.videoHeight || 480;
    canvas.getContext("2d").drawImage(v, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setPhase("review");
  };

  const submit = async () => {
    setPhase("sending");
    try {
      const res = await fetch("/api/security/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, email: email.trim(), image: photo, ...(coords || {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error || "Gửi thất bại."); setPhase("error"); return; }
      setMsg(data.message || "Đã gửi kháng nghị.");
      setPhase("done");
    } catch {
      setMsg("Lỗi mạng, vui lòng thử lại.");
      setPhase("error");
    }
  };

  if (phase === "done") {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-foreground">
        <p className="font-bold text-emerald-600">✓ Đã gửi kháng nghị</p>
        <p className="mt-1 text-muted-foreground">{msg} Nếu được duyệt, tài khoản sẽ mở khoá và bạn đăng nhập lại bình thường.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
      <p className="text-sm font-bold text-foreground">Chứng minh chính chủ để mở khoá</p>
      <p className="mt-1 text-xs leading-6 text-muted-foreground">
        Nếu đây là nhầm lẫn, bạn có thể <b>tự nguyện</b> gửi một ảnh chụp khuôn mặt và vị trí hiện tại
        để chứng minh mình là chủ tài khoản. Trình duyệt sẽ hỏi quyền camera và vị trí — bạn có toàn
        quyền từ chối. Ảnh chỉ dùng để xét duyệt và được xoá sau khi có kết quả.
      </p>

      {phase === "intro" && (
        <div className="mt-3 space-y-2">
          <input
            type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email tài khoản bị khoá"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
          <button type="button" onClick={startCamera}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:opacity-90 cursor-pointer">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">photo_camera</span>
            Bắt đầu xác minh
          </button>
        </div>
      )}

      {phase === "camera" && (
        <div className="mt-3 space-y-2">
          <video ref={videoRef} playsInline muted className="w-full rounded-xl bg-black aspect-[4/3] object-cover" />
          <p className="text-xs text-muted-foreground">{coords ? "✓ Đã lấy vị trí" : "Đang chờ vị trí (tuỳ chọn)…"}</p>
          <button type="button" onClick={capture}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:opacity-90 cursor-pointer">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">camera</span>
            Chụp ảnh
          </button>
        </div>
      )}

      {(phase === "review" || phase === "sending" || phase === "error") && (
        <div className="mt-3 space-y-2">
          {photo && <img src={photo} alt="Ảnh xác minh" className="w-full rounded-xl aspect-[4/3] object-cover" />}
          <button type="button" onClick={submit} disabled={phase === "sending"}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-bold text-background hover:opacity-90 cursor-pointer disabled:opacity-60">
            {phase === "sending" ? "Đang gửi…" : "Gửi kháng nghị"}
          </button>
          <button type="button" onClick={() => { setPhoto(""); setPhase("intro"); }}
            className="w-full rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground hover:bg-muted cursor-pointer">
            Chụp lại
          </button>
        </div>
      )}

      {msg && <p className="mt-2 text-xs text-rose-500">{msg}</p>}
    </div>
  );
}

export function SecurityBlockBoundary({ children }) {
  const [block, setBlock] = useState(readStoredBlock);

  useEffect(() => {
    const onBlocked = (event) => setBlock(event.detail || readStoredBlock());
    window.addEventListener("hugo:security-blocked", onBlocked);
    return () => window.removeEventListener("hugo:security-blocked", onBlocked);
  }, []);

  if (!block) return children;

  const handleSelfUnlock = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setBlock(null);
      window.location.reload();
    } catch {}
  };

  return (
    <main className="min-h-screen bg-background text-foreground grid place-items-center px-5 py-12">
      <section className="w-full max-w-xl rounded-3xl border border-rose-500/20 bg-card p-7 sm:p-10 shadow-2xl" role="alert" aria-live="assertive">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500 text-2xl" aria-hidden="true">
            verified_user
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Bảo mật Hugo Security Sentinel</p>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Xác Nhận Người Dùng Thật</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {block.message || "Hệ thống phát hiện tần suất truy cập bất thường từ thiết bị của bạn. Để đảm bảo an toàn, vui lòng xác nhận bạn là con người."}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSelfUnlock}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-rose-700 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">check_circle</span>
            Tôi là người dùng thật (Vào lại ứng dụng)
          </button>
        </div>

        {/* Chỉ mời xác minh bằng ảnh khi tài khoản bị khoá thật (có hạn/vĩnh viễn),
            không phải cảnh báo "nghi ngờ thiết bị" mà bấm nút trên là vào lại được. */}
        {(block.permanent || block.blockedUntil) && <AppealFlow caseId={block.caseId} />}

        <dl className="mt-6 grid gap-2 rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Mã vụ việc:</span>
            <span className="font-mono font-bold text-foreground">{block.caseId || "N/A"}</span>
          </div>
        </dl>
      </section>
    </main>
  );
}

export const SECURITY_BLOCK_STORAGE_KEY = STORAGE_KEY;
