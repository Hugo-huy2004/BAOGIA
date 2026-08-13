import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ListGroup, ListRow, Segmented, Toggle } from "../../demos/iosKit";

// Chữ ký chạy trong Gmail/Outlook/Apple Mail — nơi font tuỳ biến và CSS ngoài
// đều bị lột sạch. Vì vậy: bảng biểu, style nội tuyến, font an toàn cố định.
const FONT = "Arial, Helvetica, sans-serif";
const AVATAR_FALLBACK = "https://res.cloudinary.com/dku1mdfd9/image/upload/v1716300000/default-avatar.png";

const TEMPLATES = ["modern", "minimal"];
const COLORS = [
  { id: "gold", hex: "#d97706" },
  { id: "blue", hex: "#2563eb" },
  { id: "violet", hex: "#7c3aed" },
  { id: "black", hex: "#18181b" },
];

const SOCIAL_DOMAINS = {
  "facebook.com": "facebook",
  "linkedin.com": "linkedin",
  "github.com": "github",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "instagram.com": "instagram",
  "youtube.com": "youtube",
  "tiktok.com": "tiktok",
};

// Nhãn trong file dịch còn viết HOA TOÀN BỘ từ giao diện cũ; dòng iOS 17px đọc
// như đang quát nên hạ về câu thường ngay chỗ hiển thị.
const sentenceCase = (value = "") => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

const socialsOf = (bio) => (bio?.links || [])
  .map((link) => {
    const url = link?.url || "";
    const domain = Object.keys(SOCIAL_DOMAINS).find((key) => url.toLowerCase().includes(key));
    return domain ? { platform: SOCIAL_DOMAINS[domain], url } : null;
  })
  .filter(Boolean)
  .slice(0, 5);

function SocialIcons({ socials, color }) {
  if (socials.length === 0) return null;
  return (
    <div style={{ marginTop: "12px" }}>
      {socials.map((social) => (
        <a key={social.url} href={social.url} target="_blank" rel="noopener noreferrer" style={{ marginRight: "8px", display: "inline-block", textDecoration: "none" }}>
          <img
            src={`https://api.iconify.design/simple-icons/${social.platform}.svg?color=${encodeURIComponent(color)}`}
            alt={social.platform}
            style={{ width: "20px", height: "20px", display: "block", border: "none" }}
          />
        </a>
      ))}
    </div>
  );
}

/**
 * Trình tạo chữ ký email.
 *
 * Còn hai bố cục và bốn màu: bản cũ có 4 mẫu × 7 màu × 5 font × 2 công tắc ×
 * 3 lời nhắn chân trang — tổ hợp không ai dùng hết, mà mỗi lựa chọn thêm lại
 * là một biến thể HTML phải kiểm tra trên từng trình đọc mail.
 */
export default function SignatureTool({ bio, publicLink, showToast }) {
  const { t } = useTranslation();
  const [template, setTemplate] = useState("modern");
  const [color, setColor] = useState(COLORS[0].hex);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showQr, setShowQr] = useState(false);

  const socials = socialsOf(bio);
  const name = bio?.displayName || t("utilities.signature.fallbackName");
  const role = bio?.jobTitle || t("utilities.signature.fallbackTitle");
  const email = bio?.contactEmail || bio?.email;
  const shortLink = (publicLink || "").replace(/^https?:\/\//, "");
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(publicLink || "")}`;

  const signatureHtml = () => document.getElementById("hugokit-signature")?.innerHTML || "";

  const copy = async () => {
    const node = document.getElementById("hugokit-signature");
    if (!node) return;
    try {
      if (window.ClipboardItem && navigator.clipboard?.write) {
        await navigator.clipboard.write([new ClipboardItem({
          "text/html": new Blob([node.innerHTML], { type: "text/html" }),
          "text/plain": new Blob([node.innerText], { type: "text/plain" }),
        })]);
      } else {
        // Safari cũ không có ClipboardItem: chọn vùng rồi copy để giữ định dạng.
        const range = document.createRange();
        range.selectNode(node);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        selection.removeAllRanges();
      }
      showToast?.(t("utilities.signature.copiedText"), "success");
    } catch {
      showToast?.(t("utilities.signature.copiedError"), "warning");
    }
  };

  const downloadHtml = () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${signatureHtml()}</body></html>`], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `signature_${bio?.slug || "email"}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast?.(t("utilities.signature.downloadSuccess"), "success");
  };

  return (
    <div className="space-y-5">
      <Segmented
        items={TEMPLATES.map((id) => ({ id, label: t(`utilities.signature.templates.${id}`) }))}
        value={template}
        onChange={setTemplate}
      />

      <ListGroup header={t("utilities.signature.designLayout")}>
        <div className="flex items-center gap-3 border-b-[0.5px] px-4 py-3" style={{ borderColor: "var(--ios-sep)" }}>
          <span className="flex-1 truncate text-[17px]">{sentenceCase(t("utilities.signature.fields.color"))}</span>
          <span className="flex gap-2">
            {COLORS.map((swatch) => (
              <button
                key={swatch.id}
                type="button"
                onClick={() => setColor(swatch.hex)}
                aria-label={t(`utilities.signature.colors.${swatch.id}`)}
                aria-pressed={color === swatch.hex}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-95"
                style={{ background: swatch.hex, outline: color === swatch.hex ? "2px solid var(--ios-label)" : "none", outlineOffset: 2 }}
              >
                {color === swatch.hex && <span className="material-symbols-outlined text-[16px] text-white">check</span>}
              </button>
            ))}
          </span>
        </div>
        <ListRow
          title={t("utilities.signature.fields.showAvatar")}
          trailing={<Toggle checked={showAvatar} onChange={setShowAvatar} label={t("utilities.signature.fields.showAvatar")} />}
        />
        <ListRow
          title={t("utilities.signature.fields.includeQr")}
          trailing={<Toggle checked={showQr} onChange={setShowQr} label={t("utilities.signature.fields.includeQr")} />}
          last
        />
      </ListGroup>

      <div className="space-y-2">
        <p className="px-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
          {t("utilities.signature.previewTitle")}
        </p>
        <div className="overflow-x-auto rounded-[12px] bg-white p-5">
          <div id="hugokit-signature" style={{ fontFamily: FONT, color: "#111827", maxWidth: "580px" }}>
            {template === "modern" ? (
              <table cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    {showAvatar && (
                      <td style={{ verticalAlign: "top", paddingRight: "16px", borderRight: `3px solid ${color}` }}>
                        <img src={bio?.avatarUrl || AVATAR_FALLBACK} alt="" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", display: "block" }} />
                      </td>
                    )}
                    <td style={{ verticalAlign: "middle", paddingLeft: showAvatar ? "16px" : 0 }}>
                      <div style={{ fontSize: "18px", fontWeight: "bold" }}>{name}</div>
                      <div style={{ fontSize: "11px", color, fontWeight: "bold", textTransform: "uppercase", marginTop: "4px", letterSpacing: "0.5px" }}>{role}</div>
                      <div style={{ marginTop: "10px", fontSize: "12px", color: "#4b5563", lineHeight: "1.6" }}>
                        {bio?.phone && <>{bio.phone}<br /></>}
                        {email}<br />
                        <a href={publicLink} style={{ color, textDecoration: "none", fontWeight: "bold" }}>{shortLink}</a>
                      </div>
                      <SocialIcons socials={socials} color={color} />
                    </td>
                    {showQr && (
                      <td style={{ verticalAlign: "middle", paddingLeft: "20px" }}>
                        <img src={qrSrc} alt="QR" style={{ width: "70px", height: "70px", display: "block" }} />
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            ) : (
              <div style={{ borderTop: `1px solid ${color}`, paddingTop: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                  {name} <span style={{ color, fontSize: "12px" }}>| {role}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px", lineHeight: "1.6" }}>
                  {bio?.phone && <>{bio.phone} &bull; </>}
                  {email}<br />
                  <a href={publicLink} style={{ color: "#111827", textDecoration: "none", fontWeight: "bold" }}>{shortLink}</a>
                </div>
                <SocialIcons socials={socials} color={color} />
                {showQr && <img src={qrSrc} alt="QR" style={{ width: "60px", height: "60px", display: "block", marginTop: "12px" }} />}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button full onClick={copy}>
          <span className="material-symbols-outlined text-[20px]">content_copy</span>
          {t("utilities.signature.copyBtn")}
        </Button>
        <Button full variant="gray" onClick={downloadHtml}>
          <span className="material-symbols-outlined text-[20px]">html</span>
          {t("utilities.signature.downloadHtmlBtn")}
        </Button>
      </div>
    </div>
  );
}
