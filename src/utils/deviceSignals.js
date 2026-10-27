// Dấu hiệu thiết bị cho các ưu đãi "mỗi người một lần" (chiến dịch partner).
//
// Hai thứ, hai vai:
//   deviceId — chuỗi ngẫu nhiên giữ trong localStorage + cookie. Trùng là chắc
//              chắn cùng trình duyệt. Xoá dữ liệu / ẩn danh là mất.
//   deviceFp — băm các đặc điểm phần cứng (màn hình, GPU, số nhân, múi giờ, vẽ
//              canvas). Sống qua ẩn danh và đổi trình duyệt, nhưng HAI máy cùng
//              đời có thể trùng — nên server chỉ chặn khi trùng vân tay CÙNG mạng.
// Server chỉ lưu HMAC của cả hai; không gì ở đây rời máy dưới dạng thô.

const ID_KEY = "hugo_device_id";

const randomId = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const readCookie = (name) =>
  document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))?.split("=")[1] || "";

export function getDeviceId() {
  let id = "";
  try { id = localStorage.getItem(ID_KEY) || ""; } catch { /* storage bị chặn */ }
  if (!/^[a-f0-9]{48}$/.test(id)) id = readCookie(ID_KEY);
  if (!/^[a-f0-9]{48}$/.test(id)) id = randomId();
  try { localStorage.setItem(ID_KEY, id); } catch { /* storage bị chặn */ }
  document.cookie = `${ID_KEY}=${id}; max-age=${60 * 60 * 24 * 400}; path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  return id;
}

const canvasSample = () => {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 40;
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "16px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(100, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("Hugo×partner 🤝 ưu đãi", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Hugo×partner 🤝 ưu đãi", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "";
  }
};

const gpuSample = () => {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return "";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return info ? `${gl.getParameter(info.UNMASKED_VENDOR_WEBGL)}|${gl.getParameter(info.UNMASKED_RENDERER_WEBGL)}` : gl.getParameter(gl.RENDERER);
  } catch {
    return "";
  }
};

export async function getDeviceFingerprint() {
  const parts = [
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    window.devicePixelRatio,
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
    navigator.maxTouchPoints || 0,
    navigator.platform || "",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    gpuSample(),
    canvasSample(),
  ].join("§");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
