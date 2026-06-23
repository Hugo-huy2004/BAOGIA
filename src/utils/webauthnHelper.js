import { startRegistration, startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';

const apiBase = import.meta.env.VITE_API_URL || '/api';

async function postJSON(path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.error });
  return data;
}

export const webauthnHelper = {
  isSupported: () => browserSupportsWebAuthn(),

  // Registers the current device's fingerprint/Face ID as a new login method.
  async registerDevice(email, deviceName) {
    const options = await postJSON('/webauthn/register-options', { email });
    const response = await startRegistration(options);
    return postJSON('/webauthn/register-verify', { email, response, deviceName });
  },

  // Returns the member profile to feed into loginMember() on success.
  async loginWithBiometric(email) {
    const options = await postJSON('/webauthn/login-options', { email });
    const response = await startAuthentication(options);
    const result = await postJSON('/webauthn/login-verify', { email, response });
    return result.member;
  },

  async listDevices(email) {
    const res = await fetch(`${apiBase}/webauthn/credentials/${encodeURIComponent(email)}`);
    const data = await res.json().catch(() => ({}));
    return data.credentials || [];
  },

  async removeDevice(id, email) {
    const res = await fetch(`${apiBase}/webauthn/credentials/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  },

  // True if this device already has a saved credential ID for biometric login.
  hasSavedDeviceFlag(email) {
    return localStorage.getItem(`hugo_webauthn_${email}`) === '1';
  },
  markDeviceFlag(email) {
    localStorage.setItem(`hugo_webauthn_${email}`, '1');
  },
};
