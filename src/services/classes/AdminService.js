import dataApi from '../dataApi';

class AdminService {
  constructor() {
    this.api = dataApi;
  }

  // --- Users & Bios ---
  async getAllBios() {
    try {
      const response = await this.api.getAllBios();
      return response.bios || [];
    } catch (error) {
      console.error('AdminService: Failed to get bios', error);
      throw error;
    }
  }

  async deleteBio(bioId) {
    try {
      const response = await this.api.deleteMemberBio(bioId);
      return response;
    } catch (error) {
      console.error('AdminService: Failed to delete bio', error);
      throw error;
    }
  }

  async generateInviteCode(type) {
    try {
      const response = await this.api.generateInviteCode(type);
      return response;
    } catch (error) {
      console.error('AdminService: Failed to generate invite code', error);
      throw error;
    }
  }

  // --- Partners ---
  async getPartners() {
    try {
      const partners = await this.api.getPartners();
      return partners;
    } catch (error) {
      console.error('AdminService: Failed to get partners', error);
      throw error;
    }
  }

  async addPartner(partnerData) {
    try {
      const response = await this.api.addPartner(partnerData);
      return response;
    } catch (error) {
      console.error('AdminService: Failed to add partner', error);
      throw error;
    }
  }

  async deletePartner(partnerId) {
    try {
      const response = await this.api.deletePartner(partnerId);
      return response;
    } catch (error) {
      console.error('AdminService: Failed to delete partner', error);
      throw error;
    }
  }

  // --- Packages ---
  async getPackages() {
    try {
      const packages = await this.api.getPackages();
      return packages;
    } catch (error) {
      console.error('AdminService: Failed to get packages', error);
      throw error;
    }
  }

  async updatePackage(packageId, data) {
    try {
      const response = await this.api.updatePackage(packageId, data);
      return response;
    } catch (error) {
      console.error('AdminService: Failed to update package', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const adminService = new AdminService();
