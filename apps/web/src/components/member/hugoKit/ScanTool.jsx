import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../demos/iosKit";
import ParticleScanner from "../shared/ParticleScanner";
import notify from "../../../lib/notify";

/**
 * Quét mã QR bằng camera.
 *
 * ponytail: dùng lại `ParticleScanner` của ví JOY thay vì viết bộ giải mã thứ
 * hai — nó đã có sẵn `BarcodeDetector` của trình duyệt kèm bộ giải mã dự phòng
 * và phần dọn luồng camera cho tử tế.
 */
const isUrl = (value) => /^https?:\/\//i.test(value.trim());

export default function ScanTool() {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(true);
  const [value, setValue] = useState("");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      notify.success(t("kit.copied"));
    } catch {
      notify.error(t("kit.copyFailed"));
    }
  };

  const again = () => {
    setValue("");
    setScanning(true);
  };

  if (scanning) {
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-[12px]" style={{ background: "var(--ios-surface)" }}>
          <ParticleScanner
            inline
            onScanSuccess={(decoded) => {
              setValue(String(decoded || ""));
              setScanning(false);
            }}
            onError={() => {
              setScanning(false);
              notify.error(t("kit.scan.cameraError"));
            }}
          />
        </div>
        <p className="px-1 text-[13px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
          {t("kit.scan.hint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
          <p className="text-[13px]" style={{ color: "var(--ios-label-2)" }}>{t("kit.result")}</p>
          <p className="mt-1.5 break-all text-[16px] leading-snug">{value}</p>
        </div>
      ) : (
        <p className="px-1 text-[15px]" style={{ color: "var(--ios-label-2)" }}>{t("kit.scan.cameraError")}</p>
      )}

      <div className="flex gap-2">
        <Button full onClick={again}>{t("kit.scan.again")}</Button>
        {value && <Button variant="gray" onClick={copy} className="shrink-0 px-5">{t("kit.copy")}</Button>}
      </div>

      {/* Mở liên kết quét được bằng thẻ <a> chứ không window.open: mã QR là nội
          dung do người lạ tạo ra, `noopener` cắt quyền của trang đích với tab
          hiện tại. */}
      {value && isUrl(value) && (
        <a
          href={value.trim()}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex min-h-[44px] items-center justify-center rounded-[12px] text-[17px] font-semibold"
          style={{ background: "var(--ios-fill)", color: "var(--ax)" }}
        >
          {t("kit.open")}
        </a>
      )}
    </div>
  );
}
