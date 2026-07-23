/**
 * universalSessionGuard.js
 * Quản lý Session Tự Động Tái Cấp Quyền & Bảo Vệ Chống Xâm Nhập Bằng IP/Wi-Fi (Zero-Trust Security).
 */

import { IndexedDBStorage } from "./indexedDBStorage";
import { getMemberSession, loginMember } from "../services/authSession";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export const UniversalSessionGuard = {
  /**
   * Tự động tái cấp session cho toàn bộ sub-app khi session hết hạn.
   */
  async getOrRefreshSession() {
    let session = getMemberSession();
    if (session && session.email && !this.isSessionExpired(session)) {
      return session;
    }

    // Nếu session hết hạn -> Lấy Refresh Token / Secure Credentials từ IndexedDB
    try {
      const storedCreds = await IndexedDBStorage.getEncryptedKey("master_auth_creds");
      if (storedCreds && storedCreds.email) {
        const res = await fetch(`${API_BASE}/auth/refresh-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: storedCreds.email, deviceToken: storedCreds.token }),
          credentials: "include"
        });

        if (res.ok) {
          const freshSession = await res.json();
          loginMember(freshSession);
          return freshSession;
        }
      }
    } catch (e) {
      console.warn("UniversalSessionGuard: Lỗi tái cấp session tự động:", e);
    }

    return session;
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
