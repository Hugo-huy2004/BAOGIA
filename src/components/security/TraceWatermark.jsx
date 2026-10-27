import { useMemo } from "react";
import { getMemberSession } from "../../services/api/core/authSession";

/**
 * Hình mờ truy vết cho khu thành viên.
 *
 * Trình duyệt không chặn được ảnh chụp bằng phím hệ điều hành hay bằng một
 * chiếc điện thoại khác chĩa vào màn hình — ScreenProtection chỉ chặn được phần
 * trình duyệt nhìn thấy. Hình mờ là lớp còn lại: ảnh nào lọt ra ngoài cũng mang
 * mã của tài khoản đã chụp, nên lần ra được nguồn rò.
 *
 * Mã là băm FNV-1a 32 bit của email (không lộ email người khác nhìn thấy),
 * kèm email đã che bớt để chính chủ nhận ra. Admin đối chiếu mã bằng cách băm
 * email nghi vấn theo cùng công thức (`traceCode` bên dưới).
 */
export function traceCode(email) {
  let hash = 0x811c9dc5;
  for (const char of String(email || "").toLowerCase()) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0").toUpperCase();
}

const maskEmail = (email) => {
  const [name = "", domain = ""] = String(email || "").split("@");
  return `${name.slice(0, 3)}•••@${domain}`;
};

const escapeXml = (text) => text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

export default function TraceWatermark() {
  const email = getMemberSession()?.email;
  const background = useMemo(() => {
    if (!email) return "";
    const label = escapeXml(`${maskEmail(email)} · HS-${traceCode(email)}`);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><text x="0" y="110" transform="rotate(-24 160 90)" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="currentColor">${label}</text></svg>`
      .replace("currentColor", "#888");
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, [email]);

  if (!background) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[2147483000] select-none opacity-[0.045] dark:opacity-[0.06] print:hidden"
      style={{ backgroundImage: background, backgroundRepeat: "repeat" }}
    />
  );
}
