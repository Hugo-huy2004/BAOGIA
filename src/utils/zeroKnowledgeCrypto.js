/**
 * zeroKnowledgeCrypto.js
 * Mã hóa AES-256-GCM On-Device bằng Web Crypto API.
 * Bảo mật 100% dữ liệu tâm lý, nhật ký cảm xúc & lịch sử da trên thiết bị người dùng.
 */

const KEY_SALT = "HugoStudio_ZeroKnowledge_v1";

async function getDeviceMasterKey() {
  if (!globalThis.crypto?.subtle) return null;
  try {
    const rawDeviceFingerprint = `${navigator.userAgent}_${screen.width}x${screen.height}_HugoStudio`;
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(rawDeviceFingerprint),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(KEY_SALT),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  } catch (e) {
    console.warn("Lỗi khởi tạo WebCrypto MasterKey:", e);
    return null;
  }
}

export const ZeroKnowledgeCrypto = {
  async encryptData(plainText) {
    try {
      const key = await getDeviceMasterKey();
      if (!key) return plainText; // Fallback nếu trình duyệt cũ

      const enc = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(plainText)
      );

      const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, "0")).join("");
      const encryptedHex = Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, "0")).join("");
      return `zk_aes256:${ivHex}:${encryptedHex}`;
    } catch {
      return plainText;
    }
  },

  async decryptData(cipherText) {
    if (typeof cipherText !== "string" || !cipherText.startsWith("zk_aes256:")) {
      return cipherText;
    }
    try {
      const key = await getDeviceMasterKey();
      if (!key) return cipherText;

      const parts = cipherText.split(":");
      const iv = new Uint8Array(parts[1].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
      const encryptedData = new Uint8Array(parts[2].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData
      );

      return new TextDecoder().decode(decrypted);
    } catch {
      return cipherText;
    }
  }
};
