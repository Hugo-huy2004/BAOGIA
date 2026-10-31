import { API_BASE } from "../config/apiBase";
import { getMemberSession, loginMember } from "../services/api/core/authSession";

/**
 * Cài app mà không phải đăng nhập lại.
 *
 * iOS cho app trên màn hình chính một kho cookie riêng, nên phiên ở Safari không
 * theo sang. Trước khi người dùng bấm "Thêm vào MH chính", ta xin một mã dùng một
 * lần (Better Auth oneTimeToken, 30 phút) và trỏ thẻ manifest sang bản có mã đó
 * trong start_url. App mở lần đầu đổi mã lấy đúng phiên đang dùng.
 * Android dùng chung cookie với Chrome nên không cần, nhưng có mã cũng vô hại.
 */
const PARAM = "handoff";
const client = async () => (await import("../lib/authClient")).memberAuthClient;

/** Trả mã (để ghép vào link chép sang Safari) hoặc "" nếu chưa đăng nhập / lỗi. */
export async function prepareInstallHandoff() {
  if (!getMemberSession()) return "";
  try {
    const { data } = await (await client()).oneTimeToken.generate();
    const link = document.querySelector('link[rel="manifest"]');
    if (!data?.token) return "";
    if (link) link.href = `${API_BASE}/pwa-manifest?${PARAM}=${encodeURIComponent(data.token)}`;
    return data.token;
  } catch {
    return ""; // cài vẫn được, chỉ là mở app sẽ phải đăng nhập
  }
}

export const withHandoff = (path, token) => (token ? `${path}${path.includes("?") ? "&" : "?"}${PARAM}=${encodeURIComponent(token)}` : path);

/** Gọi một lần lúc app khởi động. true = vừa nhận phiên từ trình duyệt. */
export async function redeemInstallHandoff() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get(PARAM);
  if (!token) return false;
  url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  if (getMemberSession()) return false;
  let bearer = "";
  const { data } = await (await client()).oneTimeToken.verify({
    token,
    fetchOptions: { onSuccess: (ctx) => { bearer = ctx.response.headers.get("set-auth-token") || ""; } },
  }).catch(() => ({}));
  const user = data?.user;
  if (!user) return false; // mã hết hạn / đã dùng: rơi về màn đăng nhập như thường
  loginMember({ email: user.email, displayName: user.name, avatarUrl: user.image, provider: "handoff", token: bearer });
  return true;
}
