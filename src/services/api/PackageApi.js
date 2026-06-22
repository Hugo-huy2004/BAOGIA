import { BaseApi } from "./BaseApi";

class PackageApi extends BaseApi {
  async getPackages() {
    return this.get("/packages");
  }

  async createPackage(data) {
    return this.post("/packages", data);
  }

  async deletePackage(packageId) {
    return this.delete(`/packages/${packageId}`);
  }

  async assignToUser(data) {
    return this.post("/packages/user", data);
  }

  async assignToAll(data) {
    return this.post("/packages/assign-all", data);
  }

  async removeUserPackage(data) {
    return this.delete("/packages/user", data);
  }

  async regenerateCode(packageId) {
    return this.post(`/packages/${packageId}/regenerate-code`);
  }
}

export const packageApi = new PackageApi();
