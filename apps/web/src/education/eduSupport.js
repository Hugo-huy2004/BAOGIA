import { CONTACT } from "./legalText";
import { getMemberSession } from "../services/api/core/authSession";
import { detectInstallTarget } from "../config/platform";

/**
 * Thư hỗ trợ soạn sẵn: điện thoại / app đã cài → mailto: (mở app Mail mặc định);
 * máy tính → khung soạn thư Gmail trên web. Điền sẵn người nhận, tiêu đề và thông tin thành viên;
 * người học chỉ việc viết yêu cầu. Không gửi gì qua máy chủ.
 */
const COPY = {
  vi: { subject: "Yêu cầu hỗ trợ Education Hugo", info: "Thông tin thành viên", nick: "Biệt danh", code: "Mã bạn", email: "Email tài khoản", device: "Thiết bị", page: "Trang đang mở", ask: "Yêu cầu hỗ trợ", hint: "(Bạn mô tả vấn đề ở đây — đang làm gì, thấy gì, mong muốn gì.)" },
  en: { subject: "Education Hugo support request", info: "Member information", nick: "Nickname", code: "Friend code", email: "Account email", device: "Device", page: "Page", ask: "Support request", hint: "(Describe the problem here — what you were doing, what you saw, what you expected.)" },
  zh: { subject: "Education Hugo 支持请求", info: "会员信息", nick: "昵称", code: "好友码", email: "账户邮箱", device: "设备", page: "当前页面", ask: "支持请求", hint: "（请在此描述问题——你在做什么、看到了什么、期望什么。）" },
};

export function supportMailUrl({ lang = "vi", nickname = "", code = "" } = {}) {
  const c = COPY[lang] || COPY.vi;
  const email = getMemberSession()?.email || "";
  const target = detectInstallTarget();
  const device = `${target.iOS ? "iOS" : target.android ? "Android" : "Desktop"} · ${window.matchMedia?.("(display-mode: standalone)").matches ? "PWA" : "Web"}`;
  const body = [
    `${c.info}:`,
    nickname && `- ${c.nick}: ${nickname}`,
    code && `- ${c.code}: ${code}`,
    email && `- ${c.email}: ${email}`,
    `- ${c.device}: ${device}`,
    `- ${c.page}: ${window.location.pathname}`,
    "",
    `${c.ask}:`,
    c.hint,
    "",
  ].filter((line) => line !== false && line !== "").join("\n").replace(`${c.ask}:`, `\n${c.ask}:`) + "\n";
  const subject = `${c.subject}${code ? ` · ${code}` : ""}`;
  if (target.iOS || target.android) {
    return `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(CONTACT)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
