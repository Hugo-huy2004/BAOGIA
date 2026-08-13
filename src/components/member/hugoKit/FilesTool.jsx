import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ListGroup, ListRow, Segmented } from "../../demos/iosKit";
import { useJoyStore } from "../../../stores/joyStore";
import JoyExchangeModal from "../shared/JoyExchangeModal";

const API = import.meta.env.VITE_API_URL || "/api";
const MAX_BYTES = 50 * 1024 * 1024;
const LEVELS = ["light", "medium", "strong"];

const prettySize = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/**
 * Xử lý tệp: giải nén ZIP và giảm dung lượng ảnh/video.
 *
 * Mức nén "light" miễn phí, hai mức còn lại đi qua phiếu trao đổi JOY dùng
 * chung — client không tự tính giá, server báo giá trong phiếu.
 */
export default function FilesTool({ bio, showToast }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("extract");

  const [zipFile, setZipFile] = useState(null);
  const [zipResult, setZipResult] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const zipInput = useRef(null);

  const [mediaFile, setMediaFile] = useState(null);
  const [level, setLevel] = useState("medium");
  const [compressing, setCompressing] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const mediaInput = useRef(null);

  const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const uploadZip = async () => {
    if (!zipFile) return showToast?.(t("utilities.fileTools.extract.toastSelectZip"), "error");
    if (!zipFile.name.toLowerCase().endsWith(".zip")) return showToast?.(t("utilities.fileTools.extract.toastZipFormat"), "error");
    if (zipFile.size > MAX_BYTES) return showToast?.(t("utilities.fileTools.extract.toastSizeLimit"), "error");

    setExtracting(true);
    try {
      const body = new FormData();
      body.append("file", zipFile);
      const res = await fetch(`${API}/files/extract/upload`, { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("utilities.fileTools.extract.toastReadError"));
      setZipResult(data);
      showToast?.(t("utilities.fileTools.extract.toastReadSuccess"), "success");
    } catch (err) {
      showToast?.(err.message || t("utilities.fileTools.extract.toastReadError"), "error");
    } finally {
      setExtracting(false);
    }
  };

  // Tải bằng fetch chứ không phải <a href>: interceptor mới gắn được token
  // thành viên cho bản chạy khác origin.
  const downloadEntry = async (name) => {
    try {
      const res = await fetch(
        `${API}/files/extract/download/${zipResult.fileId}?entryName=${encodeURIComponent(name)}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error(t("utilities.fileTools.extract.toastReadError"));
      saveBlob(await res.blob(), name.split("/").pop());
    } catch (err) {
      showToast?.(err.message || t("utilities.fileTools.extract.toastReadError"), "error");
    }
  };

  // Ném lỗi ra ngoài: nhánh miễn phí tự bắt và toast, nhánh trả phí để phiếu
  // JOY hiển thị lỗi ngay trong phiếu.
  const compress = async () => {
    setCompressing(true);
    try {
      const body = new FormData();
      body.append("file", mediaFile);
      body.append("level", level);
      body.append("email", bio?.email || "");

      const res = await fetch(`${API}/files/compress`, { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("utilities.fileTools.compress.toastError"));
      }

      if (level !== "light" && bio?.email) {
        useJoyStore.getState().fetchBalance(bio.email, undefined, { force: true });
      }

      const base = mediaFile.name.slice(0, mediaFile.name.lastIndexOf("."));
      const isVideo = mediaFile.type.startsWith("video/");
      saveBlob(await res.blob(), `compressed_${base}${isVideo ? ".mp4" : mediaFile.name.slice(mediaFile.name.lastIndexOf("."))}`);
      showToast?.(t("utilities.fileTools.compress.toastSuccess"), "success");
      return { success: true };
    } finally {
      setCompressing(false);
    }
  };

  const startCompress = () => {
    if (!mediaFile) return showToast?.(t("utilities.fileTools.compress.toastSelectFile"), "error");
    if (mediaFile.size > MAX_BYTES) return showToast?.(t("utilities.fileTools.extract.toastSizeLimit"), "error");
    if (level !== "light") return setInvoiceOpen(true);
    compress().catch((err) => showToast?.(err.message || t("utilities.fileTools.compress.toastError"), "error"));
  };

  const entries = (zipResult?.entries || []).filter((entry) => !entry.isDirectory && !entry.name.includes("__MACOSX"));

  return (
    <div className="space-y-5">
      <Segmented
        items={[
          { id: "extract", label: t("utilities.fileTools.tabExtract") },
          { id: "compress", label: t("utilities.fileTools.tabCompress") },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "extract" ? (
        <>
          <ListGroup footer={t("utilities.fileTools.extract.label")}>
            <ListRow
              icon="folder_zip"
              title={zipFile ? zipFile.name : t("utilities.fileTools.extract.label")}
              value={zipFile ? prettySize(zipFile.size) : null}
              chevron
              last
              onClick={() => zipInput.current?.click()}
            />
          </ListGroup>
          <input
            ref={zipInput}
            type="file"
            accept=".zip"
            hidden
            onChange={(e) => { setZipFile(e.target.files[0] || null); setZipResult(null); }}
          />

          <Button full onClick={uploadZip} disabled={!zipFile || extracting}>
            {extracting ? t("utilities.fileTools.extract.processing") : t("utilities.fileTools.extract.btnUpload")}
          </Button>

          {entries.length > 0 && (
            <ListGroup header={t("utilities.fileTools.extract.resultTitle")}>
              {entries.map((entry, index) => (
                <ListRow
                  key={entry.name}
                  icon="description"
                  title={entry.name.split("/").pop()}
                  subtitle={`${(entry.size / 1024).toFixed(1)} KB`}
                  trailing={<span className="material-symbols-outlined text-[20px]" style={{ color: "var(--ax)" }}>download</span>}
                  last={index === entries.length - 1}
                  onClick={() => downloadEntry(entry.name)}
                />
              ))}
            </ListGroup>
          )}
        </>
      ) : (
        <>
          <ListGroup footer={t("utilities.fileTools.compress.label")}>
            <ListRow
              icon="image"
              title={mediaFile ? mediaFile.name : t("utilities.fileTools.compress.label")}
              value={mediaFile ? prettySize(mediaFile.size) : null}
              chevron
              last
              onClick={() => mediaInput.current?.click()}
            />
          </ListGroup>
          <input
            ref={mediaInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
            hidden
            onChange={(e) => setMediaFile(e.target.files[0] || null)}
          />

          <div className="space-y-2">
            <p className="px-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
              {t("utilities.fileTools.compress.levelSection")}
            </p>
            <Segmented
              items={LEVELS.map((id) => ({ id, label: t(`utilities.fileTools.compress.levels.${id}`) }))}
              value={level}
              onChange={setLevel}
            />
          </div>

          <Button full onClick={startCompress} disabled={!mediaFile || compressing}>
            {compressing ? t("utilities.fileTools.extract.processing") : t("utilities.fileTools.compress.btnSubmit")}
          </Button>

          <p className="px-1 text-[13px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
            {t("utilities.fileTools.compress.privacyNote")}
          </p>
        </>
      )}

      <JoyExchangeModal
        open={invoiceOpen}
        bio={bio}
        item="fileCompression"
        onClose={() => setInvoiceOpen(false)}
        onConfirm={compress}
        onSuccess={() => { if (bio?.email) useJoyStore.getState().fetchBalance(bio.email, undefined, { force: true }); }}
      />
    </div>
  );
}
