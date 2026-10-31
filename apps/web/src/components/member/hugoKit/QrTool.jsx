import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import { Button, ListGroup, ListRow, Segmented } from "../../demos/iosKit";

const TYPES = ["url", "vcard", "wifi", "text"];
const LABEL_KEYS = {
  url: "memberPortal.utilitiesPage.nfc.typeUrl",
  vcard: "memberPortal.utilitiesPage.nfc.typeVcard",
  wifi: "memberPortal.utilitiesPage.nfc.typeWifi",
  text: "memberPortal.utilitiesPage.nfc.typeText",
};

const inputClass = "w-full border-0 bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-[var(--ios-label-3)] focus:ring-0";

// Nhãn vCard trong file dịch viết HOA TOÀN BỘ (dấu vết của giao diện cũ toàn
// chữ hoa cỡ 10px). Dòng danh sách iOS đọc như đang quát, nên hạ về câu thường
// ở chỗ hiển thị thay vì sửa nhãn trong cả 9 ngôn ngữ.
const sentenceCase = (value = "") => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

/**
 * Trình tạo mã QR: hồ sơ, danh bạ (vCard), WiFi và văn bản tự do.
 *
 * ponytail: mã hoá WiFi cố định WPA/WPA2 — WEP đã bị khai tử và mạng mở thì
 * không cần QR. Thêm ô chọn lại nếu có người thật sự cần WEP.
 */
export default function QrTool({ bio, publicLink, showToast }) {
  const { t } = useTranslation();
  const qrRef = useRef(null);

  const [type, setType] = useState("url");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [text, setText] = useState("");

  const payload = () => {
    switch (type) {
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${bio?.displayName || ""}\nTEL:${bio?.phone || ""}\nURL:${publicLink}\nEND:VCARD`;
      case "wifi":
        return `WIFI:T:WPA;S:${ssid};P:${password};;`;
      case "text":
        return text || publicLink;
      default:
        return publicLink;
    }
  };

  // SVG → canvas → PNG: ảnh tải về phải dùng được ở kích thước in, và nền
  // trắng phải vẽ tay vì SVG của thư viện trong suốt.
  const download = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    try {
      const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 1000, 1000);
        ctx.drawImage(image, 100, 100, 800, 800);
        URL.revokeObjectURL(url);

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `QR_${type}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast?.(t("utilities.qrCode.downloadSuccess"), "success");
      };
      image.onerror = () => showToast?.(t("utilities.qrCode.downloadError"), "error");
      image.src = url;
    } catch {
      showToast?.(t("utilities.qrCode.downloadError"), "error");
    }
  };

  return (
    <div className="space-y-5">
      <Segmented
        items={TYPES.map((id) => ({ id, label: t(LABEL_KEYS[id]) }))}
        value={type}
        onChange={setType}
      />

      <div className="flex flex-col items-center gap-5 rounded-[12px] py-6" style={{ background: "var(--ios-surface)" }}>
        <div ref={qrRef} className="rounded-[12px] bg-white p-4">
          <QRCodeSVG value={payload()} size={200} level="H" fgColor="#000000" />
        </div>
        <Button onClick={download} className="px-6">
          <span className="material-symbols-outlined text-[20px]">download</span>
          {t("utilities.qrCode.downloadBtn")}
        </Button>
      </div>

      {type === "url" && (
        <ListGroup footer={t("utilities.qrCode.profileUrlDesc")}>
          <ListRow title={publicLink} last />
        </ListGroup>
      )}

      {type === "vcard" && (
        <ListGroup header={t("utilities.qrCode.iceContactLabel")} footer={t("utilities.qrCode.vcardDesc")}>
          <ListRow title={sentenceCase(t("utilities.vcard.fields.firstName"))} value={bio?.displayName || "—"} />
          <ListRow title={sentenceCase(t("utilities.vcard.fields.phone"))} value={bio?.phone || "—"} />
          <ListRow title={sentenceCase(t("utilities.vcard.fields.email"))} value={bio?.contactEmail || bio?.email || "—"} last />
        </ListGroup>
      )}

      {type === "wifi" && (
        <ListGroup header={t("utilities.qrCode.wifiLabel")} footer={t("utilities.qrCode.wifiDesc")}>
          <input
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            placeholder={t("utilities.qrCode.wifiSsidLabel")}
            className={`${inputClass} border-b-[0.5px] border-[var(--ios-sep)]`}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("utilities.qrCode.wifiPasswordLabel")}
            className={inputClass}
          />
        </ListGroup>
      )}

      {type === "text" && (
        <ListGroup header={t("utilities.qrCode.customTextLabel")} footer={t("utilities.qrCode.customTextDesc")}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </ListGroup>
      )}
    </div>
  );
}
