// Passkey (vân tay / Face ID) qua Better Auth. Client auth nạp động: PWAQuickLogin
// nằm trong gói đầu, không được kéo cả thư viện WebAuthn theo.
import { loginMemberWithPasskey } from '../services/api/core/authSession';

const client = async () => (await import('../lib/authClient')).memberAuthClient;

export const webauthnHelper = {
  // Gọi đồng bộ (useState initializer) nên không await được.
  isSupported: () =>
    typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function',

  async registerDevice(_email, deviceName) {
    const { error } = await (await client()).passkey.addPasskey({ name: deviceName });
    if (error) throw Object.assign(new Error(error.message || 'Không thêm được passkey'), { name: error.code === 'ERROR_CEREMONY_ABORTED' ? 'NotAllowedError' : 'Error' });
  },

  // Trả hồ sơ thành viên như bản cũ; phiên đã được lưu trong loginMemberWithPasskey.
  async loginWithBiometric() {
    const { session, error } = await loginMemberWithPasskey();
    if (!session) throw new Error(error);
    return session;
  },

  async listDevices() {
    const { data } = await (await client()).passkey.listUserPasskeys();
    return (data || []).map((p) => ({ _id: p.id, deviceName: p.name || 'Passkey', createdAt: p.createdAt }));
  },

  async removeDevice(id) {
    const { error } = await (await client()).passkey.deletePasskey({ id });
    return !error;
  },

  hasSavedDeviceFlag(email) {
    return localStorage.getItem(`hugo_webauthn_${email}`) === '1';
  },
  markDeviceFlag(email) {
    localStorage.setItem(`hugo_webauthn_${email}`, '1');
  },
};
