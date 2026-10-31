import { reportClientEvent } from "../utils/clientMonitoring";

// Mã sự cố người dùng đọc lại được cho hỗ trợ: HG-XXXXXX. Bỏ 0/O/1/I/L để đọc
// qua điện thoại không nhầm. Admin dán mã vào ô tìm của "Giám sát hệ thống".
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function incidentCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `HG-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

/** Gửi sự cố về server (ErrorLog + Telegram admin) và trả mã để hiện cho người dùng. */
export function reportIncident(event) {
  const code = incidentCode();
  try { reportClientEvent({ ...event, code }); } catch { /* báo lỗi không được làm hỏng màn lỗi */ }
  return code;
}
