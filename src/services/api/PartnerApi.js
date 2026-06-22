import { BaseApi } from "./BaseApi";

class PartnerApi extends BaseApi {
  async getPartners() {
    return this.get("/partners");
  }

  async createPartner(data) {
    return this.post("/partners", data);
  }

  async deletePartner(partnerId) {
    return this.delete(`/partners/${partnerId}`);
  }
}

export const partnerApi = new PartnerApi();
