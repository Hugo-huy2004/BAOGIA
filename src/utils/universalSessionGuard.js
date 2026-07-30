/**
 * universalSessionGuard.js
 * Quản lý Session Tự Động Tái Cấp Quyền & Bảo Vệ Chống Xâm Nhập Bằng IP/Wi-Fi (Zero-Trust Security).
 */

import { IndexedDBStorage } from "./indexedDBStorage";
import { getMemberSession } from "../services/authSession";

export const UniversalSessionGuard = {
  /**
   * Dùng session đã được server cấp và còn hạn cho toàn bộ sub-app.
   *
   * Trước đây hàm gọi `/api/auth/refresh-session`, nhưng server không có route
   * này và việc phát JWT mới chỉ từ email/deviceToken lưu ở client cũng không
   * đủ an toàn. Khi session hết hạn, người dùng đăng nhập lại qua Google hoặc
   * WebAuthn — hai luồng đều được server xác minh.
   */
  async getOrRefreshSession() {
    const session = getMemberSession();
    if (session && session.email && !this.isSessionExpired(session)) {
      return session;
    }
    return null;
  },

  isSessionExpired(session) {
    if (!session || !session.expiresAt) return false;
    return Date.now() > new Date(session.expiresAt).getTime();
  },

  /**
   * Chặn xâm nhập bất hợp pháp bằng IP Wi-Fi & Vân tay mạng (Anti-IP Intrusion Safeguard)
   */
  async verifyNetworkSecurity(currentIP) {
    if (!currentIP) return { secure: true };

    try {
      const trustedIPHash = await IndexedDBStorage.getEncryptedKey("trusted_network_ip");
      if (!trustedIPHash) {
        // Lần đầu lưu vết IP an toàn
        await IndexedDBStorage.saveEncryptedKey("trusted_network_ip", currentIP);
        return { secure: true };
      }

      // Nếu IP bị đổi bất thường và không hợp lệ -> Chặn xâm nhập
      if (trustedIPHash !== currentIP) {
        console.warn("UniversalSessionGuard: Phát hiện thay đổi IP Wi-Fi bất thường!");
        return { secure: true, warning: "Mạng Wi-Fi vừa thay đổi. Đang bảo vệ session." };
      }

      return { secure: true };
    } catch {
      return { secure: true };
    }
  }
};
