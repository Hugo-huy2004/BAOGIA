import { checkAvatar } from './avatar.js';
import { checkNickname } from './nickname.js';

export class PersonaError extends Error {
  constructor(code, status) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

/**
 * Client của API Persona (`/api/persona`). Web nào dùng chung tài khoản Hugo Studio
 * (cookie phiên `hugo.*`, hoặc bearer token cho app gốc) đều gọi qua lớp này:
 *
 *   const persona = new PersonaClient({ baseUrl: '/api' });
 *   const me = await persona.get();          // { nickname, avatar, complete }
 *   await persona.save({ nickname, avatar });
 *
 * Kiểm luật ngay ở client để báo lỗi tức thì; máy chủ vẫn kiểm lại, không tin client.
 */
export class PersonaClient {
  constructor({ baseUrl = '/api', token = null, fetchImpl = globalThis.fetch?.bind(globalThis) } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
    this.fetch = fetchImpl;
  }

  async request(method, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const res = await this.fetch(`${this.baseUrl}/persona`, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new PersonaError(data.code || 'SERVICE_DEGRADED', res.status);
    return data;
  }

  get() {
    return this.request('GET');
  }

  /** Lưu một hoặc cả hai phần; phần không gửi thì giữ nguyên. */
  save({ nickname, avatar } = {}) {
    const body = {};
    if (nickname !== undefined) {
      const checked = checkNickname(nickname);
      if (!checked.ok) return Promise.reject(new PersonaError(checked.code, 400));
      body.nickname = checked.value;
    }
    if (avatar !== undefined) {
      const checked = checkAvatar(avatar);
      if (!checked.ok) return Promise.reject(new PersonaError(checked.code, 400));
      body.avatar = checked.value;
    }
    return this.request('PUT', body);
  }
}
