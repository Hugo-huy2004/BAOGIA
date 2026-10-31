import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Nhận người nhận từ MÃ TRÊN THẺ THÀNH VIÊN — quét mã vạch hoặc gõ tay.
 *
 * Thẻ (MetalCard3D) in `referralCode` thành mã vạch CODE128 và in luôn dãy chữ
 * bên dưới. Hai cách đọc cùng một mã, nên ở đây cũng có hai đường vào.
 *
 * ── VÌ SAO GÕ TAY LUÔN HIỆN, KHÔNG PHẢI PHƯƠNG ÁN DỰ PHÒNG ──────────────────
 * `BarcodeDetector` là API sẵn có của trình duyệt (không thêm thư viện nào),
 * nhưng Safari trên iOS KHÔNG có nó — mà iPhone lại là nơi app này chạy nhiều
 * nhất dưới dạng PWA. Giấu ô nhập sau một nút "không quét được?" thì trên iPhone
 * người dùng sẽ thấy một màn quét không bao giờ hoạt động. Nên ô nhập là đường
 * CHÍNH và luôn hiện; nút quét chỉ mọc thêm ở nơi trình duyệt làm được.
 *
 * Mã vạch mang mã thô (không ký), nên máy chủ tra qua `/api/joy/resolve-member`
 * — có `requireMember` và giới hạn tần suất, vì nếu không thì đây thành máy dò
 * "mã giới thiệu → tên + ảnh".
 */

const CODE_PATTERN = /^[A-Z0-9]{4,8}$/;

/** Trình duyệt này đọc được mã vạch mà không cần thư viện ngoài? */
const canScanBarcode = () => typeof window !== "undefined" && "BarcodeDetector" in window;

export default function CardCodeEntry({ onResolve, busy = false }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const stopRef = useRef(null);

  const valid = CODE_PATTERN.test(code);

  const stopScan = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setScanning(false);
  }, []);

  // Tắt camera khi rời màn. Quên bước này thì đèn camera vẫn sáng sau khi đóng
  // hộp thoại — trông như app đang quay lén.
  useEffect(() => stopScan, [stopScan]);

  const startScan = useCallback(async () => {
    setError("");
    setScanning(true);
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      const video = videoRef.current;
      if (!video) throw new Error("no-video");
      video.srcObject = stream;
      await video.play();

      const detector = new window.BarcodeDetector({ formats: ["code_128", "code_39", "ean_13"] });
      let cancelled = false;
      stopRef.current = () => {
        cancelled = true;
        stream.getTracks().forEach((track) => track.stop());
      };

      const tick = async () => {
        if (cancelled) return;
        try {
          const found = await detector.detect(video);
          const raw = found?.[0]?.rawValue?.trim().toUpperCase();
          if (raw && CODE_PATTERN.test(raw)) {
            stopScan();
            setCode(raw);
            onResolve(raw);
            return;
          }
        } catch {
          /* một khung hình mờ không phải lỗi — khung sau sẽ đọc được */
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      stream?.getTracks().forEach((track) => track.stop());
      setScanning(false);
      setError(t("memberPortal.joy.particle.cameraErrorHint", "Không mở được camera. Vui lòng nhập mã trên thẻ."));
    }
  }, [onResolve, stopScan, t]);

  return (
    <div className="grid gap-3">
      {scanning && (
        <div className="overflow-hidden rounded-[18px] bg-muted">
          <video ref={videoRef} playsInline muted className="h-[180px] w-full object-cover" />
        </div>
      )}

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-muted-foreground">
          {t("memberPortal.joy.particle.cardCodeLabel", "Mã trên thẻ thành viên")}
        </span>
        <input
          value={code}
          onChange={(event) => {
            setError("");
            // Mã in trên thẻ luôn là chữ hoa và số. Tự chuẩn hoá để người dùng
            // không bị báo sai chỉ vì bàn phím đang ở chữ thường.
            setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
          }}
          onKeyDown={(event) => { if (event.key === "Enter" && valid && !busy) onResolve(code); }}
          placeholder="A1B2C3"
          inputMode="text"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 w-full rounded-xl bg-muted px-4 text-center text-[19px] font-semibold tracking-[0.2em] text-foreground"
        />
      </label>

      {error && <p className="text-center text-[13px] font-medium text-red-500">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!valid || busy}
          onClick={() => onResolve(code)}
          className="h-11 rounded-xl bg-foreground text-[15px] font-semibold text-background disabled:opacity-40"
        >
          {busy
            ? t("memberPortal.joy.particle.verifying", "Đang xác minh…")
            : t("memberPortal.joy.particle.cardCodeFind", "Tìm người nhận")}
        </button>
        {canScanBarcode() ? (
          <button
            type="button"
            onClick={scanning ? stopScan : startScan}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-muted text-[15px] font-semibold text-foreground"
          >
            <span className="material-symbols-outlined text-[19px]">
              {scanning ? "close" : "barcode_scanner"}
            </span>
            {scanning
              ? t("memberPortal.joy.particle.cancel", "Huỷ")
              : t("memberPortal.joy.particle.cardCodeScan", "Quét mã vạch")}
          </button>
        ) : (
          <p className="flex items-center justify-center px-2 text-center text-[12px] leading-tight text-muted-foreground">
            {t("memberPortal.joy.particle.cardCodeNoScanner", "Trình duyệt này chưa quét được mã vạch — vui lòng nhập mã")}
          </p>
        )}
      </div>
    </div>
  );
}
