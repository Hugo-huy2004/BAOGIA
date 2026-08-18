/**
 * Hỏi server xem đã tới kỳ kiểm tra thông tin cá nhân chưa.
 *
 * Chỉ hỏi MỘT LẦN mỗi phiên mở app: lịch tính bằng ngày, hỏi lại mỗi phút chỉ
 * tốn request chứ không sớm biết thêm điều gì.
 */
import { useEffect, useState } from "react";
import { getMemberToken } from "../services/authSession.js";

const apiBase = import.meta.env.VITE_API_URL || "/api";

export function useIdentityCheck({ email, enabled = true }) {
  const [challenge, setChallenge] = useState(null);

  useEffect(() => {
    if (!enabled || !email || email.includes("guest") || !getMemberToken()) return;
    let cancelled = false;

    fetch(`${apiBase}/bios/me/identity-check`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.due) setChallenge(data);
      })
      .catch(() => {
        // Không hỏi được thì thôi: sự cố mạng không phải lý do chặn người dùng.
      });

    return () => { cancelled = true; };
  }, [email, enabled]);

  return [challenge, setChallenge];
}
