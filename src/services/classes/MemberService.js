import dataApi from '../dataApi';

class MemberService {
  constructor() {
    this.api = dataApi;
  }

  async getMemberBio(email) {
    try {
      const response = await this.api.getMemberBio(email);
      return response.bio;
    } catch (error) {
      console.error('MemberService: Failed to get bio', error);
      throw error;
    }
  }

  async updateBio(bioId, formData) {
    try {
      const response = await this.api.updateMemberBio(bioId, formData);
      return response.bio;
    } catch (error) {
      console.error('MemberService: Failed to update bio', error);
      throw error;
    }
  }

  async createBio(formData) {
    try {
      const response = await this.api.createMemberBio(formData);
      return response.bio;
    } catch (error) {
      console.error('MemberService: Failed to create bio', error);
      throw error;
    }
  }

  async deleteBio(bioId) {
    try {
      await this.api.deleteMemberBio(bioId);
      return true;
    } catch (error) {
      console.error('MemberService: Failed to delete bio', error);
      throw error;
    }
  }
}

export const memberService = new MemberService();
