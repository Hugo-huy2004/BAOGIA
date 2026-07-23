/**
 * faceIdPriorityAuth.js
 * Quản lý Đăng Nhập Ưu Tiên Face ID / Touch ID / WebAuthn Biometrics Chuẩn Apple.
 */

import { loginMember, getMemberSession } from "../services/authSession";
import { IndexedDBStorage } from "./indexedDBStorage";

export const FaceIdPriorityAuth = {
  async isBiometricsSupported() {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  },

  /**
   * Kích hoạt xác thực Face ID / Touch ID ưu tiên 0ms
   */
  async authenticateWithFaceId() {
    const supported = await this.isBiometricsSupported();
    if (!supported) return { success: false, reason: "not_supported" };

    try {
      // Gọi trình xác thực Face ID / Touch ID gốc của hệ điều hành Apple / Android
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          rpId: window.location.hostname,
          userVerification: "required",
          timeout: 60000
        }
      });

      if (credential) {
        const storedUser = await IndexedDBStorage.getEncryptedKey("face_id_user_profile");
        if (storedUser) {
          loginMember(storedUser);
          return { success: true, user: storedUser };
        }
      }
    } catch (e) {
      console.warn("Face ID / Touch ID cancel or failed:", e);
      // Fallback về session hiện tại nếu có
      const session = getMemberSession();
      if (session) return { success: true, user: session };
    }

    return { success: false, reason: "cancelled" };
  },

  /**
   * Lưu thông tin Face ID chính chủ sau khi đăng nhập thành công
   */
  async registerFaceIdProfile(userProfile) {
    if (!userProfile) return;
    try {
      await IndexedDBStorage.saveEncryptedKey("face_id_user_profile", userProfile);
    } catch (e) {
      console.warn("Lỗi lưu cấu hình Face ID:", e);
    }
  }
};
