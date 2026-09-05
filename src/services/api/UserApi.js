import { BaseApi } from "./BaseApi";

class UserApi extends BaseApi {
  async getBios(params) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/bios?${query}`);
  }

  async getBioByEmail(email) {
    return this.get(`/bios/me?email=${encodeURIComponent(email)}`);
  }

  async updateStatus(bioId, status) {
    return this.patch(`/bios/${bioId}/status`, { status });
  }

  async setVip(bioId, starVip) {
    return this.patch(`/bios/${bioId}/vip`, { starVip });
  }

  async deleteBio(bioId) {
    return this.delete(`/bios/${bioId}`);
  }

  // token rỗng trên web là ĐÚNG: cookie admin httpOnly mang danh tính, và
  // BaseApi luôn gửi credentials:"include". Chỉ bản native (khác origin) mới
  // có token thật. Gửi "Bearer " rỗng là header dị dạng, proxy có thể chặn.
  async adminGetSecuritySentinel(token) {
    return this.get('/admin/security/sentinel-summary', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  async adminResolveSecurityModeration(token, payload) {
    return this.post('/admin/security/resolve-moderation', payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }

  async adminUnblockSecurityActor(token, payload) {
    return this.post('/admin/security/unblock-actor', payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }
}

export const userApi = new UserApi();
