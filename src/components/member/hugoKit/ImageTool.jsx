import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ListGroup, ListRow, Segmented } from "../../demos/iosKit";
import notify from "../../../lib/notify";

/**
 * Đổi kích thước và định dạng ảnh — ngay trên máy, không gửi lên máy chủ.
 *
 * Khác với "Nén ảnh/video" trong Xử lý tệp: cái kia đẩy tệp lên server và mức
 * nén mạnh thì tốn JOY. Cái này chạy bằng canvas nên miễn phí, tức thì, và ảnh
 * không rời khỏi máy — hợp với việc thu nhỏ ảnh trước khi đính kèm hay đăng.
 *
 * ponytail: thu nhỏ một lần bằng drawImage. Ảnh giảm quá nửa sẽ hơi rỗ so với
 * cách thu nhiều bước; đổi sang giảm dần từng nửa nếu chất lượng thành vấn đề.
 */
const WIDTHS = [640, 1080, 1920];
const FORMATS = [
  { id: "image/webp", label: "WebP", ext: "webp" },
  { id: "image/jpeg", label: "JPEG", ext: "jpg" },
  { id: "image/png", label: "PNG", ext: "png" },
];

const prettySize = (bytes) => (bytes >= 1024 * 1024
  ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function ImageTool() {
  const { t } = useTranslation();
  const fileInput = useRef(null);
  const [file, setFile] = useState(null);
  const [maxWidth, setMaxWidth] = useState(1080);
  const [format, setFormat] = useState("image/webp");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  // Mỗi kết quả là một objectURL; không thu hồi thì mỗi lần bấm lại giữ thêm
  // một ảnh trong bộ nhớ cho tới khi rời trang.
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const convert = async () => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxWidth / bitmap.width);
      const width = Math.round(bitmap.width * scale);
      const height = Math.round(bitmap.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, width, height);
      bitmap.close?.();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, 0.86));
      if (!blob) throw new Error("encode failed");

      setResult((previous) => {
        if (previous?.url) URL.revokeObjectURL(previous.url);
        return { blob, url: URL.createObjectURL(blob), width, height };
      });
    } catch {
      notify.error(t("kit.image.error"));
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    const ext = FORMATS.find((item) => item.id === format)?.ext || "img";
    const base = file.name.replace(/\.[^.]+$/, "");
    const link = document.createElement("a");
    link.href = result.url;
    link.download = `${base}_${result.width}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <ListGroup footer={t("kit.image.desc")}>
        <ListRow
          icon="image"
          title={file ? file.name : t("kit.image.pick")}
          value={file ? prettySize(file.size) : null}
          chevron
          last
          onClick={() => fileInput.current?.click()}
        />
      </ListGroup>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          setFile(e.target.files[0] || null);
          setResult((previous) => { if (previous?.url) URL.revokeObjectURL(previous.url); return null; });
        }}
      />

      <div className="space-y-2">
        <p className="px-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>{t("kit.image.maxWidth")}</p>
        <Segmented
          items={WIDTHS.map((width) => ({ id: String(width), label: `${width}px` }))}
          value={String(maxWidth)}
          onChange={(next) => setMaxWidth(Number(next))}
        />
      </div>

      <div className="space-y-2">
        <p className="px-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>{t("kit.image.format")}</p>
        <Segmented
          items={FORMATS.map((item) => ({ id: item.id, label: item.label }))}
          value={format}
          onChange={setFormat}
        />
      </div>

      <Button full onClick={convert} disabled={!file || busy}>
        {busy ? t("kit.image.working") : t("kit.image.convert")}
      </Button>

      {result && (
        <div className="space-y-3 rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
          <img
            src={result.url}
            alt=""
            className="mx-auto max-h-[220px] w-auto rounded-[8px]"
          />
          <div className="flex items-center justify-center gap-2 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
            <span>{prettySize(file.size)}</span>
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
            <span style={{ color: "var(--ios-label)" }}>
              {prettySize(result.blob.size)} · {result.width}×{result.height}
            </span>
          </div>
          <Button full onClick={download}>{t("kit.download")}</Button>
        </div>
      )}
    </div>
  );
}
