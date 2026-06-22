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

  async deleteBio(bioId) {
    return this.delete(`/bios/${bioId}`);
  }
}

export const userApi = new UserApi();
